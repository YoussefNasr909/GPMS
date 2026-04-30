-- CreateEnum
CREATE TYPE "SupervisorRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TeamSupervisorRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "supervisorRole" "Role" NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SupervisorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSupervisorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamSupervisorRequest_teamId_supervisorId_key" ON "TeamSupervisorRequest"("teamId", "supervisorId");

-- CreateIndex
CREATE INDEX "TeamSupervisorRequest_teamId_status_idx" ON "TeamSupervisorRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamSupervisorRequest_supervisorId_status_idx" ON "TeamSupervisorRequest"("supervisorId", "status");

-- CreateIndex
CREATE INDEX "TeamSupervisorRequest_supervisorRole_status_idx" ON "TeamSupervisorRequest"("supervisorRole", "status");

-- AddForeignKey
ALTER TABLE "TeamSupervisorRequest" ADD CONSTRAINT "TeamSupervisorRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSupervisorRequest" ADD CONSTRAINT "TeamSupervisorRequest_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSupervisorRequest" ADD CONSTRAINT "TeamSupervisorRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
