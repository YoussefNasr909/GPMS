-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CODE', 'DOCUMENTATION', 'DESIGN', 'RESEARCH', 'MEETING', 'PRESENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskIntegrationMode" AS ENUM ('MANUAL', 'GITHUB');

-- CreateEnum
CREATE TYPE "TaskOrigin" AS ENUM ('GPMS', 'GITHUB_IMPORT');

-- CreateEnum
CREATE TYPE "TaskReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED');

-- AlterTable
ALTER TABLE "Task"
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "integrationMode" "TaskIntegrationMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "origin" "TaskOrigin" NOT NULL DEFAULT 'GPMS',
ADD COLUMN     "githubIssueState" TEXT,
ADD COLUMN     "githubBranchName" TEXT,
ADD COLUMN     "githubPullRequestId" TEXT,
ADD COLUMN     "githubPullRequestNumber" INTEGER,
ADD COLUMN     "githubPullRequestUrl" TEXT,
ADD COLUMN     "githubPullRequestState" TEXT,
ADD COLUMN     "githubPullRequestBase" TEXT,
ADD COLUMN     "githubPullRequestHead" TEXT,
ADD COLUMN     "githubPullRequestMergedAt" TIMESTAMP(3),
ADD COLUMN     "githubLatestCommitSha" TEXT,
ADD COLUMN     "githubLatestCommitUrl" TEXT,
ADD COLUMN     "githubCommitCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewDecision" "TaskReviewDecision",
ADD COLUMN     "reviewSnapshot" JSONB;

-- CreateIndex
CREATE INDEX "Task_reviewedByUserId_idx" ON "Task"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "Task_teamId_integrationMode_idx" ON "Task"("teamId", "integrationMode");

-- CreateIndex
CREATE INDEX "Task_teamId_githubPullRequestNumber_idx" ON "Task"("teamId", "githubPullRequestNumber");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
