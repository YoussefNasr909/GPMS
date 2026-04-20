import { prisma } from "../../loaders/dbLoader.js";

export const submissionUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  avatarUrl: true,
};

export const submissionSelect = {
  id: true,
  teamId: true,
  deliverableType: true,
  sdlcPhase: true,
  sourceType: true,
  title: true,
  notes: true,
  status: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  fileUrl: true,
  githubReleaseId: true,
  githubReleaseTag: true,
  githubReleaseUrl: true,
  artifactUrl: true,
  version: true,
  submittedAt: true,
  deadline: true,
  late: true,
  feedback: true,
  grade: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  submittedByUserId: true,   // ← required by notification triggers
  submittedBy: { select: submissionUserSelect },
  reviewedBy: { select: submissionUserSelect },
  team: { select: { id: true, name: true, stage: true } },
};

export async function findSubmissionById(id) {
  return prisma.submission.findUnique({ where: { id }, select: submissionSelect });
}

export async function listSubmissionsByFilter({ teamIds, sdlcPhase, deliverableType, status }) {
  const where = {
    ...(teamIds ? { teamId: { in: teamIds } } : {}),
    ...(sdlcPhase ? { sdlcPhase } : {}),
    ...(deliverableType ? { deliverableType } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.submission.findMany({
    where,
    select: submissionSelect,
    orderBy: [{ sdlcPhase: "asc" }, { submittedAt: "desc" }],
  });
}

export async function createSubmission(data) {
  return prisma.submission.create({ data, select: submissionSelect });
}

export async function updateSubmission(id, data) {
  return prisma.submission.update({ where: { id }, data, select: submissionSelect });
}

export async function deleteSubmissionById(id) {
  return prisma.submission.delete({ where: { id }, select: submissionSelect });
}

export async function listSubmissionsByTeamAndPhase(teamId, sdlcPhase) {
  return prisma.submission.findMany({
    where: { teamId, sdlcPhase },
    select: submissionSelect,
    orderBy: { submittedAt: "desc" },
  });
}

export async function getLatestVersionForDeliverable(teamId, deliverableType) {
  const latest = await prisma.submission.findFirst({
    where: { teamId, deliverableType },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return latest?.version ?? 0;
}
