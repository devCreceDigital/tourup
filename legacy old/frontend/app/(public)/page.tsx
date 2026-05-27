"use client";

import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Compass, MapPin, Users, Calendar, Search, Star, ArrowRight, ShieldCheck, Heart, Award, Clock, Plane, User } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const HERO_IMAGES = [
  "https://images.pexels.com/photos/33695274/pexels-photo-33695274.jpeg?_gl=1*1x0atmn*_ga*MzM0NjgwNzQ5LjE3NzgxMzI4NjA.*_ga_8JE65Q40S6*czE3NzgxMzI4NTkkbzEkZzEkdDE3NzgxMzI5MTQkajUkbDAkaDA.", // Pexels User Img
  "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2000&auto=format&fit=crop", // Machu Picchu (Cusco)
  "https://images-ext-1.discordapp.net/external/T9ZKTvhBS3fnm8clTFG8A_xQHsRjxt4j-wtxvkUXKLU/%3F_gl%3D1%2A1kgrnbp%2A_ga%2AMzM0NjgwNzQ5LjE3NzgxMzI4NjA.%2A_ga_8JE65Q40S6%2AczE3NzgxMzI4NTkkbzEkZzEkdDE3NzgxMzMxODkkajU5JGwwJGgw/https/images.pexels.com/photos/17227294/pexels-photo-17227294.png?format=webp&quality=lossless&width=1240&height=828", // Nueva imagen Pexels/Discord
  "https://images-ext-1.discordapp.net/external/BqK-wCo8V8dzMc2PAmHryfCYNw6zbjNOOKvodXE-MR8/%3F_gl%3D1%2A1gc8lra%2A_ga%2AMzM0NjgwNzQ5LjE3NzgxMzI4NjA.%2A_ga_8JE65Q40S6%2AczE3NzgxMzI4NTkkbzEkZzEkdDE3NzgxMzMzMTUkajU5JGwwJGgw/https/images.pexels.com/photos/37156747/pexels-photo-37156747.jpeg?format=webp&width=1240&height=930", // Huaraz
  "https://images-ext-1.discordapp.net/external/tWUSnksk3Dg8-XvPQa-Z6n-UXaO_za2eVbNU5QPhTA8/%3F_gl%3D1%2Ay0a3kk%2A_ga%2AMzM0NjgwNzQ5LjE3NzgxMzI4NjA.%2A_ga_8JE65Q40S6%2AczE3NzgxMzI4NTkkbzEkZzEkdDE3NzgxMzMzNjQkajEwJGwwJGgw/https/images.pexels.com/photos/13616854/pexels-photo-13616854.jpeg?format=webp&width=1240&height=826", // Paracas
  "https://images-ext-1.discordapp.net/external/SWvkQv5SA_eZQaEvb8m1Pqv-UpTeHxYk3lHk2oy6q4M/%3F_gl%3D1%2Apw5p6u%2A_ga%2AMzM0NjgwNzQ5LjE3NzgxMzI4NjA.%2A_ga_8JE65Q40S6%2AczE3NzgxMzI4NTkkbzEkZzEkdDE3NzgxMzM1NjUkajU5JGwwJGgw/https/images.pexels.com/photos/23844689/pexels-photo-23844689.jpeg?format=webp&width=1240&height=930", // Arequipa / Misti
];

const VIAJES_DISPONIBLES = [
  {
    id: "cusco-2026",
    titulo: "Excursión a Cusco y Valle Sagrado",
    imagen: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=800&auto=format&fit=crop",
    dias: "5 Días / 4 Noches",
    precio: "1,500",
    cupos: "Últimos 12 cupos",
    rating: 4.9,
    reviews: 128
  },
  {
    id: "paracas-2026",
    titulo: "Paracas – Playa La Mina",
    imagen: "https://i.pinimg.com/736x/4f/f7/5a/4ff75af0d1752562e6e2b51b084287d9.jpg",
    dias: "2 Días / 1 Noche",
    precio: "450",
    cupos: "25 cupos disponibles",
    rating: 4.8,
    reviews: 95
  },
  {
    id: "tarapoto-2026",
    titulo: "Aventura en la Selva Tarapoto",
    imagen: "https://i.pinimg.com/1200x/d1/b9/38/d1b93889d4cbb7ffcb7c152090e83578.jpg",
    dias: "4 Días / 3 Noches",
    precio: "980",
    cupos: "Agotado",
    rating: 5.0,
    reviews: 210
  }
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Mejor Precio Garantizado",
    desc: "Aseguramos las tarifas más competitivas para todos nuestros destinos premium."
  },
  {
    icon: Heart,
    title: "Los Viajeros Nos Aman",
    desc: "Únete a miles de exploradores satisfechos que confían en nuestra experiencia."
  },
  {
    icon: Award,
    title: "Mejor Agencia de Viajes",
    desc: "Servicio galardonado y reconocido por líderes de la industria a nivel mundial."
  },
  {
    icon: Clock,
    title: "Soporte Dedicado",
    desc: "Asistencia experta 24/7 en cualquier momento y lugar que lo necesites."
  }
];

const STATS = [
  { number: "15k+", label: "Viajeros Felices" },
  { number: "500+", label: "Tours Increíbles" },
  { number: "120+", label: "Destinos" },
  { number: "24/7", label: "Soporte" },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#00B4FC] selection:text-white">
      {/* Navbar Transparente sobre el Hero */}
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden bg-[#0F1E2D]">
        {/* Parallax Background Slideshow */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E2D]/70 via-[#0F1E2D]/40 to-transparent z-10" />
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ 
                duration: 1.8, 
                ease: [0.45, 0, 0.55, 1] // Curva Bezier más suave (ease in-out natural)
              }}
              className="absolute inset-0"
            >
              <Image 
                src={HERO_IMAGES[currentImageIndex]}
                alt="Perú Hero Landscape"
                fill
                priority
                className="object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Dynamic Elements (Aviones y Decoraciones) */}
        <motion.div 
          animate={{ x: ["-10vw", "110vw"], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 left-0 z-10 opacity-30"
        >
          <Plane className="w-12 h-12 text-white transform rotate-45" />
        </motion.div>

        <motion.div 
          animate={{ x: ["110vw", "-10vw"], y: [0, 30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute top-64 right-0 z-10 opacity-20"
        >
          <Plane className="w-8 h-8 text-[#00B4FC] transform -rotate-[135deg]" />
        </motion.div>

        {/* Reviews flotantes (Fake) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="hidden lg:flex absolute top-1/4 right-[10%] z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl items-center gap-4 max-w-[280px]"
        >
          <div className="w-10 h-10 rounded-full bg-[#00B4FC] flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-white text-xs leading-tight font-medium">&ldquo;El mejor viaje de promoción que pudimos tener.&rdquo;</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="hidden lg:flex absolute bottom-1/4 right-[5%] z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl items-center gap-4 max-w-[250px]"
        >
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[#1E1E4E]" />
          </div>
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
            </div>
            <p className="text-white text-xs leading-tight font-medium">&ldquo;Excelente organización en Cusco.&rdquo;</p>
          </div>
        </motion.div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-20 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <h1 className="text-[3.5rem] font-black uppercase leading-[1.1] tracking-tight text-white sm:text-[4.5rem] lg:text-[5.5rem]">
              Explora tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B4FC] to-[#5B5BDB]">
                Perú increíble
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/80 sm:text-xl">
              Descubre destinos impresionantes y crea recuerdos inolvidables con nuestras experiencias de viaje diseñadas por expertos locales.
            </p>

            {/* Buscador de Viajes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full flex flex-col sm:flex-row items-center gap-2 max-w-3xl"
            >
              <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full bg-white/5 rounded-full">
                <MapPin className="w-5 h-5 text-[#00B4FC]" />
                <input 
                  type="text" 
                  placeholder="¿A dónde quieres ir?" 
                  className="bg-transparent border-none outline-none text-white placeholder:text-white/60 w-full font-medium"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 w-full bg-white/5 rounded-full">
                <Calendar className="w-5 h-5 text-[#00B4FC]" />
                <select className="bg-transparent border-none outline-none text-white w-full font-medium appearance-none cursor-pointer">
                  <option value="" className="text-slate-800">Cualquier fecha</option>
                  <option value="verano" className="text-slate-800">Verano 2026</option>
                  <option value="invierno" className="text-slate-800">Invierno 2026</option>
                </select>
              </div>
              <Link 
                href="/viajes" 
                className="w-full sm:w-auto bg-[#00B4FC] hover:bg-[#0284c7] text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-5 h-5" />
                Buscar
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 bg-slate-50 z-20 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-[#00B4FC]/10 transition-colors">
                <feat.icon className="w-6 h-6 text-[#1E1E4E] group-hover:text-[#00B4FC] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-[#1E1E4E] mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mapa del Perú Section */}
      <section className="relative py-24 bg-white overflow-hidden border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <span className="text-[#00B4FC] font-bold tracking-wider uppercase text-sm mb-2 block">Explora el Mapa</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#1E1E4E] mb-6">
                Un país, infinitos mundos por descubrir
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                El Perú es un destino privilegiado que alberga una asombrosa diversidad. Desde el misterio de la Amazonía y las imponentes cumbres de los Andes, hasta la cálida costa bañada por el Pacífico.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Navega por nuestro mapa y maravíllate con el legado de culturas milenarias, una gastronomía inigualable y paisajes que te dejarán sin aliento. Cada región tiene una historia única esperando ser vivida.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 group bg-white flex items-center justify-center"
            >
              <Image 
                src="https://i.pinimg.com/736x/85/46/20/854620b3eb67cf8e929f74080309fc9c.jpg" 
                alt="Mapa del Perú"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promotional Marketing Banner */}
      <section className="relative py-24 overflow-hidden bg-[#0F1E2D]">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <Image 
            src="https://images.unsplash.com/photo-1504609774528-69473b64c017?q=80&w=2000&auto=format&fit=crop" // Paisaje genérico de aventura/desierto
            alt="Fondo Promocional Aventura"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E2D] via-[#0F1E2D]/80 to-transparent" />
        </motion.div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-[#1E1E4E] px-5 py-2 rounded-full text-xs font-black mb-6 shadow-[0_0_20px_rgba(250,204,21,0.4)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              OFERTA EXCLUSIVA DE TEMPORADA
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Desbloquea hasta un <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">20% de dscto.</span>
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-8 leading-relaxed max-w-xl">
              Únete a nuestra comunidad de viajeros premium y recibe beneficios exclusivos, itinerarios ocultos y atención prioritaria 24/7.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0F1E2D] bg-slate-300 flex items-center justify-center overflow-hidden">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-[#0F1E2D] bg-[#00B4FC] flex items-center justify-center text-white text-xs font-bold">
                  +2k
                </div>
              </div>
              <div className="text-white text-sm">
                <div className="flex text-yellow-400 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <span className="font-bold">Viajeros inscritos</span> hoy
              </div>
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="shrink-0"
          >
            <Link 
              href="/reservar" 
              className="relative overflow-hidden group bg-white text-[#0F1E2D] px-10 py-5 rounded-full font-black text-lg transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] flex items-center gap-3"
            >
              <span className="relative z-10">Reclamar mi descuento</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </motion.div>
        </div>
        
        {/* Cinta animada (Marquee) inferior */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden bg-yellow-400 py-3 z-20 shadow-lg border-y border-yellow-500/50">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap text-[#0F1E2D] font-black text-sm uppercase tracking-widest"
          >
            {[...Array(12)].map((_, i) => (
              <span key={i} className="mx-6 flex items-center gap-6">
                VIAJES PREMIUM <Star className="w-3 h-3" /> EXPERIENCIAS ÚNICAS <Star className="w-3 h-3" /> CUPOS LIMITADOS <Star className="w-3 h-3" />
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section id="viajes" className="mx-auto max-w-7xl px-4 py-32 sm:px-8 lg:px-16">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[#00B4FC] font-bold tracking-wider uppercase text-sm mb-2 block">Destinos Destacados</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#1E1E4E]">
              Tours Populares
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Explora nuestros paquetes de viaje más populares, seleccionados por expertos para ofrecer experiencias inolvidables en todo el mundo.
            </p>
          </div>
          <Link href="/viajes" className="group inline-flex items-center gap-2 text-[#1E1E4E] font-bold hover:text-[#00B4FC] transition-colors">
            Ver todos los tours 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {VIAJES_DISPONIBLES.map((viaje, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={viaje.id} 
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E4E]/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <Image
                  src={viaje.imagen}
                  alt={viaje.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-sm ${viaje.cupos === "Agotado" ? "bg-red-500/80" : "bg-[#00B4FC]/80"}`}>
                    {viaje.cupos}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                  <div className="flex items-center gap-1.5 text-white">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{viaje.rating}</span>
                    <span className="text-white/80 text-sm">({viaje.reviews})</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 border border-white/30 text-white text-center">
                    <span className="block text-[10px] uppercase tracking-wider opacity-80">Desde</span>
                    <span className="font-black">S/. {viaje.precio}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1 p-6 relative bg-white z-20">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#00B4FC] mb-3">
                  <Clock className="w-4 h-4" />
                  {viaje.dias}
                </div>
                <h3 className="mb-4 text-xl font-black text-[#1E1E4E] leading-tight group-hover:text-[#00B4FC] transition-colors line-clamp-2">
                  {viaje.titulo}
                </h3>
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <Link
                    href={`/viajes/${viaje.id}`}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${viaje.cupos === "Agotado" ? "bg-slate-300 cursor-not-allowed" : "bg-[#1E1E4E] hover:bg-[#00B4FC] hover:shadow-lg hover:shadow-[#00B4FC]/30"}`}
                  >
                    {viaje.cupos === "Agotado" ? "Agotado" : "Ver Tour"}
                    {viaje.cupos !== "Agotado" && <ArrowRight className="w-4 h-4" />}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#00B4FC]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((stat, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                key={idx} 
                className="text-center"
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                  {stat.number}
                </div>
                <div className="text-white/80 font-medium uppercase tracking-wider text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Informativa con Imágenes Grandes */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <span className="text-[#00B4FC] font-bold tracking-wider uppercase text-sm mb-2 block">Por qué elegirnos</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#1E1E4E] mb-6">
                Creamos momentos que duran toda la vida
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Viajar no es solo visitar lugares, es vivir experiencias que te transforman. En Totem nos encargamos de cada detalle, desde el itinerario hasta la logística, para que tú solo te preocupes por disfrutar.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-[#1E1E4E] font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#00B4FC]/10 flex items-center justify-center text-[#00B4FC]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  Seguridad en cada paso del viaje
                </li>
                <li className="flex items-center gap-3 text-[#1E1E4E] font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#00B4FC]/10 flex items-center justify-center text-[#00B4FC]">
                    <Compass className="w-4 h-4" />
                  </div>
                  Guías locales expertos y certificados
                </li>
                <li className="flex items-center gap-3 text-[#1E1E4E] font-medium">
                  <div className="w-8 h-8 rounded-full bg-[#00B4FC]/10 flex items-center justify-center text-[#00B4FC]">
                    <Heart className="w-4 h-4" />
                  </div>
                  Itinerarios personalizados a tu medida
                </li>
              </ul>
              <Link href="/nosotros" className="inline-flex items-center gap-2 bg-[#1E1E4E] text-white px-6 py-3 rounded-xl font-bold transition-all hover:bg-[#00B4FC] shadow-lg">
                Conoce más sobre nosotros
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 h-[500px]"
            >
              <div className="relative w-full h-full rounded-3xl overflow-hidden mt-8 shadow-xl">
                <Image 
                  src="https://i.pinimg.com/1200x/bc/0d/52/bc0d529f2a3670b6a3fab0d8ce85ec7a.jpg"
                  alt="Momento Inolvidable 1"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative w-full h-full rounded-3xl overflow-hidden -mt-8 shadow-xl">
                <Image 
                  src="https://i.pinimg.com/736x/f0/e9/6a/f0e96ab8720a8d81a99100a1a60128e6.jpg"
                  alt="Momento Inolvidable 2"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials / Info Section */}
      <section id="contacto" className="py-32 relative overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2000&auto=format&fit=crop"
            alt="Fondo Contacto Arequipa"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0F1E2D]/80" /> {/* Overlay oscuro para legibilidad */}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <span className="text-[#00B4FC] font-bold tracking-wider uppercase text-sm mb-2 block">Contacto Directo</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
              Comienza tu próxima aventura hoy
            </h2>
            <p className="text-lg text-white/80 mb-12 leading-relaxed">
              ¿Tienes preguntas sobre nuestros tours o deseas un itinerario personalizado? Nuestro equipo de expertos en viajes está listo para ayudarte a planificar el viaje perfecto.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-8 py-6 rounded-2xl shadow-lg border border-white/20 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-[#00B4FC] rounded-xl flex items-center justify-center text-white shadow-md">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white">Oficina Principal</h4>
                  <p className="text-white/70 text-sm">Lima, Perú</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-8 py-6 rounded-2xl shadow-lg border border-white/20 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-[#00B4FC] rounded-xl flex items-center justify-center text-white shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white">Soporte</h4>
                  <p className="text-white/70 text-sm">contact@totemhub.com</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
    </main>
  );
}
