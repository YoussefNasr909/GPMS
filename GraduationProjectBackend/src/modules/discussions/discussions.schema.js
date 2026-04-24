import { z } from "zod";

const discussionCategorySchema = z.enum(["technical", "team", "resources", "general"]);

const tagsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return [];

    if (normalized.startsWith("[")) {
      try {
        const parsed = JSON.parse(normalized);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return normalized
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

    return normalized
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string().trim().min(1).max(40)).max(12).default([]));

export const listDiscussionsSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    category: z.enum(["all", "technical", "team", "resources", "general"]).optional().default("all"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(5).optional().default(5),
  }),
});

export const discussionByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const createDiscussionSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({
    title: z.string().trim().min(3).max(160),
    category: discussionCategorySchema,
    content: z.string().trim().min(10).max(4000),
    tags: tagsSchema,
  }),
});

export const createDiscussionCommentSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({
    content: z.string().trim().min(1).max(2000),
    parentCommentId: z.string().trim().min(1).optional(),
  }),
});

export const discussionCommentByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
    commentId: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});
