import bcrypt from "bcrypt";
import { AppError } from "../../common/errors/AppError.js";
import { ACCOUNT_STATUSES } from "../../common/constants/accountStatuses.js";
import { ROLES } from "../../common/constants/roles.js";
import { findTeamByLeaderId, findTeamMemberByUserId } from "../teams/teams.repository.js";
import {
  countDirectoryUsers,
  countActiveAdmins,
  countUsers,
  createUser,
  deleteUserById,
  findDirectoryUserById,
  findUserByAcademicId,
  findUserByEmail,
  findUserById,
  listDirectoryUsers,
  listUsers,
  updateUserById,
} from "./users.repository.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeSearchValue(value) {
  return normalizeText(value).toLowerCase();
}

function isPlaceholderAcademicId(value) {
  return normalizeText(value).toUpperCase().startsWith("OAUTH-");
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

function getDirectoryUserSearchScore(user, search) {
  const normalizedSearch = normalizeSearchValue(search);
  if (!normalizedSearch) return 0;

  const fullName = normalizeSearchValue(buildFullName(user));
  const firstName = normalizeSearchValue(user.firstName);
  const lastName = normalizeSearchValue(user.lastName);
  const academicId = normalizeSearchValue(user.academicId);
  const email = normalizeSearchValue(user.email);
  const tokens = normalizedSearch.split(/\s+/).filter(Boolean);

  let score = 0;
  const academicIdWeight = getMatchWeight(academicId, normalizedSearch);
  const fullNameWeight = getMatchWeight(fullName, normalizedSearch);
  const firstNameWeight = getMatchWeight(firstName, normalizedSearch);
  const lastNameWeight = getMatchWeight(lastName, normalizedSearch);
  const emailWeight = getMatchWeight(email, normalizedSearch);

  if (academicIdWeight > 0) score = Math.max(score, academicIdWeight + 220);
  if (fullNameWeight > 0) score = Math.max(score, fullNameWeight + 180);
  if (firstNameWeight > 0) score = Math.max(score, firstNameWeight + 140);
  if (lastNameWeight > 0) score = Math.max(score, lastNameWeight + 140);
  if (emailWeight > 0) score = Math.max(score, emailWeight + 80);

  if (
    tokens.length > 1 &&
    tokens.every((token) => fullName.includes(token) || firstName.includes(token) || lastName.includes(token))
  ) {
    score = Math.max(score, 160 - tokens.length);
  }

  return score;
}

function compareDirectoryUsers(left, right, search) {
  const scoreDelta = getDirectoryUserSearchScore(right, search) - getDirectoryUserSearchScore(left, search);
  if (scoreDelta !== 0) return scoreDelta;

  const nameDelta = buildFullName(left).localeCompare(buildFullName(right));
  if (nameDelta !== 0) return nameDelta;

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function toUserResponse(u) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    accountStatus: u.accountStatus,
    academicId: u.academicId ?? null,
    department: u.department ?? null,
    academicYear: u.academicYear ?? null,
    preferredTrack: u.preferredTrack ?? null,
    avatarUrl: u.avatarUrl ?? null,
    bio: u.bio ?? null,
    linkedinUrl: u.linkedinUrl ?? null,
    githubUsername: u.githubUsername ?? null,
    googleId: u.googleId ?? null,
    githubId: u.githubId ?? null,
    isEmailVerified: Boolean(u.isEmailVerified),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function buildListWhere({ search, role, status }) {
  const where = {};
  const normalizedSearch = String(search ?? "").trim();

  if (role) where.role = role;
  if (status) where.accountStatus = status;

  if (normalizedSearch) {
    where.OR = [
      { firstName: { contains: normalizedSearch, mode: "insensitive" } },
      { lastName: { contains: normalizedSearch, mode: "insensitive" } },
      { email: { contains: normalizedSearch, mode: "insensitive" } },
      { academicId: { contains: normalizedSearch, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildDirectoryWhere({ search, role }) {
  const where = {
    accountStatus: ACCOUNT_STATUSES.ACTIVE,
    isEmailVerified: true,
    NOT: {
      academicId: {
        startsWith: "OAUTH-",
      },
    },
  };
  const normalizedSearch = normalizeText(search);
  const tokens = normalizedSearch.split(/\s+/).filter(Boolean);

  if (role) where.role = role;

  if (tokens.length > 0) {
    where.OR = [
      { firstName: { contains: normalizedSearch, mode: "insensitive" } },
      { lastName: { contains: normalizedSearch, mode: "insensitive" } },
      { email: { contains: normalizedSearch, mode: "insensitive" } },
      { academicId: { contains: normalizedSearch, mode: "insensitive" } },
      {
        AND: tokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: "insensitive" } },
            { lastName: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
    ];
  }

  return where;
}

function isDirectoryVisibleUser(user) {
  return Boolean(
    user &&
      user.accountStatus === ACCOUNT_STATUSES.ACTIVE &&
      user.isEmailVerified &&
      !isPlaceholderAcademicId(user.academicId)
  );
}

function toCurrentTeamResponse(user) {
  const ledTeam = user.ledTeam;
  const memberTeam = user.teamMembership?.team;
  const team = ledTeam ?? memberTeam;

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    bio: team.bio,
    stage: team.stage,
    visibility: team.visibility,
    memberCount: 1 + (team._count?.members ?? 0),
    teamRole: ledTeam ? "LEADER" : "MEMBER",
    joinedAt: user.teamMembership?.joinedAt ?? null,
  };
}

function toDirectoryUserResponse(user) {
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
    currentTeam: toCurrentTeamResponse(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isSelfSelectableRole(role) {
  return role === ROLES.STUDENT || role === ROLES.LEADER;
}

async function ensureLastActiveAdminRemains({ targetUser, nextRole, nextStatus }) {
  const isCurrentProtectedAdmin =
    targetUser.role === ROLES.ADMIN && targetUser.accountStatus === ACCOUNT_STATUSES.ACTIVE;
  const staysProtectedAdmin = nextRole === ROLES.ADMIN && nextStatus === ACCOUNT_STATUSES.ACTIVE;

  if (!isCurrentProtectedAdmin || staysProtectedAdmin) return;

  const activeAdminCount = await countActiveAdmins();
  if (activeAdminCount <= 1) {
    throw new AppError("At least one active admin account must remain.", 409, "LAST_ACTIVE_ADMIN_REQUIRED");
  }
}

export async function createUserService({
  firstName,
  lastName,
  email,
  phone,
  role,
  password,
  academicId,
  department,
  academicYear,
  preferredTrack,
  accountStatus,
}) {
  const normalizedEmail = normalizeEmail(email);

  const [existingEmailUser, existingAcademicIdUser] = await Promise.all([
    findUserByEmail(normalizedEmail),
    findUserByAcademicId(academicId),
  ]);

  if (existingEmailUser) throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
  if (existingAcademicIdUser) throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUser({
    firstName,
    lastName,
    email: normalizedEmail,
    phone: phone ?? null,
    role,
    passwordHash,
    academicId,
    department: department ?? null,
    academicYear: academicYear ?? null,
    preferredTrack: preferredTrack ?? null,
    accountStatus,
    isEmailVerified: true,
  });

  return toUserResponse(user);
}

export async function getUserByIdService(id) {
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return toUserResponse(user);
}

export async function listUsersService({ page, limit, search, role, status }) {
  const skip = (page - 1) * limit;
  const where = buildListWhere({ search, role, status });

  const [total, items] = await Promise.all([countUsers(where), listUsers({ where, skip, take: limit })]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    items: items.map(toUserResponse),
  };
}

export async function getUsersSummaryService() {
  const [
    totalUsers,
    students,
    leaders,
    doctors,
    tas,
    admins,
    active,
    inactive,
    suspended,
    unverified,
  ] = await Promise.all([
    countUsers(),
    countUsers({ role: ROLES.STUDENT }),
    countUsers({ role: ROLES.LEADER }),
    countUsers({ role: ROLES.DOCTOR }),
    countUsers({ role: ROLES.TA }),
    countUsers({ role: ROLES.ADMIN }),
    countUsers({ accountStatus: ACCOUNT_STATUSES.ACTIVE }),
    countUsers({ accountStatus: ACCOUNT_STATUSES.INACTIVE }),
    countUsers({ accountStatus: ACCOUNT_STATUSES.SUSPENDED }),
    countUsers({ isEmailVerified: false }),
  ]);

  return {
    totalUsers,
    byRole: {
      students,
      leaders,
      doctors,
      tas,
      admins,
    },
    byStatus: {
      active,
      inactive,
      suspended,
    },
    unverified,
  };
}

export async function updateUserService(actorId, userId, payload) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (actorId === userId && payload.accountStatus && payload.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError("You cannot deactivate or suspend your own account.", 409, "SELF_STATUS_CHANGE_FORBIDDEN");
  }

  const updateData = {};

  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.preferredTrack !== undefined) updateData.preferredTrack = payload.preferredTrack;
  if (payload.academicYear !== undefined) updateData.academicYear = payload.academicYear;
  if (payload.avatarUrl !== undefined) updateData.avatarUrl = payload.avatarUrl;
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.linkedinUrl !== undefined) updateData.linkedinUrl = payload.linkedinUrl;
  if (payload.githubUsername !== undefined) updateData.githubUsername = payload.githubUsername;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.accountStatus !== undefined) updateData.accountStatus = payload.accountStatus;

  if (payload.email !== undefined) {
    const normalizedEmail = normalizeEmail(payload.email);
    const existingEmailUser = await findUserByEmail(normalizedEmail);
    if (existingEmailUser && existingEmailUser.id !== userId) {
      throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    }
    updateData.email = normalizedEmail;
  }

  if (payload.academicId !== undefined) {
    const existingAcademicIdUser = await findUserByAcademicId(payload.academicId);
    if (existingAcademicIdUser && existingAcademicIdUser.id !== userId) {
      throw new AppError("Academic ID already exists", 409, "ACADEMIC_ID_EXISTS");
    }
    updateData.academicId = payload.academicId;
  }

  if (payload.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(payload.password, 10);
  }

  const nextRole = updateData.role ?? existing.role;
  const nextStatus = updateData.accountStatus ?? existing.accountStatus;
  await ensureLastActiveAdminRemains({ targetUser: existing, nextRole, nextStatus });

  const updated = await updateUserById(userId, updateData);
  return toUserResponse(updated);
}

export async function deleteUserService(actorId, userId) {
  if (actorId === userId) {
    throw new AppError("You cannot delete your own account.", 409, "SELF_DELETE_FORBIDDEN");
  }

  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  await ensureLastActiveAdminRemains({
    targetUser: existing,
    nextRole: existing.role === ROLES.ADMIN ? ROLES.STUDENT : existing.role,
    nextStatus: existing.accountStatus,
  });

  const deleted = await deleteUserById(userId);
  return toUserResponse(deleted);
}

export async function updateMeService(userId, payload) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const updateData = {};

  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.preferredTrack !== undefined) updateData.preferredTrack = payload.preferredTrack;
  if (payload.academicYear !== undefined) updateData.academicYear = payload.academicYear;
  if (payload.avatarUrl !== undefined) updateData.avatarUrl = payload.avatarUrl;
  if (payload.bio !== undefined) updateData.bio = payload.bio;
  if (payload.linkedinUrl !== undefined) updateData.linkedinUrl = payload.linkedinUrl;
  if (payload.githubUsername !== undefined) updateData.githubUsername = payload.githubUsername;

  const updated = await updateUserById(userId, updateData);
  return toUserResponse(updated);
}

export async function updateMyRoleService(userId, { role }) {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (!isSelfSelectableRole(existing.role)) {
    throw new AppError(
      "Only student and leader accounts can switch between member and leader modes.",
      403,
      "ROLE_CHANGE_FORBIDDEN",
    );
  }

  if (!isSelfSelectableRole(role)) {
    throw new AppError("Invalid role selection.", 400, "ROLE_CHANGE_INVALID");
  }

  if (existing.role === role) {
    return toUserResponse(existing);
  }

  const [ledTeam, teamMembership] = await Promise.all([
    findTeamByLeaderId(userId),
    findTeamMemberByUserId(userId),
  ]);

  if (ledTeam || teamMembership) {
    throw new AppError(
      "Leave your current team before switching between member and leader modes.",
      409,
      "ROLE_CHANGE_TEAM_CONFLICT",
    );
  }

  const updated = await updateUserById(userId, { role });
  return toUserResponse(updated);
}

export async function listDirectoryUsersService({ page, limit, search, role }) {
  const skip = (page - 1) * limit;
  const where = buildDirectoryWhere({ search, role });
  const normalizedSearch = normalizeText(search);

  let total = 0;
  let items = [];

  if (normalizedSearch) {
    const matchedItems = await listDirectoryUsers({ where });
    const rankedItems = [...matchedItems].sort((left, right) => compareDirectoryUsers(left, right, normalizedSearch));
    total = rankedItems.length;
    items = rankedItems.slice(skip, skip + limit);
  } else {
    [total, items] = await Promise.all([
      countDirectoryUsers(where),
      listDirectoryUsers({ where, skip, take: limit }),
    ]);
  }

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    items: items.map(toDirectoryUserResponse),
  };
}

export async function getDirectoryUserByIdService(id) {
  const user = await findDirectoryUserById(id);
  if (!isDirectoryVisibleUser(user)) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return toDirectoryUserResponse(user);
}
