-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('DELIVERABLE', 'DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('DOCUMENTATION', 'TUTORIAL', 'CODE', 'TEMPLATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('FILE', 'VIDEO', 'LINK', 'GITHUB');

-- CreateTable
CREATE TABLE "TeamDocument" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL DEFAULT 'DOCUMENTATION',
    "type" "ResourceType" NOT NULL DEFAULT 'FILE',
    "url" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorName" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamDocument_teamId_category_idx" ON "TeamDocument"("teamId", "category");

-- CreateIndex
CREATE INDEX "TeamDocument_uploadedByUserId_idx" ON "TeamDocument"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "TeamResource_createdByUserId_idx" ON "TeamResource"("createdByUserId");

-- CreateIndex
CREATE INDEX "TeamResource_category_idx" ON "TeamResource"("category");

-- AddForeignKey
ALTER TABLE "TeamDocument" ADD CONSTRAINT "TeamDocument_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDocument" ADD CONSTRAINT "TeamDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamResource" ADD CONSTRAINT "TeamResource_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
