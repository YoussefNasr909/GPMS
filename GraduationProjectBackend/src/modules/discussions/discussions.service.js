import { AppError } from "../../common/errors/AppError.js";
import {
  createDiscussionCommentRecord,
  createDiscussionRecord,
  deleteDiscussionCommentRecord,
  deleteDiscussionRecord,
  findDiscussionCommentById,
  findDiscussionById,
  findDiscussionDetailById,
  getDiscussionStats,
  listDiscussionSummaries,
  toggleDiscussionLike,
  recordDiscussionView,
} from "./discussions.repository.js";

async function getDiscussionOrThrow(discussionId, viewerId) {
  const discussion = await findDiscussionDetailById(discussionId, viewerId);

  if (!discussion) {
    throw new AppError("Discussion not found.", 404, "DISCUSSION_NOT_FOUND");
  }

  return discussion;
}

export async function listDiscussionsService(actor, query) {
  const [feedPage, stats] = await Promise.all([
    listDiscussionSummaries(actor.id, query, {
      page: query.page,
      limit: query.limit,
    }),
    getDiscussionStats(actor.id),
  ]);

  return {
    items: feedPage.items,
    stats,
    meta: feedPage.meta,
  };
}

export async function getDiscussionDetailService(actor, discussionId) {
  const discussion = await getDiscussionOrThrow(discussionId, actor.id);

  if (discussion.viewerHasViewed) {
    return discussion;
  }

  await recordDiscussionView(discussionId, actor.id);
  return getDiscussionOrThrow(discussionId, actor.id);
}

export async function createDiscussionService(actor, payload) {
  return createDiscussionRecord({
    title: payload.title,
    content: payload.content,
    category: payload.category,
    tags: payload.tags ?? [],
    authorId: actor.id,
  });
}

export async function createDiscussionCommentService(actor, discussionId, payload) {
  await getDiscussionOrThrow(discussionId, actor.id);

  const parentCommentId = payload.parentCommentId ? String(payload.parentCommentId).trim() : null;

  if (parentCommentId) {
    const parentComment = await findDiscussionCommentById(parentCommentId);

    if (!parentComment || parentComment.discussionId !== discussionId) {
      throw new AppError("Reply target was not found in this discussion.", 404, "DISCUSSION_COMMENT_NOT_FOUND");
    }
  }

  return createDiscussionCommentRecord({
    discussionId,
    authorId: actor.id,
    parentCommentId,
    content: payload.content,
  });
}

export async function likeDiscussionService(actor, discussionId) {
  await getDiscussionOrThrow(discussionId, actor.id);
  await toggleDiscussionLike(discussionId, actor.id);
  return getDiscussionOrThrow(discussionId, actor.id);
}

export async function deleteDiscussionService(actor, discussionId) {
  const discussion = await findDiscussionById(discussionId);

  if (!discussion) {
    throw new AppError("Discussion not found.", 404, "DISCUSSION_NOT_FOUND");
  }

  if (discussion.authorId !== actor.id) {
    throw new AppError("Only the discussion author can delete this discussion.", 403, "FORBIDDEN_DISCUSSION_DELETE");
  }

  await deleteDiscussionRecord(discussionId);

  return {
    id: discussionId,
    deleted: true,
  };
}

export async function deleteDiscussionCommentService(actor, discussionId, commentId) {
  await getDiscussionOrThrow(discussionId, actor.id);

  const comment = await findDiscussionCommentById(commentId);

  if (!comment || comment.discussionId !== discussionId) {
    throw new AppError("Comment not found.", 404, "DISCUSSION_COMMENT_NOT_FOUND");
  }

  if (comment.authorId !== actor.id) {
    throw new AppError("Only the comment author can delete this comment.", 403, "FORBIDDEN_DISCUSSION_COMMENT_DELETE");
  }

  if ((comment._count?.replies ?? 0) > 0) {
    throw new AppError(
      "Delete the replies under this comment first, then delete the parent comment.",
      409,
      "DISCUSSION_COMMENT_HAS_REPLIES"
    );
  }

  await deleteDiscussionCommentRecord(commentId);

  return {
    id: commentId,
    discussionId,
    parentCommentId: comment.parentCommentId ?? null,
    deleted: true,
  };
}
