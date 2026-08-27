import { notFound } from "next/navigation";
import { getScreenBySlug, medicines, notifications, orders, userProfile } from "@medicare/core";
import {
  AppShell,
  InputCard,
  MedicineList,
  NotificationList,
  OrderList,
  PrimaryButton,
  ProfileSummary,
  RouteChips,
  SectionHeading,
  TrackingCard
} from "../../../components/app-ui";

export default async function ShowcaseScreenPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = getScreenBySlug(slug);

  if (!screen) {
    notFound();
  }

  return (
    <AppShell activePath="/" title={screen.title} subtitle={screen.section}>
      <article className="hero-card">
        <p className="hero-eyebrow">Screen {screen.id}</p>
        <h2>{screen.title}</h2>
        <p>{screen.summary}</p>
      </article>

      {renderShowcaseBlock(slug)}

      <PrimaryButton href="/showcase" label={screen.cta} />
    </AppShell>
  );
}

function renderShowcaseBlock(slug: string) {
  if (slug.startsWith("onboarding")) {
    return (
      <>
        <SectionHeading title="Value proposition" />
        <article className="plain-card">
          <strong>Safe, smart, and fast healthcare delivery</strong>
          <p>Introduce AI symptom analysis, prescription OCR, and pharmacy optimization in a simple narrative flow.</p>
        </article>
      </>
    );
  }

  if (["login", "sign-up", "otp-verify", "forgot-password", "edit-profile", "add-address"].includes(slug)) {
    return (
      <>
        <InputCard label="Primary field" placeholder="Example input" />
        <InputCard label="Secondary field" placeholder="Another detail" />
      </>
    );
  }

  if (["home-dashboard", "browse-medicines", "category-view", "medicine-detail", "compare"].includes(slug)) {
    return (
      <>
        <RouteChips />
        <MedicineList items={medicines.slice(0, 3)} />
      </>
    );
  }

  if (["notifications", "help-support", "about-terms", "rate-review"].includes(slug)) {
    return <NotificationList />;
  }

  if (["quick-reorder", "order-history", "order-detail", "order-success", "order-confirm", "cart", "payment"].includes(slug)) {
    return <OrderList />;
  }

  if (["symptom-input", "ai-analysing", "ai-results", "ai-recommendations", "dosage-detail", "rx-verified"].includes(slug)) {
    return (
      <>
        <SectionHeading title="AI flow context" action="94%" />
        <MedicineList items={medicines.slice(0, 2)} />
      </>
    );
  }

  if (["live-tracking", "delivery-address", "return-request"].includes(slug)) {
    return <TrackingCard />;
  }

  if (["health-profile", "user-profile", "app-settings", "rx-vault", "upload-rx"].includes(slug)) {
    return (
      <>
        <ProfileSummary />
        <article className="plain-card">
          <strong>Context-aware profile system</strong>
          <p>
            {userProfile.chronicConditions.join(", ")} with {orders.length} recent orders and {notifications.length} active alerts.
          </p>
        </article>
      </>
    );
  }

  return (
    <article className="plain-card">
      <strong>Development placeholder</strong>
      <p>This screen is registered and ready for deeper implementation using the shared product data and design system.</p>
    </article>
  );
}
