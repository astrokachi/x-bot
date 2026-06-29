import { eq, desc, asc, and, sql } from "drizzle-orm";
import { db } from "../../shared/db/index.js";
import {
  conversations,
  messageGroups,
  messages,
} from "../../shared/db/schema.js";
import { NotFoundError } from "../../shared/lib/errors.js";
import { chatQueue } from "./chat.queue.js";

export async function createConversationWithMessage(
  userId: string,
  content: string,
  type: "SINGLE" | "MULTIPLE" = "SINGLE",
) {
  const [conversation] = await db
    .insert(conversations)
    .values({
      user_id: userId,
      title: "New Conversation",
    })
    .returning();

  const [messageGroup] = await db
    .insert(messageGroups)
    .values({
      conversation_id: conversation.id,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();

  const [message] = await db
    .insert(messages)
    .values({
      message_group_id: messageGroup.id,
      role: "User",
      content,
      type,
      created_at: new Date(),
    })
    .returning();

  await chatQueue.add(`chat:${conversation.id}`, {
    operation: "addMessage",
    conversationId: conversation.id,
    recentMessages: [{ role: "User" as const, content }],
    currentUserMessage: content,
    type,
  });

  return { data: { ...conversation, messages: [message] } };
}

export async function addMessageToConversation(
  conversationId: string,
  userId: string,
  content: string,
  type: "SINGLE" | "MULTIPLE" = "SINGLE",
) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.user_id, userId),
      ),
    );

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  let [messageGroup] = await db
    .select()
    .from(messageGroups)
    .where(eq(messageGroups.conversation_id, conversationId))
    .orderBy(desc(messageGroups.created_at))
    .limit(1);

  if (!messageGroup) {
    [messageGroup] = await db
      .insert(messageGroups)
      .values({
        conversation_id: conversationId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
  }

  const [message] = await db
    .insert(messages)
    .values({
      message_group_id: messageGroup.id,
      role: "User",
      content,
      type,
      created_at: new Date(),
    })
    .returning();

  const recentMessagesQuery = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.message_group_id, messageGroup.id))
    .orderBy(desc(messages.created_at))
    .limit(10);

  const recentMessages = recentMessagesQuery.reverse();

  if (
    !recentMessages.find(
      (rm: { role: string; content: string }) => rm.content === content,
    )
  ) {
    recentMessages.push({ role: "User", content });
  }

  await chatQueue.add(`chat:${conversationId}`, {
    operation: "addMessage",
    conversationId,
    recentMessages,
    currentUserMessage: content,
    type,
  });

  return {
    data: message,
  };
}

export async function getMessagesByConversation(
  conversationId: string,
  userId: string,
  cursor?: string,
  take: number = 50,
) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.user_id, userId),
      ),
    );

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  let fetchedMessages = await db
    .select({
      id: messages.id,
      message_group_id: messages.message_group_id,
      role: messages.role,
      content: messages.content,
      type: messages.type,
      created_at: messages.created_at,
      parent_id: messages.parent_id,
    })
    .from(messages)
    .innerJoin(messageGroups, eq(messages.message_group_id, messageGroups.id))
    .where(eq(messageGroups.conversation_id, conversationId))
    .orderBy(asc(messages.created_at));

  if (cursor) {
    const cursorIndex = fetchedMessages.findIndex(
      (m: { id: string }) => m.id === cursor,
    );
    if (cursorIndex !== -1) {
      fetchedMessages = fetchedMessages.slice(cursorIndex + 1);
    }
  }

  const resultMessages = fetchedMessages.slice(0, take + 1);
  const hasNextPage = resultMessages.length > take;
  if (hasNextPage) {
    resultMessages.pop();
  }
  const nextCursor = hasNextPage
    ? resultMessages[resultMessages.length - 1].id
    : null;

  return {
    data: resultMessages,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}

export async function refineMessage(
  conversationId: string,
  messageId: string,
  userId: string,
  newContent?: string,
) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.user_id, userId),
      ),
    );

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const [message] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.role, "ASSISTANT")));

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  const currentUserContent = newContent ?? "";

  const [refinedMessage] = await db
    .insert(messages)
    .values({
      message_group_id: message.message_group_id,
      role: "User",
      content: currentUserContent,
      type: message.type,
      parent_id: message.id,
      created_at: new Date(),
    })
    .returning();

  const recentMessages = [message];

  await chatQueue.add(`refine:${conversationId}:${messageId}`, {
    operation: "refine",
    conversationId,
    parentId: messageId,
    recentMessages,
    currentUserMessage: currentUserContent,
    type: "SINGLE",
  });

  return { data: refinedMessage };
}

export async function getMessageTree(messageId: string) {
  const result = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      -- base case: the parent
      SELECT * FROM "Message"
      WHERE id = ${messageId}

      UNION ALL

      -- recursive case: children of current level
      SELECT m.* FROM "Message" m
      INNER JOIN descendants d ON m.parent_id = d.id
    )
    SELECT * FROM descendants WHERE role = 'ASSISTANT';
  `);

  return {
    data: result.rows,
    pagination: null,
  };
}
