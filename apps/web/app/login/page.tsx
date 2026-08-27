import { AppShell } from "../../components/app-ui";
import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <AppShell activePath="/login" title="Welcome Back" subtitle="Sign in to your account">
      <LoginForm />
    </AppShell>
  );
}
