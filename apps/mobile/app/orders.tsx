import React, { useEffect, useState, useCallback } from "react";
import { fetchOrders, getErrorMessage } from "@medicare/api-client";
import { Card, MobileScreen, OrderCards, SectionTitle } from "../components/mobile-ui";
import { Text, View, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { OfflineBanner } from "../lib/offline-banner";
import { useAuth } from "../lib/use-auth";

type OrderSummary = Awaited<ReturnType<typeof fetchOrders>>[number];

export default function OrdersScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied">("unknown");

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNetworkError(false);
    try {
      const items = await fetchOrders();
      setOrders(items);
      setError(null);
    } catch (err) {
      const msg = getErrorMessage(err, "Unable to load orders right now.");
      setError(msg);
      const isNetwork =
        err instanceof Error &&
        (msg.includes("Network") || msg.includes("fetch") || msg.includes("timeout"));
      if (isNetwork) setNetworkError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Request foreground location permission and get current position
  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationPermission("denied");
        return;
      }
      setLocationPermission("granted");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setUserCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch {
      // Location fetch failure is non-critical; map falls back to static view
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadOrders();
      requestLocation();
    });
  }, [loadOrders, requestLocation]);

  const handleTrackOrder = (orderId: string) => {
    router.push(`/orders/tracking?orderId=${orderId}`);
  };

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );
  const nearbyOrder = activeOrders[0] ?? null;

  return (
    <MobileScreen
      activePath="/orders"
      title="Orders & Tracking"
      subtitle="Live status, history, and returns"
    >
      <OfflineBanner
        visible={networkError}
        message="Cannot reach server. Showing last known orders."
        variant="offline"
        onDismiss={() => setNetworkError(false)}
      />

      {/* Live delivery status hero card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroMapPlaceholder}>
          <Text style={styles.heroMapEmoji}>🗺️</Text>
          {nearbyOrder ? (
            <>
              <Text style={styles.heroTitle}>
                {nearbyOrder.deliveryStage === "Out for delivery"
                  ? "🚚 Delivery partner is on the way"
                  : nearbyOrder.deliveryStage === "Preparing"
                  ? "⚗️ Order is being prepared"
                  : nearbyOrder.deliveryStage === "Delivered"
                  ? "✅ Order delivered"
                  : "📦 Order confirmed"}
              </Text>
              <Text style={styles.heroSubtitle}>
                ETA: {nearbyOrder.eta ?? "Updating..."} · {nearbyOrder.pharmacy}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>No active deliveries</Text>
              <Text style={styles.heroSubtitle}>
                Place an order to see live delivery tracking here.
              </Text>
            </>
          )}

          {userCoords ? (
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsText}>
                📍 {userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}
              </Text>
            </View>
          ) : locationPermission === "denied" ? (
            <Pressable
              onPress={() => Linking.openSettings()}
              style={styles.locationDeniedBtn}
              accessibilityLabel="Enable location access in settings"
            >
              <Text style={styles.locationDeniedText}>Enable location in Settings →</Text>
            </Pressable>
          ) : null}
        </View>

        {nearbyOrder ? (
          <Pressable
            onPress={() => handleTrackOrder(nearbyOrder.id)}
            style={styles.trackLiveBtn}
            accessibilityLabel={`Track order ${nearbyOrder.id} live`}
          >
            <Text style={styles.trackLiveBtnText}>📡 Track Live</Text>
          </Pressable>
        ) : null}
      </Card>

      {error && !networkError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadOrders} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionTitle title="Recent orders" action={`${orders.length} total`} />

      {loading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color="#1d9e75" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No orders found. Browse medicines to get started.</Text>
        </Card>
      ) : (
        <>
          <OrderCards items={orders} />
          {/* Quick track buttons for active orders */}
          {activeOrders.length > 0 ? (
            <View style={styles.quickTrackSection}>
              <Text style={styles.quickTrackTitle}>Quick Track</Text>
              <View style={styles.quickTrackRow}>
                {activeOrders.slice(0, 3).map((order) => (
                  <Pressable
                    key={order.id}
                    onPress={() => handleTrackOrder(order.id)}
                    style={styles.quickTrackChip}
                    accessibilityLabel={`Track order ${order.id}`}
                  >
                    <Text style={styles.quickTrackId} numberOfLines={1}>{order.id}</Text>
                    <Text style={styles.quickTrackStage}>
                      {order.deliveryStage ?? order.status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12,
    overflow: "hidden"
  },
  heroMapPlaceholder: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#f0fdf9",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0"
  },
  heroMapEmoji: {
    fontSize: 36,
    marginBottom: 4
  },
  heroTitle: {
    fontWeight: "800",
    color: "#111827",
    fontSize: 15,
    textAlign: "center"
  },
  heroSubtitle: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18
  },
  coordsBadge: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginTop: 4
  },
  coordsText: {
    fontSize: 11,
    color: "#065f46",
    fontWeight: "600"
  },
  locationDeniedBtn: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a"
  },
  locationDeniedText: {
    fontSize: 11,
    color: "#92400e",
    fontWeight: "600"
  },
  trackLiveBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)"
  },
  trackLiveBtnText: {
    color: "#34d399",
    fontWeight: "800",
    fontSize: 14
  },
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fca5a5"
  },
  errorText: {
    color: "#991b1b",
    fontWeight: "600",
    fontSize: 13,
    flex: 1
  },
  retryBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#dc2626",
    borderRadius: 8
  },
  retryText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  loadingCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20
  },
  loadingText: { color: "#6b7280", fontWeight: "600" },
  emptyText: { color: "#6b7280", textAlign: "center", paddingVertical: 16 },
  quickTrackSection: { gap: 8, marginTop: 4 },
  quickTrackTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  quickTrackRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickTrackChip: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    gap: 2
  },
  quickTrackId: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 12,
    maxWidth: 100
  },
  quickTrackStage: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10
  }
});
