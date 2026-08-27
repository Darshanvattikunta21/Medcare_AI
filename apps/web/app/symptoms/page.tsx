import { AppShell, SectionHeading } from "../../components/app-ui";
import { SymptomChecker } from "../../components/symptom-checker";

export default function SymptomsPage() {
  return (
    <AppShell
      activePath="/symptoms"
      title="AI Symptom Analyzer"
      subtitle="Multi-condition analysis · Severity scoring · Doctor warnings"
    >
      <SectionHeading title="Medical AI v2" action="Powered by symptom-ai.service" />
      <SymptomChecker />
    </AppShell>
  );
}
