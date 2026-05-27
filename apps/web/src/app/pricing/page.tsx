"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/shared/ui/navigation/Navbar";
import {
  Check,
  X,
  Zap,
  Shield,
  Building2,
  ArrowRight,
  ChevronDown,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    tagline: "Para agencias que empiezan",
    monthlyPrice: 0,
    annualPrice: 0,
    popular: false,
    cta: "Empezar gratis",
    ctaHref: "/registro",
    features: [
      { text: "Hasta 3 viajes activos", ok: true },
      { text: "50 inscripciones / mes", ok: true },
      { text: "Panel de administración", ok: true },
      { text: "Formularios de inscripción", ok: true },
      { text: "Soporte por email", ok: true },
      { text: "Pagos en línea (Yape, PagoEfectivo)", ok: false },
      { text: "Dominio personalizado", ok: false },
      { text: "Reportes avanzados", ok: false },
      { text: "API & Webhooks", ok: false },
      { text: "Múltiples agencias", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Shield,
    tagline: "Para agencias en crecimiento",
    monthlyPrice: 199,
    annualPrice: 159,
    popular: true,
    cta: "Prueba 14 días gratis",
    ctaHref: "/registro",
    features: [
      { text: "Viajes ilimitados", ok: true },
      { text: "Inscripciones ilimitadas", ok: true },
      { text: "Panel avanzado + analíticas", ok: true },
      { text: "Formularios personalizables", ok: true },
      { text: "Soporte prioritario 24/7", ok: true },
      { text: "Pagos en línea (Yape, PagoEfectivo)", ok: true },
      { text: "Subdominio personalizado", ok: true },
      { text: "Reportes avanzados", ok: true },
      { text: "API & Webhooks", ok: false },
      { text: "Múltiples agencias", ok: false },
    ],
  },
  {
    id: "enterprise",
    name: "Empresa",
    icon: Building2,
    tagline: "Para grandes operadores turísticos",
    monthlyPrice: 499,
    annualPrice: 399,
    popular: false,
    cta: "Contactar ventas",
    ctaHref: "/contacto",
    features: [
      { text: "Viajes ilimitados", ok: true },
      { text: "Inscripciones ilimitadas", ok: true },
      { text: "Panel multi-agencia", ok: true },
      { text: "Formularios + campos custom", ok: true },
      { text: "Soporte dedicado (Slack/Teams)", ok: true },
      { text: "Pasarela de pagos propia", ok: true },
      { text: "White-label completo", ok: true },
      { text: "Reportes + BI integrado", ok: true },
      { text: "API & Webhooks completos", ok: true },
      { text: "Múltiples agencias / franquicias", ok: true },
    ],
  },
];

const FAQS = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes actualizar o degradar tu plan desde el panel de administración. Los cambios se aplican al inicio del siguiente ciclo de facturación sin penalidades.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard), Yape, PagoEfectivo y transferencias bancarias para planes anuales empresariales.",
  },
  {
    q: "¿Tienen prueba gratuita para los planes de pago?",
    a: "Sí. Los planes Pro y Empresa incluyen 14 días de prueba completa sin necesidad de tarjeta de crédito. El plan Starter es gratuito para siempre.",
  },
  {
    q: "¿Mis datos están seguros en Totem?",
    a: "Absolutamente. Usamos encriptación SSL, backups automáticos en la nube y cumplimos con las normativas de protección de datos. Tus datos nunca son compartidos.",
  },
  {
    q: "¿Ofrecen precios especiales para colegios u ONGs?",
    a: "Sí. Tenemos tarifas especiales para instituciones educativas, ONGs y entidades gubernamentales. Contáctanos directamente para cotizar.",
  },
];

export default function PricingPage() {
  const [anual, setAnual] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-[#F5F6FB]">
      <Navbar />

      {/* Hero */}
      <div
        className="relative flex min-h-[45vh] items-center justify-center px-4 pb-12 pt-28 sm:px-8 lg:px-16"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,30,45,0.95), rgba(15,30,45,0.8)), url('https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
            Planes y precios
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl md:text-6xl">
            Elige el plan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B4FC] to-[#5B5BDB]">
              perfecto
            </span>
            <br />
            para tu agencia
          </h1>
          <p className="mt-4 text-base text-white/80 max-w-xl mx-auto">
            Digitaliza tu agencia desde hoy. Sin contratos forzosos ni permanencia mínima.
          </p>

          {/* Toggle mensual / anual */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
            <button
              onClick={() => setAnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                !anual ? "bg-white text-[#1E1E4E] shadow-sm" : "text-white/70 hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnual(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                anual ? "bg-white text-[#1E1E4E] shadow-sm" : "text-white/70 hover:text-white"
              }`}
            >
              Anual
              <span className="rounded-full bg-[#00B4FC] px-2 py-0.5 text-[10px] font-black text-white">
                −20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {PLANS.map((plan, idx) => {
            const price = anual ? plan.annualPrice : plan.monthlyPrice;
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular ? "border-[#00B4FC] shadow-[#00B4FC]/10 shadow-lg" : "border-gray-100"
                }`}
              >
                {plan.popular && (
                  <div className="bg-[#00B4FC] py-2 text-center text-xs font-black uppercase tracking-wider text-white">
                    ★ Más elegido
                  </div>
                )}

                <div className={`p-8 ${plan.popular ? "bg-gradient-to-br from-[#1E1E4E] to-[#2D2D6E]" : "bg-white"}`}>
                  <div className={`mb-1 flex items-center gap-3`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.popular ? "bg-white/15" : "bg-[#00B4FC]/10"}`}>
                      <Icon className={`h-5 w-5 ${plan.popular ? "text-[#00B4FC]" : "text-[#1E1E4E]"}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-black ${plan.popular ? "text-white" : "text-[#1E1E4E]"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs ${plan.popular ? "text-white/60" : "text-gray-500"}`}>
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-1">
                    {price === 0 ? (
                      <span className={`text-4xl font-black ${plan.popular ? "text-white" : "text-[#1E1E4E]"}`}>
                        Gratis
                      </span>
                    ) : (
                      <>
                        <span className={`mt-2 self-start text-lg ${plan.popular ? "text-white/60" : "text-gray-400"}`}>
                          S/.
                        </span>
                        <span className={`text-5xl font-black ${plan.popular ? "text-white" : "text-[#1E1E4E]"}`}>
                          {price}
                        </span>
                        <span className={`mb-2 text-sm ${plan.popular ? "text-white/60" : "text-gray-400"}`}>
                          /mes
                        </span>
                      </>
                    )}
                  </div>
                  {anual && price > 0 && (
                    <p className={`mt-1 text-xs ${plan.popular ? "text-white/50" : "text-gray-400"}`}>
                      Facturado anualmente · Ahorras S/. {(plan.monthlyPrice - plan.annualPrice) * 12}/año
                    </p>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-3 text-sm">
                        {feat.ok ? (
                          <Check className="h-4 w-4 shrink-0 text-[#10B981]" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-gray-300" />
                        )}
                        <span className={feat.ok ? "text-gray-700" : "text-gray-400"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all ${
                      plan.popular
                        ? "bg-[#00B4FC] text-white hover:bg-[#0098d6]"
                        : plan.id === "enterprise"
                        ? "bg-[#1E1E4E] text-white hover:bg-[#5B5BDB]"
                        : "border border-[#1E1E4E] text-[#1E1E4E] hover:bg-[#1E1E4E] hover:text-white"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Garantías */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { emoji: "🔒", text: "Sin contratos de permanencia" },
            { emoji: "💳", text: "Sin tarjeta para el plan Starter" },
            { emoji: "🔄", text: "Cancela en cualquier momento" },
            { emoji: "🇵🇪", text: "Precios en soles peruanos" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xl">{item.emoji}</span>
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* Stats de confianza */}
      <section className="border-y border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: Users, number: "50+", label: "Agencias activas" },
              { icon: Star, number: "4.9/5", label: "Valoración media" },
              { icon: TrendingUp, number: "2,500+", label: "Viajeros gestionados" },
              { icon: Shield, number: "99.9%", label: "Uptime garantizado" },
            ].map(({ icon: Icon, number, label }, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00B4FC]/10">
                  <Icon className="h-5 w-5 text-[#00B4FC]" />
                </div>
                <div className="text-2xl font-black text-[#1E1E4E]">{number}</div>
                <div className="mt-1 text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">FAQ</p>
          <h2 className="text-3xl font-black text-[#1E1E4E]">Preguntas frecuentes</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                onClick={() => setFaqAbierta(faqAbierta === idx ? null : idx)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-bold text-[#1E1E4E] hover:bg-gray-50 transition-colors"
              >
                {faq.q}
                <motion.span
                  animate={{ rotate: faqAbierta === idx ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 ml-4"
                >
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: faqAbierta === idx ? "auto" : 0,
                  opacity: faqAbierta === idx ? 1 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#1E1E4E] py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00B4FC]" />
          <h2 className="mb-3 text-2xl font-black">¿Tienes dudas? Hablemos.</h2>
          <p className="mb-6 text-sm leading-relaxed text-indigo-300">
            Nuestro equipo te ayuda a elegir el plan ideal para tu agencia sin compromiso ni presión.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FC] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0098d6]"
          >
            Contactar equipo de ventas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
