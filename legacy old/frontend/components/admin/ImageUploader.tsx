"use client";

import { useState, useRef } from "react";
import { Upload, Link2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return _supabase;
};

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ value, onChange, label = "Imagen del Viaje" }: Props) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Solo se permiten imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5MB"); return; }
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `viajes/${Date.now()}.${ext}`;
      const { error: uploadError } = await getSupabase().storage.from("viajes-imagenes").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = getSupabase().storage.from("viajes-imagenes").getPublicUrl(path);
      onChange(data.publicUrl);
      setUrlInput(data.publicUrl);
    } catch (e: any) {
      setError("Error al subir: " + (e.message ?? "intenta de nuevo"));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlSave = () => {
    if (!urlInput.trim()) { setError("Ingresa una URL válida"); return; }
    onChange(urlInput.trim());
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px]">{label}</label>

      {/* PREVIEW */}
      {value && (
        <div className="relative h-36 rounded-xl overflow-hidden border border-[#ede9f8] group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button onClick={() => { onChange(""); setUrlInput(""); }}
              className="bg-white/90 text-[#a32d2d] rounded-lg px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-1 bg-[#f0edf8] rounded-lg p-1">
        <button onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition ${tab === "upload" ? "bg-white text-[#5B4FE8] shadow-sm" : "text-[#aaa] hover:text-[#666]"}`}>
          <Upload className="h-3.5 w-3.5" /> Subir archivo
        </button>
        <button onClick={() => setTab("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition ${tab === "url" ? "bg-white text-[#5B4FE8] shadow-sm" : "text-[#aaa] hover:text-[#666]"}`}>
          <Link2 className="h-3.5 w-3.5" /> URL externa
        </button>
      </div>

      {tab === "upload" ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#c5bff5] rounded-xl p-6 text-center cursor-pointer hover:bg-[#f5f3fb] transition">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-[#5B4FE8] animate-spin" />
              <p className="text-[11px] text-[#aaa]">Subiendo imagen…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-[#eeedfe] flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-[#5B4FE8]" />
              </div>
              <p className="text-[12px] font-semibold text-[#1a1a2e]">Arrastra una imagen o haz clic</p>
              <p className="text-[10px] text-[#aaa]">PNG, JPG, WEBP hasta 5MB</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 rounded-lg border border-[#ede9f8] bg-[#faf9ff] px-3 py-2 text-[12px] outline-none focus:border-[#5B4FE8]" />
          <button onClick={handleUrlSave}
            className="bg-[#5B4FE8] text-white rounded-lg px-4 py-2 text-[11px] font-bold hover:bg-[#4a3fd0] transition">
            Aplicar
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-[#a32d2d]">{error}</p>}
    </div>
  );
}
