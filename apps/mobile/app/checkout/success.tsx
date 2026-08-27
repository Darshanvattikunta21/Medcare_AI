import { useRouter, useLocalSearchParams } from "expo-router";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { Pressable, Text, StyleSheet, View } from "react-native";

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { orderId, total, eta } = useLocalSearchParams<{ orderId: string; total: string; eta: string }>();

  return (
    <MobileScreen activePath="/checkout/success" title="Order Confirmed" subtitle="Your prescription request was received">
      <Card>
        <View style={styles.successIconWrapper}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Thank you for your order!</Text>
        <Text style={styles.subtitle}>
          Your order has been routed to our pharmacy partner. We have sent a confirmation email to you.
        </Text>

        <View style={styles.detailsBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Number</Text>
            <Text style={styles.value}>{orderId || "MC-004522"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>₹{total || "0"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated Delivery</Text>
            <Text style={styles.value}>{eta || "2 Hours"}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/orders/tracking?orderId=${orderId}`)}
          style={styles.trackButton}
        >
          <Text style={styles.trackButtonText}>Track Order Status</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/catalog")}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </Pressable>
      </Card>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d1fae5",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20
  },
  successIcon: {
    color: "#10b981",
    fontSize: 28,
    fontWeight: "800"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 24
  },
  detailsBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
    marginBottom: 24
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "600"
  },
  value: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700"
  },
  trackButton: {
    backgroundColor: "#1d9e75",
    borderRadius: 14,
    padding: 14,
    alignItems: "center"
  },
  trackButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  continueButton: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#ffffff"
  },
  continueButtonText: {
    color: "#0f6e56",
    fontWeight: "700"
  }
});
