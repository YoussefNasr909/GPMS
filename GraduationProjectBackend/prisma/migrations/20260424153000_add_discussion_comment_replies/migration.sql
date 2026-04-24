ALTER TABLE "DiscussionComment"
ADD COLUMN "parentCommentId" TEXT;

CREATE INDEX "DiscussionComment_parentCommentId_createdAt_idx"
ON "DiscussionComment"("parentCommentId", "createdAt");

ALTER TABLE "DiscussionComment"
ADD CONSTRAINT "DiscussionComment_parentCommentId_fkey"
FOREIGN KEY ("parentCommentId") REFERENCES "DiscussionComment"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
