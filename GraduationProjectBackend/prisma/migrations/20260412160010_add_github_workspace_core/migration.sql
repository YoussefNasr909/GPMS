-- CreateEnum
CREATE TYPE "GitHubOwnerType" AS ENUM ('USER', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "GitHubRepositoryVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "GitHubRepositoryConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "GitHubSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'DEGRADED', 'ERROR');

-- CreateEnum
CREATE TYPE "GitHubWebhookDeliveryStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('SRS', 'UML', 'PROTOTYPE', 'CODE', 'TEST_PLAN', 'FINAL_REPORT', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "SubmissionSourceType" AS ENUM ('MANUAL_UPLOAD', 'GITHUB_RELEASE', 'GITHUB_ARTIFACT');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "doctorId" TEXT,
ADD COLUMN     "taId" TEXT;

-- CreateTable
CREATE TABLE "GitHubTeamRepository" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerLogin" TEXT NOT NULL,
    "ownerType" "GitHubOwnerType" NOT NULL DEFAULT 'USER',
    "repoName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "installationId" TEXT,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "visibility" "GitHubRepositoryVisibility" NOT NULL DEFAULT 'PRIVATE',
    "repoUrl" TEXT NOT NULL,
    "cloneUrlHttps" TEXT,
    "cloneUrlSsh" TEXT,
    "connectionStatus" "GitHubRepositoryConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "syncStatus" "GitHubSyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastSyncAt" TIMESTAMP(3),
    "lastWebhookAt" TIMESTAMP(3),
    "syncIssuesToTasks" BOOLEAN NOT NULL DEFAULT true,
    "syncActivityToWeeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "syncReleasesToSubmissions" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubTeamRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubUserConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "tokenType" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubUserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubWebhookDelivery" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT,
    "deliveryId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT,
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "GitHubWebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubSyncCursor" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "cursorKey" TEXT,
    "etag" TEXT,
    "cursor" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubSyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "githubIssueId" TEXT,
    "githubIssueNumber" INTEGER,
    "githubIssueUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigneeUserId" TEXT,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dueDate" TIMESTAMP(3),
    "syncedFromGithub" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submittedById" TEXT,
    "weekLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "summaryDraft" TEXT,
    "summaryFinal" TEXT,
    "githubActivity" JSONB,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "deliverableType" "DeliverableType" NOT NULL,
    "sourceType" "SubmissionSourceType" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "githubReleaseId" TEXT,
    "githubReleaseTag" TEXT,
    "githubReleaseUrl" TEXT,
    "artifactUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3),
    "late" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "grade" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubTeamRepository_teamId_key" ON "GitHubTeamRepository"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubTeamRepository_fullName_key" ON "GitHubTeamRepository"("fullName");

-- CreateIndex
CREATE INDEX "GitHubTeamRepository_ownerLogin_repoName_idx" ON "GitHubTeamRepository"("ownerLogin", "repoName");

-- CreateIndex
CREATE INDEX "GitHubTeamRepository_installationId_idx" ON "GitHubTeamRepository"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubUserConnection_userId_key" ON "GitHubUserConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubUserConnection_githubUserId_key" ON "GitHubUserConnection"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubWebhookDelivery_deliveryId_key" ON "GitHubWebhookDelivery"("deliveryId");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_repositoryId_event_idx" ON "GitHubWebhookDelivery"("repositoryId", "event");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_status_createdAt_idx" ON "GitHubWebhookDelivery"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubSyncCursor_repositoryId_resourceType_key" ON "GitHubSyncCursor"("repositoryId", "resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "Task_githubIssueId_key" ON "Task"("githubIssueId");

-- CreateIndex
CREATE INDEX "Task_teamId_status_idx" ON "Task"("teamId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeUserId_idx" ON "Task"("assigneeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_teamId_githubIssueNumber_key" ON "Task"("teamId", "githubIssueNumber");

-- CreateIndex
CREATE INDEX "WeeklyReport_teamId_createdAt_idx" ON "WeeklyReport"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "WeeklyReport_submittedById_idx" ON "WeeklyReport"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_teamId_weekLabel_key" ON "WeeklyReport"("teamId", "weekLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_githubReleaseId_key" ON "Submission"("githubReleaseId");

-- CreateIndex
CREATE INDEX "Submission_teamId_deliverableType_idx" ON "Submission"("teamId", "deliverableType");

-- CreateIndex
CREATE INDEX "Team_doctorId_idx" ON "Team"("doctorId");

-- CreateIndex
CREATE INDEX "Team_taId_idx" ON "Team"("taId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_taId_fkey" FOREIGN KEY ("taId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubTeamRepository" ADD CONSTRAINT "GitHubTeamRepository_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubUserConnection" ADD CONSTRAINT "GitHubUserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubWebhookDelivery" ADD CONSTRAINT "GitHubWebhookDelivery_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubTeamRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubSyncCursor" ADD CONSTRAINT "GitHubSyncCursor_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubTeamRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
