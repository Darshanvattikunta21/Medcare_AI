import { Link } from "expo-router";
import {
  CategoryCards, Hero, MedicineCards, MobileScreen,
  NotificationCards, OrderCards, SectionTitle
} from "../components/mobile-ui";
import { ApiDiagnosticTerminal } from "../components/api-diagnostic-terminal";
import { useAppSnapshot } from "../lib/use-app-snapshot";
import { useAuth } from "../lib/use-auth";
import { Pressable, Text, View, StyleSheet } from "react-native";

const C = {
  navy: "#0F172A", cyan: "#06B6D4", cyanDark: "#0891B2", cyanLight: "#CFFAFE",
  cyanGlow: "rgba(6,182,212,0.15)", violet: "#8B5CF6",
  white: "#FFFFFF", sky: "#F0F9FF",
  slate100: "#F1F5F9", slate200: "#E2E8F0", slate400: "#94A3B8",
  slate500: "#64748B", slate700: "#334155", slate900: "#0F172A",
};

const highlightColors = [
  { bg: "rgba(6,182,212,0.08)", border: C.cyanDark, text: C.cyanDark },
  { bg: "rgba(139,92,246,0.08)", border: "#7C3AED", text: "#7C3AED" },
  { bg: "rgba(245,158,11,0.08)", border: "#B45309", text: "#B45309" },
  { bg: "rgba(16,185,129,0.08)", border: "#059669", text: "#059669" },
];

const quickLinks = [
  { href: "/dashboard/notifications", label: "🔔 Alerts", icon: "🔔" },
  { href: "/ai/results", label: "📊 AI Results", icon: "📊" },
  { href: "/orders/tracking", label: "🚚 Tracking", icon: "🚚" },
  { href: "/prescriptions-upload", label: "📷 Scan Rx", icon: "📷" },
];

export default function HomeScreen() {
  const { snapshot } = useAppSnapshot();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Ravi";

  return (
    <MobileScreen activePath="/" title={`Good Morning, ${firstName} 👋`} subtitle="How are you feeling today?">
      <Hero
        title="Describe symptoms and get guidance"
        description="AI-powered analysis from symptom check to smart medicine recommendations."
        cta="Try AI Check ⚕"
      />

      {/* Stats highlights */}
      <View style={styles.statsGrid}>
        {snapshot.highlights.map((item, idx) => {
          const col = highlightColors[idx % highlightColors.length];
          return (
            <View key={item.label} style={[styles.statCard, { backgroundColor: col.bg, borderColor: col.border }]}>
              <Text style={[styles.statValue, { color: col.text }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Quick link chips */}
      <View style={styles.quickLinksRow}>
        {quickLinks.map((item) => (
          <Link asChild href={item.href as never} key={item.href}>
            <Pressable style={styles.quickLinkChip}>
              <Text style={styles.quickLinkText}>{item.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <SectionTitle title="Categories" action="See all" />
      <CategoryCards />

      <SectionTitle title="Recommended for you" action="Top picks" />
      <MedicineCards />

      <SectionTitle title="Notifications" action="Recent" />
      <NotificationCards />

      <SectionTitle title="Active orders" action="Track" />
      <OrderCards />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 4 },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { fontSize: 12, color: C.slate500 },
  quickLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickLinkChip: {
    backgroundColor: C.navy, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(6,182,212,0.3)",
  },
  quickLinkText: { color: C.cyan, fontWeight: "700", fontSize: 12 },
});
