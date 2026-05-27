"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Bell, LogOut, ExternalLink, Search as SearchIcon,
  Settings, ChevronDown, Globe, X,
} from "lucide-react";
import { Sidebar } from "@/contexts/platform/ui/navigation/Sidebar";
import { requestTotemApi } from "@/shared/api/totem-api-client";
import { clearProfileSession, getCurrentProfile, persistProfileSession } from "@/shared/api/profile";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [colorPrimario, setColorPrimario] = useState("#5B4FE8");
  const [checking, setChecking] = useState(true);
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("AD");
  const [nombreAgencia, setNombreAgencia] = useState("");
  const [logoAgencia, setLogoAgencia] = useState("");
  const [dominio, setDominio] = useState("");

  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [showUser, setShowUser] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const LINKS = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/viajes", label: "Viajes" },
    { href: "/admin/reservas", label: "Reservas" },
    { href: "/admin/pagos", label: "Pagos" },
    { href: "/admin/viajeros", label: "Viajeros" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/itinerarios", label: "Itinerarios" },
    { href: "/admin/operaciones", label: "Operaciones" },
    { href: "/admin/data", label: "Analytics" },
    { href: "/admin/mi-pagina", label: "Mi Pagina" },
    { href: "/admin/configuracion", label: "Configuracion" },
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setShowSearch(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const rol = localStorage.getItem("totem_rol");
    if (rol === "superadmin") { router.replace("/superadmin"); return; }
    if (rol && rol !== "superadmin") {
      const nombre = localStorage.getItem("totem_nombre") || "Admin";
      const email = localStorage.getItem("totem_email") || "";
      setUserName(nombre); setUserEmail(email);
      setUserInitials(nombre.substring(0,2).toUpperCase());
      setNombreAgencia(localStorage.getItem("totem_nombre_agencia") || "");
      // Siempre refrescar datos del tenant desde backend
      const token = localStorage.getItem("totem_token");
      if (token) {
        getCurrentProfile().then(async perfil => {
          if (perfil?.tenantId) {
            persistProfileSession(perfil);
            const r = await requestTotemApi("/tenancy/preferences");
            if (r.ok) {
              const t = await r.json();
              if (t.name) { setNombreAgencia(t.name); localStorage.setItem("totem_nombre_agencia", t.name); }
              if (t.logoUrl) setLogoAgencia(t.logoUrl);
              if (t.domain) setDominio(t.domain);
              if (t.primaryColor) setColorPrimario(t.primaryColor);
            }
          }
        }).catch(() => {});
      }
      setChecking(false);
    }
    if (!rol) {
      const token = localStorage.getItem("totem_token");
      if (token) {
        getCurrentProfile().then(async perfil => {
          if (perfil === null) {
            setChecking(false);
            return;
          }
          persistProfileSession(perfil);
          const normalizedRole = perfil.role === "viajero" ? "usuario" : perfil.role;
          if (normalizedRole === "superadmin") { router.replace("/superadmin"); return; }
          setUserName(perfil.name || "Admin");
          setUserEmail(perfil.email || "");
          setUserInitials((perfil.name || "AD").substring(0,2).toUpperCase());
          if (perfil.tenantId) {
            const r = await requestTotemApi("/tenancy/preferences");
            if (r.ok) {
              const t = await r.json();
              if (t.name) { setNombreAgencia(t.name); localStorage.setItem("totem_nombre_agencia", t.name); }
              if (t.logoUrl) setLogoAgencia(t.logoUrl);
              if (t.domain) setDominio(t.domain);
              if (t.primaryColor) setColorPrimario(t.primaryColor);
            }
          }
          setChecking(false);
        }).catch(() => setChecking(false));
      } else setChecking(false);
    } else setChecking(false);
  }, [router]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getCurrentProfile();
        if (me === null) return;
        persistProfileSession(me);
        if (me.name) { setUserName(me.name); setUserInitials(me.name.substring(0,2).toUpperCase()); }
        if (!me.tenantId) return;
        const cfg = await (await requestTotemApi("/tenancy/preferences")).json();
        if (cfg.color_primario) setColorPrimario(cfg.color_primario);
        if (cfg.logo_url) setLogoAgencia(cfg.logo_url);
        if (cfg.dominio) setDominio(cfg.dominio);
        if (cfg.nombre) { setNombreAgencia(cfg.nombre); localStorage.setItem("totem_nombre_agencia", cfg.nombre); }
      } catch {}
    };
    void load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await requestTotemApi("/notifications/?page=1&page_size=5");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const items = data.results ?? data ?? [];
          setNotifs(Array.isArray(items) ? items.slice(0,5) : []);
        }
        const unreadRes = await requestTotemApi("/notifications/?unread=1&page=1&page_size=1");
        if (unreadRes.ok) {
          const ud = await unreadRes.json();
          if (!cancelled) setUnread(typeof ud?.count === "number" ? ud.count : 0);
        }
      } catch {}
    };
    void tick();
    const id = window.setInterval(() => void tick(), 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const handleLogout = async () => {
    clearProfileSession();
    router.push("/login");
    router.refresh();
  };

  const filteredLinks = search.trim()
    ? LINKS.filter(l => l.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0edf8]">
      <div className="w-8 h-8 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f0edf8] font-sans text-[#333] text-[14px]"
      style={{"--color-primary": colorPrimario, "--color-primary-light": colorPrimario + "22"} as React.CSSProperties}>

      {/* ===== TOPBAR ===== */}
      <header className="flex items-center bg-[#1a1a2e] px-4 shrink-0 gap-3 h-[56px] border-b border-white/5 z-40 relative">

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0 pr-3 border-r border-white/10">
          <img src="/logo-traventia.png" alt="Traventia" style={{height:"26px",width:"auto"}} />
        </div>

        {/* Nombre agencia centro */}
        <div className="flex-1 flex justify-center items-center gap-2.5">
          {logoAgencia && (
            <img src={logoAgencia} alt={nombreAgencia} className="h-7 w-auto object-contain rounded-md" />
          )}
          <span style={{ color: "#ffffff", fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            {nombreAgencia}
          </span>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-0.5">

          {/* Buscador */}
          <div className="relative" ref={searchRef}>
            <button onClick={() => setShowSearch(v => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${showSearch ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}`}
              aria-label="Buscar">
              <SearchIcon className="h-4 w-4" />
            </button>
            {showSearch && (
              <div className="absolute right-0 top-10 w-72 bg-[#0f0f23] border border-white/10 rounded-xl shadow-2xl p-3 z-50">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar seccion..."
                    className="w-full rounded-lg border border-white/10 py-2 pl-9 pr-8 text-[12px] text-white placeholder-white/30 outline-none focus:border-[#5B4FE8] bg-white/5" />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {filteredLinks.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {filteredLinks.map(l => (
                      <Link key={l.href} href={l.href}
                        onClick={() => { setShowSearch(false); setSearch(""); }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/10 hover:text-white transition">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: colorPrimario}} />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
                {search && filteredLinks.length === 0 && (
                  <p className="mt-2 text-center text-[11px] text-white/30 py-3">Sin resultados para "{search}"</p>
                )}
                {!search && (
                  <p className="mt-2 text-center text-[11px] text-white/20 py-1">Escribe para buscar...</p>
                )}
              </div>
            )}
          </div>

          {/* Ver pagina publica */}
          <Link href={dominio ? `/agencias/${dominio}` : "/"} target="_blank"
            className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-white/40 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap ml-1">
            <Globe className="h-3.5 w-3.5" />
            {dominio ? "Mi pagina" : "Ver catalogo"}
          </Link>

          {/* Notificaciones */}
          <div className="relative" ref={notifsRef}>
            <button onClick={() => setShowNotifs(v => !v)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition ${showNotifs ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}`}
              aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {Math.min(unread, 9)}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 bg-[#0f0f23] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-[12px] font-semibold text-white">Notificaciones</span>
                  {unread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">{unread} nuevas</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell className="h-7 w-7 text-white/10 mx-auto mb-2" />
                      <p className="text-[11px] text-white/30">Sin notificaciones por ahora</p>
                    </div>
                  ) : notifs.map((n, i) => (
                    <div key={i} className={`px-4 py-3 hover:bg-white/5 transition ${!n.leida ? "bg-[#5B4FE8]/10" : ""}`}>
                      <div className="flex items-start gap-2.5">
                        {!n.leida && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background: colorPrimario}} />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/80 leading-relaxed">{n.mensaje || n.titulo || "Notificacion"}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{n.created_at ? new Date(n.created_at).toLocaleDateString("es-PE", {day:"2-digit",month:"short"}) : ""}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-white/10">
                  <Link href="/admin/notificaciones" onClick={() => setShowNotifs(false)}
                    className="block text-center text-[11px] hover:underline py-0.5 transition" style={{color: colorPrimario}}>
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="w-px h-5 bg-white/10 mx-2" />

          {/* Avatar menu */}
          <div className="relative" ref={userRef}>
            <button onClick={() => setShowUser(v => !v)}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition ${showUser ? "bg-white/10" : "hover:bg-white/10"}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-[11px] flex-shrink-0 ring-2 ring-white/10"
                style={{background: colorPrimario}}>
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] text-white/40 leading-tight">Administrador de agencia</div>
                <div className="text-[12px] font-semibold text-white leading-tight">{userName}</div>
              </div>
              <ChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 ${showUser ? "rotate-180" : ""}`} />
            </button>

            {showUser && (
              <div className="absolute right-0 top-11 w-56 bg-[#0f0f23] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-[11px] flex-shrink-0"
                      style={{background: colorPrimario}}>
                      {userInitials}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white">{userName}</p>
                      <p className="text-[10px] text-white/40 truncate max-w-[140px]">{userEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/admin/configuracion" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-white/60 hover:bg-white/10 hover:text-white transition">
                    <Settings className="h-3.5 w-3.5" /> Configuracion
                  </Link>
                  <Link href="/admin/mi-pagina" onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-white/60 hover:bg-white/10 hover:text-white transition">
                    <Globe className="h-3.5 w-3.5" /> Mi pagina
                  </Link>
                </div>
                <div className="border-t border-white/10 py-1">
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[12px] text-rose-400 hover:bg-rose-500/10 transition">
                    <LogOut className="h-3.5 w-3.5" /> Cerrar sesion
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ===== MAIN ===== */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-[#eef0f8]">
          <div className="flex-1 overflow-y-auto p-[20px]">
            <div className="mx-auto max-w-6xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
