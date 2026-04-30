import {
  createBranchService,
  deleteBranchService,
  createIssueService,
  createPullRequestService,
  createReleaseService,
  createRepositoryService,
  deleteRepositoryPermanentlyService,
  disconnectRepositoryService,
  disconnectUserConnectionService,
  getActionsService,
  getBranchesService,
  getCommitByShaService,
  getCommitsService,
  getCompareService,
  getContributorsService,
  getRepositoryAccessStateService,
  getFileBlobService,
  getGitHubInstallUrlService,
  getGitHubUserConnectUrlService,
  getIssuesService,
  getPullRequestByNumberService,
  getPullRequestsService,
  getReleasesService,
  getRepositoryTreeService,
  getUserConnectionStateService,
  getWorkflowLogsService,
  getWorkspaceService,
  githubInstallCallbackService,
  githubUserCallbackService,
  inviteRepositoryCollaboratorService,
  mergePullRequestService,
  removeRepositoryCollaboratorService,
  reviewPullRequestService,
  saveRepositoryChangesService,
  syncWorkspaceService,
  cancelRepositoryInvitationService,
  updateIssueService,
  updateWorkspaceSettingsService,
  connectRepositoryService,
  handleGitHubWebhookService,
  mergeBranchService,
} from "./github.service.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";

function buildGitHubCallbackRedirect(params = {}) {
  const url = new URL("/dashboard/github", env.frontendUrl ?? "http://localhost:3000");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && `${value}` !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function getUserConnectionState(req, res) {
  const result = await getUserConnectionStateService(req.user);
  res.json({ ok: true, data: result });
}

export async function getUserConnectUrl(req, res) {
  const result = await getGitHubUserConnectUrlService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function githubUserCallback(req, res) {
  try {
    const result = await githubUserCallbackService(req.validated.query);
    if (result.redirectUrl) {
      return res.redirect(result.redirectUrl);
    }

    return res.json({ ok: true, data: result });
  } catch (error) {
    const reason =
      error instanceof AppError ? error.message : "GitHub personal connection failed. Please try again.";
    return res.redirect(
      buildGitHubCallbackRedirect({
        githubConnect: "error",
        reason,
      }),
    );
  }
}

export async function disconnectUserConnection(req, res) {
  const result = await disconnectUserConnectionService(req.user);
  res.json({ ok: true, data: result });
}

export async function getInstallUrl(req, res) {
  const result = await getGitHubInstallUrlService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function githubInstallCallback(req, res) {
  const result = await githubInstallCallbackService(req.validated.query);
  if (result.redirectUrl) {
    return res.redirect(result.redirectUrl);
  }

  return res.json({ ok: true, data: result });
}

export async function getWorkspace(req, res) {
  const result = await getWorkspaceService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function createRepository(req, res) {
  const result = await createRepositoryService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function connectRepository(req, res) {
  const result = await connectRepositoryService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function disconnectRepository(req, res) {
  const result = await disconnectRepositoryService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function deleteRepositoryPermanently(req, res) {
  const result = await deleteRepositoryPermanentlyService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function updateWorkspaceSettings(req, res) {
  const result = await updateWorkspaceSettingsService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function syncWorkspace(req, res) {
  const result = await syncWorkspaceService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function getRepositoryTree(req, res) {
  const result = await getRepositoryTreeService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getFileBlob(req, res) {
  const result = await getFileBlobService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function saveRepositoryChanges(req, res) {
  const result = await saveRepositoryChangesService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function getBranches(req, res) {
  const result = await getBranchesService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createBranch(req, res) {
  const result = await createBranchService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function deleteBranch(req, res) {
  const result = await deleteBranchService(req.user, req.validated.query.teamId, req.validated.params.name);
  res.json({ ok: true, data: result });
}

export async function getCommits(req, res) {
  const result = await getCommitsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getCommitBySha(req, res) {
  const result = await getCommitByShaService(req.user, req.validated.params.sha, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function getCompare(req, res) {
  const result = await getCompareService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getIssues(req, res) {
  const result = await getIssuesService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createIssue(req, res) {
  const result = await createIssueService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function updateIssue(req, res) {
  const result = await updateIssueService(req.user, req.validated.params.number, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function getPullRequests(req, res) {
  const result = await getPullRequestsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getPullRequestByNumber(req, res) {
  const result = await getPullRequestByNumberService(req.user, req.validated.params.number, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function mergeBranch(req, res) {
  const result = await mergeBranchService(req.user, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function createPullRequest(req, res) {
  const result = await createPullRequestService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function reviewPullRequest(req, res) {
  const result = await reviewPullRequestService(req.user, req.validated.params.number, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function mergePullRequest(req, res) {
  const result = await mergePullRequestService(req.user, req.validated.params.number, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function getActions(req, res) {
  const result = await getActionsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getWorkflowLogs(req, res) {
  const result = await getWorkflowLogsService(req.user, {
    ...req.validated.query,
    runId: req.validated.params.runId,
  });
  res.json({ ok: true, data: result });
}

export async function getReleases(req, res) {
  const result = await getReleasesService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createRelease(req, res) {
  const result = await createReleaseService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function getContributors(req, res) {
  const result = await getContributorsService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function getRepositoryAccessState(req, res) {
  const result = await getRepositoryAccessStateService(req.user, req.validated.query.teamId);
  res.json({ ok: true, data: result });
}

export async function inviteRepositoryCollaborator(req, res) {
  const result = await inviteRepositoryCollaboratorService(req.user, req.validated.body);
  res.status(result.invitationCreated ? 201 : 200).json({ ok: true, data: result });
}

export async function removeRepositoryCollaborator(req, res) {
  const result = await removeRepositoryCollaboratorService(
    req.user,
    req.validated.query.teamId,
    req.validated.params.username,
  );
  res.json({ ok: true, data: result });
}

export async function cancelRepositoryInvitation(req, res) {
  const result = await cancelRepositoryInvitationService(
    req.user,
    req.validated.query.teamId,
    req.validated.params.invitationId,
  );
  res.json({ ok: true, data: result });
}

export async function receiveWebhook(req, res) {
  const result = await handleGitHubWebhookService({
    headers: req.headers,
    body: req.body,
    rawBody: req.rawBody,
  });

  res.status(result.httpStatus ?? 200).json({ ok: true, data: result });
}
