"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Settings, Shield, Users, Bell, ChevronRight,
  Mail, Smartphone, CreditCard, Globe, Lock, Loader2, CheckCircle
} from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { getCurrentProfile, persistProfileSession } from "@/shared/api/profile";

const DEFAULT_PREFS = {
  notificacionesEmail: true,
  notificacionesApp: true,
  recordatoriosPago: true,
  recordatoriosDocumentos: false,
  notificacionesNuevaInscripcion: true,
};

type Prefs = typeof DEFAULT_PREFS;

export default function AdminConfiguracionPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getCurrentProfile();
      if (me === null) return;
      persistProfileSession(me);
      const tid = me.tenantId;
      if (!tid) return;
      setTenantId(tid);
      const resPref = await requestTotemApi("/tenancy/preferences");
      if (resPref.ok) {
        const data = await resPref.json();
        setPrefs({ ...DEFAULT_PREFS, ...(data.preferences?.preferences ?? data.preferences ?? {}) });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  const toggle = async (key: keyof Prefs) => {
    if (!tenantId) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      await requestTotemApi("/tenancy/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: next, onboardingStep: 100 }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const accesos = [
    { href: "/admin/usuarios", icon: Users, label: "Equipo y Usuarios", desc: "Gestiona roles e invitaciones", color: "text-[#5B4FE8]", bg: "bg-[#eeedfe]" },
    { href: "/admin/notificaciones", icon: Bell, label: "Notificaciones", desc: "Centro de alertas del sistema", color: "text-[#BA7517]", bg: "bg-[#faeeda]" },
    { href: "/admin/seguridad", icon: Shield, label: "Seguridad y Auditoria", desc: "Logs y control de acceso", color: "text-[#1D9E75]", bg: "bg-[#e1f5ee]" },
    { href: "/admin/data", icon: Users, label: "Perfiles", desc: "Todos los usuarios del sistema", color: "text-[#185FA5]", bg: "bg-[#e6f1fb]" },
  ];

  const notifItems: { key: keyof Prefs; icon: typeof Mail; label: string; desc: string }[] = [
    { key: "notificacionesEmail", icon: Mail, label: "Notificaciones por email", desc: "Recibe alertas importantes en tu correo" },
    { key: "notificacionesApp", icon: Smartphone, label: "Notificaciones en app", desc: "Alertas dentro del dashboard" },
    { key: "recordatoriosPago", icon: CreditCard, label: "Recordatorios de pago", desc: "Avisos de cuotas proximas a vencer" },
    { key: "recordatoriosDocumentos", icon: Globe, label: "Alertas de documentos", desc: "Documentos pendientes de revision" },
    { key: "notificacionesNuevaInscripcion", icon: Users, label: "Nueva inscripcion", desc: "Aviso cuando un viajero se inscribe" },
  ];

  const activos = Object.values(prefs).filter(Boolean).length;


  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-[#E0E4EF] px-6 py-4 flex items-center justify-between shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#eeedfe] flex items-center justify-center">
            <Settings className="h-5 w-5 text-[#5B4FE8]" />
          </div>
          <div>
            <h1 className="text-[16px] font-extrabold text-[#1a1a2e] tracking-tight">Configuracion</h1>
            <p className="text-[11px] text-[#aaa]">{activos} preferencias activas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-[#5B4FE8]" />}
          {saved && <span className="flex items-center gap-1 text-[11px] text-[#1D9E75] font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Guardado</span>}
          <span className="px-2.5 py-1 rounded-full bg-[#eeedfe] text-[#3c3489] text-[11px] font-bold">MVP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
            <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#5B4FE8]" />
              <span className="text-[13px] font-bold text-[#1a1a2e]">Preferencias de notificaciones</span>
            </div>
            {loading ? (
              <div className="p-8 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#5B4FE8]" />
                <span className="text-[12px] text-[#aaa]">Cargando preferencias...</span>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f3fb]">
                {notifItems.map(item => {
                  const Icon = item.icon;
                  const active = prefs[item.key];
                  return (
                    <div key={item.key} className="px-5 py-4 flex items-center justify-between hover:bg-[#faf9ff] transition">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-[#eeedfe]" : "bg-[#f5f3fb]"}`}>
                          <Icon className={`h-4 w-4 ${active ? "text-[#5B4FE8]" : "text-[#ccc]"}`} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#1a1a2e]">{item.label}</p>
                          <p className="text-[10px] text-[#aaa]">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(item.key)}
                        disabled={saving}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 disabled:opacity-70 ${active ? "bg-[#5B4FE8]" : "bg-[#ddd]"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E0E4EF] overflow-hidden shadow-[0_4px_24px_rgba(91,79,232,0.08)]">
            <div className="px-5 py-3 border-b border-[#e8e3f5] flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-[#5B4FE8]" />
              <span className="text-[13px] font-bold text-[#1a1a2e]">Accesos rapidos</span>
            </div>
            <div className="divide-y divide-[#f5f3fb]">
              {accesos.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link key={i} href={item.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#faf9ff] transition group">
                    <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#1a1a2e]">{item.label}</p>
                      <p className="text-[10px] text-[#aaa]">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[#ccc] group-hover:text-[#5B4FE8] transition flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-white/60" />
              <span className="text-[12px] font-bold text-white/80">Seguridad</span>
            </div>
            <p className="text-[11px] text-white/50 mb-4">Manten tu cuenta protegida con estas configuraciones.</p>
            <div className="space-y-2">
              {[
                { label: "Autenticacion 2FA", status: "No configurado", color: "text-[#FAC775]" },
                { label: "Sesion activa", status: "1 dispositivo", color: "text-[#9FE1CB]" },
                { label: "Ultimo acceso", status: "Hoy", color: "text-white/60" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-white/50">{item.label}</span>
                  <span className={`text-[11px] font-semibold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <Link href="/admin/seguridad">
              <button className="mt-4 w-full rounded-lg border border-white/20 py-2 text-[11px] font-bold text-white/70 hover:bg-white/10 transition">
                Ver detalles
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
