import { getScreenBySlug } from "@medicare/core";
import { Card, MedicineCards, MobileScreen, NotificationCards, OrderCards, ProfileBlocks, SectionTitle } from "./mobile-ui";
import { Text } from "react-native";
import { useAppSnapshot } from "../lib/use-app-snapshot";

export function SimpleInfoScreen({ slug, activePath = "/" }: { slug: string; activePath?: string }) {
  const screen = getScreenBySlug(slug)!;
  const { snapshot } = useAppSnapshot();

  return (
    <MobileScreen activePath={activePath} title={screen.title} subtitle={screen.summary}>
      <Card>
        <Text style={{ fontWeight: "700", color: "#111827" }}>{screen.summary}</Text>
        <Text style={{ color: "#6b7280", lineHeight: 22 }}>
          Development data includes {snapshot.orders.length} orders, {snapshot.prescriptions.length} prescriptions, and {snapshot.medicines.length} medicines.
        </Text>
      </Card>
      <Card>
        <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "700", backgroundColor: "#1d9e75", borderRadius: 14, padding: 14 }}>
          {screen.cta}
        </Text>
      </Card>
    </MobileScreen>
  );
}

export function DashboardDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const { snapshot } = useAppSnapshot();

  return (
    <MobileScreen activePath="/" title={screen.title} subtitle={screen.summary}>
      {slug === "notifications" ? <NotificationCards /> : null}
      {slug === "search-active" ? <MedicineCards items={snapshot.medicines.slice(0, 3)} /> : null}
      {slug === "quick-reorder" ? <OrderCards /> : null}
      {slug === "health-profile" ? <ProfileBlocks /> : null}
    </MobileScreen>
  );
}

export function SymptomDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const { snapshot } = useAppSnapshot();

  return (
    <MobileScreen activePath="/symptoms" title={screen.title} subtitle={screen.summary}>
      {slug === "ai-results" ? (
        <Card>
          <Text style={{ color: "#1d9e75", fontWeight: "700" }}>AI Result</Text>
          <Text style={{ color: "#111827", fontSize: 24, fontWeight: "800" }}>{snapshot.aiResult.condition}</Text>
          <Text style={{ color: "#6b7280" }}>Confidence: {snapshot.aiResult.confidence}</Text>
        </Card>
      ) : null}
      {slug === "dosage-detail" ? (
        <Card>
          <SectionTitle title="Dosage guidance" />
          {snapshot.aiResult.dosage.map((item) => (
            <Text key={item.label} style={{ color: "#6b7280", lineHeight: 22 }}>
              {item.label}: {item.value}
            </Text>
          ))}
        </Card>
      ) : null}
      <MedicineCards items={snapshot.medicines.slice(0, 3)} />
    </MobileScreen>
  );
}

export function CatalogDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const { snapshot } = useAppSnapshot();

  return (
    <MobileScreen activePath="/catalog" title={screen.title} subtitle={screen.summary}>
      <MedicineCards items={snapshot.medicines.slice(0, 4)} />
    </MobileScreen>
  );
}

export function OrdersDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;

  return (
    <MobileScreen activePath="/orders" title={screen.title} subtitle={screen.summary}>
      <OrderCards />
    </MobileScreen>
  );
}

export function PrescriptionDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;
  const { snapshot } = useAppSnapshot();

  return (
    <MobileScreen activePath="/prescriptions/upload" title={screen.title} subtitle={screen.summary}>
      {snapshot.prescriptions.map((item) => (
        <Card key={item.id}>
          <Text style={{ color: "#111827", fontWeight: "700" }}>
            {item.id} • {item.status}
          </Text>
          <Text style={{ color: "#6b7280" }}>{item.doctorName}</Text>
          <Text style={{ color: "#6b7280" }}>{item.medicines.join(" • ")}</Text>
        </Card>
      ))}
    </MobileScreen>
  );
}

export function SettingsDetailScreen({ slug }: { slug: string }) {
  const screen = getScreenBySlug(slug)!;

  return (
    <MobileScreen activePath="/profile" title={screen.title} subtitle={screen.summary}>
      <ProfileBlocks />
    </MobileScreen>
  );
}

