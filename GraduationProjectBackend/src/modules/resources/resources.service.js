import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import { prisma } from "../../loaders/dbLoader.js";
import { findTeamMemberByUserId } from "../teams/teams.repository.js";
import {
  createResource,
  deleteResourceById,
  findResourceById,
  listResources,
  updateResourceById,
} from "./resources.repository.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

async function resolveVisibleCreatorIds(actor) {
  if (actor.role === ROLES.ADMIN) {
    return null;
  }

  if (actor.role === ROLES.DOCTOR || actor.role === ROLES.TA) {
    return [actor.id];
  }

  if (actor.role === ROLES.LEADER) {
    const team = await prisma.team.findUnique({
      where: { leaderId: actor.id },
      select: { doctorId: true, taId: true },
    });
    return [team?.doctorId, team?.taId].filter(Boolean);
  }

  if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    const team = membership?.team;
    if (!team) return [];
    return [team.doctor?.id, team.ta?.id].filter(Boolean);
  }

  return [];
}

export async function listResourcesService(actor, query) {
  const visibleCreatorIds = await resolveVisibleCreatorIds(actor);

  return listResources(visibleCreatorIds, {
    search: normalizeText(query.search),
    category: normalizeText(query.category || "all"),
  });
}

export async function createResourceService(actor, payload) {
  if (actor.role !== ROLES.DOCTOR && actor.role !== ROLES.TA) {
    throw new AppError("Only doctors and TAs can create resources.", 403, "RESOURCES_CREATE_FORBIDDEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!user) {
    throw new AppError("User account was not found.", 404, "USER_NOT_FOUND");
  }

  return createResource({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    type: payload.type,
    url: payload.url,
    tags: payload.tags ?? [],
    authorName: buildFullName(user) || (actor.role === ROLES.TA ? "TA" : "Doctor"),
    createdByUserId: user.id,
  });
}

function assertSupervisorCanMutateResource(actor, resource) {
  if (actor.role !== ROLES.DOCTOR && actor.role !== ROLES.TA) {
    throw new AppError("Only doctors and TAs can edit or delete resources.", 403, "RESOURCES_MUTATE_FORBIDDEN");
  }

  if (resource.createdByUserId !== actor.id) {
    throw new AppError("You can only manage resources you created.", 403, "RESOURCE_OWNER_REQUIRED");
  }
}

export async function updateResourceService(actor, resourceId, payload) {
  const resource = await findResourceById(resourceId);
  if (!resource) {
    throw new AppError("Resource not found.", 404, "RESOURCE_NOT_FOUND");
  }

  assertSupervisorCanMutateResource(actor, resource);

  return updateResourceById(resourceId, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    type: payload.type,
    url: payload.url,
    tags: payload.tags ?? [],
  });
}

export async function deleteResourceService(actor, resourceId) {
  const resource = await findResourceById(resourceId);
  if (!resource) {
    throw new AppError("Resource not found.", 404, "RESOURCE_NOT_FOUND");
  }

  assertSupervisorCanMutateResource(actor, resource);

  return deleteResourceById(resourceId);
}
