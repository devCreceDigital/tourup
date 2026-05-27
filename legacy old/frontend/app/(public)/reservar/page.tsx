"use client";

import Navbar from "@/components/layout/Navbar";
import FormularioContacto from "@/components/FormularioContacto";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

export default function ReservarPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {/* Header Reservar */}
      <section className="relative pt-32 pb-16 bg-[#1E1E4E] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4"
          >
            ¿Listo para <span className="text-[#00B4FC]">Reservar?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
          >
            Déjanos tus datos y un asesor te contactará en menos de 24 horas para coordinar el viaje de tu grupo.
          </motion.p>
        </div>
      </section>

      {/* Formulario y Contacto */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Info Lateral */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            <div>
              <span className="text-[#00B4FC] font-bold tracking-wider uppercase text-sm mb-2 block">Contáctanos</span>
              <h2 className="text-3xl font-black text-[#1E1E4E] mb-4">Comienza tu próxima aventura hoy</h2>
              <p className="text-slate-600 leading-relaxed">
                Nuestro equipo de expertos en viajes está listo para ayudarte a planificar el viaje perfecto. Completa el formulario y nos pondremos en contacto contigo muy pronto.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-[#00B4FC]/10 rounded-xl flex items-center justify-center text-[#00B4FC]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E1E4E]">Oficina Principal</h4>
                  <p className="text-slate-500 text-sm">Lima, Perú</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-[#00B4FC]/10 rounded-xl flex items-center justify-center text-[#00B4FC]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E1E4E]">Soporte</h4>
                  <p className="text-slate-500 text-sm">contact@totemhub.com</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formulario Componente */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[url('https://www.transparenttextures.com/patterns/dots.png')] opacity-20" />
            <FormularioContacto />
          </motion.div>

        </div>
      </section>
    </main>
  );
}