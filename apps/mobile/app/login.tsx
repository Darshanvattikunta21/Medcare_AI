import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../lib/use-auth";

const C = {
  navy: "#0F172A", cyan: "#06B6D4", cyanDark: "#0891B2", cyanLight: "#CFFAFE",
  violet: "#8B5CF6", white: "#FFFFFF", sky: "#F0F9FF",
  slate100: "#F1F5F9", slate200: "#E2E8F0",
  slate400: "#94A3B8", slate500: "#64748B", slate700: "#334155", slate900: "#0F172A",
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("ravi@email.com");
  const [password, setPassword] = useState("demo123");
  const [validationError, setValidationError] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [focused, setFocused] = useState<string | null>(null);

  function validateInputs() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setValidationError("Please enter a valid email address."); return false; }
    if (password.length < 6) { setValidationError("Password must be at least 6 characters long."); return false; }
    setValidationError("");
    return true;
  }

  async function handleLogin() {
    if (!validateInputs()) return;
    try { await login(email, password); } catch (err) {}
  }

  const activeError = validationError || authError;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroPanel}>
        <View style={styles.heroGlow} />
        <View style={styles.heroGlow2} />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>? MediCare AI</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome Back</Text>
        <Text style={styles.heroSub}>Your health companion awaits</Text>
        <View style={styles.pillRow}>
          {["?? AI Diagnosis", "?? Smart Orders", "?? Prescriptions"].map((p) => (
            <View key={p} style={styles.pill}><Text style={styles.pillText}>{p}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign in</Text>
        <Text style={styles.cardSub}>Enter your credentials to continue</Text>

        {/* Demo Account Switcher */}
        <View style={{ flexDirection: "row", gap: 8, marginVertical: 10 }}>
          <Pressable
            onPress={() => { setEmail("ravi@email.com"); setPassword("demo123"); }}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              backgroundColor: email === "ravi@email.com" ? C.cyanDark : C.slate100,
              alignItems: "center"
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: email === "ravi@email.com" ? C.white : C.slate700 }}>
              👤 Patient
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { setEmail("pharma@email.com"); setPassword("demo123"); }}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              backgroundColor: email === "pharma@email.com" ? C.cyanDark : C.slate100,
              alignItems: "center"
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: email === "pharma@email.com" ? C.white : C.slate700 }}>
              🏥 Pharma Owner
            </Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>✉️  Email address</Text>
          <TextInput
            autoCapitalize="none" keyboardType="email-address"
            onChangeText={(txt) => { setEmail(txt); setValidationError(""); }}
            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
            placeholder="your@email.com" placeholderTextColor={C.slate400}
            style={[styles.field, focused === "email" && styles.fieldFocused]}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>??  Password</Text>
          <View style={[styles.passwordContainer, focused === "password" && styles.fieldFocused]}>
            <TextInput
              onChangeText={(txt) => { setPassword(txt); setValidationError(""); }}
              onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
              placeholder="Enter password" placeholderTextColor={C.slate400}
              style={styles.passwordField} secureTextEntry={secureText} value={password}
            />
            <Pressable onPress={() => setSecureText(!secureText)} style={styles.toggleButton}>
              <Text style={styles.toggleText}>{secureText ? "Show" : "Hide"}</Text>
            </Pressable>
          </View>
        </View>

        {activeError ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>?? {activeError}</Text></View>
        ) : null}

        <Pressable disabled={loading} onPress={handleLogin} style={styles.submitButton}>
          {loading ? <ActivityIndicator color={C.navy} /> : <Text style={styles.submitText}>Sign In ?</Text>}
        </Pressable>

        <View style={styles.linksRow}>
          <Pressable onPress={() => router.push("/auth/forgot-password")}>
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/signup")}>
            <Text style={styles.linkBold}>Create Account</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footerText}>By signing in, you agree to our Terms & Privacy Policy</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: C.sky, flexGrow: 1, paddingBottom: 32 },
  heroPanel: { backgroundColor: C.navy, paddingTop: 60, paddingBottom: 48, paddingHorizontal: 24, gap: 10, position: "relative", overflow: "hidden" },
  heroGlow: { position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(6,182,212,0.18)" },
  heroGlow2: { position: "absolute", left: -60, bottom: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(139,92,246,0.12)" },
  heroBadge: { alignSelf: "flex-start", backgroundColor: "rgba(6,182,212,0.2)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(6,182,212,0.4)" },
  heroBadgeText: { color: C.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  heroTitle: { color: C.white, fontSize: 32, fontWeight: "900", letterSpacing: -0.8, marginTop: 8 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 15 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  pill: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  pillText: { color: C.white, fontSize: 11, fontWeight: "600" },
  card: { backgroundColor: C.white, borderRadius: 28, marginHorizontal: 16, marginTop: -24, padding: 24, gap: 14, shadowColor: "rgba(6,182,212,0.2)", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 8 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: C.slate900, letterSpacing: -0.3 },
  cardSub: { fontSize: 13, color: C.slate500, marginTop: -8 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: C.slate700 },
  field: { borderWidth: 1.5, borderColor: C.slate200, borderRadius: 14, backgroundColor: C.sky, padding: 14, color: C.slate900, fontSize: 14 },
  fieldFocused: { borderColor: C.cyan, backgroundColor: "#F0FDFF" },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: C.slate200, borderRadius: 14, backgroundColor: C.sky },
  passwordField: { flex: 1, padding: 14, color: C.slate900, fontSize: 14 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 14 },
  toggleText: { color: C.cyanDark, fontWeight: "800", fontSize: 13 },
  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },
  submitButton: { backgroundColor: C.cyan, borderRadius: 16, padding: 16, alignItems: "center", marginTop: 4 },
  submitText: { color: C.navy, fontWeight: "900", fontSize: 15, letterSpacing: 0.3 },
  linksRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  link: { color: C.slate500, fontWeight: "600", fontSize: 13 },
  linkBold: { color: C.cyanDark, fontWeight: "800", fontSize: 13 },
  footerText: { textAlign: "center", color: C.slate400, fontSize: 11, marginTop: 20, paddingHorizontal: 24 },
});
