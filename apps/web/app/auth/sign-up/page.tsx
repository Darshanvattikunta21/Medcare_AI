import { AppShell, SectionHeading } from "../../../components/app-ui";
import { SignUpForm } from "../../../components/sign-up-form";

export default function SignUpPage() {
  return (
    <AppShell activePath="/login" title="Create Account" subtitle="Join MediCare AI — free forever">
      <SectionHeading title="New account" action="Takes 30 seconds" />
      <SignUpForm />
    </AppShell>
  );
}
