-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('MODERATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "ChatToUser" ADD COLUMN     "role" "ChatRole" NOT NULL DEFAULT 'MEMBER';
