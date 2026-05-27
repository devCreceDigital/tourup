"use client";
import { useState, useEffect } from "react";
import { Compass, ExternalLink, Eye, Send, EyeOff, Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchDjango } from "@/lib/api";

interface TripBannerProps {
  nombre: string;
  codigo?: string;
  slug?: string;
  viajeId?: string;
  estado?: string;
}

export default function TripBanner({ nombre: nombreProp, codigo, slug, viajeId, estado: estadoInicial }: TripBannerProps) {
  const [nombreReal, setNombreReal] = useState(nombreProp);
  useEffect(() => {
    if (!viajeId || nombreProp !== "—") return;
    fetchDjango(`/viajes/${viajeId}/`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.nombre) setNombreReal(d.nombre);
    }).catch(() => {});
  }, [viajeId, nombreProp]);
  const nombre = nombreReal;
  const [estado, setEstado] = useState(estadoInicial ?? "");
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    if (!viajeId) return;
    const nuevoEstado = estado === "publicado" ? "borrador" : "publicado";
    setPublishing(true);
    try {
      await fetchDjango(`/viajes/${viajeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setEstado(nuevoEstado);
      router.refresh();
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async () => {
    if (!viajeId) return;
    setExporting(true);
    try {
      const res = await fetchDjango(`/viajes/${viajeId}/`);
      const data = await res.json();
      const cfg = data.configuracion ?? {};
      const lines = [
        `INFORMACIÓN DEL VIAJE`,
        `====================`,
        `Nombre: ${data.nombre ?? "—"}`,
        `Código: ${data.codigo ?? "—"}`,
        `Slug: ${data.slug ?? "—"}`,
        `Estado: ${data.estado ?? "—"}`,
        `Fecha Inicio: ${data.fecha_inicio ?? "—"}`,
        `Fecha Fin: ${data.fecha_fin ?? "—"}`,
        `Cupos: ${data.cupos ?? "—"}`,
        `Moneda: ${data.moneda ?? "—"}`,
        ``,
        `CONFIGURACIÓN`,
        `=============`,
        `Responsable: ${cfg.responsable ?? "—"}`,
        `Tipo Acceso: ${cfg.tipo_acceso ?? "—"}`,
        `Modalidad: ${cfg.tipo_viaje ?? "—"}`,
        `Imagen: ${cfg.imagen_url ?? "—"}`,
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viaje-${data.slug ?? viajeId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-[#2a2060] text-white mx-4 mt-4 mb-0 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap shrink-0 shadow-[0_2px_12px_rgba(42,32,96,0.25)]">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <Compass className="h-5 w-5 text-white/70" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/viajes" className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="text-[14px] font-extrabold tracking-tight">Viaje: {nombre}</div>
          </div>
          {codigo ? <div className="text-[10px] text-white/50 font-medium mt-0.5">{codigo}</div> : null}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {/* EXPORTAR */}
        <button type="button" onClick={handleExport} disabled={exporting}
          className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 transition inline-flex items-center gap-1.5 disabled:opacity-60">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Exportar info
        </button>

        {/* VER EN CATÁLOGO */}
        {slug ? (
          <Link href={`/viajes/${slug}`} target="_blank"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white hover:bg-white/20 transition inline-flex items-center gap-1.5 text-[11px] font-semibold">
            <ExternalLink className="h-3.5 w-3.5" /> Ver
          </Link>
        ) : (
          <button type="button" title="Guarda el viaje con un slug para ver la vista pública"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white/40 transition inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-not-allowed">
            <ExternalLink className="h-3.5 w-3.5" /> Ver
          </button>
        )}

        {/* PUBLICAR / DESPUBLICAR */}
        {viajeId && (
          <button type="button" onClick={handlePublish} disabled={publishing}
            className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition inline-flex items-center gap-1.5 disabled:opacity-60 shadow-sm ${
              estado === "publicado" ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-[#00D4C8] hover:bg-[#00bdb2] text-[#003d3a]"
            }`}>
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : estado === "publicado" ? <><EyeOff className="h-3.5 w-3.5" /> Despublicar</> : <><Send className="h-3.5 w-3.5" /> Publicar</>}
          </button>
        )}
      </div>
    </div>
  );
}
