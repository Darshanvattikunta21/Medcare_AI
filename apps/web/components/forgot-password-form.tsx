"use client";

import { forgotPassword, getErrorMessage, resetPassword, verifyOtp } from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "email" | "otp" | "reset" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await forgotPassword({ email });
      // In dev mode the API returns the OTP directly — auto-fill it for convenience
      if (result.otp) {
        setDevOtp(result.otp);
        setOtp(result.otp);
      }
      setStep("otp");
    } catch (err) {
      setMessage(getErrorMessage(err, "Could not send OTP. Check the email address."));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await verifyOtp({ email, otp });
      if (result.ok) {
        setStep("reset");
      } else {
        setMessage("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setMessage(getErrorMessage(err, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await resetPassword({ email, otp, newPassword });
      setStep("done");
    } catch (err) {
      setMessage(getErrorMessage(err, "Failed to reset password. Please start over."));
    } finally {
      setLoading(false);
    }
  }

  const isError = message && !message.toLowerCase().includes("success");

  return (
    <article className="auth-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Step indicators */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
        {(["email", "otp", "reset"] as Step[]).map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                background:
                  step === "done" || (["email", "otp", "reset"] as Step[]).indexOf(step) > i
                    ? "var(--brand)"
                    : step === s
                    ? "var(--brand)"
                    : "var(--surface-raised)",
                color:
                  step === "done" || (["email", "otp", "reset"] as Step[]).indexOf(step) >= i
                    ? "#fff"
                    : "var(--text-muted)",
                transition: "all 0.3s ease"
              }}
            >
              {step === "done" || (["email", "otp", "reset"] as Step[]).indexOf(step) > i ? "✓" : i + 1}
            </div>
            {i < 2 && (
              <div
                style={{
                  height: "2px",
                  width: "2.5rem",
                  background:
                    step === "done" || (["email", "otp", "reset"] as Step[]).indexOf(step) > i
                      ? "var(--brand)"
                      : "var(--border)",
                  transition: "background 0.3s ease"
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Email ── */}
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Forgot your password?</h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Enter your registered email and we'll send a reset code.
            </p>
          </div>
          <label className="input-wrap">
            <span>Email address</span>
            <input
              id="fp-email"
              type="email"
              autoComplete="username email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {message && (
            <p style={{ fontSize: "0.85rem", color: isError ? "#ef4444" : "var(--brand-dark)", textAlign: "center", margin: 0 }}>
              {message}
            </p>
          )}
          <button id="fp-send-otp-btn" className="primary-button button-reset" disabled={loading} type="submit" style={{ width: "100%" }}>
            {loading ? "Sending…" : "Send Reset Code"}
          </button>
          <a href="/login" style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--brand)" }}>
            ← Back to Sign In
          </a>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === "otp" && (
        <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Enter verification code</h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              A 6-digit code was sent to <strong>{email}</strong>
            </p>
          </div>
          {devOtp && (
            <article
              className="plain-card"
              style={{ background: "var(--brand-soft)", border: "1px solid #a7f3d0", fontSize: "0.82rem" }}
            >
              <strong style={{ color: "var(--brand-dark)" }}>Dev mode — OTP auto-filled</strong>
              <p style={{ margin: "0.25rem 0 0" }}>Your OTP is: <strong>{devOtp}</strong></p>
            </article>
          )}
          <label className="input-wrap">
            <span>OTP code</span>
            <input
              id="fp-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{ letterSpacing: "0.25em", fontSize: "1.25rem", textAlign: "center" }}
            />
          </label>
          {message && (
            <p style={{ fontSize: "0.85rem", color: "#ef4444", textAlign: "center", margin: 0 }}>
              {message}
            </p>
          )}
          <button id="fp-verify-otp-btn" className="primary-button button-reset" disabled={loading} type="submit" style={{ width: "100%" }}>
            {loading ? "Verifying…" : "Verify Code"}
          </button>
          <button
            type="button"
            className="outline-button"
            style={{ width: "100%", textAlign: "center" }}
            onClick={() => { setStep("email"); setMessage(""); setDevOtp(null); setOtp(""); }}
          >
            ← Change email
          </button>
        </form>
      )}

      {/* ── Step 3: New password ── */}
      {step === "reset" && (
        <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Set a new password</h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Choose a strong password for your account.
            </p>
          </div>
          <label className="input-wrap">
            <span>New password</span>
            <input
              id="fp-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="input-wrap">
            <span>Confirm new password</span>
            <input
              id="fp-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          {message && (
            <p style={{ fontSize: "0.85rem", color: "#ef4444", textAlign: "center", margin: 0 }}>
              {message}
            </p>
          )}
          <button id="fp-reset-btn" className="primary-button button-reset" disabled={loading} type="submit" style={{ width: "100%" }}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "#fff"
            }}
          >
            ✓
          </div>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Password reset!</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Your password has been updated. You can now sign in with your new password.
          </p>
          <button
            id="fp-go-login-btn"
            className="primary-button button-reset"
            style={{ width: "100%" }}
            onClick={() => router.push("/login")}
          >
            Go to Sign In
          </button>
        </div>
      )}
    </article>
  );
}
