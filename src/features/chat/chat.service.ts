import { prisma } from '../../shared/lib/prisma.js';
import { NotFoundError } from '../../shared/lib/errors.js';
import { chatQueue } from './chat.queue.js';

// Removed aiService as we now use the BullMQ queue for AI results.

export async function createConversationWithMessage(userId: string, content: string, type: 'SINGLE' | 'MULTIPLE' = 'SINGLE', title?: string) {
  const conversation = await prisma.conversation.create({
    data: {
      user_id: userId,
      title: title || 'New Conversation',
      messages: {
        create: {
          role: 'User',
          content,
          type,
          created_at: new Date(),
        },
      },
    },
    include: {
      messages: true,
    },
  });

  // Kick off the AI reply via BullMQ
  await chatQueue.add(`chat:${conversation.id}`, {
    conversationId: conversation.id,
    recentMessages: [{ role: 'user' as const, content }],
    currentUserMessage: content,
    type,
  });

  return conversation;
}

export async function addMessageToConversation(
  conversationId: string,
  userId: string,
  content: string,
  type: 'SINGLE' | 'MULTIPLE' = 'SINGLE'
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
      type,
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

  // Kick off the AI reply via BullMQ
  await chatQueue.add(`chat:${conversationId}`, {
    conversationId,
    recentMessages,
    currentUserMessage: content,
    type,
  });

  return message;
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
