import {
  createDiscussionCommentService,
  createDiscussionService,
  deleteDiscussionCommentService,
  deleteDiscussionService,
  getDiscussionDetailService,
  likeDiscussionService,
  listDiscussionsService,
} from "./discussions.service.js";

export async function listDiscussions(req, res) {
  const result = await listDiscussionsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getDiscussionDetail(req, res) {
  const result = await getDiscussionDetailService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function createDiscussion(req, res) {
  const result = await createDiscussionService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function createDiscussionComment(req, res) {
  const result = await createDiscussionCommentService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function likeDiscussion(req, res) {
  const result = await likeDiscussionService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function deleteDiscussion(req, res) {
  const result = await deleteDiscussionService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function deleteDiscussionComment(req, res) {
  const result = await deleteDiscussionCommentService(
    req.user,
    req.validated.params.id,
    req.validated.params.commentId,
  );
  res.json({ ok: true, data: result });
}
