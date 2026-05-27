"use client";

import { useState } from "react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

export default function FormularioContacto() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    colegio: "",
    cantidad: "",
    mensaje: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    try {
      const res = await requestTotemApi("/support/public-contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("error");
      setEnviado(true);
      setForm({ nombre: "", email: "", telefono: "", colegio: "", cantidad: "", mensaje: "" });
      setTimeout(() => setEnviado(false), 5000);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="bg-slate-50 py-20 px-4 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        {/* Encabezado */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            ¿Listo para reservar?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Déjanos tus datos y un asesor te contactará en menos de 24 horas
            para coordinar el viaje de tu grupo.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-900">No se pudo enviar el mensaje</p>
                <p className="text-sm text-red-700">Por favor, inténtalo de nuevo o escríbenos directamente a contact@totemhub.com</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {enviado && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="font-semibold text-green-900">
                  ¡Mensaje enviado correctamente!
                </p>
                <p className="text-sm text-green-700">
                  Te contactaremos pronto al correo o teléfono que indicaste.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila 1: Nombre + Email */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: María González"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="maria@colegio.edu.pe"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
                />
              </div>
            </div>

            {/* Fila 2: Teléfono + Colegio */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="telefono"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  required
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+51 999 888 777"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="colegio"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Colegio o institución
                </label>
                <input
                  type="text"
                  id="colegio"
                  name="colegio"
                  value={form.colegio}
                  onChange={handleChange}
                  placeholder="Ej: Colegio San Andrés"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
                />
              </div>
            </div>

            {/* Fila 3: Cantidad de viajeros */}
            <div>
              <label
                htmlFor="cantidad"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Cantidad aproximada de viajeros *
              </label>
              <select
                id="cantidad"
                name="cantidad"
                required
                value={form.cantidad}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
              >
                <option value="">Selecciona un rango...</option>
                <option value="20-40">20 a 40 personas</option>
                <option value="40-60">40 a 60 personas</option>
                <option value="60-80">60 a 80 personas</option>
                <option value="80+">Más de 80 personas</option>
              </select>
            </div>

            {/* Fila 4: Mensaje */}
            <div>
              <label
                htmlFor="mensaje"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Mensaje (opcional)
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={4}
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Cuéntanos detalles del grupo, fechas tentativas, requisitos especiales..."
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#00B4FC] focus:outline-none focus:ring-2 focus:ring-[#00B4FC]/20"
              />
            </div>

            {/* Footer del formulario */}
            <div className="flex flex-col items-stretch justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                * Campos obligatorios. Tus datos están protegidos y no se
                comparten con terceros.
              </p>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00B4FC] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#0098d6] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar solicitud
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}