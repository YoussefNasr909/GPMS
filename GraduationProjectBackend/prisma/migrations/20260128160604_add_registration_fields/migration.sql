/*
  Warnings:

  - A unique constraint covering the columns `[nationalId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nationalId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('COMPUTER_SCIENCE', 'SOFTWARE_ENGINEERING', 'INFORMATION_TECHNOLOGY', 'COMPUTER_ENGINEERING', 'DATA_SCIENCE', 'ARTIFICIAL_INTELLIGENCE', 'CYBERSECURITY_INFOSEC', 'INFORMATION_SYSTEMS', 'BIOINFORMATICS');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('YEAR_1', 'YEAR_2', 'YEAR_3', 'YEAR_4', 'YEAR_5');

-- CreateEnum
CREATE TYPE "PreferredTrack" AS ENUM ('FRONTEND_DEVELOPMENT', 'BACKEND_DEVELOPMENT', 'FULLSTACK_DEVELOPMENT', 'MOBILE_APP_DEVELOPMENT', 'DEVOPS', 'CLOUD_ENGINEERING', 'SOFTWARE_ARCHITECTURE', 'QUALITY_ASSURANCE', 'GAME_DEVELOPMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicYear" "AcademicYear",
ADD COLUMN     "department" "Department",
ADD COLUMN     "nationalId" TEXT NOT NULL,
ADD COLUMN     "preferredTrack" "PreferredTrack";

-- CreateIndex
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");
