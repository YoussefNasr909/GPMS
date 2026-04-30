import { z } from "zod";
import { TEAM_STAGE_VALUES } from "../../common/constants/teamStages.js";
import { TEAM_VISIBILITY_VALUES } from "../../common/constants/teamVisibilities.js";

const teamNameSchema = z.string().trim().min(3, "Team name must be at least 3 characters").max(120);
const teamBioSchema = z.string().trim().min(10, "Team bio must be at least 10 characters").max(1000);
const teamStackSchema = z.array(z.string().trim().min(1).max(50)).max(12).default([]);
const maxMembersSchema = z.coerce.number().int().min(3).max(6);

const supervisorRequestTechnologiesSchema = z
  .array(z.string().trim().min(1).max(50))
  .min(1, "Add at least one technology")
  .max(12);

export const listTeamsSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    search: z.string().trim().max(100).optional(),
    stage: z.enum(TEAM_STAGE_VALUES).optional(),
    visibility: z.enum(TEAM_VISIBILITY_VALUES).optional(),
    availability: z.enum(["open", "full"]).optional(),
  }),
});

export const createTeamSchema = z.object({
  body: z.object({
    name: teamNameSchema,
    bio: teamBioSchema,
    stack: teamStackSchema.optional(),
    maxMembers: maxMembersSchema,
    visibility: z.enum(TEAM_VISIBILITY_VALUES),
    allowJoinRequests: z.boolean().optional(),
    stage: z.enum(TEAM_STAGE_VALUES).optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getMyTeamStateSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getTeamByIdSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const updateTeamSchema = z.object({
  body: z
    .object({
      name: teamNameSchema.optional(),
      bio: teamBioSchema.optional(),
      stack: teamStackSchema.optional(),
      maxMembers: maxMembersSchema.optional(),
      visibility: z.enum(TEAM_VISIBILITY_VALUES).optional(),
      allowJoinRequests: z.boolean().optional(),
      stage: z.enum(TEAM_STAGE_VALUES).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const deleteTeamSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const joinByCodeSchema = z.object({
  body: z.object({
    inviteCode: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Z0-9-]+$/, "Invalid invite code format"),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const createJoinRequestSchema = z.object({
  body: z.object({
    message: z.string().trim().max(500).optional(),
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const reviewJoinRequestSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const createInvitationSchema = z.object({
  body: z
    .object({
      email: z.string().email().optional(),
      academicId: z.string().trim().min(1).max(50).optional(),
    })
    .refine(
      (data) => !!data.email !== !!data.academicId,
      "Provide either email or academicId, not both"
    ),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const createSupervisorRequestSchema = z.object({
  body: z.object({
    supervisorId: z.string().min(1, "supervisorId is required"),
    projectName: teamNameSchema,
    projectDescription: teamBioSchema,
    technologies: supervisorRequestTechnologiesSchema,
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const reviewSupervisorRequestSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const respondInvitationSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const removeSupervisorAssignmentSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "team id is required"),
    supervisorRole: z.enum(["DOCTOR", "TA"]),
  }),
});

export const leaveTeamSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const removeTeamMemberSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "team id is required"),
    userId: z.string().min(1, "userId is required"),
  }),
});