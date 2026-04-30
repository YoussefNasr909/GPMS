import { prisma } from "../../loaders/dbLoader.js";

// ---------- Queries for local auth ----------
export async function findUserByEmailForAuth(email) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      emailVerificationCode: true,
      emailVerificationExpiresAt: true,
    },
  });
}

export async function findUserByAcademicIdForAuth(academicId) {
  return prisma.user.findUnique({
    where: { academicId },
    select: { id: true },
  });
}

export async function createUserForAuth(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findUserByIdSafe(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function setEmailVerificationCode({ userId, code, expiresAt }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCode: code,
      emailVerificationExpiresAt: expiresAt,
    },
  });
}

export async function markEmailVerified(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiresAt: null,
    },
  });
}

// ---------- OAuth helpers ----------
export async function findUserByGoogleId(googleId) {
  return prisma.user.findUnique({
    where: { googleId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      emailVerificationCode: true,
      emailVerificationExpiresAt: true,
      passwordHash: true,
    },
  });
}

export async function findUserByGithubId(githubId) {
  return prisma.user.findUnique({
    where: { githubId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      emailVerificationCode: true,
      emailVerificationExpiresAt: true,
      passwordHash: true,
    },
  });
}

export async function upsertUserByEmailForOAuth({
  email,
  provider, // "google" | "github"
  providerId,
  firstName,
  lastName,
  avatarUrl,
}) {
  const data =
    provider === "google"
      ? { googleId: providerId }
      : { githubId: providerId };

  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      avatarUrl: avatarUrl ?? undefined,
      ...data,
      // لو جايلك من OAuth نقدر نعتبره verified
      isEmailVerified: true,
    },
    create: {
      email,
      firstName,
      lastName,
      avatarUrl: avatarUrl ?? null,
      ...data,
      isEmailVerified: true,

      // ✅ required عندك في schema: academicId
      // مفيش academicId من جوجل/جيتهاب، فهنحط placeholder unique
      academicId: `OAUTH-${provider.toUpperCase()}-${providerId}`,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      academicId: true,
      department: true,
      academicYear: true,
      preferredTrack: true,
      googleId: true,
      githubId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
