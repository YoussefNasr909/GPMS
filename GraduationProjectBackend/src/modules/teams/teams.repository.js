import { prisma } from "../../loaders/dbLoader.js";

export const teamUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  accountStatus: true,
  academicId: true,
  department: true,
  academicYear: true,
  preferredTrack: true,
  avatarUrl: true,
  bio: true,
  linkedinUrl: true,
  githubUsername: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
};

export const teamSummarySelect = {
  id: true,
  name: true,
  bio: true,
  inviteCode: true,
  maxMembers: true,
  visibility: true,
  allowJoinRequests: true,
  stage: true,
  stack: true,
  createdAt: true,
  updatedAt: true,
  leader: { select: teamUserSelect },
  doctor: { select: teamUserSelect },
  ta: { select: teamUserSelect },
  _count: { select: { members: true } },
};

export const teamDetailSelect = {
  ...teamSummarySelect,
  members: {
    select: {
      id: true,
      joinedAt: true,
      user: { select: teamUserSelect },
    },
    orderBy: { joinedAt: "asc" },
  },
};

export const teamInvitationSelect = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  team: { select: teamSummarySelect },
  invitedUser: { select: teamUserSelect },
  invitedBy: { select: teamUserSelect },
};

export const teamJoinRequestSelect = {
  id: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  team: { select: teamSummarySelect },
  user: { select: teamUserSelect },
};

export const teamSupervisorRequestSelect = {
  id: true,
  supervisorRole: true,
  projectName: true,
  projectDescription: true,
  technologies: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
  team: { select: teamSummarySelect },
  supervisor: { select: teamUserSelect },
  requestedBy: { select: teamUserSelect },
};

export function findTeamById(id, tx = prisma) {
  return tx.team.findUnique({
    where: { id },
    select: teamDetailSelect,
  });
}

export function findTeamByLeaderId(leaderId, tx = prisma) {
  return tx.team.findUnique({
    where: { leaderId },
    select: teamDetailSelect,
  });
}

export function findTeamByInviteCode(inviteCode, tx = prisma) {
  return tx.team.findUnique({
    where: { inviteCode },
    select: teamDetailSelect,
  });
}

export function listTeams(where, tx = prisma) {
  return tx.team.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    select: teamSummarySelect,
  });
}

export function createTeam(data, tx = prisma) {
  return tx.team.create({
    data,
    select: teamDetailSelect,
  });
}

export function updateTeamById(id, data, tx = prisma) {
  return tx.team.update({
    where: { id },
    data,
    select: teamDetailSelect,
  });
}

export function deleteTeamById(id, tx = prisma) {
  return tx.team.delete({
    where: { id },
    select: teamDetailSelect,
  });
}

export function findTeamMemberByUserId(userId, tx = prisma) {
  return tx.teamMember.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      joinedAt: true,
      team: { select: teamDetailSelect },
    },
  });
}

export function createTeamMember(data, tx = prisma) {
  return tx.teamMember.create({
    data,
    select: {
      id: true,
      joinedAt: true,
      team: { select: teamDetailSelect },
      user: { select: teamUserSelect },
    },
  });
}

export function deleteTeamMemberByUserId(userId, tx = prisma) {
  return tx.teamMember.delete({
    where: { userId },
    select: {
      id: true,
      joinedAt: true,
      team: { select: teamDetailSelect },
      user: { select: teamUserSelect },
    },
  });
}

export function findTeamInvitationById(id, tx = prisma) {
  return tx.teamInvitation.findUnique({
    where: { id },
    select: teamInvitationSelect,
  });
}

export function listReceivedTeamInvitations(userId, tx = prisma) {
  return tx.teamInvitation.findMany({
    where: { invitedUserId: userId },
    orderBy: [{ createdAt: "desc" }],
    select: teamInvitationSelect,
  });
}

export function listTeamInvitations(teamId, tx = prisma) {
  return tx.teamInvitation.findMany({
    where: { teamId },
    orderBy: [{ createdAt: "desc" }],
    select: teamInvitationSelect,
  });
}

export function upsertTeamInvitation({ teamId, invitedUserId, invitedById }, tx = prisma) {
  return tx.teamInvitation.upsert({
    where: {
      teamId_invitedUserId: {
        teamId,
        invitedUserId,
      },
    },
    update: {
      invitedById,
      status: "PENDING",
    },
    create: {
      teamId,
      invitedUserId,
      invitedById,
      status: "PENDING",
    },
    select: teamInvitationSelect,
  });
}

export function updateTeamInvitationById(id, data, tx = prisma) {
  return tx.teamInvitation.update({
    where: { id },
    data,
    select: teamInvitationSelect,
  });
}

export function expireOtherPendingInvitations(userId, teamId, tx = prisma) {
  return tx.teamInvitation.updateMany({
    where: {
      invitedUserId: userId,
      status: "PENDING",
      teamId: { not: teamId },
    },
    data: {
      status: "EXPIRED",
    },
  });
}

export function expireInvitationForTeamUser(userId, teamId, nextStatus, tx = prisma) {
  return tx.teamInvitation.updateMany({
    where: {
      invitedUserId: userId,
      teamId,
      status: "PENDING",
    },
    data: {
      status: nextStatus,
    },
  });
}

export function findTeamJoinRequestById(id, tx = prisma) {
  return tx.teamJoinRequest.findUnique({
    where: { id },
    select: teamJoinRequestSelect,
  });
}

export function listTeamJoinRequests(teamId, tx = prisma) {
  return tx.teamJoinRequest.findMany({
    where: { teamId },
    orderBy: [{ createdAt: "desc" }],
    select: teamJoinRequestSelect,
  });
}

export function listUserJoinRequests(userId, tx = prisma) {
  return tx.teamJoinRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    select: teamJoinRequestSelect,
  });
}

export function upsertTeamJoinRequest({ teamId, userId, message }, tx = prisma) {
  return tx.teamJoinRequest.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    update: {
      message: message ?? null,
      status: "PENDING",
    },
    create: {
      teamId,
      userId,
      message: message ?? null,
      status: "PENDING",
    },
    select: teamJoinRequestSelect,
  });
}

export function updateTeamJoinRequestById(id, data, tx = prisma) {
  return tx.teamJoinRequest.update({
    where: { id },
    data,
    select: teamJoinRequestSelect,
  });
}

export function cancelOtherPendingJoinRequests(userId, teamId, tx = prisma) {
  return tx.teamJoinRequest.updateMany({
    where: {
      userId,
      status: "PENDING",
      teamId: { not: teamId },
    },
    data: {
      status: "CANCELLED",
    },
  });
}

export function completeJoinRequestsForTeamUser(userId, teamId, nextStatus, tx = prisma) {
  return tx.teamJoinRequest.updateMany({
    where: {
      userId,
      teamId,
      status: "PENDING",
    },
    data: {
      status: nextStatus,
    },
  });
}

export function findTeamSupervisorRequestById(id, tx = prisma) {
  return tx.teamSupervisorRequest.findUnique({
    where: { id },
    select: teamSupervisorRequestSelect,
  });
}

export function listTeamSupervisorRequests(teamId, tx = prisma) {
  return tx.teamSupervisorRequest.findMany({
    where: { teamId },
    orderBy: [{ createdAt: "desc" }],
    select: teamSupervisorRequestSelect,
  });
}

export function listSupervisorRequestsForSupervisor(supervisorId, tx = prisma) {
  return tx.teamSupervisorRequest.findMany({
    where: { supervisorId },
    orderBy: [{ createdAt: "desc" }],
    select: teamSupervisorRequestSelect,
  });
}

export function upsertTeamSupervisorRequest(
  {
    teamId,
    supervisorId,
    requestedById,
    supervisorRole,
    projectName,
    projectDescription,
    technologies,
  },
  tx = prisma,
) {
  return tx.teamSupervisorRequest.upsert({
    where: {
      teamId_supervisorId: {
        teamId,
        supervisorId,
      },
    },
    update: {
      requestedById,
      supervisorRole,
      projectName,
      projectDescription,
      technologies,
      status: "PENDING",
      respondedAt: null,
    },
    create: {
      teamId,
      supervisorId,
      requestedById,
      supervisorRole,
      projectName,
      projectDescription,
      technologies,
      status: "PENDING",
    },
    select: teamSupervisorRequestSelect,
  });
}

export function updateTeamSupervisorRequestById(id, data, tx = prisma) {
  return tx.teamSupervisorRequest.update({
    where: { id },
    data,
    select: teamSupervisorRequestSelect,
  });
}

export function cancelOtherPendingSupervisorRequests(teamId, supervisorRole, excludeRequestId, tx = prisma) {
  return tx.teamSupervisorRequest.updateMany({
    where: {
      teamId,
      supervisorRole,
      status: "PENDING",
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
    data: {
      status: "CANCELLED",
      respondedAt: new Date(),
    },
  });
}
