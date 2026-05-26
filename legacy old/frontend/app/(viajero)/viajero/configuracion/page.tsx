"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Bell, Shield, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const STORAGE_KEY = "viajero_prefs";

type Prefs = {
  notificacionesEmail: boolean;
  notificacionesApp: boolean;
};

const DEFAULT_PREFS: Prefs = {
  notificacionesEmail: true,
  notificacionesApp: true,
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function ViajeroConfiguracionPage() {
  const [prefs, setPrefs] = useState<Prefs>(() =>
    typeof window === "undefined" ? DEFAULT_PREFS : loadPrefs()
  );
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Prefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const activos = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Preferencias activas: {activos}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-[12px] text-[#1A8A4A] font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </span>
          )}
          <Link href="/viajero/notificaciones">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-[#00B4FC]" />
            <h2 className="font-semibold text-gray-900">Preferencias</h2>
            <Badge variant="gray">MVP</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones por email</p>
                <p className="text-xs text-gray-600">Recibe avisos importantes en tu correo.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggle("notificacionesEmail")}>
                {prefs.notificacionesEmail ? "Activado" : "Desactivado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificaciones en app</p>
                <p className="text-xs text-gray-600">Alertas dentro del portal.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggle("notificacionesApp")}>
                {prefs.notificacionesApp ? "Activado" : "Desactivado"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-[#00B4FC]" />
            <h2 className="font-semibold text-gray-900">Cuenta</h2>
          </div>
          <div className="space-y-2">
            <Link href="/viajero">
              <Button variant="outline" className="w-full justify-start">
                Ir al panel
              </Button>
            </Link>
            <Link href="/viajes">
              <Button variant="outline" className="w-full justify-start">
                Ver catálogo
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
