"use client";

import { getErrorMessage, login } from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("darshanvattikunta@gmail.com");
  const [password, setPassword] = useState("demo123");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      const result = await login({ email: cleanEmail, password: cleanPassword });
      setMessage(result.message);
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to sign in. Check your credentials."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit} method="POST">
      {/* Demo credentials switcher */}
      <article className="plain-card" style={{ background: "var(--brand-soft)", border: "1px solid #a7f3d0", fontSize: "0.82rem", padding: "12px 14px" }}>
        <strong style={{ color: "var(--brand-dark)", display: "block", marginBottom: 6 }}>Demo Accounts (1-Click Fill)</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-reset"
            onClick={() => {
              setEmail("darshanvattikunta@gmail.com");
              setPassword("demo123");
            }}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              background: email === "darshanvattikunta@gmail.com" ? "var(--brand, #1d9e75)" : "#ffffff",
              color: email === "darshanvattikunta@gmail.com" ? "#ffffff" : "var(--brand-dark, #0f6e56)",
              border: "1px solid var(--brand, #1d9e75)"
            }}
          >
            👤 Patient (Darshan)
          </button>
          <button
            type="button"
            className="button-reset"
            onClick={() => {
              setEmail("pharma@email.com");
              setPassword("demo123");
            }}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              background: email === "pharma@email.com" ? "var(--brand, #1d9e75)" : "#ffffff",
              color: email === "pharma@email.com" ? "#ffffff" : "var(--brand-dark, #0f6e56)",
              border: "1px solid var(--brand, #1d9e75)"
            }}
          >
            🏥 Pharma Owner
          </button>
        </div>
      </article>

      <label className="input-wrap">
        <span>Email address</span>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username email"
          required
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          value={email}
        />
      </label>

      <label className="input-wrap">
        <span>Password</span>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          value={password}
        />
      </label>

      <button
        id="login-submit-btn"
        className="primary-button button-reset"
        disabled={loading}
        type="submit"
        style={{ width: "100%" }}
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <a className="outline-button" href="/auth/forgot-password" style={{ textAlign: "center" }}>
        Forgot Password?
      </a>

      {message ? (
        <p
          style={{
            fontSize: "0.88rem",
            textAlign: "center",
            color: message.toLowerCase().includes("success") ? "var(--brand-dark)" : "#ef4444"
          }}
        >
          {message}
        </p>
      ) : null}

      <div className="divider">Don&apos;t have an account?</div>
      <a className="outline-button" href="/auth/sign-up" style={{ textAlign: "center" }}>
        Create Account
      </a>
    </form>
  );
}
