import { AppShell } from "../../../components/app-ui";
import { ForgotPasswordForm } from "../../../components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AppShell activePath="/login" title="Reset Password" subtitle="Recover access to your account">
      <ForgotPasswordForm />
    </AppShell>
  );
}
