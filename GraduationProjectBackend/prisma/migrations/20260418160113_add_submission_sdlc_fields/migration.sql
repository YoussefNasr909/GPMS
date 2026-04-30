/*
  Warnings:

  - Added the required column `sdlcPhase` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "sdlcPhase" "TeamStage" NOT NULL DEFAULT 'REQUIREMENTS',
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedByUserId" TEXT,
ADD COLUMN     "title" TEXT;

-- Remove default from sdlcPhase after backfilling existing rows
ALTER TABLE "Submission" ALTER COLUMN "sdlcPhase" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Submission_teamId_sdlcPhase_idx" ON "Submission"("teamId", "sdlcPhase");

-- CreateIndex
CREATE INDEX "Submission_teamId_status_idx" ON "Submission"("teamId", "status");

-- CreateIndex
CREATE INDEX "Submission_submittedByUserId_idx" ON "Submission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "Submission_reviewedByUserId_idx" ON "Submission"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
