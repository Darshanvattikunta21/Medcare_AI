"use client";

import { fetchProfile, getErrorMessage, updateProfile } from "@medicare/api-client";
import { useEffect, useState } from "react";

export function EditProfileForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    conditions: "",
    medications: "",
    allergies: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        setForm({
          name: profile.name,
          email: profile.email,
          phone: profile.phone ?? "",
          conditions: (profile.conditions ?? []).join(", "),
          medications: (profile.medications ?? []).join(", "),
          allergies: (profile.allergies ?? []).join(", ")
        });
      })
      .catch((error) => setMessage(getErrorMessage(error, "Unable to load profile")))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const profile = await updateProfile({
        ...form,
        conditions: form.conditions.split(",").map((item) => item.trim()).filter(Boolean),
        medications: form.medications.split(",").map((item) => item.trim()).filter(Boolean),
        allergies: form.allergies.split(",").map((item) => item.trim()).filter(Boolean)
      });

      setMessage(`Saved profile for ${profile.name}`);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to save profile"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <article className="plain-card">Loading profile...</article>;
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      {[
        ["Full name", "name"],
        ["Email address", "email"],
        ["Phone number", "phone"],
        ["Conditions", "conditions"],
        ["Medications", "medications"],
        ["Allergies", "allergies"]
      ].map(([label, key]) => {
        let inputType = "text";
        let autoComp = "";
        if (key === "email") {
          inputType = "email";
          autoComp = "email";
        } else if (key === "phone") {
          inputType = "tel";
          autoComp = "tel";
        } else if (key === "name") {
          autoComp = "name";
        }
        return (
          <label className="input-wrap" key={key}>
            <span>{label}</span>
            <input
              name={key}
              type={inputType}
              autoComplete={autoComp || undefined}
              required={key === "name" || key === "email"}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              value={form[key as keyof typeof form]}
            />
          </label>
        );
      })}
      <button className="primary-button button-reset" disabled={saving} type="submit">
        {saving ? "Saving..." : "Save Changes"}
      </button>
      {message ? <p className="status-copy">{message}</p> : null}
    </form>
  );
}
