/*
  Warnings:

  - A unique constraint covering the columns `[otp]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otpHash" TEXT,
ADD COLUMN     "otpAttempts" INTEGER,
ADD COLUMN     "otpExpiresAt" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "User_otpHash_key" ON "User"("otpHash");
