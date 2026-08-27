"use client";

import {
  createPaymentSession,
  fetchCart,
  fetchPaymentProviders,
  fetchProfile,
  getErrorMessage,
  submitCheckout,
  type CartData,
  type PaymentProviderData,
  type ProfileData
} from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutConfirmClient() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [providers, setProviders] = useState<PaymentProviderData[]>([]);
  const [sessionMessage, setSessionMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([fetchCart(), fetchProfile(), fetchPaymentProviders()])
      .then(([nextCart, nextProfile, nextProviders]) => {
        setCart(nextCart);
        setProfile(nextProfile);
        setProviders(nextProviders);
      })
      .catch((error) => setMessage(getErrorMessage(error, "Unable to load checkout")))
      .finally(() => setLoading(false));
  }, []);

  async function handlePlaceOrder() {
    setPlacing(true);
    setMessage("");

    try {
      const session = await createPaymentSession({
        provider: paymentMethod.toLowerCase().includes("cash")
          ? "cod"
          : paymentMethod.toLowerCase().includes("stripe")
            ? "stripe"
            : "razorpay",
        orderAmount: cart?.total,
        customerEmail: profile?.email
      });
      setSessionMessage(session.message);

      const result = await submitCheckout({
        paymentMethod,
        addressId: profile?.addresses?.[0]?.id,
        paymentSessionId: session.sessionId
      });

      if (!result.ok || !result.order) {
        setMessage(result.message ?? "Unable to place order");
        return;
      }

      router.push(`/orders/${result.order.id}`);
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to place order"));
    } finally {
      setPlacing(false);
    }
  }

  if (loading || !cart) {
    return <article className="plain-card">Loading checkout...</article>;
  }

  return (
    <>
      <div className="stack-list">
        {cart.items.map((item) => (
          <article className="plain-card" key={item.medicineId}>
            <strong>{item.name}</strong>
            <p>
              Qty {item.quantity} | {item.lineTotal}
            </p>
          </article>
        ))}
      </div>
      <article className="plain-card">
        <strong>Deliver to</strong>
        <p>{profile?.addresses?.[0] ? `${profile.addresses[0].line1}, ${profile.addresses[0].city}, ${profile.addresses[0].state}` : "No saved address available."}</p>
      </article>
      <div className="chip-row">
        {["Razorpay", "Stripe", "Cash on delivery"].map((item) => (
          <button
            className={item === paymentMethod ? "chip active-chip button-reset" : "chip button-reset"}
            key={item}
            onClick={() => setPaymentMethod(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <article className="plain-card">
        <strong>Payment provider scaffolding</strong>
        {providers.map((provider) => (
          <p key={provider.id}>
            {provider.label} | {provider.mode} | {provider.enabled ? "enabled" : "disabled"}
          </p>
        ))}
        {sessionMessage ? <p>{sessionMessage}</p> : null}
      </article>
      <article className="checkout-card">
        <div>
          <span>Items total</span>
          <strong>{cart.subtotal}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{cart.deliveryFee}</strong>
        </div>
        <div>
          <span>Amount payable</span>
          <strong>{cart.total}</strong>
        </div>
      </article>
      <button className="primary-button button-reset" disabled={placing || cart.items.length === 0} onClick={handlePlaceOrder} type="button">
        {placing ? "Placing order..." : "Place Order"}
      </button>
      {message ? <p className="status-copy">{message}</p> : null}
    </>
  );
}
