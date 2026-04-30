import { z } from "zod";

const resourceCategorySchema = z.enum(["documentation", "tutorial", "code", "template", "other"]);
const resourceTypeSchema = z.enum(["file", "video", "link", "github"]);

export const listResourcesSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    category: z
      .enum(["all", "documentation", "tutorial", "code", "template", "other"])
      .optional()
      .default("all"),
  }),
});

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

const upsertResourceInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(1000),
  category: resourceCategorySchema,
  type: resourceTypeSchema,
  url: z.string().trim().url().optional(),
  tags: tagsSchema,
});

export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const resourceByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export function parseUpsertResourceBody(rawBody, options = {}) {
  const parsed = upsertResourceInputSchema.parse(rawBody ?? {});
  const fileUrl = typeof options.fileUrl === "string" ? options.fileUrl.trim() : "";
  const existingUrl = typeof options.existingUrl === "string" ? options.existingUrl.trim() : "";

  if (parsed.type === "file") {
    const resolvedUrl = fileUrl || existingUrl;
    if (!resolvedUrl) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "Upload a file when type is FILE.",
          path: ["file"],
        },
      ]);
    }

    return { ...parsed, url: resolvedUrl };
  }

  if (!parsed.url) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "URL is required for video, link, and GitHub resources.",
        path: ["url"],
      },
    ]);
  }

  return parsed;
}
