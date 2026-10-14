/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ChatRole" ADD VALUE 'OWNER';

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_ownerId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "ownerId";
