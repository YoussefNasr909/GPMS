CREATE TABLE IF NOT EXISTS "DirectChatConversation" (
  "id" TEXT NOT NULL,
  "pairKey" TEXT NOT NULL,
  "userOneId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "userTwoId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "userOneClearedAt" TIMESTAMP(3),
  "userTwoClearedAt" TIMESTAMP(3),
  "userOneLastSeenAt" TIMESTAMP(3),
  "userTwoLastSeenAt" TIMESTAMP(3),
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DirectChatConversation_pairKey_key"
  ON "DirectChatConversation"("pairKey");

CREATE INDEX IF NOT EXISTS "DirectChatConversation_userOneId_idx"
  ON "DirectChatConversation"("userOneId");

CREATE INDEX IF NOT EXISTS "DirectChatConversation_userTwoId_idx"
  ON "DirectChatConversation"("userTwoId");

CREATE INDEX IF NOT EXISTS "DirectChatConversation_lastMessageAt_idx"
  ON "DirectChatConversation"("lastMessageAt");

CREATE TABLE IF NOT EXISTS "DirectChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL REFERENCES "DirectChatConversation"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "recipientId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "deletedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "content" TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "seenAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DirectChatMessage_conversationId_createdAt_idx"
  ON "DirectChatMessage"("conversationId", "createdAt");

CREATE INDEX IF NOT EXISTS "DirectChatMessage_senderId_createdAt_idx"
  ON "DirectChatMessage"("senderId", "createdAt");

CREATE INDEX IF NOT EXISTS "DirectChatMessage_recipientId_createdAt_idx"
  ON "DirectChatMessage"("recipientId", "createdAt");

CREATE INDEX IF NOT EXISTS "DirectChatMessage_recipientId_deliveredAt_idx"
  ON "DirectChatMessage"("recipientId", "deliveredAt");

CREATE INDEX IF NOT EXISTS "DirectChatMessage_recipientId_seenAt_idx"
  ON "DirectChatMessage"("recipientId", "seenAt");
