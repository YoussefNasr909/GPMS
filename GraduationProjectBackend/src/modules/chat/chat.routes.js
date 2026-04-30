import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  clearConversation,
  deleteChatMessage,
  editChatMessage,
  getChatBootstrap,
  getChatUnreadCount,
  getConversationMessages,
  markConversationSeen,
  sendChatMessage,
  searchChatUsers,
} from "./chat.controller.js";
import {
  clearConversationSchema,
  deleteChatMessageSchema,
  editChatMessageSchema,
  getChatBootstrapSchema,
  getChatUnreadCountSchema,
  getConversationMessagesSchema,
  markConversationSeenSchema,
  sendChatMessageSchema,
} from "./chat.schema.js";

import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "../../common/errors/AppError.js";

const chatUploadDir = path.resolve(process.cwd(), "uploads", "chat");
fs.mkdirSync(chatUploadDir, { recursive: true });

const allowedChatExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".txt"]);
const allowedChatMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/octet-stream",
]);

const uploadConfig = {
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, chatUploadDir);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = String(file.originalname || "file")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniquePrefix}-${safeOriginalName}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isAllowed = allowedChatExtensions.has(extension) || allowedChatMimeTypes.has(file.mimetype);

    cb(
      isAllowed
        ? null
        : new AppError(
            "Allowed file types: Images, PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, and TXT.",
            422,
            "CHAT_INVALID_FILE_TYPE",
          ),
      isAllowed,
    );
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for chat
};

const upload = multer(uploadConfig);

const uploadSingleChatFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error?.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Max file size for chat is 10MB.", 422, "CHAT_FILE_TOO_LARGE"));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(error.message || "File upload failed.", 422, "CHAT_FILE_UPLOAD_FAILED"));
  });
};

const router = Router();

router.use(auth);

router.get("/users/search", searchChatUsers);
router.get("/bootstrap", validate(getChatBootstrapSchema), getChatBootstrap);
router.get("/unread-count", validate(getChatUnreadCountSchema), getChatUnreadCount);
router.get("/conversations/:id/messages", validate(getConversationMessagesSchema), getConversationMessages);
router.post("/messages", uploadSingleChatFile, validate(sendChatMessageSchema), sendChatMessage);
router.patch("/conversations/:id/seen", validate(markConversationSeenSchema), markConversationSeen);
router.patch("/messages/:id", validate(editChatMessageSchema), editChatMessage);
router.delete("/messages/:id", validate(deleteChatMessageSchema), deleteChatMessage);
router.delete("/conversations/:id/clear", validate(clearConversationSchema), clearConversation);

export default router;
