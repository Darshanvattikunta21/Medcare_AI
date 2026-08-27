"use client";

import React, { useEffect, useState } from "react";
import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getErrorMessage,
  type ProfileAddress
} from "@medicare/api-client";

export function ProfileAddressesManager() {
  const [addresses, setAddresses] = useState<ProfileAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ProfileAddress | null>(null);
  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetchAddresses();
      setAddresses(res);
    } catch (err) {
      setMessage(getErrorMessage(err, "Unable to load saved addresses"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setLabel("Home");
    setLine1("");
    setCity("");
    setState("");
    setPinCode("");
    setFormError("");
    setShowForm(true);
  };

  const handleOpenEdit = (addr: ProfileAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setLine1(addr.line1);
    setCity(addr.city);
    setState(addr.state);
    setPinCode(addr.pinCode);
    setFormError("");
    setShowForm(true);
  };

  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to delete this delivery address?")) return;
    try {
      await deleteAddress(addrId);
      void load();
    } catch (err) {
      setMessage(getErrorMessage(err, "Failed to delete address"));
    }
  };

  const validate = () => {
    if (!label.trim()) {
      setFormError("Address label (e.g. Home, Office) is required.");
      return false;
    }
    if (!line1.trim()) {
      setFormError("Street address is required.");
      return false;
    }
    if (!city.trim()) {
      setFormError("City is required.");
      return false;
    }
    if (!state.trim()) {
      setFormError("State is required.");
      return false;
    }
    if (!/^[0-9]{6}$/.test(pinCode.trim())) {
      setFormError("Pincode must be a 6-digit number.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      label: label.trim(),
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim()
    };

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
      } else {
        await addAddress(payload);
      }
      setShowForm(false);
      void load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save address details"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <article className="plain-card">Loading delivery locations...</article>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Saved Delivery Addresses</h3>
        {!showForm && (
          <button className="chip active-chip button-reset" onClick={handleOpenAdd} type="button">
            + Add Address
          </button>
        )}
      </div>

      {message ? <p className="status-copy">{message}</p> : null}

      {showForm && (
        <form className="auth-panel" onSubmit={handleSave} style={{ border: "1px solid #d6e1dc", padding: "16px", borderRadius: "12px", width: "100%" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>{editingAddress ? "Edit Address" : "New Address"}</h4>
          
          <label className="input-wrap">
            <span>Label (Home / Office / Other)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Home" required />
          </label>

          <label className="input-wrap">
            <span>Street Address *</span>
            <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Flat, house, street address" required />
          </label>

          <label className="input-wrap">
            <span>City *</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" required />
          </label>

          <label className="input-wrap">
            <span>State *</span>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Karnataka" required />
          </label>

          <label className="input-wrap">
            <span>6-Digit Pincode *</span>
            <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="560001" required />
          </label>

          {formError ? <p style={{ color: "#dc2626", fontSize: "13px", fontWeight: "600", margin: "8px 0" }}>{formError}</p> : null}

          <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
            <button className="primary-button button-reset" disabled={submitting} type="submit" style={{ flex: 1 }}>
              {submitting ? "Saving..." : "Save Address"}
            </button>
            <button className="outline-button button-reset" onClick={() => setShowForm(false)} type="button" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="stack-list">
        {addresses.length === 0 ? (
          <article className="plain-card soft">
            <strong>No delivery locations found.</strong>
            <p>Click &quot;Add Address&quot; to store your shipping coordinates.</p>
          </article>
        ) : (
          addresses.map((addr) => (
            <article className="cart-card cart-card-vertical" key={addr.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {addr.label}
                </strong>
                <p style={{ margin: "4px 0" }}>{addr.line1}</p>
                <p style={{ color: "#6b7280" }}>{addr.city}, {addr.state} - {addr.pinCode}</p>
              </div>
              <div className="chip-row" style={{ marginTop: "8px" }}>
                <button className="chip button-reset" onClick={() => handleOpenEdit(addr)} type="button">
                  Edit
                </button>
                <button className="chip button-reset" onClick={() => handleDelete(addr.id)} type="button" style={{ color: "#b91c1c" }}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
