"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plane } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDashboardPath } from "@/lib/auth/roles";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const registered = searchParams.get("registered");
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("El cliente de autenticación no está configurado.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      return;
    }

    // Obtener token JWT de Supabase
    const token = data.session?.access_token;
    if (!token) {
      setLoading(false);
      setError("Error al obtener sesión. Intenta de nuevo.");
      return;
    }

    // Guardar token base para poder llamar al backend
    localStorage.setItem("totem_token", token);
    // Guardar en cookie para server components
    document.cookie = `totem_token=${token}; path=/; max-age=604800; SameSite=Lax`;

    // Obtener perfil del backend (rol, nombre, email)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL ?? "http://localhost:8000"}/api/perfil/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const perfil = await res.json();
        localStorage.setItem("totem_token",  token);
        localStorage.setItem("totem_rol",    perfil.rol    ?? "usuario");
        localStorage.setItem("totem_nombre", perfil.nombre ?? "");
        localStorage.setItem("totem_email",  perfil.email  ?? email);

        // Redirigir según rol
        const destinos: Record<string, string> = {
          superadmin:  "/superadmin",
          admin:       "/admin",
          coordinador: "/admin",
          docente:     "/admin",
          usuario:     "/viajero",
        };
        const rol = perfil.rol ?? "usuario";
        // Si es admin sin tenant, va al onboarding
        const esAdmin = rol === "admin" || rol === "superadmin" || rol === "coordinador" || rol === "docente";
        const sinTenant = esAdmin && !perfil.tenant_id;
        const destination = sinTenant ? "/onboarding" : (redirectTo ?? destinos[rol] ?? "/admin");
        setLoading(false);
        router.push(destination);
        router.refresh();
        return;
      }
    } catch (_) {}

    // Fallback si no se pudo obtener el perfil
    setLoading(false);
    const destination = redirectTo ?? getDashboardPath(data.user);
    router.push(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
      {registered === "1" && (
        <div className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
          Cuenta creada correctamente. Si tu proyecto exige confirmacion por correo, verifica tu bandeja y luego inicia sesion.
        </div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
          Correo Electrónico
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md bg-[#F5F6FB] border border-transparent px-4 py-3 text-sm focus:border-[#00B4FC] focus:bg-white focus:outline-none transition-colors"
          placeholder="correo@ejemplo.com"
        />
      </div>
      <div>
        <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md bg-[#F5F6FB] border border-transparent px-4 py-3 text-sm focus:border-[#00B4FC] focus:bg-white focus:outline-none transition-colors"
          placeholder="••••••••"
        />
      </div>

      <div className="flex justify-end mt-1">
        <a
          href="#"
          className="text-xs text-gray-600 font-bold hover:text-[#00B4FC] hover:underline underline-offset-2 transition-colors"
        >
          ¿Has olvidado tu contraseña?
        </a>
      </div>

      <div className="mt-2">
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          className="w-full bg-[#00B4FC] hover:bg-[#0098d6] border-[#00B4FC] text-white py-3.5 text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen font-sans bg-white">
      {/* Mitad Izquierda */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative flex-col justify-center px-12"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(15, 30, 45, 0.3), rgba(15, 30, 45, 0.7)), url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu_Peru.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-black uppercase tracking-tight leading-tight mb-4">
            Tu próximo viaje <br /> comienza aquí
          </h2>
          <p className="text-lg text-white/90 font-medium">
            Accede a la plataforma para gestionar tus pagos, revisar tu
            itinerario y mantener tu documentación al día.
          </p>
        </div>
      </div>

      {/* Mitad Derecha */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-8 sm:px-16 xl:px-24">
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#00B4FC] text-white text-xl font-bold mb-4 shadow-lg">
            <Plane className="h-8 w-8" />
          </div>
          <div className="text-3xl font-black tracking-tight text-[#1E1E4E] flex items-center gap-1">
            Traventia
          </div>
          <p className="text-gray-500 font-medium mt-2">Acceder a tu cuenta</p>
        </div>

        <Suspense fallback={<div className="h-48" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-bold text-[#00B4FC] hover:underline underline-offset-2"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>
    </main>
  );
}
