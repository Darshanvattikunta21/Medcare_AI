"use client";

import {
  fetchProfile,
  getAuthToken,
  getErrorMessage,
  ProfileData
} from "@medicare/api-client";
import { symptomChips, symptomDurations } from "@medicare/core";
import { useEffect, useState } from "react";

// ─── V2 Response Types (mirrors symptom-ai.service.ts) ───────────────────────

type MedicationRecommendation = {
  name: string;
  category: "OTC" | "Prescription" | "Home Remedy";
  dosage: string;
  duration: string;
  activeIngredient: string;
  notes: string;
  contraindicatedFor?: string[];
};

type ConditionResult = {
  name: string;
  icd10Code: string;
  description: string;
  matchedSymptoms: string[];
  confidence: number;
  severity_score: number;
  severity_label: string;
  recommended_medications: MedicationRecommendation[];
  home_care: string[];
  doctor_warning: string | null;
  seek_emergency: boolean;
};

type SafetyAlert = {
  type: "allergy" | "interaction" | "duplicate" | "condition" | "general";
  severity: "high" | "medium" | "low" | "info";
  message: string;
  medicineId?: string;
};

type V2Response = {
  status: "success";
  request_id: string;
  analyzed_at: string;
  data: {
    input_summary: {
      symptoms: string[];
      duration: string;
      user_severity: number;
      age_group: string;
      notes: string;
    };
    possible_conditions: ConditionResult[];
    overall_severity_score: number;
    triage_level: string;
    safety_alerts: SafetyAlert[];
    follow_up_recommended: boolean;
    emergency_services_required: boolean;
    disclaimer: string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  Minimal:  "#10b981",
  Mild:     "#84cc16",
  Moderate: "#f59e0b",
  High:     "#ef4444",
  Critical: "#7f1d1d"
};

const TRIAGE_BG: Record<string, string> = {
  "Self-Care":   "#d1fae5",
  "Pharmacy":    "#dbeafe",
  "GP Visit":    "#fef9c3",
  "Urgent Care": "#fee2e2",
  "Emergency":   "#7f1d1d"
};

const TRIAGE_COLOR: Record<string, string> = {
  "Self-Care":   "#065f46",
  "Pharmacy":    "#1e40af",
  "GP Visit":    "#713f12",
  "Urgent Care": "#991b1b",
  "Emergency":   "#ffffff"
};

const ALERT_COLORS: Record<SafetyAlert["severity"], { bg: string; color: string; icon: string }> = {
  high:   { bg: "#fee2e2", color: "#991b1b", icon: "🚨" },
  medium: { bg: "#fef9c3", color: "#713f12", icon: "⚠️" },
  low:    { bg: "#dbeafe", color: "#1e40af", icon: "ℹ️" },
  info:   { bg: "#f0fdf4", color: "#065f46", icon: "✅" }
};

const MED_BADGE: Record<string, { bg: string; color: string }> = {
  OTC:           { bg: "#d1fae5", color: "#065f46" },
  Prescription:  { bg: "#fee2e2", color: "#991b1b" },
  "Home Remedy": { bg: "#fef9c3", color: "#713f12" }
};

async function callV2Analyze(payload: object): Promise<V2Response> {
  const token = getAuthToken();
  const res = await fetch("/api/symptoms/v2/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json?.error ??
        (res.status === 401
          ? "Please log in to use the AI symptom checker."
          : `Analysis failed (${res.status})`)
    );
  }
  return json as V2Response;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TriageBadge({ level }: { level: string }) {
  const bg    = TRIAGE_BG[level]    ?? "#f3f4f6";
  const color = TRIAGE_COLOR[level] ?? "#111827";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 999,
        background: bg,
        color,
        fontWeight: 700,
        fontSize: "0.85rem"
      }}
    >
      {level === "Emergency" ? "🚨" : level === "Urgent Care" ? "⚠️" : "✅"} Triage: {level}
    </span>
  );
}

function SeverityBar({ score, label }: { score: number; label: string }) {
  const color = SEVERITY_COLOR[label] ?? "#6b7280";
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
        <span style={{ color: "rgba(255,255,255,0.8)" }}>Severity</span>
        <span style={{ fontWeight: 700, color }}>{label} ({score}/10)</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.18)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score * 10}%`,
            borderRadius: 999,
            background: color,
            transition: "width 0.6s ease"
          }}
        />
      </div>
    </div>
  );
}

function ConditionCard({
  condition,
  index
}: {
  condition: ConditionResult;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div
      style={{
        borderRadius: 16,
        border: condition.seek_emergency ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          textAlign: "left",
          display: "grid",
          gap: 8
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {condition.seek_emergency && (
                <span style={{ fontSize: "1.1rem" }}>🚨</span>
              )}
              <strong style={{ color: "#ffffff", fontSize: "1rem" }}>
                {condition.name}
              </strong>
            </div>
            <span
              style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", display: "block", marginTop: 2 }}
            >
              ICD-10: {condition.icd10Code}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: SEVERITY_COLOR[condition.severity_label] ?? "#6b7280",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700
              }}
            >
              {condition.severity_label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
              {condition.confidence}% match
            </span>
          </div>
        </div>
        <SeverityBar score={condition.severity_score} label={condition.severity_label} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", display: "grid", gap: 14 }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.88rem", lineHeight: 1.55 }}>
            {condition.description}
          </p>

          {/* Matched symptoms */}
          {condition.matchedSymptoms.length > 0 && (
            <div>
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                Matched symptoms
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {condition.matchedSymptoms.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.14)",
                      color: "#d1fae5",
                      fontSize: "0.78rem"
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Doctor warning */}
          {condition.doctor_warning && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: condition.seek_emergency
                  ? "rgba(127,29,29,0.7)"
                  : "rgba(239,68,68,0.18)",
                border: "1px solid rgba(239,68,68,0.4)",
                fontSize: "0.85rem",
                lineHeight: 1.55,
                color: "#fff"
              }}
            >
              {condition.doctor_warning}
            </div>
          )}

          {/* Medications */}
          <div>
            <span
              style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, display: "block", marginBottom: 8 }}
            >
              Recommended medications ({condition.recommended_medications.length})
            </span>
            <div style={{ display: "grid", gap: 10 }}>
              {condition.recommended_medications.map((med) => {
                const badge = MED_BADGE[med.category] ?? { bg: "#f3f4f6", color: "#111827" };
                return (
                  <div
                    key={med.name}
                    style={{
                      background: "#ffffff",
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "grid",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                      <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{med.name}</strong>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: badge.bg,
                          color: badge.color,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {med.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Active: {med.activeIngredient}
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>Dosage</span>
                        <span style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600 }}>{med.dosage}</span>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>Duration</span>
                        <span style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600 }}>{med.duration}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                      💡 {med.notes}
                    </p>
                    {med.contraindicatedFor && med.contraindicatedFor.length > 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#dc2626", margin: 0 }}>
                        ⛔ Avoid if: {med.contraindicatedFor.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Home care */}
          <div>
            <span
              style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, display: "block", marginBottom: 8 }}
            >
              🏠 Home care
            </span>
            <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
              {condition.home_care.map((item, i) => (
                <li key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AGE_GROUPS = [
  { id: "child",   label: "👶 Child" },
  { id: "adult",   label: "🧑 Adult" },
  { id: "elderly", label: "👴 Elderly" }
];

const defaultSymptoms: string[] = [];

export function SymptomChecker() {
  const [notes, setNotes]                     = useState("");
  const [duration, setDuration]               = useState("1 day");
  const [severity, setSeverity]               = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(defaultSymptoms);
  const [ageGroup, setAgeGroup]               = useState<"child" | "adult" | "elderly">("adult");
  const [knownConditions, setKnownConditions] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [result, setResult]                   = useState<V2Response | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [profile, setProfile]                 = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((cur) =>
      cur.includes(symptom) ? cur.filter((s) => s !== symptom) : [...cur, symptom]
    );
  }

  async function handleAnalyze() {
    if (selectedSymptoms.length === 0 && !notes.trim()) {
      setError("Please select at least one symptom or describe your symptoms.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setProgressMessage("Preparing symptom details…");

    try {
      setProgressMessage("Sending to Medical AI Analyzer…");
      const response = await callV2Analyze({
        symptoms:            selectedSymptoms,
        duration,
        severity,
        notes,
        age_group:           ageGroup,
        known_conditions:    knownConditions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        current_medications: profile?.medications ?? [],
        allergies:           profile?.allergies   ?? []
      });
      setProgressMessage("Processing safety checks…");
      setResult(response);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to analyze symptoms right now. Please try again."));
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setSelectedSymptoms([]);
    setNotes("");
    setSeverity(5);
    setAgeGroup("adult");
    setKnownConditions("");
  }

  const d = result?.data;

  return (
    <>
      {/* ── Input Form ─────────────────────────────────────────────────────── */}
      {!result && (
        <>
          {/* Age group */}
          <div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Age group
            </span>
            <div className="chip-row">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  className={ageGroup === ag.id ? "chip active-chip button-reset" : "chip button-reset"}
                  onClick={() => setAgeGroup(ag.id as typeof ageGroup)}
                >
                  {ag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptom textarea */}
          <label className="input-wrap">
            <span>Describe your symptoms in detail</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your symptoms specifically — e.g. burning sensation when urinating, painful joints, itchy rash on arms, shortness of breath when walking…"
            />
          </label>

          {/* Symptom chips */}
          <div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Quick symptom picker
            </span>
            <div className="chip-row">
              {symptomChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className={
                    selectedSymptoms.includes(chip.label)
                      ? "chip active-chip button-reset"
                      : "chip button-reset"
                  }
                  onClick={() => toggleSymptom(chip.label)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Duration
            </span>
            <div className="chip-row">
              {symptomDurations.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === duration ? "chip active-chip button-reset" : "chip button-reset"}
                  onClick={() => setDuration(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Severity slider */}
          <label className="input-wrap">
            <span>
              Self-rated severity:&nbsp;
              <strong style={{ color: severity >= 7 ? "#ef4444" : severity >= 5 ? "#f59e0b" : "#10b981" }}>
                {severity}/10
              </strong>
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              style={{ accentColor: severity >= 7 ? "#ef4444" : severity >= 5 ? "#f59e0b" : "#10b981" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280" }}>
              <span>Minimal (1)</span><span>Critical (10)</span>
            </div>
          </label>

          {/* Known conditions */}
          <label className="input-wrap">
            <span>Known conditions (optional, comma-separated)</span>
            <input
              type="text"
              placeholder="e.g. diabetes, hypertension, asthma"
              value={knownConditions}
              onChange={(e) => setKnownConditions(e.target.value)}
            />
          </label>

          {/* Profile context */}
          {profile && (
            <article className="plain-card" style={{ fontSize: "0.85rem" }}>
              <strong>Using your health profile</strong>
              <p>Medications: {profile.medications?.join(", ") || "None"}</p>
              <p>Allergies: {profile.allergies?.join(", ") || "None"}</p>
            </article>
          )}

          {error && <div className="error-card">{error}</div>}

          {/* Analyze button */}
          <button
            id="symptom-analyze-btn"
            className="primary-button button-reset"
            type="button"
            disabled={loading || (selectedSymptoms.length === 0 && !notes.trim())}
            onClick={handleAnalyze}
            style={{ width: "100%", fontSize: "1rem" }}
          >
            {loading ? "🔄 Analysing…" : "🩺 Analyse Symptoms (AI v2)"}
          </button>

          {loading && (
            <div className="status-pill" style={{ textAlign: "center" }}>
              {progressMessage ?? "Please wait…"}
            </div>
          )}
        </>
      )}

      {/* ── Results Panel ──────────────────────────────────────────────────── */}
      {result && d && (
        <article
          className="result-card"
          style={{ padding: 0, overflow: "hidden", borderRadius: 18 }}
        >
          {/* Result header */}
          <div style={{ padding: "18px 18px 14px" }}>
            <p className="hero-eyebrow" style={{ color: "#a7f3d0" }}>
              🤖 Medical AI — v2 Analysis
            </p>

            {/* Emergency banner */}
            {d.emergency_services_required && (
              <div
                style={{
                  marginTop: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#7f1d1d",
                  border: "2px solid #ef4444",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  lineHeight: 1.5
                }}
              >
                🚨 EMERGENCY SERVICES REQUIRED — Call 112 / 102 immediately.
              </div>
            )}

            {/* Summary row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
              <TriageBadge level={d.triage_level} />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)"
                }}
              >
                Overall severity: {d.overall_severity_score}/10
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)"
                }}
              >
                {d.possible_conditions.length} condition{d.possible_conditions.length !== 1 ? "s" : ""} identified
              </span>
            </div>

            {/* Input echo */}
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 16px"
              }}
            >
              <span>⏱ {d.input_summary.duration}</span>
              <span>📊 Self-rated: {d.input_summary.user_severity}/10</span>
              <span>👤 {d.input_summary.age_group}</span>
              <span>
                🔍 {d.input_summary.symptoms.slice(0, 4).join(", ")}
                {d.input_summary.symptoms.length > 4 ? ` +${d.input_summary.symptoms.length - 4}` : ""}
              </span>
            </div>
          </div>

          {/* Conditions */}
          <div style={{ padding: "0 14px", display: "grid", gap: 10 }}>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Possible conditions (tap to expand)
            </p>
            {d.possible_conditions.map((condition, i) => (
              <ConditionCard key={condition.name} condition={condition} index={i} />
            ))}
          </div>

          {/* Safety Alerts */}
          {d.safety_alerts.length > 0 && (
            <div style={{ padding: "14px 14px 0" }}>
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8
                }}
              >
                Safety alerts ({d.safety_alerts.length})
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {d.safety_alerts.map((alert, i) => {
                  const style = ALERT_COLORS[alert.severity];
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: style.bg,
                        color: style.color,
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                        display: "flex",
                        gap: 8,
                        alignItems: "start"
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{style.icon}</span>
                      <span>
                        <strong style={{ textTransform: "capitalize" }}>{alert.type.replace(/_/g, " ")}: </strong>
                        {alert.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Follow-up recommendation */}
          <div style={{ padding: "14px" }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: d.follow_up_recommended
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(16,185,129,0.12)",
                border: `1px solid ${d.follow_up_recommended ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                color: "#fff",
                fontSize: "0.85rem",
                lineHeight: 1.5
              }}
            >
              {d.follow_up_recommended
                ? "📋 Follow-up with a healthcare provider is recommended for your symptom profile."
                : "✅ Self-care may be sufficient. Monitor and seek care if symptoms worsen."}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: "0 14px 14px" }}>
            <p
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.15)"
              }}
            >
              ⚖️ {d.disclaimer}
            </p>
          </div>

          {/* Request metadata */}
          <div
            style={{
              padding: "10px 14px 14px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.35)",
              borderTop: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <span>ID: {result.request_id}</span>
            <span>{new Date(result.analyzed_at).toLocaleTimeString()}</span>
          </div>

          {/* Reset */}
          <div style={{ padding: "0 14px 18px" }}>
            <button
              id="symptom-new-analysis-btn"
              className="outline-button button-reset"
              type="button"
              onClick={handleReset}
              style={{ width: "100%", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              ↩ New Analysis
            </button>
          </div>
        </article>
      )}
    </>
  );
}
