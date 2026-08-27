/**
 * ApiDiagnosticTerminal — Real-time API integration QA overlay
 *
 * HOW TO USE:
 *   1. Import and drop <ApiDiagnosticTerminal /> anywhere inside a screen
 *      that is already wrapped in CartProvider (e.g. at the bottom of index.tsx).
 *   2. Open Expo Go, navigate to that screen.
 *   3. Run all the tests, verify schema badges, watch the live log.
 *   4. REMOVE this component before shipping.
 *
 * Tests covered:
 *   Directive 1 – Base URL + latency ping
 *   Directive 2 – Schema validation for /api/app/snapshot, /api/cart, /api/catalog/medicines
 *   Directive 3 – Cart state sync (item count from use-cart)
 *   Directive 4 – Force error to test error boundary / graceful fallback
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import {
  fetchAppSnapshot,
  fetchCart,
  fetchCatalog,
  getApiBaseUrl,
  type AppSnapshot,
  type CartData,
} from "@medicare/api-client";
import { useCart } from "../lib/use-cart";

// ─── Types ────────────────────────────────────────────────────────────────────
type LogLevel = "info" | "pass" | "fail" | "warn" | "ping";

type LogEntry = {
  id: number;
  ts: string;
  level: LogLevel;
  msg: string;
};

type SchemaResult = {
  name: string;
  status: "pass" | "fail" | "pending" | "running";
  latencyMs?: number;
  missingFields?: string[];
  detail?: string;
};

// ─── Schema Validators ────────────────────────────────────────────────────────
const SNAPSHOT_REQUIRED: Array<keyof AppSnapshot> = [
  "highlights", "features", "categories", "medicines",
  "notifications", "orders", "profile", "prescriptions", "cart",
];

const CART_REQUIRED: Array<keyof CartData> = [
  "items", "subtotal", "deliveryFee", "total", "itemCount",
];

function validateSnapshot(data: unknown): string[] {
  const obj = data as Partial<AppSnapshot>;
  return SNAPSHOT_REQUIRED.filter((k) => obj[k] === undefined || obj[k] === null);
}

function validateCart(data: unknown): string[] {
  const obj = data as Partial<CartData>;
  return CART_REQUIRED.filter((k) => obj[k] === undefined || obj[k] === null);
}

function validateCatalog(data: unknown): string[] {
  if (!Array.isArray(data)) return ["root: expected array"];
  if (data.length === 0) return []; // empty is valid
  const first = data[0] as Record<string, unknown>;
  const required = ["id", "name", "brand", "price", "tag", "description"];
  return required.filter((k) => first[k] === undefined || first[k] === null);
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const TERM = {
  bg:       "#0A0F1A",
  surface:  "#0F1929",
  border:   "#1E3A5F",
  pass:     "#10B981",
  fail:     "#F43F5E",
  warn:     "#F59E0B",
  info:     "#60A5FA",
  ping:     "#8B5CF6",
  muted:    "#475569",
  white:    "#E2E8F0",
  cyan:     "#06B6D4",
  runBg:    "#1E2D4D",
};

const LOG_COLOR: Record<LogLevel, string> = {
  pass: TERM.pass,
  fail: TERM.fail,
  warn: TERM.warn,
  info: TERM.info,
  ping: TERM.ping,
};
const LOG_PREFIX: Record<LogLevel, string> = {
  pass: "  ✓ ",
  fail: "  ✗ ",
  warn: "  ⚠ ",
  info: "  › ",
  ping: "  ◈ ",
};

// ─── Component ────────────────────────────────────────────────────────────────
let _logId = 0;

export function ApiDiagnosticTerminal() {
  const { items: cartItems, itemCount: cartItemCount, loading: cartLoading } = useCart();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [schemas, setSchemas] = useState<SchemaResult[]>([
    { name: "/api/app/snapshot", status: "pending" },
    { name: "/api/cart",         status: "pending" },
    { name: "/api/catalog/medicines", status: "pending" },
  ]);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingRunning, setPingRunning] = useState(false);
  const [baseUrl] = useState(() => getApiBaseUrl());
  const scrollRef = useRef<ScrollView>(null);
  const [spinAnim] = useState(() => new Animated.Value(0));
  const spinLoop  = useRef<Animated.CompositeAnimation | null>(null);

  const ts = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

  const addLog = useCallback((level: LogLevel, msg: string) => {
    const entry: LogEntry = { id: ++_logId, ts: ts(), level, msg };
    setLog((prev) => [...prev.slice(-199), entry]); // keep last 200 lines
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const setSchema = (name: string, patch: Partial<SchemaResult>) =>
    setSchemas((prev) => prev.map((s) => (s.name === name ? { ...s, ...patch } : s)));

  // Spinner animation while any test is running
  const startSpin = useCallback(() => {
    spinLoop.current?.stop();
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear })
    );
    spinLoop.current = loop;
    loop.start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // ── Directive 1: Ping ──────────────────────────────────────────────────────
  const handlePing = useCallback(async () => {
    setPingRunning(true);
    setPingMs(null);
    startSpin();
    addLog("ping", `Pinging ${baseUrl}/api/app/snapshot …`);
    const t0 = Date.now();
    try {
      await fetch(`${baseUrl}/api/app/snapshot`, { method: "HEAD" }).catch(() =>
        fetch(`${baseUrl}/api/app/snapshot`, { method: "GET" })
      );
      const ms = Date.now() - t0;
      setPingMs(ms);
      addLog("ping", `Round-trip latency: ${ms}ms`);
      addLog(ms < 300 ? "pass" : ms < 800 ? "warn" : "fail",
        ms < 300 ? "Excellent latency" : ms < 800 ? "Acceptable latency" : "High latency — check LAN/VPN");
    } catch (err) {
      const ms = Date.now() - t0;
      setPingMs(-1);
      addLog("fail", `Ping failed after ${ms}ms — ${(err as Error).message}`);
    } finally {
      setPingRunning(false);
      stopSpin();
    }
  }, [baseUrl, addLog, startSpin, stopSpin]);

  // ── Directive 2: Schema Tests ──────────────────────────────────────────────
  const runSchemaTest = useCallback(async (
    name: string,
    fetcher: () => Promise<unknown>,
    validator: (d: unknown) => string[],
  ) => {
    setSchema(name, { status: "running", missingFields: undefined, detail: undefined });
    addLog("info", `Schema test → ${name}`);
    startSpin();
    const t0 = Date.now();
    try {
      const data = await fetcher();
      const ms = Date.now() - t0;
      const missing = validator(data);
      if (missing.length === 0) {
        setSchema(name, { status: "pass", latencyMs: ms, missingFields: [] });
        addLog("pass", `${name} — schema OK (${ms}ms)`);
      } else {
        setSchema(name, { status: "fail", latencyMs: ms, missingFields: missing });
        addLog("fail", `${name} — missing fields: ${missing.join(", ")}`);
      }
    } catch (err) {
      const ms = Date.now() - t0;
      setSchema(name, { status: "fail", latencyMs: ms, detail: (err as Error).message });
      addLog("fail", `${name} — ${(err as Error).message}`);
    } finally {
      stopSpin();
    }
  }, [addLog, startSpin, stopSpin]);

  const runAllSchemas = useCallback(async () => {
    addLog("info", "━━━ Running all schema tests ━━━");
    await runSchemaTest("/api/app/snapshot", fetchAppSnapshot, validateSnapshot);
    await runSchemaTest("/api/cart",         fetchCart,         validateCart);
    await runSchemaTest("/api/catalog/medicines", fetchCatalog, validateCatalog);
    addLog("info", "━━━ Schema tests complete ━━━");
  }, [runSchemaTest, addLog]);

  // ── Directive 4: Force Error ───────────────────────────────────────────────
  const handleForceError = useCallback(async () => {
    addLog("warn", "Force-error: requesting /api/__does_not_exist__");
    startSpin();
    try {
      const res = await fetch(`${baseUrl}/api/__does_not_exist__`);
      const text = await res.text().catch(() => "(no body)");
      if (!res.ok) {
        addLog("pass", `Error boundary fired correctly → HTTP ${res.status}: ${text.slice(0, 120)}`);
      } else {
        addLog("warn", `Unexpected 2xx on broken endpoint (${res.status})`);
      }
    } catch (err) {
      addLog("pass", `Network error caught gracefully: ${(err as Error).message}`);
    } finally {
      stopSpin();
    }
  }, [baseUrl, addLog, startSpin, stopSpin]);

  // ── Log cart state on mount + when it changes ──────────────────────────────
  useEffect(() => {
    if (!cartLoading) {
      Promise.resolve().then(() => {
        addLog("info",
          `Cart state → itemCount=${cartItemCount}, items=[${cartItems.map((i) => i.name).join(", ") || "empty"}]`
        );
      });
    }
  }, [cartItemCount, cartLoading, addLog, cartItems]);

  useEffect(() => {
    Promise.resolve().then(() => {
      addLog("info", `DiagnosticTerminal mounted. Target: ${baseUrl}`);
    });
  }, [addLog, baseUrl]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Animated.Text style={[s.spinnerIcon, { transform: [{ rotate: spin }] }]}>⬡</Animated.Text>
        <Text style={s.headerTitle}>API Diagnostic Terminal</Text>
        <Pressable onPress={() => setLog([])} style={s.clearBtn}>
          <Text style={s.clearBtnText}>CLR</Text>
        </Pressable>
      </View>

      {/* Base URL */}
      <View style={s.urlBar}>
        <Text style={s.urlLabel}>TARGET</Text>
        <Text style={s.urlValue} numberOfLines={1}>{baseUrl || "(empty — uses relative URL)"}</Text>
      </View>

      {/* Directive 1: Ping */}
      <View style={s.row}>
        <Pressable onPress={handlePing} disabled={pingRunning} style={[s.btn, s.btnPing]}>
          <Text style={s.btnText}>◈ Ping API</Text>
        </Pressable>
        <View style={s.pingResult}>
          {pingMs === null && !pingRunning && <Text style={s.pingMuted}>—</Text>}
          {pingRunning && <Text style={[s.pingMs, { color: TERM.ping }]}>…</Text>}
          {pingMs !== null && !pingRunning && (
            <Text style={[s.pingMs, { color: pingMs < 0 ? TERM.fail : pingMs < 300 ? TERM.pass : pingMs < 800 ? TERM.warn : TERM.fail }]}>
              {pingMs < 0 ? "UNREACHABLE" : `${pingMs} ms`}
            </Text>
          )}
        </View>
      </View>

      {/* Directive 2: Schema */}
      <View style={s.schemaSection}>
        <View style={s.schemaTitleRow}>
          <Text style={s.sectionLabel}>SCHEMA VALIDATION</Text>
          <Pressable onPress={runAllSchemas} style={[s.btn, s.btnRun]}>
            <Text style={s.btnText}>▶ Run All</Text>
          </Pressable>
        </View>
        {schemas.map((sc) => (
          <View key={sc.name} style={s.schemaRow}>
            <View style={[s.schemaBadge, {
              backgroundColor:
                sc.status === "pass"    ? "rgba(16,185,129,0.2)"  :
                sc.status === "fail"    ? "rgba(244,63,94,0.2)"   :
                sc.status === "running" ? "rgba(139,92,246,0.2)"  :
                "rgba(71,85,105,0.3)",
              borderColor:
                sc.status === "pass"    ? TERM.pass  :
                sc.status === "fail"    ? TERM.fail  :
                sc.status === "running" ? TERM.ping  :
                TERM.muted,
            }]}>
              <Text style={[s.schemaBadgeText, {
                color:
                  sc.status === "pass"    ? TERM.pass  :
                  sc.status === "fail"    ? TERM.fail  :
                  sc.status === "running" ? TERM.ping  :
                  TERM.muted,
              }]}>
                {sc.status === "pass" ? "PASS" : sc.status === "fail" ? "FAIL" : sc.status === "running" ? "RUN…" : "—"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.schemaName}>{sc.name}</Text>
              {sc.latencyMs !== undefined && (
                <Text style={s.schemaMeta}>{sc.latencyMs}ms</Text>
              )}
              {sc.missingFields && sc.missingFields.length > 0 && (
                <Text style={s.schemaFail}>Missing: {sc.missingFields.join(", ")}</Text>
              )}
              {sc.detail && (
                <Text style={s.schemaFail} numberOfLines={2}>{sc.detail}</Text>
              )}
            </View>
            <Pressable
              onPress={() => runSchemaTest(
                sc.name,
                sc.name === "/api/app/snapshot" ? fetchAppSnapshot :
                sc.name === "/api/cart"          ? fetchCart        :
                fetchCatalog,
                sc.name === "/api/app/snapshot" ? validateSnapshot :
                sc.name === "/api/cart"          ? validateCart     :
                validateCatalog,
              )}
              style={s.schemaRunBtn}
            >
              <Text style={s.schemaRunBtnText}>↻</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Directive 3: Cart state */}
      <View style={s.stateRow}>
        <Text style={s.sectionLabel}>STATE SYNC — use-cart</Text>
        <View style={s.statePills}>
          <View style={[s.pill, { borderColor: TERM.cyan }]}>
            <Text style={[s.pillLabel, { color: TERM.cyan }]}>ITEM COUNT</Text>
            <Text style={[s.pillValue, { color: TERM.white }]}>{cartLoading ? "…" : cartItemCount}</Text>
          </View>
          <View style={[s.pill, { borderColor: TERM.pass }]}>
            <Text style={[s.pillLabel, { color: TERM.pass }]}>UNIQUE SKUs</Text>
            <Text style={[s.pillValue, { color: TERM.white }]}>{cartLoading ? "…" : cartItems.length}</Text>
          </View>
          <View style={[s.pill, { borderColor: cartLoading ? TERM.warn : cartItemCount > 0 ? TERM.pass : TERM.muted }]}>
            <Text style={[s.pillLabel, { color: TERM.muted }]}>STATUS</Text>
            <Text style={[s.pillValue, {
              color: cartLoading ? TERM.warn : cartItemCount > 0 ? TERM.pass : TERM.warn,
              fontSize: 10,
            }]}>
              {cartLoading ? "LOADING" : cartItemCount > 0 ? "SYNCED" : "EMPTY"}
            </Text>
          </View>
        </View>
        {cartItems.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {cartItems.map((item) => (
              <View key={item.medicineId} style={s.cartItemChip}>
                <Text style={s.cartItemName}>{item.name}</Text>
                <Text style={s.cartItemQty}>×{item.quantity}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Directive 4: Force Error */}
      <Pressable onPress={handleForceError} style={[s.btn, s.btnForceError]}>
        <Text style={s.btnText}>⚡ Force Error (broken endpoint)</Text>
      </Pressable>

      {/* Log terminal */}
      <View style={s.terminal}>
        <Text style={s.sectionLabel}>LIVE LOG</Text>
        <ScrollView
          ref={scrollRef}
          style={s.terminalScroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {log.length === 0 && (
            <Text style={s.terminalEmpty}>No logs yet. Run a test above.</Text>
          )}
          {log.map((entry) => (
            <Text key={entry.id} style={[s.logLine, { color: LOG_COLOR[entry.level] }]}>
              <Text style={s.logTs}>{entry.ts}</Text>
              {LOG_PREFIX[entry.level]}
              {entry.msg}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    backgroundColor: TERM.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TERM.border,
    padding: 12,
    gap: 10,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinnerIcon: {
    fontSize: 16,
    color: TERM.ping,
  },
  headerTitle: {
    flex: 1,
    color: TERM.white,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  clearBtn: {
    backgroundColor: TERM.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: TERM.border,
  },
  clearBtnText: {
    color: TERM.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  urlBar: {
    backgroundColor: TERM.surface,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: TERM.border,
  },
  urlLabel: {
    color: TERM.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  urlValue: {
    flex: 1,
    color: TERM.cyan,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnPing: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: TERM.ping,
  },
  btnRun: {
    backgroundColor: "rgba(6,182,212,0.15)",
    borderColor: TERM.cyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnForceError: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderColor: TERM.fail,
  },
  btnText: {
    color: TERM.white,
    fontWeight: "700",
    fontSize: 12,
  },
  pingResult: {
    flex: 1,
    alignItems: "flex-end",
  },
  pingMs: {
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  pingMuted: {
    color: TERM.muted,
    fontSize: 18,
  },
  sectionLabel: {
    color: TERM.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  schemaSection: {
    gap: 6,
  },
  schemaTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  schemaRow: {
    backgroundColor: TERM.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TERM.border,
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  schemaBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 42,
    marginTop: 1,
  },
  schemaBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  schemaName: {
    color: TERM.white,
    fontSize: 11,
    fontWeight: "600",
  },
  schemaMeta: {
    color: TERM.muted,
    fontSize: 10,
    marginTop: 1,
  },
  schemaFail: {
    color: TERM.fail,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  schemaRunBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(30,58,95,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  schemaRunBtnText: {
    color: TERM.cyan,
    fontSize: 16,
    fontWeight: "700",
  },
  stateRow: {
    backgroundColor: TERM.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TERM.border,
    padding: 10,
    gap: 6,
  },
  statePills: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    gap: 2,
  },
  pillLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  pillValue: {
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  cartItemChip: {
    backgroundColor: "rgba(6,182,212,0.12)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cartItemName: {
    color: TERM.white,
    fontSize: 10,
    fontWeight: "600",
  },
  cartItemQty: {
    color: TERM.cyan,
    fontSize: 10,
    fontWeight: "800",
  },
  terminal: {
    gap: 4,
  },
  terminalScroll: {
    backgroundColor: TERM.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TERM.border,
    padding: 8,
    maxHeight: 220,
  },
  terminalEmpty: {
    color: TERM.muted,
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  logLine: {
    fontSize: 11,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  logTs: {
    color: TERM.muted,
    fontSize: 10,
  },
});
