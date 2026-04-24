import { Prisma } from "@prisma/client";
import { prisma } from "../../loaders/dbLoader.js";

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  role: true,
};

const commentSelect = {
  id: true,
  content: true,
  parentCommentId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect,
  },
};

function discussionSummarySelect(viewerId) {
  return {
    id: true,
    title: true,
    content: true,
    category: true,
    tags: true,
    likeCount: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: authorSelect,
    },
    _count: {
      select: {
        comments: true,
      },
    },
    likes: viewerId
      ? {
          where: { userId: viewerId },
          select: { id: true },
        }
      : false,
    views: viewerId
      ? {
          where: { userId: viewerId },
          select: { id: true },
        }
      : false,
  };
}

function discussionDetailSelect(viewerId) {
  return {
    ...discussionSummarySelect(viewerId),
    comments: {
      orderBy: { createdAt: "asc" },
      select: commentSelect,
    },
  };
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function mapRoleLabel(role) {
  switch (role) {
    case "LEADER":
      return "Student Leader";
    case "DOCTOR":
      return "Doctor";
    case "TA":
      return "Teaching Assistant";
    case "ADMIN":
      return "Admin";
    case "STUDENT":
    default:
      return "Student Member";
  }
}

function toAuthor(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: buildFullName(user) || "Unknown User",
    avatarUrl: user.avatarUrl,
    role: user.role,
    roleLabel: mapRoleLabel(user.role),
  };
}

function toComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    parentCommentId: comment.parentCommentId ?? null,
    replyCount: 0,
    replies: [],
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: toAuthor(comment.author),
  };
}

function finalizeCommentReplies(comment) {
  const nestedReplies = comment.replies.map(finalizeCommentReplies);
  const descendantCount = nestedReplies.reduce((total, reply) => total + 1 + reply.replyCount, 0);

  return {
    ...comment,
    replies: nestedReplies,
    replyCount: descendantCount,
  };
}

function buildCommentTree(comments) {
  const commentMap = new Map();

  comments.forEach((comment) => {
    commentMap.set(comment.id, toComment(comment));
  });

  const rootComments = [];

  comments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id);
    const parentId = comment.parentCommentId ?? null;

    if (parentId) {
      const parentComment = commentMap.get(parentId);
      if (parentComment) {
        parentComment.replies.push(mappedComment);
        return;
      }
    }

    rootComments.push(mappedComment);
  });

  return rootComments.map(finalizeCommentReplies);
}

function toDiscussionSummary(discussion) {
  return {
    id: discussion.id,
    title: discussion.title,
    content: discussion.content,
    category: discussion.category.toLowerCase(),
    tags: discussion.tags,
    likeCount: discussion.likeCount,
    viewCount: discussion.viewCount,
    commentCount: discussion._count.comments,
    isPinned: false,
    createdAt: discussion.createdAt.toISOString(),
    updatedAt: discussion.updatedAt.toISOString(),
    author: toAuthor(discussion.author),
    viewerHasLiked: Boolean(discussion.likes?.length),
    viewerHasViewed: Boolean(discussion.views?.length),
  };
}

function toDiscussionDetail(discussion) {
  return {
    ...toDiscussionSummary(discussion),
    comments: buildCommentTree(discussion.comments),
  };
}

function buildDiscussionWhere(filters = {}) {
  const search = String(filters.search ?? "").trim();
  const category = String(filters.category ?? "all").trim().toLowerCase();

  return {
    ...(category && category !== "all" ? { category: category.toUpperCase() } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            { tags: { hasSome: [search] } },
          ],
        }
      : {}),
  };
}

export async function listDiscussionSummaries(viewerId, filters = {}, pagination = {}) {
  const where = buildDiscussionWhere(filters);
  const limit = Math.min(Math.max(Number(pagination.limit ?? 5) || 5, 1), 5);
  const requestedPage = Math.max(Number(pagination.page ?? 1) || 1, 1);
  const total = await prisma.discussion.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = total === 0 ? 1 : Math.min(requestedPage, totalPages);
  const skip = (page - 1) * limit;

  const discussions = await prisma.discussion.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip,
    take: limit,
    select: discussionSummarySelect(viewerId),
  });

  return {
    items: discussions.map(toDiscussionSummary),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getDiscussionStats(userId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalDiscussions, activeToday, yourPosts, replies] = await prisma.$transaction([
    prisma.discussion.count(),
    prisma.discussion.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),
    prisma.discussion.count({
      where: {
        authorId: userId,
      },
    }),
    prisma.discussionComment.count({
      where: {
        authorId: userId,
      },
    }),
  ]);

  return {
    totalDiscussions,
    activeToday,
    yourPosts,
    replies,
  };
}

export async function findDiscussionDetailById(id, viewerId) {
  const discussion = await prisma.discussion.findUnique({
    where: { id },
    select: discussionDetailSelect(viewerId),
  });

  return discussion ? toDiscussionDetail(discussion) : null;
}

export async function findDiscussionById(id) {
  return prisma.discussion.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      createdAt: true,
    },
  });
}

export async function createDiscussionRecord(data, viewerId = data.authorId) {
  const discussion = await prisma.discussion.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category.toUpperCase(),
      tags: data.tags ?? [],
      authorId: data.authorId,
    },
    select: discussionSummarySelect(viewerId),
  });

  return toDiscussionSummary(discussion);
}

export async function createDiscussionCommentRecord(data) {
  const comment = await prisma.discussionComment.create({
    data: {
      discussionId: data.discussionId,
      authorId: data.authorId,
      parentCommentId: data.parentCommentId ?? null,
      content: data.content,
    },
    select: commentSelect,
  });

  return toComment(comment);
}

export async function findDiscussionCommentById(id) {
  return prisma.discussionComment.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      discussionId: true,
      parentCommentId: true,
      createdAt: true,
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });
}

export async function deleteDiscussionRecord(id) {
  await prisma.discussion.delete({
    where: { id },
  });
}

export async function deleteDiscussionCommentRecord(id) {
  await prisma.discussionComment.delete({
    where: { id },
  });
}

function isUniqueConstraintError(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function toggleDiscussionLike(discussionId, userId) {
  return prisma.$transaction(async (tx) => {
    const existingLike = await tx.discussionLike.findFirst({
      where: {
        discussionId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (existingLike) {
      await tx.discussionLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      await tx.discussion.update({
        where: { id: discussionId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      return false;
    }

    await tx.discussionLike.create({
      data: {
        discussionId,
        userId,
      },
    });

    await tx.discussion.update({
      where: { id: discussionId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    return true;
  });
}

export async function recordDiscussionView(discussionId, userId) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.discussionView.create({
        data: {
          discussionId,
          userId,
        },
      });

      await tx.discussion.update({
        where: { id: discussionId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    });

    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }

    throw error;
  }
}
