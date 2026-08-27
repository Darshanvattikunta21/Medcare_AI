import { MobileScreen, ProfileBlocks, SectionTitle, Card, AnimPressable } from "../components/mobile-ui";
import { useAuth } from "../lib/use-auth";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAdminOrPharmacist = user?.role === "pharmacist" || user?.role === "admin";

  return (
    <MobileScreen activePath="/profile" title="Health Profile" subtitle="Personal info, conditions, and medications">
      {isAdminOrPharmacist && (
        <Card soft>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0f6e56", marginBottom: 4 }}>
            Pharma Owner Panel
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Manage stock availability and delivery charges for your pharmacy.
          </Text>
          <AnimPressable
            scaleTo={0.96}
            onPress={() => router.push("/admin")}
            style={{
              backgroundColor: "#1d9e75",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: "center"
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Open Owner Dashboard</Text>
          </AnimPressable>
        </Card>
      )}
      <ProfileBlocks />
      <SectionTitle title="App settings" action="Biometric on" />

      <View style={{ marginTop: 24, marginBottom: 40 }}>
        <AnimPressable
          scaleTo={0.96}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={{
            backgroundColor: "#fee2e2",
            borderWidth: 1,
            borderColor: "#fca5a5",
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 14,
            alignItems: "center"
          }}
        >
          <Text style={{ color: "#dc2626", fontWeight: "bold", fontSize: 15 }}>
            🚪  Log Out
          </Text>
        </AnimPressable>
      </View>
    </MobileScreen>
  );
}

