-- AlterEnum
ALTER TYPE "ChatType" ADD VALUE 'CHANNEL';

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "membersCount" INTEGER NOT NULL DEFAULT 1;
