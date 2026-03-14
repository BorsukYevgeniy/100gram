/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE UNIQUE INDEX "Chat_inviteToken_key" ON "Chat"("inviteToken");
