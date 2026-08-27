"use client";

import {
  fetchPrescriptionReviewQueue,
  fetchPrescriptions,
  getErrorMessage,
  getPrescriptionFileUrl,
  updatePrescriptionStatus,
  type PrescriptionData
} from "@medicare/api-client";
import { useEffect, useMemo, useState } from "react";

type Scope = "mine" | "review";

export function PrescriptionVaultClient({ adminMode = false }: { adminMode?: boolean }) {
  const [scope, setScope] = useState<Scope>(adminMode ? "review" : "mine");
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ocrFilter, setOcrFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextScope = scope) {
    setLoading(true);
    setMessage("");

    try {
      const items = nextScope === "review" ? await fetchPrescriptionReviewQueue() : await fetchPrescriptions();
      setPrescriptions(items);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load prescriptions"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(scope);
  }, [scope]);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return prescriptions.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
      const matchesOcr = ocrFilter === "all" || (item.ocrStatus ?? "pending").toLowerCase() === ocrFilter;
      const haystack = [item.id, item.doctorName, item.patientName, item.medicines.join(" "), item.notes ?? ""]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !lowered || haystack.includes(lowered);
      return matchesStatus && matchesOcr && matchesQuery;
    });
  }, [ocrFilter, prescriptions, query, statusFilter]);

  async function review(prescriptionId: string, status: string) {
    try {
      const updated = await updatePrescriptionStatus(prescriptionId, { status });
      setPrescriptions((current) => current.map((item) => (item.id === prescriptionId ? updated : item)));
      setMessage(`Prescription ${prescriptionId} updated to ${status}.`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to update prescription"));
    }
  }

  return (
    <>
      {adminMode ? (
        <div className="chip-row">
          {[
            { label: "My vault", value: "mine" },
            { label: "Review queue", value: "review" }
          ].map((item) => (
            <button
              className={scope === item.value ? "chip active-chip button-reset" : "chip button-reset"}
              key={item.value}
              onClick={() => setScope(item.value as Scope)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="chip-row">
        {["all", "verified", "pending_review", "needs_review", "rejected"].map((item) => (
          <button
            className={statusFilter === item ? "chip active-chip button-reset" : "chip button-reset"}
            key={item}
            onClick={() => setStatusFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {["all", "completed", "low_confidence", "failed", "pending"].map((item) => (
          <button
            className={ocrFilter === item ? "chip active-chip button-reset" : "chip button-reset"}
            key={item}
            onClick={() => setOcrFilter(item)}
            type="button"
          >
            OCR {item}
          </button>
        ))}
      </div>
      <label className="input-wrap">
        <span>Search vault</span>
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Search by doctor, patient, medicine, or ID" value={query} />
      </label>
      {loading ? <article className="plain-card">Loading prescriptions...</article> : null}
      <div className="stack-list">
        {filtered.map((item) => (
          <article className="plain-card" key={item.id}>
            <strong>
              {item.id} | {item.status}
            </strong>
            <p>
              {item.patientName} | {item.doctorName}
            </p>
            <p>{item.medicines.join(" | ")}</p>
            <p>
              OCR: {item.ocrStatus ?? "pending"} | Confidence: {item.confidence}
            </p>
            {item.dosageSummary?.length ? <p>{item.dosageSummary.join(" | ")}</p> : null}
            {item.validationIssues?.length ? <p>{item.validationIssues.join(" | ")}</p> : null}
            <div className="chip-row">
              {item.sourceFileName ? (
                <a className="outline-button" href={getPrescriptionFileUrl(item.id)} rel="noreferrer" target="_blank">
                  Open File
                </a>
              ) : null}
              {adminMode ? (
                <>
                  <button className="chip button-reset" onClick={() => review(item.id, "verified")} type="button">
                    Verify
                  </button>
                  <button className="chip button-reset" onClick={() => review(item.id, "pending_review")} type="button">
                    Review
                  </button>
                  <button className="chip button-reset" onClick={() => review(item.id, "rejected")} type="button">
                    Reject
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {message ? <p className="status-copy">{message}</p> : null}
    </>
  );
}
