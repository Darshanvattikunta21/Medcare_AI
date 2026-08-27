"use client";

import { getErrorMessage, signUp } from "@medicare/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({ name, email, phone, password });
      if (result.ok) {
        setSuccess(true);
        setMessage("Account created! Redirecting…");
        setTimeout(() => router.push("/"), 1200);
      } else {
        setMessage(result.message || "Sign up failed. Please try again.");
      }
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to create account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit} method="POST">
      <label className="input-wrap">
        <span>Full name</span>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ravi Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="input-wrap">
        <span>Email address</span>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="input-wrap">
        <span>Phone number</span>
        <input
          id="signup-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 99999 00000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label className="input-wrap">
        <span>Password</span>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className="input-wrap">
        <span>Confirm password</span>
        <input
          id="signup-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>

      <button
        id="signup-submit-btn"
        className="primary-button button-reset"
        type="submit"
        disabled={loading || success}
        style={{ width: "100%" }}
      >
        {loading ? "Creating account…" : success ? "✅ Success!" : "Create Account"}
      </button>

      {message && (
        <p
          className={success ? "status-copy" : ""}
          style={
            !success
              ? { color: "#ef4444", fontSize: "0.88rem", textAlign: "center" }
              : { textAlign: "center" }
          }
        >
          {message}
        </p>
      )}

      <div className="divider">Already have an account?</div>
      <a className="outline-button" href="/login" style={{ textAlign: "center" }}>
        Sign In
      </a>
    </form>
  );
}
