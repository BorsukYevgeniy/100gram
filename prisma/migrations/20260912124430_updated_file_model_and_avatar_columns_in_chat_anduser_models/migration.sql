/*
  Warnings:

  - You are about to drop the column `avatar` on the `Chat` table. All the data in the column will be lost.
  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[avatarName]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileType` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('ATTACHMENT', 'USER_AVATAR', 'CHAT_AVATAR');

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- DropIndex
DROP INDEX "File_name_key";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "avatar",
ADD COLUMN     "avatarName" TEXT;

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "id",
DROP COLUMN "userId",
ADD COLUMN     "fileType" "FileType" NOT NULL,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
ADD COLUMN     "avatarName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_avatarName_key" ON "Chat"("avatarName");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarName_key" ON "User"("avatarName");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_avatarName_fkey" FOREIGN KEY ("avatarName") REFERENCES "File"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarName_fkey" FOREIGN KEY ("avatarName") REFERENCES "File"("name") ON DELETE SET NULL ON UPDATE CASCADE;
