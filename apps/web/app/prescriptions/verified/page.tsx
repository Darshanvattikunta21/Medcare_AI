import { AppShell } from "../../../components/app-ui";
import { PrescriptionVaultClient } from "../../../components/prescription-vault-client";

export default function PrescriptionVerifiedPage() {
  return (
    <AppShell activePath="/prescriptions/upload" title="Prescription Review Queue" subtitle="Admin and pharmacist review workflow">
      <PrescriptionVaultClient adminMode />
    </AppShell>
  );
}
