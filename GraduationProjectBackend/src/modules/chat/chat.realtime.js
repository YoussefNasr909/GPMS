let ioInstance = null;

const userSockets = new Map();
const socketUsers = new Map();
const socketActiveConversations = new Map();

function getUserRoom(userId) {
  return `chat:user:${userId}`;
}

export function registerChatIo(io) {
  ioInstance = io;
}

export function addUserSocket(userId, socketId) {
  const currentSockets = userSockets.get(userId) ?? new Set();
  currentSockets.add(socketId);
  userSockets.set(userId, currentSockets);
  socketUsers.set(socketId, userId);
}

export function removeUserSocket(userId, socketId) {
  socketActiveConversations.delete(socketId);
  socketUsers.delete(socketId);

  const currentSockets = userSockets.get(userId);
  if (!currentSockets) return;

  currentSockets.delete(socketId);
  if (currentSockets.size === 0) {
    userSockets.delete(userId);
    return;
  }

  userSockets.set(userId, currentSockets);
}

export function setSocketActiveConversation(socketId, conversationId) {
  if (!conversationId) {
    socketActiveConversations.delete(socketId);
    return;
  }

  socketActiveConversations.set(socketId, conversationId);
}

export function clearSocketActiveConversation(socketId) {
  socketActiveConversations.delete(socketId);
}

export function isUserOnline(userId) {
  return Boolean(userSockets.get(userId)?.size);
}

export function isConversationOpenForUser(userId, conversationId) {
  const sockets = userSockets.get(userId);
  if (!sockets?.size) return false;

  for (const socketId of sockets) {
    if (socketActiveConversations.get(socketId) === conversationId) {
      return true;
    }
  }

  return false;
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(getUserRoom(userId)).emit(event, payload);
}

export function joinUserRoom(socket, userId) {
  socket.join(getUserRoom(userId));
}
