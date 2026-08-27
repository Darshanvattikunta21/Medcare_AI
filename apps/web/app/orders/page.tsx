"use client";

import { fetchOrders, getErrorMessage } from "@medicare/api-client";
import { useEffect, useState } from "react";
import { AppShell, OrderList, SectionHeading, TrackingCard } from "../../components/app-ui";
import type { AppSnapshot } from "@medicare/api-client";

type OrderItem = AppSnapshot["orders"][number];

export default function OrdersPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setOrderItems)
      .catch((err) => setError(getErrorMessage(err, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell activePath="/orders" title="Orders & Tracking" subtitle="Live status, history, and returns">
      <TrackingCard />
      {loading && <article className="plain-card"><p>Loading orders…</p></article>}
      {error && <article className="plain-card" style={{ color: "red" }}><p>{error}</p></article>}
      {!loading && !error && (
        <>
          <SectionHeading title="Recent orders" action={`${orderItems.length} total`} />
          <OrderList items={orderItems} />
        </>
      )}
      <article className="plain-card">
        <strong>Order support</strong>
        <p>Use the order detail pages to review medicines, payment method, and raise an issue.</p>
      </article>
    </AppShell>
  );
}
