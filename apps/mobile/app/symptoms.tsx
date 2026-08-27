import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { analyzeSymptoms, fetchSymptomHistory, getErrorMessage } from "@medicare/api-client";
import type { SymptomHistoryItem } from "@medicare/api-client";
import { medicines } from "@medicare/core";
import * as Haptics from "expo-haptics";
import {
  AIResultBlock,
  AnalyzingIndicator,
  MedicineCards,
  MobileScreen,
  SectionTitle,
  SymptomInputBlock,
  Toast
} from "../components/mobile-ui";
import { StyleSheet, View, Text } from "react-native";
import { OfflineBanner } from "../lib/offline-banner";

import { useAuth } from "../lib/use-auth";

type AnalysisResult = Awaited<ReturnType<typeof analyzeSymptoms>>;

const SYMPTOM_HISTORY_KEY = "medicare_symptom_history";

export default function SymptomsScreen() {
  const { token }                         = useAuth();
  const [analysis, setAnalysis]           = useState<AnalysisResult | undefined>(undefined);
  const [history, setHistory]             = useState<SymptomHistoryItem[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [toastVisible, setToastVisible]   = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [offlineMessage, setOfflineMessage]       = useState("");
  const [lastInput, setLastInput]         = useState<{ symptoms: string[]; duration: string; severity: number; notes: string } | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(SYMPTOM_HISTORY_KEY);
      if (cached) setHistory(JSON.parse(cached) as SymptomHistoryItem[]);
    } catch { /* non-critical */ }

    if (!token) return;

    try {
      const liveHistory = await fetchSymptomHistory();
      setHistory(liveHistory);
      try { await AsyncStorage.setItem(SYMPTOM_HISTORY_KEY, JSON.stringify(liveHistory)); } catch { /* non-critical */ }
    } catch (err) {
      const msg = getErrorMessage(err, "");
      const isNetwork = err instanceof Error && (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout"));
      if (isNetwork) { setOfflineMessage("Symptom history is from your last session. Connect to sync."); setShowOfflineBanner(true); }
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadHistory();
    });
  }, [loadHistory]);

  const handleAnalyze = useCallback(
    async (input: { symptoms: string[]; duration: string; severity: number; notes: string }) => {
      setSubmitting(true);
      setErrorMsg(null);
      setToastVisible(false);
      setShowOfflineBanner(false);
      setLastInput(input);

      try {
        const result = await analyzeSymptoms(input);
        setAnalysis(result);

        // Directive 2: Success haptic on major completion
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const newEntry: SymptomHistoryItem = {
          id: `local-${Date.now()}`,
          userId: "local",
          symptoms: input.symptoms,
          duration: input.duration,
          severity: input.severity,
          notes: input.notes,
          condition: result.result?.condition ?? "Unknown",
          confidence: String(result.result?.confidence ?? ""),
          createdAt: new Date().toISOString()
        };
        setHistory((prev) => {
          const updated = [newEntry, ...prev].slice(0, 50);
          AsyncStorage.setItem(SYMPTOM_HISTORY_KEY, JSON.stringify(updated)).catch(() => null);
          return updated;
        });
      } catch (err) {
        const msg = getErrorMessage(err, "Unable to analyze symptoms right now.");
        const isNetwork = err instanceof Error &&
          (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout") || msg.includes("timed out"));
        if (isNetwork) { setOfflineMessage("AI Analyzer is unreachable. Check your connection and try again."); setShowOfflineBanner(true); }

        // Directive 5: graceful toast instead of raw error text
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMsg("Analysis failed. Check your connection and try again.");
        setToastVisible(true);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const formatHistoryDate = (isoDate: string): string => {
    try {
      return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return isoDate; }
  };

  return (
    <MobileScreen activePath="/symptoms" title="AI Symptom Checker" subtitle="Tell us how you feel">
      <OfflineBanner
        visible={showOfflineBanner}
        message={offlineMessage}
        variant={errorMsg ? "error" : "offline"}
        onDismiss={() => setShowOfflineBanner(false)}
      />

      <SymptomInputBlock onAnalyze={handleAnalyze} />

      {/* Directive 4: Animated skeleton analyzing indicator */}
      {submitting ? <AnalyzingIndicator /> : null}

      {analysis ? <AIResultBlock analysis={analysis} /> : null}

      <SectionTitle
        title="Recommended medicines"
        action={analysis ? "Based on analysis" : "Top picks"}
      />
      <MedicineCards items={analysis?.recommendedMedicines ?? medicines.slice(0, 4)} />

      {history.length > 0 ? (
        <>
          <SectionTitle title="Recent symptom history" action={`${history.length} saved`} />
          {history.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyCondition}>{item.condition}</Text>
                <Text style={styles.historyDate}>{formatHistoryDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.historySymptoms} numberOfLines={1}>{item.symptoms.join(", ")}</Text>
              {item.confidence ? (
                <Text style={styles.historyConfidence}>🎯 {item.confidence} confidence</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {/* Directive 5: Slide-up graceful error toast with retry */}
      <Toast
        visible={toastVisible}
        message={errorMsg ?? "Something went wrong. Please try again."}
        type="error"
        onDismiss={() => setToastVisible(false)}
        onRetry={lastInput ? () => { setToastVisible(false); handleAnalyze(lastInput!); } : undefined}
        duration={6000}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  historyItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyCondition: { fontSize: 14, fontWeight: "700", color: "#111827" },
  historyDate: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  historySymptoms: { fontSize: 12, color: "#6B7280" },
  historyConfidence: { fontSize: 11, color: "#0F766E", fontWeight: "600" },
});
