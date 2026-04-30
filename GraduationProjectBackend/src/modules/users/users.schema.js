import { z } from "zod";
import { ROLES, ROLE_VALUES } from "../../common/constants/roles.js";
import { ACCOUNT_STATUS_VALUES } from "../../common/constants/accountStatuses.js";
import { DEPARTMENT_VALUES } from "../../common/constants/departments.js";
import { TRACK_VALUES } from "../../common/constants/tracks.js";
import { ACADEMIC_YEAR_VALUES } from "../../common/constants/academicYears.js";

const adminPasswordSchema = z.string().min(6, "password must be at least 6 characters");

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "firstName must be at least 2 characters"),
    lastName: z.string().min(2, "lastName must be at least 2 characters"),
    email: z.string().email("invalid email"),
    phone: z.string().min(7).max(20).nullable().optional(),
    role: z.enum(ROLE_VALUES),
    password: adminPasswordSchema,
    academicId: z.string().trim().min(1, "academicId is required").max(50),
    accountStatus: z.enum(ACCOUNT_STATUS_VALUES),
    department: z.enum(DEPARTMENT_VALUES).nullable().optional(),
    academicYear: z.enum(ACADEMIC_YEAR_VALUES).nullable().optional(),
    preferredTrack: z.enum(TRACK_VALUES).nullable().optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getUserByIdSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const listUsersSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(100).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
  }),
});

export const getUsersSummarySchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.any().optional(),
});

export const listDirectoryUsersSchema = z.object({
  body: z.any().optional(),
  params: z.any().optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    search: z.string().trim().max(100).optional(),
    role: z.enum(ROLE_VALUES).optional(),
  }),
});

export const getDirectoryUserByIdSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(7).max(20).nullable().optional(),
      role: z.enum(ROLE_VALUES).optional(),
      password: adminPasswordSchema.optional(),
      academicId: z.string().trim().min(1).max(50).optional(),
      accountStatus: z.enum(ACCOUNT_STATUS_VALUES).optional(),
      department: z.enum(DEPARTMENT_VALUES).nullable().optional(),
      academicYear: z.enum(ACADEMIC_YEAR_VALUES).nullable().optional(),
      preferredTrack: z.enum(TRACK_VALUES).nullable().optional(),
      avatarUrl: z.string().url().nullable().optional(),
      bio: z.string().trim().max(500).nullable().optional(),
      linkedinUrl: z.string().url().nullable().optional(),
      githubUsername: z
        .string()
        .trim()
        .regex(/^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/, "githubUsername must be a valid GitHub username")
        .nullable()
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const deleteUserSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(2).max(50).optional(),
      lastName: z.string().min(2).max(50).optional(),
      phone: z.string().min(7).max(20).nullable().optional(),
      department: z.enum(DEPARTMENT_VALUES).nullable().optional(),
      preferredTrack: z.enum(TRACK_VALUES).nullable().optional(),
      academicYear: z.enum(ACADEMIC_YEAR_VALUES).nullable().optional(),
      avatarUrl: z.string().url().nullable().optional(),
      bio: z.string().trim().max(500).nullable().optional(),
      linkedinUrl: z.string().url().nullable().optional(),
      githubUsername: z
        .string()
        .trim()
        .regex(/^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/, "githubUsername must be a valid GitHub username")
        .nullable()
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update",
    }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateMyRoleSchema = z.object({
  body: z.object({
    role: z.union([z.literal(ROLES.STUDENT), z.literal(ROLES.LEADER)]),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});
