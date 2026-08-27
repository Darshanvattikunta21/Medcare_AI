import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useRouter } from "expo-router";
import {
  fetchAdminSettings,
  updateAdminSettings,
  updateAdminStock,
  getErrorMessage,
  type AdminSettingsResponse
} from "@medicare/api-client";
import { MobileScreen, Card, AnimPressable } from "../components/mobile-ui";

export default function AdminScreen() {
  const router = useRouter();
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delivery settings inputs
  const [baseCharge, setBaseCharge] = useState("");
  const [ratePerKm, setRatePerKm] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Medicine list search/filter state
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminSettings();
      setData(res);
      setBaseCharge(String(res.deliveryBaseCharge));
      setRatePerKm(String(res.deliveryRatePerKm));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load admin settings."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDelivery() {
    if (!baseCharge.trim() || !ratePerKm.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);
    try {
      const res = await updateAdminSettings({
        deliveryBaseCharge: Number(baseCharge),
        deliveryRatePerKm: Number(ratePerKm)
      });
      if (res.ok) {
        setSaveMessage("✅ Delivery settings saved successfully.");
        // Refresh local data
        if (data) {
          setData({
            ...data,
            deliveryBaseCharge: Number(baseCharge),
            deliveryRatePerKm: Number(ratePerKm)
          });
        }
      }
    } catch (err) {
      setSaveMessage("❌ " + getErrorMessage(err, "Failed to save delivery settings."));
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleUpdateStock(medicineId: string, status: string) {
    setUpdatingIds((prev) => ({ ...prev, [medicineId]: true }));
    try {
      const res = await updateAdminStock({ medicineId, stockStatus: status });
      if (res.ok) {
        // Update local state
        if (data) {
          setData({
            ...data,
            medicines: data.medicines.map((med) =>
              med.id === medicineId ? { ...med, stockStatus: status as any } : med
            )
          });
        }
      }
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err, "Failed to update stock status."));
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [medicineId]: false }));
    }
  }

  const filteredMedicines = data?.medicines.filter((med) => {
    const q = search.toLowerCase();
    return (
      med.name.toLowerCase().includes(q) ||
      med.brand.toLowerCase().includes(q) ||
      med.category.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <MobileScreen activePath="/profile" title="Pharmacist Panel" subtitle="Manage Stock & Delivery">
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Profile</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d9e75" />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        )}

        {error && (
          <Card soft style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSettings} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          </Card>
        )}

        {!loading && !error && data && (
          <View style={styles.content}>
            {/* Delivery Charges configuration */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🚚 Distance-Based Delivery</Text>
              <Text style={styles.sectionSubtitle}>
                Delivery Fee = Base Charge + (Distance in Km * Rate per Km)
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Base Charge (Rs)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={baseCharge}
                    onChangeText={setBaseCharge}
                    placeholder="20"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Rate Per Km (Rs/Km)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={ratePerKm}
                    onChangeText={setRatePerKm}
                    placeholder="5"
                  />
                </View>
              </View>

              <AnimPressable
                scaleTo={0.96}
                onPress={handleSaveDelivery}
                style={styles.saveButton}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Delivery Settings</Text>
                )}
              </AnimPressable>

              {saveMessage && <Text style={styles.saveMessageText}>{saveMessage}</Text>}
            </Card>

            {/* Stock management */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📦 Medicine Stock Availability</Text>
              <Text style={styles.sectionSubtitle}>
                Toggle item availability for customer orders.
              </Text>

              <TextInput
                style={styles.searchBar}
                value={search}
                onChangeText={setSearch}
                placeholder="Search medicine name, brand, category..."
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.itemsCountText}>
                Showing {filteredMedicines.length} of {data.medicines.length} items
              </Text>

              {/* Medicines List */}
              <View style={styles.medicinesList}>
                {filteredMedicines.map((med) => {
                  const isUpdating = updatingIds[med.id];
                  return (
                    <View key={med.id} style={[styles.medicineItem, isUpdating && styles.medicineItemDisabled]}>
                      <View style={styles.medicineDetails}>
                        <View style={styles.medicineHeaderRow}>
                          <Text style={styles.medicineName}>{med.name}</Text>
                          <View
                            style={[
                              styles.rxTag,
                              med.tag.toLowerCase() === "rx" ? styles.rxTagRed : styles.rxTagGreen
                            ]}
                          >
                            <Text
                              style={[
                                styles.rxTagText,
                                med.tag.toLowerCase() === "rx" ? styles.rxTagTextRed : styles.rxTagTextGreen
                              ]}
                            >
                              {med.tag}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.medicineMeta}>
                          {med.brand} · {med.category} · {med.price}
                        </Text>
                      </View>

                      {/* Stock Selection Buttons */}
                      <View style={styles.stockButtonsRow}>
                        {["in_stock", "limited", "out_of_stock"].map((status) => {
                          const active = med.stockStatus === status;
                          const label =
                            status === "in_stock"
                              ? "In Stock"
                              : status === "limited"
                              ? "Limited"
                              : "Out";
                          const buttonBg =
                            active
                              ? status === "in_stock"
                                ? "#1d9e75"
                                : status === "limited"
                                ? "#f59e0b"
                                : "#ef4444"
                              : "transparent";
                          const buttonBorder = active ? buttonBg : "#cbd5e1";
                          const labelColor = active ? "#fff" : "#64748b";

                          return (
                            <TouchableOpacity
                              key={status}
                              disabled={isUpdating}
                              onPress={() => handleUpdateStock(med.id, status)}
                              style={[
                                styles.stockButton,
                                { backgroundColor: buttonBg, borderColor: buttonBorder }
                              ]}
                            >
                              <Text style={[styles.stockButtonText, { color: labelColor }]}>{label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}

                {filteredMedicines.length === 0 && (
                  <Text style={styles.emptyText}>No medicines match your search.</Text>
                )}
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  backButton: {
    marginBottom: 16
  },
  backButtonText: {
    color: "#1d9e75",
    fontWeight: "bold",
    fontSize: 14
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14
  },
  errorCard: {
    alignItems: "center",
    padding: 20
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 12
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#1d9e75",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16
  },
  retryButtonText: {
    color: "#1d9e75",
    fontWeight: "bold"
  },
  content: {
    gap: 16
  },
  sectionCard: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f6e56",
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 16
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14
  },
  inputCol: {
    flex: 1
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc"
  },
  saveButton: {
    backgroundColor: "#1d9e75",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14
  },
  saveMessageText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center"
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    marginBottom: 10
  },
  itemsCountText: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 12
  },
  medicinesList: {
    gap: 10
  },
  medicineItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#fff"
  },
  medicineItemDisabled: {
    opacity: 0.6
  },
  medicineDetails: {
    marginBottom: 10
  },
  medicineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2
  },
  medicineName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a"
  },
  medicineMeta: {
    fontSize: 12,
    color: "#64748b"
  },
  rxTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  rxTagRed: {
    backgroundColor: "#fee2e2"
  },
  rxTagGreen: {
    backgroundColor: "#d1fae5"
  },
  rxTagText: {
    fontSize: 9,
    fontWeight: "bold"
  },
  rxTagTextRed: {
    color: "#991b1b"
  },
  rxTagTextGreen: {
    color: "#065f46"
  },
  stockButtonsRow: {
    flexDirection: "row",
    gap: 4
  },
  stockButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: "center"
  },
  stockButtonText: {
    fontSize: 11,
    fontWeight: "700"
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 16
  }
});
