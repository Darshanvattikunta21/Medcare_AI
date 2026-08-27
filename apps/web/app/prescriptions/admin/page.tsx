import { AppShell } from "../../../components/app-ui";
import { PrescriptionVaultClient } from "../../../components/prescription-vault-client";

export default function PrescriptionAdminPage() {
  return (
    <AppShell activePath="/prescriptions/upload" title="Prescription Admin" subtitle="Review queue, verification actions, and OCR exceptions">
      <PrescriptionVaultClient adminMode />
    </AppShell>
  );
}
