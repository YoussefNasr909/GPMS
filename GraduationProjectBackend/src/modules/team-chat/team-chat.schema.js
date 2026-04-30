import { z } from "zod";

const idSchema = z.string().trim().min(1, "id is required");

export const getTeamGroupChatBootstrapSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getTeamGroupConversationMessagesSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const sendTeamGroupMessageSchema = z.object({
  body: z.object({
    content: z.string().trim().max(4000),
  }),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const markTeamGroupConversationSeenSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});
