import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Database, Globe, Mail, Phone, Building2, RefreshCw,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface IngestaStats {
  total_mincetur: string;
  total_manual: string;
  total: string;
  operadores: string;
  minoristas: string;
  mayoristas: string;
  agencias: string;
  regions_covered: string;
  with_website: string;
  with_email: string;
  digital_mode: string;
  last_imported: string | null;
}

interface IngestaResult {
  success: boolean;
  imported: number;
  skipped: number;
  total_lines: number;
  errors: string[];
}

export default function IngestaPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<IngestaResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery<IngestaStats>({
    queryKey: ["ingesta-stats"],
    queryFn: () =>
      fetch(`${BASE}/api/ingesta/stats`).then((r) => {
        if (!r.ok) throw new Error("Error fetching stats");
        return r.json();
      }),
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) return;
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const uploadCSV = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(10);
    setResult(null);

    try {
      const text = await selectedFile.text();
      setProgress(30);

      const resp = await fetch(`${BASE}/api/ingesta/csv`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      });
      setProgress(90);

      if (!resp.ok) throw new Error(await resp.text());
      const data: IngestaResult = await resp.json();
      setResult(data);
      setProgress(100);
      refetchStats();
      qc.invalidateQueries({ queryKey: ["operators"] });
    } catch (err) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        total_lines: 0,
        errors: [String(err)],
      });
    } finally {
      setUploading(false);
    }
  };

  const statCards = [
    {
      label: "Total Operadores",
      value: stats?.total ?? "–",
      sub: "en el sistema",
      icon: Database,
      color: "text-blue-600",
    },
    {
      label: "Fuente MINCETUR",
      value: stats?.total_mincetur ?? "–",
      sub: "importados del CSV",
      icon: FileText,
      color: "text-emerald-600",
    },
    {
      label: "Operadores de Turismo",
      value: stats?.operadores ?? "–",
      sub: "clase MINCETUR",
      icon: Building2,
      color: "text-primary",
    },
    {
      label: "Minoristas",
      value: stats?.minoristas ?? "–",
      sub: "agencias minoristas",
      icon: Building2,
      color: "text-purple-600",
    },
    {
      label: "Mayoristas",
      value: stats?.mayoristas ?? "–",
      sub: "agencias mayoristas",
      icon: Building2,
      color: "text-orange-600",
    },
    {
      label: "Con Web",
      value: stats?.with_website ?? "–",
      sub: "presencia digital",
      icon: Globe,
      color: "text-cyan-600",
    },
    {
      label: "Con Email",
      value: stats?.with_email ?? "–",
      sub: "contacto digital",
      icon: Mail,
      color: "text-yellow-600",
    },
    {
      label: "Modalidad Digital",
      value: stats?.digital_mode ?? "–",
      sub: "habilitados digital",
      icon: CheckCircle,
      color: "text-teal-600",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Módulo de Ingesta de Datos</h1>
          <p className="text-sm text-muted-foreground">
            Importa el padrón de prestadores turísticos desde MINCETUR (formato CSV)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          data-testid="btn-refresh-stats"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualizar
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              {loadingStats ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{Number(s.value).toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Cargar Archivo CSV del Padrón MINCETUR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
              ${dragOver
                ? "border-primary bg-primary/5"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
              }
            `}
            data-testid="drop-zone"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — listo para importar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-medium">Arrastra el CSV aquí o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground">
                  Formato: bd_agencias MINCETUR (.csv, UTF-8)
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Procesando y cargando registros...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                result.success
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
              }`}
              data-testid="ingesta-result"
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className="font-semibold">
                  {result.success ? "Importación exitosa" : "Error en la importación"}
                </p>
              </div>
              {result.success && (
                <div className="grid grid-cols-3 gap-3 text-center text-sm mt-2">
                  <div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {result.imported.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Importados / actualizados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{result.total_lines.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Líneas procesadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{result.skipped.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Omitidos</p>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Detalles de errores:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                      {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={uploadCSV}
              disabled={!selectedFile || uploading}
              data-testid="btn-upload-csv"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {uploading ? "Importando..." : "Importar CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Format guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Formato de Archivo Esperado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-border">
                  {["FECHA_CORTE","RUC","RAZON_SOCIAL","NOMBRE_COMERCIAL","DEPARTAMENTO","PROVINCIA","DISTRITO","TELEF1","E_MAIL","PAGINA_WEB","CLASE","MODALIDAD_AUTORIZADA","REP_LEGAL","NRO_CERTIFICADO"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  {["20260515","10763924136","PORTILLO VELASQUEZ, FRANKLIN","PERU TREK","JUNÍN","CHANCHAMAYO","CHANCHAMAYO","993264497","perutrek4@gmail.com","","Operador de Turismo","Presencial","Franklin Portillo Velasquez",""].map((v, i) => (
                    <td key={i} className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">{v || "–"}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Clases aceptadas: <strong>Operador de Turismo</strong>, <strong>Minorista</strong>, <strong>Mayorista</strong> y sus combinaciones. El sistema rechaza hoteles, restaurantes y otros rubros no turísticos.
          </p>
        </CardContent>
      </Card>

      {stats?.last_imported && (
        <p className="text-xs text-muted-foreground text-right">
          Última importación: {new Date(stats.last_imported).toLocaleString("es-PE")}
        </p>
      )}
    </div>
  );
}
