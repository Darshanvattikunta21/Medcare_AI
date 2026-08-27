import { useRouter } from "expo-router";
import { useState } from "react";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { Pressable, Text, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../../lib/use-auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  function validateInput() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    setValidationError("");
    return true;
  }

  async function handleRequestOtp() {
    if (!validateInput()) return;

    try {
      await forgotPassword(email);
      setSuccessMessage("OTP sent successfully to your email.");
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      // Handled by AuthContext error
    }
  }

  const activeError = validationError || authError;

  return (
    <MobileScreen activePath="/auth/forgot-password" title="Forgot Password" subtitle="Request verification code">
      <Card>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(txt) => {
            setEmail(txt);
            setValidationError("");
            setSuccessMessage("");
          }}
          placeholder="your@email.com"
          style={styles.field}
          value={email}
        />

        <Pressable disabled={loading} onPress={handleRequestOtp} style={styles.submitButton}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Send OTP</Text>
          )}
        </Pressable>

        {activeError ? <Text style={styles.errorText}>{activeError}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable onPress={() => router.push("/login")} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Back to Sign In</Text>
        </Pressable>
      </Card>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    marginTop: 10
  },
  field: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    padding: 14,
    color: "#111827"
  },
  submitButton: {
    backgroundColor: "#1d9e75",
    borderRadius: 14,
    padding: 14,
    marginTop: 20
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center"
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600"
  },
  successText: {
    color: "#10b981",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600"
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center"
  },
  loginLinkText: {
    color: "#1d9e75",
    fontWeight: "700"
  }
});
