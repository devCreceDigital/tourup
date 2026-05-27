import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListOperators } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LevelBadge from "@/components/LevelBadge";
import { Search, Filter, CheckCircle, MapPin, Globe, ChevronLeft, ChevronRight } from "lucide-react";

const REGIONS = [
  "Lima", "Cusco", "Arequipa", "Puno", "Ica", "Piura",
  "Loreto", "Madre de Dios", "La Libertad", "Junín",
];
const OPERATOR_TYPES = [
  "Agencia Viajes", "Tour Operador", "Hotel Lodge", "Lodge",
  "Hostal y Tours", "Lodge Amazónico", "Operador Deportivo",
];
const NICHES = [
  "Ecoturismo", "Trekking", "Turismo Aventura", "Turismo Receptivo",
  "Turismo Cultural", "Lujo", "Turismo Gastronómico", "Turismo Vivencial",
  "Turismo Amazónico", "Surf y Playa", "Turismo de Naturaleza",
];
const LEVELS = ["elite", "premium", "advanced", "growing", "emerging", "risk"];

export default function DirectorioPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [opType, setOpType] = useState("all");
  const [niche, setNiche] = useState("all");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("ttdmi_score");
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, region, opType, niche, level]);

  const params = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(region !== "all" && { region }),
    ...(opType !== "all" && { operator_type: opType }),
    ...(niche !== "all" && { niche }),
    ...(level !== "all" && { level }),
    sort_by: sortBy,
    page,
    limit,
  };

  const { data, isLoading } = useListOperators(params);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const clearFilters = () => {
    setSearch("");
    setRegion("all");
    setOpType("all");
    setNiche("all");
    setLevel("all");
    setSortBy("ttdmi_score");
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Directorio de Operadores</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? "–"} operadores en el sistema
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
              placeholder="Buscar por nombre, región..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="directorio-search"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger data-testid="filter-region">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={opType} onValueChange={setOpType}>
              <SelectTrigger data-testid="filter-type">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {OPERATOR_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger data-testid="filter-niche">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los nichos</SelectItem>
                {NICHES.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger data-testid="filter-level">
                <SelectValue placeholder="Nivel" />
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
                <SelectItem value="ttdmi_score">Score TTDMI</SelectItem>
                <SelectItem value="commercial_name">Nombre A-Z</SelectItem>
                <SelectItem value="region">Región</SelectItem>
                <SelectItem value="rank_nacional">Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              <Filter className="w-3 h-3 mr-1" /> Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Operador</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo / Nicho</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Región</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nivel</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Verificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
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
                        <div className="font-medium truncate max-w-[200px]">{op.commercial_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{op.legal_name}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs">{op.operator_type}</div>
                        {op.niche && (
                          <div className="text-xs text-muted-foreground">{op.niche}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          {op.region}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <LevelBadge level={op.level} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {op.ttdmi_score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {op.verified ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
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
              {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} de {data.total} operadores
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
