import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, RefreshControl, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  fetchPrescriptions,
  updatePrescriptionStatus,
  getPrescriptionFileUrl,
  getErrorMessage
} from "@medicare/api-client";
import type { PrescriptionData } from "@medicare/api-client";
import { MobileScreen, Card, SectionTitle } from "../../components/mobile-ui";
import { OfflineBanner } from "../../lib/offline-banner";
import { Linking } from "react-native";

const VAULT_CACHE_KEY = "medicare_prescription_vault";

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  verified: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  pending_review: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  rejected: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  pending: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" }
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status.toLowerCase()] ?? STATUS_BADGE.pending;
  return (
    <View
      style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}
      accessibilityLabel={`Status: ${status}`}
    >
      <Text style={[styles.badgeText, { color: s.text }]}>
        {status.replace("_", " ").toUpperCase()}
      </Text>
    </View>
  );
}

export default function PrescriptionsVaultScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadVault = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setNetworkError(false);

    // Restore cached data immediately for instant UI
    try {
      const cached = await AsyncStorage.getItem(VAULT_CACHE_KEY);
      if (cached && !isRefresh) {
        const parsed = JSON.parse(cached) as PrescriptionData[];
        setPrescriptions(parsed);
      }
    } catch {
      // Cache read failure is non-critical
    }

    // Then fetch fresh from API
    try {
      const items = await fetchPrescriptions();
      setPrescriptions(items);
      // Persist to cache
      try {
        await AsyncStorage.setItem(VAULT_CACHE_KEY, JSON.stringify(items));
      } catch {
        // Cache write failure is non-critical
      }
    } catch (err) {
      const msg = getErrorMessage(err, "");
      const isNetwork =
        err instanceof Error &&
        (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout"));
      if (isNetwork) {
        setNetworkError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadVault();
    });
  }, [loadVault]);

  const handleReviewAction = async (id: string, status: string) => {
    setActionMessage(null);
    try {
      const updated = await updatePrescriptionStatus(id, { status });
      setPrescriptions((curr) => curr.map((p) => (p.id === id ? updated : p)));
      // Update cache after status change
      const updatedAll = prescriptions.map((p) => (p.id === id ? updated : p));
      await AsyncStorage.setItem(VAULT_CACHE_KEY, JSON.stringify(updatedAll)).catch(() => null);
    } catch (err) {
      setActionMessage(getErrorMessage(err, "Could not update prescription status."));
    }
  };

  const handleOpenFile = (prescriptionId: string) => {
    const url = getPrescriptionFileUrl(prescriptionId);
    Linking.openURL(url).catch(() => {
      setActionMessage("Unable to open prescription file. Please try again.");
    });
  };

  const renderPrescriptionCard = (item: PrescriptionData) => (
    <Card key={item.id} style={styles.prescriptionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.prescriptionId} numberOfLines={1}>
            {item.id}
          </Text>
          <Text style={styles.doctorName} numberOfLines={1}>
            Dr. {item.doctorName} · {item.patientName}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {item.medicines && item.medicines.length > 0 ? (
        <View style={styles.medicinesContainer}>
          <Text style={styles.medicinesLabel}>Medicines</Text>
          <Text style={styles.medicinesText} numberOfLines={2}>
            {item.medicines.join(" · ")}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        {item.confidence ? (
          <Text style={styles.metaChip}>🎯 {item.confidence} confidence</Text>
        ) : null}
        {item.createdAt ? (
          <Text style={styles.metaChip}>
            📅 {new Date(item.createdAt).toLocaleDateString("en-IN")}
          </Text>
        ) : null}
      </View>

      {item.notes ? (
        <Text style={styles.notesText} numberOfLines={2}>
          📝 {item.notes}
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        {item.sourceFileName ? (
          <Pressable
            onPress={() => handleOpenFile(item.id)}
            style={[styles.actionBtn, styles.viewFileBtn]}
            accessibilityLabel={`Open prescription file for ${item.id}`}
          >
            <Text style={styles.viewFileBtnText}>📂 View File</Text>
          </Pressable>
        ) : null}
        {item.status !== "verified" ? (
          <Pressable
            onPress={() => handleReviewAction(item.id, "verified")}
            style={[styles.actionBtn, styles.verifyBtn]}
            accessibilityLabel={`Mark ${item.id} as verified`}
          >
            <Text style={styles.verifyBtnText}>✓ Verify</Text>
          </Pressable>
        ) : null}
        {item.status !== "rejected" ? (
          <Pressable
            onPress={() => handleReviewAction(item.id, "rejected")}
            style={[styles.actionBtn, styles.rejectBtn]}
            accessibilityLabel={`Mark ${item.id} as rejected`}
          >
            <Text style={styles.rejectBtnText}>✕ Reject</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  return (
    <MobileScreen
      activePath="/prescriptions/vault"
      title="Prescription Vault"
      subtitle="Your verified prescription history"
    >
      <OfflineBanner
        visible={networkError}
        message="Showing cached prescriptions. Connect to refresh."
        variant="offline"
        onDismiss={() => setNetworkError(false)}
      />

      {actionMessage ? (
        <View style={styles.actionMessageBanner}>
          <Text style={styles.actionMessageText}>{actionMessage}</Text>
          <Pressable onPress={() => setActionMessage(null)}>
            <Text style={styles.dismissX}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.headerActions}>
        <Pressable
          onPress={() => router.push("/prescriptions-upload")}
          style={styles.uploadNewBtn}
          accessibilityLabel="Upload new prescription"
        >
          <Text style={styles.uploadNewBtnText}>+ New Upload</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/prescriptions/vault-review")}
          style={styles.reviewQueueBtn}
          accessibilityLabel="Open review queue"
        >
          <Text style={styles.reviewQueueBtnText}>Review Queue</Text>
        </Pressable>
      </View>

      <SectionTitle
        title="My Prescriptions"
        action={prescriptions.length > 0 ? `${prescriptions.length} records` : ""}
      />

      {loading ? (
        <Card>
          <Text style={styles.loadingText}>Loading vault...</Text>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload your first prescription to start managing your medicines.
            </Text>
            <Pressable
              onPress={() => router.push("/prescriptions-upload")}
              style={styles.emptyUploadBtn}
            >
              <Text style={styles.emptyUploadBtnText}>Upload Prescription</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        prescriptions.map(renderPrescriptionCard)
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4
  },
  uploadNewBtn: {
    flex: 1,
    backgroundColor: "#1d9e75",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center"
  },
  uploadNewBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13
  },
  reviewQueueBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d6e1dc"
  },
  reviewQueueBtnText: {
    color: "#0f6e56",
    fontWeight: "700",
    fontSize: 13
  },
  prescriptionCard: {
    gap: 10,
    marginBottom: 4
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  cardTitleBlock: {
    flex: 1,
    gap: 3
  },
  prescriptionId: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827"
  },
  doctorName: {
    fontSize: 12,
    color: "#6b7280"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  medicinesContainer: {
    gap: 3
  },
  medicinesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  medicinesText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600"
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  metaChip: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600"
  },
  notesText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  actionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1
  },
  viewFileBtn: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0"
  },
  viewFileBtnText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600"
  },
  verifyBtn: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0"
  },
  verifyBtnText: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "700"
  },
  rejectBtn: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5"
  },
  rejectBtnText: {
    fontSize: 12,
    color: "#991b1b",
    fontWeight: "700"
  },
  loadingText: {
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 12
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10
  },
  emptyIcon: {
    fontSize: 44
  },
  emptyTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#111827"
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20
  },
  emptyUploadBtn: {
    backgroundColor: "#1d9e75",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 11,
    marginTop: 6
  },
  emptyUploadBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13
  },
  actionMessageBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 6
  },
  actionMessageText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: 13,
    flex: 1
  },
  dismissX: {
    color: "#92400e",
    fontWeight: "800",
    marginLeft: 8
  }
});
