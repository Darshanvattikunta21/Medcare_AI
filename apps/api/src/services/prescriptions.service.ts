import { env } from "../config/env";
import { prisma } from "../lib/db";
import { badRequest, notFound } from "../lib/errors";
import { readDb, writeDb } from "../lib/file-db";
import { asOptionalStringArray, asTrimmedString } from "../lib/validation";
import type { PrescriptionRecord } from "../types";
import {
  addUserNotification as addUserNotificationDb,
  getCurrentUser as getCurrentUserDb,
  getPrescriptionDb,
  listAllPrescriptionsDb,
  listPrescriptionsDb
} from "./database.service";
import { extractPrescriptionData } from "./ocr.service";
import { persistPrescriptionFile } from "./prescription-storage.service";
import { addUserNotification, createPrescription, getCurrentUser } from "./data.service";

export function analyzePrescription(
  payload: {
    doctorName?: string;
    patientName?: string;
    notes?: string;
    medicines?: string[];
    fileName?: string;
    fileType?: string;
    fileContentBase64?: string;
  },
  userId?: string
) {
  if (env.useDatabase) {
    return analyzePrescriptionDb(payload, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  
  const savedFile = persistPrescriptionFile(payload);
  const providedMedicines = asOptionalStringArray(payload.medicines, "medicines") ?? undefined;
  const extracted = extractPrescriptionData({
    ...payload,
    fileContentBase64: payload.fileContentBase64
  });
  const notes = asTrimmedString(payload.notes, "notes") || undefined;
  const doctorName = extracted.doctorName || "Dr. Mehta";
  const patientName = extracted.patientName === "Patient" ? user.name : extracted.patientName;
  const status = extracted.ocrStatus === "completed" ? "verified" : extracted.ocrStatus === "failed" ? "needs_review" : "pending_review";

  const prescription: PrescriptionRecord = {
    id: `rx-${db.prescriptions.length + 1}`,
    userId: user.id,
    doctorName,
    patientName,
    status,
    ocrStatus: extracted.ocrStatus,
    ocrProvider: extracted.ocrProvider,
    medicines: providedMedicines?.length ? providedMedicines : extracted.medicines,
    dosageSummary: extracted.dosageSummary,
    notes: notes ?? "",
    confidence: extracted.confidence,
    sourceFileName: savedFile?.fileName ?? undefined,
    sourceMimeType: savedFile?.fileType ?? undefined,
    sourcePath: savedFile?.absolutePath ?? undefined,
    extractedText: extracted.extractedText ?? undefined,
    validationIssues: extracted.validationIssues,
    createdAt: new Date().toISOString()
  };

  db.prescriptions.unshift(prescription);
  writeDb(db);
  addUserNotification(user.id, "Prescription verified", `${prescription.id} has been added to your vault.`, "rx");

  return {
    ok: true,
    status: prescription.status,
    confidence: prescription.confidence,
    extractedFields: prescription
  };
}

export function listPrescriptions(userId?: string) {
  if (env.useDatabase) {
    return listPrescriptionsDb(userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return db.prescriptions.filter((item) => item.userId === user.id);
}

export async function listPrescriptionReviewQueue(userId?: string) {
  if (!env.useDatabase) {
    const db = readDb();
    return [...db.prescriptions]
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .map((item) => ({
        ...item,
        ocrStatus: item.status === "verified" ? "completed" : "pending",
        validationIssues: [],
        dosageSummary: []
      }));
  }

  const user = await getCurrentUserDb(userId);
  if (!user) {
    throw badRequest("User not found");
  }

  return listAllPrescriptionsDb();
}

export function getPrescription(id: string, userId?: string) {
  if (env.useDatabase) {
    return getPrescriptionDb(id, userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return db.prescriptions.find((item) => item.id === id && item.userId === user.id) ?? null;
}

export async function updatePrescriptionStatus(
  id: string,
  payload: { status?: string; notes?: string },
  userId?: string
) {
  if (!env.useDatabase) {
    const db = readDb();
    const user = getCurrentUser(userId, db);
    const prescription = db.prescriptions.find((item) => item.id === id && item.userId === user.id);

    if (!prescription) {
      throw notFound("Prescription not found");
    }

    prescription.status = asTrimmedString(payload.status, "status") || prescription.status;
    prescription.notes = asTrimmedString(payload.notes, "notes") || prescription.notes;
    writeDb(db);
    return prescription;
  }

  const user = await getCurrentUserDb(userId);
  if (!user) {
    throw badRequest("User not found");
  }

  const existing = await prisma.prescription.findFirst({
    where: { id, userId: user.id }
  });

  if (!existing) {
    throw notFound("Prescription not found");
  }

  const updated: any = await prisma.prescription.update({
    where: { id: existing.id },
    data: {
      status: asTrimmedString(payload.status, "status") || existing.status,
      notes: asTrimmedString(payload.notes, "notes") || existing.notes
    } as any
  });

  return {
    id: updated.id,
    doctorName: updated.doctorName,
    patientName: updated.patientName,
    status: updated.status,
    ocrStatus: updated.ocrStatus,
    ocrProvider: updated.ocrProvider ?? undefined,
    medicines: updated.medicines,
    dosageSummary: updated.dosageSummary,
    notes: updated.notes ?? undefined,
    confidence: updated.confidence,
    createdAt: updated.createdAt.toISOString(),
    sourceFileName: updated.sourceFileName ?? undefined,
    sourceMimeType: updated.sourceMimeType ?? undefined,
    sourcePath: updated.sourcePath ?? undefined,
    extractedText: updated.extractedText ?? undefined,
    validationIssues: updated.validationIssues
  };
}

async function analyzePrescriptionDb(
  payload: {
    doctorName?: string;
    patientName?: string;
    notes?: string;
    medicines?: string[];
    fileName?: string;
    fileType?: string;
    fileContentBase64?: string;
  },
  userId?: string
) {
  const user = await getCurrentUserDb(userId);
  if (!user) {
    throw badRequest("User not found");
  }

  const savedFile = persistPrescriptionFile(payload);
  const providedMedicines = asOptionalStringArray(payload.medicines, "medicines") ?? undefined;
  const extracted = extractPrescriptionData({
    ...payload,
    fileContentBase64: payload.fileContentBase64
  });
  const notes = asTrimmedString(payload.notes, "notes") || undefined;
  const doctorName = extracted.doctorName || "Dr. Mehta";
  const patientName = extracted.patientName === "Patient" ? user.name : extracted.patientName;
  const status = extracted.ocrStatus === "completed" ? "verified" : extracted.ocrStatus === "failed" ? "needs_review" : "pending_review";

  const prescription: any = await prisma.prescription.create({
    data: {
      userId: user.id,
      doctorName,
      patientName,
      status,
      ocrStatus: extracted.ocrStatus,
      ocrProvider: extracted.ocrProvider,
      medicines: providedMedicines?.length ? providedMedicines : extracted.medicines,
      dosageSummary: extracted.dosageSummary,
      notes,
      confidence: extracted.confidence,
      sourceFileName: savedFile?.fileName ?? null,
      sourceMimeType: savedFile?.fileType ?? null,
      sourcePath: savedFile?.absolutePath ?? null,
      extractedText: extracted.extractedText,
      validationIssues: extracted.validationIssues
    } as any
  });

  await addUserNotificationDb(
    user.id,
    status === "verified" ? "Prescription verified" : "Prescription needs review",
    `${prescription.id} has been added to your vault with OCR status ${prescription.ocrStatus}.`,
    "rx"
  );

  return {
    ok: true,
    status: prescription.status,
    confidence: prescription.confidence,
    extractedFields: {
      id: prescription.id,
      doctorName: prescription.doctorName,
      patientName: prescription.patientName,
      status: prescription.status,
      ocrStatus: prescription.ocrStatus,
      ocrProvider: prescription.ocrProvider ?? undefined,
      medicines: prescription.medicines,
      dosageSummary: prescription.dosageSummary,
      notes: prescription.notes ?? undefined,
      confidence: prescription.confidence,
      createdAt: prescription.createdAt.toISOString(),
      sourceFileName: prescription.sourceFileName ?? undefined,
      sourceMimeType: prescription.sourceMimeType ?? undefined,
      sourcePath: prescription.sourcePath ?? undefined,
      extractedText: prescription.extractedText ?? undefined,
      validationIssues: prescription.validationIssues
    }
  };
}
