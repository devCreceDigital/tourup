"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  Users,
  MessageCircle,
} from "lucide-react";

const CONTACT_CARDS = [
  {
    icon: MapPin,
    title: "Oficina Principal",
    detail: "Av. La Marina 2000, San Miguel",
    sub: "Lima, Perú",
  },
  {
    icon: Phone,
    title: "Teléfono & WhatsApp",
    detail: "+51 900 000 000",
    sub: "Lun–Sáb, 9am – 7pm",
  },
  {
    icon: Mail,
    title: "Correo Electrónico",
    detail: "hola@totem.pe",
    sub: "Respuesta en menos de 24h",
  },
  {
    icon: Clock,
    title: "Horario de Atención",
    detail: "Lun–Vie: 9am – 6pm",
    sub: "Sáb: 9am – 2pm",
  },
];

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  agencia: string;
  asunto: string;
  mensaje: string;
};

const ASUNTOS = [
  "Consulta sobre un tour",
  "Quiero digitalizar mi agencia",
  "Solicitar demo de Totem HUB",
  "Problema con mi cuenta",
  "Otro",
];

export default function ContactoPage() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    email: "",
    telefono: "",
    agencia: "",
    asunto: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setEnviado(true);
  };

  return (
    <main className="min-h-screen bg-[#F5F6FB]">
      <Navbar />

      {/* Hero */}
      <div
        className="relative flex min-h-[40vh] items-end px-4 pb-14 sm:px-8 lg:px-16"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,30,45,0.92), rgba(15,30,45,0.55)), url('https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-full max-w-7xl pt-28">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
            Estamos aquí para ti
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Contáctanos</h1>
          <p className="mt-3 max-w-xl text-base text-white/80">
            ¿Preguntas sobre tours, precios o quieres digitalizar tu agencia? Nuestro equipo te responde en menos de 24 horas.
          </p>
        </div>
      </div>

      {/* Cards de contacto */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
        <div className="-mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CONTACT_CARDS.map(({ icon: Icon, title, detail, sub }, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md border border-gray-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4FC]/10">
                <Icon className="h-5 w-5 text-[#00B4FC]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
                <p className="mt-1 text-sm font-bold text-[#1E1E4E]">{detail}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Formulario + Info lateral */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">

          {/* Formulario */}
          <div className="rounded-2xl bg-white p-8 shadow-md border border-gray-100">
            {enviado ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="mb-3 text-2xl font-black text-[#1E1E4E]">¡Mensaje enviado!</h3>
                <p className="max-w-sm text-sm leading-relaxed text-gray-500">
                  Nos pondremos en contacto contigo en menos de 24 horas. ¡Gracias por escribirnos!
                </p>
                <button
                  onClick={() => {
                    setEnviado(false);
                    setForm({ nombre: "", email: "", telefono: "", agencia: "", asunto: "", mensaje: "" });
                  }}
                  className="mt-8 text-sm font-bold text-[#00B4FC] hover:underline"
                >
                  Enviar otro mensaje
                </button>
              </motion.div>
            ) : (
              <>
                <h2 className="mb-1 text-2xl font-black text-[#1E1E4E]">Envíanos un mensaje</h2>
                <p className="mb-8 text-sm text-gray-500">
                  Completa el formulario y te responderemos a la brevedad.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nombre completo *" id="nombre">
                      <input
                        id="nombre"
                        name="nombre"
                        type="text"
                        required
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Correo electrónico *" id="email">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="tu@correo.com"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Teléfono / WhatsApp" id="telefono">
                      <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="+51 900 000 000"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Nombre de tu agencia" id="agencia">
                      <input
                        id="agencia"
                        name="agencia"
                        type="text"
                        value={form.agencia}
                        onChange={handleChange}
                        placeholder="Opcional"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Asunto *" id="asunto">
                    <select
                      id="asunto"
                      name="asunto"
                      required
                      value={form.asunto}
                      onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="">Selecciona un asunto</option>
                      {ASUNTOS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="¿En qué podemos ayudarte? *" id="mensaje">
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      required
                      rows={5}
                      value={form.mensaje}
                      onChange={handleChange}
                      placeholder="Cuéntanos sobre tu grupo, destino de interés, fechas aproximadas..."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E1E4E] px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-[#00B4FC] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/51900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-[#25D366] px-6 py-5 font-bold text-white transition-all hover:bg-[#1db954] hover:shadow-lg hover:shadow-green-400/30 hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-base font-black">Escríbenos por WhatsApp</p>
                <p className="text-sm font-normal text-green-100">Respuesta inmediata</p>
              </div>
              <ArrowRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>

            {/* Imagen / mapa */}
            <div className="relative h-64 overflow-hidden rounded-2xl shadow-md border border-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1548345680-f5475ea5df84?q=80&w=800&auto=format&fit=crop"
                alt="Lima, Perú"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E2D]/70 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                <MapPin className="h-4 w-4 text-[#00B4FC]" />
                <span className="text-xs font-bold text-[#1E1E4E]">San Miguel, Lima</span>
              </div>
            </div>

            {/* Caja info agencia */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
              <h3 className="mb-3 font-black text-[#1E1E4E]">¿Eres agencia de viajes?</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">
                Descubre cómo Totem HUB puede digitalizar toda la gestión de tus grupos: inscripciones, pagos, documentos y comunicación en una sola plataforma.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5F6FB] px-4 py-2.5 text-sm font-bold text-[#1E1E4E] transition-colors hover:bg-[#1E1E4E] hover:text-white"
              >
                Ver planes y precios <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#1E1E4E] py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00B4FC]" />
          <h2 className="mb-3 text-2xl font-black">¿Prefieres que te llamemos?</h2>
          <p className="mb-6 text-sm leading-relaxed text-indigo-300">
            Déjanos tu número y uno de nuestros asesores se comunicará contigo en los próximos 30 minutos.
          </p>
          <Link
            href="tel:+51900000000"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FC] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0098d6]"
          >
            <Phone className="h-4 w-4" />
            +51 900 000 000
          </Link>
        </div>
      </section>
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#5B5BDB] focus:ring-2 focus:ring-[#5B5BDB]/20 transition-all";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
