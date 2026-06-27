import { eq, desc, asc, and } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { conversations, messageGroups, messages } from '../../shared/db/schema.js';
import { NotFoundError } from '../../shared/lib/errors.js';
import { chatQueue } from './chat.queue.js';

export async function createConversationWithMessage(userId: string, content: string, type: 'SINGLE' | 'MULTIPLE' = 'SINGLE') {
  const [conversation] = await db.insert(conversations).values({
    user_id: userId,
    title: 'New Conversation',
  }).returning();

  const [messageGroup] = await db.insert(messageGroups).values({
    conversation_id: conversation.id,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning();

  const [message] = await db.insert(messages).values({
    message_group_id: messageGroup.id,
    role: 'User',
    content,
    type,
    created_at: new Date(),
  }).returning();

  await chatQueue.add(`chat:${conversation.id}`, {
    conversationId: conversation.id,
    recentMessages: [{ role: 'user' as const, content }],
    currentUserMessage: content,
    type,
  });

  return { ...conversation, messages: [message] };
}

export async function addMessageToConversation(
  conversationId: string,
  userId: string,
  content: string,
  type: 'SINGLE' | 'MULTIPLE' = 'SINGLE'
) {
  const [conversation] = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.user_id, userId)));

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  let [messageGroup] = await db.select().from(messageGroups).where(eq(messageGroups.conversation_id, conversationId)).orderBy(desc(messageGroups.created_at)).limit(1);

  if (!messageGroup) {
      [messageGroup] = await db.insert(messageGroups).values({
        conversation_id: conversationId,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();
  }

  const [message] = await db.insert(messages).values({
    message_group_id: messageGroup.id,
    role: 'User',
    content,
    type,
    created_at: new Date(),
  }).returning();

  const recentMessagesQuery = await db.select({
      role: messages.role,
      content: messages.content
    }).from(messages)
    .where(eq(messages.message_group_id, messageGroup.id))
    .orderBy(desc(messages.created_at))
    .limit(10);
    
  const recentMessages = recentMessagesQuery
    .reverse()
    .map((m: { role: string | null; content: string }) => ({
      role: (m.role?.toLowerCase() || 'user') as 'user' | 'assistant',
      content: m.content,
    }));
  
  if (!recentMessages.find((rm: { role: string; content: string }) => rm.content === content)) {
    recentMessages.push({ role: 'user', content });
  }

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
  const [conversation] = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.user_id, userId)));

  if (!conversation) {
    throw new NotFoundError('Conversation not found');
  }

  let fetchedMessages = await db.select({
      id: messages.id,
      message_group_id: messages.message_group_id,
      role: messages.role,
      content: messages.content,
      type: messages.type,
      created_at: messages.created_at,
      parent_id: messages.parent_id
  }).from(messages)
    .innerJoin(messageGroups, eq(messages.message_group_id, messageGroups.id))
    .where(eq(messageGroups.conversation_id, conversationId))
    .orderBy(asc(messages.created_at));

  if (cursor) {
    const cursorIndex = fetchedMessages.findIndex((m: { id: string }) => m.id === cursor);
    if (cursorIndex !== -1) {
      fetchedMessages = fetchedMessages.slice(cursorIndex + 1);
    }
  }

  const resultMessages = fetchedMessages.slice(0, take + 1);
  const hasNextPage = resultMessages.length > take;
  if (hasNextPage) {
    resultMessages.pop();
  }
  const nextCursor = hasNextPage ? resultMessages[resultMessages.length - 1].id : null;

  return {
    data: resultMessages,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}
