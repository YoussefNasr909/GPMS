import { z } from "zod";

const optionalTeamQuery = z.object({
  teamId: z.string().min(1).optional(),
});

const repoVisibilityValues = ["PUBLIC", "PRIVATE", "INTERNAL"];

const syncSettingsSchema = z
  .object({
    syncIssuesToTasks: z.boolean().optional(),
    syncActivityToWeeklyReports: z.boolean().optional(),
    syncReleasesToSubmissions: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one sync setting to update",
  });

export const emptyBodySchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: optionalTeamQuery.optional().default({}),
});

export const getConnectUrlSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    teamId: z.string().min(1).optional(),
  }),
});

export const githubUserCallbackSchema = z.object({
  body: z.any().optional(),
  query: z.object({
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    error_description: z.string().min(1).optional(),
  }),
  params: z.any().optional(),
});

export const githubInstallCallbackSchema = z.object({
  body: z.any().optional(),
  query: z.object({
    installation_id: z.union([z.string(), z.number()]).optional(),
    setup_action: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
  }),
  params: z.any().optional(),
});

export const createRepositorySchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    installationId: z.union([z.string().min(1), z.number()]),
    owner: z.string().trim().min(1).max(120),
    ownerType: z.enum(["USER", "ORGANIZATION"]).optional(),
    repoName: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z0-9._-]+$/, "Repository name contains invalid characters"),
    description: z.string().trim().max(500).optional(),
    visibility: z.enum(repoVisibilityValues).optional(),
    defaultBranch: z.string().trim().min(1).max(120).optional(),
    templateOwner: z.string().trim().min(1).max(120).optional(),
    templateRepo: z.string().trim().min(1).max(120).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const connectRepositorySchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    installationId: z.union([z.string().min(1), z.number()]),
    owner: z.string().trim().min(1).max(120),
    repoName: z.string().trim().min(1).max(120),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const deleteRepositorySchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    confirmationText: z.string().trim().min(1).max(255),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const disconnectRepositorySchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    confirmationText: z.string().trim().min(1).max(255),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    defaultBranch: z.string().trim().min(1).max(120).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    confirmationText: z.string().trim().max(255).optional(),
    syncSettings: syncSettingsSchema.optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
}).refine((value) => Boolean(value.body.defaultBranch || value.body.visibility || value.body.syncSettings), {
  message: "Provide at least one settings field to update",
  path: ["body"],
});

export const inviteCollaboratorSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    login: z.string().trim().min(1).max(120),
    permission: z.enum(["pull", "triage", "push", "maintain", "admin"]).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const removeCollaboratorSchema = z.object({
  body: z.any().optional(),
  query: optionalTeamQuery.optional().default({}),
  params: z.object({
    username: z.string().trim().min(1).max(120),
  }),
});

export const deleteInvitationSchema = z.object({
  body: z.any().optional(),
  query: optionalTeamQuery.optional().default({}),
  params: z.object({
    invitationId: z.coerce.number().int().min(1),
  }),
});

export const repositoryScopedQuerySchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    teamId: z.string().min(1).optional(),
    ref: z.string().trim().min(1).max(255).optional(),
    path: z.string().trim().max(1000).optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    state: z.string().trim().max(50).optional(),
    q: z.string().trim().max(200).optional(),
    branch: z.string().trim().max(255).optional(),
    base: z.string().trim().max(255).optional(),
    head: z.string().trim().max(255).optional(),
  }),
});

export const getCommitByShaSchema = z.object({
  body: z.any().optional(),
  query: z.object({
    teamId: z.string().min(1).optional(),
  }),
  params: z.object({
    sha: z.string().trim().min(7).max(255),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    name: z.string().trim().min(1).max(255),
    fromBranch: z.string().trim().min(1).max(255).optional(),
    fromSha: z.string().trim().min(7).max(255).optional(),
    startEmpty: z.boolean().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const deleteBranchSchema = z.object({
  body: z.any().optional(),
  query: optionalTeamQuery.optional().default({}),
  params: z.object({
    name: z.string().trim().min(1).max(255),
  }),
});

export const commitFileSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    branch: z.string().trim().min(1).max(255),
    expectedHeadSha: z.string().trim().min(7).max(255).optional(),
    message: z.string().trim().min(3).max(500),
    changes: z
      .array(
        z.object({
          action: z.enum(["create", "update", "delete", "rename"]),
          path: z.string().trim().min(1).max(1000),
          previousPath: z.string().trim().max(1000).optional(),
          content: z.string().optional(),
        }),
      )
      .min(1)
      .max(20),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const createIssueSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    title: z.string().trim().min(3).max(300),
    body: z.string().trim().max(10000).optional(),
    assignees: z.array(z.string().trim().min(1)).max(10).optional(),
    labels: z.array(z.string().trim().min(1)).max(20).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const updateIssueSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    title: z.string().trim().min(3).max(300).optional(),
    body: z.string().trim().max(10000).optional(),
    state: z.enum(["open", "closed"]).optional(),
    assignees: z.array(z.string().trim().min(1)).max(10).optional(),
    labels: z.array(z.string().trim().min(1)).max(20).optional(),
  }),
  params: z.object({
    number: z.coerce.number().int().min(1),
  }),
  query: z.any().optional(),
}).refine((value) => Object.keys(value.body).filter((key) => key !== "teamId").length > 0, {
  message: "Provide at least one issue field to update",
  path: ["body"],
});

export const mergeBranchSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    base: z.string().trim().min(1).max(255),
    head: z.string().trim().min(1).max(255),
    commitMessage: z.string().trim().max(1000).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const createPullRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    title: z.string().trim().min(3).max(300),
    body: z.string().trim().max(10000).optional(),
    head: z.string().trim().min(1).max(255),
    base: z.string().trim().min(1).max(255),
    draft: z.boolean().optional(),
    reviewerLogins: z.array(z.string().trim().min(1)).max(10).optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const reviewPullRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    body: z.string().trim().max(10000).optional(),
    event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
  }),
  params: z.object({
    number: z.coerce.number().int().min(1),
  }),
  query: z.any().optional(),
});

export const getPullRequestByNumberSchema = z.object({
  body: z.any().optional(),
  query: z.object({
    teamId: z.string().min(1).optional(),
  }),
  params: z.object({
    number: z.coerce.number().int().min(1),
  }),
});

export const mergePullRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    commitTitle: z.string().trim().max(300).optional(),
    commitMessage: z.string().trim().max(10000).optional(),
    mergeMethod: z.enum(["merge", "squash", "rebase"]).optional(),
  }),
  params: z.object({
    number: z.coerce.number().int().min(1),
  }),
  query: z.any().optional(),
});

export const createReleaseSchema = z.object({
  body: z.object({
    teamId: z.string().min(1).optional(),
    tagName: z.string().trim().min(1).max(255),
    targetCommitish: z.string().trim().max(255).optional(),
    name: z.string().trim().max(255).optional(),
    body: z.string().trim().max(20000).optional(),
    draft: z.boolean().optional(),
    prerelease: z.boolean().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const workflowLogsSchema = z.object({
  body: z.any().optional(),
  query: z.object({
    teamId: z.string().min(1).optional(),
  }),
  params: z.object({
    runId: z.coerce.number().int().min(1),
  }),
});
