import { prisma } from '../../shared/lib/prisma.js';
import { NotFoundError } from '../../shared/lib/errors.js';

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
    take: take + 1, // fetch one extra to determine if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // skip the cursor itself
    }),
  });

  const hasNextPage = messages.length > take;
  if (hasNextPage) {
    messages.pop(); // remove the extra item
  }

  const nextCursor = hasNextPage ? messages[messages.length - 1].id : null;

  return {
    messages,
    nextCursor,
    hasNextPage,
  };
}
