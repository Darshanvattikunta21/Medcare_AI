import { Stack, useRouter, usePathname } from "expo-router";
import { AppSnapshotProvider } from "../lib/use-app-snapshot";
import { AuthProvider, useAuth } from "../lib/use-auth";
import { CartProvider } from "../lib/use-cart";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import { setApiBaseUrl } from "@medicare/api-client";

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder";

/**
 * Derives the correct API base URL at runtime.
 *
 * In Expo Go / dev builds, Constants.expoConfig.hostUri contains the Metro
 * bundler address (e.g. "192.168.1.50:8081"). We extract just the host IP
 * and point it at port 4000 where the API server runs.
 *
 * In production, EXPO_PUBLIC_API_BASE_URL from the env is used directly.
 */
function bootstrapApiUrl() {
  // Production: respect the explicit env variable
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    setApiBaseUrl(envUrl);
    return;
  }

  // Dev: derive from the Expo Metro server's host so the IP is always correct
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (hostUri) {
    // hostUri looks like "192.168.1.50:8081" — take just the host part
    const host = hostUri.split(":")[0];
    const apiUrl = `http://${host}:4000`;
    setApiBaseUrl(apiUrl);
    return;
  }

  // Final fallback: use the env value as-is (may be localhost in some simulators)
  if (envUrl) {
    setApiBaseUrl(envUrl);
  }
}

// Call immediately at module evaluation time so it runs before any API calls
bootstrapApiUrl();


function AppNavigation() {
  const { token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = pathname.startsWith("/auth") || pathname === "/login";

    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/");
    }
  }, [token, loading, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <ActivityIndicator size="large" color="#1d9e75" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.medicareai.app"
      urlScheme="medicareai"
    >
      <AppSnapshotProvider>
        <AuthProvider>
          <CartProvider>
            <AppNavigation />
          </CartProvider>
        </AuthProvider>
      </AppSnapshotProvider>
    </StripeProvider>
  );
}

