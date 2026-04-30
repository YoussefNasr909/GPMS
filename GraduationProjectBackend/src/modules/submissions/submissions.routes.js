import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { ROLES } from "../../common/constants/roles.js";
import { AppError } from "../../common/errors/AppError.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listSubmissions,
  createSubmission,
  getSubmission,
  gradeSubmission,
  requestRevision,
  deleteSubmission,
  getSDLCSummary,
  advanceStage,
} from "./submissions.controller.js";
import {
  listSubmissionsSchema,
  submissionByIdSchema,
  gradeSubmissionSchema,
  requestRevisionSchema,
  sdlcSummarySchema,
  advanceStageSchema,
} from "./submissions.schema.js";

const router = Router();

const submissionsUploadDir = path.resolve(process.cwd(), "uploads", "submissions");
fs.mkdirSync(submissionsUploadDir, { recursive: true });

const allowedExtensions = new Set([
  ".pdf", ".doc", ".docx", ".ppt", ".pptx",
  ".xls", ".xlsx", ".zip", ".txt", ".png", ".jpg", ".jpeg",
]);
const allowedMimeTypes = new Set([
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
  "image/png",
  "image/jpeg",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, submissionsUploadDir),
    filename: (_req, file, cb) => {
      const safeName = String(file.originalname || "submission")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowed = allowedExtensions.has(ext) || allowedMimeTypes.has(file.mimetype);
    cb(
      allowed
        ? null
        : new AppError(
            "Allowed file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT, PNG, JPG.",
            422,
            "SUBMISSION_INVALID_FILE_TYPE",
          ),
      allowed,
    );
  },
});

const uploadSingle = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error?.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Submission file max size is 50MB.", 422, "SUBMISSION_FILE_TOO_LARGE"));
    }
    if (error instanceof AppError) return next(error);
    return next(new AppError(error.message || "File upload failed.", 422, "SUBMISSION_UPLOAD_FAILED"));
  });
};

router.use(auth);

// SDLC-specific endpoints — must be registered before /:id routes
router.get("/sdlc-summary", validate(sdlcSummarySchema), getSDLCSummary);
router.post("/advance-stage", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(advanceStageSchema), advanceStage);

// CRUD
router.get("/", validate(listSubmissionsSchema), listSubmissions);
router.post("/", allowRoles(ROLES.LEADER), uploadSingle, createSubmission);
router.get("/:id", validate(submissionByIdSchema), getSubmission);
router.patch("/:id/grade", allowRoles(ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN), validate(gradeSubmissionSchema), gradeSubmission);
router.patch("/:id/request-revision", allowRoles(ROLES.DOCTOR, ROLES.TA, ROLES.ADMIN), validate(requestRevisionSchema), requestRevision);
router.delete("/:id", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(submissionByIdSchema), deleteSubmission);

export default router;
