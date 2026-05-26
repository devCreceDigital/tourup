"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Eye, Globe, Users, Calendar, DollarSign,
  Clock, Check, Edit3, MapPin, Image, List, FileText, X, Plus, Trash2
} from "lucide-react";
import { fetchDjango } from "@/lib/api";

const IMAGENES = [
  "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d1d1b1?w=800",
  "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
];

const TIPOS = ["grupal","escolar","familiar","individual"];
const TIPO_EMOJI: Record<string,string> = { grupal:"👥", escolar:"🎓", familiar:"👨‍👩‍👧", individual:"🧍" };

export default function ViajeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [activeSection, setSection] = useState("info");

  const [form, setForm] = useState({
    nombre: "", subtitulo: "", descripcion: "", slug: "",
    fecha_inicio: "", fecha_fin: "", cupos: 20,
    moneda: "PEN", estado: "borrador",
    tipo_viaje: "grupal", imagen_url: IMAGENES[0], duracion: "",
    precio_base: 0,
    incluye: ["Transporte ida y vuelta", "Alojamiento", "Guía especializado"],
    no_incluye: ["Gastos personales", "Propinas"],
    precios_detalle: [] as Array<{id:string;nombre:string;monto:number;destacado:boolean}>,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetchDjango(`/viajes/${id}/`)
      .then(r => r.json())
      .then(d => {
        const cfg = d.configuracion ?? {};
        const db  = cfg.descripciones_basicas ?? {};
        setForm({
          nombre:       d.nombre ?? "",
          subtitulo:    db.subtitulo ?? "",
          descripcion:  cfg.descripcion ?? "",
          slug:         d.slug ?? "",
          fecha_inicio: d.fecha_inicio ?? "",
          fecha_fin:    d.fecha_fin ?? "",
          cupos:        d.cupos ?? 20,
          moneda:       d.moneda ?? "PEN",
          estado:       d.estado ?? "borrador",
          tipo_viaje:   cfg.tipo_viaje ?? "grupal",
          imagen_url:   cfg.imagen_url ?? IMAGENES[0],
          duracion:     db.duracion ?? "",
          precio_base:  cfg.precio_base ?? 0,
          incluye:      cfg.incluye ?? ["Transporte ida y vuelta","Alojamiento","Guía especializado"],
          no_incluye:   cfg.no_incluye ?? ["Gastos personales","Propinas"],
          precios_detalle: cfg.precios_detalle ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (overrides?: Partial<typeof form>) => {
    const data = { ...form, ...overrides };
    setSaving(true);
    await fetchDjango(`/viajes/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: data.nombre,
        slug: data.slug,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        cupos: data.cupos,
        moneda: data.moneda,
        estado: data.estado,
        configuracion: {
          tipo_viaje: data.tipo_viaje,
          imagen_url: data.imagen_url,
          descripcion: data.descripcion,
          precio_base: data.precio_base,
          incluye: data.incluye,
          no_incluye: data.no_incluye,
          precios_detalle: data.precios_detalle,
          descripciones_basicas: {
            titulo: data.nombre,
            subtitulo: data.subtitulo,
            duracion: data.duracion,
            precio: `${data.moneda === "PEN" ? "S/." : "$"} ${data.precio_base}`,
          },
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ESTADO_COLOR: Record<string,string> = {
    publicado: "bg-emerald-100 text-emerald-700",
    borrador:  "bg-gray-100 text-gray-500",
    archivado: "bg-orange-100 text-orange-600",
  };

  const SECTIONS = [
    { id: "info",     label: "Información",  icon: FileText },
    { id: "imagen",   label: "Imagen",       icon: Image },
    { id: "precios",  label: "Precios",      icon: DollarSign },
    { id: "incluye",  label: "Qué incluye",  icon: List },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#5B4FE8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0edf8]">

      {/* Sidebar de secciones */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-[#ede9f8] flex flex-col">
        <div className="p-4 border-b border-[#ede9f8]">
          <Link href="/admin/viajes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h2 className="font-bold text-gray-900 text-sm truncate">{form.nombre || "Sin nombre"}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${ESTADO_COLOR[form.estado] ?? "bg-gray-100"}`}>
            {form.estado}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === id
                  ? "bg-[#5B4FE8]/10 text-[#5B4FE8]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#ede9f8] space-y-2">
          {form.estado === "borrador" && (
            <button onClick={() => { set("estado","publicado"); handleSave({ estado: "publicado" }); }}
              className="w-full py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 flex items-center justify-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Publicar
            </button>
          )}
          <button onClick={() => handleSave()} disabled={saving}
            className={`w-full py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-[#5B4FE8] text-white hover:bg-[#4a3fd4]"
            } disabled:opacity-50`}>
            {saved ? <><Check className="w-4 h-4" /> Guardado</> : saving ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar</>}
          </button>
        </div>
      </div>

      {/* Contenido principal + preview */}
      <div className="flex-1 flex overflow-hidden">

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* INFO */}
          {activeSection === "info" && (
            <>
              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Información básica</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre del viaje</label>
                  <input type="text" value={form.nombre} onChange={e => set("nombre", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="Ej: Cusco Mágico 2026" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Subtítulo</label>
                  <input type="text" value={form.subtitulo} onChange={e => set("subtitulo", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                    placeholder="Frase atractiva del viaje" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Descripción completa</label>
                  <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                    rows={4} className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] resize-none"
                    placeholder="Describe el viaje en detalle..." />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Fechas y logística</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Fecha inicio</label>
                    <input type="date" value={form.fecha_inicio} onChange={e => set("fecha_inicio", e.target.value)}
                      className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Fecha fin</label>
                    <input type="date" value={form.fecha_fin} onChange={e => set("fecha_fin", e.target.value)}
                      className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Duración</label>
                    <input type="text" value={form.duracion} onChange={e => set("duracion", e.target.value)}
                      className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]"
                      placeholder="Ej: 5 días" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Cupos máximos</label>
                    <input type="number" value={form.cupos} min={1} onChange={e => set("cupos", Number(e.target.value))}
                      className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-3">
                <h3 className="font-semibold text-gray-800">Tipo de viaje</h3>
                <div className="grid grid-cols-4 gap-3">
                  {TIPOS.map(t => (
                    <button key={t} onClick={() => set("tipo_viaje", t)}
                      className={`py-3 rounded-xl border-2 text-center transition-all ${
                        form.tipo_viaje === t ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8] hover:border-gray-300"
                      }`}>
                      <div className="text-xl mb-1">{TIPO_EMOJI[t]}</div>
                      <p className={`text-xs font-medium capitalize ${form.tipo_viaje === t ? "text-[#5B4FE8]" : "text-gray-600"}`}>{t}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-3">
                <h3 className="font-semibold text-gray-800">Estado</h3>
                <div className="flex gap-3">
                  {["borrador","publicado","archivado"].map(e => (
                    <button key={e} onClick={() => set("estado", e)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all capitalize ${
                        form.estado === e ? "border-[#5B4FE8] bg-[#5B4FE8]/5 text-[#5B4FE8]" : "border-[#ede9f8] text-gray-500 hover:border-gray-300"
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* IMAGEN */}
          {activeSection === "imagen" && (
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Imagen del viaje</h3>
              {form.imagen_url && (
                <div className="relative h-48 rounded-xl overflow-hidden">
                  <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {IMAGENES.map((url, i) => (
                  <button key={i} onClick={() => set("imagen_url", url)}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      form.imagen_url === url ? "border-[#5B4FE8] scale-95" : "border-transparent hover:border-gray-300"
                    }`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {form.imagen_url === url && (
                      <div className="absolute inset-0 bg-[#5B4FE8]/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">O usa tu propia URL</label>
                <input type="text" value={form.imagen_url} onChange={e => set("imagen_url", e.target.value)}
                  className="w-full border border-[#ede9f8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5B4FE8]"
                  placeholder="https://..." />
              </div>
            </div>
          )}

          {/* PRECIOS */}
          {activeSection === "precios" && (
            <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-5">
              <h3 className="font-semibold text-gray-800">Precios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Moneda</label>
                  <select value={form.moneda} onChange={e => set("moneda", e.target.value)}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8] bg-white">
                    <option value="PEN">S/. Soles</option>
                    <option value="USD">$ Dólares</option>
                    <option value="EUR">€ Euros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Precio base</label>
                  <input type="number" value={form.precio_base} min={0} onChange={e => set("precio_base", Number(e.target.value))}
                    className="w-full border border-[#ede9f8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5B4FE8]" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Opciones de precio</h4>
                  <button onClick={() => set("precios_detalle", [...form.precios_detalle, { id: Date.now().toString(), nombre: "Nueva opción", monto: 0, destacado: false }])}
                    className="flex items-center gap-1 text-xs text-[#5B4FE8] hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Agregar opción
                  </button>
                </div>
                {form.precios_detalle.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 text-sm">
                    Sin opciones de precio. Agrega una para ofrecer distintas habitaciones o categorías.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.precios_detalle.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${p.destacado ? "border-[#5B4FE8] bg-[#5B4FE8]/5" : "border-[#ede9f8]"}`}>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input type="text" value={p.nombre}
                            onChange={e => { const arr=[...form.precios_detalle]; arr[i]={...arr[i],nombre:e.target.value}; set("precios_detalle",arr); }}
                            className="border border-[#ede9f8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5B4FE8]"
                            placeholder="Ej: Habitación doble" />
                          <input type="number" value={p.monto} min={0}
                            onChange={e => { const arr=[...form.precios_detalle]; arr[i]={...arr[i],monto:Number(e.target.value)}; set("precios_detalle",arr); }}
                            className="border border-[#ede9f8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5B4FE8]"
                            placeholder="Monto" />
                        </div>
                        <button onClick={() => { const arr=[...form.precios_detalle]; arr[i]={...arr[i],destacado:!arr[i].destacado}; set("precios_detalle",arr); }}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${p.destacado ? "bg-[#5B4FE8] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          ⭐
                        </button>
                        <button onClick={() => set("precios_detalle", form.precios_detalle.filter((_,j) => j!==i))}
                          className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INCLUYE */}
          {activeSection === "incluye" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Incluye
                  </h3>
                  <button onClick={() => set("incluye", [...form.incluye, ""])}
                    className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.incluye.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <input type="text" value={item}
                        onChange={e => { const arr=[...form.incluye]; arr[i]=e.target.value; set("incluye",arr); }}
                        className="flex-1 border border-[#ede9f8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                        placeholder="Ej: Transporte incluido" />
                      <button onClick={() => set("incluye", form.incluye.filter((_,j)=>j!==i))}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#ede9f8] p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400" /> No incluye
                  </h3>
                  <button onClick={() => set("no_incluye", [...form.no_incluye, ""])}
                    className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.no_incluye.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <input type="text" value={item}
                        onChange={e => { const arr=[...form.no_incluye]; arr[i]=e.target.value; set("no_incluye",arr); }}
                        className="flex-1 border border-[#ede9f8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-300"
                        placeholder="Ej: Gastos personales" />
                      <button onClick={() => set("no_incluye", form.no_incluye.filter((_,j)=>j!==i))}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview del viaje */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-[#ede9f8] overflow-y-auto">
          <div className="p-3 border-b border-[#ede9f8] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Preview público</span>
            <a href={`/viajes/${form.slug}`} target="_blank"
              className="text-xs text-[#5B4FE8] hover:underline flex items-center gap-1">
              <Eye className="w-3 h-3" /> Abrir
            </a>
          </div>
          <div className="relative h-40 overflow-hidden">
            <img src={form.imagen_url || IMAGENES[0]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="font-black text-sm leading-tight">{form.nombre || "Sin nombre"}</p>
              {form.subtitulo && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{form.subtitulo}</p>}
            </div>
            <div className="absolute top-2 left-2">
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${ESTADO_COLOR[form.estado] ?? "bg-gray-100"}`}>
                {form.estado.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Inicio", value: form.fecha_inicio || "—" },
                { label: "Fin", value: form.fecha_fin || "—" },
                { label: "Duración", value: form.duracion || "—" },
                { label: "Cupos", value: `${form.cupos}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-gray-400">{label}</p>
                  <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
                </div>
              ))}
            </div>
            {form.precio_base > 0 && (
              <div className="bg-[#5B4FE8]/5 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Desde</p>
                <p className="text-xl font-black text-[#5B4FE8]">
                  {form.moneda === "PEN" ? "S/." : "$"} {form.precio_base.toLocaleString()}
                </p>
              </div>
            )}
            {form.incluye.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Incluye</p>
                {form.incluye.slice(0,3).map((item,i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
