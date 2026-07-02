-- Read-path indexes for: list conversations, fetch messages (turns), refine thread.
-- Indexes add write cost, so this set is intentionally minimal and targeted.
--
-- Write impact per index (inserts): Conversation (rare), MessageGroup (per turn),
-- Message (per question + per option). We keep 2 indexes max per hot table.

BEGIN;

-- Supersede the coarse indexes created in 0000 with better-shaped ones.
DROP INDEX IF EXISTS "Message_conversation_id_idx";          -- replaced by (conversation_id, created_at)
DROP INDEX IF EXISTS "MessageGroup_conversation_parent_idx"; -- replaced by the partial top-level index

-- List a user's conversations, newest first.
CREATE INDEX IF NOT EXISTS "Conversation_user_created_idx"
  ON "Conversation" ("user_id", "created_at");

-- Top-level turns of a conversation, in order. Partial: only rows with no
-- parent (real turns), so refinement rows don't bloat it or slow their writes.
CREATE INDEX IF NOT EXISTS "MessageGroup_toplevel_idx"
  ON "MessageGroup" ("conversation_id", "created_at")
  WHERE "parent_message_id" IS NULL;

-- Refinement thread: find the children turns of a given response.
CREATE INDEX IF NOT EXISTS "MessageGroup_parent_message_id_idx"
  ON "MessageGroup" ("parent_message_id");

-- Recent-context window (order by created_at desc limit 10) + conversation scans.
CREATE INDEX IF NOT EXISTS "Message_conversation_created_idx"
  ON "Message" ("conversation_id", "created_at");

-- Load all messages of a turn (buildTurns) + the thread recursion join.
-- (Created in 0000; kept as-is.)
CREATE INDEX IF NOT EXISTS "Message_message_group_id_idx"
  ON "Message" ("message_group_id");

COMMIT;
