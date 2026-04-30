/*
  Warnings:

  - You are about to drop the column `emailVerificationCode` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationCode",
ADD COLUMN     "emailVerificationCodeHash" TEXT;
