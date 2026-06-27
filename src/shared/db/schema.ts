import { pgTable, text, timestamp, pgEnum, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// --- ENUMS ---
export const tweetStatusEnum = pgEnum('TweetStatus', ['DRAFT', 'SENT', 'SCHEDULED']);
export const chatTypeEnum = pgEnum('ChatType', ['SINGLE', 'MULTIPLE']);
export const scheduledTweetStatusEnum = pgEnum('ScheduledTweetStatus', ['PENDING', 'POSTED', 'FAILED']);
export const roleEnum = pgEnum('Role', ['User', 'ASSISTANT']);

// --- CUSTOM TYPES ---
// For vector extension in Postgres
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// --- TABLES ---

export const users = pgTable('User', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  email: text('email').unique().notNull(),
  username: text('username').notNull(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const requestUsersRelations = relations(users, ({ one }) => ({
  xAccount: one(xAccounts),
}));

export const xAccounts = pgTable('XAccount', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { mode: 'date' }),
  connectedAt: timestamp('connected_at', { mode: 'date' }).defaultNow().notNull(),
});

export const tweets = pgTable('Tweet', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  content: text('content').notNull(),
  status: tweetStatusEnum('status').notNull(),
  dateScheduled: timestamp('dateScheduled', { mode: 'date' }).notNull(),
  img: text('img'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const conversations = pgTable('Conversation', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  title: text('title').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messageGroups: many(messageGroups),
  memories: many(memories),
}));

export const messageGroups = pgTable('MessageGroup', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
});

export const messageGroupsRelations = relations(messageGroups, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messageGroups.conversationId],
    references: [conversations.id],
  }),
  messages: many(messages),
}));


export const messages = pgTable('Message', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  messageGroupId: text('message_group_id')
    .notNull()
    .references(() => messageGroups.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
  content: text('content').notNull(),
  type: chatTypeEnum('type').default('SINGLE').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  parentId: text('parent_id'),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  messageGroup: one(messageGroups, {
    fields: [messages.messageGroupId],
    references: [messageGroups.id],
  }),
}));


export const memories = pgTable('Memory', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id),
  category: text('category').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }).defaultNow().notNull(),
});

export const memoriesRelations = relations(memories, ({ one }) => ({
  conversation: one(conversations, {
    fields: [memories.conversationId],
    references: [conversations.id],
  }),
}));
