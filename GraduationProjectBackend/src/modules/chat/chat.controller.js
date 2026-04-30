import {
  clearConversationService,
  deleteChatMessageService,
  editChatMessageService,
  getChatBootstrapService,
  getChatUnreadCountService,
  getConversationMessagesService,
  markConversationSeenService,
  sendChatMessageService,
  searchChatUsersService,
} from "./chat.service.js";

export async function searchChatUsers(req, res) {
  const result = await searchChatUsersService(req.user, req.query.q);
  res.json({ ok: true, data: result });
}

export async function getChatBootstrap(req, res) {
  const result = await getChatBootstrapService(req.user);
  res.json({ ok: true, data: result });
}

export async function getChatUnreadCount(req, res) {
  const result = await getChatUnreadCountService(req.user);
  res.json({ ok: true, data: result });
}

export async function getConversationMessages(req, res) {
  const result = await getConversationMessagesService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function sendChatMessage(req, res) {
  const result = await sendChatMessageService(req.user, req.validated.body, req.file);
  res.status(201).json({ ok: true, data: result });
}

export async function markConversationSeen(req, res) {
  const result = await markConversationSeenService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function deleteChatMessage(req, res) {
  const result = await deleteChatMessageService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function editChatMessage(req, res) {
  const result = await editChatMessageService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function clearConversation(req, res) {
  const result = await clearConversationService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}
