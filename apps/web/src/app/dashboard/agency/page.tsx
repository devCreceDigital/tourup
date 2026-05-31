"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAgency, getTrips, getWorkers } from "@/lib/store/agencyStore";
import type { AgencyData, Trip, Worker } from "@/lib/store/agencyStore";

const ROLE_LABELS: Record<Worker["role"], string> = {
  owner: "Propietario",
  admin: "Admin",
  manager: "Manager",
  agent: "Agente",
};

const ROLE_COLORS: Record<Worker["role"], { bg: string; color: string }> = {
  owner: { bg: "#0A2540", color: "#fff" },
  admin: { bg: "#DBEAFE", color: "#1E40AF" },
  manager: { bg: "#FEF3C7", color: "#92400E" },
  agent: { bg: "#F1F5F9", color: "#475569" },
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ fontSize: 32, fontWeight: 800, color: "#0A2540", margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A2540", margin: 0 }}>{title}</h2>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{ fontSize: 13, color: "#0A2540", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 500 }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

export default function AgencyDashboard() {
  const router = useRouter();
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAgency(getAgency());
    setTrips(getTrips());
    setWorkers(getWorkers());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "#64748B" }}>Cargando...</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✈️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0A2540", marginBottom: 8 }}>¡Bienvenido a Traventia!</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, lineHeight: 1.6 }}>
          Parece que aún no has configurado tu agencia. Completa el onboarding para activar tu panel.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          style={{ background: "#D946EF", color: "#fff", border: "none", borderRadius: 10, padding: "13px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
        >
          Configurar mi agencia
        </button>
      </div>
    );
  }

  const publishedTrips = trips.filter((t) => t.status === "published");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0A2540", margin: "0 0 6px" }}>
            Bienvenido, {agency.nombre}
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>{agency.slogan}</p>
        </div>
        <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 20, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#15803D" }}>Plan Pro activo</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Viajes publicados" value={publishedTrips.length} />
        <StatCard label="Trabajadores" value={workers.length} />
        <StatCard label="Visitas este mes" value={127} sub="Landing pública" />
        <StatCard label="Reservas pendientes" value={3} sub="Requieren atención" />
      </div>

      {/* Info agencia */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <SectionHeader title="Información de tu agencia" action="Editar perfil" onAction={() => router.push("/dashboard/settings")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Nombre", value: agency.nombre },
            { label: "Tipo", value: agency.agencyType },
            { label: "Email", value: agency.email },
            { label: "Teléfono", value: agency.telefono },
          ].map((row) => (
            <div key={row.label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</p>
              <p style={{ fontSize: 14, color: "#0A2540", margin: 0, fontWeight: 500 }}>{row.value}</p>
            </div>
          ))}
          <div style={{ gridColumn: "span 2" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción</p>
            <p style={{ fontSize: 14, color: "#0A2540", margin: 0, lineHeight: 1.5 }}>{agency.descripcion}</p>
          </div>
        </div>
      </div>

      {/* Viajes recientes */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <SectionHeader title="Tus viajes recientes" action="Ver todos" onAction={() => router.push("/dashboard/trips")} />
        {trips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>No hay viajes aún.</p>
            <button onClick={() => router.push("/dashboard/trips")} style={{ marginTop: 12, background: "#D946EF", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Crear primer viaje
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {trips.slice(0, 3).map((trip) => (
              <div key={trip.id} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 14, background: "#FAFAFA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540", margin: 0, flex: 1, lineHeight: 1.3 }}>{trip.title}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: trip.status === "published" ? "#DCFCE7" : "#F1F5F9", color: trip.status === "published" ? "#15803D" : "#64748B", marginLeft: 6, flexShrink: 0 }}>
                    {trip.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px" }}>📍 {trip.destination}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", margin: 0 }}>
                  Desde {trip.currency} {trip.priceFrom.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipo */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <SectionHeader title="Tu equipo" action="Gestionar equipo" onAction={() => router.push("/dashboard/workers")} />
        {workers.length === 0 ? (
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>No hay trabajadores aún.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {workers.slice(0, 3).map((w) => {
              const roleStyle = ROLE_COLORS[w.role];
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{w.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", margin: 0 }}>{w.name}</p>
                    <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{w.email}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: roleStyle.bg, color: roleStyle.color }}>
                    {ROLE_LABELS[w.role]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Landing pública */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
        <SectionHeader title="Tu landing pública" />
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#F7F8FA", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>URL pública</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#3B82F6", margin: 0 }}>traventia.com/{agency.slug}</p>
          </div>
          <button
            onClick={() => window.open(`/${agency.slug}`, "_blank")}
            style={{ background: "#0A2540", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Abrir
          </button>
          <button
            onClick={() => router.push("/dashboard/settings")}
            style={{ background: "#fff", color: "#0A2540", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Editar landing
          </button>
        </div>
      </div>
    </div>
  );
}
