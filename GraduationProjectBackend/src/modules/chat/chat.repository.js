import { prisma } from "../../loaders/dbLoader.js";

export const chatUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  academicId: true,
  avatarUrl: true,
  bio: true,
};

export const chatMessageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  recipientId: true,
  deletedById: true,
  content: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  deliveredAt: true,
  seenAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
};

export const chatConversationBaseSelect = {
  id: true,
  pairKey: true,
  userOneId: true,
  userTwoId: true,
  userOneClearedAt: true,
  userTwoClearedAt: true,
  userOneLastSeenAt: true,
  userTwoLastSeenAt: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  userOne: { select: chatUserSelect },
  userTwo: { select: chatUserSelect },
};

export const chatConversationSelect = {
  ...chatConversationBaseSelect,
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: chatMessageSelect,
  },
};

export function findChatConversationById(id, tx = prisma) {
  return tx.directChatConversation.findUnique({
    where: { id },
    select: chatConversationSelect,
  });
}

export function findChatConversationByPairKey(pairKey, tx = prisma) {
  return tx.directChatConversation.findUnique({
    where: { pairKey },
    select: chatConversationSelect,
  });
}

export function listChatConversationsByUser(userId, tx = prisma) {
  return tx.directChatConversation.findMany({
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    select: chatConversationSelect,
  });
}

export function upsertChatConversation({ pairKey, userOneId, userTwoId }, tx = prisma) {
  return tx.directChatConversation.upsert({
    where: { pairKey },
    update: {},
    create: {
      pairKey,
      userOneId,
      userTwoId,
    },
    select: chatConversationSelect,
  });
}

export function updateChatConversationById(id, data, tx = prisma) {
  return tx.directChatConversation.update({
    where: { id },
    data,
    select: chatConversationSelect,
  });
}

export function listChatMessagesByConversation(conversationId, tx = prisma) {
  return tx.directChatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: chatMessageSelect,
  });
}

export function createChatMessage(data, tx = prisma) {
  return tx.directChatMessage.create({
    data,
    select: chatMessageSelect,
  });
}

export function findChatMessageById(id, tx = prisma) {
  return tx.directChatMessage.findUnique({
    where: { id },
    select: {
      ...chatMessageSelect,
      conversation: {
        select: chatConversationBaseSelect,
      },
    },
  });
}

export function updateChatMessageById(id, data, tx = prisma) {
  return tx.directChatMessage.update({
    where: { id },
    data,
    select: chatMessageSelect,
  });
}

export function updateManyChatMessages(ids, data, tx = prisma) {
  if (!ids.length) return Promise.resolve({ count: 0 });

  return tx.directChatMessage.updateMany({
    where: {
      id: { in: ids },
    },
    data,
  });
}

export function listPendingDeliveryMessagesByRecipient(recipientId, tx = prisma) {
  return tx.directChatMessage.findMany({
    where: {
      recipientId,
      deliveredAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: chatMessageSelect,
  });
}

export function listPendingSeenMessagesByConversation(conversationId, recipientId, tx = prisma) {
  return tx.directChatMessage.findMany({
    where: {
      conversationId,
      recipientId,
      seenAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: chatMessageSelect,
  });
}

export function countUnreadMessagesByConversation(conversationId, recipientId, after = null, tx = prisma) {
  const where = {
    conversationId,
    recipientId,
    seenAt: null,
    ...(after ? { createdAt: { gt: after } } : {}),
  };

  return tx.directChatMessage.count({ where });
}
