import { AppShell } from "../../../components/app-ui";
import { EditProfileForm } from "../../../components/edit-profile-form";

export default function SettingsEditProfilePage() {
  return (
    <AppShell activePath="/profile" title="Edit Profile" subtitle="Update account and health information">
      <EditProfileForm />
    </AppShell>
  );
}
