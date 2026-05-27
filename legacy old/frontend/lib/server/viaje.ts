import { fetchDjangoServer } from "@/lib/server/fetch";

export type ViajeResumen = {
  id: string;
  nombre: string;
  codigo: string;
  slug: string;
  estado: string;
  cupos: number | null;
  moneda: string;
  fecha_inicio: string;
  fecha_fin: string;
  itinerario_id: string | null;
  configuracion: Record<string, unknown>;
};

export type InscripcionResumen = {
  id: string;
  pago_estado: string;
  docs_estado: string;
  estado: string;
};

export async function getViaje(id: string): Promise<ViajeResumen | null> {
  try {
    const res = await fetchDjangoServer(`/viajes/${id}/`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getViajeKPIs(viajeId: string, cupos: number | null) {
  try {
    const res = await fetchDjangoServer(`/viajes/${viajeId}/inscripciones/?page_size=500`);
    if (!res.ok) return { totalInscritos: 0, cupos, pagosCompletos: 0, docsPendientes: 0 };
    const data = await res.json();
    const results: InscripcionResumen[] = data.results ?? data;
    const totalInscritos: number = data.count ?? results.length;
    const pagosCompletos = results.filter((i) => i.pago_estado === "completo").length;
    const docsPendientes = results.filter((i) => i.docs_estado !== "completo").length;
    return { totalInscritos, cupos, pagosCompletos, docsPendientes };
  } catch {
    return { totalInscritos: 0, cupos, pagosCompletos: 0, docsPendientes: 0 };
  }
}
