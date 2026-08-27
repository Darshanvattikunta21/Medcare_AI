import { useRouter, useLocalSearchParams } from "expo-router";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { Pressable, Text, StyleSheet, View } from "react-native";

export default function CheckoutErrorScreen() {
  const router = useRouter();
  const { message } = useLocalSearchParams<{ message: string }>();

  return (
    <MobileScreen activePath="/checkout/error" title="Payment Failed" subtitle="Something went wrong during checkout">
      <Card>
        <View style={styles.errorIconWrapper}>
          <Text style={styles.errorIcon}>✕</Text>
        </View>

        <Text style={styles.title}>Transaction Unsuccessful</Text>
        <Text style={styles.description}>
          {message || "The payment gateway rejected this transaction. Please verify card details and retry."}
        </Text>

        <Pressable
          onPress={() => router.replace("/cart")}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry Payment</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/cart")}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Back to Cart</Text>
        </Pressable>
      </Card>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  errorIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fee2e2",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20
  },
  errorIcon: {
    color: "#ef4444",
    fontSize: 28,
    fontWeight: "800"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: "#ef4444",
    borderRadius: 14,
    padding: 14,
    alignItems: "center"
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#ffffff"
  },
  cancelButtonText: {
    color: "#4b5563",
    fontWeight: "700"
  }
});
