import path from "node:path";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { removeLocalUploadByUrl, removeUploadedMulterFile } from "../../common/utils/upload-files.js";
import { createDocumentService, deleteDocumentService, listDocumentsService, updateDocumentService } from "./documents.service.js";
import { documentByIdSchema, parseCreateDocumentBody, updateDocumentSchema } from "./documents.schema.js";
import { findDocumentById } from "./documents.repository.js";

function resolveBackendOrigin(req) {
  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) {
    return apiUrl.replace(/\/api\/v1\/?$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

function mapZodToValidationError(error) {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues?.[0];
    throw new AppError(firstIssue?.message ?? "Validation error", 422, "VALIDATION_ERROR");
  }

  throw error;
}

function getUploadedFileType(file) {
  const extension = path.extname(file?.originalname ?? "").replace(/^\./, "").trim().toUpperCase();
  if (extension) return extension;

  const fallback = String(file?.mimetype ?? "")
    .split("/")
    .pop()
    ?.trim()
    .toUpperCase();

  return fallback || "FILE";
}

export async function listDocuments(req, res) {
  const result = await listDocumentsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createDocument(req, res) {
  try {
    if (!req.file) {
      throw new AppError("Upload a document file first.", 422, "DOCUMENT_FILE_REQUIRED");
    }

    const payload = parseCreateDocumentBody(req.body);
    const result = await createDocumentService(req.user, {
      ...payload,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: getUploadedFileType(req.file),
      url: `${resolveBackendOrigin(req)}/uploads/documents/${req.file.filename}`,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    await removeUploadedMulterFile(req.file);
    mapZodToValidationError(error);
  }
}

export async function deleteDocument(req, res) {
  try {
    const parsedRoute = documentByIdSchema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    const existingDocument = await findDocumentById(parsedRoute.params.id);
    const result = await deleteDocumentService(req.user, parsedRoute.params.id);
    await removeLocalUploadByUrl(existingDocument?.url, "documents");
    res.json({ ok: true, data: result });
  } catch (error) {
    mapZodToValidationError(error);
  }
}

export async function updateDocument(req, res) {
  try {
    const parsedRoute = updateDocumentSchema.parse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    const existingDocument = await findDocumentById(parsedRoute.params.id);
    const hadNewFile = Boolean(req.file);
    const document = await updateDocumentService(req.user, parsedRoute.params.id, {
      ...parseCreateDocumentBody(req.body),
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileType: req.file ? getUploadedFileType(req.file) : undefined,
      url: req.file ? `${resolveBackendOrigin(req)}/uploads/documents/${req.file.filename}` : undefined,
    });

    if (hadNewFile && existingDocument?.url && existingDocument.url !== document.url) {
      await removeLocalUploadByUrl(existingDocument.url, "documents");
    }

    res.json({ ok: true, data: document });
  } catch (error) {
    await removeUploadedMulterFile(req.file);
    mapZodToValidationError(error);
  }
}
