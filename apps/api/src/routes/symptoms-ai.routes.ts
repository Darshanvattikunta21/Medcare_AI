/**
 * symptoms-ai.routes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enhanced Medical AI Symptom Analyzer — Express route layer.
 *
 * Routes:
 *  POST /api/symptoms/v2/analyze   — authenticated, rate-limited, full analysis
 *  GET  /api/symptoms/v2/schema    — public, returns the expected request schema
 *
 * Security:
 *  • Authentication enforced via requireAuth middleware — returns 401 if no
 *    valid Bearer token is attached.
 *  • All validation errors (bad payloads) are caught and converted to 400.
 *  • No unhandled 500s — asyncHandler catches and delegates to Express error
 *    middleware which returns a safe JSON error response.
 */

import { Router, Request, Response, NextFunction } from "express";
import { unauthorized } from "../lib/errors";
import { runSymptomAnalysis } from "../services/symptom-ai.service";

export const symptomsAiRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wraps async route handlers so thrown errors reach the global error handler. */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Middleware: require an authenticated user.
 * attachCurrentUser (in auth middleware) already decoded the Bearer token and
 * set req.currentUserId.  If it is absent the request is unauthenticated.
 */
function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUserId) {
    return next(
      unauthorized(
        "Authentication required. Please include a valid Bearer token in the Authorization header."
      )
    );
  }
  next();
}

// ─── POST /api/symptoms/v2/analyze ───────────────────────────────────────────

symptomsAiRouter.post(
  "/analyze",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const startedAt = Date.now();

    const result = runSymptomAnalysis(
      {
        symptoms:           req.body?.symptoms,
        duration:           req.body?.duration,
        severity:           req.body?.severity,
        notes:              req.body?.notes,
        ageGroup:           req.body?.age_group,
        knownConditions:    req.body?.known_conditions,
        currentMedications: req.body?.current_medications,
        allergies:          req.body?.allergies
      },
      req.currentUserId
    );

    // Attach processing time header for transparency
    res.setHeader("X-Analysis-Duration-Ms", String(Date.now() - startedAt));

    // 200 OK — analysis succeeded (may still contain warnings)
    res.status(200).json(result);
  })
);

// ─── GET /api/symptoms/v2/schema — public schema endpoint ────────────────────

symptomsAiRouter.get("/schema", (_req: Request, res: Response) => {
  res.status(200).json({
    endpoint: "POST /api/symptoms/v2/analyze",
    authentication: "Bearer token required in Authorization header",
    request: {
      symptoms: {
        type: "string[]",
        required: true,
        minItems: 1,
        maxItems: 20,
        example: ["fever", "headache", "body ache"]
      },
      duration: {
        type: "string",
        required: false,
        example: "3 days"
      },
      severity: {
        type: "integer",
        required: false,
        minimum: 1,
        maximum: 10,
        description: "Self-rated severity (1 = minimal, 10 = worst possible)",
        example: 6
      },
      notes: {
        type: "string",
        required: false,
        maxLength: 1000,
        example: "Symptoms started suddenly after getting wet in the rain."
      },
      age_group: {
        type: "string",
        required: false,
        enum: ["child", "adult", "elderly"],
        default: "adult"
      },
      known_conditions: {
        type: "string[]",
        required: false,
        example: ["diabetes", "hypertension"]
      },
      current_medications: {
        type: "string[]",
        required: false,
        example: ["Metformin 500mg", "Amlodipine 5mg"]
      },
      allergies: {
        type: "string[]",
        required: false,
        example: ["Penicillin", "Ibuprofen"]
      }
    },
    response: {
      status: "success",
      request_id: "string — unique ID for this analysis",
      analyzed_at: "ISO 8601 timestamp",
      data: {
        input_summary: "Echoed and validated inputs",
        possible_conditions: [
          {
            name: "Condition name",
            icd10Code: "ICD-10 code",
            description: "Clinical description",
            matchedSymptoms: "Symptoms that triggered this match",
            confidence: "0–100%",
            severity_score: "1–10",
            severity_label: "Minimal | Mild | Moderate | High | Critical",
            recommended_medications: "Array of OTC / Rx / home remedy options",
            home_care: "Self-care instructions",
            doctor_warning: "Non-null when severity ≥ 7",
            seek_emergency: "true when severity reaches emergency threshold"
          }
        ],
        overall_severity_score: "Highest severity score across conditions",
        triage_level: "Self-Care | Pharmacy | GP Visit | Urgent Care | Emergency",
        safety_alerts: "Drug interaction / allergy / duplication warnings",
        follow_up_recommended: "boolean",
        emergency_services_required: "boolean",
        disclaimer: "Legal disclaimer text"
      }
    },
    errors: {
      "400 Bad Request": "Missing or invalid input fields",
      "401 Unauthorized": "Missing or invalid Bearer token",
      "429 Too Many Requests": "Rate limit exceeded (90 requests/minute per IP)",
      "500 Internal Server Error": "Unexpected server fault (safe JSON response returned)"
    }
  });
});
