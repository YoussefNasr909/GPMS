import { AppError } from "../../common/errors/AppError.js";
import { parseCreateSubmissionBody } from "./submissions.schema.js";
import {
  listSubmissionsService,
  createSubmissionService,
  getSubmissionService,
  gradeSubmissionService,
  requestRevisionService,
  deleteSubmissionService,
  getSDLCSummaryService,
  advanceStageService,
} from "./submissions.service.js";

function resolveBackendOrigin(req) {
  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) return apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

export async function listSubmissions(req, res) {
  const result = await listSubmissionsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createSubmission(req, res) {
  if (!req.file) {
    throw new AppError("A file is required.", 422, "SUBMISSION_FILE_REQUIRED");
  }

  let parsedBody;
  try {
    parsedBody = parseCreateSubmissionBody(req.body);
  } catch (err) {
    const msg = err.issues?.[0]?.message ?? "Validation error";
    throw new AppError(msg, 422, "VALIDATION_ERROR");
  }

  const fileUrl = `${resolveBackendOrigin(req)}/uploads/submissions/${req.file.filename}`;
  const result = await createSubmissionService(req.user, { ...parsedBody, fileUrl }, req.file);
  res.status(201).json({ ok: true, data: result });
}

export async function getSubmission(req, res) {
  const result = await getSubmissionService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function gradeSubmission(req, res) {
  const result = await gradeSubmissionService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function requestRevision(req, res) {
  const result = await requestRevisionService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function deleteSubmission(req, res) {
  const result = await deleteSubmissionService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
}

export async function getSDLCSummary(req, res) {
  const result = await getSDLCSummaryService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function advanceStage(req, res) {
  const result = await advanceStageService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}
