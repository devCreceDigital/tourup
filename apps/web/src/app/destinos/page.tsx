"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/shared/ui/navigation/Navbar";
import { Calendar, MapPin, Search, Star, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIAS = ["Todos", "Costa", "Sierra", "Selva", "Internacional"] as const;
type Categoria = (typeof CATEGORIAS)[number];

interface Destino {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  duracion: string;
  region: string;
  precio: number;
  cupos: number;
  categoria: Categoria;
  rating: number;
  reviews: number;
}

const DESTINOS: Destino[] = [
  {
    id: "cusco-2026",
    titulo: "Cusco & Valle Sagrado",
    descripcion: "Machu Picchu, Valle Sagrado, Sacsayhuamán y la magia de la cultura inca. Ideal para grupos culturales y promociones.",
    imagen: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800&auto=format&fit=crop",
    duracion: "5 Días / 4 Noches",
    region: "Cusco – Machu Picchu",
    precio: 1500,
    cupos: 12,
    categoria: "Sierra",
    rating: 4.9,
    reviews: 128,
  },
  {
    id: "paracas-2026",
    titulo: "Paracas & Islas Ballestas",
    descripcion: "Islas Ballestas, Reserva Nacional de Paracas, Huacachina y sandboarding. La escapada perfecta para grupos escolares.",
    imagen: "https://images.unsplash.com/photo-1611004128522-8618fb8f2923?q=80&w=800&auto=format&fit=crop",
    duracion: "2 Días / 1 Noche",
    region: "Paracas – Ica – Huacachina",
    precio: 450,
    cupos: 25,
    categoria: "Costa",
    rating: 4.8,
    reviews: 95,
  },
  {
    id: "tarapoto-2026",
    titulo: "Selva Tarapoto",
    descripcion: "Cascadas de Ahuashiyacu, Laguna Azul y gastronomía selvática. Una experiencia de naturaleza sin igual.",
    imagen: "https://images.unsplash.com/photo-1612450228945-88d40d9959f6?q=80&w=800&auto=format&fit=crop",
    duracion: "4 Días / 3 Noches",
    region: "Tarapoto – San Martín",
    precio: 980,
    cupos: 0,
    categoria: "Selva",
    rating: 5.0,
    reviews: 210,
  },
  {
    id: "huaraz-2026",
    titulo: "Huaraz & Cordillera Blanca",
    descripcion: "Laguna 69, Pastoruri y los picos más altos de los Andes peruanos. Trekking y aventura en estado puro.",
    imagen: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
    duracion: "3 Días / 2 Noches",
    region: "Huaraz – Áncash",
    precio: 750,
    cupos: 18,
    categoria: "Sierra",
    rating: 4.7,
    reviews: 67,
  },
  {
    id: "arequipa-2026",
    titulo: "Arequipa & Cañón del Colca",
    descripcion: "La Ciudad Blanca, el Monasterio de Santa Catalina y el cañón más profundo del mundo. Historia y naturaleza.",
    imagen: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop",
    duracion: "3 Días / 2 Noches",
    region: "Arequipa – Valle del Colca",
    precio: 680,
    cupos: 20,
    categoria: "Sierra",
    rating: 4.8,
    reviews: 112,
  },
  {
    id: "lima-2026",
    titulo: "Lima Histórica & Gastronómica",
    descripcion: "Centro Histórico, Miraflores, Barranco y la gastronomía más premiada de Latinoamérica en un solo recorrido.",
    imagen: "https://images.unsplash.com/photo-1531968455001-5c5272a41129?q=80&w=800&auto=format&fit=crop",
    duracion: "2 Días / 1 Noche",
    region: "Lima Metropolitana",
    precio: 320,
    cupos: 30,
    categoria: "Costa",
    rating: 4.6,
    reviews: 154,
  },
];

export default function DestinosPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | "Todos">("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filtrados = DESTINOS.filter((d) => {
    const coincideCategoria = categoriaActiva === "Todos" || d.categoria === categoriaActiva;
    const coincideBusqueda =
      busqueda.trim() === "" ||
      d.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.region.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <main className="min-h-screen bg-[#F5F6FB]">
      <Navbar />

      {/* Hero */}
      <div
        className="relative flex min-h-[45vh] items-end px-4 pb-14 sm:px-8 lg:px-16"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,30,45,0.92), rgba(15,30,45,0.55)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-full max-w-7xl pt-28">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
            Descubre el Perú
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Nuestros Destinos
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/80">
            Rutas cuidadosamente diseñadas por expertos locales. Transporte, alojamiento, guía certificado y experiencias únicas incluidas.
          </p>
        </div>
      </div>

      {/* Filtros sticky */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  categoriaActiva === cat
                    ? "bg-[#1E1E4E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar destino..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-[#5B5BDB] focus:outline-none focus:ring-2 focus:ring-[#5B5BDB]/20"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-16">
        {filtrados.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-2xl font-black text-[#1E1E4E]">Sin resultados</p>
            <p className="mt-2 text-gray-500">Prueba con otra categoría o término de búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="mb-8 text-sm text-gray-500">
              {filtrados.length} destino{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((destino, idx) => (
                <motion.article
                  key={destino.id}
                  initial={mounted ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl border border-gray-100"
                >
                  {/* Imagen */}
                  <div className="relative h-52 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent z-10" />
                    <Image
                      src={destino.imagen}
                      alt={destino.titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                          destino.cupos === 0
                            ? "bg-red-500"
                            : destino.cupos <= 15
                            ? "bg-orange-500"
                            : "bg-[#00B4FC]"
                        }`}
                      >
                        {destino.cupos === 0
                          ? "Agotado"
                          : destino.cupos <= 15
                          ? `Últimos ${destino.cupos} cupos`
                          : `${destino.cupos} cupos`}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#1E1E4E] shadow-sm">
                        {destino.categoria}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/90 rounded-full px-2.5 py-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-[#1E1E4E]">{destino.rating}</span>
                      <span className="text-xs text-gray-500">({destino.reviews})</span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#5B5BDB]" />
                        {destino.duracion}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#5B5BDB]" />
                        {destino.region}
                      </span>
                    </div>

                    <h2 className="mb-2 text-xl font-black text-[#1E1E4E] leading-tight">
                      {destino.titulo}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                      {destino.descripcion}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                      <div>
                        <span className="block text-xs font-medium text-gray-500">Precio desde</span>
                        <span className="text-2xl font-black text-[#00B4FC]">
                          S/ {destino.precio.toLocaleString()}
                        </span>
                      </div>
                      {destino.cupos === 0 ? (
                        <span className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 cursor-not-allowed">
                          Agotado
                        </span>
                      ) : (
                        <Link
                          href={`/viajes/${destino.id}`}
                          className="rounded-xl bg-[#1E1E4E] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5B5BDB]"
                        >
                          Ver Destino
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Stats rápidas */}
      <section className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: MapPin, number: "25+", label: "Destinos únicos" },
              { icon: Users, number: "2,500+", label: "Viajeros felices" },
              { icon: Star, number: "4.9", label: "Rating promedio" },
              { icon: Calendar, number: "120+", label: "Viajes exitosos" },
            ].map(({ icon: Icon, number, label }, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00B4FC]/10">
                  <Icon className="h-6 w-6 text-[#00B4FC]" />
                </div>
                <div className="text-2xl font-black text-[#1E1E4E]">{number}</div>
                <div className="mt-1 text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA inferior */}
      <section className="bg-[#1E1E4E] py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00B4FC]" />
          <h2 className="mb-3 text-2xl font-black">¿No encuentras lo que buscas?</h2>
          <p className="mb-6 text-sm leading-relaxed text-indigo-300">
            Cuéntanos tu sueño de viaje y diseñamos un itinerario completamente personalizado para tu grupo, colegio o empresa.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B4FC] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0098d6]"
          >
            Solicitar tour personalizado
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
