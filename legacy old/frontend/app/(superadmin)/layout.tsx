"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Headphones, Users,
  CreditCard, ShieldCheck, LogOut, ChevronRight,
  Plane, History,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/superadmin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/superadmin/agencias",  label: "Agencias",   icon: Building2 },
  { href: "/superadmin/tickets",   label: "Soporte",    icon: Headphones },
  { href: "/superadmin/usuarios",  label: "Usuarios",   icon: Users },
  { href: "/superadmin/planes",    label: "Planes",     icon: CreditCard },
  { href: "/superadmin/audit",     label: "Auditoría",  icon: History },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [perfil, setPerfil]   = useState<{ nombre: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("totem_token");
    const rol   = localStorage.getItem("totem_rol");
    if (!token || rol !== "superadmin") {
      router.replace("/admin");
      return;
    }
    const nombre = localStorage.getItem("totem_nombre") || "Superadmin";
    const email  = localStorage.getItem("totem_email")  || "";
    setPerfil({ nombre, email });
    setChecking(false);
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    localStorage.clear();
    router.replace("/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
        <div className="w-8 h-8 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f0edf8]">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-[#1a1a2e] flex flex-col fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#5B4FE8] rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Traventia</p>
              <p className="text-[#5B4FE8] text-xs font-medium">Superadmin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/superadmin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-[#5B4FE8] text-white font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Separador — ir al panel admin normal */}
        <div className="px-3 pb-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Panel Admin</span>
          </Link>
        </div>

        {/* Perfil + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#5B4FE8]/30 flex items-center justify-center">
              <span className="text-[#5B4FE8] text-xs font-bold">
                {perfil?.nombre?.[0]?.toUpperCase() ?? "S"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{perfil?.nombre}</p>
              <p className="text-white/40 text-xs truncate">{perfil?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
