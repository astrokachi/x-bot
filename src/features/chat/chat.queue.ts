import { Queue, Worker } from "bullmq";
import { eq, desc } from "drizzle-orm";
import { db } from "../../shared/db/index.js";
import { messageGroups, messages } from "../../shared/db/schema.js";
import { AIService } from "../../shared/services/ai.service.js";
import { SocketService } from "../../shared/services/socket.service.js";
import { ChatJobData, ChatJobResult } from "./chat.types.js";

const aiService = new AIService();

export const chatQueue = new Queue<ChatJobData, ChatJobResult>("chat-response", {
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
});

export const worker = new Worker<ChatJobData, ChatJobResult>(
  "chat-response",
  async (job) => {
    const { conversationId, recentMessages, currentUserMessage, type } = job.data;
    const socketService = SocketService.getInstance();

    console.log(`Processing chat job: ${job.id} for conversation: ${conversationId}`);

    // Emit typing indicator
    socketService.emitToConversation(conversationId, "message:typing", {
      conversationId,
    });

    try {
      // Generate AI response
      const aiResponseContent = await aiService.generateChatResponse(
        conversationId,
        recentMessages,
        currentUserMessage,
        undefined, // customInstructions
        type
      );

      let [messageGroup] = await db.select().from(messageGroups).where(eq(messageGroups.conversationId, conversationId)).orderBy(desc(messageGroups.createdAt)).limit(1);

      if (!messageGroup) {
          [messageGroup] = await db.insert(messageGroups).values({
            conversationId,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();
      }

      const responseOptions = aiResponseContent
        .split('---OPTION_SEPARATOR---')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      const savedMessages = await Promise.all(
        responseOptions.map(async (contentOption) => {
          // Save assistant message
          const [assistantMessage] = await db.insert(messages).values({
            messageGroupId: messageGroup.id,
            role: "ASSISTANT",
            content: contentOption,
            type,
            createdAt: new Date(),
          }).returning();

          // Broadcast message to clients
          socketService.emitToConversation(
            conversationId,
            "message:received",
            assistantMessage
          );

          // Store memory for assistant asynchronously
          aiService
            .storeMemory(conversationId, contentOption, "chat", "assistant_message")
            .catch((err) => console.error("Failed to store assistant memory:", err));

          return assistantMessage;
        })
      );

      // Store memory for user asynchronously
      aiService
        .storeMemory(conversationId, currentUserMessage, "chat", "user_message")
        .catch((err) => console.error("Failed to store user memory:", err));

      return {
        success: true,
        conversationId,
        messageGroupId: messageGroup.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Chat job ${job.id} failed: ${errorMessage}`);

      socketService.emitToConversation(conversationId, "message:error", {
        conversationId,
        error: "Failed to generate AI response. Please try again.",
      });

      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
    concurrency: 5,
  }
);
