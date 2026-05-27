"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Plane, Headphones, CreditCard, TrendingUp } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

interface Stats {
  total_agencias: number;
  agencias_activas: number;
  total_usuarios: number;
  total_viajes: number;
  total_inscripciones: number;
  tickets_abiertos: number;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestTotemApi("/platform/superadmin-stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({
        total_agencias: 0, agencias_activas: 0,
        total_usuarios: 0, total_viajes: 0,
        total_inscripciones: 0, tickets_abiertos: 0,
      }))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Agencias totales",  value: stats?.total_agencias,      icon: Building2,  color: "bg-[#5B4FE8]/10 text-[#5B4FE8]" },
    { label: "Agencias activas",  value: stats?.agencias_activas,    icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Usuarios sistema",  value: stats?.total_usuarios,      icon: Users,      color: "bg-blue-50 text-blue-600" },
    { label: "Viajes publicados", value: stats?.total_viajes,        icon: Plane,      color: "bg-purple-50 text-purple-600" },
    { label: "Inscripciones",     value: stats?.total_inscripciones, icon: CreditCard, color: "bg-orange-50 text-orange-600" },
    { label: "Tickets abiertos",  value: stats?.tickets_abiertos,    icon: Headphones, color: "bg-red-50 text-red-500" },
  ];

  const acciones = [
    { href: "/superadmin/agencias", label: "Gestionar agencias",   desc: "Ver, activar o suspender" },
    { href: "/superadmin/tickets",  label: "Tickets de soporte",   desc: "Responder tickets abiertos" },
    { href: "/superadmin/planes",   label: "Planes y precios",     desc: "Configurar suscripciones" },
    { href: "/superadmin/usuarios", label: "Usuarios del sistema", desc: "Roles y permisos" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard global</h1>
        <p className="text-gray-500 text-sm mt-1">Vista general de toda la plataforma Traventia</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#ede9f8] shadow-[0_4px_24px_rgba(91,79,232,0.08)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#ede9f8] shadow-[0_4px_24px_rgba(91,79,232,0.08)] p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Acciones rapidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {acciones.map(({ href, label, desc }) => (
            <a
              key={href}
              href={href}
              className="p-4 rounded-lg border border-[#ede9f8] hover:border-[#5B4FE8]/30 hover:bg-[#5B4FE8]/5 transition-all group"
            >
              <p className="text-sm font-medium text-gray-800 group-hover:text-[#5B4FE8]">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
