"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  FileX,
  Info,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchDjango } from "@/lib/api";

type DocumentoAPI = {
  id: string;
  nombre: string;
  tipo: string | null;
  url: string;
  obligatorio: boolean;
  estado: "aprobado" | "en_revision" | "pendiente" | "rechazado";
  motivo_rechazo: string | null;
  fecha_revision: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function ViajeroDocumentosPage() {
  const [docs, setDocs] = useState<DocumentoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "exito" | "info" | "alerta";
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const inscRes = await fetchDjango("/mis-inscripciones/");
        const inscData = await inscRes.json();
        const inscripciones = inscData.results ?? inscData;
        if (!inscripciones.length) return;

        const inscripcion = inscripciones[0];
        const docsRes = await fetchDjango(`/inscripciones/${inscripcion.id}/documentos/`);
        const docsData = await docsRes.json();
        setDocs(docsData.results ?? docsData);
      } catch {
        // fall through — empty state shown
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubirDoc = async (doc: DocumentoAPI) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, estado: "en_revision", motivo_rechazo: null } : d
      )
    );
    setMensaje({
      texto:
        "Documento subido exitosamente. El equipo de Totem lo validará en las próximas 24 a 48 horas.",
      tipo: "exito",
    });
    setTimeout(() => setMensaje(null), 5000);
  };

  const completos = docs.filter((d) => d.estado === "aprobado").length;
  const totalObligatorios = docs.filter((d) => d.obligatorio).length;
  const progreso = totalObligatorios > 0 ? (completos / totalObligatorios) * 100 : 0;
  const todosAprobados = totalObligatorios > 0 && completos === totalObligatorios;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Cargando documentos…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#1E1E4E] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#5B5BDB]" />
          Mis Documentos y Validaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Sube tus documentos para que sean autentificados por el administrador. Esto es
          requisito indispensable para acceder a los boletos y beneficios del viaje.
        </p>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 border ${
            mensaje.tipo === "exito"
              ? "bg-green-50 border-green-200 text-green-800"
              : mensaje.tipo === "alerta"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {mensaje.tipo === "exito" && (
            <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-500" />
          )}
          {mensaje.tipo === "alerta" && (
            <AlertTriangle className="w-5 h-5 mt-0.5 text-red-500" />
          )}
          {mensaje.tipo === "info" && <Info className="w-5 h-5 mt-0.5 text-blue-500" />}
          <div className="text-sm font-medium">{mensaje.texto}</div>
        </div>
      )}

      {todosAprobados ? (
        <div className="bg-emerald-500 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">¡Documentación 100% Autentificada!</h2>
              <p className="text-emerald-50 text-sm mt-1">
                El equipo administrador de Totem ha validado todos tus documentos. Tu acceso al
                viaje está totalmente liberado.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#2D2D6E] text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-[#00D4C8]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Validación Pendiente</h2>
              <p className="text-indigo-200 text-sm mt-1">
                Debes subir los documentos faltantes. Una vez arriba, el Admin los aprobará para
                que recibas tu confirmación oficial.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6 bg-white border border-[#E0E4EF]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#1E1E4E] text-lg">Progreso de Documentación</h3>
              <span className="text-[#5B5BDB] font-bold">{Math.round(progreso)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-[#5B5BDB] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Has completado {completos} de {totalObligatorios} documentos obligatorios
              autentificados.
            </p>
          </div>

          <div className="bg-[#F5F6FB] p-4 rounded-xl shrink-0 flex items-center gap-4 w-full md:w-auto">
            <div className="text-center px-4 border-r border-gray-200">
              <div className="text-2xl font-black text-[#1E1E4E]">{completos}</div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Aprobados
              </div>
            </div>
            <div className="text-center px-4 border-r border-gray-200">
              <div className="text-2xl font-black text-orange-500">
                {docs.filter((d) => d.estado === "en_revision").length}
              </div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                En Revisión
              </div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-black text-red-500">
                {docs.filter((d) => d.estado === "pendiente" || d.estado === "rechazado").length}
              </div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Faltantes
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <Card
            key={doc.id}
            className={`flex flex-col h-full ${doc.estado === "rechazado" ? "border-red-200" : ""}`}
          >
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {doc.obligatorio ? (
                    <Badge variant="blue">Obligatorio</Badge>
                  ) : (
                    <Badge variant="gray">Opcional</Badge>
                  )}

                  {doc.estado === "aprobado" && (
                    <Badge variant="green" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Autentificado
                    </Badge>
                  )}
                  {doc.estado === "en_revision" && (
                    <Badge variant="orange" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> En Revisión
                    </Badge>
                  )}
                  {doc.estado === "pendiente" && (
                    <Badge variant="red" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Faltante
                    </Badge>
                  )}
                  {doc.estado === "rechazado" && (
                    <Badge variant="red" className="flex items-center gap-1">
                      <FileX className="w-3 h-3" /> Rechazado
                    </Badge>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-[#1E1E4E] text-lg mb-1">{doc.nombre}</h3>
              {doc.tipo && <p className="text-sm text-gray-500 mb-4">{doc.tipo}</p>}

              {doc.estado === "rechazado" && doc.motivo_rechazo && (
                <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 p-3 rounded-md mb-4 border border-red-200">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Motivo del rechazo Admin:</span>
                    {doc.motivo_rechazo}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto rounded-b-lg">
              {doc.estado === "aprobado" || doc.estado === "en_revision" ? (
                <>
                  <span className="text-xs text-gray-500">
                    {doc.estado === "aprobado"
                      ? "Validado por Admin Totem"
                      : "Esperando validación del Admin"}
                  </span>
                  <Button variant="outline" size="sm" className="h-8 gap-2 bg-white">
                    <Eye className="w-3.5 h-3.5" /> Ver archivo
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">Soporta PDF, JPG, PNG</span>
                  <Button
                    onClick={() => handleSubirDoc(doc)}
                    variant={doc.estado === "rechazado" ? "danger" : "primary"}
                    size="sm"
                    className="h-8 gap-2"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />{" "}
                    {doc.estado === "rechazado" ? "Re-subir doc" : "Subir doc"}
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}

        {docs.length === 0 && (
          <div className="col-span-2 py-12 text-center text-gray-400 text-sm">
            No hay documentos requeridos para este viaje.
          </div>
        )}
      </div>
    </div>
  );
}
