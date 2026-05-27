"use client";

import Link from "next/link";
import { Plane, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clearProfileSession } from "@/shared/api/profile";

type NavUser = {
  readonly email: string;
  readonly name: string;
  readonly role: string;
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("totem_token");
    if (!token) {
      setUser(null);
      return;
    }
    setUser({
      email: localStorage.getItem("totem_email") ?? "",
      name: localStorage.getItem("totem_nombre") ?? "Mi cuenta",
      role: localStorage.getItem("totem_rol") ?? "usuario",
    });
  }, []);

  const handleLogout = async () => {
    clearProfileSession();
    setMenuAbierto(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const rol = user?.role;
  const displayName = user?.name || user?.email?.split("@")[0] || "Mi cuenta";
  const portalHref = rol === "admin" || rol === "profesor" ? "/admin" : "/viajero";

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#1E1E4E]/80 backdrop-blur-md border-b border-white/10 py-3 shadow-lg"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo-traventia.png" alt="Traventia" style={{height:"38px",width:"auto"}} />
        </Link>

        {/* Menú desktop centrado */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/90">
          <li>
            <Link href="/" className="relative group transition-colors hover:text-white">
              Inicio
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link href="/viajes" className="relative group transition-colors hover:text-white">
              Viajes
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link href="/nosotros" className="relative group transition-colors hover:text-white">
              Nosotros
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link href="/galeria" className="relative group transition-colors hover:text-white">
              Galería
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link href="/reservar" className="relative group transition-colors hover:text-white">
              Reserva
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
          <li>
            <Link href="/asistente-ia" className="relative group flex items-center gap-1 transition-colors text-[#00B4FC] hover:text-white">
              <SparkleIcon />
              Asistente IA
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00B4FC] transition-all group-hover:w-full"></span>
            </Link>
          </li>
        </ul>

        {/* CTA a la derecha */}
        <div className="hidden md:flex items-center gap-4 text-sm font-semibold">
          {user ? (
            <div className="relative ml-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/40 shadow-lg"
              >
                <User className="h-4 w-4" />
                {displayName}
              </motion.button>

              <AnimatePresence>
                {menuAbierto && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 w-56 rounded-2xl border border-white/10 bg-[#1E1E4E]/95 backdrop-blur-xl shadow-2xl py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 text-[11px] text-white/50 border-b border-white/10 truncate">
                      {user.email}
                    </div>
                    <Link
                      href={portalHref}
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[13px] text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Mi Portal
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-[13px] text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full border border-transparent bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#1E1E4E] transition-all hover:bg-white/90 shadow-lg hover:shadow-xl"
              >
                Ingresar
              </Link>
            </motion.div>
          )}
        </div>

        {/* Hamburguesa móvil */}
        <button
          type="button"
          className="md:hidden text-white p-2"
          aria-label="Abrir menú"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1E1E4E]/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4 flex flex-col">
              <Link href="/" className="text-white/90 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
              <Link href="/viajes" className="text-white/90 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Viajes</Link>
              <Link href="/nosotros" className="text-white/90 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Nosotros</Link>
              <Link href="/galeria" className="text-white/90 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Galería</Link>
              <Link href="/reservar" className="text-white/90 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Reserva</Link>
              <Link href="/asistente-ia" className="text-[#00B4FC] text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <SparkleIcon /> Asistente IA
              </Link>

              <div className="h-px bg-white/10 my-2"></div>

              {user ? (
                <>
                  <div className="text-white/50 text-sm truncate">{user.email}</div>
                  <Link href={portalHref} className="flex items-center gap-2 text-white/90 text-lg" onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Mi Portal
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-lg w-full text-left">
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link href="/login" className="bg-[#00B4FC] text-white text-center rounded-xl py-3 font-bold uppercase tracking-wider" onClick={() => setMobileMenuOpen(false)}>
                  Ingresar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  )
}
