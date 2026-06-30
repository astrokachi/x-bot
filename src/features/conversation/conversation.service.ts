import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { conversations, messages } from '../../shared/db/schema.js';
import { NotFoundError } from '../../shared/lib/errors.js';

export async function createConversation(userId: string, title: string) {
  const [conversation] = await db.insert(conversations).values({
    user_id: userId,
    title,
  }).returning();
  return conversation;
}

export async function getConversations(
  userId: string,
  cursor?: string,
  take: number = 20
) {
  let allConversations = await db.query.conversations.findMany({
    where: eq(conversations.user_id, userId),
    orderBy: [desc(conversations.created_at)],
  });

  if (cursor) {
    const cursorIndex = allConversations.findIndex((c: { id: string }) => c.id === cursor);
    if (cursorIndex !== -1) {
      allConversations = allConversations.slice(cursorIndex + 1);
    }
  }

  const resultConversations = allConversations.slice(0, take + 1);
  const hasNextPage = resultConversations.length > take;
  
  if (hasNextPage) {
    resultConversations.pop();
  }

  const nextCursor = hasNextPage ? resultConversations[resultConversations.length - 1].id : null;

  return {
    data: resultConversations,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}

export async function getConversationById(conversationId: string, userId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, conversationId), eq(conversations.user_id, userId)),
    with: {
      message_groups: {
        with: {
          messages: {
            orderBy: [asc(messages.created_at)]
          }
        }
      }
    }
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
  const [conversation] = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.user_id, userId)));

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  const [updatedConversation] = await db.update(conversations)
    .set({ title: data.title })
    .where(eq(conversations.id, conversationId))
    .returning();

  return updatedConversation;
}

export async function deleteConversation(conversationId: string, userId: string) {
  const [conversation] = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.user_id, userId)));

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  await db.delete(conversations)
    .where(eq(conversations.id, conversationId));

  return { success: true };
}
