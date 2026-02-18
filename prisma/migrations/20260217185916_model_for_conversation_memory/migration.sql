/*
  Warnings:

  - You are about to drop the `Chat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Summary` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "Summary" DROP CONSTRAINT "Summary_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "Summary" DROP CONSTRAINT "Summary_last_chat_id_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Chat";

-- DropTable
DROP TABLE "Response";

-- DropTable
DROP TABLE "Summary";

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Create vector type
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "chunk" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversation_id_key" ON "Message"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "Memory_conversation_id_key" ON "Memory"("conversation_id");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
