import { AppShell } from "../../../components/app-ui";
import { PrescriptionVaultClient } from "../../../components/prescription-vault-client";

export default function PrescriptionVaultPage() {
  return (
    <AppShell activePath="/prescriptions/upload" title="Prescription Vault" subtitle="Filter uploads, review OCR, and open stored files">
      <PrescriptionVaultClient />
    </AppShell>
  );
}
