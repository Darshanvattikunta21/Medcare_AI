import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import RazorpayCheckout from "react-native-razorpay";
import { createPaymentIntent, submitCheckout, getErrorMessage } from "@medicare/api-client";
import { MobileScreen, Card } from "../../components/mobile-ui";
import { useAuth } from "../../lib/use-auth";
import { useCart } from "../../lib/use-cart";

type PaymentStage =
  | "initializing"
  | "ready"
  | "processing"
  | "success"
  | "failed"
  | "cancelled";

export default function CheckoutPaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { method, amount, currency, addressId } = useLocalSearchParams<{
    method: string;
    amount: string;
    currency: string;
    addressId: string;
  }>();

  const [stage, setStage] = useState<PaymentStage>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [intentOrderId, setIntentOrderId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const numericAmount = Math.round(Number(amount ?? "0"));
  const currencyCode = (currency ?? "INR").toUpperCase();
  const provider = method === "stripe" ? "stripe" : "razorpay";

  // ─── Initialise payment intent on mount ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!addressId || numericAmount <= 0) {
        setErrorMessage("Invalid payment parameters. Please return to cart.");
        setStage("failed");
        return;
      }

      try {
        const intent = await createPaymentIntent({
          provider,
          amount: numericAmount,
          currency: currencyCode,
          addressId
        });

        if (!mounted) return;
        setIntentOrderId(intent.orderId);

        const isMockIntent =
          !!(intent.paymentIntentClientSecret && intent.paymentIntentClientSecret.includes("mock")) ||
          !!(intent.razorpayOrderId && intent.razorpayOrderId.includes("mock"));
        setIsMock(isMockIntent);

        if (provider === "stripe") {
          if (isMockIntent) {
            if (mounted) setStage("ready");
            return;
          }

          if (
            !intent.paymentIntentClientSecret ||
            !intent.ephemeralKeySecret ||
            !intent.customerId
          ) {
            throw new Error("Incomplete Stripe credentials received from server.");
          }

          const { error: initError } = await initPaymentSheet({
            paymentIntentClientSecret: intent.paymentIntentClientSecret,
            customerEphemeralKeySecret: intent.ephemeralKeySecret,
            customerId: intent.customerId,
            merchantDisplayName: "MediCare AI",
            applePay: { merchantCountryCode: "IN" },
            googlePay: {
              merchantCountryCode: "IN",
              testEnv: __DEV__
            },
            style: "alwaysLight",
            returnURL: "medicare://checkout/return"
          });

          if (initError) {
            throw new Error(initError.message);
          }
        }

        if (mounted) setStage("ready");
      } catch (err) {
        if (!mounted) return;
        setErrorMessage(getErrorMessage(err, "Failed to initialise payment. Please try again."));
        setStage("failed");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [provider, numericAmount, currencyCode, addressId]);

  // ─── Simulated payment flow ──────────────────────────────────────────────
  const simulatePayment = useCallback(async (success: boolean) => {
    if (success) {
      setStage("processing");
      try {
        const res = await submitCheckout({
          paymentMethod: provider === "stripe" ? "Stripe" : "Razorpay",
          addressId,
          paymentReference: intentOrderId ?? `mock-ref-${Date.now()}`
        });
        if (res.ok && res.order) {
          await clearCart();
          router.replace(
            `/checkout/success?orderId=${res.order.id}&total=${res.order.total ?? numericAmount}&eta=${res.order.eta ?? "2 Hours"}`
          );
        } else {
          setErrorMessage(res.message ?? "Order placement failed after simulated payment.");
          setStage("failed");
        }
      } catch (err) {
        setErrorMessage(getErrorMessage(err, "Payment succeeded but order placement failed. Contact support."));
        setStage("failed");
      }
    } else {
      setErrorMessage("Simulated payment transaction failure.");
      setStage("failed");
    }
  }, [provider, addressId, intentOrderId, numericAmount, clearCart, router]);

  // ─── Stripe payment sheet flow ────────────────────────────────────────────
  const handleStripePayment = useCallback(async () => {
    setStage("processing");
    setErrorMessage(null);

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === "Canceled") {
        setStage("cancelled");
        return;
      }
      setErrorMessage(error.message);
      setStage("failed");
      return;
    }

    // Payment succeeded: place order on backend
    try {
      const res = await submitCheckout({
        paymentMethod: "Stripe",
        addressId,
        paymentReference: intentOrderId ?? undefined
      });
      if (res.ok && res.order) {
        await clearCart();
        router.replace(
          `/checkout/success?orderId=${res.order.id}&total=${res.order.total ?? numericAmount}&eta=${res.order.eta ?? "2 Hours"}`
        );
      } else {
        setErrorMessage(res.message ?? "Order placement failed after payment.");
        setStage("failed");
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Payment succeeded but order placement failed. Contact support."));
      setStage("failed");
    }
  }, [presentPaymentSheet, addressId, intentOrderId, numericAmount, clearCart, router]);

  // ─── Razorpay checkout flow ───────────────────────────────────────────────
  const handleRazorpayPayment = useCallback(async () => {
    if (!intentOrderId) return;
    setStage("processing");
    setErrorMessage(null);

    try {
      // Fetch intent details again to get Razorpay-specific tokens
      const intent = await createPaymentIntent({
        provider: "razorpay",
        amount: numericAmount,
        currency: currencyCode,
        addressId,
        orderId: intentOrderId
      });

      const razorpayKeyId = intent.razorpayKeyId;
      const razorpayOrderId = intent.razorpayOrderId;

      if (!razorpayKeyId || !razorpayOrderId) {
        throw new Error("Razorpay credentials not returned by server.");
      }

      const options = {
        description: "MediCare AI Order Payment",
        image: "https://api.medicareai.com/assets/logo.png",
        currency: currencyCode,
        key: razorpayKeyId,
        amount: numericAmount * 100, // Razorpay uses paise (smallest unit)
        order_id: razorpayOrderId,
        name: "MediCare AI",
        prefill: {
          email: user?.email ?? "",
          contact: user?.phone ?? "",
          name: user?.name ?? ""
        },
        theme: { color: "#1d9e75" }
      };

      const paymentData = await RazorpayCheckout.open(options);

      // paymentData contains razorpay_payment_id, razorpay_order_id, razorpay_signature
      const res = await submitCheckout({
        paymentMethod: "Razorpay",
        addressId,
        paymentReference: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpaySignature: paymentData.razorpay_signature
      });

      if (res.ok && res.order) {
        await clearCart();
        router.replace(
          `/checkout/success?orderId=${res.order.id}&total=${res.order.total ?? numericAmount}&eta=${res.order.eta ?? "2 Hours"}`
        );
      } else {
        setErrorMessage(res.message ?? "Order placement failed after payment.");
        setStage("failed");
      }
    } catch (err: unknown) {
      // Razorpay SDK throws { code, description } on cancellation
      const rzpErr = err as { code?: number; description?: string };
      if (rzpErr?.code === 0 || rzpErr?.description?.toLowerCase().includes("cancel")) {
        setStage("cancelled");
        return;
      }
      setErrorMessage(
        rzpErr?.description ?? getErrorMessage(err, "Razorpay payment failed. Please try again.")
      );
      setStage("failed");
    }
  }, [intentOrderId, numericAmount, currencyCode, addressId, user, clearCart, router]);

  const handlePayNow = () => {
    if (provider === "stripe") {
      handleStripePayment();
    } else {
      handleRazorpayPayment();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (stage === "initializing") {
      return (
        <Card style={styles.centeredCard}>
          <ActivityIndicator size="large" color="#1d9e75" />
          <Text style={styles.statusText}>Setting up secure payment...</Text>
          <Text style={styles.statusSubtext}>Connecting to payment gateway</Text>
        </Card>
      );
    }

    if (stage === "processing") {
      return (
        <Card style={styles.centeredCard}>
          <ActivityIndicator size="large" color="#1d9e75" />
          <Text style={styles.statusText}>Processing payment...</Text>
          <Text style={styles.statusSubtext}>Please do not close the app</Text>
        </Card>
      );
    }

    if (stage === "cancelled") {
      return (
        <>
          <Card style={styles.centeredCard}>
            <Text style={styles.cancelIcon}>↩</Text>
            <Text style={styles.statusText}>Payment Cancelled</Text>
            <Text style={styles.statusSubtext}>
              You cancelled the payment. Your cart items are still saved.
            </Text>
          </Card>
          <Pressable onPress={() => router.replace("/cart")} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Return to Cart</Text>
          </Pressable>
        </>
      );
    }

    if (stage === "failed") {
      return (
        <>
          <Card style={styles.centeredCard}>
            <Text style={styles.failIcon}>✕</Text>
            <Text style={[styles.statusText, { color: "#dc2626" }]}>Payment Failed</Text>
            <Text style={styles.statusSubtext}>
              {errorMessage ?? "An unexpected error occurred."}
            </Text>
          </Card>
          <Pressable
            onPress={() => {
              setStage("initializing");
              setErrorMessage(null);
            }}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.replace(
                `/checkout/error?message=${encodeURIComponent(
                  errorMessage ?? "Payment was declined."
                )}`
              )
            }
            style={styles.errorPageBtn}
          >
            <Text style={styles.errorPageBtnText}>View Error Details</Text>
          </Pressable>
        </>
      );
    }

    // stage === "ready"
    return (
      <>
        <Card>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue}>
              {provider === "stripe"
                ? `💳 Stripe${isMock ? " (Simulated)" : ""}`
                : `🇮🇳 Razorpay${isMock ? " (Simulated)" : ""}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={[styles.summaryValue, styles.amountValue]}>
              ₹{numericAmount}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <Text style={styles.summaryLabel}>Currency</Text>
            <Text style={styles.summaryValue}>{currencyCode}</Text>
          </View>
        </Card>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            {provider === "stripe"
              ? "Secured by Stripe. Your card details are never stored on our servers."
              : "Secured by Razorpay. PCI-DSS Level 1 certified gateway."}
          </Text>
        </View>

        {isMock ? (
          <Card style={styles.simulationBanner}>
            <Text style={styles.simulationTitle}>🛠 Developer Simulation Mode</Text>
            <Text style={styles.simulationText}>
              No live credentials detected. You can safely simulate payment outcomes:
            </Text>
            <View style={styles.simulationButtons}>
              <Pressable
                onPress={() => simulatePayment(true)}
                style={[styles.simBtn, styles.simBtnSuccess]}
              >
                <Text style={styles.simBtnText}>✓ Simulate Success</Text>
              </Pressable>
              <Pressable
                onPress={() => simulatePayment(false)}
                style={[styles.simBtn, styles.simBtnFail]}
              >
                <Text style={styles.simBtnText}>✕ Simulate Failure</Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Pressable
            onPress={handlePayNow}
            style={styles.payNowBtn}
            accessibilityLabel={`Pay ₹${numericAmount} with ${provider}`}
          >
            <Text style={styles.payNowBtnText}>
              Pay ₹{numericAmount}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.replace("/cart")}
          style={styles.cancelBtn}
          accessibilityLabel="Cancel payment and return to cart"
        >
          <Text style={styles.cancelBtnText}>Cancel — Return to Cart</Text>
        </Pressable>
      </>
    );
  };

  return (
    <MobileScreen
      activePath="/checkout/payment"
      title="Secure Payment"
      subtitle={`${provider === "stripe" ? "Stripe" : "Razorpay"} · ₹${numericAmount}`}
    >
      {renderContent()}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  centeredCard: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12
  },
  statusText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center"
  },
  statusSubtext: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18
  },
  cancelIcon: {
    fontSize: 36,
    color: "#f59e0b"
  },
  failIcon: {
    fontSize: 36,
    color: "#dc2626"
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  summaryLabel: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14
  },
  summaryValue: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14
  },
  amountValue: {
    fontSize: 20,
    color: "#1d9e75",
    fontWeight: "900"
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0"
  },
  securityIcon: {
    fontSize: 16
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#065f46",
    lineHeight: 18,
    fontWeight: "500"
  },
  payNowBtn: {
    backgroundColor: "#1d9e75",
    borderRadius: 14,
    padding: 16,
    alignItems: "center"
  },
  payNowBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 17
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  cancelBtnText: {
    color: "#6b7280",
    fontWeight: "700"
  },
  retryBtn: {
    backgroundColor: "#1d9e75",
    borderRadius: 14,
    padding: 14,
    alignItems: "center"
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15
  },
  errorPageBtn: {
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fef2f2"
  },
  errorPageBtnText: {
    color: "#dc2626",
    fontWeight: "700"
  },
  simulationBanner: {
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
    borderWidth: 1.5,
    padding: 16,
    borderRadius: 20,
    gap: 10
  },
  simulationTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#6b21a8"
  },
  simulationText: {
    fontSize: 12,
    color: "#581c87",
    lineHeight: 18,
    fontWeight: "500"
  },
  simulationButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  simBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  simBtnSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0"
  },
  simBtnFail: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5"
  },
  simBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e1b4b"
  }
});
