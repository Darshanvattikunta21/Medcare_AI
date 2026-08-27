import React, { useState } from "react";
import { useAuth } from "../../lib/use-auth";
import { MobileScreen, Card } from "../../components/mobile-ui";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Switch,
  Alert
} from "react-native";

export default function SettingsScreen() {
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          // layout route guard will auto-route to /login
        }
      }
    ]);
  };

  return (
    <MobileScreen activePath="/profile" title="App Settings" subtitle="Configure notifications, display, and account options">
      <Card>
        <Text style={styles.sectionHeader}>Preferences</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Receive reminders to take pill dosages and order status alerts.</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#e5e7eb", true: "#1d9e75" }}
            thumbColor={notifications ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Display Mode</Text>
            <Text style={styles.settingDesc}>Enable soft low-contrast theme for nighttime usage.</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#e5e7eb", true: "#1d9e75" }}
            thumbColor={darkMode ? "#ffffff" : "#f4f3f4"}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionHeader}>Legal & About</Text>

        <Pressable onPress={() => Alert.alert("Privacy Policy", "Your medical data is secured end-to-end under strict compliance rules.")} style={styles.menuRow}>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.arrow}>❯</Text>
        </Pressable>

        <Pressable onPress={() => Alert.alert("Terms & Conditions", "Use of diagnostic AI features should be verified with a primary care physician.")} style={styles.menuRow}>
          <Text style={styles.menuText}>Terms & Conditions</Text>
          <Text style={styles.arrow}>❯</Text>
        </Pressable>

        <View style={styles.menuRow}>
          <Text style={styles.menuText}>App Version</Text>
          <Text style={styles.versionText}>v0.1.0 (Alpha)</Text>
        </View>
      </Card>

      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutBtnText}>Sign Out Account</Text>
      </Pressable>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 6
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fafafa"
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827"
  },
  settingDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fafafa"
  },
  menuText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827"
  },
  arrow: {
    color: "#9ca3af",
    fontSize: 12
  },
  versionText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600"
  },
  logoutBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    alignItems: "center"
  },
  logoutBtnText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 14
  }
});
