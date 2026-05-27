"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/shared/ui/navigation/Navbar";
import { 
  Users, 
  Target, 
  Heart, 
  Globe, 
  Award, 
  ArrowRight,
  MapPin,
  Star,
  Shield,
  Clock,
  TrendingUp,
  Sparkles,
  Building
} from "lucide-react";

export default function NosotrosPage() {
  const valores = [
    {
      icon: <Target className="h-8 w-8 text-[#10B981]" />,
      titulo: "Innovación",
      descripcion: "Creamos tecnología que simplifica lo complejo. Automatizamos procesos para que te enfoques en lo que importa: las experiencias."
    },
    {
      icon: <Heart className="h-8 w-8 text-[#EF4444]" />,
      titulo: "Pasión",
      descripcion: "Cada viaje es una historia que merece ser extraordinaria. Nos apasiona conectar personas y crear recuerdos que duran toda la vida."
    },
    {
      icon: <Shield className="h-8 w-8 text-[#00B4FC]" />,
      titulo: "Confianza",
      descripcion: "Seguridad y transparencia en cada paso. Miles de familias y instituciones confían en nosotros para sus experiencias más importantes."
    },
    {
      icon: <Globe className="h-8 w-8 text-[#8B5CF6]" />,
      titulo: "Impacto",
      descripcion: "Más que viajes, creamos oportunidades educativas y transformadoras que enriquecen comunidades y expanden horizontes."
    }
  ];

  const estadisticas = [
    { numero: "2,500+", label: "Viajeros felices", icon: <Users className="h-6 w-6" /> },
    { numero: "120+", label: "Viajes exitosos", icon: <MapPin className="h-6 w-6" /> },
    { numero: "25+", label: "Destinos únicos", icon: <Globe className="h-6 w-6" /> },
    { numero: "99.8%", label: "Satisfacción", icon: <Star className="h-6 w-6" /> },
    { numero: "15+", label: "Años de experiencia", icon: <Clock className="h-6 w-6" /> },
    { numero: "50+", label: "Instituciones", icon: <Building className="h-6 w-6" /> }
  ];

  const historia = [
    {
      año: "2010",
      titulo: "Los Inicios",
      descripcion: "Comenzamos como una pequeña agencia especializada en viajes educativos, entendiendo las necesidades únicas de colegios y universidades."
    },
    {
      año: "2018", 
      titulo: "Expansión Digital",
      descripcion: "Lanzamos nuestra primera plataforma online, digitalizando procesos que antes eran manuales y paper-based."
    },
    {
      año: "2022",
      titulo: "Nacimiento de Totem",
      descripcion: "Nace Totem HUB, una plataforma completa SaaS diseñada específicamente para agencias de viajes grupales."
    },
    {
      año: "2024",
      titulo: "Crecimiento Exponencial",
      descripcion: "Superamos los 2,500 viajeros y expandimos nuestros servicios a viajes corporativos y experiencias premium."
    }
  ];

  const equipo = [
    {
      nombre: "Ana García",
      rol: "CEO & Fundadora",
      imagen: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=280&auto=format&fit=crop",
      descripcion: "20+ años en turismo educativo. Ex-directora de viajes en colegio líder.",
      destacado: "'Cada viaje cambia una vida, nuestro trabajo es hacerlo seguro y memorable'"
    },
    {
      nombre: "Carlos López",
      rol: "CTO & Co-Founder", 
      imagen: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=280&auto=format&fit=crop",
      descripcion: "Especialista en transformación digital con 15 años en tecnología.",
      destacado: "'La tecnología debe servir a las personas, no al revés'"
    },
    {
      nombre: "María Torres",
      rol: "Directora de Experiencias",
      imagen: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=280&auto=format&fit=crop", 
      descripcion: "Diseñadora de experiencias con background en educación y turismo.",
      destacado: "'Los detalles hacen la diferencia entre un viaje y una experiencia'"
    },
    {
      nombre: "Javier Ruiz",
      rol: "Director Operaciones",
      imagen: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=280&auto=format&fit=crop",
      descripcion: "Logística y operaciones de viajes con expertise en seguridad.",
      destacado: "'La planificación perfecta garantiza experiencias impecables'"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F1E2D] via-[#1A2836] to-[#2D3748]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-16 sm:px-8 lg:px-16">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#00B4FC]/10 via-[#10B981]/5 to-[#8B5CF6]/10"
        />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000&auto=format&fit=crop')"
          }}
        />
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white">Nuestra Historia</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Transformando
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00B4FC] to-[#10B981]"> experiencias </span>
            desde 2010
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Más de una década creando viajes que inspiran, educan y conectan. 
            Donde la tecnología se encuentra con la pasión por explorar el mundo.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link 
              href="/viajes"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#00B4FC] to-[#0891B2] text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <MapPin className="h-5 w-5" />
              Explorar Destinos
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/#contacto"
              className="inline-flex items-center gap-3 border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 hover:border-white/50 transition-all"
            >
              <Users className="h-5 w-5" />
              Hablar con Equipo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {estadisticas.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-[#00B4FC]/30 transition-all hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#00B4FC]/20 to-[#10B981]/20 rounded-full">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-2">
                  {stat.numero}
                </div>
                <div className="text-sm text-white/70 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historia Section */}
      <section className="py-20 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Nuestra Trayectoria
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Más de una década de innovación y crecimiento en el mundo de los viajes grupales
            </p>
          </div>

          <div className="relative">
            {/* Línea de tiempo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#00B4FC] to-[#10B981] hidden md:block"></div>
            
            <div className="space-y-12">
              {historia.map((punto, index) => (
                <div 
                  key={index}
                  className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="md:w-1/2 md:px-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#10B981]/30 transition-all">
                      <div className="text-2xl font-black text-[#00B4FC] mb-2">
                        {punto.año}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        {punto.titulo}
                      </h3>
                      <p className="text-white/70 leading-relaxed">
                        {punto.descripcion}
                      </p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex md:w-1/2 md:justify-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-[#00B4FC] to-[#10B981] rounded-full border-4 border-[#0F1E2D] shadow-lg"></div>
                  </div>
                  
                  <div className="md:w-1/2 md:px-8">
                    {/* Espacio para imágenes futuras */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Nuestra Esencia
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Los principios que guían cada experiencia que creamos y cada relación que construimos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor, index) => (
              <div 
                key={index}
                className="bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all hover:scale-105 group"
              >
                <div className="mb-6 p-3 bg-white/10 rounded-full w-max">
                  {valor.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#10B981] transition-colors">
                  {valor.titulo}
                </h3>
                <p className="text-white/70 leading-relaxed group-hover:text-white/80 transition-colors">
                  {valor.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Líderes con Visión
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              El equipo ejecutivo que combina experiencia en turismo con innovación tecnológica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {equipo.map((miembro, index) => (
              <div 
                key={index}
                className="text-center group bg-gradient-to-b from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#8B5CF6]/30 transition-all hover:scale-105"
              >
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#00B4FC] via-[#10B981] to-[#8B5CF6] p-1 group-hover:from-[#10B981] group-hover:to-[#00B4FC] transition-all duration-500">
                    <Image
                      src={miembro.imagen}
                      alt={miembro.nombre}
                      width={128}
                      height={128}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00B4FC] to-[#10B981] rounded-full p-2 shadow-lg">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#10B981] transition-colors">
                  {miembro.nombre}
                </h3>
                <p className="text-[#00B4FC] font-semibold mb-3">
                  {miembro.rol}
                </p>
                <p className="text-white/70 text-sm mb-4">
                  {miembro.descripcion}
                </p>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[#10B981] text-xs italic font-medium">
                    {miembro.destacado}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-[#0F1E2D]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
          <div className="bg-gradient-to-r from-[#00B4FC]/20 via-[#10B981]/20 to-[#8B5CF6]/20 backdrop-blur-2xl rounded-3xl p-16 border border-white/10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
              ¿Listo para transformar tus
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00B4FC] to-[#10B981]"> experiencias grupales?</span>
            </h2>
            <p className="text-white/80 mb-10 text-xl max-w-3xl mx-auto leading-relaxed">
              Únete a más de 50 instituciones educativas y empresas que ya confían en Totem 
              para crear viajes extraordinarios con tecnología de punta y atención personalizada.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link 
                href="/registro"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white px-10 py-5 rounded-full font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              >
                <Sparkles className="h-5 w-5" />
                Comenzar Ahora
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/viajes"
                className="inline-flex items-center gap-3 border-2 border-white/40 text-white px-10 py-5 rounded-full font-bold hover:bg-white/10 hover:border-white/60 transition-all"
              >
                <MapPin className="h-5 w-5" />
                Ver Destinos
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#00B4FC]" />
                <span>Seguridad garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#10B981]" />
                <span>Soporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#8B5CF6]" />
                <span>Resultados comprobados</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
