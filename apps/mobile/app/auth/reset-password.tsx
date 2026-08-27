import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { Pressable, Text, TextInput, StyleSheet, ActivityIndicator, View } from "react-native";
import { useAuth } from "../../lib/use-auth";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const { resetPassword, loading, error: authError } = useAuth();

  const [email, setEmail] = useState(paramEmail || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  function validateInputs() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    if (!otp.trim()) {
      setValidationError("Please enter the OTP verification code.");
      return false;
    }
    if (password.length < 8) {
      setValidationError("New Password must be at least 8 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return false;
    }
    setValidationError("");
    return true;
  }

  async function handleResetPassword() {
    if (!validateInputs()) return;

    try {
      await resetPassword(email, otp, password);
      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      // Handled by AuthContext error
    }
  }

  const activeError = validationError || authError;

  return (
    <MobileScreen activePath="/auth/reset-password" title="Reset Password" subtitle="Enter verification OTP and new credentials">
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

        <Text style={styles.label}>OTP Code *</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={(txt) => {
            setOtp(txt);
            setValidationError("");
            setSuccessMessage("");
          }}
          placeholder="Enter 6-digit OTP"
          style={styles.field}
          value={otp}
        />

        <Text style={styles.label}>New Password *</Text>
        <TextInput
          onChangeText={(txt) => {
            setPassword(txt);
            setValidationError("");
            setSuccessMessage("");
          }}
          placeholder="Min 8 characters"
          style={styles.field}
          secureTextEntry
          value={password}
        />

        <Text style={styles.label}>Confirm New Password *</Text>
        <TextInput
          onChangeText={(txt) => {
            setConfirmPassword(txt);
            setValidationError("");
            setSuccessMessage("");
          }}
          placeholder="Verify password"
          style={styles.field}
          secureTextEntry
          value={confirmPassword}
        />

        <Pressable disabled={loading} onPress={handleResetPassword} style={styles.submitButton}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Reset Password</Text>
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
    marginTop: 24
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
