"use client";

import { useEffect, useState } from "react";
import { fetchAppSnapshot, fetchProfile, AppSnapshot, ProfileData } from "@medicare/api-client";
import {
  AppShell,
  CategoryGrid,
  HeroCard,
  MedicineList,
  OrderList,
  RouteChips,
  SectionHeading
} from "../components/app-ui";
import { PharmaHomeView } from "../components/pharma-home-view";
import { PrescriptionBanner, PrescriptionScannerModal } from "../components/prescription-scanner";

export default function HomePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchProfile().catch(() => null),
      fetchAppSnapshot().catch(() => null)
    ]).then(([prof, snap]) => {
      setProfile(prof);
      setSnapshot(snap);
      setLoading(false);
    });
  }, []);

  const isPharma = profile?.role === "pharmacist" || profile?.role === "admin";

  return (
    <AppShell
      activePath="/"
      title={isPharma ? "CityCare Pharmacy Hub" : `Good Morning, ${profile?.name ?? "Darshan"}`}
      subtitle={isPharma ? "License #DL-MH-2026-8849 · Live Dispensing" : "How are you feeling today?"}
    >
      {loading ? (
        <article className="plain-card" style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "var(--brand-dark)", fontWeight: 700 }}>Loading MediCare AI…</p>
        </article>
      ) : isPharma ? (
        /* Specialized Pharmacist / Pharma Owner Home View */
        <PharmaHomeView />
      ) : (
        /* Patient Healthcare View */
        <>
          <HeroCard
            eyebrow="🤖 AI Symptom Checker"
            title="Describe symptoms and get medicine guidance"
            description="Enter your symptoms, get AI diagnosis with ICD-10 clinical accuracy, recommended medications, and verified home delivery."
            href="/symptoms"
            cta="Try Now →"
          />

          {/* Prescription Scanner Banner */}
          <PrescriptionBanner onScanClick={() => setScannerOpen(true)} />

          <SectionHeading title="Categories" action="See All" />
          <CategoryGrid items={snapshot?.categories} />
          <SectionHeading title="Quick discovery" action="Popular" />
          <RouteChips />
          <SectionHeading title="Recommended for you" action="See All" />
          <MedicineList items={snapshot?.medicines?.slice(0, 4)} />
          <SectionHeading title="Active orders" action="Track" />
          <OrderList items={snapshot?.orders} />
          <div className="metric-grid">
            {(snapshot?.highlights ?? []).map((item) => (
              <article className="metric-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>

          {/* Standalone modal driven from banner (AppShell also has one from header btn) */}
          <PrescriptionScannerModal
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
          />
        </>
      )}
    </AppShell>
  );
}
