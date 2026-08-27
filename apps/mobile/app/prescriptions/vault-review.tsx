import { MobileScreen, Card, SectionTitle } from "../../components/mobile-ui";
import {
  fetchPrescriptionReviewQueue,
  fetchPrescriptions,
  updatePrescriptionStatus,
  getErrorMessage,
  getPrescriptionFileUrl
} from "@medicare/api-client";
import type { PrescriptionData } from "@medicare/api-client";
import { useEffect, useState } from "react";
import { StyleSheet, Text, Pressable, View, Linking } from "react-native";

export default function PrescriptionsVaultReviewScreen() {
  const [scope, setScope] = useState<"mine" | "review">("review");
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage("");
      try {
        const items = scope === "review"
          ? await fetchPrescriptionReviewQueue()
          : await fetchPrescriptions();
        if (active) {
          setPrescriptions(items);
        }
      } catch (err) {
        if (active) {
          setMessage(getErrorMessage(err, "Unable to load prescriptions"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [scope]);

  async function review(id: string, status: string) {
    setMessage("");
    try {
      const updated = await updatePrescriptionStatus(id, { status });
      setPrescriptions((curr) => curr.map((p) => (p.id === id ? updated : p)));
      setMessage(`Prescription ${id} updated to ${status}.`);
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to update prescription"));
    }
  }

  return (
    <MobileScreen
      activePath="/prescriptions/upload"
      title="Prescription Vault (Review)"
      subtitle="Review and manage uploaded prescriptions"
    >
      <View style={styles.scopeRow}>
        <Pressable
          onPress={() => setScope("mine")}
          style={[
            styles.scopeButton,
            scope === "mine" ? styles.scopeButtonActive : styles.scopeButtonInactive
          ]}
        >
          <Text style={[styles.scopeButtonText, scope === "mine" && styles.textActive]}>
            My vault
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setScope("review")}
          style={[
            styles.scopeButton,
            scope === "review" ? styles.scopeButtonActive : styles.scopeButtonInactive
          ]}
        >
          <Text style={[styles.scopeButtonText, scope === "review" && styles.textActive]}>
            Review queue
          </Text>
        </Pressable>
      </View>

      <SectionTitle title="Prescriptions" />

      {loading ? (
        <Card>
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </Card>
      ) : null}

      {!loading && prescriptions.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No prescriptions found.</Text>
        </Card>
      ) : null}

      {prescriptions.map((item) => (
        <Card key={item.id}>
          <Text style={styles.prescriptionIdTitle}>
            {item.id} • {item.status}
          </Text>
          <Text style={styles.prescriptionMetaText}>
            {item.patientName} • {item.doctorName}
          </Text>
          <Text style={styles.prescriptionMedicinesText}>
            {(item.medicines || []).join(" • ")}
          </Text>
          <View style={styles.actionButtonsContainer}>
            {item.sourceFileName ? (
              <Pressable
                onPress={() => {
                  const url = getPrescriptionFileUrl(item.id);
                  Linking.openURL(url).catch(() => null);
                }}
                style={styles.openFileButton}
              >
                <Text style={styles.openFileButtonText}>Open File</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => review(item.id, "verified")} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Verify</Text>
            </Pressable>
            <Pressable onPress={() => review(item.id, "pending_review")} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Review</Text>
            </Pressable>
            <Pressable onPress={() => review(item.id, "rejected")} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Reject</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scopeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  scopeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  scopeButtonActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0"
  },
  scopeButtonInactive: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb"
  },
  scopeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151"
  },
  textActive: {
    color: "#0f766e"
  },
  loadingText: {
    color: "#6b7280",
    textAlign: "center"
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center"
  },
  prescriptionIdTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827"
  },
  prescriptionMetaText: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 2
  },
  prescriptionMedicinesText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap"
  },
  openFileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0"
  },
  openFileButtonText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600"
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6e1dc"
  },
  actionButtonText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600"
  },
  messageText: {
    marginTop: 10,
    color: "#155e75",
    fontWeight: "600",
    textAlign: "center"
  }
});
