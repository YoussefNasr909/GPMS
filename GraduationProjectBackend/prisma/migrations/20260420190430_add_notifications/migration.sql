-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_REVIEWED', 'TASK_APPROVED', 'TASK_CHANGES_REQUESTED', 'TEAM_INVITE_RECEIVED', 'TEAM_JOIN_REQUEST_RECEIVED', 'TEAM_JOIN_REQUEST_APPROVED', 'TEAM_JOIN_REQUEST_REJECTED', 'SUPERVISOR_REQUEST_RECEIVED', 'SUPERVISOR_REQUEST_ACCEPTED', 'SUPERVISOR_REQUEST_DECLINED', 'SUBMISSION_GRADED', 'SUBMISSION_FEEDBACK', 'SYSTEM');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
