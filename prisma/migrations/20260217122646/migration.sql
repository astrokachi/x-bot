/*
  Warnings:

  - The values [POSTED,FAILED] on the enum `TweetStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image_key` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `posted_at` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_at` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `x_tweet_id` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AutoReplySettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommentFilter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KeywordAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KeywordMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PendingAutoReply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduledTweet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dateScheduled` to the `Tweet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterEnum
BEGIN;
CREATE TYPE "TweetStatus_new" AS ENUM ('DRAFT', 'SENT', 'SCHEDULED');
ALTER TABLE "public"."Tweet" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tweet" ALTER COLUMN "status" TYPE "TweetStatus_new" USING ("status"::text::"TweetStatus_new");
ALTER TYPE "TweetStatus" RENAME TO "TweetStatus_old";
ALTER TYPE "TweetStatus_new" RENAME TO "TweetStatus";
DROP TYPE "public"."TweetStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AnalyticsEvent" DROP CONSTRAINT "AnalyticsEvent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AutoReplySettings" DROP CONSTRAINT "AutoReplySettings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "CommentFilter" DROP CONSTRAINT "CommentFilter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "KeywordAlert" DROP CONSTRAINT "KeywordAlert_user_id_fkey";

-- DropForeignKey
ALTER TABLE "KeywordMatch" DROP CONSTRAINT "KeywordMatch_keyword_alert_id_fkey";

-- DropForeignKey
ALTER TABLE "PendingAutoReply" DROP CONSTRAINT "PendingAutoReply_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledTweet" DROP CONSTRAINT "ScheduledTweet_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Tweet" DROP CONSTRAINT "Tweet_user_id_fkey";

-- DropIndex
DROP INDEX "Tweet_status_idx";

-- DropIndex
DROP INDEX "Tweet_user_id_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "image_key",
DROP COLUMN "posted_at",
DROP COLUMN "scheduled_at",
DROP COLUMN "user_id",
DROP COLUMN "x_tweet_id",
ADD COLUMN     "dateScheduled" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "img" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "AnalyticsEvent";

-- DropTable
DROP TABLE "AutoReplySettings";

-- DropTable
DROP TABLE "CommentFilter";

-- DropTable
DROP TABLE "KeywordAlert";

-- DropTable
DROP TABLE "KeywordMatch";

-- DropTable
DROP TABLE "PendingAutoReply";

-- DropTable
DROP TABLE "Reply";

-- DropTable
DROP TABLE "ScheduledTweet";

-- DropEnum
DROP TYPE "AutoReplyStatus";

-- DropEnum
DROP TYPE "SentimentType";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "last_chat_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summary_last_chat_id_key" ON "Summary"("last_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_conversation_id_key" ON "Summary"("conversation_id");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_last_chat_id_fkey" FOREIGN KEY ("last_chat_id") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
