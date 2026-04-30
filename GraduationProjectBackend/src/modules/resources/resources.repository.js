import { prisma } from "../../loaders/dbLoader.js";

const resourceSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  type: true,
  url: true,
  tags: true,
  authorName: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
};

function toResourceResponse(resource) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    category: resource.category.toLowerCase(),
    type: resource.type.toLowerCase(),
    url: resource.url,
    tags: resource.tags,
    authorName: resource.authorName,
    createdByUserId: resource.createdByUserId,
    uploadedAt: resource.createdAt.toISOString().slice(0, 10),
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export async function listResources(creatorIds, filters = {}) {
  const { search = "", category = "all" } = filters;

  const where = {
    ...(creatorIds !== null ? { createdByUserId: { in: creatorIds } } : {}),
    ...(category && category !== "all" ? { category: category.toUpperCase() } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { hasSome: [search] } },
          ],
        }
      : {}),
  };

  const resources = await prisma.teamResource.findMany({
    where,
    select: resourceSelect,
    orderBy: { createdAt: "desc" },
  });

  return resources.map(toResourceResponse);
}

export async function createResource(data) {
  const resource = await prisma.teamResource.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category.toUpperCase(),
      type: data.type.toUpperCase(),
      url: data.url,
      tags: data.tags ?? [],
      authorName: data.authorName,
      createdByUserId: data.createdByUserId,
    },
    select: resourceSelect,
  });
  return toResourceResponse(resource);
}

export async function findResourceById(id) {
  const resource = await prisma.teamResource.findUnique({ where: { id }, select: resourceSelect });
  return resource ? toResourceResponse(resource) : null;
}

export async function updateResourceById(id, data) {
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category.toUpperCase();
  if (data.type !== undefined) updateData.type = data.type.toUpperCase();
  if (data.url !== undefined) updateData.url = data.url;
  if (data.tags !== undefined) updateData.tags = data.tags;

  const resource = await prisma.teamResource.update({
    where: { id },
    data: updateData,
    select: resourceSelect,
  });
  return toResourceResponse(resource);
}

export async function deleteResourceById(id) {
  const resource = await prisma.teamResource.delete({ where: { id }, select: resourceSelect });
  return toResourceResponse(resource);
}
