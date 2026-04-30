/*
  Warnings:

  - You are about to drop the column `nationalId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[academicId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `academicId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_nationalId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nationalId",
ADD COLUMN     "academicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_academicId_key" ON "User"("academicId");
