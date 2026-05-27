import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListOperators } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LevelBadge from "@/components/LevelBadge";
import { Search, Filter, CheckCircle, MapPin, Globe, ChevronLeft, ChevronRight, Wifi } from "lucide-react";

const REGIONS = [
  "Amazonas","Áncash","Apurímac","Arequipa","Ayacucho","Cajamarca","Callao","Cusco",
  "Huancavelica","Huánuco","Ica","Junín","La Libertad","Lambayeque","Lima","Loreto",
  "Madre de Dios","Moquegua","Pasco","Piura","Puno","San Martín","Tacna","Tumbes","Ucayali",
];

const CLASES = [
  "Operador de Turismo",
  "Minorista",
  "Mayorista",
  "Minorista, Operador de Turismo",
  "Mayorista, Minorista",
  "Mayorista, Operador de Turismo",
  "Mayorista, Minorista, Operador de Turismo",
];

const MODALIDADES = ["Digital", "Presencial", "Digital, Presencial"];

const LEVELS = ["elite", "premium", "advanced", "growing", "emerging", "risk"];

export default function DirectorioPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [clase, setClase] = useState("all");
  const [modalidad, setModalidad] = useState("all");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("ttdmi_score");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, region, clase, modalidad, level]);

  const params: Record<string, string | number> = {
    sort_by: sortBy,
    page,
    limit,
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (region !== "all") params.region = region;
  if (clase !== "all") params.clase = clase;
  if (modalidad !== "all") params.modalidad = modalidad;
  if (level !== "all") params.level = level;

  const { data, isLoading } = useListOperators(params as any);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const clearFilters = () => {
    setSearch("");
    setRegion("all");
    setClase("all");
    setModalidad("all");
    setLevel("all");
    setSortBy("ttdmi_score");
    setPage(1);
  };

  const hasFilters = search || region !== "all" || clase !== "all" || modalidad !== "all" || level !== "all";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Directorio de Prestadores Turísticos</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Cargando..." : `${data?.total.toLocaleString() ?? "–"} agencias y operadores registrados`}
          </p>
        </div>
        <Button onClick={() => setLocation("/operadores/nuevo")} size="sm" data-testid="btn-nuevo-operador">
          Agregar Operador
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre comercial, razón social, RUC..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="directorio-search"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger data-testid="filter-region">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clase} onValueChange={setClase}>
              <SelectTrigger data-testid="filter-clase">
                <SelectValue placeholder="Clase MINCETUR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {CLASES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidad} onValueChange={setModalidad}>
              <SelectTrigger data-testid="filter-modalidad">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las modalidades</SelectItem>
                {MODALIDADES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger data-testid="filter-level">
                <SelectValue placeholder="Nivel TTDMI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="filter-sort">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ttdmi_score">Score TTDMI ↓</SelectItem>
                <SelectItem value="commercial_name">Nombre A-Z</SelectItem>
                <SelectItem value="region">Departamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <Filter className="w-3 h-3 mr-1" /> Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Operador</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Clase MINCETUR</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Departamento</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Modalidad</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nivel</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Web</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((op, idx) => (
                    <tr
                      key={op.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/operadores/${op.id}`)}
                      data-testid={`operator-row-${op.id}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[220px]">{op.commercial_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px] font-mono">{op.ruc}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {op.clase ?? op.operator_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          {op.region}
                          {op.province && op.province !== op.region && (
                            <span className="text-muted-foreground">· {op.province}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {op.modalidad_autorizada && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Wifi className="w-3 h-3 shrink-0" />
                            {op.modalidad_autorizada}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <LevelBadge level={op.level} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {op.ttdmi_score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {op.website ? (
                          <Globe className="w-4 h-4 text-blue-500 mx-auto" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} de {data.total.toLocaleString()} operadores
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                data-testid="pagination-prev"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="pagination-next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
