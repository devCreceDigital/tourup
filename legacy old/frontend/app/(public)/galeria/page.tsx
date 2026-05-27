"use client";

import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const FOTOS_GALERIA = [
  {
    id: 1,
    titulo: "Machu Picchu",
    ubicacion: "Cusco, Perú",
    imagen: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 md:col-span-2 row-span-2",
  },
  {
    id: 2,
    titulo: "Oasis de Huacachina",
    ubicacion: "Ica, Perú",
    imagen: "https://images.unsplash.com/photo-1532156681024-8178121f0088?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 row-span-1",
  },
  {
    id: 3,
    titulo: "Reserva Nacional de Paracas",
    ubicacion: "Ica, Perú",
    imagen: "https://images.unsplash.com/photo-1611004128522-8618fb8f2923?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 row-span-1",
  },
  {
    id: 4,
    titulo: "Amazonas y Vida Silvestre",
    ubicacion: "Tarapoto, Perú",
    imagen: "https://images.unsplash.com/photo-1612450228945-88d40d9959f6?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    id: 5,
    titulo: "Plaza de Armas",
    ubicacion: "Cusco, Perú",
    imagen: "https://images.unsplash.com/photo-1526392060635-9d60198d3fe3?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 row-span-2",
  },
  {
    id: 6,
    titulo: "Monasterio de Santa Catalina",
    ubicacion: "Arequipa, Perú",
    imagen: "https://images.unsplash.com/photo-1533000753063-e38bf3465e9d?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 row-span-1",
  },
  {
    id: 7,
    titulo: "Cordillera Blanca",
    ubicacion: "Huaraz, Perú",
    imagen: "https://images.unsplash.com/photo-1580975613318-790209c1d683?q=80&w=800&auto=format&fit=crop",
    estilo: "col-span-1 md:col-span-2 row-span-1",
  },
];

export default function GaleriaPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header Galería */}
      <section className="relative pt-32 pb-16 bg-[#1E1E4E] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4"
          >
            Galería de <span className="text-[#00B4FC]">Momentos</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/80 max-w-2xl mx-auto"
          >
            Explora los increíbles paisajes, aventuras y experiencias inolvidables que nuestros viajeros han disfrutado alrededor del mundo.
          </motion.p>
        </div>
      </section>

      {/* Grid de Fotos */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4">
          {FOTOS_GALERIA.map((foto, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              key={foto.id}
              className={`relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-shadow ${foto.estilo}`}
            >
              <Image 
                src={foto.imagen}
                alt={foto.titulo}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay Oscuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              
              {/* Contenido */}
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-black text-xl md:text-2xl mb-1">{foto.titulo}</h3>
                <p className="text-white/80 font-medium text-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  <MapPin className="w-4 h-4 text-[#00B4FC]" />
                  {foto.ubicacion}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}