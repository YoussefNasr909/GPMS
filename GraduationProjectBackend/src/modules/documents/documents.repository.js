import { prisma } from "../../loaders/dbLoader.js";

const docSelect = {
  id: true,
  teamId: true,
  title: true,
  description: true,
  category: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  url: true,
  tags: true,
  uploadedByUserId: true,
  uploadedByName: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
};

function toDocumentResponse(doc) {
  return {
    id: doc.id,
    teamId: doc.teamId,
    teamName: doc.team?.name ?? "",
    title: doc.title,
    description: doc.description,
    category: doc.category.toLowerCase(),
    fileName: doc.fileName,
    fileSize: doc.fileSize ?? 0,
    fileType: doc.fileType,
    url: doc.url,
    tags: doc.tags,
    uploadedByUserId: doc.uploadedByUserId,
    uploadedByName: doc.uploadedByName,
    uploadedAt: doc.createdAt.toISOString().slice(0, 10),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listDocumentsByTeamIds(teamIds, filters = {}) {
  const { search = "", category = "all", teamId } = filters;

  const teamFilter = teamId
    ? { teamId }
    : { teamId: { in: teamIds } };

  const where = {
    ...teamFilter,
    ...(category && category !== "all"
      ? { category: category.toUpperCase() }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { fileName: { contains: search, mode: "insensitive" } },
            { tags: { hasSome: [search] } },
          ],
        }
      : {}),
  };

  const docs = await prisma.teamDocument.findMany({
    where,
    select: docSelect,
    orderBy: { createdAt: "desc" },
  });

  return docs.map(toDocumentResponse);
}

export async function createDocument(data) {
  const doc = await prisma.teamDocument.create({
    data: {
      teamId: data.teamId,
      title: data.title,
      description: data.description,
      category: data.category.toUpperCase(),
      fileName: data.fileName,
      fileSize: data.fileSize ?? null,
      fileType: data.fileType,
      url: data.url,
      tags: data.tags ?? [],
      uploadedByUserId: data.uploadedByUserId,
      uploadedByName: data.uploadedByName,
    },
    select: docSelect,
  });
  return toDocumentResponse(doc);
}

export async function findDocumentById(id) {
  const doc = await prisma.teamDocument.findUnique({ where: { id }, select: docSelect });
  return doc ? toDocumentResponse(doc) : null;
}

export async function deleteDocumentById(id) {
  const doc = await prisma.teamDocument.delete({ where: { id }, select: docSelect });
  return toDocumentResponse(doc);
}

export async function updateDocumentById(id, data) {
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category.toUpperCase();
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.fileName !== undefined) updateData.fileName = data.fileName;
  if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
  if (data.fileType !== undefined) updateData.fileType = data.fileType;
  if (data.url !== undefined) updateData.url = data.url;

  const doc = await prisma.teamDocument.update({ where: { id }, data: updateData, select: docSelect });
  return toDocumentResponse(doc);
}
