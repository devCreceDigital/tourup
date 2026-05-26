"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchDjango } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreado: () => void;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export default function CrearViajeModal({ isOpen, onClose, onCreado }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    fecha_inicio: "",
    cupos: "0",
    responsable: "",
    estado: "borrador",
  });
  const [slugEditado, setSlugEditado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar al abrir
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        setForm({ nombre: "", slug: "", fecha_inicio: "", cupos: "0", responsable: "", estado: "borrador" });
        setSlugEditado(false);
        setError(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.slug.trim())   { setError("El slug es obligatorio."); return; }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        slug: form.slug.trim(),
        cupos: parseInt(form.cupos) || 0,
        estado: form.estado,
      };
      if (form.fecha_inicio) body.fecha_inicio = form.fecha_inicio;
      if (form.responsable.trim()) body.responsable = form.responsable.trim();

      const res = await fetchDjango("/viajes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = typeof data === "object"
          ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
          : "Error al crear el viaje.";
        setError(msg);
        return;
      }

      onCreado();
      onClose();
    } catch {
      setError("Error de red. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-lg border border-[#E0E4EF]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E4EF]">
          <h2 className="text-[16px] font-bold text-[#1E1E4E]">Crear nuevo viaje</h2>
          <button onClick={onClose} className="text-[#888] hover:text-[#1E1E4E] transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">{error}</div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">
              Nombre del viaje <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => {
                  const next = { ...prev, nombre: value };
                  if (!slugEditado) next.slug = toSlug(value);
                  return next;
                });
              }}
              placeholder="Ej: Excursión Cusco 5to Secundaria 2026"
              className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] outline-none focus:border-[#5B5BDB] focus:bg-white transition"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">
              Slug (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugEditado(true); set("slug", e.target.value); }}
              placeholder="excursion-cusco-2026"
              className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] font-mono outline-none focus:border-[#5B5BDB] focus:bg-white transition"
            />
            <p className="text-[11px] text-[#888] mt-1">Se usa en la URL pública. Solo minúsculas, números y guiones.</p>
          </div>

          {/* Fecha + Cupos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">Fecha de inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => set("fecha_inicio", e.target.value)}
                className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] outline-none focus:border-[#5B5BDB] focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">Cupos</label>
              <input
                type="number"
                min="0"
                value={form.cupos}
                onChange={(e) => set("cupos", e.target.value)}
                className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] outline-none focus:border-[#5B5BDB] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">Responsable</label>
            <input
              type="text"
              value={form.responsable}
              onChange={(e) => set("responsable", e.target.value)}
              placeholder="Ej: Laura Mendez"
              className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] outline-none focus:border-[#5B5BDB] focus:bg-white transition"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[12px] font-bold text-[#1E1E4E] mb-1.5">Estado inicial</label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              className="w-full rounded-md border border-[#E0E4EF] bg-[#F5F6FB] px-4 py-2.5 text-[13px] text-[#1E1E4E] outline-none focus:border-[#5B5BDB] focus:bg-white transition cursor-pointer"
            >
              <option value="borrador">Borrador</option>
              <option value="confirmado">Confirmado</option>
              <option value="publicado">Publicado</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[#E0E4EF] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#666] hover:bg-[#F5F6FB] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-[#5B5BDB] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#4848C0] transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creando..." : "Crear viaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
