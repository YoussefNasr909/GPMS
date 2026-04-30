import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import { prisma } from "../../loaders/dbLoader.js";
import { findTeamByLeaderId, findTeamMemberByUserId } from "../teams/teams.repository.js";
import {
  createDocument,
  deleteDocumentById,
  findDocumentById,
  listDocumentsByTeamIds,
  updateDocumentById,
} from "./documents.repository.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

async function resolveVisibleTeamIds(actor) {
  if (actor.role === ROLES.LEADER) {
    const team = await findTeamByLeaderId(actor.id);
    return team ? [team.id] : [];
  }

  if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    return membership?.team?.id ? [membership.team.id] : [];
  }

  if (actor.role === ROLES.DOCTOR) {
    const teams = await prisma.team.findMany({
      where: { doctorId: actor.id },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }

  if (actor.role === ROLES.TA) {
    const teams = await prisma.team.findMany({
      where: { taId: actor.id },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }

  return null;
}

export async function listDocumentsService(actor, query) {
  const visibleTeamIds = await resolveVisibleTeamIds(actor);

  if (visibleTeamIds === null) {
    throw new AppError(
      "Documents are available only for team leaders, team members, doctors, and TAs.",
      403,
      "DOCUMENTS_VIEW_FORBIDDEN",
    );
  }

  if (visibleTeamIds.length === 0) {
    return [];
  }

  let teamIdFilter = undefined;
  if (query.teamId) {
    if (!visibleTeamIds.includes(query.teamId)) {
      throw new AppError("You do not have access to this team's documents.", 403, "DOCUMENTS_VIEW_FORBIDDEN");
    }
    teamIdFilter = query.teamId;
  }

  return listDocumentsByTeamIds(visibleTeamIds, {
    search: normalizeText(query.search),
    category: normalizeText(query.category || "all"),
    teamId: teamIdFilter,
  });
}

export async function createDocumentService(actor, payload) {
  let team = null;

  if (actor.role === ROLES.LEADER) {
    team = await findTeamByLeaderId(actor.id);
  } else if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    team = membership?.team ?? null;
  }

  if (!team) {
    throw new AppError(
      "You must belong to a team to upload documents.",
      403,
      "DOCUMENT_CREATE_FORBIDDEN",
    );
  }

  return createDocument({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    fileName: payload.fileName,
    fileSize: payload.fileSize,
    fileType: payload.fileType,
    url: payload.url,
    tags: payload.tags ?? [],
    teamId: team.id,
    teamName: team.name,
    uploadedByName: buildFullName(actor) || "Team Member",
    uploadedByUserId: actor.id,
  });
}

async function assertLeaderCanDeleteDocument(actor, document) {
  if (actor.role !== ROLES.LEADER) {
    throw new AppError("Only the team leader can delete documents.", 403, "DOCUMENT_DELETE_FORBIDDEN");
  }

  const team = await findTeamByLeaderId(actor.id);
  if (!team || team.id !== document.teamId) {
    throw new AppError("You can only delete documents from your own team.", 403, "DOCUMENT_DELETE_FORBIDDEN");
  }
}

async function assertActorCanUpdateDocument(actor, document) {
  if (actor.role === ROLES.LEADER) {
    const team = await findTeamByLeaderId(actor.id);
    if (team && team.id === document.teamId) return;
  }

  if (document.uploadedByUserId === actor.id) return;

  throw new AppError(
    "You do not have permission to update this document.",
    403,
    "DOCUMENT_UPDATE_FORBIDDEN",
  );
}

export async function deleteDocumentService(actor, documentId) {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new AppError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
  }

  await assertLeaderCanDeleteDocument(actor, document);
  return deleteDocumentById(documentId);
}

export async function updateDocumentService(actor, documentId, payload) {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new AppError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
  }

  await assertActorCanUpdateDocument(actor, document);

  const updatePayload = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    tags: payload.tags ?? [],
  };

  if (payload.fileName) updatePayload.fileName = payload.fileName;
  if (payload.fileSize) updatePayload.fileSize = payload.fileSize;
  if (payload.fileType) updatePayload.fileType = payload.fileType;
  if (payload.url) updatePayload.url = payload.url;

  return updateDocumentById(documentId, updatePayload);
}
