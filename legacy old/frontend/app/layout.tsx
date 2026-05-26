import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Fuente body (UI)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fuente display (títulos serif)
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400", // Instrument Serif solo viene en regular
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Totem HUB — Viajes grupales sin complicaciones",
  description:
    "Plataforma SaaS para agencias de viajes grupales. Inscripciones, pagos y documentos centralizados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}