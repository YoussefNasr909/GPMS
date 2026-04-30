import { prisma } from "../../loaders/dbLoader.js";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
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
  googleId: true,
  githubId: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
};

const teamSummarySelect = {
  id: true,
  name: true,
  bio: true,
  stage: true,
  visibility: true,
  _count: {
    select: {
      members: true,
    },
  },
};

const directoryUserSelect = {
  ...userSelect,
  ledTeam: {
    select: teamSummarySelect,
  },
  teamMembership: {
    select: {
      joinedAt: true,
      team: {
        select: teamSummarySelect,
      },
    },
  },
};

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email }, select: userSelect });
}

export async function findUserByAcademicId(academicId) {
  return prisma.user.findUnique({ where: { academicId }, select: userSelect });
}

export async function createUser(data) {
  return prisma.user.create({ data, select: userSelect });
}

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export async function listUsers({ where, skip, take }) {
  return prisma.user.findMany({
    where,
    skip,
    take,
    orderBy: [{ createdAt: "desc" }, { firstName: "asc" }],
    select: userSelect,
  });
}

export async function countUsers(where = {}) {
  return prisma.user.count({ where });
}

export async function countActiveAdmins() {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      accountStatus: "ACTIVE",
    },
  });
}

export function updateUserById(id, data) {
  return prisma.user.update({ where: { id }, data, select: userSelect });
}

export function deleteUserById(id) {
  return prisma.user.delete({ where: { id }, select: userSelect });
}

export async function listDirectoryUsers({ where, skip, take }) {
  return prisma.user.findMany({
    where,
    skip,
    take,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { createdAt: "desc" }],
    select: directoryUserSelect,
  });
}

export async function countDirectoryUsers(where = {}) {
  return prisma.user.count({ where });
}

export async function findDirectoryUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: directoryUserSelect,
  });
}
