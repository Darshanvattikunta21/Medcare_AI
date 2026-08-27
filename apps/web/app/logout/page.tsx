"use client";

import { clearAuthToken } from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearAuthToken();
    const timer = setTimeout(() => {
      router.push("/login");
    }, 600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="app-shell">
      <section
        className="phone-frame"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 16 }}>🚪</div>
        <h2 style={{ fontSize: "1.35rem", color: "var(--ink, #111827)", marginBottom: 8, fontWeight: 700 }}>
          Logging out…
        </h2>
        <p style={{ color: "var(--muted, #6b7280)", fontSize: "0.9rem" }}>
          Clearing your session securely and redirecting to login.
        </p>
      </section>
    </main>
  );
}
