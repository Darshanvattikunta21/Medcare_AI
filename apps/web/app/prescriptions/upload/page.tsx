import { fetchPrescriptions } from "@medicare/api-client";
import { AppShell, SectionHeading } from "../../../components/app-ui";
import { PrescriptionUploadForm } from "../../../components/prescription-upload-form";

export default async function UploadPrescriptionPage() {
  const prescriptions = await fetchPrescriptions();

  return (
    <AppShell activePath="/prescriptions/upload" title="Upload Prescription" subtitle="OCR verification for JPG, PNG, or PDF">
      <article className="upload-card">
        <div className="upload-icon">Rx</div>
        <strong>Prescription verification workflow</strong>
        <p>Upload a PDF or image with doctor details and notes to store a verified prescription in the patient vault.</p>
      </article>
      <PrescriptionUploadForm />
      <SectionHeading title="Prescription vault" action={`${prescriptions.length} saved`} />
      <div className="stack-list">
        {prescriptions.map((item) => (
          <article className="plain-card" key={item.id}>
            <strong>
              {item.id} | {item.status}
            </strong>
            <p>{item.doctorName}</p>
            <p>{item.medicines.join(", ")}</p>
            {item.sourceFileName ? <p>{item.sourceFileName}</p> : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
