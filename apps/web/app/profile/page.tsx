"use client";

import { fetchProfile, getErrorMessage, clearAuthToken } from "@medicare/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, ProfileSummary, SectionHeading } from "../../components/app-ui";
import { ProfileAddressesManager } from "../../components/profile-addresses-manager";
import type { ProfileData } from "@medicare/api-client";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => setError(getErrorMessage(err, "Failed to load profile")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell activePath="/profile" title="Health Profile" subtitle="Personal info, conditions, and medications">
      {loading && <article className="plain-card"><p>Loading profile…</p></article>}
      {error && <article className="plain-card" style={{ color: "red" }}><p>{error}</p></article>}
      {profile && (
        <>
          {(profile.role === "pharmacist" || profile.role === "admin") ? (
            <>
              {/* Pharmacist Store Card */}
              <article
                className="plain-card"
                style={{
                  background: "linear-gradient(135deg, #0f6e56 0%, #1d9e75 100%)",
                  color: "#ffffff",
                  padding: "20px",
                  borderRadius: "18px",
                  boxShadow: "0 8px 24px rgba(15, 110, 86, 0.2)",
                  border: "none",
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      🏥 Verified Pharmacy Partner
                    </span>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 10, marginBottom: 4 }}>
                      {profile.name}
                    </h2>
                    <p style={{ color: "#d1fae5", fontSize: "0.85rem", margin: 0 }}>
                      {profile.email} · Registered Pharmacist
                    </p>
                  </div>
                  <div style={{ fontSize: "2.2rem" }}>💊</div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <div>
                    <small style={{ color: "#a7f3d0", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                      License ID
                    </small>
                    <p style={{ fontWeight: 800, fontSize: "0.95rem", margin: "2px 0 0" }}>DL-MH-2026-8849</p>
                  </div>
                  <div>
                    <small style={{ color: "#a7f3d0", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                      Store Status
                    </small>
                    <p style={{ fontWeight: 800, fontSize: "0.95rem", margin: "2px 0 0", color: "#6ee7b7" }}>
                      🟢 Live & Dispensing
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Link
                    id="open-admin-btn"
                    href="/admin"
                    style={{
                      background: "#ffffff",
                      color: "#0f6e56",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "0.92rem",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  >
                    📦 Open Inventory & Stock Manager →
                  </Link>
                </div>
              </article>

              {/* Quick Hub Stats */}
              <SectionHeading title="Store Operations Hub" action="Live Store" />
              <div className="metric-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Link href="/admin" style={{ textDecoration: "none" }}>
                  <article className="plain-card" style={{ padding: 14, cursor: "pointer", transition: "transform 0.15s" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📦</div>
                    <strong style={{ fontSize: "1.1rem" }}>Stock Status</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Toggle in-stock / out-of-stock</span>
                  </article>
                </Link>
                <Link href="/admin" style={{ textDecoration: "none" }}>
                  <article className="plain-card" style={{ padding: 14, cursor: "pointer", transition: "transform 0.15s" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🚚</div>
                    <strong style={{ fontSize: "1.1rem" }}>Delivery Rates</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Configure base + per-km fee</span>
                  </article>
                </Link>
                <Link href="/catalog" style={{ textDecoration: "none" }}>
                  <article className="plain-card" style={{ padding: 14, cursor: "pointer", transition: "transform 0.15s" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📋</div>
                    <strong style={{ fontSize: "1.1rem" }}>Live Catalog</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>50+ medicine items</span>
                  </article>
                </Link>
                <Link href="/orders" style={{ textDecoration: "none" }}>
                  <article className="plain-card" style={{ padding: 14, cursor: "pointer", transition: "transform 0.15s" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🧾</div>
                    <strong style={{ fontSize: "1.1rem" }}>Order Stream</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Track active customer orders</span>
                  </article>
                </Link>
              </div>
            </>
          ) : (
            <>
              <ProfileSummary profile={profile} />
              <SectionHeading title="Chronic conditions" action={`${profile.conditions?.length ?? 0} items`} />
              <div className="stack-list">
                {(profile.conditions ?? []).map((item) => (
                  <article className="plain-card success" key={item}>
                    <strong>{item}</strong>
                  </article>
                ))}
              </div>
              <SectionHeading title="Current medications" action={`${profile.medications?.length ?? 0} active`} />
              <div className="stack-list">
                {(profile.medications ?? []).map((item) => (
                  <article className="plain-card soft" key={item}>
                    <strong>{item}</strong>
                  </article>
                ))}
              </div>
              <SectionHeading title="Allergies" />
              <div className="chip-row" style={{ marginBottom: "20px" }}>
                {(profile.allergies ?? []).map((item) => (
                  <span className="chip" key={item}>{item}</span>
                ))}
              </div>
              <ProfileAddressesManager />
            </>
          )}
        </>
      )}

      <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
        <Link className="primary-button" href="/settings/edit-profile">
          Edit Profile
        </Link>
        <button
          type="button"
          onClick={() => {
            clearAuthToken();
            router.push("/login");
          }}
          className="button-reset"
          style={{
            minHeight: "48px",
            padding: "0 18px",
            borderRadius: "14px",
            fontWeight: 700,
            background: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "0.95rem",
            transition: "background 0.15s ease"
          }}
        >
          <span>🚪</span> Log Out
        </button>
      </div>
    </AppShell>
  );
}
