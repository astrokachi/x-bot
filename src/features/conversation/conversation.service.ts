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

export async function getConversations(
  userId: string,
  cursor?: string,
  take: number = 20
) {
  const conversations = await prisma.conversation.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: take + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasNextPage = conversations.length > take;
  if (hasNextPage) {
    conversations.pop();
  }

  const nextCursor = hasNextPage ? conversations[conversations.length - 1].id : null;

  return {
    data: conversations,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
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
