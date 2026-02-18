import { prisma } from '../../shared/lib/prisma.js';
import { NotFoundError } from '../../shared/lib/errors.js';

export async function createConversation(userId: string, title: string) {
  const conversation = await prisma.conversation.create({
    data: {
      user_id: userId,
      title,
    },
  });
  return conversation;
}

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return conversations;
}

export async function getConversationById(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      user_id: userId,
    },
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  return conversation;
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  data: { title: string }
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

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: data.title },
  });

  return updatedConversation;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return { success: true };
}
