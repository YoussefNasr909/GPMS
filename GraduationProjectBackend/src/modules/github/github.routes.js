import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { ROLES } from "../../common/constants/roles.js";
import {
  commitFileSchema,
  connectRepositorySchema,
  createBranchSchema,
  createIssueSchema,
  deleteInvitationSchema,
  disconnectRepositorySchema,
  deleteRepositorySchema,
  deleteBranchSchema,
  createPullRequestSchema,
  createReleaseSchema,
  createRepositorySchema,
  emptyBodySchema,
  getCommitByShaSchema,
  getConnectUrlSchema,
  getPullRequestByNumberSchema,
  githubInstallCallbackSchema,
  githubUserCallbackSchema,
  inviteCollaboratorSchema,
  mergePullRequestSchema,
  repositoryScopedQuerySchema,
  removeCollaboratorSchema,
  reviewPullRequestSchema,
  updateIssueSchema,
  updateSettingsSchema,
  workflowLogsSchema,
  mergeBranchSchema,
} from "./github.schema.js";
import {
  connectRepository,
  createBranch,
  deleteBranch,
  createIssue,
  createPullRequest,
  createRelease,
  createRepository,
  disconnectRepository,
  deleteRepositoryPermanently,
  disconnectUserConnection,
  cancelRepositoryInvitation,
  getActions,
  getBranches,
  getCommitBySha,
  getCommits,
  getCompare,
  getContributors,
  getRepositoryAccessState,
  getFileBlob,
  getInstallUrl,
  getIssues,
  getPullRequestByNumber,
  getPullRequests,
  getReleases,
  getRepositoryTree,
  getUserConnectUrl,
  getUserConnectionState,
  getWorkflowLogs,
  getWorkspace,
  githubInstallCallback,
  githubUserCallback,
  inviteRepositoryCollaborator,
  mergePullRequest,
  removeRepositoryCollaborator,
  receiveWebhook,
  reviewPullRequest,
  saveRepositoryChanges,
  syncWorkspace,
  updateIssue,
  updateWorkspaceSettings,
  mergeBranch,
} from "./github.controller.js";

const router = Router();

router.post("/webhooks/receive", receiveWebhook);
router.get("/user/callback", validate(githubUserCallbackSchema), githubUserCallback);
router.get("/install/callback", validate(githubInstallCallbackSchema), githubInstallCallback);

router.use(auth);

router.get("/user/connection", validate(emptyBodySchema), getUserConnectionState);
router.get("/user/connect-url", validate(getConnectUrlSchema), getUserConnectUrl);
router.delete("/user/connection", validate(emptyBodySchema), disconnectUserConnection);

router.get("/install-url", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(getConnectUrlSchema), getInstallUrl);

router.get(
  "/workspace",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(emptyBodySchema),
  getWorkspace,
);
router.post("/repository/create", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(createRepositorySchema), createRepository);
router.post(
  "/repository/connect",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(connectRepositorySchema),
  connectRepository,
);
router.delete("/repository", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(disconnectRepositorySchema), disconnectRepository);
router.delete(
  "/repository/permanent",
  allowRoles(ROLES.LEADER),
  validate(deleteRepositorySchema),
  deleteRepositoryPermanently,
);
router.patch("/settings", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(updateSettingsSchema), updateWorkspaceSettings);
router.post("/sync", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(emptyBodySchema), syncWorkspace);
router.get(
  "/access",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(emptyBodySchema),
  getRepositoryAccessState,
);
router.post(
  "/collaborators",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(inviteCollaboratorSchema),
  inviteRepositoryCollaborator,
);
router.delete(
  "/collaborators/:username",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(removeCollaboratorSchema),
  removeRepositoryCollaborator,
);
router.delete(
  "/invitations/:invitationId",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(deleteInvitationSchema),
  cancelRepositoryInvitation,
);

router.get(
  "/tree",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getRepositoryTree,
);
router.get(
  "/blob",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getFileBlob,
);
router.post(
  "/files/commit",
  allowRoles(ROLES.LEADER, ROLES.STUDENT),
  validate(commitFileSchema),
  saveRepositoryChanges,
);

router.get(
  "/branches",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getBranches,
);
router.post("/branches", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(createBranchSchema), createBranch);
router.post("/branches/merge", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(mergeBranchSchema), mergeBranch);
router.delete("/branches/:name", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(deleteBranchSchema), deleteBranch);
router.get(
  "/commits",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getCommits,
);
router.get(
  "/commits/:sha",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(getCommitByShaSchema),
  getCommitBySha,
);
router.get(
  "/compare",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getCompare,
);

router.get(
  "/issues",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getIssues,
);
router.post("/issues", allowRoles(ROLES.LEADER, ROLES.STUDENT), validate(createIssueSchema), createIssue);
router.patch("/issues/:number", allowRoles(ROLES.LEADER, ROLES.STUDENT), validate(updateIssueSchema), updateIssue);

router.get(
  "/pulls",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getPullRequests,
);
router.get(
  "/pulls/:number",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(getPullRequestByNumberSchema),
  getPullRequestByNumber,
);
router.post("/pulls", allowRoles(ROLES.LEADER, ROLES.STUDENT), validate(createPullRequestSchema), createPullRequest);
router.post(
  "/pulls/:number/reviews",
  allowRoles(ROLES.LEADER, ROLES.STUDENT),
  validate(reviewPullRequestSchema),
  reviewPullRequest,
);
router.post(
  "/pulls/:number/merge",
  allowRoles(ROLES.LEADER),
  validate(mergePullRequestSchema),
  mergePullRequest,
);

router.get(
  "/actions",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getActions,
);
router.get(
  "/actions/:runId/logs",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(workflowLogsSchema),
  getWorkflowLogs,
);

router.get(
  "/releases",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(repositoryScopedQuerySchema),
  getReleases,
);
router.post("/releases", allowRoles(ROLES.LEADER), validate(createReleaseSchema), createRelease);
router.get(
  "/contributors",
  allowRoles(ROLES.LEADER, ROLES.STUDENT, ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN),
  validate(emptyBodySchema),
  getContributors,
);

export default router;
