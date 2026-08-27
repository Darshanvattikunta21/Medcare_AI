"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchAdminSettings,
  updateAdminStock,
  AdminSettingsResponse,
  getErrorMessage
} from "@medicare/api-client";
import { SectionHeading } from "./app-ui";

const CATEGORY_ICONS: Record<string, string> = {
  tablets: "💊",
  injections: "💉",
  devices: "🩺",
  ayurveda: "🌿",
  baby: "🍼",
  "first-aid": "🩹"
};

export function PharmaHomeView() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetchAdminSettings();
      setData(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function quickRestock(medicineId: string) {
    setUpdatingId(medicineId);
    try {
      await updateAdminStock({ medicineId, stockStatus: "in_stock" });
      if (data) {
        setData({
          ...data,
          medicines: data.medicines.map((m) =>
            m.id === medicineId ? { ...m, stockStatus: "in_stock" } : m
          )
        });
      }
    } catch (err) {
      alert("Failed to restock: " + getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  const allMeds = data?.medicines ?? [];
  const inStock = allMeds.filter((m) => m.stockStatus === "in_stock");
  const limited = allMeds.filter((m) => m.stockStatus === "limited");
  const outOfStock = allMeds.filter((m) => m.stockStatus === "out_of_stock");
  const alertMeds = [...outOfStock, ...limited];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Pharma Store Hero Card */}
      <article
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #0d9488 100%)",
          color: "#ffffff",
          padding: "22px 20px",
          borderRadius: "20px",
          boxShadow: "0 12px 30px rgba(6, 78, 59, 0.25)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span
              style={{
                display: "inline-block",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(4px)",
                color: "#a7f3d0",
                fontSize: "0.72rem",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "999px",
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}
            >
              🏥 Pharmacy Operations Portal
            </span>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "10px 0 4px", color: "#ffffff" }}>
              CityCare Central Pharmacy
            </h2>
            <p style={{ color: "#ccfbf1", fontSize: "0.85rem", margin: 0 }}>
              Store ID: #PH-4921 · License: DL-MH-2026-8849
            </p>
          </div>
          <div style={{ fontSize: "2.4rem", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}>🏪</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Link
            href="/admin"
            style={{
              flex: 1,
              background: "#ffffff",
              color: "#0f766e",
              fontWeight: 800,
              fontSize: "0.88rem",
              padding: "10px 14px",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            📦 Open Stock Manager
          </Link>
          <Link
            href="/admin"
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.88rem",
              padding: "10px 14px",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none"
            }}
          >
            🚚 Delivery Rates
          </Link>
        </div>
      </article>

      {/* Live Store Status Matrix */}
      <SectionHeading title="Real-Time Inventory Status" action="50 Items" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 14,
            padding: "14px 10px",
            textAlign: "center"
          }}
        >
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#15803d", display: "block" }}>
            {loading ? "…" : inStock.length}
          </span>
          <small style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>
            🟢 In Stock
          </small>
        </div>

        <div
          style={{
            background: "#fefce8",
            border: "1px solid #fef08a",
            borderRadius: 14,
            padding: "14px 10px",
            textAlign: "center"
          }}
        >
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#a16207", display: "block" }}>
            {loading ? "…" : limited.length}
          </span>
          <small style={{ fontSize: "0.72rem", color: "#854d0e", fontWeight: 800, textTransform: "uppercase" }}>
            🟡 Limited
          </small>
        </div>

        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 14,
            padding: "14px 10px",
            textAlign: "center"
          }}
        >
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#b91c1c", display: "block" }}>
            {loading ? "…" : outOfStock.length}
          </span>
          <small style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 800, textTransform: "uppercase" }}>
            🔴 Out of Stock
          </small>
        </div>
      </div>

      {/* Critical Refill Alerts */}
      {alertMeds.length > 0 && (
        <>
          <SectionHeading title="⚠️ Stock Attention Needed" action={`${alertMeds.length} Items`} />
          <div className="stack-list">
            {alertMeds.slice(0, 4).map((med) => {
              const isOut = med.stockStatus === "out_of_stock";
              const isUpdating = updatingId === med.id;
              const icon = CATEGORY_ICONS[med.category] ?? "💊";
              return (
                <article
                  key={med.id}
                  className="plain-card"
                  style={{
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderLeft: `4px solid ${isOut ? "#dc2626" : "#d97706"}`
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: "1.4rem" }}>{icon}</div>
                    <div>
                      <strong style={{ fontSize: "0.88rem", display: "block" }}>{med.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: isOut ? "#dc2626" : "#d97706", fontWeight: 700 }}>
                        {isOut ? "🔴 Currently Out of Stock" : "🟡 Limited Stock"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => quickRestock(med.id)}
                    className="button-reset"
                    style={{
                      background: "#10b981",
                      color: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {isUpdating ? "Saving…" : "Restock 🟢"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Store Operations Grid */}
      <SectionHeading title="Pharma Operations Hub" action="Actions" />
      <div className="metric-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <article className="plain-card" style={{ padding: 16, cursor: "pointer", transition: "transform 0.15s" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📦</div>
            <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>Inventory Matrix</strong>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0" }}>
              Toggle stock availability across all 6 categories.
            </p>
          </article>
        </Link>

        <Link href="/admin" style={{ textDecoration: "none" }}>
          <article className="plain-card" style={{ padding: 16, cursor: "pointer", transition: "transform 0.15s" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🚚</div>
            <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>Delivery Engine</strong>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0" }}>
              Base ₹{data?.deliveryBaseCharge ?? 20} + ₹{data?.deliveryRatePerKm ?? 5}/km.
            </p>
          </article>
        </Link>

        <Link href="/catalog" style={{ textDecoration: "none" }}>
          <article className="plain-card" style={{ padding: 16, cursor: "pointer", transition: "transform 0.15s" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
            <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>Live Patient Catalog</strong>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0" }}>
              Preview customer view & retail pricing.
            </p>
          </article>
        </Link>

        <Link href="/orders" style={{ textDecoration: "none" }}>
          <article className="plain-card" style={{ padding: 16, cursor: "pointer", transition: "transform 0.15s" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
            <strong style={{ fontSize: "1rem", color: "var(--ink)" }}>Dispatch Orders</strong>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0" }}>
              Monitor active delivery stages & ETAs.
            </p>
          </article>
        </Link>
      </div>

      {/* Dispatch Pricing Summary Banner */}
      <article
        className="plain-card"
        style={{
          padding: 16,
          background: "var(--brand-soft)",
          border: "1px solid #a7f3d0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <strong style={{ fontSize: "0.92rem", color: "var(--brand-dark)" }}>🚚 Automated Dispatch Formula</strong>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
            Current Rate: ₹{data?.deliveryBaseCharge ?? 20} base + ₹{data?.deliveryRatePerKm ?? 5}/km
          </p>
        </div>
        <Link
          href="/admin"
          style={{
            background: "var(--brand)",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: "0.8rem",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          Edit Rates
        </Link>
      </article>
    </div>
  );
}
