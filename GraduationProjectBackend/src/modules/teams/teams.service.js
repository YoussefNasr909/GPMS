import crypto from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../loaders/dbLoader.js";
import { ACCOUNT_STATUSES } from "../../common/constants/accountStatuses.js";
import { ROLES } from "../../common/constants/roles.js";
import { TEAM_INVITATION_STATUSES } from "../../common/constants/teamInvitationStatuses.js";
import { TEAM_JOIN_REQUEST_STATUSES } from "../../common/constants/teamJoinRequestStatuses.js";
import { TEAM_SUPERVISOR_REQUEST_STATUSES } from "../../common/constants/teamSupervisorRequestStatuses.js";
import { TEAM_VISIBILITIES } from "../../common/constants/teamVisibilities.js";
import {
  cancelOtherPendingSupervisorRequests,
  cancelOtherPendingJoinRequests,
  completeJoinRequestsForTeamUser,
  createTeam,
  createTeamMember,
  deleteTeamById,
  deleteTeamMemberByUserId,
  expireInvitationForTeamUser,
  expireOtherPendingInvitations,
  findTeamById,
  findTeamByInviteCode,
  findTeamByLeaderId,
  findTeamInvitationById,
  findTeamJoinRequestById,
  findTeamMemberByUserId,
  findTeamSupervisorRequestById,
  listReceivedTeamInvitations,
  listSupervisorRequestsForSupervisor,
  listTeamInvitations,
  listTeamJoinRequests,
  listTeamSupervisorRequests,
  listTeams,
  listUserJoinRequests,
  teamSummarySelect,
  updateTeamById,
  updateTeamInvitationById,
  updateTeamJoinRequestById,
  updateTeamSupervisorRequestById,
  upsertTeamInvitation,
  upsertTeamJoinRequest,
  upsertTeamSupervisorRequest,
} from "./teams.repository.js";
import { findUserByAcademicId, findUserByEmail, findUserById } from "../users/users.repository.js";
import { sendTeamInvitationEmail } from "../../common/utils/mailer.js";
import { notify } from "../../common/utils/notify.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeStack(stack = []) {
  return [...new Set(stack.map((item) => normalizeText(item)).filter(Boolean))];
}

function normalizeSearchValue(value) {
  return normalizeText(value).toLowerCase();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function getMatchWeight(value, search) {
  const normalizedValue = normalizeSearchValue(value);
  if (!normalizedValue || !search) return 0;
  if (normalizedValue === search) return 120;
  if (normalizedValue.startsWith(search)) return 96;
  if (normalizedValue.includes(search)) return 72;
  return 0;
}

function getTeamSearchScore(team, search) {
  const normalizedSearch = normalizeSearchValue(search);
  if (!normalizedSearch) return 0;

  const teamName = normalizeSearchValue(team.name);
  const bio = normalizeSearchValue(team.bio);
  const teamNameWeight = getMatchWeight(teamName, normalizedSearch);
  const bioWeight = getMatchWeight(bio, normalizedSearch);

  return Math.max(teamNameWeight > 0 ? teamNameWeight + 180 : 0, bioWeight > 0 ? bioWeight + 80 : 0);
}

function compareTeams(left, right, search) {
  const scoreDelta = getTeamSearchScore(right, search) - getTeamSearchScore(left, search);
  if (scoreDelta !== 0) return scoreDelta;

  const nameDelta = left.name.localeCompare(right.name);
  if (nameDelta !== 0) return nameDelta;

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function toUserSummary(user) {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: buildFullName(user),
    email: user.email,
    role: user.role,
    academicId: user.academicId ?? null,
    department: user.department ?? null,
    academicYear: user.academicYear ?? null,
    preferredTrack: user.preferredTrack ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    linkedinUrl: user.linkedinUrl ?? null,
    githubUsername: user.githubUsername ?? null,
    isEmailVerified: Boolean(user.isEmailVerified),
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getCurrentMemberCount(team) {
  return 1 + (team?._count?.members ?? team?.members?.length ?? 0);
}

function teamHasSpace(team) {
  return getCurrentMemberCount(team) < team.maxMembers;
}

async function getUserTeamContext(userId) {
  const ledTeam = await findTeamByLeaderId(userId);
  if (ledTeam) {
    return {
      team: ledTeam,
      teamRole: "LEADER",
      isLeader: true,
      isMember: true,
    };
  }

  const membership = await findTeamMemberByUserId(userId);
  if (membership) {
    return {
      team: membership.team,
      teamRole: "MEMBER",
      isLeader: false,
      isMember: true,
      membershipId: membership.id,
    };
  }

  return {
    team: null,
    teamRole: null,
    isLeader: false,
    isMember: false,
    membershipId: null,
  };
}

async function generateUniqueInviteCode(name) {
  const base = normalizeText(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6) || "TEAM";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const inviteCode = `${base}-${suffix}`;
    const existing = await findTeamByInviteCode(inviteCode);
    if (!existing) return inviteCode;
  }

  throw new AppError("Could not generate a unique invite code. Please try again.", 500, "INVITE_CODE_FAILED");
}

function assertStudentRole(actor) {
  if (actor.role !== ROLES.STUDENT) {
    throw new AppError("Only students can perform this action.", 403, "STUDENT_ONLY");
  }
}

function assertLeaderRole(actor) {
  if (actor.role !== ROLES.LEADER) {
    throw new AppError("Only team leaders can perform this action.", 403, "LEADER_ONLY");
  }
}

function assertActiveStudentUser(user) {
  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  if (user.role === ROLES.LEADER) {
    throw new AppError(
      "This user is already a team leader. Ask them to switch to Student Member before sending an invitation.",
      409,
      "INVITE_TARGET_LEADER"
    );
  }

  if (user.role !== ROLES.STUDENT) {
    throw new AppError("Only Student Member accounts can be invited to a team.", 409, "INVITE_TARGET_NOT_STUDENT");
  }

  if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError("Only active student accounts can be invited to a team.", 409, "INVITE_TARGET_INACTIVE");
  }
}

function isSupervisorRole(role) {
  return role === ROLES.DOCTOR || role === ROLES.TA;
}

function getSupervisorRoleLabel(role) {
  return role === ROLES.DOCTOR ? "doctor" : "teaching assistant";
}

function assertActiveSupervisorUser(user) {
  if (!user) {
    throw new AppError("Supervisor not found.", 404, "SUPERVISOR_NOT_FOUND");
  }

  if (!isSupervisorRole(user.role)) {
    throw new AppError(
      "You can only request supervision from doctor or TA accounts.",
      409,
      "SUPERVISOR_TARGET_INVALID_ROLE",
    );
  }

  if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError("Only active supervisor accounts can receive requests.", 409, "SUPERVISOR_TARGET_INACTIVE");
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      "Only verified supervisor accounts can receive requests.",
      409,
      "SUPERVISOR_TARGET_UNVERIFIED",
    );
  }
}

function assertTeamExists(team) {
  if (!team) {
    throw new AppError("Team not found.", 404, "TEAM_NOT_FOUND");
  }
}

function assertCanManageTeam(team, actor) {
  assertTeamExists(team);
  const canManage = actor.role === ROLES.ADMIN || team.leader.id === actor.id;
  if (!canManage) {
    throw new AppError("You are not allowed to manage this team.", 403, "TEAM_MANAGE_FORBIDDEN");
  }
}

function assertCanViewTeam(team, actor, { hasPendingInvitation = false, hasPendingRequest = false } = {}) {
  assertTeamExists(team);

  if (team.visibility === TEAM_VISIBILITIES.PUBLIC) return;

  const isStaff = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.TA].includes(actor.role);
  const isLeader = team.leader.id === actor.id;
  const isMember = team.members.some((member) => member.user.id === actor.id);

  if (isStaff || isLeader || isMember || hasPendingInvitation || hasPendingRequest) return;

  throw new AppError("This private team is not available to you.", 403, "TEAM_VIEW_FORBIDDEN");
}

function assertTeamHasCapacity(team) {
  if (!teamHasSpace(team)) {
    throw new AppError("This team is already full.", 409, "TEAM_FULL");
  }
}

async function assertStudentHasNoTeam(userId) {
  const context = await getUserTeamContext(userId);
  if (context.team) {
    throw new AppError("You are already part of a team.", 409, "ALREADY_IN_TEAM");
  }
}

async function cleanupAfterMembershipJoin(userId, teamId, tx) {
  await Promise.all([
    expireOtherPendingInvitations(userId, teamId, tx),
    cancelOtherPendingJoinRequests(userId, teamId, tx),
  ]);
}

function toTeamSummary(team, actor, options = {}) {
  const memberCount = getCurrentMemberCount(team);
  const isFull = memberCount >= team.maxMembers;
  const isLeader = actor ? team.leader.id === actor.id : false;
  const isMember = actor ? isLeader || team.members?.some((member) => member.user.id === actor.id) : false;
  const hasPendingInvitation = Boolean(options.hasPendingInvitation);
  const hasPendingRequest = Boolean(options.hasPendingRequest);
  const canManage = Boolean(actor) && (actor.role === ROLES.ADMIN || isLeader);
  const includeInviteCode = Boolean(options.includeInviteCode);

  return {
    id: team.id,
    name: team.name,
    bio: team.bio,
    inviteCode: includeInviteCode ? team.inviteCode : null,
    maxMembers: team.maxMembers,
    memberCount,
    slotsRemaining: Math.max(team.maxMembers - memberCount, 0),
    visibility: team.visibility,
    allowJoinRequests: team.allowJoinRequests,
    stage: team.stage,
    stack: team.stack,
    isFull,
    isJoinable:
      actor?.role === ROLES.STUDENT &&
      !isMember &&
      !isFull &&
      team.visibility === TEAM_VISIBILITIES.PUBLIC &&
      team.allowJoinRequests &&
      !hasPendingInvitation &&
      !hasPendingRequest,
    hasPendingInvitation,
    hasPendingRequest,
    isMember,
    canManage,
    leader: toUserSummary(team.leader),
    doctor: toUserSummary(team.doctor),
    ta: toUserSummary(team.ta),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

function toTeamDetail(team, actor, options = {}) {
  const summary = toTeamSummary(team, actor, options);
  const isLeader = Boolean(actor) && team.leader.id === actor.id;
  const isMember = Boolean(actor) && summary.isMember;

  return {
    ...summary,
    members: [
      {
        id: team.leader.id,
        joinedAt: team.createdAt,
        teamRole: "LEADER",
        user: toUserSummary(team.leader),
      },
      ...team.members.map((member) => ({
        id: member.id,
        joinedAt: member.joinedAt,
        teamRole: "MEMBER",
        user: toUserSummary(member.user),
      })),
    ],
    permissions: {
      canManage: summary.canManage,
      canLeave: actor?.role === ROLES.STUDENT && isMember && !isLeader,
      canJoinByCode: actor?.role === ROLES.STUDENT && !isMember && !summary.isFull,
      canRequestToJoin:
        actor?.role === ROLES.STUDENT &&
        !isMember &&
        team.visibility === TEAM_VISIBILITIES.PUBLIC &&
        team.allowJoinRequests &&
        !summary.hasPendingInvitation &&
        !summary.hasPendingRequest &&
        !summary.isFull,
      canInviteMembers: summary.canManage,
      canRemoveMembers: summary.canManage,
    },
  };
}

function toInvitationResponse(invitation, actor, options = {}) {
  return {
    id: invitation.id,
    status: invitation.status,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    team: toTeamSummary(invitation.team, actor, {
      includeInviteCode: Boolean(options.includeInviteCode),
    }),
    invitedUser: toUserSummary(invitation.invitedUser),
    invitedBy: toUserSummary(invitation.invitedBy),
  };
}

function toJoinRequestResponse(joinRequest, actor) {
  return {
    id: joinRequest.id,
    message: joinRequest.message ?? null,
    status: joinRequest.status,
    createdAt: joinRequest.createdAt,
    updatedAt: joinRequest.updatedAt,
    team: toTeamSummary(joinRequest.team, actor),
    user: toUserSummary(joinRequest.user),
  };
}

function toSupervisorRequestResponse(supervisorRequest, actor) {
  return {
    id: supervisorRequest.id,
    supervisorRole: supervisorRequest.supervisorRole,
    projectName: supervisorRequest.projectName,
    projectDescription: supervisorRequest.projectDescription,
    technologies: supervisorRequest.technologies ?? [],
    status: supervisorRequest.status,
    respondedAt: supervisorRequest.respondedAt ?? null,
    createdAt: supervisorRequest.createdAt,
    updatedAt: supervisorRequest.updatedAt,
    team: toTeamSummary(supervisorRequest.team, actor),
    supervisor: toUserSummary(supervisorRequest.supervisor),
    requestedBy: toUserSummary(supervisorRequest.requestedBy),
  };
}

function buildTeamsWhere({ search, stage, visibility, actor }) {
  const where = {};
  const normalizedSearch = normalizeText(search);

  if (normalizedSearch) {
    where.OR = [
      { name: { contains: normalizedSearch, mode: "insensitive" } },
      { bio: { contains: normalizedSearch, mode: "insensitive" } },
    ];
  }

  if (stage) where.stage = stage;

  if ([ROLES.ADMIN, ROLES.DOCTOR, ROLES.TA].includes(actor.role)) {
    if (visibility) where.visibility = visibility;
  } else {
    where.visibility = TEAM_VISIBILITIES.PUBLIC;
  }

  return where;
}

async function listSupervisedTeamsForActor(actor) {
  if (!isSupervisorRole(actor.role)) return [];

  const where = actor.role === ROLES.DOCTOR ? { doctorId: actor.id } : { taId: actor.id };
  const teams = await prisma.team.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    select: teamSummarySelect,
  });

  return teams.map((team) => toTeamSummary(team, actor));
}

function paginate(items, page, limit) {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    items: items.slice(start, end),
  };
}

async function getPendingStateMaps(userId) {
  const [invitations, joinRequests] = await Promise.all([
    listReceivedTeamInvitations(userId),
    listUserJoinRequests(userId),
  ]);

  return {
    invitationTeamIds: new Set(
      invitations
        .filter((item) => item.status === TEAM_INVITATION_STATUSES.PENDING)
        .map((item) => item.team.id),
    ),
    joinRequestTeamIds: new Set(
      joinRequests
        .filter((item) => item.status === TEAM_JOIN_REQUEST_STATUSES.PENDING)
        .map((item) => item.team.id),
    ),
  };
}

export async function listTeamsService(actor, { page, limit, search, stage, visibility, availability }) {
  const teamContext = await getUserTeamContext(actor.id);
  const pendingMaps = actor.role === ROLES.STUDENT ? await getPendingStateMaps(actor.id) : null;
  const rawTeams = await listTeams(buildTeamsWhere({ search, stage, visibility, actor }));
  const normalizedSearch = normalizeText(search);

  const annotated = rawTeams
    .map((team) =>
      toTeamSummary(team, actor, {
        hasPendingInvitation: pendingMaps?.invitationTeamIds.has(team.id),
        hasPendingRequest: pendingMaps?.joinRequestTeamIds.has(team.id),
      }),
    )
    .filter((team) => {
      if (availability === "open") return !team.isFull;
      if (availability === "full") return team.isFull;
      return true;
    })
    .map((team) => ({
      ...team,
      alreadyInAnotherTeam: Boolean(teamContext.team) && !team.isMember,
    }));

  if (normalizedSearch) {
    annotated.sort((left, right) => compareTeams(left, right, normalizedSearch));
  }

  return paginate(annotated, page, limit);
}

export async function getMyTeamStateService(actor) {
  const context = await getUserTeamContext(actor.id);

  if (context.team) {
    const [sentInvitations, joinRequests, supervisorRequests] = context.isLeader
      ? await Promise.all([
          listTeamInvitations(context.team.id),
          listTeamJoinRequests(context.team.id),
          listTeamSupervisorRequests(context.team.id),
        ])
      : [[], [], []];

    return {
      teamRole: context.teamRole,
      team: toTeamDetail(context.team, actor, {
        includeInviteCode: context.isLeader || actor.role === ROLES.ADMIN,
      }),
      receivedInvitations: [],
      sentInvitations: sentInvitations
        .filter((item) => item.status === TEAM_INVITATION_STATUSES.PENDING)
        .map((item) => toInvitationResponse(item, actor, { includeInviteCode: true })),
      joinRequests: joinRequests
        .filter((item) => item.status === TEAM_JOIN_REQUEST_STATUSES.PENDING)
        .map((item) => toJoinRequestResponse(item, actor)),
      myJoinRequests: [],
      supervisorRequestsSent: supervisorRequests.map((item) => toSupervisorRequestResponse(item, actor)),
      supervisorRequestsReceived: [],
      supervisedTeams: [],
    };
  }

  const [receivedInvitations, myJoinRequests, supervisorRequestsReceived, supervisedTeams] = await Promise.all([
    actor.role === ROLES.STUDENT ? listReceivedTeamInvitations(actor.id) : Promise.resolve([]),
    actor.role === ROLES.STUDENT ? listUserJoinRequests(actor.id) : Promise.resolve([]),
    isSupervisorRole(actor.role) ? listSupervisorRequestsForSupervisor(actor.id) : Promise.resolve([]),
    listSupervisedTeamsForActor(actor),
  ]);

  return {
    teamRole: null,
    team: null,
    receivedInvitations: receivedInvitations
      .filter((item) => item.status === TEAM_INVITATION_STATUSES.PENDING)
      .map((item) => toInvitationResponse(item, actor)),
    sentInvitations: [],
    joinRequests: [],
    myJoinRequests: myJoinRequests
      .filter((item) => item.status === TEAM_JOIN_REQUEST_STATUSES.PENDING)
      .map((item) => toJoinRequestResponse(item, actor)),
    supervisorRequestsSent: [],
    supervisorRequestsReceived: supervisorRequestsReceived.map((item) => toSupervisorRequestResponse(item, actor)),
    supervisedTeams,
  };
}

export async function getTeamByIdService(actor, teamId) {
  const team = await findTeamById(teamId);
  assertTeamExists(team);

  let hasPendingInvitation = false;
  let hasPendingRequest = false;

  if (actor.role === ROLES.STUDENT) {
    const [receivedInvitations, myJoinRequests] = await Promise.all([
      listReceivedTeamInvitations(actor.id),
      listUserJoinRequests(actor.id),
    ]);

    hasPendingInvitation = receivedInvitations.some(
      (item) => item.team.id === teamId && item.status === TEAM_INVITATION_STATUSES.PENDING,
    );
    hasPendingRequest = myJoinRequests.some(
      (item) => item.team.id === teamId && item.status === TEAM_JOIN_REQUEST_STATUSES.PENDING,
    );
  }

  assertCanViewTeam(team, actor, { hasPendingInvitation, hasPendingRequest });

  return toTeamDetail(team, actor, {
    hasPendingInvitation,
    hasPendingRequest,
    includeInviteCode: team.leader.id === actor.id || actor.role === ROLES.ADMIN,
  });
}

export async function createTeamService(actor, payload) {
  assertLeaderRole(actor);
  await assertStudentHasNoTeam(actor.id);

  const existingLeaderTeam = await findTeamByLeaderId(actor.id);
  if (existingLeaderTeam) {
    throw new AppError("Team leaders can only create one team.", 409, "LEADER_ALREADY_HAS_TEAM");
  }

  const inviteCode = await generateUniqueInviteCode(payload.name);
  const team = await createTeam({
    name: normalizeText(payload.name),
    bio: normalizeText(payload.bio),
    leaderId: actor.id,
    inviteCode,
    maxMembers: payload.maxMembers,
    visibility: payload.visibility,
    allowJoinRequests: payload.allowJoinRequests ?? true,
    stage: payload.stage ?? "REQUIREMENTS",
    stack: normalizeStack(payload.stack),
  });

  return toTeamDetail(team, actor, {
    includeInviteCode: true,
  });
}

export async function updateTeamService(actor, teamId, payload) {
  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);

  const updateData = {};

  if (payload.name !== undefined) updateData.name = normalizeText(payload.name);
  if (payload.bio !== undefined) updateData.bio = normalizeText(payload.bio);
  if (payload.maxMembers !== undefined) updateData.maxMembers = payload.maxMembers;
  if (payload.visibility !== undefined) updateData.visibility = payload.visibility;
  if (payload.allowJoinRequests !== undefined) updateData.allowJoinRequests = payload.allowJoinRequests;
  if (payload.stage !== undefined) updateData.stage = payload.stage;
  if (payload.stack !== undefined) updateData.stack = normalizeStack(payload.stack);

  if (updateData.maxMembers !== undefined && updateData.maxMembers < getCurrentMemberCount(team)) {
    throw new AppError(
      "Max members cannot be smaller than the current team size.",
      409,
      "MAX_MEMBERS_BELOW_CURRENT_SIZE",
    );
  }

  const updated = await updateTeamById(teamId, updateData);
  return toTeamDetail(updated, actor, {
    includeInviteCode: true,
  });
}

export async function deleteTeamService(actor, teamId) {
  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);
  const deleted = await deleteTeamById(teamId);
  return toTeamDetail(deleted, actor, {
    includeInviteCode: true,
  });
}

export async function joinTeamByCodeService(actor, inviteCode) {
  assertStudentRole(actor);
  await assertStudentHasNoTeam(actor.id);

  const normalizedCode = normalizeText(inviteCode).toUpperCase();
  const team = await findTeamByInviteCode(normalizedCode);
  assertTeamExists(team);
  assertTeamHasCapacity(team);

  return prisma.$transaction(async (tx) => {
    await createTeamMember(
      {
        teamId: team.id,
        userId: actor.id,
      },
      tx,
    );

    await Promise.all([
      expireInvitationForTeamUser(actor.id, team.id, TEAM_INVITATION_STATUSES.ACCEPTED, tx),
      completeJoinRequestsForTeamUser(actor.id, team.id, TEAM_JOIN_REQUEST_STATUSES.APPROVED, tx),
      cleanupAfterMembershipJoin(actor.id, team.id, tx),
    ]);

    const updatedTeam = await findTeamById(team.id, tx);
    return toTeamDetail(updatedTeam, actor);
  });
}

export async function createJoinRequestService(actor, teamId, payload) {
  assertStudentRole(actor);
  await assertStudentHasNoTeam(actor.id);

  const team = await findTeamById(teamId);
  assertTeamExists(team);

  if (team.visibility !== TEAM_VISIBILITIES.PUBLIC || !team.allowJoinRequests) {
    throw new AppError("This team is not accepting join requests.", 409, "JOIN_REQUESTS_DISABLED");
  }

  const receivedInvitations = await listReceivedTeamInvitations(actor.id);
  const hasPendingInvitation = receivedInvitations.some(
    (invitation) => invitation.team.id === team.id && invitation.status === TEAM_INVITATION_STATUSES.PENDING,
  );

  if (hasPendingInvitation) {
    throw new AppError(
      "You already have a pending invitation from this team. Review it from My Team instead of sending a join request.",
      409,
      "TEAM_INVITATION_ALREADY_PENDING",
    );
  }

  assertTeamHasCapacity(team);

  const joinRequest = await upsertTeamJoinRequest({
    teamId,
    userId: actor.id,
    message: normalizeText(payload.message) || null,
  });

  // Notify the team leader that someone wants to join
  await notify({
    userId: team.leader.id,
    type: "TEAM_JOIN_REQUEST_RECEIVED",
    title: "New Join Request",
    message: `${buildFullName(joinRequest.user)} wants to join your team "${team.name}".`,
    actionUrl: "/dashboard/my-team",
  });

  return toJoinRequestResponse(joinRequest, actor);
}

export async function approveJoinRequestService(actor, joinRequestId) {
  const joinRequest = await findTeamJoinRequestById(joinRequestId);
  if (!joinRequest) {
    throw new AppError("Join request not found.", 404, "JOIN_REQUEST_NOT_FOUND");
  }

  assertCanManageTeam(joinRequest.team, actor);

  if (joinRequest.status !== TEAM_JOIN_REQUEST_STATUSES.PENDING) {
    throw new AppError("Only pending join requests can be approved.", 409, "JOIN_REQUEST_NOT_PENDING");
  }

  assertTeamHasCapacity(joinRequest.team);
  await assertStudentHasNoTeam(joinRequest.user.id);

  return prisma.$transaction(async (tx) => {
    await createTeamMember(
      {
        teamId: joinRequest.team.id,
        userId: joinRequest.user.id,
      },
      tx,
    );

    const updatedRequest = await updateTeamJoinRequestById(
      joinRequest.id,
      { status: TEAM_JOIN_REQUEST_STATUSES.APPROVED },
      tx,
    );

    await Promise.all([
      expireInvitationForTeamUser(joinRequest.user.id, joinRequest.team.id, TEAM_INVITATION_STATUSES.ACCEPTED, tx),
      cleanupAfterMembershipJoin(joinRequest.user.id, joinRequest.team.id, tx),
    ]);

    // Notify the student their join request was approved
    await notify({
      userId: joinRequest.user.id,
      type: "TEAM_JOIN_REQUEST_APPROVED",
      title: "Join Request Approved",
      message: `Your request to join "${joinRequest.team.name}" has been approved. Welcome to the team!`,
      actionUrl: "/dashboard/my-team",
    });

    return toJoinRequestResponse(updatedRequest, actor);
  });
}

export async function rejectJoinRequestService(actor, joinRequestId) {
  const joinRequest = await findTeamJoinRequestById(joinRequestId);
  if (!joinRequest) {
    throw new AppError("Join request not found.", 404, "JOIN_REQUEST_NOT_FOUND");
  }

  assertCanManageTeam(joinRequest.team, actor);

  if (joinRequest.status !== TEAM_JOIN_REQUEST_STATUSES.PENDING) {
    throw new AppError("Only pending join requests can be rejected.", 409, "JOIN_REQUEST_NOT_PENDING");
  }

  const updated = await updateTeamJoinRequestById(joinRequest.id, {
    status: TEAM_JOIN_REQUEST_STATUSES.REJECTED,
  });

  // Notify the student their join request was rejected
  await notify({
    userId: joinRequest.user.id,
    type: "TEAM_JOIN_REQUEST_REJECTED",
    title: "Join Request Declined",
    message: `Your request to join "${joinRequest.team.name}" was not approved.`,
    actionUrl: "/dashboard/teams",
  });

  return toJoinRequestResponse(updated, actor);
}

export async function createInvitationService(actor, teamId, payload) {
  assertLeaderRole(actor);

  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);
  assertTeamHasCapacity(team);

  const inviteTarget =
    payload.email !== undefined
      ? await findUserByEmail(normalizeEmail(payload.email))
      : await findUserByAcademicId(normalizeText(payload.academicId));

  assertActiveStudentUser(inviteTarget);

  if (inviteTarget.id === actor.id) {
    throw new AppError("You cannot invite yourself to your team.", 409, "SELF_INVITE_FORBIDDEN");
  }

  const existingTeamContext = await getUserTeamContext(inviteTarget.id);
  if (existingTeamContext.team) {
    throw new AppError("This student is already in a team.", 409, "INVITE_TARGET_ALREADY_IN_TEAM");
  }

  const invitation = await upsertTeamInvitation({
    teamId,
    invitedUserId: inviteTarget.id,
    invitedById: actor.id,
  });

  try {
    await sendTeamInvitationEmail({
      to: inviteTarget.email,
      teamName: team.name,
      leaderName: buildFullName(team.leader),
      inviteCode: team.inviteCode,
    });
  } catch (error) {
    console.error("SEND_TEAM_INVITATION_EMAIL_FAILED:", error?.message ?? error);
  }

  // Notify the invited student in-app
  await notify({
    userId: inviteTarget.id,
    type: "TEAM_INVITE_RECEIVED",
    title: "Team Invitation",
    message: `You have been invited to join "${team.name}" by ${buildFullName(team.leader)}.`,
    actionUrl: "/dashboard/my-team",
  });

  return toInvitationResponse(invitation, actor, {
    includeInviteCode: true,
  });
}

export async function createSupervisorRequestService(actor, teamId, payload) {
  assertLeaderRole(actor);

  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);

  const supervisor = await findUserById(payload.supervisorId);
  assertActiveSupervisorUser(supervisor);

  const supervisorRole = supervisor.role;
  const assignedSupervisor = supervisorRole === ROLES.DOCTOR ? team.doctor : team.ta;
  const roleLabel = getSupervisorRoleLabel(supervisorRole);

  if (assignedSupervisor?.id === supervisor.id) {
    throw new AppError(
      `This ${roleLabel} is already assigned to your team.`,
      409,
      "SUPERVISOR_ALREADY_ASSIGNED",
    );
  }

  if (assignedSupervisor && assignedSupervisor.id !== supervisor.id) {
    throw new AppError(
      `Your team already has an assigned ${roleLabel}.`,
      409,
      "SUPERVISOR_SLOT_FILLED",
    );
  }

  const existingRequests = await listTeamSupervisorRequests(team.id);
  const hasPendingRequestForRole = existingRequests.some(
    (item) =>
      item.supervisorRole === supervisorRole &&
      item.status === TEAM_SUPERVISOR_REQUEST_STATUSES.PENDING &&
      item.supervisor.id !== supervisor.id,
  );

  if (hasPendingRequestForRole) {
    throw new AppError(
      `Resolve the current pending ${roleLabel} request before sending another one.`,
      409,
      "SUPERVISOR_REQUEST_ALREADY_PENDING",
    );
  }

  const supervisorRequest = await upsertTeamSupervisorRequest({
    teamId: team.id,
    supervisorId: supervisor.id,
    requestedById: actor.id,
    supervisorRole,
    projectName: normalizeText(payload.projectName),
    projectDescription: normalizeText(payload.projectDescription),
    technologies: normalizeStack(payload.technologies),
  });

  // Notify the supervisor they received a supervision request
  await notify({
    userId: supervisor.id,
    type: "SUPERVISOR_REQUEST_RECEIVED",
    title: "New Supervision Request",
    message: `Team "${team.name}" is requesting you as their ${getSupervisorRoleLabel(supervisorRole)}.`,
    actionUrl: "/dashboard/my-team",
  });

  return toSupervisorRequestResponse(supervisorRequest, actor);
}

export async function acceptInvitationService(actor, invitationId) {
  assertStudentRole(actor);
  await assertStudentHasNoTeam(actor.id);

  const invitation = await findTeamInvitationById(invitationId);
  if (!invitation) {
    throw new AppError("Invitation not found.", 404, "INVITATION_NOT_FOUND");
  }

  if (invitation.invitedUser.id !== actor.id) {
    throw new AppError("You are not allowed to accept this invitation.", 403, "INVITATION_FORBIDDEN");
  }

  if (invitation.status !== TEAM_INVITATION_STATUSES.PENDING) {
    throw new AppError("Only pending invitations can be accepted.", 409, "INVITATION_NOT_PENDING");
  }

  assertTeamHasCapacity(invitation.team);

  return prisma.$transaction(async (tx) => {
    await createTeamMember(
      {
        teamId: invitation.team.id,
        userId: actor.id,
      },
      tx,
    );

    const updatedInvitation = await updateTeamInvitationById(
      invitation.id,
      { status: TEAM_INVITATION_STATUSES.ACCEPTED },
      tx,
    );

    await Promise.all([
      completeJoinRequestsForTeamUser(actor.id, invitation.team.id, TEAM_JOIN_REQUEST_STATUSES.APPROVED, tx),
      cleanupAfterMembershipJoin(actor.id, invitation.team.id, tx),
    ]);

    return toInvitationResponse(updatedInvitation, actor, {
      includeInviteCode: true,
    });
  });
}

export async function declineInvitationService(actor, invitationId) {
  assertStudentRole(actor);

  const invitation = await findTeamInvitationById(invitationId);
  if (!invitation) {
    throw new AppError("Invitation not found.", 404, "INVITATION_NOT_FOUND");
  }

  if (invitation.invitedUser.id !== actor.id) {
    throw new AppError("You are not allowed to decline this invitation.", 403, "INVITATION_FORBIDDEN");
  }

  if (invitation.status !== TEAM_INVITATION_STATUSES.PENDING) {
    throw new AppError("Only pending invitations can be declined.", 409, "INVITATION_NOT_PENDING");
  }

  const updated = await updateTeamInvitationById(invitation.id, {
    status: TEAM_INVITATION_STATUSES.DECLINED,
  });

  return toInvitationResponse(updated, actor);
}

export async function cancelInvitationService(actor, invitationId) {
  const invitation = await findTeamInvitationById(invitationId);
  if (!invitation) {
    throw new AppError("Invitation not found.", 404, "INVITATION_NOT_FOUND");
  }

  assertCanManageTeam(invitation.team, actor);

  if (invitation.status !== TEAM_INVITATION_STATUSES.PENDING) {
    throw new AppError("Only pending invitations can be canceled.", 409, "INVITATION_NOT_PENDING");
  }

  const updated = await updateTeamInvitationById(invitation.id, {
    status: TEAM_INVITATION_STATUSES.EXPIRED,
  });

  return toInvitationResponse(updated, actor, {
    includeInviteCode: true,
  });
}

export async function approveSupervisorRequestService(actor, supervisorRequestId) {
  const supervisorRequest = await findTeamSupervisorRequestById(supervisorRequestId);
  if (!supervisorRequest) {
    throw new AppError("Supervisor request not found.", 404, "SUPERVISOR_REQUEST_NOT_FOUND");
  }

  if (supervisorRequest.supervisor.id !== actor.id) {
    throw new AppError(
      "You are not allowed to respond to this supervisor request.",
      403,
      "SUPERVISOR_REQUEST_FORBIDDEN",
    );
  }

  if (supervisorRequest.status !== TEAM_SUPERVISOR_REQUEST_STATUSES.PENDING) {
    throw new AppError(
      "Only pending supervisor requests can be accepted.",
      409,
      "SUPERVISOR_REQUEST_NOT_PENDING",
    );
  }

  const slotField = supervisorRequest.supervisorRole === ROLES.DOCTOR ? "doctorId" : "taId";
  const assignedSupervisorId =
    supervisorRequest.supervisorRole === ROLES.DOCTOR
      ? supervisorRequest.team.doctor?.id ?? null
      : supervisorRequest.team.ta?.id ?? null;

  if (assignedSupervisorId && assignedSupervisorId !== actor.id) {
    throw new AppError(
      `This team already has an assigned ${getSupervisorRoleLabel(supervisorRequest.supervisorRole)}.`,
      409,
      "SUPERVISOR_SLOT_FILLED",
    );
  }

  return prisma.$transaction(async (tx) => {
    await updateTeamById(
      supervisorRequest.team.id,
      {
        [slotField]: actor.id,
      },
      tx,
    );

    const updatedRequest = await updateTeamSupervisorRequestById(
      supervisorRequest.id,
      {
        status: TEAM_SUPERVISOR_REQUEST_STATUSES.ACCEPTED,
        respondedAt: new Date(),
      },
      tx,
    );

    await cancelOtherPendingSupervisorRequests(
      supervisorRequest.team.id,
      supervisorRequest.supervisorRole,
      supervisorRequest.id,
      tx,
    );

    // Notify the team leader the supervisor accepted
    await notify({
      userId: supervisorRequest.team.leader.id,
      type: "SUPERVISOR_REQUEST_ACCEPTED",
      title: "Supervisor Request Accepted",
      message: `${buildFullName(supervisorRequest.supervisor)} has accepted your supervision request for "${supervisorRequest.team.name}".`,
      actionUrl: "/dashboard/my-team",
    });

    return toSupervisorRequestResponse(updatedRequest, actor);
  });
}

export async function declineSupervisorRequestService(actor, supervisorRequestId) {
  const supervisorRequest = await findTeamSupervisorRequestById(supervisorRequestId);
  if (!supervisorRequest) {
    throw new AppError("Supervisor request not found.", 404, "SUPERVISOR_REQUEST_NOT_FOUND");
  }

  if (supervisorRequest.supervisor.id !== actor.id) {
    throw new AppError(
      "You are not allowed to respond to this supervisor request.",
      403,
      "SUPERVISOR_REQUEST_FORBIDDEN",
    );
  }

  if (supervisorRequest.status !== TEAM_SUPERVISOR_REQUEST_STATUSES.PENDING) {
    throw new AppError(
      "Only pending supervisor requests can be declined.",
      409,
      "SUPERVISOR_REQUEST_NOT_PENDING",
    );
  }

  const updatedRequest = await updateTeamSupervisorRequestById(supervisorRequest.id, {
    status: TEAM_SUPERVISOR_REQUEST_STATUSES.DECLINED,
    respondedAt: new Date(),
  });

  // Notify the team leader the supervisor declined
  await notify({
    userId: supervisorRequest.team.leader.id,
    type: "SUPERVISOR_REQUEST_DECLINED",
    title: "Supervisor Request Declined",
    message: `${buildFullName(supervisorRequest.supervisor)} has declined your supervision request for "${supervisorRequest.team.name}".`,
    actionUrl: "/dashboard/my-team",
  });

  return toSupervisorRequestResponse(updatedRequest, actor);
}

export async function leaveTeamService(actor, teamId) {
  assertStudentRole(actor);

  const membership = await findTeamMemberByUserId(actor.id);
  if (!membership || membership.team.id !== teamId) {
    throw new AppError("You are not a member of this team.", 404, "TEAM_MEMBERSHIP_NOT_FOUND");
  }

  const teamName = membership.team.name;
  const leaderId = membership.team.leader?.id;

  const deleted = await deleteTeamMemberByUserId(actor.id);

  // Notify the team leader that a member left
  if (leaderId && leaderId !== actor.id) {
    await notify({
      userId: leaderId,
      type: "SYSTEM",
      title: "Member Left Team",
      message: `${buildFullName(deleted.user)} has left your team "${teamName}".`,
      actionUrl: "/dashboard/my-team",
    });
  }

  return {
    teamId,
    leftAt: new Date().toISOString(),
    user: toUserSummary(deleted.user),
  };
}

export async function removeTeamMemberService(actor, teamId, userId) {
  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);

  if (team.leader.id === userId) {
    throw new AppError("The team leader cannot be removed from the team.", 409, "LEADER_REMOVE_FORBIDDEN");
  }

  const membership = await findTeamMemberByUserId(userId);
  if (!membership || membership.team.id !== teamId) {
    throw new AppError("Team member not found.", 404, "TEAM_MEMBER_NOT_FOUND");
  }

  const deleted = await deleteTeamMemberByUserId(userId);

  // Notify the removed member
  await notify({
    userId,
    type: "SYSTEM",
    title: "Removed from Team",
    message: `You have been removed from team "${team.name}" by ${buildFullName(team.leader)}.`,
    actionUrl: "/dashboard/teams",
  });

  return {
    teamId,
    removedAt: new Date().toISOString(),
    user: toUserSummary(deleted.user),
  };
}




export async function removeSupervisorAssignmentService(actor, teamId, supervisorRole) {
  const team = await findTeamById(teamId);
  assertCanManageTeam(team, actor);

  const normalizedRole = normalizeText(supervisorRole).toUpperCase();
  const slotField = normalizedRole === ROLES.DOCTOR ? "doctorId" : normalizedRole === ROLES.TA ? "taId" : null;

  if (!slotField) {
    throw new AppError("Supervisor role is invalid.", 422, "SUPERVISOR_ROLE_INVALID");
  }

  const assignedSupervisor = normalizedRole === ROLES.DOCTOR ? team.doctor : team.ta;
  if (!assignedSupervisor) {
    throw new AppError(
      `This team does not have an assigned ${normalizedRole === ROLES.DOCTOR ? "doctor" : "TA"}.`,
      409,
      "SUPERVISOR_NOT_ASSIGNED",
    );
  }

  return toTeamDetail(await updateTeamById(teamId, { [slotField]: null }), actor, {
    includeInviteCode: team.leader.id === actor.id || actor.role === ROLES.ADMIN,
  });
}
