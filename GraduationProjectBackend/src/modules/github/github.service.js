import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { App, Octokit } from "octokit";
import { prisma } from "../../loaders/dbLoader.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import {
  findTaskByGitHubBranchName,
  findTaskByGitHubIssueNumber,
  findTaskByGitHubPullRequestNumber,
  findTaskById as findTaskRecordById,
  listRepoBackedTasksByTeam,
  taskSelect,
  updateTaskById as updateTaskRecordById,
} from "../tasks/tasks.repository.js";

const READONLY_ROLES = [ROLES.DOCTOR, ROLES.TA];
const MEMBER_WRITE_ROLES = [ROLES.LEADER, ROLES.STUDENT];
const TASK_MARKER_PREFIX = "GPMS-TASK:";

const teamUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  academicId: true,
  department: true,
  academicYear: true,
  preferredTrack: true,
  avatarUrl: true,
  bio: true,
  githubUsername: true,
  linkedinUrl: true,
  isEmailVerified: true,
  accountStatus: true,
};

const githubTeamInclude = {
  leader: { select: teamUserSelect },
  doctor: { select: teamUserSelect },
  ta: { select: teamUserSelect },
  members: {
    orderBy: { joinedAt: "asc" },
    include: {
      user: { select: teamUserSelect },
    },
  },
  githubRepository: true,
  _count: {
    select: {
      members: true,
    },
  },
};

function httpError(status, code, message) {
  return new AppError(message, status, code);
}

function mapGitHubRepositoryCreationError(error, payload) {
  const status = Number(error?.status ?? 0);
  const githubMessage = normalizeText(error?.response?.data?.message ?? error?.message);
  const acceptedGithubPermissions = normalizeText(error?.response?.headers?.["x-accepted-github-permissions"]);
  const acceptedOauthScopes = normalizeText(error?.response?.headers?.["x-accepted-oauth-scopes"]);

  if (payload?.templateOwner && payload?.templateRepo) {
    if (status === 404) {
      return httpError(
        400,
        "GITHUB_TEMPLATE_NOT_FOUND",
        "The selected GitHub template repository was not found. Leave Template owner and Template repo empty unless you have a real GitHub template repository.",
      );
    }

    if (status === 403) {
      return httpError(
        403,
        "GITHUB_TEMPLATE_FORBIDDEN",
        "GPMS could not access that GitHub template repository. Make sure it exists and your connected GitHub account can use it.",
      );
    }
  }

  if (status === 404) {
    return httpError(
      404,
      "GITHUB_REPOSITORY_NOT_FOUND",
      "GitHub could not find the selected owner or repository settings. Double-check the owner login and installation.",
    );
  }

  if (status === 422 && githubMessage.toLowerCase().includes("name already exists")) {
    return httpError(
      409,
      "GITHUB_REPOSITORY_ALREADY_EXISTS",
      "A GitHub repository with this name already exists for that owner. Choose a different repository name.",
    );
  }

  if (status === 403) {
    if (
      githubMessage.toLowerCase().includes("resource not accessible by integration") &&
      acceptedGithubPermissions.toLowerCase().includes("administration=write")
    ) {
      return httpError(
        403,
        "GITHUB_REPOSITORY_CREATE_PERMISSION_MISSING",
        "Create repository is blocked by the GitHub App settings. In GitHub App settings, add Repository permissions > Administration: Read and write, save the app, then reinstall or refresh the installation on the selected GitHub account before trying again.",
      );
    }

    if (acceptedOauthScopes.toLowerCase().includes("repo")) {
      return httpError(
        403,
        "GITHUB_REPOSITORY_CREATE_SCOPE_MISSING",
        "GitHub rejected repository creation for this token. Reconnect Personal GitHub after updating the GitHub App permissions, then try again.",
      );
    }

    return httpError(
      403,
      "GITHUB_REPOSITORY_CREATE_FORBIDDEN",
      "GitHub blocked repository creation for this account or organization. Check the selected owner and the GPMS app installation.",
    );
  }

  if (githubMessage) {
    return httpError(400, "GITHUB_REPOSITORY_CREATE_FAILED", githubMessage);
  }

  return httpError(500, "GITHUB_REPOSITORY_CREATE_FAILED", "GitHub could not create the repository right now.");
}

function mapGitHubRepositoryWriteError(error, repositoryRecord) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  const githubMessage = normalizeText(error?.response?.data?.message ?? error?.message);
  const normalizedMessage = githubMessage.toLowerCase();

  // Extract more specific GitHub validation errors if they exist
  let detailedError = "";
  if (error?.response?.data?.errors?.length) {
    detailedError = error.response.data.errors
      .map((e) => e.message || e.code)
      .filter(Boolean)
      .join(". ");
  }
  const finalMessage = detailedError ? `${githubMessage}: ${detailedError}` : githubMessage;

  if (status === 401 || normalizedMessage.includes("bad credentials") || normalizedMessage.includes("expired")) {
    return getGitHubUserReconnectError();
  }

  if (status === 403 && normalizedMessage.includes("resource not accessible by integration")) {
    return httpError(
      403,
      "GITHUB_REPOSITORY_WRITE_ACCESS_REQUIRED",
      `Your connected GitHub account does not have write access to ${repositoryRecord.fullName}. A public repository is still read-only for other accounts unless they are collaborators or otherwise have write permission. Connect a GitHub account with write access, or ask ${repositoryRecord.ownerLogin} to grant collaborator access.`,
    );
  }

  if (status === 404) {
    return httpError(
      404,
      "GITHUB_REPOSITORY_NOT_FOUND",
      `GitHub could not find ${repositoryRecord.fullName} for this write action. Check that your connected GitHub account can access the repository and selected branch.`,
    );
  }

  if (status === 422) {
    if (normalizedMessage.includes("reference already exists")) {
      return httpError(409, "GITHUB_BRANCH_ALREADY_EXISTS", "That branch name already exists on GitHub. Choose a different branch name.");
    }

    if (normalizedMessage.includes("reference does not exist") || normalizedMessage.includes("no commit found for sha")) {
      return httpError(404, "GITHUB_BRANCH_NOT_FOUND", "GitHub could not find the selected source branch. Refresh the branch list and try again.");
    }

    if (normalizedMessage.includes("already exists") || normalizedMessage.includes("a pull request already exists")) {
      return httpError(409, "GITHUB_PULL_REQUEST_EXISTS", "A pull request already exists for these branches on GitHub.");
    }

    if (normalizedMessage.includes("no commits between") || normalizedMessage.includes("no differences")) {
      return httpError(400, "GITHUB_PULL_REQUEST_NO_COMMITS", "There are no new commits to merge between these branches.");
    }

    return httpError(
      422,
      "GITHUB_VALIDATION_FAILED",
      finalMessage || "GitHub validation failed. Check your branch names, commit history, and that branches have different files.",
    );
  }

  if (status === 409 || normalizedMessage.includes("conflict")) {
    return httpError(
      409,
      "GITHUB_WRITE_CONFLICT",
      "Merge conflict detected. GitHub cannot merge these branches automatically. Please resolve the conflicts on GitHub.com or using your local Git client, then try again.",
    );
  }

  if (status === 403) {
    return httpError(
      403,
      "GITHUB_REPOSITORY_WRITE_FORBIDDEN",
      finalMessage ||
        `GitHub blocked writing to ${repositoryRecord.fullName}. Check branch protection rules, repository rules, required checks, and secret scanning push protection.`,
    );
  }

  if (finalMessage) {
    return httpError(status || 400, "GITHUB_REPOSITORY_WRITE_FAILED", finalMessage);
  }

  return httpError(500, "GITHUB_REPOSITORY_WRITE_FAILED", `GitHub could not update ${repositoryRecord.fullName} right now.`);
}

function mapGitHubRepositoryAdministrationError(error, repositoryRecord, actionLabel) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  const githubMessage = normalizeText(error?.response?.data?.message ?? error?.message);
  const normalizedMessage = githubMessage.toLowerCase();
  const acceptedGithubPermissions = normalizeText(error?.response?.headers?.["x-accepted-github-permissions"]).toLowerCase();

  if (
    status === 403 &&
    normalizedMessage.includes("resource not accessible by integration") &&
    acceptedGithubPermissions.includes("administration=write")
  ) {
    return httpError(
      403,
      "GITHUB_REPOSITORY_ADMIN_PERMISSION_MISSING",
      "The GPMS GitHub App cannot manage repository visibility or collaborators yet. In GitHub App settings, set Repository permissions > Administration to Read and write, save the app, then refresh or reinstall it on the repository owner account.",
    );
  }

  if (status === 404) {
    return httpError(
      404,
      "GITHUB_REPOSITORY_NOT_FOUND",
      `GitHub could not find ${repositoryRecord.fullName}. Check that the GPMS GitHub App is still installed on ${repositoryRecord.ownerLogin}.`,
    );
  }

  if (status === 422 && normalizedMessage.includes("default branch")) {
    return httpError(
      422,
      "GITHUB_DEFAULT_BRANCH_INVALID",
      "GitHub could not switch the default branch. Make sure the selected branch already exists in the repository before saving this setting.",
    );
  }

  if (status === 422 && normalizedMessage.includes("visibility")) {
    return httpError(
      422,
      "GITHUB_REPOSITORY_VISIBILITY_INVALID",
      "GitHub rejected the requested repository visibility. If this repository belongs to an organization, check whether visibility changes are restricted by that organization.",
    );
  }

  if (status === 403) {
    return httpError(
      403,
      "GITHUB_REPOSITORY_ADMIN_FORBIDDEN",
      `GitHub blocked the request to ${actionLabel} for ${repositoryRecord.fullName}. Check that the GPMS GitHub App is installed on ${repositoryRecord.ownerLogin} and has repository administration permission.`,
    );
  }

  if (githubMessage) {
    return httpError(400, "GITHUB_REPOSITORY_ADMIN_FAILED", githubMessage);
  }

  return httpError(500, "GITHUB_REPOSITORY_ADMIN_FAILED", `GitHub could not ${actionLabel} right now.`);
}

function mapGitHubRepositoryConnectionError(error, payload) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  const githubMessage = normalizeText(error?.response?.data?.message ?? error?.message);
  const normalizedMessage = githubMessage.toLowerCase();
  const installationLabel = normalizeText(payload?.owner);
  const repoLabel = normalizeText(payload?.repoName);
  const fullName = installationLabel && repoLabel ? `${installationLabel}/${repoLabel}` : "that repository";

  if (status === 404) {
    return httpError(
      404,
      "GITHUB_REPOSITORY_NOT_FOUND",
      `GitHub could not find ${fullName} for the selected installation. Check the owner login and repository name, then try again.`,
    );
  }

  if (status === 403) {
    return httpError(
      403,
      "GITHUB_REPOSITORY_CONNECT_FORBIDDEN",
      "GPMS could not access that repository through the selected GitHub App installation. Make sure the repository exists and the GPMS app is installed on the selected owner account.",
    );
  }

  if (status === 422 && normalizedMessage.includes("name already exists")) {
    return httpError(
      409,
      "GITHUB_REPOSITORY_ALREADY_CONNECTED",
      "That repository is already connected in GPMS.",
    );
  }

  if (githubMessage) {
    return httpError(400, "GITHUB_REPOSITORY_CONNECT_FAILED", githubMessage);
  }

  return httpError(500, "GITHUB_REPOSITORY_CONNECT_FAILED", "GitHub could not connect that repository right now.");
}

function mapGitHubCollaboratorInviteError(error, repositoryRecord, login) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  const githubMessage = normalizeText(error?.response?.data?.message ?? error?.message);
  const normalizedMessage = githubMessage.toLowerCase();

  if (status === 404) {
    return httpError(
      404,
      "GITHUB_COLLABORATOR_NOT_FOUND",
      `GitHub could not find @${login}. Check the username and try again.`,
    );
  }

  if (
    status === 422 &&
    (normalizedMessage.includes("already has access") ||
      normalizedMessage.includes("already invited") ||
      normalizedMessage.includes("already a collaborator") ||
      normalizedMessage.includes("invitee is already a part of this repository"))
  ) {
    return httpError(
      409,
      "GITHUB_COLLABORATOR_ALREADY_ADDED",
      `@${login} already has repository access or already has a pending invitation.`,
    );
  }

  if (status === 422 && normalizedMessage.includes("cannot invite yourself")) {
    return httpError(
      400,
      "GITHUB_COLLABORATOR_SELF_INVITE",
      "The repository owner already has access. Choose another GitHub username to invite.",
    );
  }

  return mapGitHubRepositoryAdministrationError(error, repositoryRecord, `invite @${login} to the repository`);
}

function mapGitHubCollaboratorRemovalError(error, repositoryRecord, login) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  if (status === 404) {
    return httpError(
      404,
      "GITHUB_COLLABORATOR_NOT_FOUND",
      `@${login} is not currently a collaborator on ${repositoryRecord.fullName}.`,
    );
  }

  return mapGitHubRepositoryAdministrationError(error, repositoryRecord, `remove @${login} from the repository`);
}

function mapGitHubInvitationRemovalError(error, repositoryRecord, invitationId) {
  if (error instanceof AppError) return error;

  const status = Number(error?.status ?? 0);
  if (status === 404) {
    return httpError(
      404,
      "GITHUB_INVITATION_NOT_FOUND",
      `The pending repository invitation #${invitationId} was not found. It may already have been accepted, declined, or cancelled.`,
    );
  }

  return mapGitHubRepositoryAdministrationError(error, repositoryRecord, "cancel that repository invitation");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeGitHubPrivateKey(value) {
  return normalizeText(value).replace(/\\n/g, "\n");
}

function slugifyFilePath(value) {
  return normalizeText(value).replace(/^\/+/, "");
}

function isSensitiveWritePath(path) {
  const normalized = normalizeText(path).toLowerCase();
  const fileName = normalized.split("/").pop() ?? normalized;
  const isSensitiveDotEnv = fileName.startsWith(".env") && fileName !== ".env.example";
  const hasSensitiveExtension = [".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"].some((suffix) =>
    fileName.endsWith(suffix),
  );
  const isSensitiveKnownFile = [
    ".npmrc",
    "id_rsa",
    "id_ed25519",
    "google-services.json",
    "service-account.json",
    "credentials.json",
  ].includes(fileName);
  return isSensitiveDotEnv || hasSensitiveExtension || isSensitiveKnownFile;
}

function containsPotentialSecret(content) {
  const text = normalizeText(content);
  if (!text) return false;

  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bghp_[a-zA-Z0-9]{36}\b/,
    /\bgithub_pat_[a-zA-Z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /aws_secret_access_key\s*[:=]\s*[a-zA-Z0-9/+=]{32,}/i,
    /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[a-zA-Z0-9_\-/+=]{20,}/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function formatFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function buildFrontendRedirect(path, params = {}) {
  const base = env.frontendUrl ?? "http://localhost:3000";
  const url = new URL(path, base);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && `${value}` !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function ensureGitHubAppConfigured() {
  if (!env.githubAppId || !env.githubAppPrivateKey) {
    throw httpError(500, "GITHUB_APP_NOT_CONFIGURED", "GitHub App integration is not configured.");
  }
}

function ensureGitHubUserOauthConfigured() {
  const hasResolvableClientId = Boolean(env.githubAppClientId || (env.githubAppId && env.githubAppPrivateKey));
  if (!hasResolvableClientId || !env.githubAppClientSecret) {
    throw httpError(500, "GITHUB_USER_CONNECT_NOT_CONFIGURED", "GitHub personal connection is not configured.");
  }
}

function ensureTokenEncryptionConfigured() {
  if (!env.githubTokenEncryptionSecret) {
    throw httpError(500, "GITHUB_TOKEN_ENCRYPTION_NOT_CONFIGURED", "GitHub token encryption is not configured.");
  }
}

function getEncryptionKey() {
  ensureTokenEncryptionConfigured();
  return crypto.createHash("sha256").update(env.githubTokenEncryptionSecret).digest();
}

function encryptSecret(value) {
  const secret = normalizeText(value);
  if (!secret) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decryptSecret(payload) {
  const packed = normalizeText(payload);
  if (!packed) return null;

  const [ivPart, tagPart, cipherPart] = packed.split(".");
  if (!ivPart || !tagPart || !cipherPart) {
    throw httpError(500, "GITHUB_TOKEN_DECRYPT_FAILED", "Stored GitHub token is invalid.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64"),
  );

  decipher.setAuthTag(Buffer.from(tagPart, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherPart, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function signStateToken(payload, expiresIn = "15m") {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

function verifyStateToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw httpError(400, "GITHUB_STATE_INVALID", "GitHub connection state is invalid or expired.");
  }
}

function toTeamUserResponse(user) {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: formatFullName(user),
    email: user.email,
    role: user.role,
    academicId: user.academicId ?? null,
    department: user.department ?? null,
    academicYear: user.academicYear ?? null,
    preferredTrack: user.preferredTrack ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    githubUsername: user.githubUsername ?? null,
    linkedinUrl: user.linkedinUrl ?? null,
    isEmailVerified: Boolean(user.isEmailVerified),
    accountStatus: user.accountStatus,
  };
}

function toTeamSummary(team) {
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    bio: team.bio,
    stage: team.stage,
    visibility: team.visibility,
    memberCount: 1 + (team._count?.members ?? team.members?.length ?? 0),
    leader: toTeamUserResponse(team.leader),
    doctor: toTeamUserResponse(team.doctor),
    ta: toTeamUserResponse(team.ta),
    members: [
      {
        id: team.leader.id,
        teamRole: "LEADER",
        joinedAt: team.createdAt,
        user: toTeamUserResponse(team.leader),
      },
      ...(team.members ?? []).map((member) => ({
        id: member.id,
        teamRole: "MEMBER",
        joinedAt: member.joinedAt,
        user: toTeamUserResponse(member.user),
      })),
    ],
  };
}

function toGitHubConnectionResponse(connection, repositoryAccess = null) {
  if (!connection) {
    return {
      isConnected: false,
      login: null,
      displayName: null,
      avatarUrl: null,
      scopes: [],
      expiresAt: null,
      repositoryAccess,
    };
  }

  return {
    isConnected: Boolean(connection.isActive),
    login: connection.login,
    displayName: connection.displayName ?? null,
    avatarUrl: connection.avatarUrl ?? null,
    scopes: connection.scopes ?? [],
    expiresAt: connection.accessTokenExpiresAt ?? null,
    repositoryAccess,
  };
}

function toGitHubInstallationResponse(installation) {
  return {
    id: String(installation.id),
    accountLogin: installation.account?.login ?? null,
    accountType: installation.account?.type === "Organization" ? "ORGANIZATION" : "USER",
    repositorySelection: installation.repository_selection ?? null,
    appSlug: installation.app_slug ?? null,
  };
}

function toRepositoryRecordResponse(record) {
  if (!record) return null;

  return {
    id: record.id,
    teamId: record.teamId,
    ownerLogin: record.ownerLogin,
    ownerType: record.ownerType,
    repoName: record.repoName,
    fullName: record.fullName,
    installationId: record.installationId ?? null,
    defaultBranch: record.defaultBranch,
    visibility: record.visibility,
    repoUrl: record.repoUrl,
    cloneUrlHttps: record.cloneUrlHttps ?? null,
    cloneUrlSsh: record.cloneUrlSsh ?? null,
    connectionStatus: record.connectionStatus,
    syncStatus: record.syncStatus,
    lastSyncAt: record.lastSyncAt ?? null,
    lastWebhookAt: record.lastWebhookAt ?? null,
    syncSettings: {
      syncIssuesToTasks: Boolean(record.syncIssuesToTasks),
      syncActivityToWeeklyReports: Boolean(record.syncActivityToWeeklyReports),
      syncReleasesToSubmissions: Boolean(record.syncReleasesToSubmissions),
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function listAvailableInstallationsForConnection(connection) {
  if (!connection || !connection.isActive) return [];

  try {
    const usableConnection = await getUsableGitHubUserConnection(connection);
    const octokit = new Octokit({
      auth: decryptSecret(usableConnection.accessTokenEncrypted),
    });
    const { data } = await octokit.request("GET /user/installations");

    return (data.installations ?? [])
      .map((installation) => toGitHubInstallationResponse(installation))
      .sort((left, right) => {
        const leftKey = `${left.accountLogin ?? ""}:${left.id}`;
        const rightKey = `${right.accountLogin ?? ""}:${right.id}`;
        return leftKey.localeCompare(rightKey);
      });
  } catch {
    return [];
  }
}

function toGitHubRepositorySummary(repo) {
  if (!repo) return null;

  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: {
      login: repo.owner?.login ?? null,
      avatarUrl: repo.owner?.avatar_url ?? null,
      type: repo.owner?.type ?? null,
    },
    description: repo.description ?? "",
    url: repo.html_url,
    defaultBranch: repo.default_branch,
    visibility: (repo.visibility ?? (repo.private ? "private" : "public")).toUpperCase(),
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    watchers: repo.watchers_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    language: repo.language ?? null,
    topics: repo.topics ?? [],
    size: repo.size ?? 0,
    createdAt: repo.created_at ?? null,
    updatedAt: repo.updated_at ?? null,
    pushedAt: repo.pushed_at ?? null,
  };
}

function mapLabelNames(labels = []) {
  return labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .map((label) => normalizeText(label))
    .filter(Boolean);
}

function inferTaskStatusFromIssue(issue) {
  if (issue.state === "closed") return "DONE";

  const labels = mapLabelNames(issue.labels).map((label) => label.toLowerCase());
  if (labels.some((label) => label.includes("review"))) return "REVIEW";
  if (labels.some((label) => label.includes("progress") || label.includes("doing"))) return "IN_PROGRESS";
  if (labels.some((label) => label.includes("backlog"))) return "BACKLOG";
  return "TODO";
}

function inferTaskPriorityFromIssue(issue) {
  const labels = mapLabelNames(issue.labels).map((label) => label.toLowerCase());
  if (labels.some((label) => label.includes("critical"))) return "CRITICAL";
  if (labels.some((label) => label.includes("high"))) return "HIGH";
  if (labels.some((label) => label.includes("low"))) return "LOW";
  return "MEDIUM";
}

function inferTaskTypeFromIssue(issue) {
  const labels = mapLabelNames(issue.labels).map((label) => label.toLowerCase());

  if (labels.some((label) => label.includes("doc") || label.includes("readme"))) return "DOCUMENTATION";
  if (labels.some((label) => label.includes("design") || label.includes("ui") || label.includes("ux") || label.includes("figma"))) return "DESIGN";
  if (labels.some((label) => label.includes("research") || label.includes("analysis") || label.includes("spike"))) return "RESEARCH";
  if (labels.some((label) => label.includes("meeting") || label.includes("sync") || label.includes("discussion"))) return "MEETING";
  if (labels.some((label) => label.includes("presentation") || label.includes("pitch") || label.includes("demo") || label.includes("slides"))) return "PRESENTATION";
  if (
    labels.some(
      (label) =>
        label.includes("feature") ||
        label.includes("bug") ||
        label.includes("fix") ||
        label.includes("code") ||
        label.includes("frontend") ||
        label.includes("backend") ||
        label.includes("api") ||
        label.includes("refactor") ||
        label.includes("test"),
    )
  ) {
    return "CODE";
  }

  return "OTHER";
}

function slugifyBranchSegment(value) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "task";
}

function buildTaskMarker(taskId) {
  return `${TASK_MARKER_PREFIX}${normalizeText(taskId)}`;
}

function extractTaskMarker(value) {
  const match = normalizeText(value).match(/GPMS-TASK:\s*([a-z0-9_-]+)/i);
  return match?.[1] ?? null;
}

function extractReferencedIssueNumbers(value) {
  const matches = normalizeText(value).matchAll(/#(\d+)/g);
  return [...new Set(Array.from(matches, (match) => Number(match[1])).filter((issueNumber) => Number.isInteger(issueNumber)))];
}

function buildTaskBranchName(task) {
  const issueNumber = Number(task?.githubIssueNumber ?? 0);
  const titleSegment = slugifyBranchSegment(task?.title);

  if (issueNumber > 0) {
    return `task/${issueNumber}-${titleSegment}`;
  }

  return `task/${titleSegment}`;
}

function buildTaskIssueBody(task) {
  const description = normalizeText(task?.description);
  const metadata = [
    `Task type: ${task?.taskType ?? "OTHER"}`,
    `Priority: ${task?.priority ?? "MEDIUM"}`,
    buildTaskMarker(task?.id),
  ].join("\n");

  return [description, metadata].filter(Boolean).join("\n\n");
}

function ensureTaskPullRequestBody(body, task) {
  let nextBody = normalizeText(body) || normalizeText(task?.description);

  if (task?.githubIssueNumber && !nextBody.includes(`#${task.githubIssueNumber}`)) {
    nextBody = [nextBody, `Closes #${task.githubIssueNumber}`].filter(Boolean).join("\n\n");
  }

  const marker = buildTaskMarker(task?.id);
  if (marker && !nextBody.includes(marker)) {
    nextBody = [nextBody, marker].filter(Boolean).join("\n\n");
  }

  return nextBody;
}

function serializeIssue(issue, linkedTask = null) {
  return {
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    state: issue.state,
    htmlUrl: issue.html_url,
    comments: issue.comments ?? 0,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at ?? null,
    author: {
      login: issue.user?.login ?? null,
      avatarUrl: issue.user?.avatar_url ?? null,
    },
    assignees: (issue.assignees ?? []).map((assignee) => ({
      login: assignee.login,
      avatarUrl: assignee.avatar_url ?? null,
    })),
    labels: (issue.labels ?? []).map((label) => ({
      name: typeof label === "string" ? label : label?.name ?? "",
      color: typeof label === "string" ? null : label?.color ?? null,
    })),
    linkedTask,
  };
}

function serializePullRequest(pr) {
  return {
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    body: pr.body ?? "",
    state: pr.state,
    draft: Boolean(pr.draft),
    merged: Boolean(pr.merged_at),
    mergeable: pr.mergeable ?? null,
    htmlUrl: pr.html_url,
    base: pr.base?.ref ?? null,
    head: pr.head?.ref ?? null,
    author: {
      login: pr.user?.login ?? null,
      avatarUrl: pr.user?.avatar_url ?? null,
    },
    labels: (pr.labels ?? []).map((label) => ({
      name: label?.name ?? "",
      color: label?.color ?? null,
    })),
    requestedReviewers: (pr.requested_reviewers ?? []).map((reviewer) => ({
      login: reviewer.login,
      avatarUrl: reviewer.avatar_url ?? null,
    })),
    comments: pr.comments ?? 0,
    reviewComments: pr.review_comments ?? 0,
    commits: pr.commits ?? 0,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    changedFiles: pr.changed_files ?? 0,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at ?? null,
    mergedAt: pr.merged_at ?? null,
  };
}

function serializeCommit(commit) {
  return {
    sha: commit.sha,
    htmlUrl: commit.html_url ?? null,
    message: commit.commit?.message ?? "",
    author: {
      name: commit.commit?.author?.name ?? commit.author?.login ?? "Unknown",
      login: commit.author?.login ?? null,
      avatarUrl: commit.author?.avatar_url ?? null,
      date: commit.commit?.author?.date ?? null,
    },
    committer: {
      name: commit.commit?.committer?.name ?? commit.committer?.login ?? "Unknown",
      login: commit.committer?.login ?? null,
      avatarUrl: commit.committer?.avatar_url ?? null,
      date: commit.commit?.committer?.date ?? null,
    },
  };
}

function serializeCommitFileChange(file) {
  return {
    filename: file.filename,
    status: file.status ?? "modified",
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
    changes: file.changes ?? 0,
    patch: file.patch ?? null,
    previousFilename: file.previous_filename ?? null,
    blobUrl: file.blob_url ?? null,
    rawUrl: file.raw_url ?? null,
  };
}

function serializeCommitDetails(commit) {
  return {
    ...serializeCommit(commit),
    parents: (commit.parents ?? []).map((parent) => ({
      sha: parent.sha,
      htmlUrl: parent.html_url ?? null,
    })),
    stats: {
      total: commit.stats?.total ?? 0,
      additions: commit.stats?.additions ?? 0,
      deletions: commit.stats?.deletions ?? 0,
    },
    files: (commit.files ?? []).map(serializeCommitFileChange),
  };
}

function hasGitHubPaginationRelation(linkHeader, relation) {
  if (!linkHeader || !relation) return false;
  return linkHeader
    .split(",")
    .some((segment) => segment.includes(`rel="${relation}"`));
}

function serializeBranch(branch) {
  return {
    name: branch.name,
    protected: Boolean(branch.protected),
    commitSha: branch.commit?.sha ?? null,
    commitUrl: branch.commit?.url ?? null,
  };
}

function serializeWorkflowRun(run) {
  return {
    id: String(run.id),
    name: run.name ?? run.display_title ?? "Workflow run",
    status: run.status ?? null,
    conclusion: run.conclusion ?? null,
    htmlUrl: run.html_url,
    event: run.event ?? null,
    branch: run.head_branch ?? null,
    commitSha: run.head_sha ?? null,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    actor: {
      login: run.actor?.login ?? null,
      avatarUrl: run.actor?.avatar_url ?? null,
    },
  };
}

function serializeRelease(release) {
  return {
    id: String(release.id),
    tagName: release.tag_name,
    name: release.name ?? release.tag_name,
    body: release.body ?? "",
    htmlUrl: release.html_url,
    tarballUrl: release.tarball_url ?? null,
    zipballUrl: release.zipball_url ?? null,
    draft: Boolean(release.draft),
    prerelease: Boolean(release.prerelease),
    publishedAt: release.published_at ?? null,
    createdAt: release.created_at,
    author: {
      login: release.author?.login ?? null,
      avatarUrl: release.author?.avatar_url ?? null,
    },
  };
}

function serializeContributor(contributor) {
  return {
    id: String(contributor.id),
    login: contributor.login,
    avatarUrl: contributor.avatar_url ?? null,
    profileUrl: contributor.html_url ?? null,
    contributions: contributor.contributions ?? 0,
  };
}

function deriveCollaboratorPermission(collaborator) {
  const roleName = normalizeText(collaborator.role_name).toLowerCase();
  if (roleName) return roleName;

  if (collaborator.permissions?.admin) return "admin";
  if (collaborator.permissions?.maintain) return "maintain";
  if (collaborator.permissions?.push) return "push";
  if (collaborator.permissions?.triage) return "triage";
  if (collaborator.permissions?.pull) return "pull";
  return null;
}

function hasGitHubWritePermission(permission) {
  return ["admin", "maintain", "push", "write"].includes(normalizeText(permission).toLowerCase());
}

function hasGitHubAdminPermission(permission) {
  return normalizeText(permission).toLowerCase() === "admin";
}

function serializeRepositoryCollaborator(collaborator, repositoryRecord) {
  const permission = deriveCollaboratorPermission(collaborator);
  const isOwner =
    normalizeText(collaborator.login).toLowerCase() === normalizeText(repositoryRecord.ownerLogin).toLowerCase();

  return {
    id: String(collaborator.id),
    login: collaborator.login,
    avatarUrl: collaborator.avatar_url ?? null,
    profileUrl: collaborator.html_url ?? null,
    roleName: collaborator.role_name ?? null,
    permission,
    hasWriteAccess: isOwner || hasGitHubWritePermission(permission),
    hasAdminAccess: isOwner || hasGitHubAdminPermission(permission),
    isOwner,
  };
}

function serializeRepositoryInvitation(invitation) {
  return {
    id: String(invitation.id),
    inviteeLogin: invitation.invitee?.login ?? null,
    inviteeEmail: invitation.email ?? null,
    avatarUrl: invitation.invitee?.avatar_url ?? null,
    profileUrl: invitation.invitee?.html_url ?? null,
    inviterLogin: invitation.inviter?.login ?? null,
    permission: normalizeText(invitation.permissions ?? invitation.permission) || null,
    createdAt: invitation.created_at ?? null,
  };
}

function toConnectedRepositoryAccess({
  login = null,
  status = "UNKNOWN",
  permission = null,
  roleName = null,
  hasWriteAccess = false,
  hasAdminAccess = false,
} = {}) {
  return {
    login,
    status,
    permission,
    roleName,
    hasWriteAccess,
    hasAdminAccess,
  };
}

function serializeTreeNode(node) {
  return {
    name: node.name,
    path: node.path,
    type: node.type,
    size: node.size ?? null,
    sha: node.sha ?? null,
    url: node.html_url ?? null,
    downloadUrl: node.download_url ?? null,
  };
}

function computeWeekLabel(date = new Date()) {
  const base = new Date(date);
  const utc = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return `Week of ${utc.toISOString().slice(0, 10)}`;
}

async function getGitHubApp() {
  ensureGitHubAppConfigured();

  return new App({
    appId: env.githubAppId,
    privateKey: normalizeGitHubPrivateKey(env.githubAppPrivateKey),
  });
}

let cachedGitHubAppOauthClientId = null;
const GITHUB_USER_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

async function getGitHubAppOauthClientId() {
  if (cachedGitHubAppOauthClientId) {
    return cachedGitHubAppOauthClientId;
  }

  if (env.githubAppId && env.githubAppPrivateKey) {
    const app = await getGitHubApp();
    const { data } = await app.octokit.request("GET /app");
    if (data?.client_id) {
      cachedGitHubAppOauthClientId = String(data.client_id);
      return cachedGitHubAppOauthClientId;
    }
  }

  if (env.githubAppClientId) {
    cachedGitHubAppOauthClientId = env.githubAppClientId;
    return cachedGitHubAppOauthClientId;
  }

  throw httpError(500, "GITHUB_USER_CONNECT_NOT_CONFIGURED", "GitHub personal connection is not configured.");
}

function isGitHubUserAccessTokenExpired(connection) {
  if (!connection?.accessTokenExpiresAt) return false;
  return connection.accessTokenExpiresAt.getTime() <= Date.now() + GITHUB_USER_TOKEN_REFRESH_BUFFER_MS;
}

function isGitHubUserRefreshTokenExpired(connection) {
  if (!connection?.refreshTokenExpiresAt) return false;
  return connection.refreshTokenExpiresAt.getTime() <= Date.now() + GITHUB_USER_TOKEN_REFRESH_BUFFER_MS;
}

function getGitHubUserReconnectError() {
  return httpError(
    409,
    "GITHUB_USER_CONNECTION_EXPIRED",
    "Your personal GitHub connection has expired. Reconnect Personal GitHub, then try again.",
  );
}

async function refreshGitHubUserConnection(connection) {
  ensureGitHubUserOauthConfigured();

  if (!connection?.refreshTokenEncrypted) {
    throw getGitHubUserReconnectError();
  }

  if (isGitHubUserRefreshTokenExpired(connection)) {
    throw getGitHubUserReconnectError();
  }

  let refreshToken;
  try {
    refreshToken = decryptSecret(connection.refreshTokenEncrypted);
  } catch {
    throw getGitHubUserReconnectError();
  }

  if (!refreshToken) {
    throw getGitHubUserReconnectError();
  }

  const clientId = await getGitHubAppOauthClientId();
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: env.githubAppClientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    const normalizedError = normalizeText(tokenJson.error ?? tokenJson.error_description).toLowerCase();
    if (
      normalizedError.includes("expired") ||
      normalizedError.includes("invalid") ||
      normalizedError.includes("revoked") ||
      normalizedError.includes("incorrect client credentials")
    ) {
      throw getGitHubUserReconnectError();
    }

    throw httpError(
      502,
      "GITHUB_USER_CONNECTION_REFRESH_FAILED",
      tokenJson.error_description ?? "GitHub could not refresh the personal connection right now.",
    );
  }

  return prisma.gitHubUserConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptSecret(tokenJson.access_token),
      refreshTokenEncrypted: tokenJson.refresh_token
        ? encryptSecret(tokenJson.refresh_token)
        : connection.refreshTokenEncrypted,
      accessTokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000) : null,
      refreshTokenExpiresAt: tokenJson.refresh_token_expires_in
        ? new Date(Date.now() + Number(tokenJson.refresh_token_expires_in) * 1000)
        : connection.refreshTokenExpiresAt,
      tokenType: tokenJson.token_type ?? connection.tokenType ?? "bearer",
      scopes: String(tokenJson.scope ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: true,
    },
  });
}

async function getUsableGitHubUserConnection(connection) {
  if (!connection || !connection.isActive) {
    throw httpError(
      409,
      "GITHUB_USER_CONNECTION_REQUIRED",
      "Connect your personal GitHub account before performing this action.",
    );
  }

  if (!isGitHubUserAccessTokenExpired(connection)) {
    return connection;
  }

  return refreshGitHubUserConnection(connection);
}

async function findUserInstallationSuggestion(writeOctokit, ownerLogin) {
  const owner = normalizeText(ownerLogin).toLowerCase();
  if (!owner) return null;

  try {
    const { data } = await writeOctokit.request("GET /user/installations");
    const matched = (data.installations ?? []).find(
      (installation) => installation.account?.login?.toLowerCase() === owner,
    );

    if (!matched) return null;

    return {
      id: String(matched.id),
      accountLogin: matched.account?.login ?? ownerLogin,
      repositorySelection: matched.repository_selection ?? null,
    };
  } catch {
    return null;
  }
}

async function validateInstallationForOwner({ writeOctokit, installationId, ownerLogin }) {
  const installationNumber = Number(installationId);
  if (!Number.isFinite(installationNumber) || installationNumber <= 0) {
    throw httpError(400, "GITHUB_INSTALLATION_ID_INVALID", "Enter a valid GitHub App installation ID.");
  }

  const app = await getGitHubApp();
  const { data: appInfo } = await app.octokit.request("GET /app");

  if (installationNumber === Number(appInfo.id)) {
    const suggestion = await findUserInstallationSuggestion(writeOctokit, ownerLogin);
    throw httpError(
      400,
      "GITHUB_INSTALLATION_ID_INVALID",
      suggestion
        ? `${installationId} is the GitHub App ID, not the installation ID. Use ${suggestion.id} for ${suggestion.accountLogin}.`
        : `${installationId} is the GitHub App ID, not the installation ID. Click Install GPMS GitHub App and use the installation ID from that install.`,
    );
  }

  try {
    const { data } = await app.octokit.request("GET /app/installations/{installation_id}", {
      installation_id: installationNumber,
    });

    const installationOwner = data.account?.login ?? null;
    if (installationOwner && normalizeText(installationOwner).toLowerCase() !== normalizeText(ownerLogin).toLowerCase()) {
      throw httpError(
        400,
        "GITHUB_INSTALLATION_OWNER_MISMATCH",
        `This installation belongs to ${installationOwner}, not ${ownerLogin}. Choose the matching owner or use the correct installation ID.`,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (Number(error?.status ?? 0) === 404) {
      const suggestion = await findUserInstallationSuggestion(writeOctokit, ownerLogin);
      throw httpError(
        400,
        "GITHUB_INSTALLATION_NOT_FOUND",
        suggestion
          ? `Installation ID ${installationId} was not found. For ${ownerLogin}, try ${suggestion.id}.`
          : `GitHub installation ID ${installationId} was not found. Click Install GPMS GitHub App again and use the returned installation ID.`,
      );
    }

    throw httpError(
      400,
      "GITHUB_INSTALLATION_INVALID",
      "GPMS could not verify this GitHub App installation. Check the selected owner and installation ID.",
    );
  }
}

async function getInstallationOctokit(installationId) {
  if (!installationId) {
    throw httpError(409, "GITHUB_INSTALLATION_REQUIRED", "GitHub App installation is required for this team.");
  }

  const app = await getGitHubApp();
  return app.getInstallationOctokit(Number(installationId));
}

async function getUserConnectionByUserId(userId) {
  return prisma.gitHubUserConnection.findUnique({
    where: { userId },
  });
}

async function requireUserWriteOctokit(actor) {
  const connection = await getUserConnectionByUserId(actor.id);
  const usableConnection = await getUsableGitHubUserConnection(connection);

  return new Octokit({
    auth: decryptSecret(usableConnection.accessTokenEncrypted),
  });
}

async function getTeamById(teamId) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: githubTeamInclude,
  });
}

async function getDefaultTeamForActor(actor) {
  if (actor.role === ROLES.LEADER) {
    return prisma.team.findFirst({
      where: { leaderId: actor.id },
      include: githubTeamInclude,
    });
  }

  if (actor.role === ROLES.STUDENT) {
    return prisma.team.findFirst({
      where: {
        members: {
          some: {
            userId: actor.id,
          },
        },
      },
      include: githubTeamInclude,
    });
  }

  if (actor.role === ROLES.DOCTOR || actor.role === ROLES.TA) {
    return null;
  }

  return null;
}

function canAccessTeam(actor, team) {
  if (!team) return false;
  if (actor.role === ROLES.ADMIN) return true;
  if (team.leaderId === actor.id) return true;
  if (actor.role === ROLES.STUDENT && team.members.some((member) => member.userId === actor.id)) return true;
  if (actor.role === ROLES.DOCTOR && team.doctorId === actor.id) return true;
  if (actor.role === ROLES.TA && team.taId === actor.id) return true;
  return false;
}

function canManageTeamGithub(actor, team) {
  return actor.role === ROLES.ADMIN || team?.leaderId === actor.id;
}

function canWriteToTeamGithub(actor, team) {
  if (!MEMBER_WRITE_ROLES.includes(actor.role)) return false;
  if (team?.leaderId === actor.id) return true;
  return team?.members.some((member) => member.userId === actor.id) ?? false;
}

async function resolveTargetTeam(actor, requestedTeamId, { allowNull = false } = {}) {
  const team = requestedTeamId ? await getTeamById(requestedTeamId) : await getDefaultTeamForActor(actor);

  if (!team) {
    if (allowNull) return null;
    if ([ROLES.ADMIN, ROLES.DOCTOR, ROLES.TA].includes(actor.role)) {
      throw httpError(400, "TEAM_ID_REQUIRED", "Provide a teamId to access a GitHub workspace.");
    }
    throw httpError(409, "TEAM_REQUIRED", "You need to be part of a team before using the GitHub workspace.");
  }

  if (!canAccessTeam(actor, team)) {
    throw httpError(403, "GITHUB_TEAM_ACCESS_FORBIDDEN", "You are not allowed to access this team's GitHub workspace.");
  }

  return team;
}

async function requireConnectedRepository(actor, requestedTeamId) {
  const team = await resolveTargetTeam(actor, requestedTeamId);
  if (!team.githubRepository || team.githubRepository.connectionStatus !== "ACTIVE") {
    throw httpError(409, "GITHUB_REPOSITORY_NOT_CONNECTED", "This team has not connected a GitHub repository yet.");
  }

  return {
    team,
    repositoryRecord: team.githubRepository,
  };
}

async function persistRepositoryConnection(teamId, payload) {
  return prisma.gitHubTeamRepository.upsert({
    where: { teamId },
    update: payload,
    create: {
      teamId,
      ...payload,
    },
  });
}

async function refreshRepositoryConnectionMetadata(repositoryRecord, repo) {
  return persistRepositoryConnection(repositoryRecord.teamId, {
    ownerLogin: repo.owner.login,
    ownerType: repo.owner.type === "Organization" ? "ORGANIZATION" : "USER",
    repoName: repo.name,
    fullName: repo.full_name,
    installationId: repositoryRecord.installationId,
    defaultBranch: repo.default_branch ?? repositoryRecord.defaultBranch ?? "main",
    visibility: (repo.visibility ?? (repo.private ? "private" : "public")).toUpperCase(),
    repoUrl: repo.html_url,
    cloneUrlHttps: repo.clone_url ?? null,
    cloneUrlSsh: repo.ssh_url ?? null,
    connectionStatus: repositoryRecord.connectionStatus ?? "ACTIVE",
    syncStatus: repositoryRecord.syncStatus ?? "IDLE",
    syncIssuesToTasks: repositoryRecord.syncIssuesToTasks,
    syncActivityToWeeklyReports: repositoryRecord.syncActivityToWeeklyReports,
    syncReleasesToSubmissions: repositoryRecord.syncReleasesToSubmissions,
    lastSyncAt: repositoryRecord.lastSyncAt ?? null,
    lastWebhookAt: repositoryRecord.lastWebhookAt ?? null,
  });
}

async function markRepositorySyncState(repositoryId, data) {
  return prisma.gitHubTeamRepository.update({
    where: { id: repositoryId },
    data,
  });
}

async function upsertSyncCursor(repositoryId, resourceType, cursor = {}) {
  return prisma.gitHubSyncCursor.upsert({
    where: {
      repositoryId_resourceType: {
        repositoryId,
        resourceType,
      },
    },
    update: {
      ...cursor,
      lastSyncedAt: new Date(),
    },
    create: {
      repositoryId,
      resourceType,
      ...cursor,
      lastSyncedAt: new Date(),
    },
  });
}

async function resolveGitHubLoginToUserId(login) {
  const normalizedLogin = normalizeText(login);
  if (!normalizedLogin) return null;

  const matchingUser = await prisma.user.findFirst({
    where: {
      githubUsername: {
        equals: normalizedLogin,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  return matchingUser?.id ?? null;
}

async function findTaskByMarkerForTeam(teamId, text) {
  const markerTaskId = extractTaskMarker(text);
  if (!markerTaskId) return null;

  const task = await findTaskRecordById(markerTaskId);
  if (!task || task.teamId !== teamId) {
    return null;
  }

  return task;
}

function buildTaskIssueSyncData(issue, assigneeUserId, existingTask = null, team = null) {
  const baseData = {
    githubIssueId: String(issue.id),
    githubIssueNumber: issue.number,
    githubIssueUrl: issue.html_url,
    githubIssueState: issue.state,
    labels: mapLabelNames(issue.labels),
    syncedFromGithub: true,
    lastSyncedAt: new Date(),
  };

  if (!existingTask) {
    return {
      ...baseData,
      taskType: inferTaskTypeFromIssue(issue),
      integrationMode: "GITHUB",
      origin: "GITHUB_IMPORT",
      title: issue.title,
      description: issue.body ?? null,
      status: inferTaskStatusFromIssue(issue),
      priority: inferTaskPriorityFromIssue(issue),
      assigneeUserId,
      createdByUserId: team?.leaderId ?? null,
    };
  }

  if (existingTask.origin === "GITHUB_IMPORT") {
    return {
      ...baseData,
      taskType: existingTask.taskType === "OTHER" ? inferTaskTypeFromIssue(issue) : existingTask.taskType,
      integrationMode: "GITHUB",
      title: issue.title,
      description: issue.body ?? null,
      status: inferTaskStatusFromIssue(issue),
      priority: inferTaskPriorityFromIssue(issue),
      assigneeUserId,
    };
  }

  return baseData;
}

async function syncIssueIntoTask(team, issue) {
  const assigneeUserId = await resolveGitHubLoginToUserId(issue.assignees?.[0]?.login ?? null);
  let existingTask = await findTaskByGitHubIssueNumber(team.id, issue.number);

  if (!existingTask) {
    existingTask = await findTaskByMarkerForTeam(team.id, issue.body ?? "");
  }

  if (existingTask) {
    return updateTaskRecordById(existingTask.id, buildTaskIssueSyncData(issue, assigneeUserId, existingTask, team));
  }

  return prisma.task.create({
    data: {
      teamId: team.id,
      ...buildTaskIssueSyncData(issue, assigneeUserId, null, team),
    },
    select: taskSelect,
  });
}

async function syncIssuesIntoTasks(team, repositoryRecord, readOctokit) {
  const issues = await readOctokit.paginate(readOctokit.rest.issues.listForRepo, {
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    state: "all",
    per_page: 100,
  });

  const synced = [];

  for (const issue of issues) {
    if (issue.pull_request) continue;
    synced.push(await syncIssueIntoTask(team, issue));
  }

  await upsertSyncCursor(repositoryRecord.id, "issues");
  return synced;
}

async function syncReleasesIntoSubmissions(team, repositoryRecord, readOctokit) {
  const { data: releases } = await readOctokit.rest.repos.listReleases({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    per_page: 20,
  });

  const synced = [];

  for (const release of releases) {
    const submission = await prisma.submission.upsert({
      where: {
        githubReleaseId: String(release.id),
      },
      update: {
        githubReleaseTag: release.tag_name,
        githubReleaseUrl: release.html_url,
        artifactUrl: release.zipball_url ?? release.tarball_url ?? null,
        version: 1,
        deliverableType: "CODE",
        sourceType: "GITHUB_RELEASE",
        submittedAt: release.published_at ? new Date(release.published_at) : new Date(release.created_at),
      },
      create: {
        teamId: team.id,
        deliverableType: "CODE",
        sourceType: "GITHUB_RELEASE",
        githubReleaseId: String(release.id),
        githubReleaseTag: release.tag_name,
        githubReleaseUrl: release.html_url,
        artifactUrl: release.zipball_url ?? release.tarball_url ?? null,
        version: 1,
        submittedAt: release.published_at ? new Date(release.published_at) : new Date(release.created_at),
      },
    });

    synced.push(submission);
  }

  await upsertSyncCursor(repositoryRecord.id, "releases");
  return synced;
}

async function syncActivityIntoWeeklyReport(team, repositoryRecord, readOctokit) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const weekLabel = computeWeekLabel();

  const [commits, pullsData, workflowRunsData] = await Promise.all([
    readOctokit.paginate(readOctokit.rest.repos.listCommits, {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      sha: repositoryRecord.defaultBranch,
      since: since.toISOString(),
      per_page: 100,
    }),
    readOctokit.rest.pulls.list({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: 100,
    }),
    readOctokit.rest.actions.listWorkflowRunsForRepo({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      per_page: 50,
    }),
  ]);

  const recentPulls = pullsData.data.filter((pull) => new Date(pull.updated_at) >= since);
  const recentRuns = (workflowRunsData.data.workflow_runs ?? []).filter((run) => new Date(run.updated_at) >= since);

  const draft = [
    `GitHub activity summary for ${team.name}.`,
    `${commits.length} commits landed in the last 7 days.`,
    `${recentPulls.filter((pull) => pull.state === "open").length} pull requests remain open and ${recentPulls.filter((pull) => pull.merged_at).length} were merged this week.`,
    `${recentRuns.filter((run) => run.conclusion === "success").length} workflow runs completed successfully.`,
  ].join(" ");

  const report = await prisma.weeklyReport.upsert({
    where: {
      teamId_weekLabel: {
        teamId: team.id,
        weekLabel,
      },
    },
    update: {
      summaryDraft: draft,
      githubActivity: {
        commits: commits.slice(0, 20).map(serializeCommit),
        pullRequests: recentPulls.slice(0, 20).map(serializePullRequest),
        workflowRuns: recentRuns.slice(0, 20).map(serializeWorkflowRun),
      },
    },
    create: {
      teamId: team.id,
      weekLabel,
      summaryDraft: draft,
      githubActivity: {
        commits: commits.slice(0, 20).map(serializeCommit),
        pullRequests: recentPulls.slice(0, 20).map(serializePullRequest),
        workflowRuns: recentRuns.slice(0, 20).map(serializeWorkflowRun),
      },
    },
  });

  await upsertSyncCursor(repositoryRecord.id, "activity");
  return report;
}

function toRepositoryCommitUrl(repositoryRecord, sha) {
  const normalizedSha = normalizeText(sha);
  if (!normalizedSha) return null;
  return `https://github.com/${repositoryRecord.fullName}/commit/${normalizedSha}`;
}

async function getIssueByNumberSafe(readOctokit, repositoryRecord, issueNumber) {
  if (!issueNumber) return null;

  try {
    const { data } = await readOctokit.rest.issues.get({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      issue_number: issueNumber,
    });
    return data;
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      return null;
    }

    throw error;
  }
}

async function getPullRequestByNumberSafe(readOctokit, repositoryRecord, pullNumber) {
  if (!pullNumber) return null;

  try {
    const { data } = await readOctokit.rest.pulls.get({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      pull_number: pullNumber,
    });
    return data;
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      return null;
    }

    throw error;
  }
}

async function getBranchByNameSafe(readOctokit, repositoryRecord, branchName) {
  const normalizedBranchName = normalizeText(branchName);
  if (!normalizedBranchName) return null;

  try {
    const { data } = await readOctokit.rest.repos.getBranch({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      branch: normalizedBranchName,
    });
    return data;
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      return null;
    }

    throw error;
  }
}

async function getCompareByRefsSafe(readOctokit, repositoryRecord, base, head) {
  if (!base || !head) return null;

  try {
    const { data } = await readOctokit.rest.repos.compareCommits({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      base,
      head,
    });
    return data;
  } catch (error) {
    const status = Number(error?.status ?? 0);
    if (status === 404 || status === 409) {
      return null;
    }

    throw error;
  }
}

async function listPullRequestsByHeadBranch(readOctokit, repositoryRecord, branchName) {
  const normalizedBranchName = normalizeText(branchName);
  if (!normalizedBranchName) return [];

  const { data } = await readOctokit.rest.pulls.list({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    state: "all",
    head: `${repositoryRecord.ownerLogin}:${normalizedBranchName}`,
    per_page: 20,
  });

  return data.filter((pullRequest) => normalizeText(pullRequest.head?.ref) === normalizedBranchName);
}

async function resolveTaskPullRequestForSync(task, repositoryRecord, readOctokit, branchName) {
  const byNumber = await getPullRequestByNumberSafe(readOctokit, repositoryRecord, task.githubPullRequestNumber);
  if (byNumber) {
    return byNumber;
  }

  const pullRequests = await listPullRequestsByHeadBranch(readOctokit, repositoryRecord, branchName);
  if (!pullRequests.length) {
    return null;
  }

  const markerMatch = pullRequests.find((pullRequest) => extractTaskMarker(pullRequest.body ?? "") === task.id);
  if (markerMatch) {
    return markerMatch;
  }

  if (task.githubIssueNumber) {
    const issueMatch = pullRequests.find((pullRequest) =>
      extractReferencedIssueNumbers(pullRequest.body ?? "").includes(task.githubIssueNumber),
    );
    if (issueMatch) {
      return issueMatch;
    }
  }

  return pullRequests[0] ?? null;
}

async function syncTaskGitHubStateRecord(task, repositoryRecord, readOctokit) {
  const updateData = {
    lastSyncedAt: new Date(),
  };

  const currentBranchName = normalizeText(task.githubBranchName || task.githubPullRequestHead);
  const issue = await getIssueByNumberSafe(readOctokit, repositoryRecord, task.githubIssueNumber);
  if (issue) {
    const assigneeUserId = await resolveGitHubLoginToUserId(issue.assignees?.[0]?.login ?? null);
    Object.assign(updateData, buildTaskIssueSyncData(issue, assigneeUserId, task));
  } else if (task.origin === "GPMS" && task.githubIssueNumber) {
    Object.assign(updateData, {
      githubIssueId: null,
      githubIssueNumber: null,
      githubIssueUrl: null,
      githubIssueState: null,
      syncedFromGithub: false,
    });
  }

  const pullRequest = await resolveTaskPullRequestForSync(task, repositoryRecord, readOctokit, currentBranchName);
  const nextBranchName = normalizeText(pullRequest?.head?.ref || currentBranchName);
  const branch = await getBranchByNameSafe(readOctokit, repositoryRecord, nextBranchName);
  const compare = !pullRequest && branch && nextBranchName !== normalizeText(repositoryRecord.defaultBranch)
    ? await getCompareByRefsSafe(readOctokit, repositoryRecord, repositoryRecord.defaultBranch, nextBranchName)
    : null;

  const compareCommits = compare?.commits ?? [];
  const latestCompareCommit = compareCommits[compareCommits.length - 1] ?? null;
  const latestCommitSha = pullRequest?.head?.sha ?? latestCompareCommit?.sha ?? branch?.commit?.sha ?? null;
  const latestCommitUrl = pullRequest?.head?.sha
    ? toRepositoryCommitUrl(repositoryRecord, pullRequest.head.sha)
    : latestCompareCommit?.html_url ?? toRepositoryCommitUrl(repositoryRecord, branch?.commit?.sha);
  const commitCount = pullRequest?.commits ?? compare?.ahead_by ?? (pullRequest?.merged_at ? Number(task.githubCommitCount ?? 0) : branch ? Number(task.githubCommitCount ?? 0) : 0);
  const keepHistoricalBranch = Boolean(pullRequest?.merged_at || task.githubPullRequestMergedAt || task.status === "DONE");

  updateData.githubBranchName = nextBranchName || (keepHistoricalBranch ? currentBranchName || null : null);
  updateData.githubLatestCommitSha = latestCommitSha;
  updateData.githubLatestCommitUrl = latestCommitUrl;
  updateData.githubCommitCount = Number.isFinite(Number(commitCount)) ? Number(commitCount) : 0;

  if (pullRequest) {
    updateData.githubPullRequestId = String(pullRequest.id);
    updateData.githubPullRequestNumber = pullRequest.number;
    updateData.githubPullRequestUrl = pullRequest.html_url;
    updateData.githubPullRequestState = pullRequest.state;
    updateData.githubPullRequestBase = pullRequest.base?.ref ?? repositoryRecord.defaultBranch;
    updateData.githubPullRequestHead = (pullRequest.head?.ref ?? nextBranchName) || null;
    updateData.githubPullRequestMergedAt = pullRequest.merged_at ? new Date(pullRequest.merged_at) : null;
  } else {
    updateData.githubPullRequestId = null;
    updateData.githubPullRequestNumber = null;
    updateData.githubPullRequestUrl = null;
    updateData.githubPullRequestState = null;
    updateData.githubPullRequestBase = null;
    updateData.githubPullRequestHead = null;
    updateData.githubPullRequestMergedAt = null;
  }

  if (!branch && !pullRequest && !keepHistoricalBranch) {
    updateData.githubBranchName = null;
    updateData.githubLatestCommitSha = null;
    updateData.githubLatestCommitUrl = null;
    updateData.githubCommitCount = 0;
  }

  if (task.integrationMode === "GITHUB" && task.origin === "GPMS" && pullRequest?.merged_at) {
    updateData.status = "DONE";
  }

  return updateTaskRecordById(task.id, updateData);
}

async function syncRepoBackedTasksIntoLocalModels(team, repositoryRecord, readOctokit) {
  const tasks = await listRepoBackedTasksByTeam(team.id);
  let syncedCount = 0;

  for (const task of tasks) {
    await syncTaskGitHubStateRecord(task, repositoryRecord, readOctokit);
    syncedCount += 1;
  }

  return syncedCount;
}

async function syncRepositoryIntoLocalModels(team, repositoryRecord, readOctokit) {
  const results = {
    issuesSynced: 0,
    releasesSynced: 0,
    weeklyReportUpdated: false,
    repoBackedTasksSynced: 0,
  };

  if (repositoryRecord.syncIssuesToTasks) {
    const tasks = await syncIssuesIntoTasks(team, repositoryRecord, readOctokit);
    results.issuesSynced = tasks.length;
  }

  results.repoBackedTasksSynced = await syncRepoBackedTasksIntoLocalModels(team, repositoryRecord, readOctokit);

  if (repositoryRecord.syncReleasesToSubmissions) {
    const submissions = await syncReleasesIntoSubmissions(team, repositoryRecord, readOctokit);
    results.releasesSynced = submissions.length;
  }

  if (repositoryRecord.syncActivityToWeeklyReports) {
    await syncActivityIntoWeeklyReport(team, repositoryRecord, readOctokit);
    results.weeklyReportUpdated = true;
  }

  await markRepositorySyncState(repositoryRecord.id, {
    syncStatus: "IDLE",
    lastSyncAt: new Date(),
  });

  return results;
}

async function fetchRepositoryWithReadAccess(actor, requestedTeamId) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, requestedTeamId);
  const readOctokit = await getInstallationOctokit(repositoryRecord.installationId);

  return { team, repositoryRecord, readOctokit };
}

function assertCanManageRepository(actor, team) {
  if (!canManageTeamGithub(actor, team)) {
    throw httpError(403, "GITHUB_MANAGE_FORBIDDEN", "Only the team leader or an admin can manage this repository.");
  }
}

function assertCanWriteRepository(actor, team) {
  if (!canWriteToTeamGithub(actor, team)) {
    throw httpError(403, "GITHUB_WRITE_FORBIDDEN", "You are not allowed to modify this repository from GPMS.");
  }
}

function assertCanReadRepository(actor, team) {
  if (!canAccessTeam(actor, team)) {
    throw httpError(403, "GITHUB_READ_FORBIDDEN", "You are not allowed to view this repository.");
  }
}

async function getProtectedBranchState(readOctokit, repositoryRecord, branchName) {
  const { data } = await readOctokit.rest.repos.getBranch({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    branch: branchName,
  });

  return data;
}

async function getRepositoryWithMeta(readOctokit, repositoryRecord) {
  const { data: repo } = await readOctokit.rest.repos.get({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
  });
  await refreshRepositoryConnectionMetadata(repositoryRecord, repo);

  const [pulls, contributors] = await Promise.all([
    readOctokit.rest.pulls.list({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      state: "open",
      per_page: 10,
    }),
    readOctokit.rest.repos.listContributors({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      per_page: 10,
    }),
  ]);

  return {
    repository: toGitHubRepositorySummary(repo),
    openPullRequests: pulls.data.length,
    topContributors: contributors.data.slice(0, 6).map(serializeContributor),
  };
}

async function resolveConnectedRepositoryAccess(connection, repositoryRecord, readOctokit, repository = null) {
  if (!connection || !connection.isActive) {
    return toConnectedRepositoryAccess({
      status: "NOT_CONNECTED",
    });
  }

  const login = normalizeText(connection.login);
  if (!login) {
    return toConnectedRepositoryAccess({
      status: "UNKNOWN",
    });
  }

  if (login.toLowerCase() === normalizeText(repositoryRecord.ownerLogin).toLowerCase()) {
    return toConnectedRepositoryAccess({
      login: connection.login,
      status: "OWNER",
      permission: "admin",
      roleName: "owner",
      hasWriteAccess: true,
      hasAdminAccess: true,
    });
  }

  try {
    const { data } = await readOctokit.request("GET /repos/{owner}/{repo}/collaborators/{username}/permission", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      username: connection.login,
    });

    const permission = normalizeText(data.permission).toLowerCase() || null;
    const roleName = normalizeText(data.role_name).toLowerCase() || permission;
    const hasAdminAccess = hasGitHubAdminPermission(permission) || hasGitHubAdminPermission(roleName);
    const hasWriteAccess = hasAdminAccess || hasGitHubWritePermission(permission) || hasGitHubWritePermission(roleName);

    return toConnectedRepositoryAccess({
      login: connection.login,
      status: hasAdminAccess ? "ADMIN" : hasWriteAccess ? "WRITE" : "READ_ONLY",
      permission,
      roleName,
      hasWriteAccess,
      hasAdminAccess,
    });
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      const visibility = normalizeText(repository?.visibility ?? repositoryRecord.visibility).toLowerCase();
      return toConnectedRepositoryAccess({
        login: connection.login,
        status: visibility === "public" ? "READ_ONLY" : "NO_ACCESS",
        permission: visibility === "public" ? "read" : null,
        roleName: visibility === "public" ? "public" : null,
        hasWriteAccess: false,
        hasAdminAccess: false,
      });
    }

    return toConnectedRepositoryAccess({
      login: connection.login,
      status: "UNKNOWN",
      hasWriteAccess: false,
      hasAdminAccess: false,
    });
  }
}

async function getRepositoryAccessStateData(repositoryRecord, readOctokit) {
  const [collaboratorsResponse, invitationsResponse] = await Promise.all([
    readOctokit.request("GET /repos/{owner}/{repo}/collaborators", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      affiliation: "all",
      per_page: 100,
    }),
    readOctokit.request("GET /repos/{owner}/{repo}/invitations", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      per_page: 100,
    }),
  ]);

  return {
    collaborators: collaboratorsResponse.data.map((collaborator) =>
      serializeRepositoryCollaborator(collaborator, repositoryRecord),
    ),
    invitations: invitationsResponse.data.map(serializeRepositoryInvitation),
  };
}

function getTreeEntriesFromContentResponse(data) {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size ?? null,
      sha: item.sha,
      html_url: item.html_url ?? null,
      download_url: item.download_url ?? null,
    }));
  }

  return [
    {
      name: data.name,
      path: data.path,
      type: data.type,
      size: data.size ?? null,
      sha: data.sha,
      html_url: data.html_url ?? null,
      download_url: data.download_url ?? null,
    },
  ];
}

export async function getUserConnectionStateService(actor) {
  const connection = await getUserConnectionByUserId(actor.id);
  return toGitHubConnectionResponse(connection);
}

export async function getGitHubUserConnectUrlService(actor, teamId) {
  ensureGitHubUserOauthConfigured();
  const clientId = await getGitHubAppOauthClientId();

  if (teamId) {
    await resolveTargetTeam(actor, teamId);
  }

  const state = signStateToken({
    purpose: "github-user-connect",
    userId: actor.id,
    teamId: teamId ?? null,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    state,
    prompt: "select_account",
  });

  return {
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  };
}

export async function githubUserCallbackService(query) {
  if (query.error) {
    return {
      redirectUrl: buildFrontendRedirect("/dashboard/github", {
        githubConnect: "error",
        reason: query.error_description ?? query.error,
      }),
    };
  }

  ensureGitHubUserOauthConfigured();
  const clientId = await getGitHubAppOauthClientId();

  const { purpose, userId, teamId } = verifyStateToken(query.state ?? "");
  if (purpose !== "github-user-connect" || !userId) {
    throw httpError(400, "GITHUB_STATE_INVALID", "GitHub connection state is invalid.");
  }

  if (!query.code) {
    throw httpError(400, "GITHUB_OAUTH_CODE_MISSING", "GitHub did not return an authorization code.");
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: env.githubAppClientSecret,
      code: query.code,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw httpError(
      400,
      "GITHUB_USER_CONNECT_FAILED",
      tokenJson.error_description ?? "GitHub personal connection failed.",
    );
  }

  const octokit = new Octokit({ auth: tokenJson.access_token });
  const { data: user } = await octokit.rest.users.getAuthenticated();

  const appUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!appUser) {
    throw httpError(404, "USER_NOT_FOUND", "User not found.");
  }

  const githubUserId = String(user.id);
  const existingConnectionForGitHubUser = await prisma.gitHubUserConnection.findUnique({
    where: { githubUserId },
    select: { userId: true },
  });
  if (existingConnectionForGitHubUser && existingConnectionForGitHubUser.userId !== userId) {
    throw httpError(
      409,
      "GITHUB_ACCOUNT_ALREADY_CONNECTED",
      "The selected GitHub account is already linked to another GPMS account. Disconnect it there first, or choose a different GitHub account.",
    );
  }

  const existingUserForGitHubId = await prisma.user.findUnique({
    where: { githubId: githubUserId },
    select: { id: true },
  });
  if (existingUserForGitHubId && existingUserForGitHubId.id !== userId) {
    throw httpError(
      409,
      "GITHUB_ACCOUNT_ALREADY_CONNECTED",
      "The selected GitHub account is already linked to another GPMS account. Disconnect it there first, or choose a different GitHub account.",
    );
  }

  await prisma.gitHubUserConnection.upsert({
    where: { userId },
    update: {
      githubUserId,
      login: user.login,
      displayName: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      accessTokenEncrypted: encryptSecret(tokenJson.access_token),
      refreshTokenEncrypted: tokenJson.refresh_token ? encryptSecret(tokenJson.refresh_token) : null,
      accessTokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000) : null,
      refreshTokenExpiresAt: tokenJson.refresh_token_expires_in
        ? new Date(Date.now() + Number(tokenJson.refresh_token_expires_in) * 1000)
        : null,
      tokenType: tokenJson.token_type ?? "bearer",
      scopes: String(tokenJson.scope ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: true,
    },
    create: {
      userId,
      githubUserId,
      login: user.login,
      displayName: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      accessTokenEncrypted: encryptSecret(tokenJson.access_token),
      refreshTokenEncrypted: tokenJson.refresh_token ? encryptSecret(tokenJson.refresh_token) : null,
      accessTokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000) : null,
      refreshTokenExpiresAt: tokenJson.refresh_token_expires_in
        ? new Date(Date.now() + Number(tokenJson.refresh_token_expires_in) * 1000)
        : null,
      tokenType: tokenJson.token_type ?? "bearer",
      scopes: String(tokenJson.scope ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      githubId: githubUserId,
      githubUsername: user.login,
      avatarUrl: user.avatar_url ?? undefined,
    },
  });

  return {
    redirectUrl: buildFrontendRedirect("/dashboard/github", {
      githubConnect: "success",
      teamId,
    }),
  };
}

export async function disconnectUserConnectionService(actor) {
  const existing = await getUserConnectionByUserId(actor.id);
  if (!existing) {
    return { disconnected: false };
  }

  await prisma.gitHubUserConnection.delete({
    where: { userId: actor.id },
  });

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      githubId: null,
      githubUsername: null,
    },
  });

  return { disconnected: true };
}

export async function getGitHubInstallUrlService(actor, requestedTeamId) {
  const team = await resolveTargetTeam(actor, requestedTeamId);
  assertCanManageRepository(actor, team);

  const state = signStateToken({
    purpose: "github-install",
    userId: actor.id,
    teamId: team.id,
  });

  const baseInstallUrl =
    env.githubAppInstallUrl ||
    (env.githubAppName ? `https://github.com/apps/${env.githubAppName}/installations/new` : null);

  if (!baseInstallUrl) {
    throw httpError(500, "GITHUB_INSTALL_URL_NOT_CONFIGURED", "GitHub App install URL is not configured.");
  }

  const url = new URL(baseInstallUrl);
  url.searchParams.set("state", state);
  if (env.githubAppSetupCallbackUrl) {
    url.searchParams.set("redirect_uri", env.githubAppSetupCallbackUrl);
  }

  return { url: url.toString() };
}

export async function githubInstallCallbackService(query) {
  if (query.error) {
    return {
      redirectUrl: buildFrontendRedirect("/dashboard/github", {
        githubInstall: "error",
        reason: query.error,
      }),
    };
  }

  if (!query.installation_id) {
    throw httpError(400, "GITHUB_INSTALLATION_ID_MISSING", "GitHub did not return an installation id.");
  }

  const { purpose, teamId } = verifyStateToken(query.state ?? "");
  if (purpose !== "github-install" || !teamId) {
    throw httpError(400, "GITHUB_STATE_INVALID", "GitHub installation state is invalid.");
  }

  let ownerLogin = null;
  try {
    const app = await getGitHubApp();
    const octokit = await app.getInstallationOctokit(Number(query.installation_id));
    const { data: installationRepos } = await octokit.rest.apps.listReposAccessibleToInstallation();
    ownerLogin = installationRepos.repositories?.[0]?.owner?.login ?? null;
  } catch {
    ownerLogin = null;
  }

  return {
    redirectUrl: buildFrontendRedirect("/dashboard/github", {
      githubInstall: "success",
      installationId: query.installation_id,
      teamId,
      owner: ownerLogin,
      setupAction: query.setup_action ?? null,
    }),
  };
}

export async function getWorkspaceService(actor, requestedTeamId) {
  const team = await resolveTargetTeam(actor, requestedTeamId, {
    allowNull: actor.role === ROLES.ADMIN,
  });
  const githubConnection = await getUserConnectionByUserId(actor.id);
  const availableInstallations = await listAvailableInstallationsForConnection(githubConnection);

  if (!team) {
    return {
      team: null,
      repository: null,
      repositoryRecord: null,
      githubConnection: toGitHubConnectionResponse(githubConnection),
      availableInstallations,
      permissions: {
        canManageRepository: false,
        canWriteCode: false,
        canManageIssues: false,
        canManagePullRequests: false,
        canDisconnectRepository: false,
        canSync: false,
        canReadAsSupervisor: false,
      },
      setup: {
        needsTeam: true,
        needsRepositoryConnection: false,
      },
    };
  }

  assertCanReadRepository(actor, team);

  const repositoryRecordResponse = team.githubRepository
    ? {
        ...toRepositoryRecordResponse(team.githubRepository),
        connectionStatus:
          team.githubRepository.connectionStatus === "ACTIVE" && !team.githubRepository.installationId
            ? "DISCONNECTED"
            : team.githubRepository.connectionStatus,
      }
    : null;
  const needsRepositoryConnection =
    !team.githubRepository || repositoryRecordResponse?.connectionStatus !== "ACTIVE";

  const baseResponse = {
    team: toTeamSummary(team),
    repositoryRecord: repositoryRecordResponse,
    githubConnection: toGitHubConnectionResponse(githubConnection),
    availableInstallations,
    permissions: {
      canManageRepository: canManageTeamGithub(actor, team),
      canWriteCode: canWriteToTeamGithub(actor, team),
      canManageIssues: canWriteToTeamGithub(actor, team),
      canManagePullRequests: canWriteToTeamGithub(actor, team),
      canDisconnectRepository: canManageTeamGithub(actor, team),
      canSync: canManageTeamGithub(actor, team),
      canReadAsSupervisor: READONLY_ROLES.includes(actor.role),
    },
    setup: {
      needsTeam: false,
      needsRepositoryConnection,
    },
  };

  if (needsRepositoryConnection) {
    return {
      ...baseResponse,
      repository: null,
      stats: null,
    };
  }

  const readOctokit = await getInstallationOctokit(team.githubRepository.installationId);
  const { repository, openPullRequests, topContributors } = await getRepositoryWithMeta(readOctokit, team.githubRepository);
  const connectedRepositoryAccess = await resolveConnectedRepositoryAccess(
    githubConnection,
    team.githubRepository,
    readOctokit,
    repository,
  );

  return {
    ...baseResponse,
    githubConnection: toGitHubConnectionResponse(githubConnection, connectedRepositoryAccess),
    repository,
    stats: {
      openPullRequests,
      topContributors,
    },
  };
}

export async function createRepositoryService(actor, payload) {
  const team = await resolveTargetTeam(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);

  const visibility = (payload.visibility ?? "PRIVATE").toLowerCase();
  const repoName = normalizeText(payload.repoName);
  const owner = normalizeText(payload.owner);
  const connectedGitHub = await getUserConnectionByUserId(actor.id);
  const ownerType = payload.ownerType === "ORGANIZATION" ? "ORGANIZATION" : "USER";

  if (
    ownerType === "USER" &&
    connectedGitHub?.login &&
    normalizeText(connectedGitHub.login).toLowerCase() !== owner.toLowerCase()
  ) {
    throw httpError(
      400,
      "GITHUB_REPOSITORY_OWNER_MISMATCH",
      `For personal repositories, Owner login must match your connected GitHub account (${connectedGitHub.login}). Switch Owner type to Organization if you want to create the repository inside a GitHub organization.`,
    );
  }

  await validateInstallationForOwner({
    writeOctokit,
    installationId: payload.installationId,
    ownerLogin: owner,
  });

  const installationOctokit = await getInstallationOctokit(payload.installationId);

  let repository;

  try {
    if (payload.templateOwner && payload.templateRepo) {
      const { data } = await writeOctokit.rest.repos.createUsingTemplate({
        template_owner: payload.templateOwner,
        template_repo: payload.templateRepo,
        owner,
        name: repoName,
        description: payload.description ?? "",
        private: visibility !== "public",
      });
      repository = data;
    } else if (ownerType === "ORGANIZATION") {
      const { data } = await writeOctokit.rest.repos.createInOrg({
        org: owner,
        name: repoName,
        description: payload.description ?? "",
        private: visibility !== "public",
        auto_init: true,
      });
      repository = data;
    } else {
      const { data } = await writeOctokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: payload.description ?? "",
        private: visibility !== "public",
        auto_init: true,
      });
      repository = data;
    }
  } catch (error) {
    throw mapGitHubRepositoryCreationError(error, payload);
  }

  let repoVerification;
  try {
    const response = await installationOctokit.rest.repos.get({
      owner: repository.owner.login,
      repo: repository.name,
    });
    repoVerification = response.data;
  } catch (error) {
    throw mapGitHubRepositoryCreationError(error, payload);
  }

  const record = await persistRepositoryConnection(team.id, {
    ownerLogin: repoVerification.owner.login,
    ownerType: repoVerification.owner.type === "Organization" ? "ORGANIZATION" : "USER",
    repoName: repoVerification.name,
    fullName: repoVerification.full_name,
    installationId: String(payload.installationId),
    defaultBranch: payload.defaultBranch ?? repoVerification.default_branch ?? "main",
    visibility: (repoVerification.visibility ?? (repoVerification.private ? "private" : "public")).toUpperCase(),
    repoUrl: repoVerification.html_url,
    cloneUrlHttps: repoVerification.clone_url ?? null,
    cloneUrlSsh: repoVerification.ssh_url ?? null,
    connectionStatus: "ACTIVE",
    syncStatus: "SYNCING",
  });

  const syncResult = await syncRepositoryIntoLocalModels(team, record, installationOctokit);

  return {
    repositoryRecord: toRepositoryRecordResponse(record),
    repository: toGitHubRepositorySummary(repoVerification),
    sync: syncResult,
  };
}

export async function connectRepositoryService(actor, payload) {
  const team = await resolveTargetTeam(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const installationOctokit = await getInstallationOctokit(payload.installationId);
  let repo;
  try {
    const response = await installationOctokit.rest.repos.get({
      owner: payload.owner,
      repo: payload.repoName,
    });
    repo = response.data;
  } catch (error) {
    throw mapGitHubRepositoryConnectionError(error, payload);
  }

  const record = await persistRepositoryConnection(team.id, {
    ownerLogin: repo.owner.login,
    ownerType: repo.owner.type === "Organization" ? "ORGANIZATION" : "USER",
    repoName: repo.name,
    fullName: repo.full_name,
    installationId: String(payload.installationId),
    defaultBranch: repo.default_branch ?? "main",
    visibility: (repo.visibility ?? (repo.private ? "private" : "public")).toUpperCase(),
    repoUrl: repo.html_url,
    cloneUrlHttps: repo.clone_url ?? null,
    cloneUrlSsh: repo.ssh_url ?? null,
    connectionStatus: "ACTIVE",
    syncStatus: "SYNCING",
  });

  const syncResult = await syncRepositoryIntoLocalModels(team, record, installationOctokit);

  return {
    repositoryRecord: toRepositoryRecordResponse(record),
    repository: toGitHubRepositorySummary(repo),
    sync: syncResult,
  };
}

export async function disconnectRepositoryService(actor, payload) {
  const team = await resolveTargetTeam(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const requiredPhrase = "DISCONNECT";
  if (normalizeText(payload.confirmationText) !== requiredPhrase) {
    throw httpError(
      400,
      "GITHUB_DISCONNECT_CONFIRMATION_REQUIRED",
      `Type "${requiredPhrase}" exactly to disconnect this repository from GPMS.`,
    );
  }

  if (!team.githubRepository) {
    return { disconnected: false };
  }

  await prisma.gitHubTeamRepository.update({
    where: { teamId: team.id },
    data: {
      connectionStatus: "DISCONNECTED",
      syncStatus: "IDLE",
      installationId: null,
    },
  });

  return { disconnected: true };
}

export async function deleteRepositoryPermanentlyService(actor, payload) {
  const team = await resolveTargetTeam(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  if (team.leaderId !== actor.id) {
    throw httpError(403, "GITHUB_DELETE_REPOSITORY_FORBIDDEN", "Only the team leader can permanently delete this repository.");
  }

  if (!team.githubRepository) {
    throw httpError(409, "GITHUB_REPOSITORY_NOT_CONNECTED", "Connect a GitHub repository before deleting it.");
  }

  const repositoryRecord = team.githubRepository;
  const repositoryFullName = `${repositoryRecord.ownerLogin}/${repositoryRecord.repoName}`;
  const confirmationText = normalizeText(payload.confirmationText);
  const requiredPhrase = "i want to delete this repository";
  if (confirmationText !== requiredPhrase) {
    throw httpError(
      400,
      "GITHUB_DELETE_REPOSITORY_CONFIRMATION_MISMATCH",
      `Type "${requiredPhrase}" exactly with the same capitalization to confirm permanent deletion.`,
    );
  }

  const writeOctokit = await requireUserWriteOctokit(actor);
  try {
    await writeOctokit.request("DELETE /repos/{owner}/{repo}", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
    });
  } catch (error) {
    throw mapGitHubRepositoryAdministrationError(error, repositoryRecord, "delete the repository permanently");
  }

  await prisma.gitHubTeamRepository.update({
    where: { teamId: team.id },
    data: {
      connectionStatus: "DISCONNECTED",
      syncStatus: "IDLE",
      installationId: null,
    },
  });

  return {
    deleted: true,
    repository: repositoryFullName,
  };
}

export async function updateWorkspaceSettingsService(actor, payload) {
  const team = await resolveTargetTeam(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  if (!team.githubRepository) {
    throw httpError(409, "GITHUB_REPOSITORY_NOT_CONNECTED", "Connect a GitHub repository before updating settings.");
  }

  let currentRecord = team.githubRepository;
  const requestedVisibility = payload.visibility && payload.visibility !== currentRecord.visibility ? payload.visibility : undefined;

  if (payload.defaultBranch || requestedVisibility) {
    if (requestedVisibility) {
      const expectedConfirmation = requestedVisibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
      if (normalizeText(payload.confirmationText) !== expectedConfirmation) {
        throw httpError(
          400,
          "GITHUB_VISIBILITY_CONFIRMATION_REQUIRED",
          `Type "${expectedConfirmation}" exactly to confirm changing repository visibility.`,
        );
      }
    }
    const installationOctokit = await getInstallationOctokit(currentRecord.installationId);

    try {
      const { data: repo } = await installationOctokit.request("PATCH /repos/{owner}/{repo}", {
        owner: currentRecord.ownerLogin,
        repo: currentRecord.repoName,
        ...(payload.defaultBranch ? { default_branch: payload.defaultBranch } : {}),
        ...(requestedVisibility
          ? {
              private: requestedVisibility === "PRIVATE",
              visibility: requestedVisibility.toLowerCase(),
            }
          : {}),
      });

      currentRecord = await refreshRepositoryConnectionMetadata(currentRecord, repo);
    } catch (error) {
      throw mapGitHubRepositoryAdministrationError(error, currentRecord, "update the repository settings");
    }
  }

  if (payload.syncSettings) {
    currentRecord = await prisma.gitHubTeamRepository.update({
      where: { teamId: team.id },
      data: {
        syncIssuesToTasks:
          payload.syncSettings.syncIssuesToTasks ?? currentRecord.syncIssuesToTasks,
        syncActivityToWeeklyReports:
          payload.syncSettings.syncActivityToWeeklyReports ??
          currentRecord.syncActivityToWeeklyReports,
        syncReleasesToSubmissions:
          payload.syncSettings.syncReleasesToSubmissions ??
          currentRecord.syncReleasesToSubmissions,
      },
    });
  }

  return toRepositoryRecordResponse(currentRecord);
}

export async function syncWorkspaceService(actor, requestedTeamId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanManageRepository(actor, team);

  await markRepositorySyncState(repositoryRecord.id, {
    syncStatus: "SYNCING",
  });

  const { data: repo } = await readOctokit.rest.repos.get({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
  });
  const refreshedRepositoryRecord = await refreshRepositoryConnectionMetadata(repositoryRecord, repo);

  const sync = await syncRepositoryIntoLocalModels(team, refreshedRepositoryRecord, readOctokit);
  return {
    repositoryRecord: toRepositoryRecordResponse(refreshedRepositoryRecord),
    sync,
  };
}

export async function getRepositoryTreeService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const ref = query.ref ?? repositoryRecord.defaultBranch;
  const path = slugifyFilePath(query.path);
  const { data } = await readOctokit.rest.repos.getContent({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    ref,
    path,
  });

  const items = getTreeEntriesFromContentResponse(data)
    .map(serializeTreeNode)
    .sort((left, right) => {
      if (left.type === right.type) return left.name.localeCompare(right.name);
      if (left.type === "dir") return -1;
      if (right.type === "dir") return 1;
      return left.name.localeCompare(right.name);
    });

  return {
    ref,
    path,
    items,
  };
}

export async function getFileBlobService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const path = slugifyFilePath(query.path);
  if (!path) {
    throw httpError(400, "FILE_PATH_REQUIRED", "Provide a file path to read.");
  }

  const ref = query.ref ?? repositoryRecord.defaultBranch;
  const { data } = await readOctokit.rest.repos.getContent({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    ref,
    path,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw httpError(409, "GITHUB_NOT_A_FILE", "The selected path is not a file.");
  }

  const content =
    data.encoding === "base64" ? Buffer.from(data.content ?? "", "base64").toString("utf8") : data.content;
  const isLarge = Number(data.size ?? 0) > 1024 * 1024;

  return {
    path: data.path,
    name: data.name,
    sha: data.sha,
    size: data.size ?? 0,
    downloadUrl: data.download_url ?? null,
    htmlUrl: data.html_url ?? null,
    ref,
    isLarge,
    readOnly: isLarge,
    content: isLarge ? null : content,
  };
}

export async function saveRepositoryChangesService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const readOctokit = await getInstallationOctokit(repositoryRecord.installationId);
  const branch = await getProtectedBranchState(readOctokit, repositoryRecord, payload.branch);
  if (branch.protected) {
    throw httpError(
      409,
      "GITHUB_PROTECTED_BRANCH",
      "Protected branches cannot be edited directly from GPMS. Create a feature branch first.",
    );
  }

  const writeOctokit = await requireUserWriteOctokit(actor);
  let newCommit;
  let baseCommitSha = null;
  try {
    const { data: refData } = await writeOctokit.rest.git.getRef({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      ref: `heads/${payload.branch}`,
    });

    if (payload.expectedHeadSha && payload.expectedHeadSha !== refData.object.sha) {
      throw httpError(
        409,
        "GITHUB_BRANCH_HEAD_CONFLICT",
        "This branch changed since you opened it. Refresh the file tree and try your action again to avoid overwriting newer commits.",
      );
    }

    const { data: baseCommit } = await writeOctokit.rest.git.getCommit({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      commit_sha: refData.object.sha,
    });
    baseCommitSha = baseCommit.sha;

    const treeEntries = [];

    for (const change of payload.changes) {
      const action = change.action;
      const path = slugifyFilePath(change.path);
      const previousPath = slugifyFilePath(change.previousPath);

      if (!path) {
        throw httpError(400, "FILE_PATH_REQUIRED", "Each change must include a file path.");
      }

      if (isSensitiveWritePath(path) || (previousPath && isSensitiveWritePath(previousPath))) {
        throw httpError(
          422,
          "GITHUB_SENSITIVE_FILE_BLOCKED",
          `Blocked writing sensitive file path "${path}". Move secrets to protected environment storage instead of committing them to GitHub.`,
        );
      }

      if (["create", "update", "rename"].includes(action)) {
        const blobContent = change.content ?? "";
        if (containsPotentialSecret(blobContent)) {
          throw httpError(
            422,
            "GITHUB_SECRET_DETECTED",
            `Potential secret detected in "${path}". Remove credentials/tokens from file content and try again.`,
          );
        }
        const { data: blob } = await writeOctokit.rest.git.createBlob({
          owner: repositoryRecord.ownerLogin,
          repo: repositoryRecord.repoName,
          content: blobContent,
          encoding: "utf-8",
        });

        treeEntries.push({
          path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      }

      if (action === "delete") {
        treeEntries.push({
          path,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      }

      if (action === "rename") {
        if (!previousPath) {
          throw httpError(400, "PREVIOUS_PATH_REQUIRED", "Renaming a file requires previousPath.");
        }

        treeEntries.push({
          path: previousPath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      }
    }

    const { data: newTree } = await writeOctokit.rest.git.createTree({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      base_tree: baseCommit.tree.sha,
      tree: treeEntries,
    });

    const commitResponse = await writeOctokit.rest.git.createCommit({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      message: payload.message,
      tree: newTree.sha,
      parents: [baseCommit.sha],
    });
    newCommit = commitResponse.data;

    await writeOctokit.rest.git.updateRef({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      ref: `heads/${payload.branch}`,
      sha: newCommit.sha,
      force: false,
    });
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  return {
    ref: payload.branch,
    commitSha: newCommit.sha,
    branchProtected: false,
    compareUrl: baseCommitSha
      ? `https://github.com/${repositoryRecord.fullName}/compare/${baseCommitSha}...${newCommit.sha}`
      : null,
    branch: payload.branch,
    commit: {
      sha: newCommit.sha,
      url: `https://github.com/${repositoryRecord.fullName}/commit/${newCommit.sha}`,
      message: payload.message,
    },
  };
}

export async function getBranchesService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const { data } = await readOctokit.rest.repos.listBranches({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    per_page: query.perPage ?? 100,
    page: query.page ?? 1,
  });

  return data.map(serializeBranch);
}

export async function createBranchService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  let data;
  try {
    let sha;
    if (payload.startEmpty) {
      // To create a "clean" branch that is easy to PR back, we start from the default branch
      // but remove all existing files in the initial commit.
      const { data: baseRef } = await writeOctokit.rest.git.getRef({
        owner: repositoryRecord.ownerLogin,
        repo: repositoryRecord.repoName,
        ref: `heads/${repositoryRecord.defaultBranch}`,
      });

      const emptyTree = await writeOctokit.rest.git.createTree({
        owner: repositoryRecord.ownerLogin,
        repo: repositoryRecord.repoName,
        tree: [
          {
            path: "README.md",
            mode: "100644",
            type: "blob",
            content: `# ${payload.name}\n\nThis branch was started as a clean branch with no project files copied.`,
          },
        ],
      });

      const rootCommit = await writeOctokit.rest.git.createCommit({
        owner: repositoryRecord.ownerLogin,
        repo: repositoryRecord.repoName,
        message: `Initialize clean branch ${payload.name}`,
        tree: emptyTree.data.sha,
        parents: [baseRef.object.sha], // Start from main but replace everything
      });
      sha = rootCommit.data.sha;
    } else {
      const sourceRef = payload.fromSha
        ? { sha: payload.fromSha }
        : await writeOctokit.rest.git.getRef({
            owner: repositoryRecord.ownerLogin,
            repo: repositoryRecord.repoName,
            ref: `heads/${payload.fromBranch ?? repositoryRecord.defaultBranch}`,
          });

      sha = payload.fromSha ? payload.fromSha : sourceRef.data.object.sha;
    }

    const response = await writeOctokit.rest.git.createRef({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      ref: `refs/heads/${payload.name}`,
      sha,
    });
    data = response.data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  return {
    name: payload.name,
    ref: data.ref,
    sha: data.object.sha,
  };
}

export async function deleteBranchService(actor, requestedTeamId, branchName) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, requestedTeamId);
  if (team.leaderId !== actor.id) {
    throw httpError(403, "GITHUB_BRANCH_DELETE_FORBIDDEN", "Only the team leader can delete branches from GPMS.");
  }

  const normalizedBranchName = normalizeText(branchName);
  if (!normalizedBranchName) {
    throw httpError(400, "GITHUB_BRANCH_NAME_REQUIRED", "Provide a branch name to delete.");
  }

  if (normalizedBranchName === normalizeText(repositoryRecord.defaultBranch)) {
    throw httpError(
      409,
      "GITHUB_DEFAULT_BRANCH_PROTECTED",
      `Cannot delete "${normalizedBranchName}" because it is the default branch. Change the default branch in Settings or Branches first, then delete this branch.`,
    );
  }

  const readOctokit = await getInstallationOctokit(repositoryRecord.installationId);
  let branch;
  try {
    branch = await getProtectedBranchState(readOctokit, repositoryRecord, normalizedBranchName);
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      throw httpError(404, "GITHUB_BRANCH_NOT_FOUND", `GitHub could not find the branch ${normalizedBranchName}.`);
    }

    throw error;
  }

  if (branch.protected) {
    throw httpError(409, "GITHUB_PROTECTED_BRANCH", "Protected branches cannot be deleted from GPMS.");
  }

  const writeOctokit = await requireUserWriteOctokit(actor);

  try {
    await writeOctokit.rest.git.deleteRef({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      ref: `heads/${normalizedBranchName}`,
    });
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      throw httpError(404, "GITHUB_BRANCH_NOT_FOUND", `GitHub could not find the branch ${normalizedBranchName}.`);
    }

    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  return {
    deleted: true,
    name: normalizedBranchName,
  };
}

export async function getCommitsService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const page = query.page ?? 1;
  const perPage = query.perPage ?? 30;
  const normalizedPath = slugifyFilePath(query.path);
  const { data, headers } = await readOctokit.rest.repos.listCommits({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    sha: query.ref ?? query.branch ?? repositoryRecord.defaultBranch,
    path: normalizedPath || undefined,
    per_page: perPage,
    page,
  });
  const searchTerm = normalizeText(query.q).toLowerCase();
  const filteredData = searchTerm
    ? data.filter((commit) => {
        const message = normalizeText(commit?.commit?.message).toLowerCase();
        const sha = normalizeText(commit?.sha).toLowerCase();
        const authorLogin = normalizeText(commit?.author?.login).toLowerCase();
        const authorName = normalizeText(commit?.commit?.author?.name).toLowerCase();
        return (
          message.includes(searchTerm) ||
          sha.includes(searchTerm) ||
          authorLogin.includes(searchTerm) ||
          authorName.includes(searchTerm)
        );
      })
    : data;

  return {
    items: filteredData.map(serializeCommit),
    page,
    perPage,
    hasNextPage: hasGitHubPaginationRelation(headers.link, "next"),
    hasPreviousPage: hasGitHubPaginationRelation(headers.link, "prev"),
  };
}

export async function getCommitByShaService(actor, commitSha, requestedTeamId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanReadRepository(actor, team);

  const normalizedCommitSha = normalizeText(commitSha);
  if (!normalizedCommitSha) {
    throw httpError(400, "GITHUB_COMMIT_SHA_REQUIRED", "Provide a commit SHA to inspect.");
  }

  try {
    const { data } = await readOctokit.rest.repos.getCommit({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      ref: normalizedCommitSha,
    });

    return serializeCommitDetails(data);
  } catch (error) {
    if (Number(error?.status ?? 0) === 404) {
      throw httpError(404, "GITHUB_COMMIT_NOT_FOUND", `GitHub could not find commit ${normalizedCommitSha.slice(0, 12)}.`);
    }

    throw error;
  }
}

export async function getCompareService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  if (!query.base || !query.head) {
    throw httpError(400, "GITHUB_COMPARE_REFS_REQUIRED", "Provide both base and head refs to compare.");
  }

  const { data } = await readOctokit.rest.repos.compareCommits({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    base: query.base,
    head: query.head,
  });

  return {
    status: data.status,
    aheadBy: data.ahead_by,
    behindBy: data.behind_by,
    totalCommits: data.total_commits,
    htmlUrl: data.html_url,
    commits: (data.commits ?? []).map(serializeCommit),
    files: (data.files ?? []).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      blobUrl: file.blob_url ?? null,
      patch: file.patch ?? null,
    })),
  };
}

export async function getIssuesService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const [issues, linkedTasks] = await Promise.all([
    readOctokit.rest.issues.listForRepo({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      state: query.state ?? "open",
      per_page: query.perPage ?? 50,
      page: query.page ?? 1,
    }),
    prisma.task.findMany({
      where: {
        teamId: team.id,
        githubIssueNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        githubIssueNumber: true,
        status: true,
        priority: true,
      },
    }),
  ]);

  const taskMap = new Map(linkedTasks.map((task) => [task.githubIssueNumber, task]));
  const searchTerm = normalizeText(query.q).toLowerCase();
  return issues.data
    .filter((issue) => !issue.pull_request)
    .filter((issue) => {
      if (!searchTerm) return true;
      const title = normalizeText(issue?.title).toLowerCase();
      const body = normalizeText(issue?.body).toLowerCase();
      const number = String(issue?.number ?? "");
      const author = normalizeText(issue?.user?.login).toLowerCase();
      return (
        title.includes(searchTerm) ||
        body.includes(searchTerm) ||
        number.includes(searchTerm) ||
        author.includes(searchTerm)
      );
    })
    .map((issue) => serializeIssue(issue, taskMap.get(issue.number) ?? null));
}

export async function createIssueService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  let data;
  try {
    const response = await writeOctokit.rest.issues.create({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      title: payload.title,
      body: payload.body ?? "",
      assignees: payload.assignees ?? [],
      labels: payload.labels ?? [],
    });
    data = response.data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  if (repositoryRecord.syncIssuesToTasks) {
    await syncIssuesIntoTasks(team, repositoryRecord, await getInstallationOctokit(repositoryRecord.installationId));
  }

  return serializeIssue(data);
}

export async function updateIssueService(actor, issueNumber, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  let data;
  try {
    const response = await writeOctokit.rest.issues.update({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      issue_number: issueNumber,
      title: payload.title,
      body: payload.body,
      state: payload.state,
      assignees: payload.assignees,
      labels: payload.labels,
    });
    data = response.data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  if (repositoryRecord.syncIssuesToTasks) {
    await syncIssuesIntoTasks(team, repositoryRecord, await getInstallationOctokit(repositoryRecord.installationId));
  }

  return serializeIssue(data);
}

export async function getPullRequestsService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const { data } = await readOctokit.rest.pulls.list({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    state: query.state ?? "open",
    per_page: query.perPage ?? 30,
    page: query.page ?? 1,
  });

  // Pulls list API doesn't return full details (mergeable status, stats, etc.)
  // We fetch full details for open PRs on the current page in parallel
  const detailedPulls = await Promise.all(
    data.map(async (pull) => {
      if (pull.state !== "open") return pull;
      try {
        const { data: fullPull } = await readOctokit.rest.pulls.get({
          owner: repositoryRecord.ownerLogin,
          repo: repositoryRecord.repoName,
          pull_number: pull.number,
        });
        return fullPull;
      } catch (error) {
        console.warn(`[GITHUB] Failed to fetch details for PR #${pull.number}: ${error.message}`);
        return pull;
      }
    }),
  );

  const searchTerm = normalizeText(query.q).toLowerCase();
  const filteredData = searchTerm
    ? detailedPulls.filter((pullRequest) => {
        const title = normalizeText(pullRequest?.title).toLowerCase();
        const body = normalizeText(pullRequest?.body).toLowerCase();
        const number = String(pullRequest?.number ?? "");
        const author = normalizeText(pullRequest?.user?.login).toLowerCase();
        const head = normalizeText(pullRequest?.head?.ref).toLowerCase();
        const base = normalizeText(pullRequest?.base?.ref).toLowerCase();
        return (
          title.includes(searchTerm) ||
          body.includes(searchTerm) ||
          number.includes(searchTerm) ||
          author.includes(searchTerm) ||
          head.includes(searchTerm) ||
          base.includes(searchTerm)
        );
      })
    : detailedPulls;
  return filteredData.map(serializePullRequest);
}

export async function getPullRequestByNumberService(actor, pullNumber, requestedTeamId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanReadRepository(actor, team);

  const { data } = await readOctokit.rest.pulls.get({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    pull_number: pullNumber,
  });

  return serializePullRequest(data);
}

export async function mergeBranchService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  try {
    const { data } = await writeOctokit.rest.repos.merge({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      base: payload.base,
      head: payload.head,
      commit_message: payload.commitMessage ?? `Merge branch '${payload.head}' into '${payload.base}'`,
    });
    return data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }
}

export async function createPullRequestService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  let data;
  try {
    const response = await writeOctokit.rest.pulls.create({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      title: payload.title,
      body: payload.body ?? "",
      head: payload.head,
      base: payload.base,
      draft: Boolean(payload.draft),
    });
    data = response.data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  // Request reviewers in a separate step so it doesn't fail the whole PR creation
  if (payload.reviewerLogins?.length) {
    try {
      await writeOctokit.rest.pulls.requestReviewers({
        owner: repositoryRecord.ownerLogin,
        repo: repositoryRecord.repoName,
        pull_number: data.number,
        reviewers: payload.reviewerLogins,
      });
    } catch (error) {
      console.warn(`[GITHUB] Failed to request reviewers for PR #${data.number}: ${error.message}`);
      // We don't throw here so the PR still appears as created
    }
  }

  return serializePullRequest(data);
}

export async function reviewPullRequestService(actor, pullNumber, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanWriteRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  let data;
  try {
    const response = await writeOctokit.rest.pulls.createReview({
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      pull_number: pullNumber,
      body: payload.body ?? "",
      event: payload.event,
    });
    data = response.data;
  } catch (error) {
    throw mapGitHubRepositoryWriteError(error, repositoryRecord);
  }

  return {
    id: String(data.id),
    state: data.state,
    body: data.body ?? "",
    htmlUrl: data.html_url ?? null,
    submittedAt: data.submitted_at ?? null,
  };
}

export async function mergePullRequestService(actor, pullNumber, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  const { data } = await writeOctokit.rest.pulls.merge({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    pull_number: pullNumber,
    commit_title: payload.commitTitle,
    commit_message: payload.commitMessage,
    merge_method: payload.mergeMethod ?? "merge",
  });

  return data;
}

async function requireTaskGitHubContext(actor, taskId) {
  const task = await findTaskRecordById(taskId);
  if (!task) {
    throw httpError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  if (task.integrationMode !== "GITHUB") {
    throw httpError(409, "TASK_GITHUB_NOT_ENABLED", "This task does not use GitHub tracking.");
  }

  const { team, repositoryRecord } = await requireConnectedRepository(actor, task.teamId);
  const readOctokit = await getInstallationOctokit(repositoryRecord.installationId);

  return {
    task,
    team,
    repositoryRecord,
    readOctokit,
  };
}

export async function resyncTaskGitHubStateService(actor, taskId) {
  const { task, repositoryRecord, readOctokit } = await requireTaskGitHubContext(actor, taskId);
  return syncTaskGitHubStateRecord(task, repositoryRecord, readOctokit);
}

export async function bootstrapTaskGitHubArtifactsService(actor, taskId) {
  let { task, team, repositoryRecord, readOctokit } = await requireTaskGitHubContext(actor, taskId);
  assertCanWriteRepository(actor, team);

  if (!task.githubIssueNumber) {
    const issue = await createIssueService(actor, {
      teamId: task.teamId,
      title: task.title,
      body: buildTaskIssueBody(task),
      assignees: task.assignee?.githubUsername ? [task.assignee.githubUsername] : [],
      labels: [],
    });

    task = await updateTaskRecordById(task.id, {
      githubIssueId: issue.id,
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.htmlUrl,
      githubIssueState: issue.state,
      syncedFromGithub: true,
      lastSyncedAt: new Date(),
    });
  }

  const branchName = normalizeText(task.githubBranchName) || buildTaskBranchName(task);
  const existingBranch = await getBranchByNameSafe(readOctokit, repositoryRecord, branchName);
  if (!existingBranch) {
    await createBranchService(actor, {
      teamId: task.teamId,
      name: branchName,
      fromBranch: repositoryRecord.defaultBranch,
    });
  }

  await updateTaskRecordById(task.id, {
    githubBranchName: branchName,
    lastSyncedAt: new Date(),
  });

  return resyncTaskGitHubStateService(actor, task.id);
}

export async function openTaskGitHubPullRequestService(actor, taskId, payload = {}) {
  let task = await bootstrapTaskGitHubArtifactsService(actor, taskId);
  const { team, repositoryRecord } = await requireConnectedRepository(actor, task.teamId);
  assertCanWriteRepository(actor, team);

  if (task.githubPullRequestNumber) {
    return task;
  }

  const reviewerLogins = Array.from(
    new Set(
      [...(payload.reviewerLogins ?? []), task.team?.leader?.githubUsername ?? null]
        .map((login) => normalizeText(login))
        .filter(Boolean)
        .filter((login) => login.toLowerCase() !== normalizeText(actor.githubUsername).toLowerCase()),
    ),
  );

  const pullRequest = await createPullRequestService(actor, {
    teamId: task.teamId,
    title: normalizeText(payload.title) || task.title,
    body: ensureTaskPullRequestBody(payload.body, task),
    head: task.githubBranchName,
    base: normalizeText(payload.base) || repositoryRecord.defaultBranch,
    draft: Boolean(payload.draft),
    reviewerLogins,
  });

  await updateTaskRecordById(task.id, {
    githubPullRequestId: pullRequest.id,
    githubPullRequestNumber: pullRequest.number,
    githubPullRequestUrl: pullRequest.htmlUrl,
    githubPullRequestState: pullRequest.state,
    githubPullRequestBase: pullRequest.base ?? repositoryRecord.defaultBranch,
    githubPullRequestHead: pullRequest.head ?? task.githubBranchName,
    githubPullRequestMergedAt: pullRequest.mergedAt ? new Date(pullRequest.mergedAt) : null,
    lastSyncedAt: new Date(),
  });

  return resyncTaskGitHubStateService(actor, task.id);
}

export async function reviewTaskPullRequestService(actor, taskId, payload = {}) {
  const { task, team } = await requireTaskGitHubContext(actor, taskId);
  assertCanManageRepository(actor, team);

  if (!task.githubPullRequestNumber) {
    throw httpError(409, "TASK_PULL_REQUEST_REQUIRED", "Open a pull request for this task first.");
  }

  return reviewPullRequestService(actor, task.githubPullRequestNumber, {
    teamId: task.teamId,
    body: payload.body,
    event: payload.event,
  });
}

export async function mergeTaskPullRequestService(actor, taskId, payload = {}) {
  const { task, team } = await requireTaskGitHubContext(actor, taskId);
  assertCanManageRepository(actor, team);

  if (!task.githubPullRequestNumber) {
    throw httpError(409, "TASK_PULL_REQUEST_REQUIRED", "Open a pull request for this task first.");
  }

  return mergePullRequestService(actor, task.githubPullRequestNumber, {
    teamId: task.teamId,
    commitTitle: payload.commitTitle,
    commitMessage: payload.commitMessage,
    mergeMethod: payload.mergeMethod,
  });
}

export async function getActionsService(actor, query) {
  const requestedTeamId = query.teamId;
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanReadRepository(actor, team);

  if (query.logsOnly) {
    const response = await readOctokit.request("GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      run_id: Number(query.runId),
      request: {
        redirect: "manual",
      },
    });

    return {
      runId: Number(query.runId),
      logsUrl: response.headers.location ?? null,
      status: response.status,
    };
  }

  const { data } = await readOctokit.rest.actions.listWorkflowRunsForRepo({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    branch: query.branch,
    per_page: query.perPage ?? 20,
    page: query.page ?? 1,
  });

  return {
    totalCount: data.total_count,
    items: (data.workflow_runs ?? []).map(serializeWorkflowRun),
  };
}

export async function getWorkflowLogsService(actor, query) {
  return getActionsService(actor, {
    ...query,
    logsOnly: true,
  });
}

export async function getReleasesService(actor, query) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, query.teamId);
  assertCanReadRepository(actor, team);

  const { data } = await readOctokit.rest.repos.listReleases({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    per_page: query.perPage ?? 20,
    page: query.page ?? 1,
  });

  return data.map(serializeRelease);
}

export async function createReleaseService(actor, payload) {
  const { team, repositoryRecord } = await requireConnectedRepository(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const writeOctokit = await requireUserWriteOctokit(actor);
  const { data } = await writeOctokit.rest.repos.createRelease({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    tag_name: payload.tagName,
    target_commitish: payload.targetCommitish,
    name: payload.name,
    body: payload.body,
    draft: Boolean(payload.draft),
    prerelease: Boolean(payload.prerelease),
  });

  if (repositoryRecord.syncReleasesToSubmissions) {
    await syncReleasesIntoSubmissions(team, repositoryRecord, await getInstallationOctokit(repositoryRecord.installationId));
  }

  return serializeRelease(data);
}

export async function getContributorsService(actor, requestedTeamId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanReadRepository(actor, team);

  const { data } = await readOctokit.rest.repos.listContributors({
    owner: repositoryRecord.ownerLogin,
    repo: repositoryRecord.repoName,
    per_page: 50,
  });

  return data.map(serializeContributor);
}

export async function getRepositoryAccessStateService(actor, requestedTeamId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanReadRepository(actor, team);

  try {
    return await getRepositoryAccessStateData(repositoryRecord, readOctokit);
  } catch (error) {
    throw mapGitHubRepositoryAdministrationError(error, repositoryRecord, "load repository access");
  }
}

export async function inviteRepositoryCollaboratorService(actor, payload) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, payload.teamId);
  assertCanManageRepository(actor, team);

  const login = normalizeText(payload.login);
  if (!login) {
    throw httpError(400, "GITHUB_COLLABORATOR_LOGIN_REQUIRED", "Provide a GitHub username to invite.");
  }

  if (login.toLowerCase() === normalizeText(repositoryRecord.ownerLogin).toLowerCase()) {
    throw httpError(400, "GITHUB_COLLABORATOR_SELF_INVITE", "The repository owner already has full access.");
  }

  try {
    const response = await readOctokit.request("PUT /repos/{owner}/{repo}/collaborators/{username}", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      username: login,
      ...(repositoryRecord.ownerType === "ORGANIZATION" && payload.permission
        ? { permission: normalizeText(payload.permission).toLowerCase() }
        : {}),
    });

    return {
      login,
      invitationCreated: response.status === 201,
      alreadyHasAccess: response.status === 204,
    };
  } catch (error) {
    throw mapGitHubCollaboratorInviteError(error, repositoryRecord, login);
  }
}

export async function removeRepositoryCollaboratorService(actor, requestedTeamId, username) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanManageRepository(actor, team);

  const login = normalizeText(username);
  if (!login) {
    throw httpError(400, "GITHUB_COLLABORATOR_LOGIN_REQUIRED", "Provide a GitHub username to remove.");
  }

  if (login.toLowerCase() === normalizeText(repositoryRecord.ownerLogin).toLowerCase()) {
    throw httpError(400, "GITHUB_COLLABORATOR_OWNER_PROTECTED", "The repository owner cannot be removed as a collaborator.");
  }

  try {
    await readOctokit.request("DELETE /repos/{owner}/{repo}/collaborators/{username}", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      username: login,
    });

    return { removed: true, login };
  } catch (error) {
    throw mapGitHubCollaboratorRemovalError(error, repositoryRecord, login);
  }
}

export async function cancelRepositoryInvitationService(actor, requestedTeamId, invitationId) {
  const { team, repositoryRecord, readOctokit } = await fetchRepositoryWithReadAccess(actor, requestedTeamId);
  assertCanManageRepository(actor, team);

  try {
    await readOctokit.request("DELETE /repos/{owner}/{repo}/invitations/{invitation_id}", {
      owner: repositoryRecord.ownerLogin,
      repo: repositoryRecord.repoName,
      invitation_id: invitationId,
    });

    return { cancelled: true, invitationId: String(invitationId) };
  } catch (error) {
    throw mapGitHubInvitationRemovalError(error, repositoryRecord, invitationId);
  }
}

async function processWebhookDeliveryAsync(deliveryId, repositoryRecord) {
  try {
    const readOctokit = await getInstallationOctokit(repositoryRecord.installationId);
    await syncRepositoryIntoLocalModels(repositoryRecord.team, repositoryRecord, readOctokit);

    await prisma.gitHubTeamRepository.update({
      where: { id: repositoryRecord.id },
      data: {
        lastWebhookAt: new Date(),
        syncStatus: "IDLE",
      },
    });

    await prisma.gitHubWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.gitHubWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Webhook processing failed",
        processedAt: new Date(),
      },
    });

    await prisma.gitHubTeamRepository.update({
      where: { id: repositoryRecord.id },
      data: {
        syncStatus: "ERROR",
      },
    });
  }
}

export async function handleGitHubWebhookService({ headers, body, rawBody }) {
  const deliveryId = normalizeText(headers["x-github-delivery"]);
  const event = normalizeText(headers["x-github-event"]);
  const signature = normalizeText(headers["x-hub-signature-256"]);

  if (!deliveryId || !event) {
    throw httpError(400, "GITHUB_WEBHOOK_INVALID", "GitHub webhook headers are missing.");
  }

  const existing = await prisma.gitHubWebhookDelivery.findUnique({
    where: { deliveryId },
  });
  if (existing) {
    return {
      deliveryId,
      ignored: true,
      reason: "already_processed",
      httpStatus: 200,
    };
  }

  let signatureVerified = false;
  const requiresStrictSignature = env.nodeEnv === "production";
  if (requiresStrictSignature && !env.githubAppWebhookSecret) {
    throw httpError(500, "GITHUB_WEBHOOK_SECRET_MISSING", "Server webhook secret is not configured.");
  }
  if (requiresStrictSignature && (!rawBody || !signature)) {
    throw httpError(401, "GITHUB_WEBHOOK_SIGNATURE_MISSING", "GitHub webhook signature headers are missing.");
  }

  if (env.githubAppWebhookSecret && rawBody && signature) {
    const expected = `sha256=${crypto
      .createHmac("sha256", env.githubAppWebhookSecret)
      .update(rawBody)
      .digest("hex")}`;
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    signatureVerified =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!signatureVerified) {
      throw httpError(401, "GITHUB_WEBHOOK_SIGNATURE_INVALID", "GitHub webhook signature verification failed.");
    }
  } else if (!requiresStrictSignature) {
    signatureVerified = false;
  }

  const repositoryFullName = normalizeText(body?.repository?.full_name);
  const repositoryRecord = repositoryFullName
    ? await prisma.gitHubTeamRepository.findUnique({
        where: { fullName: repositoryFullName },
        include: {
          team: {
            include: githubTeamInclude,
          },
        },
      })
    : null;

  const delivery = await prisma.gitHubWebhookDelivery.create({
    data: {
      repositoryId: repositoryRecord?.id ?? null,
      deliveryId,
      event,
      action: normalizeText(body?.action) || null,
      signatureVerified,
      status: repositoryRecord ? "PENDING" : "IGNORED",
      payload: body ?? {},
    },
  });

  if (!repositoryRecord) {
    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "IGNORED",
        processedAt: new Date(),
      },
    });

    return {
      deliveryId,
      ignored: true,
      reason: "repository_not_connected",
      httpStatus: 202,
    };
  }

  queueMicrotask(() => {
    void processWebhookDeliveryAsync(delivery.id, repositoryRecord);
  });

  return {
    deliveryId,
    queued: true,
    httpStatus: 202,
  };
}








