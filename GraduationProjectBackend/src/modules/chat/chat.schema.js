import { z } from "zod";

const idSchema = z.string().trim().min(1, "id is required");

export const getChatBootstrapSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getChatUnreadCountSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const getConversationMessagesSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const sendChatMessageSchema = z.object({
  body: z.object({
    recipientId: idSchema,
    content: z.string().trim().max(4000).optional().default(""),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const markConversationSeenSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const deleteChatMessageSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const editChatMessageSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, "content is required").max(4000),
  }),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});

export const clearConversationSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: idSchema,
  }),
});
