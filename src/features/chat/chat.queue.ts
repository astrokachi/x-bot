import { Queue, Worker } from "bullmq";
import { db } from "../../shared/db/index.js";
import { messageGroups, messages } from "../../shared/db/schema.js";
import { AIService } from "../../shared/services/ai.service.js";
import { SocketService } from "../../shared/services/socket.service.js";
import { ChatJobData, ChatJobResult } from "./chat.types.js";

const aiService = new AIService();

export const chatQueue = new Queue<ChatJobData, ChatJobResult>(
  "chat-response",
  {
    connection: {
      url: process.env.REDIS_URL,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
    },
  },
);

export const worker = new Worker<ChatJobData, ChatJobResult>(
  "chat-response",
  async (job) => {
    const {
      operation,
      conversationId,
      recentMessages,
      currentUserMessage,
      type,
      parentId,
    } = job.data;
    const socketService = SocketService.getInstance();

    console.log(
      `Processing chat job: ${job.id} (${operation}) for conversation: ${conversationId}`,
    );

    socketService.emitToConversation(conversationId, "message:typing", {
      conversationId,
    });

    try {
      const aiResponseContent = await aiService.generateChatResponse(
        conversationId,
        recentMessages,
        currentUserMessage,
        undefined,
        type,
      );

      const responseOptions = aiResponseContent
        .split("---OPTION_SEPARATOR---")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      if (operation === "refine") {
        await Promise.all(
          responseOptions.map(async (contentOption) => {
            const [assistantMessage] = await db
              .insert(messages)
              .values({
                role: "ASSISTANT",
                content: contentOption,
                type,
                parent_id: parentId,
                created_at: new Date(),
              })
              .returning();

            socketService.emitToConversation(
              conversationId,
              "message:refined",
              { parentId, message: assistantMessage },
            );

            aiService
              .storeMemory(
                conversationId,
                contentOption,
                "chat",
                "assistant_message",
              )
              .catch((err) =>
                console.error("Failed to store assistant memory:", err),
              );

            return assistantMessage;
          }),
        );

        aiService
          .storeMemory(
            conversationId,
            currentUserMessage,
            "chat",
            "user_message",
          )
          .catch((err) => console.error("Failed to store user memory:", err));

        return {
          success: true,
          conversationId,
          parentId,
        };
      }

      const [messageGroup] = await db
        .insert(messageGroups)
        .values({
          conversation_id: conversationId,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      await Promise.all(
        responseOptions.map(async (contentOption) => {
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              message_group_id: messageGroup.id,
              role: "ASSISTANT",
              content: contentOption,
              type,
              created_at: new Date(),
            })
            .returning();

          socketService.emitToConversation(
            conversationId,
            "message:received",
            assistantMessage,
          );

          aiService
            .storeMemory(
              conversationId,
              contentOption,
              "chat",
              "assistant_message",
            )
            .catch((err) =>
              console.error("Failed to store assistant memory:", err),
            );

          return assistantMessage;
        }),
      );

      aiService
        .storeMemory(conversationId, currentUserMessage, "chat", "user_message")
        .catch((err) => console.error("Failed to store user memory:", err));

      return {
        success: true,
        conversationId,
        messageGroupId: messageGroup.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Chat job ${job.id} failed: ${errorMessage}`);

      socketService.emitToConversation(conversationId, "message:error", {
        conversationId,
        error: "Failed to generate AI response. Please try again.",
      });

      throw error;
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
    concurrency: 5,
  },
);
