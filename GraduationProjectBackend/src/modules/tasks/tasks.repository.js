import { prisma } from "../../loaders/dbLoader.js";
import { teamUserSelect } from "../teams/teams.repository.js";

const taskTeamSelect = {
  id: true,
  name: true,
  leader: { select: teamUserSelect },
  doctor: { select: teamUserSelect },
  ta: { select: teamUserSelect },
  members: {
    orderBy: { joinedAt: "asc" },
    select: {
      id: true,
      joinedAt: true,
      user: { select: teamUserSelect },
    },
  },
  githubRepository: {
    select: {
      id: true,
      fullName: true,
      repoUrl: true,
      defaultBranch: true,
      connectionStatus: true,
    },
  },
};

export const taskSelect = {
  id: true,
  teamId: true,
  taskType: true,
  integrationMode: true,
  origin: true,
  githubIssueId: true,
  githubIssueNumber: true,
  githubIssueUrl: true,
  githubIssueState: true,
  githubBranchName: true,
  githubPullRequestId: true,
  githubPullRequestNumber: true,
  githubPullRequestUrl: true,
  githubPullRequestState: true,
  githubPullRequestBase: true,
  githubPullRequestHead: true,
  githubPullRequestMergedAt: true,
  githubLatestCommitSha: true,
  githubLatestCommitUrl: true,
  githubCommitCount: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeUserId: true,
  createdByUserId: true,
  reviewedByUserId: true,
  labels: true,
  startDate: true,
  dueDate: true,
  acceptedAt: true,
  submittedForReviewAt: true,
  reviewedAt: true,
  reviewFeedback: true,
  reviewComment: true,
  reviewDecision: true,
  reviewSnapshot: true,
  syncedFromGithub: true,
  lastSyncedAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: teamUserSelect },
  createdBy: { select: teamUserSelect },
  reviewedBy: { select: teamUserSelect },
  team: { select: taskTeamSelect },
};

export function listTasksByTeam(teamId, tx = prisma) {
  return tx.task.findMany({
    where: { teamId },
    orderBy: [{ createdAt: "desc" }],
    select: taskSelect,
  });
}

export function listRepoBackedTasksByTeam(teamId, tx = prisma) {
  return tx.task.findMany({
    where: {
      teamId,
      integrationMode: "GITHUB",
    },
    orderBy: [{ updatedAt: "desc" }],
    select: taskSelect,
  });
}

export function findTaskById(id, tx = prisma) {
  return tx.task.findUnique({
    where: { id },
    select: taskSelect,
  });
}

export function findTaskByGitHubIssueNumber(teamId, githubIssueNumber, tx = prisma) {
  return tx.task.findUnique({
    where: {
      teamId_githubIssueNumber: {
        teamId,
        githubIssueNumber,
      },
    },
    select: taskSelect,
  });
}

export function findTaskByGitHubBranchName(teamId, githubBranchName, tx = prisma) {
  return tx.task.findFirst({
    where: {
      teamId,
      githubBranchName,
    },
    select: taskSelect,
  });
}

export function findTaskByGitHubPullRequestNumber(teamId, githubPullRequestNumber, tx = prisma) {
  return tx.task.findFirst({
    where: {
      teamId,
      githubPullRequestNumber,
    },
    select: taskSelect,
  });
}

export function createTask(data, tx = prisma) {
  return tx.task.create({
    data,
    select: taskSelect,
  });
}

export function updateTaskById(id, data, tx = prisma) {
  return tx.task.update({
    where: { id },
    data,
    select: taskSelect,
  });
}

export function expireOverdueTasksByTeam(teamId, now = new Date(), tx = prisma) {
  return tx.task.updateMany({
    where: {
      teamId,
      integrationMode: "MANUAL",
      origin: "GPMS",
      status: "IN_PROGRESS",
      dueDate: {
        lt: now,
      },
    },
    data: {
      status: "TODO",
      acceptedAt: null,
      submittedForReviewAt: null,
    },
  });
}
