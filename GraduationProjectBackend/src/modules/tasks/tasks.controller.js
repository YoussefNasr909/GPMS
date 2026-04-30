import {
  acceptTaskService,
  approveTaskService,
  bootstrapTaskGithubService,
  createTaskService,
  listTasksService,
  openTaskPullRequestService,
  rejectTaskService,
  resyncTaskGithubService,
  submitTaskForReviewService,
  updateTaskService,
} from "./tasks.service.js";

export async function listTasks(req, res) {
  const result = await listTasksService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createTask(req, res) {
  const result = await createTaskService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function updateTask(req, res) {
  const result = await updateTaskService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function acceptTask(req, res) {
  const result = await acceptTaskService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function submitTaskForReview(req, res) {
  const result = await submitTaskForReviewService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function approveTask(req, res) {
  const result = await approveTaskService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function rejectTask(req, res) {
  const result = await rejectTaskService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function bootstrapTaskGithub(req, res) {
  const result = await bootstrapTaskGithubService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function openTaskPullRequest(req, res) {
  const result = await openTaskPullRequestService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function resyncTaskGithub(req, res) {
  const result = await resyncTaskGithubService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}
