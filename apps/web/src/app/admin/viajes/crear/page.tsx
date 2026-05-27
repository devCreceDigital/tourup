"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Calendar, Users, DollarSign, Image, Globe, Tag, Check } from "lucide-react";
import { requestTotemApi } from "@/shared/api/totem-api-client";

const IMAGENES_SUGERIDAS = [
  "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d1d1b1?w=800",
  "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
];

const TIPOS = [
  { id: "grupal", label: "Grupal", emoji: "👥" },
  { id: "escolar", label: "Escolar", emoji: "🎓" },
  { id: "familiar", label: "Familiar", emoji: "👨‍👩‍👧" },
  { id: "individual", label: "Individual", emoji: "🧍" },
];

export default function CrearViajePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "", slug: "", fecha_inicio: "", fecha_fin: "",
    cupos: 20, moneda: "PEN", estado: "borrador",
    tipo_viaje: "grupal", imagen_url: IMAGENES_SUGERIDAS[0],
    subtitulo: "", duracion: "", precio: "",
    precio_base: 0,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const autoSlug = (nombre: string) =>
    nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const handleSubmit = async () => {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      setError("Nombre y fechas son obligatorios");
      setStep(1);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await requestTotemApi("/trips/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          slug: form.slug || autoSlug(form.nombre),
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          cupos: form.cupos,
          moneda: form.moneda,
          estado: form.estado,
          configuracion: {
            tipo_viaje: form.tipo_viaje,
            imagen_url: form.imagen_url,
            descripciones_basicas: {
              titulo: form.nombre,
              subtitulo: form.subtitulo,
              duracion: form.duracion,
              precio: form.precio,
            },
            precio_base: form.precio_base,
            precio_desde: form.precio_base,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/viajes/${data.id}`);
      } else {
        const err = await res.json();
        setError(JSON.stringify(err));
      }
    } catch (e) {
      setError("Error al crear el viaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0edf8]">
      {/* Header */}
      <div className="bg-white border-b border-[#ede9f8] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/viajes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Nuevo viaje</h1>
            <p className="text-xs text-gray-400">Paso {step} de 3</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 text-sm border border-[#ede9f8] rounded-xl hover:bg-gray-50 transition-colors">
              Atrás
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={!form.nombre}
              className="px-4 py-2 text-sm bg-[#5B4FE8] text-white rounded-xl hover:bg-[#4a3fd4] transition-colors disabled:opacity-50">
              Siguiente →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#5B4FE8] text-white rounded-xl hover:bg-[#4a3fd4] transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {loading ? "Creando..." : "Crear viaje"}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#ede9f8] px-6 py-3">
        <div className="flex items-center gap-2 max-w-2xl">
          {["Datos básicos", "Imagen y tipo", "Precios"].map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-[#5B4FE8] text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${step === i + 1 ? "text-[#5B4FE8]" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-emerald-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="max-w-2xl mx-auto p-6">
        {/* PASO 1 — Datos básicos */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Información básica</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del viaje *</label>
                <input type="text" value={form.nombre}
                  onChange={e => { set("nombre", e.target.value); set("slug", autoSlug(e.target.value)); }}
                  className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="Ej: Cusco Mágico 2026" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtítulo</label>
                <input type="text" value={form.subtitulo}
                  onChange={e => set("subtitulo", e.target.value)}
                  className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="Ej: Explora el corazón del Imperio Inca" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />Fecha inicio *
                  </label>
                  <input type="date" value={form.fecha_inicio}
                    onChange={e => set("fecha_inicio", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />Fecha fin *
                  </label>
                  <input type="date" value={form.fecha_fin}
                    onChange={e => set("fecha_fin", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Users className="w-3.5 h-3.5 inline mr-1" />Cupos máximos
                  </label>
                  <input type="number" value={form.cupos} min={1}
                    onChange={e => set("cupos", Number(e.target.value))}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
                  <input type="text" value={form.duracion}
                    onChange={e => set("duracion", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="Ej: 5 días" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado inicial</label>
                <div className="flex gap-3">
                  {[{ v: "borrador", l: "Borrador", d: "Solo visible para ti" }, { v: "publicado", l: "Publicado", d: "Visible al público" }].map(({ v, l, d }) => (
                    <button key={v} onClick={() => set("estado", v)}
                      className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${form.estado === v ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8] hover:border-gray-300"}`}>
                      <p className={`text-sm font-medium ${form.estado === v ? "text-[#5B4FE8]" : "text-gray-700"}`}>{l}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2 — Imagen y tipo */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Tipo de viaje</h2>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(({ id, label, emoji }) => (
                  <button key={id} onClick={() => set("tipo_viaje", id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${form.tipo_viaje === id ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8] hover:border-gray-300"}`}>
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className={`text-sm font-medium ${form.tipo_viaje === id ? "text-[#5B4FE8]" : "text-gray-700"}`}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-4">
              <h2 className="font-semibold text-gray-800">Imagen del viaje</h2>
              <div className="grid grid-cols-3 gap-3">
                {IMAGENES_SUGERIDAS.map((url, i) => (
                  <button key={i} onClick={() => set("imagen_url", url)}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${form.imagen_url === url ? "border-[#5B4FE8] scale-95" : "border-transparent hover:border-gray-300"}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {form.imagen_url === url && (
                      <div className="absolute inset-0 bg-[#5B4FE8]/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">O pega tu propia URL de imagen</label>
                <input type="text" value={form.imagen_url}
                  onChange={e => set("imagen_url", e.target.value)}
                  className="w-full border border-[#ede9f8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="https://..." />
              </div>
              {form.imagen_url && (
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/40 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                    Vista previa
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 3 — Precios */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Precios</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Moneda</label>
                  <select value={form.moneda} onChange={e => set("moneda", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] bg-white">
                    <option value="PEN">S/. Soles</option>
                    <option value="USD">$ Dólares</option>
                    <option value="EUR">€ Euros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 inline mr-1" />Precio base
                  </label>
                  <input type="number" value={form.precio_base} min={0}
                    onChange={e => { set("precio_base", Number(e.target.value)); set("precio", `${form.moneda === "PEN" ? "S/." : "$"} ${e.target.value}`); }}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="0" />
                </div>
              </div>
              <div className="bg-[#f0edf8] rounded-xl p-4 text-sm text-gray-600">
                Podrás agregar más opciones de precio (habitación doble, triple, etc.) después de crear el viaje.
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Resumen del viaje</h2>
              <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-bold text-sm">{form.nombre || "Sin nombre"}</p>
                  {form.subtitulo && <p className="text-xs text-white/80">{form.subtitulo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l: "Fechas", v: form.fecha_inicio && form.fecha_fin ? `${form.fecha_inicio} → ${form.fecha_fin}` : "—" },
                  { l: "Cupos", v: `${form.cupos} personas` },
                  { l: "Tipo", v: TIPOS.find(t => t.id === form.tipo_viaje)?.label ?? "—" },
                  { l: "Precio", v: form.precio_base ? `${form.moneda === "PEN" ? "S/." : "$"} ${form.precio_base}` : "Por definir" },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between py-2 border-b border-[#ede9f8]">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
