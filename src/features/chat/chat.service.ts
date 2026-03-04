import { prisma } from '../../shared/lib/prisma.js';
import { NotFoundError } from '../../shared/lib/errors.js';
import { AIService } from '../../shared/services/ai.service.js';
import { SocketService } from '../../shared/services/socket.service.js';

const aiService = new AIService();

export async function createConversationWithMessage(userId: string, content: string, title?: string) {
  const conversation = await prisma.conversation.create({
    data: {
      user_id: userId,
      title: title || 'New Conversation',
      messages: {
        create: {
          role: 'User',
          content,
          created_at: new Date(),
        },
      },
    },
    include: {
      messages: true,
    },
  });

  // Kick off the AI reply in the background — client gets it over websocket
  generateAndBroadcastReply(
    conversation.id,
    [{ role: 'user' as const, content }],
    content
  );

  return conversation;
}

export async function addMessageToConversation(
  conversationId: string,
  userId: string,
  content: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      user_id: userId,
    },
    include: {
      messages: {
        orderBy: { created_at: 'desc' },
        take: 10,
      },
    },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }


  const message = await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role: 'User',
      content,
      created_at: new Date(),
    },
  });

  // Grab the latest 10 messages for short-term memory context
  const recentMessages = conversation.messages
    .reverse() // Sort back to chronological (oldest first)
    .map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));
  recentMessages.push({ role: 'user', content });

  // Kick off the AI reply in the background — client gets it over websocket
  generateAndBroadcastReply(conversationId, recentMessages, content);

  return message;
}

/**
 * Runs async after the HTTP response — gets the AI reply and pushes
 * it to the conversation room over websocket. Errors go to the client
 * as a socket event so nothing gets silently swallowed.
 */
async function generateAndBroadcastReply(
  conversationId: string,
  recentMessages: { role: 'user' | 'assistant'; content: string }[],
  currentUserMessage: string
) {
  const socketService = SocketService.getInstance();

  // Show the typing indicator while we wait for the LLM
  socketService.emitToConversation(conversationId, 'message:typing', {
    conversationId,
  });

  try {

    const aiResponseContent = await aiService.generateChatResponse(
      conversationId,
      recentMessages,
      currentUserMessage
    );


    const assistantMessage = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        role: 'ASSISTANT',
        content: aiResponseContent,
        created_at: new Date(),
      },
    });


    socketService.emitToConversation(
      conversationId,
      'message:received',
      assistantMessage
    );

    // Persist embeddings for future RAG lookups (non-blocking)
    aiService
      .storeMemory(conversationId, currentUserMessage, 'chat', 'user_message')
      .catch((err) => console.error('Failed to store user memory:', err));

    aiService
      .storeMemory(conversationId, aiResponseContent, 'chat', 'assistant_message')
      .catch((err) => console.error('Failed to store assistant memory:', err));
  } catch (err) {
    console.error(
      `AI generation failed for conversation ${conversationId}:`,
      err
    );

    socketService.emitToConversation(conversationId, 'message:error', {
      conversationId,
      error: 'Failed to generate AI response. Please try again.',
    });
  }
}

export async function getMessagesByConversation(
  conversationId: string,
  userId: string,
  cursor?: string,
  take: number = 50
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  const messages = await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: 'asc' },
    take: take + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasNextPage = messages.length > take;
  if (hasNextPage) {
    messages.pop();
  }

  const nextCursor = hasNextPage ? messages[messages.length - 1].id : null;

  return {
    messages,
    nextCursor,
    hasNextPage,
  };
}
