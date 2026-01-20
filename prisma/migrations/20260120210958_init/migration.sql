-- CreateEnum
CREATE TYPE "TweetStatus" AS ENUM ('DRAFT', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScheduledTweetStatus" AS ENUM ('PENDING', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "SentimentType" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "AutoReplyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'POSTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XAccount" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "x_username" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "TweetStatus" NOT NULL DEFAULT 'DRAFT',
    "x_tweet_id" TEXT,
    "image_key" TEXT,
    "posted_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tweet_url" TEXT NOT NULL,
    "x_tweet_id" TEXT,
    "generated_replies" JSONB,
    "selected_reply" TEXT,
    "x_reply_id" TEXT,
    "image_key" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTweet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_key" TEXT,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "status" "ScheduledTweetStatus" NOT NULL DEFAULT 'PENDING',
    "bullmq_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordAlert" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordMatch" (
    "id" TEXT NOT NULL,
    "keyword_alert_id" TEXT NOT NULL,
    "matched_tweet_url" TEXT NOT NULL,
    "matched_content" TEXT NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentFilter" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "sentiment_type" "SentimentType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingAutoReply" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment_url" TEXT NOT NULL,
    "comment_content" TEXT NOT NULL,
    "generated_replies" JSONB,
    "status" "AutoReplyStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAutoReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoReplySettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,
    "daily_limit" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoReplySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "XAccount_user_id_key" ON "XAccount"("user_id");

-- CreateIndex
CREATE INDEX "Tweet_user_id_idx" ON "Tweet"("user_id");

-- CreateIndex
CREATE INDEX "Tweet_status_idx" ON "Tweet"("status");

-- CreateIndex
CREATE INDEX "Reply_user_id_idx" ON "Reply"("user_id");

-- CreateIndex
CREATE INDEX "ScheduledTweet_user_id_idx" ON "ScheduledTweet"("user_id");

-- CreateIndex
CREATE INDEX "ScheduledTweet_status_idx" ON "ScheduledTweet"("status");

-- CreateIndex
CREATE INDEX "ScheduledTweet_scheduled_time_idx" ON "ScheduledTweet"("scheduled_time");

-- CreateIndex
CREATE INDEX "KeywordAlert_user_id_idx" ON "KeywordAlert"("user_id");

-- CreateIndex
CREATE INDEX "KeywordAlert_keyword_idx" ON "KeywordAlert"("keyword");

-- CreateIndex
CREATE INDEX "CommentFilter_user_id_idx" ON "CommentFilter"("user_id");

-- CreateIndex
CREATE INDEX "CommentFilter_keyword_idx" ON "CommentFilter"("keyword");

-- CreateIndex
CREATE INDEX "PendingAutoReply_user_id_idx" ON "PendingAutoReply"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "AutoReplySettings_user_id_key" ON "AutoReplySettings"("user_id");

-- CreateIndex
CREATE INDEX "AutoReplySettings_user_id_idx" ON "AutoReplySettings"("user_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_user_id_idx" ON "AnalyticsEvent"("user_id");

-- AddForeignKey
ALTER TABLE "XAccount" ADD CONSTRAINT "XAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTweet" ADD CONSTRAINT "ScheduledTweet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordAlert" ADD CONSTRAINT "KeywordAlert_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordMatch" ADD CONSTRAINT "KeywordMatch_keyword_alert_id_fkey" FOREIGN KEY ("keyword_alert_id") REFERENCES "KeywordAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentFilter" ADD CONSTRAINT "CommentFilter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingAutoReply" ADD CONSTRAINT "PendingAutoReply_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoReplySettings" ADD CONSTRAINT "AutoReplySettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
