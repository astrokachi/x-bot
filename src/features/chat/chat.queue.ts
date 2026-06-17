import { Queue, Worker } from "bullmq";
import { prisma } from "../../shared/lib/prisma.js";
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

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          conversation_id: conversationId,
          role: "ASSISTANT",
          content: aiResponseContent,
          type,
          created_at: new Date(),
        },
      });

      // Broadcast message to clients
      socketService.emitToConversation(
        conversationId,
        "message:received",
        assistantMessage
      );

      // Store memory asynchronously
      aiService
        .storeMemory(conversationId, currentUserMessage, "chat", "user_message")
        .catch((err) => console.error("Failed to store user memory:", err));

      aiService
        .storeMemory(conversationId, aiResponseContent, "chat", "assistant_message")
        .catch((err) => console.error("Failed to store assistant memory:", err));

      return {
        success: true,
        conversationId,
        messageId: assistantMessage.id,
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
    concurrency: 5, // Process up to 5 chat responses concurrently
  }
);
