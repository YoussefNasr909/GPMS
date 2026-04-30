import { z } from "zod";

const deliverableTypeSchema = z.enum([
  "SRS",
  "UML",
  "PROTOTYPE",
  "CODE",
  "TEST_PLAN",
  "FINAL_REPORT",
  "PRESENTATION",
]);

const sdlcPhaseSchema = z.enum([
  "REQUIREMENTS",
  "DESIGN",
  "IMPLEMENTATION",
  "TESTING",
  "DEPLOYMENT",
  "MAINTENANCE",
]);

const submissionStatusSchema = z.enum([
  "PENDING",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "APPROVED",
]);

export const listSubmissionsSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    teamId: z.string().trim().min(1).optional(),
    sdlcPhase: sdlcPhaseSchema.optional(),
    deliverableType: deliverableTypeSchema.optional(),
    status: submissionStatusSchema.optional(),
  }),
});

export const submissionByIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
});

export const gradeSubmissionSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({
    grade: z.coerce.number().int().min(0).max(100),
    feedback: z.string().trim().min(3).max(2000).optional(),
  }),
});

export const requestRevisionSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional().default({}),
  body: z.object({
    feedback: z.string().trim().min(10).max(2000),
  }),
});

export const sdlcSummarySchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    teamId: z.string().trim().min(1).optional(),
  }),
});

export const advanceStageSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({
    teamId: z.string().trim().min(1).optional(),
  }),
});

const createSubmissionInputSchema = z.object({
  deliverableType: deliverableTypeSchema,
  sdlcPhase: sdlcPhaseSchema,
  title: z.string().trim().min(3).max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  deadline: z.string().trim().optional().nullable(),
});

export function parseCreateSubmissionBody(rawBody) {
  return createSubmissionInputSchema.parse(rawBody ?? {});
}
