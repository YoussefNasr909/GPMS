import { prisma } from "../../loaders/dbLoader.js";

export const teamChatUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  academicId: true,
  avatarUrl: true,
  bio: true,
};

export const teamGroupParticipantSelect = {
  id: true,
  userId: true,
  joinedAt: true,
  clearedAt: true,
  lastSeenAt: true,
};

export const teamGroupMessageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  sender: { select: teamChatUserSelect },
};

export const teamGroupConversationBaseSelect = {
  id: true,
  teamId: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  participants: {
    orderBy: { joinedAt: "asc" },
    select: teamGroupParticipantSelect,
  },
};

export const teamGroupConversationSelect = {
  ...teamGroupConversationBaseSelect,
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: teamGroupMessageSelect,
  },
};

export function findTeamGroupConversationById(id, tx = prisma) {
  return tx.teamGroupConversation.findUnique({
    where: { id },
    select: teamGroupConversationSelect,
  });
}

export function listTeamGroupConversationsByParticipant(userId, teamIds, tx = prisma) {
  return tx.teamGroupConversation.findMany({
    where: {
      teamId: { in: teamIds },
      participants: {
        some: { userId },
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    select: teamGroupConversationSelect,
  });
}

export function listTeamGroupMessagesByConversation(conversationId, after = null, tx = prisma) {
  return tx.teamGroupMessage.findMany({
    where: {
      conversationId,
      ...(after ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: teamGroupMessageSelect,
  });
}
