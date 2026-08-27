"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-ui";
import {
  fetchAdminSettings,
  updateAdminSettings,
  updateAdminStock,
  getErrorMessage,
  AdminSettingsResponse
} from "@medicare/api-client";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, string> = {
  tablets: "💊",
  injections: "💉",
  devices: "🩺",
  ayurveda: "🌿",
  baby: "🍼",
  "first-aid": "🩹"
};

const CATEGORIES = [
  { id: "all", label: "All Items", icon: "🌐" },
  { id: "tablets", label: "Tablets", icon: "💊" },
  { id: "injections", label: "Injections", icon: "💉" },
  { id: "devices", label: "Devices", icon: "🩺" },
  { id: "ayurveda", label: "Ayurveda", icon: "🌿" },
  { id: "baby", label: "Baby Care", icon: "🍼" },
  { id: "first-aid", label: "First Aid", icon: "🩹" }
];

export default function AdminPage() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delivery settings state
  const [baseCharge, setBaseCharge] = useState<number>(20);
  const [ratePerKm, setRatePerKm] = useState<number>(5);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminSettings();
      setData(res);
      setBaseCharge(res.deliveryBaseCharge);
      setRatePerKm(res.deliveryRatePerKm);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load admin settings."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDelivery(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      const res = await updateAdminSettings({
        deliveryBaseCharge: Number(baseCharge),
        deliveryRatePerKm: Number(ratePerKm)
      });
      if (res.ok) {
        setSaveMessage("✅ Delivery settings saved successfully.");
        if (data) {
          setData({
            ...data,
            deliveryBaseCharge: Number(baseCharge),
            deliveryRatePerKm: Number(ratePerKm)
          });
        }
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage("❌ " + getErrorMessage(err, "Failed to save delivery settings."));
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleUpdateStock(medicineId: string, status: string) {
    setUpdatingIds((prev) => ({ ...prev, [medicineId]: true }));
    try {
      const res = await updateAdminStock({ medicineId, stockStatus: status });
      if (res.ok) {
        if (data) {
          setData({
            ...data,
            medicines: data.medicines.map((med) =>
              med.id === medicineId ? { ...med, stockStatus: status as any } : med
            )
          });
        }
      }
    } catch (err) {
      alert("Error: " + getErrorMessage(err, "Failed to update stock status."));
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [medicineId]: false }));
    }
  }

  const allMedicines = data?.medicines ?? [];
  const inStockCount = allMedicines.filter((m) => m.stockStatus === "in_stock").length;
  const limitedCount = allMedicines.filter((m) => m.stockStatus === "limited").length;
  const outOfStockCount = allMedicines.filter((m) => m.stockStatus === "out_of_stock").length;

  const filteredMedicines = allMedicines.filter((med) => {
    const q = search.toLowerCase();
    const matchesSearch =
      med.name.toLowerCase().includes(q) ||
      med.brand.toLowerCase().includes(q) ||
      med.category.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "all" || med.category === selectedCategory;
    const matchesStock = selectedStockStatus === "all" || med.stockStatus === selectedStockStatus;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <AppShell activePath="/profile" title="Pharmacist Dashboard" subtitle="Live store inventory & dispatch management">
      <div style={{ display: "grid", gap: 16 }}>
        
        {/* Back navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/profile" style={{ color: "var(--brand, #1d9e75)", fontWeight: 700, fontSize: "0.9rem" }}>
            ← Back to Store Profile
          </Link>
          <span style={{ fontSize: "0.8rem", color: "var(--muted, #6b7280)" }}>
            License #DL-MH-2026-8849
          </span>
        </div>

        {loading && (
          <article className="plain-card" style={{ textAlign: "center", padding: 24 }}>
            <p style={{ color: "var(--brand-dark)", fontWeight: 700 }}>Loading inventory and settings…</p>
          </article>
        )}

        {error && (
          <div className="error-card" style={{ padding: 16, background: "#fee2e2", borderRadius: 14 }}>
            <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>
            <button
              onClick={loadSettings}
              className="outline-button button-reset"
              style={{ marginTop: 10, padding: "6px 14px", minHeight: "auto" }}
            >
              Retry Loading
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Live Store Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 14,
                  padding: "12px 10px",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d", display: "block" }}>
                  {inStockCount}
                </span>
                <small style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                  🟢 In Stock
                </small>
              </div>

              <div
                style={{
                  background: "#fefce8",
                  border: "1px solid #fef08a",
                  borderRadius: 14,
                  padding: "12px 10px",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a16207", display: "block" }}>
                  {limitedCount}
                </span>
                <small style={{ fontSize: "0.72rem", color: "#854d0e", fontWeight: 700, textTransform: "uppercase" }}>
                  🟡 Limited
                </small>
              </div>

              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 14,
                  padding: "12px 10px",
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b91c1c", display: "block" }}>
                  {outOfStockCount}
                </span>
                <small style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
                  🔴 Out Stock
                </small>
              </div>
            </div>

            {/* Delivery Charges Section */}
            <article className="plain-card" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem" }}>🚚 Distance Delivery Pricing</strong>
                <span style={{ fontSize: "0.75rem", background: "var(--brand-soft)", color: "var(--brand-dark)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                  Automated
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                Formula: <strong>Base Charge (₹{baseCharge}) + (Distance in Km × ₹{ratePerKm}/km)</strong>
              </p>

              <form onSubmit={handleSaveDelivery} style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label className="input-wrap">
                    <span style={{ fontSize: "0.8rem" }}>Base Charge (₹)</span>
                    <input
                      id="base-charge-input"
                      type="number"
                      min="0"
                      value={baseCharge}
                      onChange={(e) => setBaseCharge(Number(e.target.value))}
                      required
                    />
                  </label>
                  <label className="input-wrap">
                    <span style={{ fontSize: "0.8rem" }}>Rate / Km (₹/km)</span>
                    <input
                      id="rate-per-km-input"
                      type="number"
                      min="0"
                      value={ratePerKm}
                      onChange={(e) => setRatePerKm(Number(e.target.value))}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    id="save-delivery-btn"
                    type="submit"
                    className="primary-button button-reset"
                    disabled={saveLoading}
                    style={{ minHeight: "42px", padding: "0 18px", fontSize: "0.88rem" }}
                  >
                    {saveLoading ? "Saving..." : "Save Delivery Rates"}
                  </button>

                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    Sample (3 km): <strong>₹{baseCharge + 3 * ratePerKm}</strong>
                  </div>
                </div>
              </form>

              {saveMessage && (
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-dark)" }}>{saveMessage}</p>
              )}
            </article>

            {/* Medicine Stock Availability Section */}
            <article className="plain-card" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem" }}>📦 Real-time Medicine Stock</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  Showing {filteredMedicines.length} of {allMedicines.length}
                </span>
              </div>

              {/* Search Bar */}
              <input
                id="stock-search-input"
                type="text"
                placeholder="🔍 Search by medicine name, brand, or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "10px 14px", fontSize: "0.88rem" }}
              />

              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {CATEGORIES.map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className="button-reset"
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        background: active ? "var(--brand, #1d9e75)" : "var(--surface, #f9fafb)",
                        color: active ? "#ffffff" : "var(--ink, #111827)",
                        border: `1px solid ${active ? "var(--brand, #1d9e75)" : "var(--line, #d1d5db)"}`
                      }}
                    >
                      {c.icon} {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Stock Status Filter Pills */}
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "all", label: "All Status" },
                  { id: "in_stock", label: "🟢 In Stock" },
                  { id: "limited", label: "🟡 Limited" },
                  { id: "out_of_stock", label: "🔴 Out of Stock" }
                ].map((s) => {
                  const active = selectedStockStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStockStatus(s.id)}
                      className="button-reset"
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: active ? "#0f6e56" : "transparent",
                        color: active ? "#ffffff" : "var(--muted, #6b7280)",
                        border: `1px solid ${active ? "#0f6e56" : "var(--line, #d1d5db)"}`
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Medicines List */}
              <div style={{ display: "grid", gap: 10, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                {filteredMedicines.map((med) => {
                  const isUpdating = updatingIds[med.id];
                  const icon = CATEGORY_ICONS[med.category] ?? "💊";
                  return (
                    <div
                      key={med.id}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid var(--line, #d1d5db)",
                        background: isUpdating ? "rgba(0,0,0,0.02)" : "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "var(--brand-soft)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "1.2rem",
                            flexShrink: 0
                          }}
                        >
                          {icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>{med.name}</strong>
                            <span
                              className="tag"
                              style={{
                                padding: "2px 6px",
                                fontSize: "0.68rem",
                                borderRadius: 4,
                                background: med.tag.toLowerCase() === "rx" ? "#fee2e2" : "#d1fae5",
                                color: med.tag.toLowerCase() === "rx" ? "#991b1b" : "#065f46"
                              }}
                            >
                              {med.tag}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.76rem", color: "var(--muted)", display: "block", marginTop: 2 }}>
                            {med.brand} · {med.price}
                          </span>
                        </div>
                      </div>

                      {/* Stock Toggle Controls */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {[
                          { id: "in_stock", label: "In Stock", color: "#16a34a" },
                          { id: "limited", label: "Limited", color: "#d97706" },
                          { id: "out_of_stock", label: "Out", color: "#dc2626" }
                        ].map((btn) => {
                          const active = med.stockStatus === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              className="button-reset"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStock(med.id, btn.id)}
                              style={{
                                padding: "4px 7px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                borderRadius: 6,
                                cursor: "pointer",
                                border: `1px solid ${active ? btn.color : "var(--line)"}`,
                                background: active ? btn.color : "transparent",
                                color: active ? "#fff" : "var(--muted)",
                                transition: "all 0.15s ease"
                              }}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredMedicines.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--muted)", padding: "24px 0", fontSize: "0.9rem" }}>
                    No medicines match the selected filter or search term.
                  </div>
                )}
              </div>
            </article>
          </>
        )}
      </div>
    </AppShell>
  );
}
