import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MediCare AI",
  description: "AI-powered medicine delivery and prescription verification platform."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
