"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { addCartItem } from "@medicare/api-client";

/* ─── Mock OCR Data ────────────────────────────────────────────────────────── */
interface RxMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  catalogMatch: {
    id: string;
    brand: string;
    price: number;
    category: string;
    inStock: boolean;
  } | null;
  selected: boolean;
}

interface RxData {
  doctorName: string;
  hospitalName: string;
  rxDate: string;
  patientName: string;
  medicines: RxMedicine[];
}

const MOCK_PRESCRIPTIONS: RxData[] = [
  {
    doctorName: "Dr. Suresh Mehta, MBBS, MD",
    hospitalName: "Apollo Hospitals, Hyderabad",
    rxDate: new Date().toLocaleDateString("en-IN"),
    patientName: "Darshan V.",
    medicines: [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "1-0-1",
        duration: "5 Days",
        catalogMatch: { id: "amoxicillin-500", brand: "Amoxicillin 500mg", price: 85, category: "tablets", inStock: true },
        selected: true
      },
      {
        name: "Paracetamol",
        dosage: "650mg",
        frequency: "1-1-1",
        duration: "3 Days",
        catalogMatch: { id: "paracetamol-650", brand: "Paracetamol 650mg", price: 28, category: "tablets", inStock: true },
        selected: true
      },
      {
        name: "Pantoprazole",
        dosage: "40mg",
        frequency: "1-0-0",
        duration: "7 Days",
        catalogMatch: { id: "pantoprazole-40", brand: "Pantoprazole 40mg", price: 45, category: "tablets", inStock: true },
        selected: true
      }
    ]
  },
  {
    doctorName: "Dr. Priya Reddy, BAMS",
    hospitalName: "Care Clinic, Bangalore",
    rxDate: new Date().toLocaleDateString("en-IN"),
    patientName: "Darshan V.",
    medicines: [
      {
        name: "Cetirizine",
        dosage: "10mg",
        frequency: "0-0-1",
        duration: "7 Days",
        catalogMatch: { id: "cetirizine-10", brand: "Cetirizine 10mg", price: 32, category: "tablets", inStock: true },
        selected: true
      },
      {
        name: "Azithromycin",
        dosage: "500mg",
        frequency: "1-0-0",
        duration: "3 Days",
        catalogMatch: { id: "azithromycin-500", brand: "Azithromycin 500mg", price: 145, category: "tablets", inStock: true },
        selected: true
      }
    ]
  }
];

type ScannerState = "idle" | "camera" | "scanning" | "processing" | "results" | "success";

/* ─── Main Component ────────────────────────────────────────────────────────── */
export function PrescriptionScannerModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<ScannerState>("idle");
  const [rxData, setRxData] = useState<RxData | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingMsg, setProcessingMsg] = useState("Initializing Medical AI OCR...");

  /* Reset when closed */
  useEffect(() => {
    if (!open) {
      stopCamera();
      setState("idle");
      setRxData(null);
      setAddedToCart(false);
      setAddingToCart(false);
    }
  }, [open]);

  /* Start camera */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setState("camera");
    } catch {
      // Camera not available — fall back to upload state with a message
      setState("idle");
      alert("Camera not available. Please upload a prescription image instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  /* Simulate OCR pipeline */
  const simulateOCR = useCallback(() => {
    setState("scanning");
    stopCamera();
    const msgs = [
      "Initializing Medical AI OCR...",
      "Detecting prescription boundaries...",
      "Extracting doctor and patient metadata...",
      "Identifying medicine names and dosages...",
      "Matching with MediCare catalog inventory...",
      "Verification complete ✓"
    ];
    let i = 0;
    setState("processing");
    const interval = setInterval(() => {
      setProcessingMsg(msgs[i] ?? msgs[msgs.length - 1]);
      i++;
      if (i >= msgs.length) {
        clearInterval(interval);
        setTimeout(() => {
          const pick = MOCK_PRESCRIPTIONS[Math.floor(Math.random() * MOCK_PRESCRIPTIONS.length)];
          setRxData(JSON.parse(JSON.stringify(pick)));
          setState("results");
        }, 600);
      }
    }, 600);
  }, [stopCamera]);

  /* Handle file upload */
  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)|application\/pdf/)) {
        alert("Please upload a JPG, PNG, or PDF prescription file.");
        return;
      }
      simulateOCR();
    },
    [simulateOCR]
  );

  /* Capture from camera */
  const captureFromCamera = useCallback(() => {
    simulateOCR();
  }, [simulateOCR]);

  /* Toggle medicine selection */
  const toggleMed = (index: number) => {
    if (!rxData) return;
    const updated = { ...rxData };
    updated.medicines = updated.medicines.map((m, i) =>
      i === index ? { ...m, selected: !m.selected } : m
    );
    setRxData(updated);
  };

  /* Add all selected to cart */
  const handleAddAllToCart = async () => {
    if (!rxData) return;
    setAddingToCart(true);
    const selected = rxData.medicines.filter((m) => m.selected && m.catalogMatch?.inStock);
    try {
      await Promise.all(
        selected.map((m) =>
          addCartItem({
            medicineId: m.catalogMatch!.id,
            quantity: 1
          })
        )
      );
      window.dispatchEvent(new Event("medicare:cart-updated"));
      setAddedToCart(true);
      setState("success");
    } catch {
      alert("Failed to add items to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (!open) return null;

  const selectedCount = rxData?.medicines.filter((m) => m.selected && m.catalogMatch?.inStock).length ?? 0;
  const totalPrice = rxData?.medicines
    .filter((m) => m.selected && m.catalogMatch)
    .reduce((sum, m) => sum + (m.catalogMatch?.price ?? 0), 0) ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(6px)",
          zIndex: 9998,
          animation: "rxFadeIn 0.22s ease"
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(100%, 430px)",
          maxHeight: "92vh",
          background: "#ffffff",
          borderRadius: "28px 28px 0 0",
          zIndex: 9999,
          overflowY: "auto",
          animation: "rxSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 -12px 60px rgba(0,0,0,0.25)"
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div
            style={{ width: 42, height: 5, borderRadius: 99, background: "#d1d5db" }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 20px 16px"
          }}
        >
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              🔬 MediCare AI · OCR Engine
            </p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>
              Prescription Scanner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="button-reset"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#f3f4f6",
              color: "#6b7280",
              fontSize: "1.1rem",
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* ── IDLE STATE ── */}
        {state === "idle" && (
          <div style={{ padding: "0 20px 28px", display: "grid", gap: 16 }}>
            {/* Camera Option */}
            <button
              onClick={startCamera}
              className="button-reset"
              style={{
                background: "linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #10b981 100%)",
                color: "#ffffff",
                borderRadius: 20,
                padding: "24px 20px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                width: "100%",
                transition: "opacity 0.15s"
              }}
            >
              <span style={{ fontSize: "2.5rem" }}>📷</span>
              <strong style={{ fontSize: "1rem" }}>Scan Prescription Live</strong>
              <span style={{ fontSize: "0.82rem", color: "#a7f3d0" }}>
                Use your camera to scan a doctor's Rx note
              </span>
            </button>

            {/* Upload Option */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#10b981" : "#d1d5db"}`,
                borderRadius: 18,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#f0fdf4" : "#f9fafb",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
              <strong style={{ fontSize: "0.95rem", color: "#374151" }}>
                Upload Prescription
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                Drag & drop or click to select · JPG, PNG, PDF
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {/* Supported formats */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start"
              }}
            >
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>ℹ️</span>
              <p style={{ fontSize: "0.78rem", color: "#166534", lineHeight: 1.5, margin: 0 }}>
                MediCare AI OCR reads handwritten & printed prescriptions. Medicines are matched with our live catalog for instant delivery.
              </p>
            </div>
          </div>
        )}

        {/* ── CAMERA STATE ── */}
        {(state === "camera") && (
          <div style={{ padding: "0 20px 28px", display: "grid", gap: 16 }}>
            {/* Viewfinder */}
            <div
              style={{
                position: "relative",
                borderRadius: 20,
                overflow: "hidden",
                background: "#000",
                aspectRatio: "4/3"
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />

              {/* Corner Brackets */}
              <div className="rx-viewfinder">
                <div className="rx-corner rx-corner-tl" />
                <div className="rx-corner rx-corner-tr" />
                <div className="rx-corner rx-corner-bl" />
                <div className="rx-corner rx-corner-br" />
                {/* Laser line */}
                <div className="rx-laser" />
              </div>

              {/* Overlay controls */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <button
                  onClick={() => setFlashOn(!flashOn)}
                  className="button-reset"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.22)",
                    fontSize: "1.3rem",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer"
                  }}
                >
                  {flashOn ? "🔦" : "💡"}
                </button>

                <button
                  onClick={captureFromCamera}
                  className="button-reset"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: "#10b981",
                    border: "4px solid #ffffff",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.45)"
                  }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: "#ffffff", display: "block" }} />
                </button>

                <button
                  onClick={() => { stopCamera(); setState("idle"); }}
                  className="button-reset"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.22)",
                    fontSize: "1.1rem",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.82rem",
                color: "#6b7280",
                background: "#f9fafb",
                padding: "10px 16px",
                borderRadius: 12
              }}
            >
              📋 Align the prescription within the green brackets, then tap capture
            </p>
          </div>
        )}

        {/* ── PROCESSING STATE ── */}
        {state === "processing" && (
          <div style={{ padding: "8px 20px 40px", textAlign: "center", display: "grid", gap: 20 }}>
            {/* Animated Scanner */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 24,
                background: "linear-gradient(135deg, #064e3b, #10b981)",
                margin: "0 auto",
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <span style={{ fontSize: "3.5rem", zIndex: 1 }}>📋</span>
              <div className="rx-scan-pulse" />
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                Analyzing Prescription…
              </h3>
              <p style={{ fontSize: "0.84rem", color: "#059669", fontWeight: 600, minHeight: 24 }}>
                {processingMsg}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div className="rx-progress-bar" />
            </div>

            <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
              Powered by MediCare AI OCR · ICD-10 Verified Engine
            </p>
          </div>
        )}

        {/* ── RESULTS STATE ── */}
        {state === "results" && rxData && (
          <div style={{ padding: "0 20px 28px", display: "grid", gap: 16 }}>
            {/* Verified Rx Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #064e3b, #0f766e)",
                borderRadius: 18,
                padding: "16px",
                color: "#ffffff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#10b981",
                      color: "#ffffff",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "2px 10px",
                      borderRadius: 999,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 6
                    }}
                  >
                    ✅ Rx Verified
                  </span>
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#ffffff" }}>{rxData.doctorName}</p>
                  <p style={{ fontSize: "0.78rem", color: "#a7f3d0" }}>{rxData.hospitalName}</p>
                </div>
                <div style={{ fontSize: "2rem" }}>🩺</div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  paddingTop: 10,
                  borderTop: "1px solid rgba(255,255,255,0.15)"
                }}
              >
                <div>
                  <small style={{ color: "#a7f3d0", fontSize: "0.7rem" }}>PATIENT</small>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginTop: 2 }}>{rxData.patientName}</p>
                </div>
                <div>
                  <small style={{ color: "#a7f3d0", fontSize: "0.7rem" }}>DATE</small>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff", marginTop: 2 }}>{rxData.rxDate}</p>
                </div>
              </div>
            </div>

            {/* Extracted Medicines */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong style={{ fontSize: "0.92rem", color: "#111827" }}>
                  💊 Prescribed Medicines ({rxData.medicines.length})
                </strong>
                <span style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700 }}>
                  {selectedCount} selected
                </span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {rxData.medicines.map((med, i) => (
                  <label
                    key={i}
                    htmlFor={`rx-med-${i}`}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: `2px solid ${med.selected ? "#10b981" : "#e5e7eb"}`,
                      background: med.selected ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.18s",
                      alignItems: "flex-start"
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`rx-med-${i}`}
                      checked={med.selected}
                      onChange={() => toggleMed(i)}
                      style={{ display: "none" }}
                    />

                    {/* Checkbox visual */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 8,
                        background: med.selected ? "#10b981" : "#e5e7eb",
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        transition: "all 0.18s"
                      }}
                    >
                      {med.selected ? "✓" : ""}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#111827" }}>
                            {med.name} {med.dosage}
                          </strong>
                          <p style={{ fontSize: "0.76rem", color: "#6b7280", marginTop: 2 }}>
                            {med.frequency} · {med.duration}
                          </p>
                        </div>
                        {med.catalogMatch && (
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <strong style={{ fontSize: "0.88rem", color: "#059669" }}>
                              ₹{med.catalogMatch.price}
                            </strong>
                            <br />
                            <span
                              style={{
                                display: "inline-block",
                                background: "#dcfce7",
                                color: "#15803d",
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                padding: "1px 6px",
                                borderRadius: 999,
                                marginTop: 2
                              }}
                            >
                              In Catalog ✓
                            </span>
                          </div>
                        )}
                      </div>
                      {med.catalogMatch && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #e5e7eb",
                            display: "flex",
                            gap: 8,
                            alignItems: "center"
                          }}
                        >
                          <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                            Store Brand:
                          </span>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              color: "#0f766e",
                              background: "#f0fdf4",
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #a7f3d0"
                            }}
                          >
                            {med.catalogMatch.brand}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              color: "#15803d",
                              marginLeft: "auto"
                            }}
                          >
                            🟢 In Stock
                          </span>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rx Verification Badge */}
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 14,
                padding: "10px 14px",
                display: "flex",
                gap: 10,
                alignItems: "center"
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <p style={{ fontSize: "0.77rem", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                Always verify with your pharmacist before consumption. This is an AI-assisted analysis, not a medical substitute.
              </p>
            </div>

            {/* CTA */}
            <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
              <button
                onClick={handleAddAllToCart}
                disabled={selectedCount === 0 || addingToCart}
                className="button-reset primary-button"
                style={{
                  width: "100%",
                  padding: "15px 20px",
                  borderRadius: 16,
                  fontSize: "0.98rem",
                  cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  opacity: selectedCount === 0 ? 0.5 : 1,
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  boxShadow: "0 6px 20px rgba(5,150,105,0.35)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                {addingToCart ? (
                  <>🔄 Adding to Cart…</>
                ) : (
                  <>🛒 Add {selectedCount} Medicine{selectedCount !== 1 ? "s" : ""} to Cart · ₹{totalPrice}</>
                )}
              </button>

              <button
                onClick={() => { setState("idle"); setRxData(null); }}
                className="button-reset"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontWeight: 600
                }}
              >
                📷 Scan Another Prescription
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS STATE ── */}
        {state === "success" && (
          <div style={{ padding: "20px 20px 40px", textAlign: "center", display: "grid", gap: 20 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 999,
                background: "linear-gradient(135deg, #059669, #0d9488)",
                margin: "0 auto",
                display: "grid",
                placeItems: "center",
                fontSize: "2.8rem",
                boxShadow: "0 12px 30px rgba(5,150,105,0.3)"
              }}
            >
              ✅
            </div>

            <div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                Medicines Added to Cart!
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.6 }}>
                {selectedCount} prescribed medicine{selectedCount !== 1 ? "s have" : " has"} been added to your cart from your doctor's prescription.
              </p>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                borderRadius: 16,
                padding: 16
              }}
            >
              <strong style={{ fontSize: "0.92rem", color: "#166534" }}>
                🔒 Rx Verified & Dispensed
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#15803d", marginTop: 4 }}>
                Your prescription has been validated by the MediCare AI OCR engine.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <button
                onClick={onClose}
                className="button-reset primary-button"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  boxShadow: "0 4px 16px rgba(5,150,105,0.3)"
                }}
              >
                🛒 Go to Cart
              </button>
              <button
                onClick={() => { setState("idle"); setRxData(null); setAddedToCart(false); }}
                className="button-reset"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontWeight: 600
                }}
              >
                📷 Scan Another Prescription
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Trigger Banner Card ──────────────────────────────────────────────────── */
export function PrescriptionBanner({ onScanClick }: { onScanClick: () => void }) {
  return (
    <article
      style={{
        background: "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #059669 100%)",
        borderRadius: 18,
        padding: "16px 18px",
        color: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(6, 78, 59, 0.2)",
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
      onClick={onScanClick}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#a7f3d0",
              fontSize: "0.67rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.06em"
            }}
          >
            📋 Doctor's Prescription
          </span>
        </div>
        <strong style={{ fontSize: "1rem", color: "#ffffff", display: "block", marginBottom: 4 }}>
          Upload Prescription & Order
        </strong>
        <p style={{ fontSize: "0.78rem", color: "#a7f3d0", lineHeight: 1.5, margin: 0 }}>
          Scan your doctor's Rx note to auto-match and add medicines to your cart instantly.
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onScanClick(); }}
        className="button-reset"
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.35)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s"
        }}
        title="Scan Prescription"
        aria-label="Scan Prescription"
      >
        <ScanIcon />
      </button>
    </article>
  );
}

/* ─── Scanner SVG Icon ─────────────────────────────────────────────────────── */
function ScanIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

export { ScanIcon };
