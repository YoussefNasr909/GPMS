import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getTeamGroupChatBootstrap,
  getTeamGroupConversationMessages,
  markTeamGroupConversationSeen,
  sendTeamGroupMessage,
} from "./team-chat.controller.js";
import {
  getTeamGroupChatBootstrapSchema,
  getTeamGroupConversationMessagesSchema,
  markTeamGroupConversationSeenSchema,
  sendTeamGroupMessageSchema,
} from "./team-chat.schema.js";

const router = Router();

router.use(auth);

router.get("/bootstrap", validate(getTeamGroupChatBootstrapSchema), getTeamGroupChatBootstrap);
router.get("/conversations/:id/messages", validate(getTeamGroupConversationMessagesSchema), getTeamGroupConversationMessages);
router.post("/conversations/:id/messages", validate(sendTeamGroupMessageSchema), sendTeamGroupMessage);
router.patch("/conversations/:id/seen", validate(markTeamGroupConversationSeenSchema), markTeamGroupConversationSeen);

export default router;
