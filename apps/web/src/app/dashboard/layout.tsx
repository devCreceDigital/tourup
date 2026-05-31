"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAgency } from "@/lib/store/agencyStore";
import type { AgencyData } from "@/lib/store/agencyStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function IconPanel() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPlane() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [agency, setAgency] = useState<AgencyData | null>(null);

  useEffect(() => {
    setAgency(getAgency());
  }, []);

  const slug = agency?.slug ?? "mi-agencia";

  const navItems: NavItem[] = [
    { label: "Panel", href: "/dashboard/agency", icon: <IconPanel /> },
    { label: "Viajes", href: "/dashboard/trips", icon: <IconPlane /> },
    { label: "Trabajadores", href: "/dashboard/workers", icon: <IconUsers /> },
    { label: "Configuración", href: "/dashboard/settings", icon: <IconSettings /> },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter,-apple-system,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#0A2540", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#16EFFF",
              boxShadow: "0 0 8px #16EFFF",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>TRAVENTIA</span>
          </div>
          {agency && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {agency.nombre}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 20px", background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "none", borderLeft: isActive ? "3px solid #D946EF" : "3px solid transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          {/* Ver landing */}
          <button
            onClick={() => window.open(`/${slug}`, "_blank")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 20px", background: "transparent",
              border: "none", borderLeft: "3px solid transparent",
              color: "rgba(255,255,255,0.65)",
              fontSize: 14, fontWeight: 400,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
          >
            <IconGlobe />
            Ver mi landing
          </button>
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: "rgba(217,70,239,0.15)", border: "1px solid rgba(217,70,239,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#D946EF", margin: 0, letterSpacing: "0.06em" }}>PLAN PRO</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>Plan Pro activo</p>
          </div>
          <button
            onClick={() => router.push("/onboarding")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
              color: "rgba(255,255,255,0.5)", fontSize: 13,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <IconLogout />
            Salir
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", background: "#F7F8FA", padding: 24 }}>
        <style dangerouslySetInnerHTML={{ __html: "@keyframes pulse-dot{0%,100%{opacity:1;box-shadow:0 0 8px #16EFFF}50%{opacity:0.6;box-shadow:0 0 16px #16EFFF}}" }} />
        {children}
      </main>
    </div>
  );
}
