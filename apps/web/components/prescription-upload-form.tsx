"use client";

import { uploadPrescription } from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PrescriptionUploadForm() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("Dr. Mehta");
  const [notes, setNotes] = useState("Please review dosage and allergy compatibility.");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof uploadPrescription>> | null>(null);

  async function toBase64(file: File) {
    const buffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const nextResult = await uploadPrescription({
      doctorName,
      notes,
      ...(selectedFile
        ? {
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileContentBase64: await toBase64(selectedFile)
          }
        : {})
    });
    setResult(nextResult);
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="stack-list" onSubmit={handleSubmit}>
      <label className="input-wrap">
        <span>Doctor name</span>
        <input onChange={(event) => setDoctorName(event.target.value)} value={doctorName} />
      </label>
      <label className="input-wrap">
        <span>Patient notes</span>
        <textarea onChange={(event) => setNotes(event.target.value)} rows={4} value={notes} />
      </label>
      <label className="input-wrap">
        <span>Prescription file</span>
        <input
          accept=".pdf,image/png,image/jpeg"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>
      <button className="primary-button button-reset" disabled={loading} type="submit">
        {loading ? "Verifying..." : "Verify Prescription"}
      </button>
      {result ? (
        <article className="plain-card success">
          <strong>
            {result.extractedFields.id} | {result.status}
          </strong>
          <p>Confidence: {result.confidence}</p>
          <p>{result.extractedFields.medicines.join(", ")}</p>
          {result.extractedFields.sourceFileName ? <p>File: {result.extractedFields.sourceFileName}</p> : null}
        </article>
      ) : null}
    </form>
  );
}
