import { z } from "zod";

const documentCategorySchema = z.enum(["deliverable", "documentation", "other"]);

export const listDocumentsSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    category: z.enum(["all", "deliverable", "documentation", "other"]).optional().default("all"),
    teamId: z.string().trim().optional(),
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

const createDocumentInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(1000),
  category: documentCategorySchema,
  tags: tagsSchema,
});

export const documentByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const updateDocumentSchema = documentByIdSchema;

export function parseCreateDocumentBody(rawBody) {
  return createDocumentInputSchema.parse(rawBody ?? {});
}
