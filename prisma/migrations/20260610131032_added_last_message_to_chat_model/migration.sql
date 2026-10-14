/*
  Warnings:

  - A unique constraint covering the columns `[lastMessageId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('MODERATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "lastMessageId" INTEGER;

-- AlterTable
ALTER TABLE "ChatToUser" ADD COLUMN     "role" "ChatRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "Chat_lastMessageId_key" ON "Chat"("lastMessageId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
