-- Turn-based messages migration
-- Moves conversation membership onto Message directly and adds refinement
-- lineage onto MessageGroup (a "turn"). Retires the message-level parent_id.
--
-- NOTE: steps 3 and 6 are DESTRUCTIVE. Back up first if the data matters.

BEGIN;

-- 1. Direct conversation membership on Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "conversation_id" text;

-- 2. Backfill conversation_id from each message's group
UPDATE "Message" m
SET "conversation_id" = mg."conversation_id"
FROM "MessageGroup" mg
WHERE m."message_group_id" = mg."id"
  AND m."conversation_id" IS NULL;

-- 3. DESTRUCTIVE: drop legacy group-less messages (old refine rows that were
--    never reachable via the list) so conversation_id can be NOT NULL.
DELETE FROM "Message" WHERE "conversation_id" IS NULL;

-- 4. Enforce NOT NULL + FK
ALTER TABLE "Message" ALTER COLUMN "conversation_id" SET NOT NULL;
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversation_id_Conversation_id_fk"
  FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE;

-- 5. Refinement lineage on the turn (MessageGroup)
ALTER TABLE "MessageGroup" ADD COLUMN IF NOT EXISTS "parent_message_id" text;
ALTER TABLE "MessageGroup"
  ADD CONSTRAINT "MessageGroup_parent_message_id_Message_id_fk"
  FOREIGN KEY ("parent_message_id") REFERENCES "Message"("id") ON DELETE CASCADE;

-- 6. DESTRUCTIVE: retire the message-level tree column
ALTER TABLE "Message" DROP COLUMN IF EXISTS "parent_id";

-- 7. Helpful indexes for the new access paths
CREATE INDEX IF NOT EXISTS "Message_conversation_id_idx"
  ON "Message" ("conversation_id");
CREATE INDEX IF NOT EXISTS "Message_message_group_id_idx"
  ON "Message" ("message_group_id");
CREATE INDEX IF NOT EXISTS "MessageGroup_conversation_parent_idx"
  ON "MessageGroup" ("conversation_id", "parent_message_id");

COMMIT;
