import { getScreenBySlug, medicines, notifications, orders, userProfile } from "@medicare/core";
import { useLocalSearchParams } from "expo-router";
import {
  Card,
  MedicineCards,
  MobileScreen,
  NotificationCards,
  OrderCards,
  ProfileBlocks,
  SectionTitle
} from "../../components/mobile-ui";
import { Text } from "react-native";

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const screen = slug ? getScreenBySlug(slug) : undefined;

  if (!screen) {
    return (
      <MobileScreen activePath="/" title="Screen not found" subtitle="Unknown preview route">
        <Card>
          <Text style={{ color: "#111827", fontWeight: "700" }}>This screen slug does not exist.</Text>
        </Card>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen activePath="/" title={screen.title} subtitle={screen.section}>
      <Card>
        <Text style={{ color: "#1d9e75", fontWeight: "700" }}>Screen {screen.id}</Text>
        <Text style={{ color: "#111827", fontSize: 22, fontWeight: "800" }}>{screen.title}</Text>
        <Text style={{ color: "#6b7280", lineHeight: 22 }}>{screen.summary}</Text>
      </Card>
      {renderPreviewBody(slug)}
      <Card>
        <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "700", backgroundColor: "#1d9e75", borderRadius: 14, padding: 14 }}>
          {screen.cta}
        </Text>
      </Card>
    </MobileScreen>
  );
}

function renderPreviewBody(slug: string) {
  if (slug.startsWith("onboarding")) {
    return (
      <Card>
        <Text style={{ color: "#111827", fontWeight: "700" }}>Value proposition</Text>
        <Text style={{ color: "#6b7280", lineHeight: 22 }}>
          Introduces AI symptom analysis, prescription OCR, and smart medicine delivery as the main product story.
        </Text>
      </Card>
    );
  }

  if (["login", "sign-up", "otp-verify", "forgot-password", "edit-profile", "add-address"].includes(slug)) {
    return (
      <Card>
        <Text style={{ color: "#111827", fontWeight: "700" }}>Form-driven screen</Text>
        <Text style={{ color: "#6b7280", lineHeight: 22 }}>
          This screen is set up as part of the authentication or profile editing flow.
        </Text>
      </Card>
    );
  }

  if (["home-dashboard", "browse-medicines", "category-view", "medicine-detail", "compare"].includes(slug)) {
    return <MedicineCards items={medicines.slice(0, 3)} />;
  }

  if (["notifications", "help-support", "about-terms", "rate-review"].includes(slug)) {
    return <NotificationCards />;
  }

  if (["quick-reorder", "order-history", "order-detail", "order-success", "order-confirm", "cart", "payment"].includes(slug)) {
    return <OrderCards />;
  }

  if (["health-profile", "user-profile", "app-settings", "rx-vault", "upload-rx"].includes(slug)) {
    return <ProfileBlocks />;
  }

  return (
    <Card>
      <SectionTitle title="Shared app context" action="Ready" />
      <Text style={{ color: "#6b7280", lineHeight: 22 }}>
        {userProfile.name} has {orders.length} recent orders, {notifications.length} alerts, and {medicines.length} seeded medicines available in the development data model.
      </Text>
    </Card>
  );
}
