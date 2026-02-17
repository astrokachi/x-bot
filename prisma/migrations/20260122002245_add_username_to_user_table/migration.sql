/*
  Warnings:

  - You are about to drop the column `x_username` on the `XAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "XAccount" DROP COLUMN "x_username";
