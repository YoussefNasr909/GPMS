import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import { findTeamById, findTeamByLeaderId, findTeamMemberByUserId } from "../teams/teams.repository.js";
import {
  bootstrapTaskGitHubArtifactsService,
  mergeTaskPullRequestService,
  openTaskGitHubPullRequestService,
  resyncTaskGitHubStateService,
  reviewTaskPullRequestService,
} from "../github/github.service.js";
import {
  createTask,
  expireOverdueTasksByTeam,
  findTaskById,
  listTasksByTeam,
  updateTaskById,
} from "./tasks.repository.js";
import { notify } from "../../common/utils/notify.js";

const VISIBLE_STATUS_ORDER = {
  TODO: 0,
  IN_PROGRESS: 1,
  REVIEW: 2,
  APPROVED: 3,
  DONE: 4,
};

const DEFAULT_GITHUB_TASK_TYPES = new Set(["CODE", "DOCUMENTATION", "DESIGN"]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function slugifyBranchSegment(value) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "task";
}

function encodeGitHubRef(value) {
  return normalizeText(value)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function defaultIntegrationModeForTaskType(taskType = "OTHER") {
  return DEFAULT_GITHUB_TASK_TYPES.has(taskType) ? "GITHUB" : "MANUAL";
}

function parseDateBoundary(value, boundary = "start") {
  const normalized = normalizeText(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new AppError("Use the date format YYYY-MM-DD.", 422, "INVALID_TASK_DATE");
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  const date =
    boundary === "end"
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new AppError("Please provide a valid calendar date.", 422, "INVALID_TASK_DATE");
  }

  return date;
}

function toTaskUserSummary(user) {
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

function normalizeVisibleStatus(status) {
  return status === "BACKLOG" ? "TODO" : status;
}

function isGpmsManagedTask(task) {
  return task.origin === "GPMS";
}

function isImportedGitHubTask(task) {
  return task.origin === "GITHUB_IMPORT";
}

function isRepoBackedTask(task) {
  return task.integrationMode === "GITHUB";
}

function isManualTask(task) {
  return !isRepoBackedTask(task);
}

function isTaskOverdue(task, now = new Date()) {
  return isGpmsManagedTask(task) && isManualTask(task) && task.status === "IN_PROGRESS" && task.dueDate && task.dueDate.getTime() < now.getTime();
}

function canManageTaskTeam(actor, team) {
  return actor.role === ROLES.ADMIN || team?.leader?.id === actor.id;
}

function canViewTaskTeam(actor, team) {
  if (!team) return false;
  if (canManageTaskTeam(actor, team)) return true;
  if (team.doctor?.id === actor.id || team.ta?.id === actor.id) return true;
  return team.members.some((member) => member.user.id === actor.id);
}

function canWriteRepoBackedTask(actor, task) {
  if (!isRepoBackedTask(task) || !isGpmsManagedTask(task)) return false;
  if (canManageTaskTeam(actor, task.team)) return true;
  return task.assigneeUserId === actor.id && actor.role === ROLES.STUDENT;
}

function getTeamRoster(team) {
  if (!team) return [];

  return [
    {
      id: team.leader.id,
      teamRole: "LEADER",
      user: team.leader,
    },
    ...team.members.map((member) => ({
      id: member.user.id,
      teamRole: "MEMBER",
      user: member.user,
    })),
  ];
}

function assertTaskExists(task) {
  if (!task) {
    throw new AppError("Task not found.", 404, "TASK_NOT_FOUND");
  }
}

function assertGpmsManagedTask(task) {
  if (!isGpmsManagedTask(task)) {
    throw new AppError(
      "Tasks imported from GitHub are read-only in GPMS. Update them from the GitHub workspace instead.",
      409,
      "TASK_MANAGED_BY_GITHUB_IMPORT",
    );
  }
}

function assertTaskAssignee(task, actor) {
  if (!task.assigneeUserId || task.assigneeUserId !== actor.id) {
    throw new AppError("Only the assigned member can perform this action.", 403, "TASK_ASSIGNEE_ONLY");
  }
}

function assertTaskManager(task, actor) {
  if (!canManageTaskTeam(actor, task.team)) {
    throw new AppError("Only the team leader or an admin can manage this task workflow.", 403, "TASK_MANAGER_ONLY");
  }
}

function assertActorCanViewTask(task, actor) {
  if (!canViewTaskTeam(actor, task.team)) {
    throw new AppError("You are not allowed to access this task.", 403, "TASK_VIEW_FORBIDDEN");
  }
}

function assertAssigneeBelongsToTeam(team, assigneeUserId) {
  const assignee = getTeamRoster(team).find((entry) => entry.user.id === assigneeUserId)?.user;
  if (!assignee) {
    throw new AppError("Choose a member from your current team.", 422, "TASK_ASSIGNEE_NOT_IN_TEAM");
  }

  return assignee;
}

async function resolveActorTeamContext(actor, requestedTeamId) {
  const normalizedRequestedTeamId = normalizeText(requestedTeamId) || null;

  if (actor.role === ROLES.ADMIN) {
    if (!normalizedRequestedTeamId) {
      throw new AppError("Admins must provide a teamId to access tasks.", 422, "TASK_TEAM_ID_REQUIRED");
    }

    const team = await findTeamById(normalizedRequestedTeamId);
    if (!team) {
      throw new AppError("Team not found.", 404, "TEAM_NOT_FOUND");
    }

    return { team, teamRole: "ADMIN" };
  }

  if (actor.role === ROLES.LEADER) {
    const team = await findTeamByLeaderId(actor.id);
    if (!team) {
      throw new AppError("Create a team first before managing tasks.", 409, "TEAM_REQUIRED");
    }

    if (normalizedRequestedTeamId && normalizedRequestedTeamId !== team.id) {
      throw new AppError("You can only access tasks for your own team.", 403, "TASK_TEAM_FORBIDDEN");
    }

    return { team, teamRole: "LEADER" };
  }

  if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    if (!membership?.team) {
      throw new AppError("Join a team first before accessing tasks.", 409, "TEAM_REQUIRED");
    }

    if (normalizedRequestedTeamId && normalizedRequestedTeamId !== membership.team.id) {
      throw new AppError("You can only access tasks for your own team.", 403, "TASK_TEAM_FORBIDDEN");
    }

    return { team: membership.team, teamRole: "MEMBER" };
  }

  if (actor.role === ROLES.DOCTOR || actor.role === ROLES.TA) {
    if (!normalizedRequestedTeamId) {
      throw new AppError("Provide a teamId to load tasks for this team.", 422, "TASK_TEAM_ID_REQUIRED");
    }

    const team = await findTeamById(normalizedRequestedTeamId);
    if (!team) {
      throw new AppError("Team not found.", 404, "TEAM_NOT_FOUND");
    }

    if (team.doctor?.id !== actor.id && team.ta?.id !== actor.id) {
      throw new AppError("You are not assigned to this team.", 403, "TASK_TEAM_FORBIDDEN");
    }

    return { team, teamRole: actor.role };
  }

  throw new AppError("This role is not supported for task access.", 403, "TASK_ROLE_UNSUPPORTED");
}

function compareTasks(left, right) {
  const leftStatus = VISIBLE_STATUS_ORDER[normalizeVisibleStatus(left.status)] ?? 99;
  const rightStatus = VISIBLE_STATUS_ORDER[normalizeVisibleStatus(right.status)] ?? 99;

  if (leftStatus !== rightStatus) {
    return leftStatus - rightStatus;
  }

  const leftEnd = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightEnd = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftEnd !== rightEnd) {
    return leftEnd - rightEnd;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function buildGitHubReviewGate(task) {
  if (!isRepoBackedTask(task)) return null;

  const hasIssue = Boolean(task.githubIssueNumber && task.githubIssueUrl);
  const hasBranch = Boolean(normalizeText(task.githubBranchName));
  const hasOpenPullRequest = Boolean(task.githubPullRequestNumber && normalizeText(task.githubPullRequestState).toLowerCase() === "open");
  const hasCommits = Number(task.githubCommitCount ?? 0) > 0;
  const missing = [];

  if (!hasIssue) missing.push("linked_issue");
  if (!hasBranch) missing.push("linked_branch");
  if (!hasOpenPullRequest) missing.push("open_pull_request");
  if (!hasCommits) missing.push("branch_commits");

  return {
    ready: missing.length === 0,
    hasIssue,
    hasBranch,
    hasOpenPullRequest,
    hasCommits,
    missing,
  };
}

function buildGitHubState(task) {
  if (!isRepoBackedTask(task)) return null;

  const repository = task.team?.githubRepository ?? null;
  const repoUrl = repository?.repoUrl ?? null;
  const branchName = normalizeText(task.githubBranchName || task.githubPullRequestHead);
  const defaultBranch = normalizeText(task.githubPullRequestBase || repository?.defaultBranch);
  const branchUrl = repoUrl && branchName ? `${repoUrl}/tree/${encodeGitHubRef(branchName)}` : null;
  const compareUrl = repoUrl && branchName && defaultBranch
    ? `${repoUrl}/compare/${encodeGitHubRef(defaultBranch)}...${encodeGitHubRef(branchName)}`
    : null;
  const reviewGate = buildGitHubReviewGate(task);

  return {
    repository: repository
      ? {
          id: repository.id,
          fullName: repository.fullName,
          repoUrl: repository.repoUrl,
          defaultBranch: repository.defaultBranch,
          connectionStatus: repository.connectionStatus,
        }
      : null,
    issue: {
      id: task.githubIssueId ?? null,
      number: task.githubIssueNumber ?? null,
      url: task.githubIssueUrl ?? null,
      state: task.githubIssueState ?? null,
    },
    branch: {
      name: branchName || null,
      url: branchUrl,
      compareUrl,
      suggestedName:
        task.githubIssueNumber && !branchName
          ? `task/${task.githubIssueNumber}-${slugifyBranchSegment(task.title)}`
          : null,
    },
    pullRequest: {
      id: task.githubPullRequestId ?? null,
      number: task.githubPullRequestNumber ?? null,
      url: task.githubPullRequestUrl ?? null,
      state: task.githubPullRequestState ?? null,
      base: task.githubPullRequestBase ?? null,
      head: task.githubPullRequestHead ?? null,
      mergedAt: task.githubPullRequestMergedAt ?? null,
    },
    latestCommit: {
      sha: task.githubLatestCommitSha ?? null,
      shortSha: task.githubLatestCommitSha ? task.githubLatestCommitSha.slice(0, 7) : null,
      url: task.githubLatestCommitUrl ?? null,
    },
    commitCount: Number(task.githubCommitCount ?? 0),
    lastSyncedAt: task.lastSyncedAt ?? null,
    reviewGate,
  };
}

function toTaskResponse(task, actor) {
  const visibleStatus = normalizeVisibleStatus(task.status);
  const isAwaitingAcceptance = isGpmsManagedTask(task) && visibleStatus === "TODO" && !task.acceptedAt;
  const isAssignee = task.assigneeUserId === actor.id;
  const canManage = canManageTaskTeam(actor, task.team);
  const hasPastEndDate = Boolean(task.dueDate) && new Date(task.dueDate).getTime() < Date.now();
  const github = buildGitHubState(task);
  const reviewGate = github?.reviewGate ?? null;
  const canRejectGitHubApprovedTask = isRepoBackedTask(task) && visibleStatus === "APPROVED" && !task.githubPullRequestMergedAt;

  return {
    id: task.id,
    team: {
      id: task.team.id,
      name: task.team.name,
    },
    taskType: task.taskType,
    integrationMode: task.integrationMode,
    origin: task.origin,
    title: task.title,
    description: task.description ?? "",
    status: visibleStatus,
    rawStatus: task.status,
    priority: task.priority,
    startDate: task.startDate ?? null,
    endDate: task.dueDate ?? null,
    acceptedAt: task.acceptedAt ?? null,
    submittedForReviewAt: task.submittedForReviewAt ?? null,
    reviewedAt: task.reviewedAt ?? null,
    reviewFeedback: task.reviewComment ?? task.reviewFeedback ?? null,
    reviewComment: task.reviewComment ?? null,
    reviewDecision: task.reviewDecision ?? null,
    reviewSnapshot: task.reviewSnapshot ?? null,
    syncedFromGithub: Boolean(task.syncedFromGithub),
    githubIssueNumber: task.githubIssueNumber ?? null,
    githubIssueUrl: task.githubIssueUrl ?? null,
    labels: task.labels ?? [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignee: toTaskUserSummary(task.assignee),
    createdBy: toTaskUserSummary(task.createdBy),
    reviewedBy: toTaskUserSummary(task.reviewedBy),
    awaitingAcceptance: isAwaitingAcceptance,
    isPastEndDate: hasPastEndDate,
    github,
    permissions: {
      canAccept: isGpmsManagedTask(task) && isAssignee && task.status === "TODO" && !task.acceptedAt && !hasPastEndDate,
      canSubmitForReview:
        isGpmsManagedTask(task) &&
        isAssignee &&
        task.status === "IN_PROGRESS" &&
        (!isRepoBackedTask(task) || Boolean(reviewGate?.ready)),
      canApprove: isGpmsManagedTask(task) && canManage && task.status === "REVIEW",
      canReject:
        isGpmsManagedTask(task) &&
        canManage &&
        (task.status === "REVIEW" || canRejectGitHubApprovedTask),
      canEdit: isGpmsManagedTask(task) && canManage,
      canBootstrapGithub: canWriteRepoBackedTask(actor, task) && !task.githubIssueNumber,
      canOpenPullRequest:
        canWriteRepoBackedTask(actor, task) &&
        Boolean(normalizeText(task.githubBranchName)) &&
        !task.githubPullRequestNumber,
      canResyncGithub: isRepoBackedTask(task) && canViewTaskTeam(actor, task.team),
    },
  };
}

async function refreshTaskWorkflowState(task) {
  if (!task || !isTaskOverdue(task)) {
    return task;
  }

  const updated = await updateTaskById(task.id, {
    status: "TODO",
    acceptedAt: null,
    submittedForReviewAt: null,
    reviewedAt: null,
    reviewedByUserId: null,
    reviewFeedback: null,
    reviewComment: null,
    reviewDecision: null,
    reviewSnapshot: null,
  });

  return updated;
}

function buildUpdatedDateRange(task, payload) {
  const nextStartDate = payload.startDate !== undefined ? parseDateBoundary(payload.startDate, "start") : task.startDate;
  const nextEndDate = payload.endDate !== undefined ? parseDateBoundary(payload.endDate, "end") : task.dueDate;

  if (nextStartDate && nextEndDate && nextEndDate.getTime() < nextStartDate.getTime()) {
    throw new AppError("End date must be on or after the start date.", 422, "TASK_DATE_RANGE_INVALID");
  }

  return {
    nextStartDate,
    nextEndDate,
  };
}

function buildReviewSnapshot(task, actor, overrides = {}) {
  return {
    actorId: actor.id,
    actorRole: actor.role,
    reviewedAt: new Date().toISOString(),
    taskStatus: task.status,
    githubIssueNumber: task.githubIssueNumber ?? null,
    githubPullRequestNumber: task.githubPullRequestNumber ?? null,
    githubPullRequestState: task.githubPullRequestState ?? null,
    githubCommitCount: Number(task.githubCommitCount ?? 0),
    ...overrides,
  };
}

function buildMissingGitHubReviewEvidenceMessage(task) {
  const reviewGate = buildGitHubReviewGate(task);
  const messages = {
    linked_issue: "link the GitHub issue",
    linked_branch: "create the GitHub branch",
    open_pull_request: "open a pull request",
    branch_commits: "push at least one commit on the task branch",
  };
  const missing = reviewGate?.missing ?? [];
  const details = missing.map((item) => messages[item] ?? item);

  return `This repo-backed task cannot move to review yet. Please ${details.join(", ")} first.`;
}

export async function listTasksService(actor, filters) {
  const { team } = await resolveActorTeamContext(actor, filters.teamId);
  await expireOverdueTasksByTeam(team.id);

  const normalizedSearch = normalizeText(filters.search).toLowerCase();
  const tasks = await listTasksByTeam(team.id);

  return tasks
    .filter((task) => {
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.status && normalizeVisibleStatus(task.status) !== filters.status) return false;
      if (filters.taskType && task.taskType !== filters.taskType) return false;
      if (filters.integrationMode && task.integrationMode !== filters.integrationMode) return false;

      if (!normalizedSearch) return true;

      const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .sort(compareTasks)
    .map((task) => {
      try {
        return toTaskResponse(task, actor);
      } catch (err) {
        console.error("Error in toTaskResponse for task:", task.id, err);
        throw err;
      }
    });
}

export async function createTaskService(actor, payload) {
  const { team } = await resolveActorTeamContext(actor, payload.teamId);

  if (!canManageTaskTeam(actor, team)) {
    throw new AppError("Only the team leader or an admin can create tasks.", 403, "TASK_CREATE_FORBIDDEN");
  }

  const assignee = assertAssigneeBelongsToTeam(team, payload.assigneeUserId);
  const startDate = parseDateBoundary(payload.startDate, "start");
  const endDate = parseDateBoundary(payload.endDate, "end");

  if (endDate.getTime() < startDate.getTime()) {
    throw new AppError("End date must be on or after the start date.", 422, "TASK_DATE_RANGE_INVALID");
  }

  const taskType = payload.taskType ?? "OTHER";
  const integrationMode = payload.integrationMode ?? defaultIntegrationModeForTaskType(taskType);
  const task = await createTask({
    teamId: team.id,
    taskType,
    integrationMode,
    origin: "GPMS",
    title: normalizeText(payload.title),
    description: normalizeText(payload.description) || null,
    priority: payload.priority,
    status: "TODO",
    assigneeUserId: assignee.id,
    createdByUserId: actor.id,
    startDate,
    dueDate: endDate,
    labels: [],
    syncedFromGithub: false,
    githubCommitCount: 0,
  });

  // Notify the assignee they have a new task (skip if leader assigned to themselves)
  if (assignee.id !== actor.id) {
    await notify({
      userId: assignee.id,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `You have been assigned the task "${normalizeText(payload.title)}" in team "${team.name}".`,
      actionUrl: "/dashboard/tasks",
    });
  }

  return toTaskResponse(task, actor);
}

export async function updateTaskService(actor, taskId, payload) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  task = await refreshTaskWorkflowState(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);
  assertTaskManager(task, actor);

  const { nextStartDate, nextEndDate } = buildUpdatedDateRange(task, payload);
  const updateData = {};
  let shouldResetWorkflow = false;

  if (payload.title !== undefined) updateData.title = normalizeText(payload.title);
  if (payload.description !== undefined) updateData.description = normalizeText(payload.description) || null;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.taskType !== undefined) updateData.taskType = payload.taskType;

  if (payload.integrationMode !== undefined) {
    updateData.integrationMode = payload.integrationMode;
    shouldResetWorkflow = payload.integrationMode !== task.integrationMode;
  }

  if (payload.assigneeUserId !== undefined) {
    const nextAssignee = assertAssigneeBelongsToTeam(task.team, payload.assigneeUserId);
    updateData.assigneeUserId = nextAssignee.id;
    shouldResetWorkflow = shouldResetWorkflow || nextAssignee.id !== task.assigneeUserId;
  }

  if (payload.startDate !== undefined) {
    updateData.startDate = nextStartDate;
    shouldResetWorkflow = true;
  }

  if (payload.endDate !== undefined) {
    updateData.dueDate = nextEndDate;
    shouldResetWorkflow = true;
  }

  if (shouldResetWorkflow && task.status !== "DONE") {
    updateData.status = "TODO";
    updateData.acceptedAt = null;
    updateData.submittedForReviewAt = null;
    updateData.reviewedAt = null;
    updateData.reviewedByUserId = null;
    updateData.reviewFeedback = null;
    updateData.reviewComment = null;
    updateData.reviewDecision = null;
    updateData.reviewSnapshot = null;
  }

  const updated = await updateTaskById(task.id, updateData);
  return toTaskResponse(updated, actor);
}

export async function acceptTaskService(actor, taskId) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  task = await refreshTaskWorkflowState(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);
  assertTaskAssignee(task, actor);

  if (task.status !== "TODO" || task.acceptedAt) {
    throw new AppError("Only tasks waiting in To Do can be accepted.", 409, "TASK_NOT_WAITING_FOR_ACCEPTANCE");
  }

  if (task.dueDate && new Date(task.dueDate).getTime() < Date.now()) {
    throw new AppError(
      "This task has already passed its end date. Ask the team leader to update the task schedule first.",
      409,
      "TASK_END_DATE_PASSED",
    );
  }

  const updated = await updateTaskById(task.id, {
    status: "IN_PROGRESS",
    acceptedAt: new Date(),
    reviewFeedback: null,
    reviewComment: null,
    reviewDecision: null,
  });

  return toTaskResponse(updated, actor);
}

export async function submitTaskForReviewService(actor, taskId) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  task = await refreshTaskWorkflowState(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);
  assertTaskAssignee(task, actor);

  if (task.status !== "IN_PROGRESS") {
    throw new AppError("Only tasks in progress can be submitted for review.", 409, "TASK_NOT_IN_PROGRESS");
  }

  if (isRepoBackedTask(task)) {
    task = await resyncTaskGitHubStateService(actor, task.id);
    if (!buildGitHubReviewGate(task)?.ready) {
      throw new AppError(buildMissingGitHubReviewEvidenceMessage(task), 409, "TASK_GITHUB_REVIEW_REQUIREMENTS_NOT_MET");
    }
  }

  const updated = await updateTaskById(task.id, {
    status: "REVIEW",
    submittedForReviewAt: new Date(),
    reviewFeedback: null,
    reviewComment: null,
    reviewDecision: null,
  });

  // Notify the team leader a task needs review
  if (task.team?.leader?.id && task.team.leader.id !== actor.id) {
    await notify({
      userId: task.team.leader.id,
      type: "TASK_REVIEWED",
      title: "Task Ready for Review",
      message: `"${task.title}" has been submitted for review by ${buildFullName(actor)}.`,
      actionUrl: "/dashboard/tasks",
    });
  }

  return toTaskResponse(updated, actor);
}

export async function approveTaskService(actor, taskId, payload = {}) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  task = await refreshTaskWorkflowState(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);
  assertTaskManager(task, actor);

  if (task.status !== "REVIEW") {
    throw new AppError("Only tasks in review can be approved.", 409, "TASK_NOT_IN_REVIEW");
  }

  let merged = false;
  if (isRepoBackedTask(task)) {
    task = await resyncTaskGitHubStateService(actor, task.id);
    if (!buildGitHubReviewGate(task)?.ready) {
      throw new AppError(buildMissingGitHubReviewEvidenceMessage(task), 409, "TASK_GITHUB_REVIEW_REQUIREMENTS_NOT_MET");
    }

    await reviewTaskPullRequestService(actor, task.id, {
      event: "APPROVE",
      body: normalizeText(payload.reviewComment) || undefined,
    });

    if (payload.mergePullRequest) {
      await mergeTaskPullRequestService(actor, task.id, {
        mergeMethod: payload.mergeMethod,
      });
      merged = true;
    }

    task = await resyncTaskGitHubStateService(actor, task.id);
    if (task.githubPullRequestMergedAt) {
      merged = true;
    }
  }

  const reviewComment = normalizeText(payload.reviewComment) || null;
  const updated = await updateTaskById(task.id, {
    status: merged ? "DONE" : isRepoBackedTask(task) ? "APPROVED" : "DONE",
    reviewedAt: new Date(),
    reviewedByUserId: actor.id,
    reviewFeedback: reviewComment,
    reviewComment,
    reviewDecision: "APPROVED",
    reviewSnapshot: buildReviewSnapshot(task, actor, {
      mergeRequested: Boolean(payload.mergePullRequest),
      mergeMethod: payload.mergeMethod ?? null,
      merged,
    }),
  });

  // Notify the assignee their task was approved
  if (task.assigneeUserId && task.assigneeUserId !== actor.id) {
    await notify({
      userId: task.assigneeUserId,
      type: "TASK_APPROVED",
      title: "Task Approved",
      message: `Your task "${task.title}" has been approved${reviewComment ? `: "${reviewComment}"` : "."}`,
      actionUrl: "/dashboard/tasks",
    });
  }

  return toTaskResponse(updated, actor);
}

export async function rejectTaskService(actor, taskId, payload) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  task = await refreshTaskWorkflowState(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);
  assertTaskManager(task, actor);

  const canRejectCurrentStatus = task.status === "REVIEW" || (isRepoBackedTask(task) && task.status === "APPROVED");
  if (!canRejectCurrentStatus) {
    throw new AppError("Only reviewed tasks can be sent back for changes.", 409, "TASK_NOT_IN_REVIEW");
  }

  const reviewComment = normalizeText(payload.reviewComment);
  if (!reviewComment) {
    throw new AppError("Add review comments before requesting changes.", 422, "TASK_REVIEW_COMMENT_REQUIRED");
  }

  if (isRepoBackedTask(task) && task.githubPullRequestNumber) {
    await reviewTaskPullRequestService(actor, task.id, {
      event: "REQUEST_CHANGES",
      body: reviewComment,
    });
    task = await resyncTaskGitHubStateService(actor, task.id);
  }

  const updated = await updateTaskById(task.id, {
    status: "IN_PROGRESS",
    submittedForReviewAt: null,
    reviewedAt: new Date(),
    reviewedByUserId: actor.id,
    reviewFeedback: reviewComment,
    reviewComment,
    reviewDecision: "CHANGES_REQUESTED",
    reviewSnapshot: buildReviewSnapshot(task, actor, {
      requestedChanges: true,
    }),
  });

  // Notify the assignee that changes were requested
  if (task.assigneeUserId && task.assigneeUserId !== actor.id) {
    await notify({
      userId: task.assigneeUserId,
      type: "TASK_CHANGES_REQUESTED",
      title: "Changes Requested",
      message: `Changes requested on your task "${task.title}": "${reviewComment}".`,
      actionUrl: "/dashboard/tasks",
    });
  }

  return toTaskResponse(updated, actor);
}

export async function bootstrapTaskGithubService(actor, taskId) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);

  if (!isRepoBackedTask(task)) {
    throw new AppError("Only repo-backed tasks can bootstrap GitHub artifacts.", 409, "TASK_GITHUB_NOT_ENABLED");
  }

  if (!canWriteRepoBackedTask(actor, task)) {
    throw new AppError("Only the team leader or assigned member can prepare GitHub artifacts for this task.", 403, "TASK_GITHUB_WRITE_FORBIDDEN");
  }

  task = await bootstrapTaskGitHubArtifactsService(actor, task.id);
  return toTaskResponse(task, actor);
}

export async function openTaskPullRequestService(actor, taskId, payload = {}) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  assertActorCanViewTask(task, actor);
  assertGpmsManagedTask(task);

  if (!isRepoBackedTask(task)) {
    throw new AppError("Only repo-backed tasks can open a GitHub pull request.", 409, "TASK_GITHUB_NOT_ENABLED");
  }

  if (!canWriteRepoBackedTask(actor, task)) {
    throw new AppError("Only the team leader or assigned member can open a pull request for this task.", 403, "TASK_GITHUB_WRITE_FORBIDDEN");
  }

  task = await openTaskGitHubPullRequestService(actor, task.id, payload);
  return toTaskResponse(task, actor);
}

export async function resyncTaskGithubService(actor, taskId) {
  let task = await findTaskById(taskId);
  assertTaskExists(task);
  assertActorCanViewTask(task, actor);

  if (!isRepoBackedTask(task)) {
    throw new AppError("This task does not use GitHub tracking.", 409, "TASK_GITHUB_NOT_ENABLED");
  }

  task = await resyncTaskGitHubStateService(actor, task.id);
  return toTaskResponse(task, actor);
}
