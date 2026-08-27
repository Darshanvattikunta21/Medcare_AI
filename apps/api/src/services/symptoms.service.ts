import { analyzeSymptomInput, validateSymptomAnalysisSummary } from "../lib/symptom-analyzer";
import { env } from "../config/env";
import { readDb, writeDb } from "../lib/file-db";
import { asOptionalStringArray, asPositiveInteger, asTrimmedString } from "../lib/validation";
import { analyzeSymptomsDb, listSymptomAssessmentsDb } from "./database.service";
import { buildSafetyChecks } from "./medication-safety.service";
import { addUserNotification, getCurrentUser } from "./data.service";

export function analyzeSymptoms(
  payload: {
    symptoms?: string[];
    duration?: string;
    severity?: number;
    notes?: string;
  },
  userId?: string
) {
  const startedAt = Date.now();
  if (env.useDatabase) {
    return analyzeSymptomsDb(payload, userId);
  }

  const symptoms = asOptionalStringArray(payload.symptoms, "symptoms") ?? [];
  const notes = asTrimmedString(payload.notes, "notes");
  const duration = asTrimmedString(payload.duration, "duration") || "2-3 days";
  const severity = Math.min(10, asPositiveInteger(payload.severity, "severity", { defaultValue: 5, min: 1 }));
  const db = readDb();
  const user = getCurrentUser(userId, db);

  console.info("[symptoms] analyze request", {
    requestId: `sym-${startedAt}`,
    userId,
    payload: { symptoms, duration, severity, notesLength: notes.length }
  });

  // Call the local analyzer directly
  const analysis = analyzeSymptomInput(
    {
      symptoms,
      duration,
      severity,
      notes
    },
    {
      medications: user.medications,
      allergies: user.allergies
    }
  );

  const safetyChecks = buildSafetyChecks({
    recommendedMedicines: analysis.recommendedMedicines,
    currentMedications: user.medications,
    allergies: user.allergies,
    conditions: user.conditions
  });
  validateSymptomAnalysisSummary(analysis.analysis);

  console.info("[symptoms] analyzer output", {
    requestId: `sym-${startedAt}`,
    condition: analysis.result.condition,
    confidence: analysis.analysis.confidence,
    detectedSymptoms: analysis.analysis.detectedSymptoms,
    possibleConditions: analysis.analysis.possibleConditions,
    medicines: analysis.analysis.medicines
  });

  db.symptomAssessments.unshift({
    id: `sa-${db.symptomAssessments.length + 1}`,
    userId: user.id,
    symptoms: analysis.input.symptoms ?? [],
    duration: analysis.input.duration ?? "2-3 days",
    severity: analysis.input.severity ?? 5,
    notes: analysis.input.notes ?? "",
    condition: analysis.result.condition,
    confidence: analysis.result.confidence,
    createdAt: new Date().toISOString()
  });

  writeDb(db);
  addUserNotification(user.id, "AI symptom assessment ready", `${analysis.result.condition} guidance has been generated.`, "ai");

  const responsePayload = {
    ok: true,
    input: analysis.input,
    analysis: analysis.analysis,
    result: {
      ...analysis.result,
      safetyChecks
    },
    recommendedMedicines: analysis.recommendedMedicines
  };

  console.info("[symptoms] analyze response", {
    requestId: `sym-${startedAt}`,
    userId,
    durationMs: Date.now() - startedAt,
    response: {
      condition: analysis.result.condition,
      confidence: analysis.analysis.confidence,
      symptoms: analysis.analysis.symptoms,
      medicines: analysis.analysis.medicines,
      consultDoctor: analysis.analysis.consultDoctor
    }
  });

  return responsePayload;
}

export function listSymptomAssessments(userId?: string) {
  if (env.useDatabase) {
    return listSymptomAssessmentsDb(userId);
  }

  const db = readDb();
  const user = getCurrentUser(userId, db);
  return db.symptomAssessments.filter((item) => item.userId === user.id);
}
