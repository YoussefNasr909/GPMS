import { z } from "zod";

const TASK_STATUS_VALUES = ["TODO", "IN_PROGRESS", "REVIEW", "APPROVED", "DONE"];
const TASK_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TASK_TYPE_VALUES = ["CODE", "DOCUMENTATION", "DESIGN", "RESEARCH", "MEETING", "PRESENTATION", "OTHER"];
const TASK_INTEGRATION_MODE_VALUES = ["MANUAL", "GITHUB"];
const MERGE_METHOD_VALUES = ["merge", "squash", "rebase"];
const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD");

const taskTitleSchema = z.string().trim().min(3, "Task title must be at least 3 characters").max(200);
const taskDescriptionSchema = z.string().trim().max(2000).optional();
const reviewCommentSchema = z.string().trim().min(3, "Review comment must be at least 3 characters").max(10000);

export const listTasksSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    teamId: z.string().trim().min(1).optional(),
    search: z.string().trim().max(100).optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    taskType: z.enum(TASK_TYPE_VALUES).optional(),
    integrationMode: z.enum(TASK_INTEGRATION_MODE_VALUES).optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z
    .object({
      teamId: z.string().trim().min(1).optional(),
      title: taskTitleSchema,
      description: taskDescriptionSchema,
      priority: z.enum(TASK_PRIORITY_VALUES),
      taskType: z.enum(TASK_TYPE_VALUES).optional(),
      integrationMode: z.enum(TASK_INTEGRATION_MODE_VALUES).optional(),
      startDate: dateStringSchema,
      endDate: dateStringSchema,
      assigneeUserId: z.string().trim().min(1, "Choose a team member"),
    })
    .refine((body) => body.endDate >= body.startDate, {
      message: "End date must be on or after the start date",
      path: ["endDate"],
    }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: taskTitleSchema.optional(),
      description: taskDescriptionSchema,
      priority: z.enum(TASK_PRIORITY_VALUES).optional(),
      taskType: z.enum(TASK_TYPE_VALUES).optional(),
      integrationMode: z.enum(TASK_INTEGRATION_MODE_VALUES).optional(),
      startDate: dateStringSchema.optional(),
      endDate: dateStringSchema.optional(),
      assigneeUserId: z.string().trim().min(1).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const taskActionSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const approveTaskSchema = z.object({
  body: z.object({
    reviewComment: z.string().trim().max(10000).optional(),
    mergePullRequest: z.boolean().optional(),
    mergeMethod: z.enum(MERGE_METHOD_VALUES).optional(),
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const rejectTaskSchema = z.object({
  body: z.object({
    reviewComment: reviewCommentSchema,
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const bootstrapTaskGithubSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const taskGithubRouteSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});

export const openTaskPullRequestSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(300).optional(),
    body: z.string().trim().max(10000).optional(),
    base: z.string().trim().min(1).max(255).optional(),
    draft: z.boolean().optional(),
    reviewerLogins: z.array(z.string().trim().min(1)).max(10).optional(),
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().trim().min(1, "Task id is required"),
  }),
});
