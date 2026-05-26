"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plane, Building2, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type TipoCuenta = "viajero" | "admin";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>("viajero");
  const [nombre, setNombre] = useState("");
  const [nombreAgencia, setNombreAgencia] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("El cliente de autenticación no está configurado.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombre,
          rol: tipoCuenta,
          nombre_agencia: tipoCuenta === "admin" ? nombreAgencia : undefined,
        },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Este correo ya está registrado. ¿Querés iniciar sesión?");
      } else {
        setError(error.message);
      }
      return;
    }

    if (data.user) {
      if (tipoCuenta === "admin" && nombreAgencia) {
        localStorage.setItem("totem_nombre_agencia", nombreAgencia);
      }
      const destination = tipoCuenta === "admin" ? "/onboarding" : "/viajero";
      if (data.session) {
        router.push(destination);
      } else {
        router.push(`/login?registered=1&redirect=${encodeURIComponent(destination)}`);
      }
    }
  };

  return (
    <main className="flex min-h-screen font-sans bg-white">
      {/* Mitad Izquierda */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative flex-col justify-center px-12"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(15, 30, 45, 0.4), rgba(15, 30, 45, 0.8)), url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu_Peru.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-black uppercase tracking-tight leading-tight mb-4">
            Únete a la <br /> aventura
          </h2>
          <p className="text-lg text-white/90 font-medium">
            Regístrate en segundos para inscribirte en tu próximo viaje, o crea
            tu agencia y empezá a gestionar grupos hoy mismo.
          </p>
        </div>
      </div>

      {/* Mitad Derecha */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-8 sm:px-16 xl:px-24 overflow-y-auto py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#00B4FC] text-white text-xl font-bold mb-4 shadow-lg">
            <Plane className="h-8 w-8" />
          </div>
          <div className="text-3xl font-black tracking-tight text-[#1E1E4E] flex items-center gap-1">
            Traventia
          </div>
          <p className="text-gray-500 font-medium mt-2">Crear nueva cuenta</p>
        </div>

        {/* Selector tipo de cuenta */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto mb-6">
          <button
            type="button"
            onClick={() => setTipoCuenta("viajero")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
              tipoCuenta === "viajero"
                ? "border-[#00B4FC] bg-[#00B4FC]/5 text-[#00B4FC]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            )}
          >
            <User className="h-6 w-6" />
            <div>
              <p className="text-xs font-bold">Soy viajero</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Quiero inscribirme a un viaje</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTipoCuenta("admin")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
              tipoCuenta === "admin"
                ? "border-[#1E1E4E] bg-[#1E1E4E]/5 text-[#1E1E4E]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            )}
          >
            <Building2 className="h-6 w-6" />
            <div>
              <p className="text-xs font-bold">Soy agencia</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Quiero gestionar viajes</p>
            </div>
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleRegistro}
          className="flex flex-col gap-4 w-full max-w-sm mx-auto"
        >
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-md bg-[#F5F6FB] border border-transparent px-4 py-3 text-sm focus:border-[#00B4FC] focus:bg-white focus:outline-none transition-colors"
              placeholder="Ej: Juan Pérez"
            />
          </div>



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
              placeholder="Mín. 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md bg-[#F5F6FB] border border-transparent px-4 py-3 text-sm focus:border-[#00B4FC] focus:bg-white focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full bg-[#00B4FC] hover:bg-[#0098d6] border-[#00B4FC] text-white py-3.5 text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Registrando..."
                : tipoCuenta === "admin"
                ? "Crear cuenta de agencia"
                : "Crear cuenta"}
            </Button>
          </div>

        </form>

        <div className="mt-6 mb-6 text-center text-sm text-gray-500 font-medium">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-bold text-[#00B4FC] hover:underline underline-offset-2"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
