import { pgTable, text, timestamp, pgEnum, customType, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// --- ENUMS ---
export const tweetStatusEnum = pgEnum('TweetStatus', ['DRAFT', 'SENT', 'SCHEDULED']);
export const chatTypeEnum = pgEnum('ChatType', ['SINGLE', 'MULTIPLE']);
export const scheduledTweetStatusEnum = pgEnum('ScheduledTweetStatus', ['PENDING', 'POSTED', 'FAILED']);
export const roleEnum = pgEnum('Role', ['user', 'assistant']);

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
  password_hash: text('password_hash'),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export const requestUsersRelations = relations(users, ({ one }) => ({
  x_account: one(xAccounts),
}));

export const xAccounts = pgTable('XAccount', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  user_id: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token'),
  token_expires_at: timestamp('token_expires_at', { mode: 'date' }),
  connected_at: timestamp('connected_at', { mode: 'date' }).defaultNow().notNull(),
});

export const tweets = pgTable('Tweet', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  content: text('content').notNull(),
  status: tweetStatusEnum('status').notNull(),
  dateScheduled: timestamp('dateScheduled', { mode: 'date' }).notNull(),
  img: text('img'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const conversations = pgTable('Conversation', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  title: text('title').notNull(),
  user_id: text('user_id').notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  message_groups: many(messageGroups),
  messages: many(messages),
  memories: many(memories),
}));

// A MessageGroup is one "turn": it bundles a question (user message) with its
// response variants (assistant messages). `parent_message_id` points at the
// assistant response this turn refines (null for a top-level turn), forming a
// downward refinement tree.
export const messageGroups = pgTable('MessageGroup', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  conversation_id: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  parent_message_id: text('parent_message_id')
    .references((): AnyPgColumn => messages.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { mode: 'date' }).notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).notNull(),
});

export const messageGroupsRelations = relations(messageGroups, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messageGroups.conversation_id],
    references: [conversations.id],
  }),
  parent_message: one(messages, {
    fields: [messageGroups.parent_message_id],
    references: [messages.id],
    relationName: "turn_refinement",
  }),
  messages: many(messages),
}));


export const messages = pgTable('Message', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  conversation_id: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  message_group_id: text('message_group_id')
    .references((): AnyPgColumn => messageGroups.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
  content: text('content').notNull(),
  type: chatTypeEnum('type').default('SINGLE').notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
  message_group: one(messageGroups, {
    fields: [messages.message_group_id],
    references: [messageGroups.id],
  }),
}));


export const memories = pgTable('Memory', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  conversation_id: text('conversation_id')
    .notNull()
    .references(() => conversations.id),
  category: text('category').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  embedding: vector('embedding'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'date' }).defaultNow().notNull(),
});

export const memoriesRelations = relations(memories, ({ one }) => ({
  conversation: one(conversations, {
    fields: [memories.conversation_id],
    references: [conversations.id],
  }),
}));
