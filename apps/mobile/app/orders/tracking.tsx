import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { fetchOrders, fetchOrder, updateOrderStatus, getErrorMessage, getApiBaseUrl } from "@medicare/api-client";
import type { AppSnapshot } from "@medicare/api-client";
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Linking,
  Alert,
  ActivityIndicator,
  Animated
} from "react-native";
import { io, type Socket } from "socket.io-client";

type Order = AppSnapshot["orders"][number];

type LiveTrackPayload = {
  latitude: number;
  longitude: number;
  status: "PREPARING" | "DISPATCHED" | "NEARBY" | "DELIVERED";
  eta?: string;
};

const STATUS_LABELS: Record<LiveTrackPayload["status"], string> = {
  PREPARING: "⚗️ Preparing",
  DISPATCHED: "🚚 Out for delivery",
  NEARBY: "📍 Driver nearby",
  DELIVERED: "✅ Delivered"
};

const STATUS_COLORS: Record<LiveTrackPayload["status"], string> = {
  PREPARING: "#f59e0b",
  DISPATCHED: "#06b6d4",
  NEARBY: "#8b5cf6",
  DELIVERED: "#10b981"
};

const DELIVERY_STAGES = ["Confirmed", "Preparing", "Out for delivery", "Delivered", "Issue reported"];

// Normalize lat/lng delta to x/y percentage on the map canvas
function coordsToMapPercent(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
  // Latitude is inverted: higher lat = lower y
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 70 + 15;
  return {
    x: Math.min(90, Math.max(10, x)),
    y: Math.min(85, Math.max(15, y))
  };
}

export default function OrdersTrackingScreen() {
  const { orderId: routerOrderId } = useLocalSearchParams<{ orderId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(routerOrderId);
  const [selected, setSelected] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveTrack, setLiveTrack] = useState<LiveTrackPayload | null>(null);

  // Animated driver position
  const [driverX] = useState(() => new Animated.Value(50));
  const [driverY] = useState(() => new Animated.Value(80));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Map geographic bounds (expanded each time we get real coords)
  const mapBoundsRef = useRef({
    minLat: 12.9,
    maxLat: 13.1,
    minLng: 77.5,
    maxLng: 77.7
  });

  const socketRef = useRef<Socket | null>(null);

  // ─── Pulse animation loop ────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // ─── Load orders list ─────────────────────────────────────────────────────
  const loadOrders = useCallback(async (nextSelectedId?: string) => {
    setLoading(true);
    setMessage("");
    try {
      const items = await fetchOrders();
      setOrders(items);
      const preferredId = nextSelectedId ?? items[0]?.id;
      if (preferredId) {
        const detail = await fetchOrder(preferredId);
        setSelected(detail);
        setSelectedId(detail.id);
      } else {
        setSelected(null);
      }
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to load order tracking"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadOrders(selectedId || routerOrderId);
    }, 0);
    return () => clearTimeout(t);
  }, [routerOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── WebSocket connection tied to selectedId ──────────────────────────────
  useEffect(() => {
    if (!selectedId) return;

    // Clean up previous socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(getApiBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket"], // Avoid long-polling in React Native
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      // Subscribe to this specific order's tracking stream
      socket.emit("track_order", { orderId: selectedId });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
    });

    // Primary data stream: live location + status updates
    socket.on("location_update", (payload: LiveTrackPayload) => {
      if (!payload || typeof payload.latitude !== "number" || typeof payload.longitude !== "number") {
        return;
      }

      setLiveTrack(payload);

      // Expand map bounds dynamically if driver is outside current bounds
      const bounds = mapBoundsRef.current;
      const padLat = (bounds.maxLat - bounds.minLat) * 0.1;
      const padLng = (bounds.maxLng - bounds.minLng) * 0.1;
      if (payload.latitude < bounds.minLat) bounds.minLat = payload.latitude - padLat;
      if (payload.latitude > bounds.maxLat) bounds.maxLat = payload.latitude + padLat;
      if (payload.longitude < bounds.minLng) bounds.minLng = payload.longitude - padLng;
      if (payload.longitude > bounds.maxLng) bounds.maxLng = payload.longitude + padLng;

      const pos = coordsToMapPercent(payload.latitude, payload.longitude, bounds);

      Animated.parallel([
        Animated.timing(driverX, {
          toValue: pos.x,
          duration: 1200,
          useNativeDriver: false
        }),
        Animated.timing(driverY, {
          toValue: pos.y,
          duration: 1200,
          useNativeDriver: false
        })
      ]).start();

      // Sync order status label from WebSocket status to order state
      if (payload.status === "DELIVERED") {
        setSelected((prev) =>
          prev ? { ...prev, deliveryStage: "Delivered", status: "Delivered" } : prev
        );
      } else if (payload.status === "DISPATCHED") {
        setSelected((prev) =>
          prev ? { ...prev, deliveryStage: "Out for delivery" } : prev
        );
      } else if (payload.status === "NEARBY") {
        setSelected((prev) =>
          prev ? { ...prev, deliveryStage: "Out for delivery" } : prev
        );
      } else if (payload.status === "PREPARING") {
        setSelected((prev) =>
          prev ? { ...prev, deliveryStage: "Preparing" } : prev
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [selectedId, driverX, driverY]);

  const choose = async (orderId: string) => {
    setMessage("");
    setLiveTrack(null);
    try {
      const detail = await fetchOrder(orderId);
      setSelected(detail);
      setSelectedId(orderId);
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to load this order"));
    }
  };

  const moveTo = async (stage: string) => {
    if (!selected) return;
    setMessage("");
    try {
      const result = await updateOrderStatus(selected.id, {
        status: stage === "Delivered" ? "Delivered" : selected.status,
        deliveryStage: stage
      });
      setSelected(result.order);
      setOrders((current) =>
        current.map((item) => (item.id === result.order.id ? result.order : item))
      );
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to update order"));
    }
  };

  const handleCallDriver = () => {
    Linking.openURL("tel:+919876543210").catch(() => {
      Alert.alert("Call Failed", "Unable to open the dialer. Please call +91 9876543210 directly.");
    });
  };

  const handleQuickMessage = () => {
    Linking.openURL("sms:+919876543210?body=Please%20leave%20package%20at%20the%20gate.").catch(
      () => Alert.alert("Message Failed", "Unable to open the messaging app.")
    );
  };

  if (loading) {
    return (
      <MobileScreen activePath="/orders" title="Order Tracking" subtitle="Live delivery tracking">
        <Card style={styles.loadingCard}>
          <ActivityIndicator color="#1d9e75" size="large" />
          <Text style={styles.loadingText}>Loading tracking...</Text>
        </Card>
      </MobileScreen>
    );
  }

  const driverXInterp = driverX.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });
  const driverYInterp = driverY.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });

  return (
    <MobileScreen activePath="/orders" title="Order Tracking" subtitle="Live delivery tracking">
      {/* Order selector tabs */}
      <View style={styles.ordersHeaderRow}>
        {orders.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => choose(item.id)}
              style={[
                styles.orderSelectButton,
                isSelected ? styles.orderSelectButtonActive : styles.orderSelectButtonInactive
              ]}
              accessibilityLabel={`Select order ${item.id}`}
            >
              <Text style={[styles.orderSelectButtonText, isSelected && styles.textActive]}>
                {item.id}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <>
          {/* Order info card */}
          <Card>
            <View style={styles.orderHeaderRow}>
              <Text style={styles.orderIdTitle}>{selected.id}</Text>
              {/* Socket connection status indicator */}
              <View style={[styles.socketBadge, socketConnected ? styles.socketOnline : styles.socketOffline]}>
                <View style={[styles.socketDot, socketConnected ? styles.socketDotOnline : styles.socketDotOffline]} />
                <Text style={styles.socketText}>{socketConnected ? "Live" : "Polling"}</Text>
              </View>
            </View>
            <Text style={styles.orderMetaText}>
              {selected.status}
              {selected.paymentStatus ? ` | Payment: ${selected.paymentStatus}` : ""}
            </Text>
            <Text style={styles.orderStageText}>
              {selected.deliveryStage ? `Stage: ${selected.deliveryStage}` : selected.eta}
            </Text>
            <Text style={styles.orderPharmacyText}>{selected.pharmacy}</Text>
            <Text style={styles.orderItemsText}>{(selected.items ?? []).join(" • ")}</Text>

            {/* Live WebSocket status overlay */}
            {liveTrack ? (
              <View
                style={[
                  styles.liveStatusRow,
                  { borderColor: STATUS_COLORS[liveTrack.status] + "40" }
                ]}
              >
                <Text
                  style={[styles.liveStatusText, { color: STATUS_COLORS[liveTrack.status] }]}
                >
                  {STATUS_LABELS[liveTrack.status]}
                </Text>
                {liveTrack.eta ? (
                  <Text style={styles.liveEtaText}>ETA: {liveTrack.eta}</Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          {/* Live map card */}
          <Card style={styles.mapCard}>
            <Text style={styles.mapTitle}>
              Live Delivery Route
              {socketConnected ? " 🟢" : " 🔴"}
            </Text>
            <View style={styles.mapContainer}>
              {/* Road network (decorative) */}
              <View style={[styles.roadHorizontal, { top: "80%", left: "10%", right: "50%" }]} />
              <View style={[styles.roadVertical, { left: "50%", top: "25%", height: 100 }]} />
              <View style={[styles.roadHorizontal, { top: "25%", left: "50%", right: "10%" }]} />

              {/* Pharmacy marker */}
              <View style={[styles.marker, { left: "10%", top: "80%" }]}>
                <Text style={styles.markerText}>🏪</Text>
                <Text style={styles.markerLabel}>Pharmacy</Text>
              </View>

              {/* Home marker */}
              <View style={[styles.marker, { left: "90%", top: "25%" }]}>
                <Text style={styles.markerText}>🏠</Text>
                <Text style={styles.markerLabel}>Home</Text>
              </View>

              {/* Driver marker with animated position from WebSocket */}
              <Animated.View
                style={[
                  styles.driverMarker,
                  { left: driverXInterp, top: driverYInterp }
                ]}
              >
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                />
                <Text style={styles.driverEmoji}>🛵</Text>
              </Animated.View>
            </View>

            {liveTrack ? (
              <View style={styles.mapMeta}>
                <Text style={styles.mapMetaText}>
                  {liveTrack.status === "DELIVERED"
                    ? "Driver arrived at your destination!"
                    : liveTrack.status === "NEARBY"
                    ? "Driver is very close — be ready!"
                    : liveTrack.status === "DISPATCHED"
                    ? `Driver is on the way | ETA: ${liveTrack.eta ?? "calculating..."}`
                    : "Order is being prepared at the pharmacy"}
                </Text>
                <Text style={styles.mapCoordsText}>
                  {liveTrack.latitude.toFixed(5)}, {liveTrack.longitude.toFixed(5)}
                </Text>
              </View>
            ) : (
              <View style={styles.mapMeta}>
                <Text style={styles.mapMetaText}>
                  {selected.deliveryStage === "Out for delivery"
                    ? `Driver is on the way | ETA: ${selected.eta ?? "15 mins"}`
                    : selected.deliveryStage === "Delivered"
                    ? "Driver arrived at your destination!"
                    : socketConnected
                    ? "Waiting for driver location update..."
                    : "Driver will start shortly..."}
                </Text>
              </View>
            )}
          </Card>

          {/* Driver info card */}
          <Card>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>RK</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Ramesh Kumar</Text>
                <Text style={styles.driverRating}>⭐ 4.8 (120+ deliveries)</Text>
                <Text style={styles.driverVehicle}>Activa KA-01-EF-1234</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <Pressable
                onPress={handleCallDriver}
                style={[styles.driverBtn, styles.callBtn]}
                accessibilityLabel="Call delivery driver"
              >
                <Text style={styles.callBtnText}>📞 Call Driver</Text>
              </Pressable>
              <Pressable
                onPress={handleQuickMessage}
                style={[styles.driverBtn, styles.chatBtn]}
                accessibilityLabel="Send quick message to driver"
              >
                <Text style={styles.chatBtnText}>💬 Quick Alert</Text>
              </Pressable>
            </View>
          </Card>

          {/* Stage update buttons (admin/debug) */}
          <View style={styles.stagesRow}>
            {DELIVERY_STAGES.map((stage) => (
              <Pressable
                key={stage}
                onPress={() => moveTo(stage)}
                style={styles.stageButton}
                accessibilityLabel={`Move order to ${stage}`}
              >
                <Text style={styles.stageButtonText}>{stage}</Text>
              </Pressable>
            ))}
          </View>

          {/* Timeline */}
          <Card>
            <Text style={styles.timelineTitle}>Tracking timeline</Text>
            {(selected.trackingTimeline ?? []).length > 0 ? (
              (selected.trackingTimeline ?? []).map((t) => (
                <View key={`${selected.id}-${t.stage}`} style={styles.timelineItem}>
                  <Text style={styles.timelineStage}>{t.stage}</Text>
                  <Text style={styles.timelineDesc}>{t.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.timelineEmpty}>No timeline events yet.</Text>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <Text style={styles.emptyText}>No orders found. Place an order to track it here.</Text>
        </Card>
      )}

      {message ? (
        <Text style={styles.messageText}>{message}</Text>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24
  },
  loadingText: { color: "#6b7280", fontWeight: "600" },
  ordersHeaderRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8
  },
  orderSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  orderSelectButtonActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0"
  },
  orderSelectButtonInactive: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb"
  },
  orderSelectButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151"
  },
  textActive: { color: "#0f766e" },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  orderIdTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  socketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1
  },
  socketOnline: { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" },
  socketOffline: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  socketDot: { width: 6, height: 6, borderRadius: 3 },
  socketDotOnline: { backgroundColor: "#10b981" },
  socketDotOffline: { backgroundColor: "#9ca3af" },
  socketText: { fontSize: 10, fontWeight: "700", color: "#374151" },
  orderMetaText: { fontSize: 14, color: "#4b5563", marginTop: 2 },
  orderStageText: {
    fontSize: 14,
    color: "#0f766e",
    fontWeight: "600",
    marginTop: 4
  },
  orderPharmacyText: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  orderItemsText: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  liveStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1
  },
  liveStatusText: { fontWeight: "800", fontSize: 13 },
  liveEtaText: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  mapCard: { padding: 12, backgroundColor: "#f9fafb" },
  mapTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8
  },
  mapContainer: {
    height: 140,
    backgroundColor: "#eef2f6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    position: "relative",
    overflow: "hidden"
  },
  roadHorizontal: {
    position: "absolute",
    height: 10,
    backgroundColor: "#cbd5e1",
    marginTop: -5
  },
  roadVertical: {
    position: "absolute",
    width: 10,
    backgroundColor: "#cbd5e1",
    marginLeft: -5
  },
  marker: {
    position: "absolute",
    width: 60,
    height: 40,
    marginLeft: -30,
    marginTop: -20,
    alignItems: "center",
    justifyContent: "center"
  },
  markerText: { fontSize: 20 },
  markerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2
  },
  driverMarker: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    alignItems: "center",
    justifyContent: "center"
  },
  driverEmoji: { fontSize: 18, zIndex: 2 },
  pulseRing: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(29,158,117,0.2)",
    borderWidth: 1.5,
    borderColor: "#1d9e75"
  },
  mapMeta: { marginTop: 8, alignItems: "center", gap: 3 },
  mapMetaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f766e",
    textAlign: "center"
  },
  mapCoordsText: {
    fontSize: 10,
    color: "#9ca3af",
    fontVariant: ["tabular-nums"]
  },
  driverRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center"
  },
  driverAvatarText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  driverInfo: { flex: 1, gap: 2 },
  driverName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  driverRating: { fontSize: 12, color: "#eab308", fontWeight: "600" },
  driverVehicle: { fontSize: 12, color: "#6b7280" },
  driverActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  driverBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  callBtn: {
    backgroundColor: "#eef9f4",
    borderWidth: 1,
    borderColor: "#1d9e75"
  },
  chatBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db"
  },
  callBtnText: { color: "#0f6e56", fontWeight: "700", fontSize: 12 },
  chatBtnText: { color: "#4b5563", fontWeight: "700", fontSize: 12 },
  stagesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginVertical: 4
  },
  stageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6e1dc"
  },
  stageButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151"
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10
  },
  timelineItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 2
  },
  timelineStage: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151"
  },
  timelineDesc: { fontSize: 12, color: "#6b7280" },
  timelineEmpty: { color: "#9ca3af", fontSize: 13, textAlign: "center" },
  emptyText: { color: "#6b7280", textAlign: "center", paddingVertical: 16 },
  messageText: {
    marginTop: 10,
    color: "#155e75",
    fontWeight: "600",
    textAlign: "center"
  }
});
