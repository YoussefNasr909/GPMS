-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RiskApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "RiskChance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "chance" "RiskChance" NOT NULL DEFAULT 'MEDIUM',
    "impact" "RiskChance" NOT NULL DEFAULT 'MEDIUM',
    "severity" "RiskSeverity",
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "approvalStatus" "RiskApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "mitigation" TEXT,
    "monitoringNotes" TEXT,
    "resolutionNotes" TEXT,
    "approvalNote" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "monitorUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Risk_teamId_status_idx" ON "Risk"("teamId", "status");

-- CreateIndex
CREATE INDEX "Risk_teamId_approvalStatus_idx" ON "Risk"("teamId", "approvalStatus");

-- CreateIndex
CREATE INDEX "Risk_monitorUserId_idx" ON "Risk"("monitorUserId");

-- CreateIndex
CREATE INDEX "Risk_approvedByUserId_idx" ON "Risk"("approvedByUserId");

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_monitorUserId_fkey" FOREIGN KEY ("monitorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
