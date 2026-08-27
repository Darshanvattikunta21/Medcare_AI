"use client";

import {
  fetchCart,
  fetchProfile,
  getErrorMessage,
  removeCartItem,
  updateCartItem,
  type CartData,
  type ProfileData
} from "@medicare/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CartView() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");

    try {
      const [nextCart, nextProfile] = await Promise.all([fetchCart(), fetchProfile()]);
      setCart(nextCart);
      setProfile(nextProfile);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load cart"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeQuantity(medicineId: string, quantity: number) {
    try {
      const result = await updateCartItem(medicineId, { quantity });
      setCart(result.cart);
      window.dispatchEvent(new CustomEvent("medicare:cart-updated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to update cart"));
    }
  }

  async function removeItem(medicineId: string) {
    try {
      const result = await removeCartItem(medicineId);
      setCart(result.cart);
      window.dispatchEvent(new CustomEvent("medicare:cart-updated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to remove item"));
    }
  }

  if (loading || !cart) {
    return <article className="plain-card">Loading cart...</article>;
  }

  return (
    <>
      <div className="stack-list">
        {cart.items.length === 0 ? (
          <article className="plain-card">
            <strong>Your cart is empty</strong>
            <p>Add medicines from the catalog to continue to checkout.</p>
          </article>
        ) : (
          cart.items.map((item) => (
            <article className="cart-card cart-card-vertical" key={item.medicineId}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.brand}</p>
                <p>{item.prescriptionRequired ? "Prescription required" : "OTC available"}</p>
              </div>
              <strong>{item.lineTotal}</strong>
              <div className="chip-row">
                <button className="chip button-reset" onClick={() => changeQuantity(item.medicineId, item.quantity - 1)} type="button">
                  -
                </button>
                <span className="chip active-chip">{item.quantity}</span>
                <button className="chip button-reset" onClick={() => changeQuantity(item.medicineId, item.quantity + 1)} type="button">
                  +
                </button>
                <button className="chip button-reset" onClick={() => removeItem(item.medicineId)} type="button">
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      <article className="plain-card">
        <strong>Delivery address</strong>
        <p>{profile?.addresses?.[0] ? `${profile.addresses[0].line1}, ${profile.addresses[0].city}, ${profile.addresses[0].state}` : "Add an address in your profile."}</p>
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
          <span>Final amount</span>
          <strong>{cart.total}</strong>
        </div>
      </article>
      {message ? <p className="status-copy">{message}</p> : null}
      <Link className="primary-button" href="/checkout/confirm">
        Proceed to Checkout
      </Link>
      <Link className="outline-button" href="/catalog">
        Add More Medicines
      </Link>
    </>
  );
}
