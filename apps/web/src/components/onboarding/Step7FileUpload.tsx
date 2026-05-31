"use client";
import { useState, useRef } from "react";
import { SUPPORTED_EXTENSIONS, FORMATS_GRID, validateFileSize, isValidExtension } from "@/lib/documents/types";

interface Step7FileUploadProps {
  onFileSelected: (file: File) => void;
  onCreateManually: () => void;
  onSkip: () => void;
}

const NOTE_INSTRUCTIONS: { app: string; steps: string[] }[] = [
  { app: "Notion", steps: ["Abre tu página en Notion","Click en '...' (arriba derecha)","Selecciona 'Export'","Elige 'HTML' o 'Markdown'","Descarga y sube aquí"] },
  { app: "Obsidian", steps: ["Abre tu vault","Selecciona la nota/carpeta",  "El archivo .md está en tu carpeta","Sube directamente o comprime como .zip"] },
  { app: "Evernote", steps: ["Selecciona las notas","Click derecho → 'Export Notes'","Elige formato '.enex'","Guarda y sube aquí"] },
  { app: "OneNote", steps: ["Abre OneNote","Selecciona sección/página","File → 'Export'","Elige 'HTML' y sube aquí"] },
  { app: "Google Keep", steps: ["Ve a takeout.google.com","Deselecciona todo excepto 'Keep'","Descarga el .zip","Sube aquí"] },
  { app: "Apple Notes", steps: ["Selecciona tus notas","File → 'Export as HTML'","Sube el archivo aquí"] },
];

export function Step7FileUpload({ onFileSelected, onCreateManually, onSkip }: Step7FileUploadProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "integrations">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    const sizeErr = validateFileSize(file);
    if (sizeErr) { setError(sizeErr); return; }
    if (!isValidExtension(file)) {
      setError("Formato no soportado. Usa PDF, Excel, Word, Notion, Obsidian, etc.");
      return;
    }
    setError("");
    onFileSelected(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 16px", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 600, borderBottom: active ? "2px solid #3B82F6" : "2px solid transparent",
    color: active ? "#3B82F6" : "#64748B", background: "transparent", transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: 640, margin: "20px auto", padding: "0 0 20px" }}>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", marginBottom: 24 }}>
        <button style={tabStyle(activeTab === "upload")} onClick={() => setActiveTab("upload")}>
          📤 Subir archivo
        </button>
        <button style={tabStyle(activeTab === "integrations")} onClick={() => setActiveTab("integrations")}>
          🔗 Integraciones <span style={{ fontSize: 10, background: "#DBEAFE", color: "#1D4ED8", borderRadius: 4, padding: "1px 5px", marginLeft: 4 }}>BETA</span>
        </button>
      </div>

      {activeTab === "upload" && (
        <>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, lineHeight: 1.6 }}>
            Para crear tus primeros viajes más rápido, puedo leer un PDF, Excel, Word, o incluso tu blog de notas
            (Notion, Obsidian, OneNote, etc). Simplemente sube el archivo y estructuraré automáticamente todos tus itinerarios.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "#3B82F6" : error ? "#EF4444" : "#CBD5E1"}`,
              borderRadius: 14, background: dragOver ? "#DBEAFE" : "#F8FAFC",
              minHeight: 240, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              padding: 32, transition: "all 0.15s", marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>{dragOver ? "📂" : "📄"}</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0A2540", marginBottom: 6, textAlign: "center" }}>
              {dragOver ? "Suelta el archivo aquí" : "Sube tu programa en PDF, Excel, Word, Notas o más"}
            </p>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>
              Arrastra tu archivo o haz clic para buscar
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={SUPPORTED_EXTENSIONS.join(",")}
              multiple={false}
              style={{ display: "none" }}
              onChange={handleInputChange}
            />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Formats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 10, letterSpacing: "0.05em" }}>DOCUMENTOS</p>
              {FORMATS_GRID.documents.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, fontSize: 12, color: "#475569" }}>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 10, letterSpacing: "0.05em" }}>BLOG DE NOTAS</p>
              {FORMATS_GRID.notes.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, fontSize: 12, color: "#475569" }}>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
            ⚠️ Formatos soportados: PDF, Excel, Word, PowerPoint, JSON, CSV, Notion, Obsidian, Evernote, OneNote, Google Keep, Apple Notes, Markdown, HTML
          </p>

          {/* Expandable instructions */}
          <button
            onClick={() => setShowInstructions(p => !p)}
            style={{ background: "none", border: "none", color: "#3B82F6", fontSize: 13, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 5 }}
          >
            💡 {showInstructions ? "Ocultar" : "¿Cómo exportar de tu app de notas?"}
            <span style={{ fontSize: 10 }}>{showInstructions ? "▲" : "▼"}</span>
          </button>

          {showInstructions && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {NOTE_INSTRUCTIONS.map(({ app, steps }) => (
                  <div key={app} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540", marginBottom: 8 }}>{app}</p>
                    {steps.map((s, i) => (
                      <p key={i} style={{ fontSize: 11, color: "#64748B", margin: "0 0 4px", paddingLeft: 12, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "#94A3B8" }}>{i + 1}.</span> {s}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => inputRef.current?.click()}
              style={{ width: "100%", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
            >
              📤 Subir un PDF / Notas ahora
            </button>
            <button
              onClick={onCreateManually}
              style={{ width: "100%", background: "#fff", color: "#0A2540", border: "1px solid #CBD5E1", borderRadius: 10, padding: "13px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}
            >
              ✏️ Crear manualmente
            </button>
            <button
              onClick={onSkip}
              style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: "4px" }}
            >
              ⏭️ Luego (completar desde el panel)
            </button>
          </div>
        </>
      )}

      {activeTab === "integrations" && (
        <div>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
            Conecta tu app de notas para sincronización automática de itinerarios.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { name: "Notion", icon: "📓", desc: "Sincroniza tus páginas directamente", badge: "BETA", active: true },
              { name: "Obsidian", icon: "💎", desc: "Lee directamente de tu vault", badge: "PRÓXIMAMENTE", active: false },
              { name: "Evernote", icon: "🐘", desc: "Importa tus notas de Evernote", badge: "PRÓXIMAMENTE", active: false },
              { name: "Google Keep", icon: "📌", desc: "Sincroniza tus notas rápidas", badge: "PRÓXIMAMENTE", active: false },
            ].map(({ name, icon, desc, badge, active }) => (
              <div key={name} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>{name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: active ? "#DBEAFE" : "#F1F5F9", color: active ? "#1D4ED8" : "#64748B" }}>
                    {badge}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>{desc}</p>
                <button
                  disabled={!active}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: active ? "pointer" : "default", borderColor: active ? "#3B82F6" : "#E2E8F0", background: active ? "#EFF6FF" : "#F8FAFC", color: active ? "#3B82F6" : "#94A3B8" }}
                >
                  {active ? "Conectar con OAuth" : "Próximamente"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
