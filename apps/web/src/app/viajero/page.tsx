"use client";

import { useEffect, useState } from "react";
import {
  Calendar, MapPin, CreditCard, FileText,
  ArrowRight, Compass, Trash2, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/ui/primitives/Badge";
import { Card } from "@/shared/ui/primitives/Card";
import { Button } from "@/shared/ui/primitives/Button";
import { requestTotemApi } from "@/shared/api/totem-api-client";

type Inscripcion = {
  id: string;
  estado: string;
  viaje: string;
  viaje_nombre: string;
  pago_estado: string;
  docs_estado: string;
  created_at: string;
};

type ViajeDetalle = {
  nombre: string;
  fecha_inicio: string | null;
  cupos: number;
  itinerario_id: string | null;
};

type ItinerarioResumen = {
  dias: Array<{ id: string; numero_dia: number; titulo: string; destino_nombre: string }>;
};

export default function ViajeroDashboardPage() {
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [viaje, setViaje] = useState<ViajeDetalle | null>(null);
  const [itinerario, setItinerario] = useState<ItinerarioResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancelarInscripcion = async () => {
    if (!inscripcion) return;
    if (!confirm("¿Estás seguro de que deseas cancelar tu inscripción a este viaje? Esta acción no se puede deshacer.")) return;

    setIsDeleting(true);
    try {
      const res = await requestTotemApi(`/enrollments/${inscripcion.id}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInscripcion(null);
        setViaje(null);
        setItinerario(null);
      } else {
        alert("No se pudo cancelar la inscripción. Por favor contacta con soporte.");
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("Ocurrió un error inesperado.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    requestTotemApi("/enrollments?mine=1")
      .then((r) => r.json())
      .then(async (data) => {
        const results: Inscripcion[] = data.results ?? [];
        if (results.length > 0) {
          const primera = results[0];
          if (primera === undefined) return;
          setInscripcion(primera);
          const viajeRes = await requestTotemApi(`/trips/${primera.viaje}/`);
          const viajeData: ViajeDetalle = await viajeRes.json();
          setViaje(viajeData);
          if (viajeData.itinerario_id) {
            const itinRes = await requestTotemApi(`/itineraries/${viajeData.itinerario_id}/`);
            const itinData: ItinerarioResumen = await itinRes.json();
            setItinerario(itinData);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const diasRestantes = (fecha: string | null) => {
    if (!fecha) return null;
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="text-center text-[#888] py-16">Cargando tu viaje...</div>;
  }

  if (!inscripcion) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Compass className="h-16 w-16 text-[#5B5BDB] opacity-40" />
        <h2 className="text-xl font-bold text-[#1E1E4E]">Aún no estás inscrito en ningún viaje</h2>
        <p className="text-sm text-gray-500">Explora los viajes disponibles y únete al tuyo.</p>
        <Link href="/viajes">
          <Button variant="primary">Ver viajes disponibles</Button>
        </Link>
      </div>
    );
  }

  const dias = viaje ? diasRestantes(viaje.fecha_inicio) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* BANNER DEL VIAJE */}
      <div className="bg-[#2D2D6E] rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#5B4FE8] rounded-full opacity-20 -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="green">{inscripcion.estado.replace("_", " ")}</Badge>
            </div>
            <h1 className="text-3xl font-black mb-2">{viaje?.nombre ?? "Cargando..."}</h1>
            <div className="flex items-center gap-4 text-sm text-indigo-200">
              {viaje?.fecha_inicio && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(viaje.fecha_inicio + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Perú</span>
              </div>
            </div>
          </div>

          {dias !== null && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <div className="text-sm text-indigo-200 mb-1">Faltan</div>
              <div className="text-3xl font-black text-[#00D4C8]">
                {dias > 0 ? dias : 0} <span className="text-lg font-normal text-white">días</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TARJETAS DE ESTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pagos */}
        <Card className={`flex flex-col h-full border-l-4 ${inscripcion.pago_estado === "completo" ? "border-l-[#1A8A4A]" : inscripcion.pago_estado === "parcial" ? "border-l-[#F59E0B]" : "border-l-[#EF4444]"}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 text-[#F59E0B] rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1E4E]">Estado de Pagos</h3>
                <p className="text-xs text-gray-500">Revisa tus cuotas pendientes</p>
              </div>
            </div>
            <Badge variant={inscripcion.pago_estado === "completo" ? "green" : "orange"}>
              {inscripcion.pago_estado}
            </Badge>
          </div>
          <Link href="/viajero/pagos">
            <Button variant="primary" size="sm" className="w-full">Ver mis pagos <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </Link>
        </Card>

        {/* Documentos */}
        <Card className={`flex flex-col h-full border-l-4 ${inscripcion.docs_estado === "completo" ? "border-l-[#1A8A4A]" : inscripcion.docs_estado === "faltante" ? "border-l-[#EF4444]" : "border-l-[#F59E0B]"}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-[#EF4444] rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1E4E]">Documentos</h3>
                <p className="text-xs text-gray-500">Estado de tu documentación</p>
              </div>
            </div>
            <Badge variant={inscripcion.docs_estado === "completo" ? "green" : inscripcion.docs_estado === "faltante" ? "red" : "orange"}>
              {inscripcion.docs_estado}
            </Badge>
          </div>
          <Link href="/viajero/documentos">
            <Button variant="outline" size="sm" className="w-full">Ver mis documentos <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </Link>
        </Card>
      </div>

      {/* ITINERARIO */}
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
          <h3 className="font-bold text-[#1E1E4E] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#5B5BDB]" />
            Itinerario del viaje
          </h3>
          {itinerario && (
            <Link href="/viajero/itinerario" className="text-[#5B5BDB] text-sm font-medium hover:underline flex items-center gap-1">
              Ver completo <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {itinerario ? (
          <div className="space-y-1">
            {[...itinerario.dias]
              .sort((a, b) => a.numero_dia - b.numero_dia)
              .slice(0, 3)
              .map((dia) => (
                <div key={dia.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-[#5B5BDB]/10 text-[#5B5BDB] text-xs font-bold flex items-center justify-center shrink-0">
                    {dia.numero_dia}
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold text-[#1E1E4E]">{dia.titulo}</span>
                    {dia.destino_nombre && (
                      <span className="text-gray-400 ml-2 text-xs">· {dia.destino_nombre}</span>
                    )}
                  </div>
                </div>
              ))}
            {itinerario.dias.length > 3 && (
              <p className="text-xs text-gray-400 pt-2">
                +{itinerario.dias.length - 3} días más — <Link href="/viajero/itinerario" className="text-[#5B5BDB] hover:underline">ver todo</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-4 text-center">
            El itinerario estará disponible cuando el organizador lo publique.
          </div>
        )}
      </Card>

      {/* ACCIONES ADICIONALES */}
      <div className="mt-4 pt-6 border-t border-gray-200">
        <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-sm">Zona de Peligro</h4>
              <p className="text-xs text-red-700">Si cancelas tu inscripción, perderás tu cupo en el viaje y los beneficios asociados.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 border-red-200 hover:bg-red-600 hover:text-white transition-all duration-300 font-bold whitespace-nowrap"
            onClick={handleCancelarInscripcion}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Cancelando..." : "Cancelar mi viaje"}
          </Button>
        </div>
      </div>
    </div>
  );
}
