import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import { prisma } from "../../loaders/dbLoader.js";
import {
  findTeamGroupConversationById,
  listTeamGroupConversationsByParticipant,
  listTeamGroupMessagesByConversation,
  teamChatUserSelect,
} from "./team-chat.repository.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function toTeamChatUser(user) {
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

function toTeamGroupMessage(message) {
  if (!message) return null;

  return {
    id: message.id,
    conversationId: message.conversationId,
    content: message.content,
    senderId: message.senderId,
    sender: toTeamChatUser(message.sender),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function getParticipantRecord(conversation, userId) {
  return conversation.participants.find((participant) => participant.userId === userId) ?? null;
}

function getLatestDate(values) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps));
}

function getVisibleAfter(participant) {
  return getLatestDate([participant?.joinedAt, participant?.clearedAt]);
}

function getUnreadAfter(participant) {
  return getLatestDate([participant?.joinedAt, participant?.clearedAt, participant?.lastSeenAt]);
}

function isStudentTeamChatRole(role) {
  return role === ROLES.STUDENT || role === ROLES.LEADER;
}

async function countUnreadMessages(conversation, actorId, participant, tx = prisma) {
  const after = getUnreadAfter(participant);

  return tx.teamGroupMessage.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: actorId },
      ...(after ? { createdAt: { gt: after } } : {}),
    },
  });
}

async function buildConversationSummaryForActor(actor, conversation, tx = prisma) {
  const participant = getParticipantRecord(conversation, actor.id);

  if (!participant) {
    throw new AppError("You are not allowed to access this team chat.", 403, "TEAM_CHAT_FORBIDDEN");
  }

  const visibleAfter = getVisibleAfter(participant);
  const latestMessage = conversation.messages?.[0] ?? null;
  const visibleLastMessage =
    latestMessage && (!visibleAfter || new Date(latestMessage.createdAt).getTime() > visibleAfter.getTime())
      ? toTeamGroupMessage(latestMessage)
      : null;

  return {
    id: conversation.id,
    team: conversation.team,
    isPinned: true,
    lastMessage: visibleLastMessage,
    unreadCount: await countUnreadMessages(conversation, actor.id, participant, tx),
    participantCount: conversation.participants.length,
    clearedAt: participant.clearedAt ?? null,
    lastSeenAt: participant.lastSeenAt ?? null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

async function getAccessibleTeamIds(actor, tx = prisma) {
  if (actor.role === ROLES.LEADER) {
    const team = await tx.team.findUnique({
      where: { leaderId: actor.id },
      select: { id: true },
    });
    return team ? [team.id] : [];
  }

  if (actor.role === ROLES.STUDENT) {
    const membership = await tx.teamMember.findUnique({
      where: { userId: actor.id },
      select: { teamId: true },
    });
    return membership ? [membership.teamId] : [];
  }

  return [];
}

export async function syncTeamGroupConversationForTeam(teamId, tx = prisma) {
  const team = await tx.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      leader: {
        select: {
          id: true,
          role: true,
        },
      },
      members: {
        select: {
          userId: true,
          user: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  const conversation = await tx.teamGroupConversation.upsert({
    where: { teamId },
    update: {},
    create: { teamId },
    select: { id: true },
  });

  const expectedUserIds = [...new Set([
    isStudentTeamChatRole(team.leader?.role) ? team.leader.id : null,
    ...team.members
      .filter((member) => isStudentTeamChatRole(member.user?.role))
      .map((member) => member.userId),
  ].filter(Boolean))];

  const existingParticipants = await tx.teamGroupConversationParticipant.findMany({
    where: { conversationId: conversation.id },
    select: {
      userId: true,
    },
  });

  const existingUserIds = new Set(existingParticipants.map((participant) => participant.userId));
  const nextUserIdSet = new Set(expectedUserIds);
  const missingUserIds = expectedUserIds.filter((userId) => !existingUserIds.has(userId));
  const removedUserIds = existingParticipants
    .map((participant) => participant.userId)
    .filter((userId) => !nextUserIdSet.has(userId));

  if (missingUserIds.length) {
    await tx.teamGroupConversationParticipant.createMany({
      data: missingUserIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  if (removedUserIds.length) {
    await tx.teamGroupConversationParticipant.deleteMany({
      where: {
        conversationId: conversation.id,
        userId: { in: removedUserIds },
      },
    });
  }

  return conversation.id;
}

async function resolveAccessibleConversation(actor, conversationId, tx = prisma) {
  const existingConversation = await tx.teamGroupConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      teamId: true,
    },
  });

  if (!existingConversation) {
    throw new AppError("Team chat not found.", 404, "TEAM_CHAT_NOT_FOUND");
  }

  await syncTeamGroupConversationForTeam(existingConversation.teamId, tx);

  const conversation = await findTeamGroupConversationById(conversationId, tx);
  if (!conversation) {
    throw new AppError("Team chat not found.", 404, "TEAM_CHAT_NOT_FOUND");
  }

  const participant = getParticipantRecord(conversation, actor.id);
  if (!participant) {
    throw new AppError("You are not allowed to access this team chat.", 403, "TEAM_CHAT_FORBIDDEN");
  }

  return {
    conversation,
    participant,
  };
}

function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.lastMessage?.createdAt ?? left.updatedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.lastMessage?.createdAt ?? right.updatedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

export async function getTeamGroupChatBootstrapService(actor) {
  const teamIds = await getAccessibleTeamIds(actor);
  if (!teamIds.length) {
    return { conversations: [] };
  }

  await Promise.all(teamIds.map((teamId) => syncTeamGroupConversationForTeam(teamId)));

  const conversations = await listTeamGroupConversationsByParticipant(actor.id, teamIds);
  const summaries = await Promise.all(
    conversations.map((conversation) => buildConversationSummaryForActor(actor, conversation)),
  );

  return {
    conversations: sortConversations(summaries),
  };
}

export async function getTeamGroupConversationMessagesService(actor, conversationId) {
  const { conversation, participant } = await resolveAccessibleConversation(actor, conversationId);
  const visibleAfter = getVisibleAfter(participant);
  const messages = await listTeamGroupMessagesByConversation(conversationId, visibleAfter);

  return {
    conversation: await buildConversationSummaryForActor(actor, conversation),
    messages: messages.map(toTeamGroupMessage),
  };
}

export async function sendTeamGroupMessageService(actor, conversationId, payload) {
  const content = normalizeText(payload.content);
  if (!content) {
    throw new AppError("Message content cannot be empty.", 422, "TEAM_CHAT_MESSAGE_EMPTY");
  }

  return prisma.$transaction(async (tx) => {
    const { conversation } = await resolveAccessibleConversation(actor, conversationId, tx);

    const message = await tx.teamGroupMessage.create({
      data: {
        conversationId,
        senderId: actor.id,
        content,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        sender: { select: teamChatUserSelect },
      },
    });

    await tx.teamGroupConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    const refreshedConversation = await findTeamGroupConversationById(conversationId, tx);

    return {
      conversation: await buildConversationSummaryForActor(actor, refreshedConversation, tx),
      message: toTeamGroupMessage(message),
    };
  });
}

export async function markTeamGroupConversationSeenService(actor, conversationId) {
  return prisma.$transaction(async (tx) => {
    const { conversation } = await resolveAccessibleConversation(actor, conversationId, tx);
    const seenAt = new Date();

    await tx.teamGroupConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: actor.id,
        },
      },
      data: {
        lastSeenAt: seenAt,
      },
    });

    const refreshedConversation = await findTeamGroupConversationById(conversationId, tx);
    return {
      conversation: await buildConversationSummaryForActor(actor, refreshedConversation, tx),
    };
  });
}
