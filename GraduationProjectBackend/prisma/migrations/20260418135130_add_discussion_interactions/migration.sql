-- CreateTable
CREATE TABLE "DiscussionLike" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionView" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionLike_discussionId_userId_key" ON "DiscussionLike"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionLike_userId_idx" ON "DiscussionLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionView_discussionId_userId_key" ON "DiscussionView"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionView_userId_idx" ON "DiscussionView"("userId");

-- AddForeignKey
ALTER TABLE "DiscussionLike"
ADD CONSTRAINT "DiscussionLike_discussionId_fkey"
FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionLike"
ADD CONSTRAINT "DiscussionLike_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionView"
ADD CONSTRAINT "DiscussionView_discussionId_fkey"
FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionView"
ADD CONSTRAINT "DiscussionView_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
