"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/shared/ui/navigation/Navbar";
import { Calendar, MapPin, Users, Search } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

const CATEGORIAS = ["Todos", "Escolar", "Corporativo", "Familiar"] as const;
type Categoria = (typeof CATEGORIAS)[number];

interface ViajeCard {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  dias: string;
  destino: string;
  precio: number;
  cupos: number;
  categoria: Categoria;
  slug: string;
}

type ApiViaje = {
  readonly id?: string;
  readonly slug?: string;
  readonly nombre?: string;
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly destino?: string;
  readonly precio?: number;
  readonly cupos?: number;
  readonly categoria?: string;
  readonly configuracion?: {
    readonly titulo_publico?: string;
    readonly descripcion?: string;
    readonly imagen_url?: string;
    readonly imagen?: string;
    readonly subtitulo?: string;
    readonly duracion?: string;
    readonly destino?: string;
    readonly precio_base?: number;
    readonly categoria?: string;
  };
};

const VIAJES_FALLBACK: ViajeCard[] = [
  {
    id: "paracas-2026",
    slug: "paracas-2026",
    titulo: "Paracas – Playa La Mina",
    descripcion: "Islas Ballestas, Reserva Nacional de Paracas, Huacachina y sandboarding. La escapada perfecta para grupos escolares.",
    imagen: "https://images.unsplash.com/photo-1611004128522-8618fb8f2923?q=80&w=800&auto=format&fit=crop",
    dias: "2 Días / 1 Noche",
    destino: "Paracas – Ica – Huacachina",
    precio: 450,
    cupos: 25,
    categoria: "Escolar",
  },
  {
    id: "cusco-2026",
    slug: "cusco-2026",
    titulo: "Cusco y Valle Sagrado",
    descripcion: "Machu Picchu, Valle Sagrado, Sacsayhuamán y la magia de la cultura inca. Ideal para promociones y grupos culturales.",
    imagen: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800&auto=format&fit=crop",
    dias: "5 Días / 4 Noches",
    destino: "Cusco – Machu Picchu",
    precio: 1500,
    cupos: 12,
    categoria: "Escolar",
  },
  {
    id: "tarapoto-2026",
    slug: "tarapoto-2026",
    titulo: "Aventura en la Selva Tarapoto",
    descripcion: "Cascadas de Ahuashiyacu, Laguna Azul y gastronomía selvática. Una experiencia de naturaleza sin igual.",
    imagen: "https://images.unsplash.com/photo-1612450228945-88d40d9959f6?q=80&w=800&auto=format&fit=crop",
    dias: "4 Días / 3 Noches",
    destino: "Tarapoto – San Martín",
    precio: 980,
    cupos: 0,
    categoria: "Familiar",
  },
];

function normalizeCategoria(value: string | undefined): Categoria {
  return CATEGORIAS.includes(value as Categoria) ? (value as Categoria) : "Escolar";
}

function mapViajeFromApi(v: ApiViaje): ViajeCard {
  const config = v.configuracion ?? {};
  const id = v.slug ?? v.id ?? crypto.randomUUID();
  return {
    id,
    slug: id,
    titulo: config.titulo_publico ?? v.nombre ?? v.titulo ?? "",
    descripcion: config.descripcion ?? v.descripcion ?? "",
    imagen: config.imagen_url ?? config.imagen ?? "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop",
    dias: config.subtitulo ?? config.duracion ?? "",
    destino: config.destino ?? v.destino ?? "",
    precio: config.precio_base ?? v.precio ?? 0,
    cupos: v.cupos ?? 0,
    categoria: normalizeCategoria(config.categoria ?? v.categoria),
  };
}

export default function NuestrosViajesPage() {
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [viajes, setViajes] = useState<ViajeCard[]>([]);
  const [loadingViajes, setLoadingViajes] = useState(true);

  useEffect(() => {
    setLoadingViajes(true);
    requestTotemApi("/trips/")
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data.results ?? []);
        if (lista.length > 0) {
          setViajes(lista.map(mapViajeFromApi));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingViajes(false));
  }, []);

  const viajesFiltrados = viajes.filter((v) => {
    const coincideCategoria = categoriaActiva === "Todos" || v.categoria === categoriaActiva;
    const coincideBusqueda =
      busqueda.trim() === "" ||
      v.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.destino.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <main className="min-h-screen bg-[#F5F6FB]">
      <Navbar />

      {/* Hero de sección */}
      <div
        className="relative flex min-h-[40vh] items-end px-4 pb-12 sm:px-8 lg:px-16"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,30,45,0.92), rgba(15,30,45,0.5)), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-full max-w-7xl pt-28">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00B4FC]">
            Temporada 2026
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Nuestros Próximos Viajes
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/80">
            Descubre los destinos que hemos preparado especialmente para ti y tu grupo. Cada viaje incluye transporte, alojamiento, guía profesional y mucho más.
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  categoriaActiva === cat
                    ? "bg-[#1E1E4E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
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

      {/* Grid de viajes */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-16">
        {viajesFiltrados.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-2xl font-black text-[#1E1E4E]">Sin resultados</p>
            <p className="mt-2 text-gray-500">Prueba con otra categoría o término de búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="mb-8 text-sm text-gray-500">
              {viajesFiltrados.length} viaje{viajesFiltrados.length !== 1 && "s"} encontrado{viajesFiltrados.length !== 1 && "s"}
            </p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {loadingViajes ? (
                <div className="col-span-3 text-center py-16 text-gray-400">Cargando viajes...</div>
              ) : viajesFiltrados.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-gray-400">{viajes.length === 0 ? "No hay viajes disponibles." : "Sin resultados para esta búsqueda."}</div>
              ) : viajesFiltrados.map((viaje) => (
                <article
                  key={viaje.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl border border-gray-100"
                >
                  {/* Imagen */}
                  <div className="relative h-52 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent z-10" />
                    <Image
                      src={viaje.imagen}
                      alt={viaje.titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                          viaje.cupos === 0
                            ? "bg-red-500"
                            : viaje.cupos <= 15
                            ? "bg-orange-500"
                            : "bg-[#00B4FC]"
                        }`}
                      >
                        {viaje.cupos === 0
                          ? "Agotado"
                          : viaje.cupos <= 15
                          ? `Últimos ${viaje.cupos} cupos`
                          : `${viaje.cupos} cupos`}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#1E1E4E] shadow-sm">
                        {viaje.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#5B5BDB]" />
                        {viaje.dias}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#5B5BDB]" />
                        {viaje.destino}
                      </span>
                    </div>

                    <h2 className="mb-2 text-xl font-black text-[#1E1E4E] leading-tight">
                      {viaje.titulo}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                      {viaje.descripcion}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                      <div>
                        <span className="block text-xs font-medium text-gray-500">Precio desde</span>
                        <span className="text-2xl font-black text-[#00B4FC]">
                          S/ {viaje.precio.toLocaleString("es-PE")}
                        </span>
                      </div>
                      {viaje.cupos === 0 ? (
                        <span className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 cursor-not-allowed">
                          Agotado
                        </span>
                      ) : (
                        <Link
                          href={`/viajes/${viaje.slug}`}
                          className="rounded-xl bg-[#1E1E4E] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5B5BDB]"
                        >
                          Ver Viaje
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA inferior */}
      <section className="bg-[#1E1E4E] py-16 text-white text-center">
        <div className="mx-auto max-w-2xl px-4">
          <Users className="mx-auto mb-4 h-10 w-10 text-[#00B4FC]" />
          <h2 className="text-2xl font-black mb-3">¿No encuentras lo que buscas?</h2>
          <p className="text-indigo-300 mb-6 text-sm leading-relaxed">
            Contáctanos y diseñamos un viaje personalizado para tu grupo, colegio o empresa.
          </p>
          <Link
            href="/#contacto"
            className="inline-block rounded-xl bg-[#00B4FC] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0098d6]"
          >
            Contactar a un asesor
          </Link>
        </div>
      </section>
    </main>
  );
}
