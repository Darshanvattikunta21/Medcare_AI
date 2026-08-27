import { useRouter } from "expo-router";
import { useState } from "react";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { Pressable, Text, TextInput, View, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../../lib/use-auth";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading, error: authError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [secureText, setSecureText] = useState(true);

  function validateInputs() {
    if (!name.trim()) {
      setValidationError("Full Name is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address.");
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setValidationError("Please enter a valid 10-digit phone number.");
      return false;
    }
    // Password complexity check (min 8 chars, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setValidationError("Password must be at least 8 characters long, containing 1 number and 1 special character.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return false;
    }
    if (!agreeTerms) {
      setValidationError("You must agree to the Terms & Conditions.");
      return false;
    }
    setValidationError("");
    return true;
  }

  async function handleSignup() {
    if (!validateInputs()) return;

    try {
      await signUp({ name, email, phone, password });
      // Route guard in _layout.tsx will redirect to "/"
    } catch (err) {
      // Handled by AuthContext error state
    }
  }

  const activeError = validationError || authError;

  return (
    <MobileScreen activePath="/auth/signup" title="Create Account" subtitle="Get started with MediCare AI">
      <Card>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          onChangeText={(txt) => {
            setName(txt);
            setValidationError("");
          }}
          placeholder="John Doe"
          style={styles.field}
          value={name}
        />

        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(txt) => {
            setEmail(txt);
            setValidationError("");
          }}
          placeholder="john.doe@email.com"
          style={styles.field}
          value={email}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(txt) => {
            setPhone(txt);
            setValidationError("");
          }}
          placeholder="9999900000"
          style={styles.field}
          value={phone}
        />

        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            onChangeText={(txt) => {
              setPassword(txt);
              setValidationError("");
            }}
            placeholder="Enter password (min 8 chars)"
            style={styles.passwordField}
            secureTextEntry={secureText}
            value={password}
          />
          <Pressable onPress={() => setSecureText(!secureText)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{secureText ? "Show" : "Hide"}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          onChangeText={(txt) => {
            setConfirmPassword(txt);
            setValidationError("");
          }}
          placeholder="Verify password"
          style={styles.field}
          secureTextEntry
          value={confirmPassword}
        />

        <Pressable onPress={() => setAgreeTerms(!agreeTerms)} style={styles.checkboxRow}>
          <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
            {agreeTerms ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>I agree to the Terms & Conditions</Text>
        </Pressable>

        <Pressable disabled={loading} onPress={handleSignup} style={styles.submitButton}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Sign Up</Text>
          )}
        </Pressable>

        {activeError ? <Text style={styles.errorText}>{activeError}</Text> : null}

        <Pressable onPress={() => router.push("/login")} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 14,
    backgroundColor: "#f9fafb"
  },
  passwordField: {
    flex: 1,
    padding: 14,
    color: "#111827"
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  toggleText: {
    color: "#1d9e75",
    fontWeight: "700"
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 4
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb"
  },
  checkboxChecked: {
    backgroundColor: "#1d9e75",
    borderColor: "#1d9e75"
  },
  checkmark: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14
  },
  checkboxLabel: {
    color: "#4b5563",
    fontWeight: "500"
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
  loginLink: {
    marginTop: 20,
    alignItems: "center"
  },
  loginLinkText: {
    color: "#1d9e75",
    fontWeight: "700"
  }
});
