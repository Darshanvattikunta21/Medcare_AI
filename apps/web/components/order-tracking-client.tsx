"use client";

import {
  fetchOrder,
  fetchOrders,
  getErrorMessage,
  updateOrderStatus,
  type AppSnapshot
} from "@medicare/api-client";
import { useEffect, useMemo, useState } from "react";

const deliveryStages = ["Confirmed", "Preparing", "Out for delivery", "Delivered", "Issue reported"];

export function OrderTrackingClient({ initialOrderId }: { initialOrderId?: string }) {
  const [orders, setOrders] = useState<AppSnapshot["orders"]>([]);
  const [selectedId, setSelectedId] = useState(initialOrderId ?? "");
  const [selected, setSelected] = useState<AppSnapshot["orders"][number] | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders(nextSelectedId?: string) {
    setLoading(true);
    setMessage("");
    try {
      const items = await fetchOrders();
      setOrders(items);
      const preferredId = nextSelectedId ?? selectedId ?? items[0]?.id;
      if (preferredId) {
        const detail = await fetchOrder(preferredId);
        setSelected(detail);
        setSelectedId(detail.id);
      } else {
        setSelected(null);
      }
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load order tracking"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    if (!selectedId) return;

    const interval = setInterval(() => {
      fetchOrder(selectedId)
        .then((detail) => {
          setSelected(detail);
        })
        .catch((error) => console.log("[OrderTracking] Silent poll error:", error));
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedId]);

  const [driverProgress, setDriverProgress] = useState(0);

  useEffect(() => {
    if (!selected) return;

    if (selected.deliveryStage === "Out for delivery") {
      const animInterval = setInterval(() => {
        setDriverProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 300);
      return () => clearInterval(animInterval);
    } else if (selected.deliveryStage === "Delivered") {
      setDriverProgress(100);
    } else {
      setDriverProgress(0);
    }
  }, [selected?.deliveryStage]);

  const getDriverCoords = (progress: number) => {
    if (progress <= 33.3) {
      const ratio = progress / 33.3;
      return { x: 10 + (50 - 10) * ratio, y: 80 };
    } else if (progress <= 66.6) {
      const ratio = (progress - 33.3) / 33.3;
      return { x: 50, y: 80 + (25 - 80) * ratio };
    } else {
      const ratio = (progress - 66.6) / 33.4;
      return { x: 50 + (90 - 50) * ratio, y: 25 };
    }
  };

  const statusLabel = useMemo(() => {
    if (!selected) return "";
    return `${selected.status}${selected.paymentStatus ? ` | Payment ${selected.paymentStatus}` : ""}`;
  }, [selected]);

  async function choose(orderId: string) {
    try {
      const detail = await fetchOrder(orderId);
      setSelected(detail);
      setSelectedId(orderId);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load this order"));
    }
  }

  async function moveTo(stage: string) {
    if (!selected) return;

    try {
      const result = await updateOrderStatus(selected.id, {
        status: stage === "Delivered" ? "Delivered" : selected.status,
        deliveryStage: stage
      });
      setSelected(result.order);
      setOrders((current) => current.map((item) => (item.id === result.order.id ? result.order : item)));
      setMessage(`Order moved to ${stage}.`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to update order"));
    }
  }

  const driverCoords = getDriverCoords(driverProgress);

  if (loading) {
    return <article className="plain-card">Loading tracking...</article>;
  }

  return (
    <>
      <div className="chip-row">
        {orders.map((item) => (
          <button
            className={selectedId === item.id ? "chip active-chip button-reset" : "chip button-reset"}
            key={item.id}
            onClick={() => choose(item.id)}
            type="button"
          >
            {item.id}
          </button>
        ))}
      </div>
      {selected ? (
        <>
          <article className="plain-card" style={{ borderLeft: "4px solid #1d9e75" }}>
            <strong>{selected.id}</strong>
            <p>{statusLabel}</p>
            <p>{selected.deliveryStage ? `Stage: ${selected.deliveryStage}` : selected.eta}</p>
            <p>{selected.pharmacy}</p>
            <p>{selected.items.join(" | ")}</p>
          </article>

          {/* Premium Maps Simulation */}
          <article className="plain-card" style={{ padding: "16px", backgroundColor: "#f9fafb" }}>
            <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>Live Delivery Route</strong>
            <div style={{ position: "relative", height: "150px", backgroundColor: "#eef2f6", borderRadius: "12px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
              {/* Roads */}
              <div style={{ position: "absolute", left: "10%", right: "50%", top: "80%", height: "8px", backgroundColor: "#cbd5e1", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", top: "25%", height: "55%", width: "8px", backgroundColor: "#cbd5e1", transform: "translateX(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", right: "10%", top: "25%", height: "8px", backgroundColor: "#cbd5e1", transform: "translateY(-50%)" }} />

              {/* Pharmacy Marker */}
              <div style={{ position: "absolute", left: "10%", top: "80%", transform: "translate(-50%, -50%)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>
                <span style={{ fontSize: "20px" }}>🏪</span>
                <span style={{ fontSize: "9px", fontWeight: "700", color: "#475569", marginTop: "2px" }}>Pharmacy</span>
              </div>

              {/* Home Marker */}
              <div style={{ position: "absolute", left: "90%", top: "25%", transform: "translate(-50%, -50%)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>
                <span style={{ fontSize: "20px" }}>🏠</span>
                <span style={{ fontSize: "9px", fontWeight: "700", color: "#475569", marginTop: "2px" }}>Home</span>
              </div>

              {/* Animated Driver */}
              <div style={{ position: "absolute", left: `${driverCoords.x}%`, top: `${driverCoords.y}%`, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                <div style={{ position: "absolute", width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #1d9e75", backgroundColor: "rgba(29, 158, 117, 0.15)" }} />
                <span style={{ fontSize: "18px" }}>🛵</span>
              </div>
            </div>
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <strong style={{ fontSize: "13px", color: "#0f766e" }}>
                {selected.deliveryStage === "Out for delivery"
                  ? `Driver is on the way | ETA: ${selected.eta || "15 mins"}`
                  : selected.deliveryStage === "Delivered"
                  ? "Driver arrived at your destination!"
                  : "Driver will start shortly..."}
              </strong>
            </div>
          </article>

          {/* Delivery Partner Details Card */}
          <article className="plain-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "14px" }}>
                RK
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong style={{ fontSize: "14px" }}>Ramesh Kumar</strong>
                <span style={{ fontSize: "12px", color: "#eab308", fontWeight: "bold" }}>⭐ 4.8 (120+ deliveries)</span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Activa KA-01-EF-1234</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="chip active-chip button-reset"
                onClick={() => alert("Simulating call connection to driver Ramesh Kumar at +91 9876543210...")}
                type="button"
                style={{ flex: 1, padding: "10px" }}
              >
                📞 Call Driver
              </button>
              <button
                className="chip button-reset"
                onClick={() => alert("Alert sent to driver: 'Please leave package with security gate.'")}
                type="button"
                style={{ flex: 1, padding: "10px", border: "1px solid #cbd5e1" }}
              >
                💬 Quick Alert
              </button>
            </div>
          </article>

          <div className="chip-row">
            {deliveryStages.map((stage) => (
              <button className="chip button-reset" key={stage} onClick={() => moveTo(stage)} type="button">
                {stage}
              </button>
            ))}
          </div>

          <article className="plain-card">
            <strong>Tracking timeline</strong>
            {selected.trackingTimeline?.map((item) => (
              <p key={`${selected.id}-${item.stage}`} style={{ borderBottom: "1px solid #f3f4f6", padding: "6px 0", margin: 0 }}>
                {item.stage} | {item.status} | {item.description}
              </p>
            ))}
          </article>
        </>
      ) : (
        <article className="plain-card">No orders found.</article>
      )}
      {message ? <p className="status-copy">{message}</p> : null}
    </>
  );
}
