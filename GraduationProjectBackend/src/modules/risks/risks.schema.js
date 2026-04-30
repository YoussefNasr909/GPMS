import { z } from "zod";

const RISK_STATUS_VALUES = ["OPEN", "MONITORING", "RESOLVED"];
const RISK_APPROVAL_STATUS_VALUES = ["PENDING", "APPROVED", "REVISION_REQUESTED"];
const RISK_CHANCE_VALUES = ["LOW", "MEDIUM", "HIGH"];
const RISK_SEVERITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const riskTitleSchema = z.string().trim().min(3, "Risk title must be at least 3 characters").max(200);
const riskDescriptionSchema = z.string().trim().min(5, "Risk description must be at least 5 characters").max(2000);
const riskCategorySchema = z.string().trim().min(2, "Risk category is required").max(80);
const riskNotesSchema = z.string().trim().max(3000).optional();

export const listRisksSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    teamId: z.string().trim().min(1).optional(),
    status: z.enum(RISK_STATUS_VALUES).optional(),
    approvalStatus: z.enum(RISK_APPROVAL_STATUS_VALUES).optional(),
    severity: z.enum(RISK_SEVERITY_VALUES).optional(),
  }),
});

export const createRiskSchema = z.object({
  body: z.object({
    teamId: z.string().trim().min(1).optional(),
    title: riskTitleSchema,
    description: riskDescriptionSchema,
    category: riskCategorySchema,
    chance: z.enum(RISK_CHANCE_VALUES),
    impact: z.enum(RISK_CHANCE_VALUES),
    mitigation: riskNotesSchema,
    monitorUserId: z.string().trim().min(1, "Choose a team member to monitor this risk").optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateRiskSchema = z.object({
  body: z
    .object({
      title: riskTitleSchema.optional(),
      description: riskDescriptionSchema.optional(),
      category: riskCategorySchema.optional(),
      chance: z.enum(RISK_CHANCE_VALUES).optional(),
      impact: z.enum(RISK_CHANCE_VALUES).optional(),
      status: z.enum(RISK_STATUS_VALUES).optional(),
      mitigation: riskNotesSchema,
      monitoringNotes: riskNotesSchema,
      resolutionNotes: riskNotesSchema,
      monitorUserId: z.string().trim().min(1).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Risk id is required"),
  }),
});

export const approveRiskSchema = z.object({
  body: z.object({
    severity: z.enum(RISK_SEVERITY_VALUES),
    approvalNote: riskNotesSchema,
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Risk id is required"),
  }),
});

export const requestRiskRevisionSchema = z.object({
  body: z.object({
    approvalNote: z.string().trim().min(3, "Add a revision note").max(3000),
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Risk id is required"),
  }),
});
