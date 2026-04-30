CREATE TABLE IF NOT EXISTS "TeamGroupConversation" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamGroupConversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamGroupConversation_teamId_key"
  ON "TeamGroupConversation"("teamId");

CREATE INDEX IF NOT EXISTS "TeamGroupConversation_lastMessageAt_idx"
  ON "TeamGroupConversation"("lastMessageAt");

CREATE TABLE IF NOT EXISTS "TeamGroupConversationParticipant" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL REFERENCES "TeamGroupConversation"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clearedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3),
  CONSTRAINT "TeamGroupConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamGroupConversationParticipant_conversationId_userId_key"
  ON "TeamGroupConversationParticipant"("conversationId", "userId");

CREATE INDEX IF NOT EXISTS "TeamGroupConversationParticipant_userId_idx"
  ON "TeamGroupConversationParticipant"("userId");

CREATE TABLE IF NOT EXISTS "TeamGroupMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL REFERENCES "TeamGroupConversation"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamGroupMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeamGroupMessage_conversationId_createdAt_idx"
  ON "TeamGroupMessage"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "TeamGroupMessage_senderId_createdAt_idx"
  ON "TeamGroupMessage"("senderId", "createdAt");
