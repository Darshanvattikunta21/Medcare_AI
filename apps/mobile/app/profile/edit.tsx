import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/use-auth";
import { updateProfile } from "@medicare/api-client";
import { MobileScreen, Card } from "../../components/mobile-ui";
import {
  Text,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from "react-native";

const PREDEFINED_ALLERGIES = ["Penicillin", "Sulfa drugs", "Aspirin", "Nuts", "Pollens", "Latex"];
const PREDEFINED_CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Heart disease", "Chronic kidney disease"];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, refetchUser } = useAuth();

  // Parse first and last name
  const nameParts = (user?.name || "").split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(user?.phone || "");
  const [dob, setDob] = useState(user?.DOB || "");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(user?.allergies || []);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(user?.conditions || []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((current) =>
      current.includes(allergy) ? current.filter((a) => a !== allergy) : [...current, allergy]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((current) =>
      current.includes(condition) ? current.filter((c) => c !== condition) : [...current, condition]
    );
  };

  const validate = () => {
    if (!firstName.trim()) {
      setError("First Name is required.");
      return false;
    }
    if (!lastName.trim()) {
      setError("Last Name is required.");
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone.replace(/[^0-9]/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      await updateProfile({
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim(),
        DOB: dob.trim(),
        allergies: selectedAllergies,
        conditions: selectedConditions
      });
      await refetchUser();
      router.back();
    } catch (err: any) {
      setError(err?.message || "Failed to update profile information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileScreen activePath="/profile" title="Edit Profile" subtitle="Update your personal & medical details">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.sectionHeader}>Personal Details</Text>

          <Text style={styles.label}>First Name *</Text>
          <TextInput
            value={firstName}
            onChangeText={(txt) => {
              setFirstName(txt);
              setError("");
            }}
            placeholder="John"
            style={styles.field}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            value={lastName}
            onChangeText={(txt) => {
              setLastName(txt);
              setError("");
            }}
            placeholder="Doe"
            style={styles.field}
          />

          <Text style={styles.label}>Email (Read-only)</Text>
          <TextInput
            value={user?.email || ""}
            editable={false}
            style={[styles.field, styles.disabledField]}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(txt) => {
              setPhone(txt);
              setError("");
            }}
            placeholder="10-digit number"
            style={styles.field}
          />

          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            value={dob}
            onChangeText={(txt) => {
              setDob(txt);
              setError("");
            }}
            placeholder="1990-01-01"
            style={styles.field}
          />
        </Card>

        <Card>
          <Text style={styles.sectionHeader}>Allergies</Text>
          <Text style={styles.description}>Select any allergies to help prevent harmful drug reactions:</Text>
          <View style={styles.chipsRow}>
            {PREDEFINED_ALLERGIES.map((allergy) => {
              const selected = selectedAllergies.includes(allergy);
              return (
                <Pressable
                  key={allergy}
                  onPress={() => toggleAllergy(allergy)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {selected ? "✓ " : ""}{allergy}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionHeader}>Chronic Conditions</Text>
          <Text style={styles.description}>Select any conditions to tailor drug interaction checks:</Text>
          <View style={styles.chipsRow}>
            {PREDEFINED_CONDITIONS.map((condition) => {
              const selected = selectedConditions.includes(condition);
              return (
                <Pressable
                  key={condition}
                  onPress={() => toggleCondition(condition)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {selected ? "✓ " : ""}{condition}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionsRow}>
          <Pressable onPress={() => router.back()} style={[styles.btn, styles.cancelBtn]}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>

          <Pressable disabled={loading} onPress={handleSave} style={[styles.btn, styles.saveBtn]}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 14,
    paddingBottom: 24
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8
  },
  description: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12
  },
  label: {
    fontWeight: "700",
    color: "#4b5563",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 10
  },
  field: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    padding: 14,
    color: "#111827",
    fontSize: 14
  },
  disabledField: {
    backgroundColor: "#e5e7eb",
    color: "#6b7280"
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff"
  },
  chipActive: {
    borderColor: "#1d9e75",
    backgroundColor: "#eef9f4"
  },
  chipText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600"
  },
  chipTextActive: {
    color: "#0f6e56",
    fontWeight: "700"
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 10
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff"
  },
  saveBtn: {
    backgroundColor: "#1d9e75"
  },
  cancelBtnText: {
    color: "#4b5563",
    fontWeight: "700"
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});
