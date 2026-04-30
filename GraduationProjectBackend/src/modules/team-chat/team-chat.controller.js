import {
  getTeamGroupChatBootstrapService,
  getTeamGroupConversationMessagesService,
  markTeamGroupConversationSeenService,
  sendTeamGroupMessageService,
} from "./team-chat.service.js";

export async function getTeamGroupChatBootstrap(req, res) {
  const result = await getTeamGroupChatBootstrapService(req.user);
  res.json({ ok: true, data: result });
}

export async function getTeamGroupConversationMessages(req, res) {
  const result = await getTeamGroupConversationMessagesService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function sendTeamGroupMessage(req, res) {
  const result = await sendTeamGroupMessageService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function markTeamGroupConversationSeen(req, res) {
  const result = await markTeamGroupConversationSeenService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}
