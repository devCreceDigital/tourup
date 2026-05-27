"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Plane,
  Bell,
  Settings,
  LogOut,
  Compass,
} from "lucide-react";
import { ViajeroSidebar } from "@/contexts/enrollments/ui/navigation/ViajeroSidebar";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { clearProfileSession } from "@/shared/api/profile";

export default function ViajeroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await requestTotemApi("/notifications/?unread=1&page=1&page_size=1");
        if (!res.ok) return;
        const data = await res.json();
        const count = typeof data?.count === "number" ? data.count : 0;
        if (!cancelled) setUnread(count);
      } catch (err) {
        console.error("Error polling notifications:", err);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const handleLogout = async () => {
    clearProfileSession();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef0f8] font-sans text-[#333] text-[14px]">
      {/* ============ TOPBAR ============ */}
      <header className="flex items-center justify-between bg-white px-5 py-2.5 border-b border-[#e0e4ef] shrink-0">
        {/* Logo */}
        <div className="text-[20px] font-black tracking-tighter text-[#5b5bdb] flex items-center gap-2">
          <Plane className="h-6 w-6 text-[#1e1e4e]" />
          totem<span className="text-[#1e1e4e]">viajero</span>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-3.5 text-[12px] text-[#666]">
          {/* Botón Volver al Catálogo */}
          <button
            onClick={() => router.push("/viajes")}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#00B4FC] hover:bg-[#0098d6] text-white text-xs font-bold rounded-md transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            Catálogo
          </button>
          
          <Link
            href="/viajero/notificaciones"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f0f2f5] hover:bg-slate-200 relative"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {Math.min(unread, 9)}
              </span>
            ) : null}
          </Link>

          <Link
            href="/viajero/configuracion"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f0f2f5] hover:bg-slate-200"
            aria-label="Configuracion"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#5b5bdb] text-white font-bold text-[13px]">
            C
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Fijo */}
        <ViajeroSidebar />

        {/* Contenido scrollable */}
        <main className="flex-1 overflow-auto p-5 relative">
          <div className="mx-auto max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
