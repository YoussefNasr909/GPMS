import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import { ACCOUNT_STATUSES } from "../../common/constants/accountStatuses.js";
import { prisma } from "../../loaders/dbLoader.js";
import {
  addUserSocket,
  clearSocketActiveConversation,
  joinUserRoom,
  registerChatIo,
  removeUserSocket,
  setSocketActiveConversation,
} from "./chat.realtime.js";
import {
  getChatUnreadCountService,
  markConversationSeenService,
  markPendingDeliveriesService,
  sendChatMessageService,
} from "./chat.service.js";

function toSocketErrorPayload(error) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: "CHAT_SOCKET_ERROR",
    message: "Something went wrong while processing the chat event.",
  };
}

function extractSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
}

async function authenticateSocket(socket) {
  const token = extractSocketToken(socket);
  const payload = jwt.verify(token, env.jwtSecret);

  if (!payload || typeof payload !== "object" || !payload.id) {
    throw new AppError("Invalid token", 401, "INVALID_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      role: true,
      isEmailVerified: true,
      accountStatus: true,
    },
  });

  if (!user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!user.isEmailVerified) {
    throw new AppError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
  }

  if (user.accountStatus === ACCOUNT_STATUSES.INACTIVE) {
    throw new AppError("This account is inactive. Please contact an administrator.", 403, "ACCOUNT_INACTIVE");
  }

  if (user.accountStatus === ACCOUNT_STATUSES.SUSPENDED) {
    throw new AppError("This account has been suspended. Please contact an administrator.", 403, "ACCOUNT_SUSPENDED");
  }

  return {
    id: user.id,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

async function syncUnreadBadge(actor) {
  const unread = await getChatUnreadCountService(actor);
  return unread.unreadCount;
}

export function initChatSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
    },
  });

  registerChatIo(io);

  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticateSocket(socket);
      next();
    } catch (error) {
      const payload = toSocketErrorPayload(error);
      next(new Error(payload.message));
    }
  });

  io.on("connection", async (socket) => {
    const actor = socket.data.user;

    addUserSocket(actor.id, socket.id);
    joinUserRoom(socket, actor.id);

    try {
      await markPendingDeliveriesService(actor);
      const unreadCount = await syncUnreadBadge(actor);
      socket.emit("chat:badge", { unreadCount });
    } catch (error) {
      console.error("CHAT_SOCKET_CONNECT_SYNC_FAILED:", error);
    }

    socket.on("chat:message:send", async (payload, ack) => {
      try {
        const result = await sendChatMessageService(actor, payload);
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: toSocketErrorPayload(error) });
      }
    });

    socket.on("chat:conversation:open", async (payload, ack) => {
      try {
        setSocketActiveConversation(socket.id, payload?.conversationId ?? null);
        const result = await markConversationSeenService(actor, payload?.conversationId);
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: toSocketErrorPayload(error) });
      }
    });

    socket.on("chat:conversation:close", () => {
      clearSocketActiveConversation(socket.id);
    });

    socket.on("disconnect", () => {
      clearSocketActiveConversation(socket.id);
      removeUserSocket(actor.id, socket.id);
    });
  });

  return io;
}
