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
