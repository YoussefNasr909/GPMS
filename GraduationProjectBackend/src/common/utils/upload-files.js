import fs from "node:fs/promises";
import path from "node:path";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

async function removeFile(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Failed to remove upload file:", filePath, error);
    }
  }
}

export async function removeUploadedMulterFile(file) {
  if (!file?.path) return;
  await removeFile(file.path);
}

export function resolveLocalUploadPathFromUrl(url, folderName) {
  const normalizedUrl = String(url ?? "").trim();
  if (!normalizedUrl) return null;

  const marker = `/uploads/${folderName}/`;
  const markerIndex = normalizedUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const fileName = normalizedUrl.slice(markerIndex + marker.length).split(/[?#]/, 1)[0];
  if (!fileName || fileName.includes("..") || path.basename(fileName) !== fileName) {
    return null;
  }

  return path.resolve(uploadsRoot, folderName, fileName);
}

export async function removeLocalUploadByUrl(url, folderName) {
  const filePath = resolveLocalUploadPathFromUrl(url, folderName);
  await removeFile(filePath);
}
