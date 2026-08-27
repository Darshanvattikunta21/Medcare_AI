import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { badRequest } from "../lib/errors";

type UploadedPrescriptionFile = {
  fileName: string;
  fileType: string;
  fileContentBase64: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function ensureUploadDirectory() {
  if (!fs.existsSync(env.prescriptionUploadDir)) {
    fs.mkdirSync(env.prescriptionUploadDir, { recursive: true });
  }
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function extensionFromMimeType(fileType: string) {
  if (fileType.includes("pdf")) return ".pdf";
  if (fileType.includes("png")) return ".png";
  if (fileType.includes("jpeg") || fileType.includes("jpg")) return ".jpg";
  return "";
}

export function persistPrescriptionFile(file?: Partial<UploadedPrescriptionFile>) {
  const fileName = typeof file?.fileName === "string" ? file.fileName.trim() : "";
  const fileType = typeof file?.fileType === "string" ? file.fileType.trim() : "";
  const fileContentBase64 = typeof file?.fileContentBase64 === "string" ? file.fileContentBase64.trim() : "";

  if (!fileName || !fileType || !fileContentBase64) {
    return null;
  }

  if (!/^application\/pdf|image\/png|image\/jpeg$/i.test(fileType)) {
    throw badRequest("Prescription file must be a PDF, PNG, or JPEG");
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileContentBase64, "base64");
  } catch {
    throw badRequest("Prescription file content is not valid base64");
  }

  if (buffer.length === 0) {
    throw badRequest("Prescription file content is empty");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw badRequest("Prescription file must be smaller than 8 MB");
  }

  ensureUploadDirectory();

  const safeName = sanitizeFileName(path.parse(fileName).name || "prescription");
  const finalName = `${Date.now()}-${safeName}${extensionFromMimeType(fileType) || path.extname(fileName)}`;
  const absolutePath = path.join(env.prescriptionUploadDir, finalName);
  fs.writeFileSync(absolutePath, buffer);

  return {
    fileName,
    fileType,
    absolutePath
  };
}
