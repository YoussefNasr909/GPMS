import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../loaders/dbLoader.js";
import { ROLES } from "../../common/constants/roles.js";
import {
  chatUserSelect,
  countUnreadMessagesByConversation,
  createChatMessage,
  findChatConversationById,
  findChatMessageById,
  listChatConversationsByUser,
  listChatMessagesByConversation,
  listPendingDeliveryMessagesByRecipient,
  listPendingSeenMessagesByConversation,
  updateChatConversationById,
  updateChatMessageById,
  updateManyChatMessages,
  upsertChatConversation,
} from "./chat.repository.js";
import { emitToUser, isConversationOpenForUser, isUserOnline } from "./chat.realtime.js";

const CHAT_RELATIONS = Object.freeze({
  TEAM_MEMBER: "TEAM_MEMBER",
  TEAM_LEADER: "TEAM_LEADER",
  TEAM_DOCTOR: "TEAM_DOCTOR",
  TEAM_TA: "TEAM_TA",
  SUPERVISED_TEAM_LEADER: "SUPERVISED_TEAM_LEADER",
});

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function buildPair(userIdA, userIdB) {
  const [userOneId, userTwoId] = [userIdA, userIdB].sort();
  return {
    userOneId,
    userTwoId,
    pairKey: `${userOneId}:${userTwoId}`,
  };
}

function toChatUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: buildFullName(user),
    email: user.email,
    role: user.role,
    academicId: user.academicId ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
  };
}

function toMessageStatus(message) {
  if (message.deletedAt) return "DELETED";
  if (message.seenAt) return "SEEN";
  if (message.deliveredAt) return "DELIVERED";
  return "SENT";
}

function toChatMessage(message) {
  if (!message) return null;

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    recipientId: message.recipientId,
    content: message.deletedAt ? "" : message.content,
    fileUrl: message.deletedAt ? null : message.fileUrl ?? null,
    fileName: message.deletedAt ? null : message.fileName ?? null,
    fileSize: message.deletedAt ? null : message.fileSize ?? null,
    fileType: message.deletedAt ? null : message.fileType ?? null,
    isDeleted: Boolean(message.deletedAt),
    deletedAt: message.deletedAt ?? null,
    deliveredAt: message.deliveredAt ?? null,
    seenAt: message.seenAt ?? null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    status: toMessageStatus(message),
  };
}

function getConversationPeer(conversation, actorId) {
  if (conversation.userOneId === actorId) return conversation.userTwo;
  if (conversation.userTwoId === actorId) return conversation.userOne;
  return null;
}

function getConversationActorClearAt(conversation, actorId) {
  if (conversation.userOneId === actorId) return conversation.userOneClearedAt ?? null;
  if (conversation.userTwoId === actorId) return conversation.userTwoClearedAt ?? null;
  return null;
}

function getConversationActorLastSeenAt(conversation, actorId) {
  if (conversation.userOneId === actorId) return conversation.userOneLastSeenAt ?? null;
  if (conversation.userTwoId === actorId) return conversation.userTwoLastSeenAt ?? null;
  return null;
}

function buildConversationParticipantUpdate(conversation, userId, payload = {}) {
  if (conversation.userOneId === userId) {
    return {
      ...(Object.prototype.hasOwnProperty.call(payload, "clearedAt") ? { userOneClearedAt: payload.clearedAt } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "lastSeenAt") ? { userOneLastSeenAt: payload.lastSeenAt } : {}),
    };
  }

  if (conversation.userTwoId === userId) {
    return {
      ...(Object.prototype.hasOwnProperty.call(payload, "clearedAt") ? { userTwoClearedAt: payload.clearedAt } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "lastSeenAt") ? { userTwoLastSeenAt: payload.lastSeenAt } : {}),
    };
  }

  throw new AppError("You are not part of this conversation.", 403, "CHAT_CONVERSATION_FORBIDDEN");
}

function ensureConversationParticipant(conversation, actorId) {
  if (!conversation) {
    throw new AppError("Conversation not found.", 404, "CHAT_CONVERSATION_NOT_FOUND");
  }

  if (conversation.userOneId !== actorId && conversation.userTwoId !== actorId) {
    throw new AppError("You are not allowed to access this conversation.", 403, "CHAT_CONVERSATION_FORBIDDEN");
  }
}

function getConversationSortTimestamp(conversation) {
  return new Date(conversation.lastMessage?.createdAt ?? conversation.updatedAt ?? conversation.createdAt).getTime();
}

function getContactSortName(contact) {
  return `${contact.user.fullName} ${contact.team?.name ?? ""}`.trim().toLowerCase();
}

function addContact(contactMap, user, relation, team) {
  if (!user) return;

  contactMap.set(user.id, {
    user: toChatUser(user),
    relation,
    team: team ? { id: team.id, name: team.name } : null,
  });
}

async function getAllowedChatContactMap(actor) {
  const contactMap = new Map();

  if (actor.role === ROLES.LEADER) {
    const team = await prisma.team.findUnique({
      where: { leaderId: actor.id },
      select: {
        id: true,
        name: true,
        members: {
          orderBy: { joinedAt: "asc" },
          select: {
            user: { select: chatUserSelect },
          },
        },
        doctor: { select: chatUserSelect },
        ta: { select: chatUserSelect },
      },
    });

    if (!team) return contactMap;

    for (const member of team.members) {
      addContact(contactMap, member.user, CHAT_RELATIONS.TEAM_MEMBER, team);
    }

    addContact(contactMap, team.doctor, CHAT_RELATIONS.TEAM_DOCTOR, team);
    addContact(contactMap, team.ta, CHAT_RELATIONS.TEAM_TA, team);
    return contactMap;
  }

  if (actor.role === ROLES.STUDENT) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId: actor.id },
      select: {
        team: {
          select: {
            id: true,
            name: true,
            leader: { select: chatUserSelect },
            members: {
              orderBy: { joinedAt: "asc" },
              select: {
                user: { select: chatUserSelect },
              },
            },
          },
        },
      },
    });

    if (!membership?.team) return contactMap;

    addContact(contactMap, membership.team.leader, CHAT_RELATIONS.TEAM_LEADER, membership.team);

    for (const member of membership.team.members) {
      if (member.user.id === actor.id) continue;
      addContact(contactMap, member.user, CHAT_RELATIONS.TEAM_MEMBER, membership.team);
    }

    return contactMap;
  }

  if (actor.role === ROLES.DOCTOR) {
    const teams = await prisma.team.findMany({
      where: { doctorId: actor.id },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        leader: { select: chatUserSelect },
      },
    });

    for (const team of teams) {
      addContact(contactMap, team.leader, CHAT_RELATIONS.SUPERVISED_TEAM_LEADER, team);
    }

    return contactMap;
  }

  if (actor.role === ROLES.TA) {
    const teams = await prisma.team.findMany({
      where: { taId: actor.id },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        leader: { select: chatUserSelect },
      },
    });

    for (const team of teams) {
      addContact(contactMap, team.leader, CHAT_RELATIONS.SUPERVISED_TEAM_LEADER, team);
    }
  }

  return contactMap;
}

async function buildConversationSummaryForActor(actor, conversation, contactMeta) {
  const clearedAt = getConversationActorClearAt(conversation, actor.id);
  const latestMessage = conversation.messages?.[0] ?? null;
  const visibleLastMessage =
    latestMessage && (!clearedAt || new Date(latestMessage.createdAt).getTime() > new Date(clearedAt).getTime())
      ? toChatMessage(latestMessage)
      : null;
  const peer = getConversationPeer(conversation, actor.id);
  const unreadCount = await countUnreadMessagesByConversation(conversation.id, actor.id, clearedAt);

  return {
    id: conversation.id,
    participant: toChatUser(peer),
    relation: contactMeta?.relation ?? null,
    team: contactMeta?.team ?? null,
    lastMessage: visibleLastMessage,
    unreadCount,
    clearedAt,
    lastSeenAt: getConversationActorLastSeenAt(conversation, actor.id),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function toContactResponse(contactMeta, conversationId = null) {
  return {
    user: contactMeta.user,
    relation: contactMeta.relation,
    team: contactMeta.team,
    conversationId,
  };
}

function getPeerRelation(actorRole, peerRole) {
  const isStudentGroup = r => r === ROLES.STUDENT || r === ROLES.LEADER;
  const isStaffGroup = r => r === ROLES.DOCTOR || r === ROLES.TA;
  if (isStudentGroup(actorRole) && isStudentGroup(peerRole)) return "STUDENT_PEER";
  if (isStaffGroup(actorRole) && isStaffGroup(peerRole)) return "STAFF_PEER";
  return null;
}

async function resolveAuthorizedConversation(actor, conversationId, contactMap = null) {
  const conversation = await findChatConversationById(conversationId);
  ensureConversationParticipant(conversation, actor.id);

  const contacts = contactMap ?? (await getAllowedChatContactMap(actor));
  const peer = getConversationPeer(conversation, actor.id);
  let contactMeta = peer ? contacts.get(peer.id) ?? null : null;

  if (!contactMeta && peer) {
    const peerRelation = getPeerRelation(actor.role, peer.role);
    if (peerRelation) {
      contactMeta = {
        user: toChatUser(peer),
        relation: peerRelation,
        team: null,
      };
    }
  }

  if (!contactMeta) {
    throw new AppError(
      "This chat is no longer available because you no longer share an allowed chat relationship.",
      403,
      "CHAT_RELATION_FORBIDDEN",
    );
  }

  return {
    conversation,
    contacts,
    contactMeta,
  };
}

async function getTotalUnreadCount(actor, contactMap = null) {
  const contacts = contactMap ?? (await getAllowedChatContactMap(actor));
  const allowedUserIds = new Set([...contacts.keys()]);
  const conversations = await listChatConversationsByUser(actor.id);

  let unreadCount = 0;

  for (const conversation of conversations) {
    const peer = getConversationPeer(conversation, actor.id);
    if (!peer) continue;
    if (!allowedUserIds.has(peer.id) && !getPeerRelation(actor.role, peer.role)) continue;
    unreadCount += await countUnreadMessagesByConversation(
      conversation.id,
      actor.id,
      getConversationActorClearAt(conversation, actor.id),
    );
  }

  return unreadCount;
}

async function emitUnreadBadge(actor, contactMap = null) {
  const unreadCount = await getTotalUnreadCount(actor, contactMap);
  emitToUser(actor.id, "chat:badge", { unreadCount });
  return unreadCount;
}

function buildStatusEventPayload(message) {
  return {
    conversationId: message.conversationId,
    messageId: message.id,
    deliveredAt: message.deliveredAt ?? null,
    seenAt: message.seenAt ?? null,
    status: toMessageStatus(message),
  };
}

export async function getChatBootstrapService(actor) {
  const contactMap = await getAllowedChatContactMap(actor);
  const conversations = await listChatConversationsByUser(actor.id);
  const allowedUserIds = new Set([...contactMap.keys()]);

  const visibleConversations = conversations.filter((conversation) => {
    const peer = getConversationPeer(conversation, actor.id);
    if (!peer) return false;
    return allowedUserIds.has(peer.id) || getPeerRelation(actor.role, peer.role);
  });

  const conversationSummaries = await Promise.all(
    visibleConversations.map(async (conversation) => {
      const peer = getConversationPeer(conversation, actor.id);
      let meta = peer ? contactMap.get(peer.id) ?? null : null;
      if (!meta && peer) {
        const peerRelation = getPeerRelation(actor.role, peer.role);
        if (peerRelation) {
          meta = { relation: peerRelation, team: null };
        }
      }
      return buildConversationSummaryForActor(actor, conversation, meta);
    }),
  );

  conversationSummaries.sort((left, right) => getConversationSortTimestamp(right) - getConversationSortTimestamp(left));

  const conversationIdByUserId = new Map(conversationSummaries.map((conversation) => [conversation.participant.id, conversation.id]));

  const contacts = [...contactMap.values()]
    .map((contact) => toContactResponse(contact, conversationIdByUserId.get(contact.user.id) ?? null))
    .sort((left, right) => getContactSortName(left).localeCompare(getContactSortName(right)));

  const unreadCount = conversationSummaries.reduce((total, conversation) => total + conversation.unreadCount, 0);

  return {
    conversations: conversationSummaries,
    contacts,
    unreadCount,
  };
}

export async function getChatUnreadCountService(actor) {
  const contactMap = await getAllowedChatContactMap(actor);
  return {
    unreadCount: await getTotalUnreadCount(actor, contactMap),
  };
}

export async function getConversationMessagesService(actor, conversationId) {
  const { conversation, contactMeta } = await resolveAuthorizedConversation(actor, conversationId);
  const clearedAt = getConversationActorClearAt(conversation, actor.id);
  const messages = await listChatMessagesByConversation(conversationId);

  return {
    conversation: await buildConversationSummaryForActor(actor, conversation, contactMeta),
    messages: messages
      .filter((message) => !clearedAt || new Date(message.createdAt).getTime() > new Date(clearedAt).getTime())
      .map(toChatMessage),
  };
}

export async function sendChatMessageService(actor, payload, file = null) {
  const recipientId = normalizeText(payload.recipientId);
  const content = normalizeText(payload.content);

  if (!recipientId) {
    throw new AppError("Select who you want to message first.", 422, "CHAT_RECIPIENT_REQUIRED");
  }

  if (!content && !file) {
    throw new AppError("Message content cannot be empty.", 422, "CHAT_MESSAGE_EMPTY");
  }

  if (recipientId === actor.id) {
    throw new AppError("You cannot send messages to yourself.", 409, "CHAT_SELF_MESSAGE_FORBIDDEN");
  }

  const senderContactMap = await getAllowedChatContactMap(actor);
  let recipientMetaForSender = senderContactMap.get(recipientId);

  // If not in standard contacts, check if they are in an allowed peer group
  if (!recipientMetaForSender) {
    const recipientUser = await prisma.user.findUnique({
      where: { id: recipientId },
      select: chatUserSelect,
    });
    if (recipientUser) {
      const peerRelation = getPeerRelation(actor.role, recipientUser.role);
      if (peerRelation) {
        recipientMetaForSender = {
          user: toChatUser(recipientUser),
          relation: peerRelation,
          team: null,
        };
      }
    }
  }

  if (!recipientMetaForSender) {
    throw new AppError(
      "You are not allowed to chat with this user.",
      403,
      "CHAT_RECIPIENT_FORBIDDEN",
    );
  }

  const pair = buildPair(actor.id, recipientId);
  const recipientRole = recipientMetaForSender.user.role;
  const recipientActor = { id: recipientId, role: recipientRole };
  let isRecipientViewingConversation = false;

  const result = await prisma.$transaction(async (tx) => {
    const conversation = await upsertChatConversation(pair, tx);
    isRecipientViewingConversation = isConversationOpenForUser(recipientId, conversation.id);

    const deliveredAt = isUserOnline(recipientId) || isRecipientViewingConversation ? new Date() : null;
    const seenAt = isRecipientViewingConversation ? new Date() : null;

    const message = await createChatMessage(
      {
        conversationId: conversation.id,
        senderId: actor.id,
        recipientId,
        content,
        fileUrl: file ? `/uploads/chat/${file.filename}` : null,
        fileName: file ? file.originalname : null,
        fileSize: file ? file.size : null,
        fileType: file ? file.mimetype : null,
        deliveredAt,
        seenAt,
      },
      tx,
    );

    const updatedConversation = await updateChatConversationById(
      conversation.id,
      {
        lastMessageAt: message.createdAt,
        ...(seenAt ? buildConversationParticipantUpdate(conversation, recipientId, { lastSeenAt: seenAt }) : {}),
      },
      tx,
    );

    return {
      conversation: updatedConversation,
      message,
    };
  });

  const recipientContactMap = await getAllowedChatContactMap(recipientActor);
  let senderMetaForRecipient = recipientContactMap.get(actor.id) ?? null;

  // If sender is not in recipient's formal contact map, build a peer meta from role matching
  if (!senderMetaForRecipient) {
    const senderUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: chatUserSelect,
    });
    if (senderUser) {
      const peerRelation = getPeerRelation(recipientRole, senderUser.role);
      if (peerRelation) {
        senderMetaForRecipient = {
          user: toChatUser(senderUser),
          relation: peerRelation,
          team: null,
        };
      }
    }
  }

  const senderConversation = await buildConversationSummaryForActor(actor, result.conversation, recipientMetaForSender);
  const recipientConversation = await buildConversationSummaryForActor(
    recipientActor,
    result.conversation,
    senderMetaForRecipient,
  );
  const mappedMessage = toChatMessage(result.message);

  emitToUser(actor.id, "chat:message:new", {
    conversation: senderConversation,
    message: mappedMessage,
  });

  emitToUser(recipientId, "chat:message:new", {
    conversation: recipientConversation,
    message: mappedMessage,
  });

  if (result.message.deliveredAt || result.message.seenAt) {
    emitToUser(actor.id, "chat:message:status", buildStatusEventPayload(result.message));
  }

  await emitUnreadBadge(recipientActor, null);

  return {
    conversation: senderConversation,
    message: mappedMessage,
    recipientOnline: isUserOnline(recipientId),
    recipientViewingConversation: isRecipientViewingConversation,
  };
}

export async function markPendingDeliveriesService(actor) {
  const pendingMessages = await listPendingDeliveryMessagesByRecipient(actor.id);
  if (!pendingMessages.length) return { deliveredMessageIds: [] };

  const deliveredAt = new Date();

  await updateManyChatMessages(
    pendingMessages.map((message) => message.id),
    {
      deliveredAt,
    },
  );

  const updatedMessages = pendingMessages.map((message) => ({
    ...message,
    deliveredAt,
  }));

  for (const message of updatedMessages) {
    emitToUser(message.senderId, "chat:message:status", buildStatusEventPayload(message));
  }

  return {
    deliveredMessageIds: updatedMessages.map((message) => message.id),
  };
}

export async function markConversationSeenService(actor, conversationId) {
  const { conversation, contactMeta, contacts } = await resolveAuthorizedConversation(actor, conversationId);
  const pendingMessages = await listPendingSeenMessagesByConversation(conversationId, actor.id);
  const seenAt = new Date();

  await prisma.$transaction(async (tx) => {
    if (pendingMessages.length) {
      await updateManyChatMessages(
        pendingMessages.map((message) => message.id),
        {
          deliveredAt: seenAt,
          seenAt,
        },
        tx,
      );
    }

    await updateChatConversationById(
      conversationId,
      buildConversationParticipantUpdate(conversation, actor.id, { lastSeenAt: seenAt }),
      tx,
    );
  });

  const refreshedConversation = await findChatConversationById(conversationId);
  const updatedMessages = pendingMessages.map((message) => ({
    ...message,
    deliveredAt: message.deliveredAt ?? seenAt,
    seenAt,
  }));

  for (const message of updatedMessages) {
    emitToUser(message.senderId, "chat:message:status", buildStatusEventPayload(message));
  }

  const unreadCount = await emitUnreadBadge(actor, contacts);

  return {
    conversation: await buildConversationSummaryForActor(actor, refreshedConversation, contactMeta),
    seenMessageIds: updatedMessages.map((message) => message.id),
    unreadCount,
  };
}

export async function deleteChatMessageService(actor, messageId) {
  const message = await findChatMessageById(messageId);

  if (!message) {
    throw new AppError("Message not found.", 404, "CHAT_MESSAGE_NOT_FOUND");
  }

  await resolveAuthorizedConversation(actor, message.conversation.id);

  if (message.senderId !== actor.id) {
    throw new AppError("Only the sender can delete this message.", 403, "CHAT_MESSAGE_DELETE_FORBIDDEN");
  }

  if (message.deletedAt) {
    return {
      conversationId: message.conversationId,
      message: toChatMessage(message),
    };
  }

  const deletedMessage = await updateChatMessageById(messageId, {
    deletedAt: new Date(),
    deletedById: actor.id,
  });

  const payload = {
    conversationId: deletedMessage.conversationId,
    message: toChatMessage(deletedMessage),
  };

  emitToUser(actor.id, "chat:message:deleted", payload);
  emitToUser(message.recipientId, "chat:message:deleted", payload);

  return payload;
}

export async function editChatMessageService(actor, messageId, payload) {
  const message = await findChatMessageById(messageId);

  if (!message) {
    throw new AppError("Message not found.", 404, "CHAT_MESSAGE_NOT_FOUND");
  }

  await resolveAuthorizedConversation(actor, message.conversation.id);

  if (message.senderId !== actor.id) {
    throw new AppError("Only the sender can edit this message.", 403, "CHAT_MESSAGE_EDIT_FORBIDDEN");
  }

  if (message.deletedAt) {
    throw new AppError("Deleted messages cannot be edited.", 422, "CHAT_MESSAGE_DELETED");
  }

  const content = normalizeText(payload?.content);
  if (!content) {
    throw new AppError("Message content is required.", 422, "CHAT_MESSAGE_CONTENT_REQUIRED");
  }

  if (content === message.content) {
    return {
      conversationId: message.conversationId,
      message: toChatMessage(message),
    };
  }

  const editedMessage = await updateChatMessageById(messageId, { content });
  const mappedMessage = toChatMessage(editedMessage);
  const eventPayload = {
    conversationId: editedMessage.conversationId,
    message: mappedMessage,
  };

  emitToUser(actor.id, "chat:message:edited", eventPayload);
  emitToUser(message.recipientId, "chat:message:edited", eventPayload);

  return eventPayload;
}

export async function clearConversationService(actor, conversationId) {
  const { conversation, contactMeta, contacts } = await resolveAuthorizedConversation(actor, conversationId);
  const clearedAt = new Date();

  const updatedConversation = await updateChatConversationById(
    conversationId,
    buildConversationParticipantUpdate(conversation, actor.id, { clearedAt }),
  );

  const unreadCount = await emitUnreadBadge(actor, contacts);
  const payload = {
    conversationId,
    clearedAt,
    unreadCount,
  };

  emitToUser(actor.id, "chat:conversation:cleared", payload);

  return {
    conversation: await buildConversationSummaryForActor(actor, updatedConversation, contactMeta),
    ...payload,
  };
}

export async function searchChatUsersService(actor, query) {
  const normalized = normalizeText(query).toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Map friendly role keywords so typing "doctor", "ta", "supervisor", "leader", "student" works
  const ROLE_KEYWORDS = {
    doctor: ROLES.DOCTOR,
    professor: ROLES.DOCTOR,
    supervisor: ROLES.DOCTOR,
    ta: ROLES.TA,
    teaching: ROLES.TA,
    assistant: ROLES.TA,
    leader: ROLES.LEADER,
    lead: ROLES.LEADER,
    student: ROLES.STUDENT,
    member: ROLES.STUDENT,
  };
  const STOPWORDS = new Set(["team", "the", "a", "an", "my", "assigned", "to", "for", "role", "account"]);

  // Determine which roles to search based on actor role
  let targetRoles = [];
  if (actor.role === ROLES.STUDENT || actor.role === ROLES.LEADER) {
    // Students/Leaders can message teammates, team doctor, and team TA
    targetRoles = [ROLES.STUDENT, ROLES.LEADER, ROLES.DOCTOR, ROLES.TA];
  } else if (actor.role === ROLES.DOCTOR || actor.role === ROLES.TA) {
    // Doctors/TAs can message team leaders and other staff
    targetRoles = [ROLES.DOCTOR, ROLES.TA, ROLES.LEADER, ROLES.STUDENT];
  } else if (actor.role === ROLES.ADMIN) {
    targetRoles = [ROLES.STUDENT, ROLES.LEADER, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN];
  } else {
    return [];
  }

  // Check if any word is a role keyword — if so, filter by that role
  const roleFilters = [...new Set(words.map((word) => ROLE_KEYWORDS[word]).filter(Boolean))];

  const effectiveRoles = roleFilters.length > 0
    ? targetRoles.filter((role) => roleFilters.includes(role))
    : targetRoles;

  // Non-role words are used for name/email/academicId matching
  const textWords = words.filter((word) => !ROLE_KEYWORDS[word] && !STOPWORDS.has(word));

  const whereConditions = [
    { id: { not: actor.id } },
    { role: { in: effectiveRoles } },
    ...(textWords.length > 0
      ? textWords.map((word) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
            { email: { contains: word, mode: "insensitive" } },
            { academicId: { contains: word, mode: "insensitive" } },
          ],
        }))
      : []),
  ];

  const users = await prisma.user.findMany({
    where: { AND: whereConditions },
    select: chatUserSelect,
    take: 30,
  });

  const contactMap = await getAllowedChatContactMap(actor);
  const allowedIds = new Set(contactMap.keys());
  const conversations = await listChatConversationsByUser(actor.id);
  const conversationIdByUserId = new Map(
    conversations
      .map((conversation) => [getConversationPeer(conversation, actor.id)?.id, conversation.id])
      .filter(([userId]) => Boolean(userId)),
  );

  return users
    .map((user) => {
      const contactMeta = contactMap.get(user.id);
      if (contactMeta) {
        return toContactResponse(contactMeta, conversationIdByUserId.get(user.id) ?? null);
      }

      const peerRelation = getPeerRelation(actor.role, user.role);
      if (!allowedIds.has(user.id) && !peerRelation) return null;

      return {
        user: toChatUser(user),
        relation: peerRelation,
        team: null,
        conversationId: conversationIdByUserId.get(user.id) ?? null,
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}
