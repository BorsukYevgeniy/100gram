-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "allowedReactions" "Reaction"[] DEFAULT ARRAY[]::"Reaction"[];
