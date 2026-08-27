"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  aiResult,
  bottomNavRoutes,
  categories,
  medicines,
  notifications,
  orders,
  screenInventory,
  screenSections,
  userProfile
} from "@medicare/core";
import { AppSnapshot, ProfileData, getAuthToken, fetchProfile, fetchCart, addCartItem, clearAuthToken } from "@medicare/api-client";
import { tokens } from "@medicare/design";
import { PrescriptionScannerModal, ScanIcon } from "./prescription-scanner";

const CATEGORY_ICONS: Record<string, string> = {
  tablets: "💊",
  injections: "💉",
  devices: "🩺",
  ayurveda: "🌿",
  baby: "🍼",
  "first-aid": "🩹"
};

const PHARMA_NAV_ROUTES = [
  { path: "/", label: "Store Hub", icon: "🏪" },
  { path: "/admin", label: "Inventory", icon: "📦" },
  { path: "/catalog", label: "Catalog", icon: "📋" },
  { path: "/orders", label: "Orders", icon: "🧾" },
  { path: "/profile", label: "Profile", icon: "🏥" }
];

export function AppShell({
  children,
  activePath,
  title,
  subtitle
}: {
  children: React.ReactNode;
  activePath: string;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState<number>(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  const isPublicRoute =
    activePath === "/login" ||
    activePath.startsWith("/auth") ||
    activePath.startsWith("/showcase");

  const refreshCartCount = () => {
    fetchCart()
      .then((cart) => setCartCount(cart.itemCount ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    const token = getAuthToken();

    if (!token && !isPublicRoute) {
      router.push("/login");
      return;
    }

    if (token) {
      fetchProfile()
        .then((profile) => {
          setProfileName(profile.name);
          setProfileRole(profile.role ?? null);
          setLoading(false);
        })
        .catch(() => {
          clearAuthToken();
          if (!isPublicRoute) {
            router.push("/login");
          } else {
            setLoading(false);
          }
        });
      
      refreshCartCount();
    } else {
      setLoading(false);
    }

    const handleCartUpdate = () => {
      refreshCartCount();
    };

    window.addEventListener("medicare:cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("medicare:cart-updated", handleCartUpdate);
    };
  }, [activePath, isPublicRoute, router]);

  const isPharma = profileRole === "pharmacist" || profileRole === "admin";
  const navRoutes = isPharma ? PHARMA_NAV_ROUTES : bottomNavRoutes;

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  const displayEyebrow = isPharma ? "🏥 Pharma Partner Portal" : "MediCare AI";
  const displayTitle =
    activePath === "/" && isPharma
      ? "🏪 CityCare Pharmacy Store Hub"
      : activePath === "/" && profileName
      ? `Good Morning, ${profileName}`
      : title;

  const displaySubtitle =
    activePath === "/" && isPharma
      ? "License #DL-MH-2026-8849 · Live Dispensing"
      : subtitle;

  if (loading && !isPublicRoute) {
    return (
      <main className="app-shell">
        <section className="phone-frame" style={{ justifyContent: "center", alignItems: "center" }}>
          <p style={{ color: "var(--brand-dark)", fontWeight: "bold" }}>Verifying session...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header
          className="top-band"
          style={{
            background: isPharma
              ? "linear-gradient(180deg, #064e3b 0%, #0f766e 100%)"
              : "linear-gradient(180deg, var(--brand) 0%, #25ab82 100%)"
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: isPharma ? "#a7f3d0" : undefined }}>
              {displayEyebrow}
            </p>
            <h1>{displayTitle}</h1>
            {displaySubtitle ? <p className="subcopy">{displaySubtitle}</p> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isPharma ? (
              <Link
                className="icon-badge"
                href="/admin"
                style={{ textDecoration: "none", fontSize: "1.2rem" }}
                title="Stock Manager"
              >
                📦
              </Link>
            ) : (
              <>
                {/* Rx Scanner button — patient only */}
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="icon-badge button-reset"
                  title="Scan Prescription"
                  aria-label="Scan Prescription"
                  style={{
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <ScanIcon />
                </button>

                {/* Cart with live badge */}
                <Link
                  className="icon-badge"
                  href="/cart"
                  style={{ position: "relative", textDecoration: "none", fontSize: "1.2rem" }}
                  title="Cart"
                >
                  🛒
                  {cartCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        background: "#ef4444",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        borderRadius: 999,
                        minWidth: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.25)"
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Link className="icon-badge" href="/dashboard/notifications" title="Notifications" style={{ fontSize: "1.2rem" }}>
              🔔
            </Link>
            {!isPublicRoute && (
              <button
                type="button"
                onClick={handleLogout}
                className="icon-badge button-reset"
                title="Log Out"
                aria-label="Log Out"
                style={{
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                🚪
              </button>
            )}
          </div>
        </header>
        <div className="screen-body">{children}</div>

        {/* Prescription Scanner Modal — patient only, portal-mounted */}
        {!isPharma && (
          <PrescriptionScannerModal
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
          />
        )}
        <nav className="bottom-nav">
          {navRoutes.map((route) => {
            const active = route.path === activePath;
            return (
              <Link className={active ? "nav-item active" : "nav-item"} href={route.path} key={route.path}>
                <span>{route.icon}</span>
                <small>{route.label}</small>
              </Link>
            );
          })}
        </nav>
      </section>
    </main>
  );
}

export function HeroCard({
  eyebrow,
  title,
  description,
  href,
  cta
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="hero-card">
      <p className="hero-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="hero-action" href={href}>
        {cta}
      </Link>
    </article>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-heading">
      <h3>{title}</h3>
      {action ? <span>{action}</span> : null}
    </div>
  );
}

export function CategoryGrid({ items = categories }: { items?: typeof categories }) {
  return (
    <div className="category-grid">
      {items.map((category) => (
        <Link
          href={`/catalog?category=${category.id}`}
          key={category.id}
          style={{ textDecoration: "none" }}
        >
          <article
            className="category-card"
            style={{
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "16px 8px",
              minHeight: "84px"
            }}
          >
            <div className="category-icon" style={{ fontSize: "26px", margin: "0 auto 6px" }}>
              {category.icon}
            </div>
            <strong style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink, #111827)", textAlign: "center", lineHeight: 1.2 }}>
              {category.name}
            </strong>
          </article>
        </Link>
      ))}
    </div>
  );
}

export function MedicineList({ items = medicines.slice(0, 4) }: { items?: typeof medicines }) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  async function handleAdd(medicine: (typeof medicines)[number]) {
    try {
      await addCartItem({ medicineId: medicine.id, quantity: 1 });
      setAddedIds((prev) => ({ ...prev, [medicine.id]: true }));
      window.dispatchEvent(new CustomEvent("medicare:cart-updated"));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [medicine.id]: false }));
      }, 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="stack-list">
      {items.map((medicine) => {
        const isAdded = addedIds[medicine.id];
        const icon = CATEGORY_ICONS[medicine.category] ?? "💊";
        return (
          <article className="medicine-card" key={medicine.id}>
            <div className="medicine-icon">{icon}</div>
            <div className="medicine-copy">
              <strong>{medicine.name}</strong>
              <span>{medicine.brand}</span>
              <p>{medicine.description}</p>
            </div>
            <div className="medicine-meta">
              <span className="tag">{medicine.tag}</span>
              <strong>{medicine.price}</strong>
              <button
                type="button"
                onClick={() => handleAdd(medicine)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: isAdded ? "#059669" : "var(--brand, #1d9e75)",
                  color: "#ffffff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
              >
                {isAdded ? "✓ Added" : "Add to Cart"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function NotificationList({
  items = notifications
}: {
  items?: AppSnapshot["notifications"];
}) {
  return (
    <div className="stack-list notification-list">
      {items.map((notification) => (
        <article className="alert-card" key={notification.id}>
          <div className="alert-icon">{notification.icon}</div>
          <div>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
            <span>{notification.time}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function OrderList({
  items = orders
}: {
  items?: AppSnapshot["orders"];
}) {
  return (
    <div className="stack-list">
      {items.map((order) => (
        <article className="order-card" key={order.id}>
          <div className="order-head">
            <strong>{order.id}</strong>
            <span className="tag">{order.status}</span>
          </div>
          <p>{order.items.join(" • ")}</p>
          <small>
            {order.pharmacy}
            {order.paymentStatus ? ` | Payment: ${order.paymentStatus}` : ""}
            {order.deliveryStage ? ` | Stage: ${order.deliveryStage}` : ""}
          </small>
          <div className="order-foot">
            <span>{order.eta}</span>
            <Link href="/orders">Track</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AIResultCard() {
  return (
    <article className="result-card">
      <p className="hero-eyebrow">🤖 AI Detected</p>
      <h2>{aiResult.condition}</h2>
      <strong>Confidence: {aiResult.confidence}</strong>
      <p>Matched symptoms: {aiResult.matchedSymptoms.join(" • ")}</p>
      <div className="warning-card">{aiResult.warning}</div>
    </article>
  );
}

export function ProfileSummary({
  profile
}: {
  profile?: ProfileData;
}) {
  const resolvedProfile = profile ?? {
    name: userProfile.name,
    email: userProfile.email
  };
  const facts = [
    { label: "Conditions", value: String(resolvedProfile.conditions?.length ?? userProfile.chronicConditions.length) },
    { label: "Medications", value: String(resolvedProfile.medications?.length ?? userProfile.currentMedications.length) },
    { label: "Allergies", value: String(resolvedProfile.allergies?.length ?? userProfile.allergies.length) }
  ];

  return (
    <div className="profile-wrap">
      <article className="profile-card">
        <div className="avatar">{resolvedProfile.name.slice(0, 2).toUpperCase()}</div>
        <strong>{resolvedProfile.name}</strong>
        <span>{resolvedProfile.email}</span>
      </article>
      <div className="fact-grid">
        {facts.map((fact) => (
          <article className="fact-card" key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function InputCard({
  label,
  placeholder,
  tall
}: {
  label: string;
  placeholder: string;
  tall?: boolean;
}) {
  return (
    <label className="input-wrap">
      <span>{label}</span>
      {tall ? <textarea placeholder={placeholder} rows={4} /> : <input placeholder={placeholder} />}
    </label>
  );
}

export function PrimaryButton({ href, label }: { href: string; label: string }) {
  return (
    <Link className="primary-button" href={href}>
      {label}
    </Link>
  );
}

export function OutlineButton({ href, label }: { href: string; label: string }) {
  return (
    <Link className="outline-button" href={href}>
      {label}
    </Link>
  );
}

export function RouteChips() {
  return (
    <div className="chip-row">
      {categories.map((category) => (
        <Link
          className="chip"
          href={`/catalog?category=${category.id}`}
          key={category.id}
          style={{ cursor: "pointer" }}
        >
          {category.icon} {category.name}
        </Link>
      ))}
    </div>
  );
}

export function TrackingCard({ order }: { order?: AppSnapshot["orders"][number] }) {
  const currentStage = order?.deliveryStage ?? "Out for delivery";
  const nextCheckpoint = order?.trackingTimeline?.find((item) => item.status === "current" || item.status === "upcoming");

  return (
    <article className="tracking-card">
      <div className="tracking-map">
        <div className="route-line" />
        <div className="route-dot start">🏪</div>
        <div className="route-dot end">🏠</div>
      </div>
      <div className="tracking-meta">
        <strong>{currentStage}</strong>
        <p>{nextCheckpoint?.description ?? "ETA updates every 2 minutes with OTP-based contactless confirmation."}</p>
      </div>
    </article>
  );
}

export function ScreenInventoryGrid() {
  return (
    <div className="stack-list">
      {screenSections.map((section) => (
        <article className="plain-card" key={section}>
          <div className="section-heading">
            <h3>{section}</h3>
            <span>
              {screenInventory.filter((screen) => screen.section === section).length} screens
            </span>
          </div>
          <div className="screen-link-grid">
            {screenInventory
              .filter((screen) => screen.section === section)
              .map((screen) => (
                <Link className="screen-link-card" href={`/showcase/${screen.slug}`} key={screen.slug}>
                  <strong>
                    {screen.id}. {screen.title}
                  </strong>
                  <p>{screen.summary}</p>
                </Link>
              ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export const webTheme = tokens;
