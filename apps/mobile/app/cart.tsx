import React, { useEffect, useState } from "react";
import { useCart } from "../lib/use-cart";
import { useAuth } from "../lib/use-auth";
import { fetchAddresses } from "@medicare/api-client";
import type { ProfileAddress } from "@medicare/api-client";
import { Card, MobileScreen, SectionTitle } from "../components/mobile-ui";
import { useRouter } from "expo-router";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";
import { submitCheckout } from "@medicare/api-client";

export default function CartScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart();

  const [addresses, setAddresses] = useState<ProfileAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "stripe" | "cod">("cod");
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    async function loadAddresses() {
      if (token) {
        try {
          const res = await fetchAddresses();
          setAddresses(res);
          if (res.length > 0) {
            setSelectedAddressId(res[0].id);
          }
        } catch {
          // Non-critical — user can navigate to address management
        }
      }
    }
    loadAddresses();
  }, [token]);

  /**
   * Handles Cash on Delivery checkout directly.
   * Stripe and Razorpay are handled by routing to /checkout/payment
   * with the necessary params so the SDK sheet can be initialized there.
   */
  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!selectedAddressId) {
      setCheckoutError("Please select or add a delivery address before proceeding.");
      return;
    }
    setCheckoutError("");

    if (paymentMethod === "cod") {
      setLoading(true);
      try {
        const res = await submitCheckout({
          paymentMethod: "COD",
          addressId: selectedAddressId
        });
        if (res.ok && res.order) {
          await clearCart();
          router.replace(
            `/checkout/success?orderId=${res.order.id}&total=${res.order.total ?? total}&eta=${res.order.eta ?? "2 Hours"}`
          );
        } else {
          setCheckoutError(res.message ?? "Failed to place order. Please try again.");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "An error occurred during checkout.";
        setCheckoutError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For Stripe or Razorpay: navigate to the payment screen which
    // initialises the real native SDK payment sheet.
    const params = new URLSearchParams({
      method: paymentMethod,
      amount: String(total),
      currency: "INR",
      addressId: selectedAddressId
    });
    router.push(`/checkout/payment?${params.toString()}`);
  };

  const activeAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <MobileScreen activePath="/cart" title="Cart & Checkout" subtitle="Review medicines, address, and payment">
      <SectionTitle title="Medicines" action={`${items.length} items`} />

      {items.length === 0 ? (
        <Card>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
            <Pressable onPress={() => router.push("/catalog")} style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse Medicines</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <Card key={item.medicineId}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <Text style={styles.itemPriceText}>{item.price} each</Text>
                  {item.prescriptionRequired ? (
                    <View style={styles.rxBadge}>
                      <Text style={styles.rxBadgeText}>Rx Required</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.quantitySection}>
                  <Pressable
                    onPress={() => updateQuantity(item.medicineId, item.quantity - 1).catch(() => {})}
                    style={styles.spinnerBtn}
                    accessibilityLabel={`Decrease quantity of ${item.name}`}
                  >
                    <Text style={styles.spinnerText}>-</Text>
                  </Pressable>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQuantity(item.medicineId, item.quantity + 1).catch(() => {})}
                    style={styles.spinnerBtn}
                    accessibilityLabel={`Increase quantity of ${item.name}`}
                  >
                    <Text style={styles.spinnerText}>+</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Remove Item",
                        `Remove ${item.name} from cart?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeItem(item.medicineId).catch(() => {})
                          }
                        ]
                      );
                    }}
                    style={styles.removeBtn}
                    accessibilityLabel={`Remove ${item.name} from cart`}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle title="Delivery Address" action="Manage" />
      <Pressable
        onPress={() => router.push("/profile/addresses")}
        accessibilityLabel="Manage delivery addresses"
      >
        <Card>
          {activeAddress ? (
            <View>
              <Text style={styles.addressLabel}>{activeAddress.label}</Text>
              <Text style={styles.addressText}>{activeAddress.line1}</Text>
              <Text style={styles.addressText}>
                {activeAddress.city}, {activeAddress.state} — {activeAddress.pinCode}
              </Text>
              {activeAddress.landmark ? (
                <Text style={styles.addressMeta}>Near: {activeAddress.landmark}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.noAddressRow}>
              <Text style={styles.noAddressText}>No address selected.</Text>
              <Text style={styles.linkText}>Select / Add Address →</Text>
            </View>
          )}
        </Card>
      </Pressable>

      {addresses.length > 1 ? (
        <View style={styles.addressChipsRow}>
          {addresses.map((addr) => (
            <Pressable
              key={addr.id}
              onPress={() => setSelectedAddressId(addr.id)}
              style={[
                styles.addressChip,
                selectedAddressId === addr.id && styles.addressChipActive
              ]}
              accessibilityLabel={`Select ${addr.label} address`}
            >
              <Text
                style={[
                  styles.addressChipText,
                  selectedAddressId === addr.id && styles.addressChipTextActive
                ]}
              >
                {addr.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <SectionTitle title="Payment Mode" />
      <View style={styles.paymentChipsRow}>
        {(
          [
            { id: "cod", label: "💵 Cash on Delivery", note: "Pay on arrival" },
            { id: "stripe", label: "💳 Stripe", note: "Credit / Debit card" },
            { id: "razorpay", label: "🇮🇳 Razorpay", note: "UPI · Wallet · Card" }
          ] as const
        ).map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setPaymentMethod(opt.id)}
            style={[styles.paymentChip, paymentMethod === opt.id && styles.paymentChipActive]}
            accessibilityLabel={`Select ${opt.label} payment method`}
          >
            <Text
              style={[
                styles.paymentChipLabel,
                paymentMethod === opt.id && styles.paymentChipLabelActive
              ]}
            >
              {opt.label}
            </Text>
            <Text style={styles.paymentChipNote}>{opt.note}</Text>
          </Pressable>
        ))}
      </View>

      {(paymentMethod === "stripe" || paymentMethod === "razorpay") && items.length > 0 ? (
        <Card style={styles.paymentInfoCard}>
          <Text style={styles.paymentInfoText}>
            {paymentMethod === "stripe"
              ? "💡 You will be directed to the Stripe secure payment sheet to complete your transaction."
              : "💡 You will be directed to the Razorpay checkout to pay via UPI, wallet, or card."}
          </Text>
        </Card>
      ) : null}

      <SectionTitle title="Price Breakup" />
      <Card>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Items total</Text>
          <Text style={styles.priceVal}>₹{subtotal}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Delivery charges</Text>
          <Text style={styles.priceVal}>₹{items.length > 0 ? deliveryFee : 0}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Final Amount</Text>
          <Text style={styles.totalVal}>₹{total}</Text>
        </View>
      </Card>

      {checkoutError ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{checkoutError}</Text>
        </View>
      ) : null}

      <Pressable
        disabled={loading || items.length === 0}
        onPress={handleCheckout}
        style={[
          styles.checkoutButton,
          (loading || items.length === 0) && styles.disabledButton
        ]}
        accessibilityLabel="Confirm order and proceed to payment"
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.checkoutText}>
            {paymentMethod === "cod"
              ? "Confirm Order"
              : `Pay ₹${total} with ${paymentMethod === "stripe" ? "Stripe" : "Razorpay"}`}
          </Text>
        )}
      </Pressable>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  itemsList: { gap: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  itemBrand: { fontSize: 12, color: "#6b7280" },
  itemPriceText: { fontSize: 13, fontWeight: "600", color: "#1d9e75" },
  rxBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    marginTop: 2
  },
  rxBadgeText: { fontSize: 10, color: "#5b21b6", fontWeight: "700" },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4
  },
  spinnerBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb"
  },
  spinnerText: { fontSize: 16, fontWeight: "700", color: "#111827" },
  quantityText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  removeBtn: { marginLeft: 4, padding: 6 },
  removeText: { color: "#9ca3af", fontWeight: "700", fontSize: 14 },
  emptyContainer: { padding: 24, alignItems: "center", gap: 12 },
  emptyText: { color: "#6b7280", fontWeight: "600", fontSize: 15 },
  browseBtn: {
    backgroundColor: "#1d9e75",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  browseBtnText: { color: "#ffffff", fontWeight: "700" },
  noAddressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  noAddressText: { color: "#6b7280" },
  linkText: { color: "#1d9e75", fontWeight: "700" },
  addressLabel: { fontWeight: "700", color: "#111827", marginBottom: 4 },
  addressText: { color: "#4b5563", fontSize: 13 },
  addressMeta: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  addressChipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: -4
  },
  addressChip: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff"
  },
  addressChipActive: {
    borderColor: "#1d9e75",
    backgroundColor: "#eef9f4"
  },
  addressChipText: { fontSize: 12, color: "#4b5563", fontWeight: "600" },
  addressChipTextActive: { color: "#0f6e56", fontWeight: "700" },
  paymentChipsRow: { gap: 10 },
  paymentChip: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    gap: 2
  },
  paymentChipActive: {
    borderColor: "#1d9e75",
    backgroundColor: "#eef9f4"
  },
  paymentChipLabel: { fontSize: 14, color: "#374151", fontWeight: "700" },
  paymentChipLabelActive: { color: "#0f6e56" },
  paymentChipNote: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  paymentInfoCard: { backgroundColor: "#f0fdf4" },
  paymentInfoText: { color: "#065f46", fontSize: 13, lineHeight: 18 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  priceLabel: { color: "#4b5563" },
  priceVal: { fontWeight: "700", color: "#111827" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 0
  },
  totalLabel: { fontWeight: "800", color: "#111827" },
  totalVal: { fontSize: 16, fontWeight: "800", color: "#1d9e75" },
  checkoutButton: {
    backgroundColor: "#1d9e75",
    borderRadius: 14,
    padding: 15,
    marginTop: 20,
    alignItems: "center"
  },
  disabledButton: { backgroundColor: "#9ca3af" },
  checkoutText: { color: "#ffffff", fontWeight: "800", textAlign: "center", fontSize: 15 },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginTop: 8
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13
  }
});
