import { fetchAppSnapshot, fetchCatalog, fetchOrders, fetchPrescriptions, fetchProfile, getPrescriptionFileUrl } from "@medicare/api-client";
import { getScreenBySlug } from "@medicare/core";
import {
  AIResultCard,
  AppShell,
  InputCard,
  MedicineList,
  NotificationList,
  OrderList,
  PrimaryButton,
  ProfileSummary,
  RouteChips,
  TrackingCard
} from "./app-ui";

export async function AuthFlowPage({
  slug,
  fields,
  actionLabel
}: {
  slug: string;
  fields: Array<{ label: string; placeholder: string; tall?: boolean }>;
  actionLabel: string;
}) {
  const screen = getScreenBySlug(slug)!;

  return (
    <AppShell activePath="/login" title={screen.title} subtitle={screen.summary}>
      <article className="auth-panel">
        {fields.map((field) => (
          <InputCard key={field.label} label={field.label} placeholder={field.placeholder} tall={field.tall} />
        ))}
        <PrimaryButton href="/" label={actionLabel} />
      </article>
    </AppShell>
  );
}

export async function InfoFlowPage({ slug, activePath = "/" }: { slug: string; activePath?: string }) {
  const screen = getScreenBySlug(slug)!;
  const snapshot = await fetchAppSnapshot();

  return (
    <AppShell activePath={activePath} title={screen.title} subtitle={screen.section}>
      <article className="plain-card">
        <strong>{screen.summary}</strong>
        <p>
          Development data includes {snapshot.orders.length} orders, {snapshot.prescriptions.length} prescriptions, and{" "}
          {snapshot.medicines.length} medicines.
        </p>
      </article>
      <RouteChips />
      <PrimaryButton href="/" label={screen.cta} />
    </AppShell>
  );
}

export async function CatalogFlowPage({ slug, medicineId }: { slug: string; medicineId?: string }) {
  const screen = getScreenBySlug(slug)!;
  const catalog = await fetchCatalog();
  const focused = medicineId ? catalog.find((item) => item.id === medicineId) : undefined;

  return (
    <AppShell activePath="/catalog" title={screen.title} subtitle={screen.summary}>
      {focused ? (
        <article className="plain-card">
          <strong>{focused.name}</strong>
          <p>{focused.description}</p>
          <p>
            {focused.brand} • {focused.price}
          </p>
        </article>
      ) : null}
      <MedicineList items={focused ? [focused] : catalog.slice(0, 4)} />
      <PrimaryButton href="/cart" label={screen.cta} />
    </AppShell>
  );
}

export async function OrdersFlowPage({ slug, orderId }: { slug: string; orderId?: string }) {
  const screen = getScreenBySlug(slug)!;
  const orderItems = await fetchOrders();
  const focused = orderId ? orderItems.find((item) => item.id === orderId) : undefined;

  return (
    <AppShell activePath="/orders" title={screen.title} subtitle={screen.summary}>
      {slug === "live-tracking" ? <TrackingCard order={focused} /> : null}
      {focused ? (
        <article className="plain-card">
          <strong>{focused.id}</strong>
          <p>
            {focused.status} • {focused.eta}
          </p>
          <p>{focused.items.join(" • ")}</p>
          <p>
            {focused.paymentStatus ? `Payment: ${focused.paymentStatus}` : "Payment status unavailable"}
            {focused.deliveryStage ? ` • Stage: ${focused.deliveryStage}` : ""}
          </p>
          {focused.trackingTimeline?.map((item) => (
            <p key={`${focused.id}-${item.stage}`}>
              {item.stage}: {item.description}
            </p>
          ))}
        </article>
      ) : null}
      <OrderList items={orderItems} />
      <PrimaryButton href="/orders" label={screen.cta} />
    </AppShell>
  );
}

export async function PrescriptionFlowPage({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const prescriptions = await fetchPrescriptions();

  return (
    <AppShell activePath="/prescriptions/upload" title={screen.title} subtitle={screen.summary}>
      {slug === "upload-rx" ? (
        <>
          <InputCard label="Doctor name" placeholder="Dr. Mehta" />
          <InputCard label="Patient notes" placeholder="Optional notes for the pharmacist" tall />
        </>
      ) : null}
      <div className="stack-list">
        {prescriptions.map((item) => (
          <article className="plain-card" key={item.id}>
            <strong>
              {item.id} • {item.status}
            </strong>
            <p>{item.doctorName}</p>
            <p>{item.medicines.join(" • ")}</p>
            <p>
              OCR: {item.ocrStatus ?? "pending"} • Confidence: {item.confidence}
            </p>
            {item.dosageSummary?.length ? <p>{item.dosageSummary.join(" | ")}</p> : null}
            {item.validationIssues?.length ? <p>{item.validationIssues.join(" | ")}</p> : null}
            {item.sourceFileName ? (
              <a href={getPrescriptionFileUrl(item.id)} rel="noreferrer" target="_blank">
                Open uploaded file
              </a>
            ) : null}
          </article>
        ))}
      </div>
      <PrimaryButton href="/catalog" label={screen.cta} />
    </AppShell>
  );
}

export async function ProfileFlowPage({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const profile = await fetchProfile();

  return (
    <AppShell activePath="/profile" title={screen.title} subtitle={screen.summary}>
      <ProfileSummary profile={profile} />
      <article className="plain-card">
        <strong>{profile.name}</strong>
        <p>{profile.email}</p>
        <p>{profile.conditions?.join(" • ")}</p>
      </article>
      <PrimaryButton href="/profile" label={screen.cta} />
    </AppShell>
  );
}

export async function SymptomFlowPage({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const snapshot = await fetchAppSnapshot();

  return (
    <AppShell activePath="/symptoms" title={screen.title} subtitle={screen.summary}>
      {slug === "ai-results" ? <AIResultCard /> : null}
      {slug === "ai-analysing" ? (
        <article className="plain-card">
          <strong>Analysing symptoms...</strong>
          <p>Matching disease patterns, generating safety guidance, and preparing dosage recommendations.</p>
        </article>
      ) : null}
      {slug === "dosage-detail" ? (
        <article className="plain-card">
          <strong>Dosage guidance</strong>
          {snapshot.aiResult.dosage.map((item) => (
            <p key={item.label}>
              {item.label}: {item.value}
            </p>
          ))}
        </article>
      ) : null}
      <MedicineList items={snapshot.medicines.slice(0, 3)} />
      <PrimaryButton href="/cart" label={screen.cta} />
    </AppShell>
  );
}

export async function DashboardFlowPage({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const snapshot = await fetchAppSnapshot();

  return (
    <AppShell activePath="/" title={screen.title} subtitle={screen.summary}>
      {slug === "notifications" ? <NotificationList items={snapshot.notifications} /> : null}
      {slug === "quick-reorder" ? <OrderList items={snapshot.orders} /> : null}
      {slug === "health-profile" ? <ProfileSummary profile={snapshot.profile} /> : null}
      {slug === "search-active" ? <MedicineList items={snapshot.medicines.slice(0, 3)} /> : null}
      <PrimaryButton href="/" label={screen.cta} />
    </AppShell>
  );
}
