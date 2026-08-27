import { medicines } from "@medicare/core";
import { asTrimmedString } from "../lib/validation";
import { inferMedicineSuggestionsFromText } from "./medication-safety.service";

type OcrPayload = {
  doctorName?: string;
  patientName?: string;
  notes?: string;
  medicines?: string[];
  fileName?: string;
  fileType?: string;
  fileContentBase64?: string;
};

function decodePlainTextContent(base64?: string) {
  if (!base64) {
    return "";
  }

  try {
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    return /[\x09\x0A\x0D\x20-\x7E]/.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function extractDoctorName(text: string, fallback?: string) {
  const explicit = asTrimmedString(fallback, "doctorName");
  if (explicit) return explicit;

  const match = text.match(/dr\.?\s+[a-z][a-z.\s]+/i);
  return match ? match[0].trim() : "Dr. Mehta";
}

function extractPatientName(text: string, fallback?: string) {
  const explicit = asTrimmedString(fallback, "patientName");
  if (explicit) return explicit;

  const match = text.match(/patient[:\s-]+([a-z][a-z\s]+)/i);
  return match?.[1]?.trim() || "Patient";
}

function extractDosageSummary(text: string, selectedMedicines: string[]) {
  const lines = text
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

  const dosageLines = lines.filter((line) =>
    /\b(\d+\s?mg|\d+\s?ml|once|twice|after meals|before meals|daily|night)\b/i.test(line)
  );

  if (dosageLines.length > 0) {
    return unique(dosageLines).slice(0, 6);
  }

  return selectedMedicines.map((name) => `${name}: verify dosage with pharmacist`);
}

export function extractPrescriptionData(payload: OcrPayload) {
  const fileText = decodePlainTextContent(payload.fileContentBase64);
  const fileHints = [payload.fileName, payload.notes, fileText].filter(Boolean).join("\n");
  const explicitMedicineNames = (payload.medicines ?? []).map((item) => item.trim()).filter(Boolean);
  const inferredMedicines = inferMedicineSuggestionsFromText(fileHints).map((item) => item.name);
  const selectedMedicines = unique(
    [...explicitMedicineNames, ...inferredMedicines].filter(Boolean)
  );
  const extractedText = [fileText, payload.notes, payload.fileName].filter(Boolean).join("\n").trim();
  const confidenceScore = Math.min(
    96,
    48 +
      selectedMedicines.length * 12 +
      (fileText ? 18 : 0) +
      (payload.fileContentBase64 ? 8 : 0) +
      (payload.doctorName ? 6 : 0) +
      (payload.patientName ? 6 : 0)
  );

  const validationIssues: string[] = [];
  if (!payload.fileContentBase64) {
    validationIssues.push("No source image or PDF was attached, so OCR relied on typed metadata only.");
  }
  if (!fileText) {
    validationIssues.push("The uploaded file could not be converted into readable text locally.");
  }
  if (selectedMedicines.length === 0) {
    validationIssues.push("No medicine names were confidently extracted from the prescription.");
  }

  const ocrStatus =
    selectedMedicines.length === 0 ? "failed" : confidenceScore < 70 || validationIssues.length > 1 ? "low_confidence" : "completed";

  return {
    ocrProvider: fileText ? "local-text-parser" : "local-heuristic-parser",
    ocrStatus,
    confidence: `${confidenceScore}%`,
    doctorName: extractDoctorName(fileHints, payload.doctorName),
    patientName: extractPatientName(fileHints, payload.patientName),
    medicines: selectedMedicines.length > 0 ? selectedMedicines : medicines.slice(0, 1).map((item) => item.name),
    dosageSummary: extractDosageSummary(fileHints, selectedMedicines),
    extractedText: extractedText || null,
    validationIssues
  };
}
