/**

 * Cliente HTTP para el backend Django de Totem.

 *

 * Modos:

 *   - MOCK (default mientras Ronald arma backend): devuelve datos falsos

 *     simulando latencia y respuestas reales del API.

 *   - REAL: llama al backend Django con NEXT_PUBLIC_DJANGO_API_URL.

 *

 * Para cambiar de mock a real:

 *   1. En .env.local poner: NEXT_PUBLIC_USE_MOCK_API=false

 *   2. Definir: NEXT_PUBLIC_DJANGO_API_URL=https://api.totem.com

 *   3. Reiniciar npm run dev

 *

 * El codigo del dashboard NO cambia. fetchDjango funciona igual en ambos modos.

 */



import { createSupabaseBrowserClient } from "./supabase/client";

import { getApiBaseUrl, shouldUseMockApi } from "./env";



// ============================================

// CONFIGURACION

// ============================================



const USE_MOCK = shouldUseMockApi();

const API_BASE_URL = getApiBaseUrl();



// ============================================

// MOCK DATA (datos falsos para desarrollo)

// ============================================



type MockViaje = {

  id: string;

  nombre: string;

  slug: string;

  codigo: string;

  estado: string;

  fecha_inicio: string | null;

  fecha_fin: string | null;

  cupos: number;

  moneda: string;

  responsable: string;

  itinerario_id: string | null;

  configuracion: Record<string, unknown>;

};



const mockViajes: MockViaje[] = [

  {

    id: "viaje-1",

    nombre: "Promocion 5to Secundaria - Paracas 2026",

    slug: "promocion-5to-paracas-2026",

    codigo: "2026-L504-PARACAS-TO",

    estado: "publicado",

    fecha_inicio: "2026-03-14",

    fecha_fin: "2026-03-19",

    cupos: 60,

    moneda: "USD",

    responsable: "Laura Mendez",

    itinerario_id: "itin-1",

    configuracion: {

      documentos_requeridos: [

        { id: "r1", nombre: "Documento de identidad", obligatorio: true, descripcion: "DNI o pasaporte vigente según destino." },

        { id: "r2", nombre: "Permiso firmado", obligatorio: true, descripcion: "Autorización del apoderado para menores de edad." },

      ],

      // campos públicos

      titulo_publico: "Paracas – Playa La Mina",

      subtitulo: "2 Días / 1 Noche",

      tipo: "Viaje escolar / grupal",

      destino: "Paracas – Ica – Huacachina",

      duracion: "2 días / 1 noche",

      descripcion: "Islas Ballestas, Reserva Nacional de Paracas, Huacachina y sandboarding. La escapada perfecta para grupos escolares.",

      imagen: "https://images.unsplash.com/photo-1611004128522-8618fb8f2923?q=80&w=800&auto=format&fit=crop",

      categoria: "Escolar",

      precio_base: 450,

      incluye: "Transporte, alojamiento, alimentación y actividades",

      precios: { economico: 450, estandar: 650, premium: 850 },

      itinerario_publico: [

        { dia: "Día 1", actividades: ["Salida desde el colegio en bus turístico con todos los servicios", "Tour en lanchas por las Islas Ballestas", "Almuerzo típico en restaurante de Paracas (menú incluido)", "Visita libre a Playa La Mina dentro de la Reserva Nacional de Paracas", "Check-in en hotel. Actividad nocturna: «Noche Blanca»"] },

        { dia: "Día 2", actividades: ["Desayuno buffet en el hotel", "City Tour por Ica — Plaza de Armas, Catedral y bodegas artesanales", "Huacachina: paseo en tubulares por las dunas y sandboarding", "Retorno a Lima"] },

      ],

      beneficios: ["Sistema en línea con información del viaje en tiempo real", "Guía profesional durante todo el recorrido", "Actividades recreativas y dinámicas grupales", "Fotos y video profesional del viaje", "Degustaciones: chocotejas, vinos y piscos artesanales"],

      datosImportantes: ["Requiere pago adelantado para confirmar la reserva", "Llevar DNI original obligatorio", "Permiso notarial para menores que no viajan con sus padres", "Las Islas Ballestas están sujetas a condiciones climáticas"],

      servicios: [

        { id: "s1", nombre: "Transporte turístico", incluido: true, detalle: "Bus privado durante todo el circuito." },

        { id: "s2", nombre: "Alimentación", incluido: false, detalle: "Incluye desayunos, almuerzos opcionales." },

        { id: "s3", nombre: "Guía profesional", incluido: true, detalle: "Guía certificado con experiencia en la zona." },

      ],

      descripciones_basicas: {

        titulo: "Paracas – Playa La Mina",

        subtitulo: "2 Días / 1 Noche en la Reserva Nacional de Paracas",

        precio: "Desde USD 450 por persona",

        duracion: "2 días / 1 noche",

        texto_breve: "Islas Ballestas, Reserva Nacional de Paracas, Huacachina y sandboarding. La escapada perfecta para grupos escolares.",

      },

    },

  },

];



const mockInscripciones: Array<Record<string, unknown>> = [];



// ── MOCK: CATÁLOGO ────────────────────────────────────────────────────────────

type MockActividad = {

  id: string;

  nombre: string;

  descripcion: string;

  categoria: string;

  duracion_horas: number;

  localizacion: string;

  destino_id: string;

  destino_nombre: string;

};



const mockActividades: MockActividad[] = [

  { id: "act-1", nombre: "Tour Islas Ballestas", descripcion: "Paseo en bote por las islas con fauna marina", categoria: "naturaleza", duracion_horas: 3, localizacion: "Bahía de Paracas", destino_id: "dest-1", destino_nombre: "Paracas" },

  { id: "act-2", nombre: "Visita Reserva Nacional", descripcion: "Recorrido por la reserva en 4x4", categoria: "naturaleza", duracion_horas: 4, localizacion: "Reserva de Paracas", destino_id: "dest-1", destino_nombre: "Paracas" },

  { id: "act-3", nombre: "Sandboarding en Huacachina", descripcion: "Tubulares y sandboard en las dunas", categoria: "deportiva", duracion_horas: 2, localizacion: "Laguna de Huacachina", destino_id: "dest-2", destino_nombre: "Ica" },

  { id: "act-4", nombre: "City Tour Ica", descripcion: "Plaza de Armas, catedral y bodegas artesanales", categoria: "cultural", duracion_horas: 3, localizacion: "Ica Centro", destino_id: "dest-2", destino_nombre: "Ica" },

  { id: "act-5", nombre: "Degustación de vinos y piscos", descripcion: "Cata en bodegas tradicionales de Ica", categoria: "gastronomica", duracion_horas: 1.5, localizacion: "Bodegas de Ica", destino_id: "dest-2", destino_nombre: "Ica" },

  { id: "act-6", nombre: "Sobrevuelo Líneas de Nazca", descripcion: "Vuelo panorámico de 30 min sobre las líneas", categoria: "cultural", duracion_horas: 1, localizacion: "Aeródromo de Nazca", destino_id: "dest-3", destino_nombre: "Nazca" },

];



// ── MOCK: ITINERARIOS ─────────────────────────────────────────────────────────

type MockEvento = {

  id: string;

  tipo: "texto_libre" | "actividad_catalogo";

  descripcion: string;

  hora_inicio: string | null;

  hora_fin: string | null;

  actividad_id: string | null;

  orden: number;

};



type MockDia = {

  id: string;

  itinerario_id: string;

  numero_dia: number;

  titulo: string;

  resumen: string;

  alojamiento_pernocta: string;

  destino_nombre: string;

  eventos: MockEvento[];

};



type MockItinerario = {

  id: string;

  nombre: string;

  descripcion: string;

  version: number;

  estado: string;

  created_at: string;

};



let mockItinerariosData: MockItinerario[] = [

  { id: "itin-1", nombre: "Itinerario Paracas 2 días", descripcion: "Circuito clásico Paracas + Ica", version: 1, estado: "activo", created_at: "2026-03-01T10:00:00Z" },

  { id: "itin-2", nombre: "Circuito Sur Chico", descripcion: "Paracas, Ica y Nazca en 3 días", version: 2, estado: "activo", created_at: "2026-02-15T08:00:00Z" },

];



let mockDiasData: MockDia[] = [

  { id: "d1", itinerario_id: "itin-1", numero_dia: 1, titulo: "Llegada y Ballestas", resumen: "Salida de Lima y primer contacto con Paracas", alojamiento_pernocta: "Hotel Paracas Resort", destino_nombre: "Paracas", eventos: [

    { id: "e1", tipo: "texto_libre", descripcion: "Salida desde el colegio en bus turístico 6:00am", hora_inicio: "06:00", hora_fin: "10:00", actividad_id: null, orden: 0 },

    { id: "e2", tipo: "actividad_catalogo", descripcion: "Tour Islas Ballestas", hora_inicio: "11:00", hora_fin: "14:00", actividad_id: "act-1", orden: 1 },

    { id: "e3", tipo: "texto_libre", descripcion: "Almuerzo en restaurante La Ola", hora_inicio: "14:00", hora_fin: "15:30", actividad_id: null, orden: 2 },

    { id: "e4", tipo: "actividad_catalogo", descripcion: "Visita Reserva Nacional de Paracas", hora_inicio: "16:00", hora_fin: "19:00", actividad_id: "act-2", orden: 3 },

  ]},

  { id: "d2", itinerario_id: "itin-1", numero_dia: 2, titulo: "Huacachina y retorno", resumen: "Aventura en las dunas y regreso a Lima", alojamiento_pernocta: "", destino_nombre: "Ica", eventos: [

    { id: "e5", tipo: "texto_libre", descripcion: "Desayuno buffet en el hotel 7:00am", hora_inicio: "07:00", hora_fin: "08:30", actividad_id: null, orden: 0 },

    { id: "e6", tipo: "actividad_catalogo", descripcion: "City Tour Ica", hora_inicio: "09:00", hora_fin: "12:00", actividad_id: "act-4", orden: 1 },

    { id: "e7", tipo: "actividad_catalogo", descripcion: "Sandboarding en Huacachina", hora_inicio: "14:00", hora_fin: "17:00", actividad_id: "act-3", orden: 2 },

    { id: "e8", tipo: "texto_libre", descripcion: "Retorno a Lima. Llegada aprox. 22:00", hora_inicio: "18:00", hora_fin: null, actividad_id: null, orden: 3 },

  ]},

  { id: "d3", itinerario_id: "itin-2", numero_dia: 1, titulo: "Paracas – Ballestas", resumen: "Arribo y tour marino", alojamiento_pernocta: "Hotel Kettal", destino_nombre: "Paracas", eventos: [

    { id: "e9", tipo: "actividad_catalogo", descripcion: "Tour Islas Ballestas", hora_inicio: "10:00", hora_fin: "13:00", actividad_id: "act-1", orden: 0 },

  ]},

  { id: "d4", itinerario_id: "itin-2", numero_dia: 2, titulo: "Ica y dunas", resumen: "Cultura y aventura", alojamiento_pernocta: "Hotel Las Dunas", destino_nombre: "Ica", eventos: [

    { id: "e10", tipo: "actividad_catalogo", descripcion: "Degustación de vinos", hora_inicio: "10:00", hora_fin: "12:00", actividad_id: "act-5", orden: 0 },

    { id: "e11", tipo: "actividad_catalogo", descripcion: "Sandboarding", hora_inicio: "15:00", hora_fin: "17:30", actividad_id: "act-3", orden: 1 },

  ]},

  { id: "d5", itinerario_id: "itin-2", numero_dia: 3, titulo: "Nazca y retorno", resumen: "Sobrevuelo y regreso", alojamiento_pernocta: "", destino_nombre: "Nazca", eventos: [

    { id: "e12", tipo: "actividad_catalogo", descripcion: "Sobrevuelo Líneas de Nazca", hora_inicio: "08:00", hora_fin: "10:00", actividad_id: "act-6", orden: 0 },

    { id: "e13", tipo: "texto_libre", descripcion: "Retorno a Lima", hora_inicio: "11:00", hora_fin: null, actividad_id: null, orden: 1 },

  ]},

];



type MockOperacion = {

  id: string;

  viaje_id: string;

  [key: string]: unknown;

};



let mockOperaciones: MockOperacion[] = [];



// ============================================

// LOGICA DE MOCK FETCH

// ============================================



const mockResponse = (data: unknown, ok = true, status = 200) => {

  const effectiveStatus = ok ? status : status || 400

  return new Promise<Response>((resolve) => {

    setTimeout(() => {

      resolve(

        new Response(JSON.stringify(data), {

          status: effectiveStatus,

          headers: { "Content-Type": "application/json" },

        })

      );

    }, 400); // simulamos lag de 400ms

  });

};



async function mockFetch(p: string, init?: RequestInit): Promise<Response> {

  const method = init?.method ?? "GET";

  const body = init?.body ? JSON.parse(init.body as string) : null;



  // ===== /viajes =====

  if (p === "/viajes" && method === "GET") {

    return mockResponse({ count: mockViajes.length, results: mockViajes });

  }



  if (p.startsWith("/viajes/") && method === "GET") {

    const id = p.split("/")[2];

    const found = mockViajes.find((v) => v.id === id);

    if (!found) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(found);

  }



  if (p === "/viajes" && method === "POST") {

    const nuevo: MockViaje = {

      id: "v-" + Date.now(),

      nombre: body.nombre,

      slug: body.nombre.toLowerCase().replace(/ /g, "-"),

      codigo: "MOCK-" + Math.random().toString(36).substring(7).toUpperCase(),

      estado: "borrador",

      fecha_inicio: body.fecha_inicio ?? null,

      fecha_fin: body.fecha_fin ?? null,

      cupos: body.cupos ?? 0,

      moneda: body.moneda ?? "USD",

      responsable: "",

      itinerario_id: null,

      configuracion: {},

    };

    mockViajes.push(nuevo);

    return mockResponse(nuevo, true, 201);

  }



  // ===== /public/viajes =====

  if (p.startsWith("/public/viajes/") && method === "GET") {

    const slug = p.split("/")[3];

    const found = mockViajes.find((v) => v.slug === slug);

    if (!found) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(found);

  }



  // ===== /inscripciones =====

  if (p === "/inscripciones" && method === "GET") {

    return mockResponse({ count: mockInscripciones.length, results: mockInscripciones });

  }



  if (p === "/inscripciones" && method === "POST") {

    const nuevo = { id: "insc-" + Date.now(), ...body, created_at: new Date().toISOString() };

    mockInscripciones.push(nuevo);

    return mockResponse(nuevo, true, 201);

  }



  // ===== /notificaciones =====

  if (p.startsWith("/notificaciones") && method === "GET") {

    return mockResponse({ count: 0, results: [] });

  }



  // ===== /viajes/:id/operaciones =====

  if (p.match(/^\/viajes\/[^/]+\/operaciones$/) && method === "GET") {

    const viaje_id = p.split("/")[2];

    const filtered = mockOperaciones.filter((o) => o.viaje_id === viaje_id);

    return mockResponse({ count: filtered.length, results: filtered });

  }



  if (p.match(/^\/viajes\/[^/]+\/operaciones$/) && method === "POST") {

    const viaje_id = p.split("/")[2];

    const viaje = mockViajes.find((v) => v.id === viaje_id)?.nombre ?? "Viaje";

    const nuevo = {

      id: "op-" + Date.now(),

      viaje_id,

      viaje,

      titulo: body?.titulo ?? "",

      tipo: body?.tipo ?? "transporte",

      estado: body?.estado ?? "pendiente",

      fecha_inicio: body?.fecha_inicio ?? null,

      fecha_fin: body?.fecha_fin ?? null,

      responsable: body?.responsable ?? "",

      proveedor: body?.proveedor ?? null,

      prioridad: body?.prioridad ?? "media",

      notas: body?.notas ?? null,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

    };

    mockOperaciones = [nuevo, ...mockOperaciones];

    return mockResponse(nuevo, true, 201);

  }



  if (p.match(/^\/viajes\/[^/]+\/operaciones\/[^/]+$/) && method === "PATCH") {

    const [, , viaje_id, , op_id] = p.split("/");

    mockOperaciones = mockOperaciones.map((o) =>

      o.id === op_id && o.viaje_id === viaje_id

        ? { ...o, ...body, updated_at: new Date().toISOString() }

        : o

    );

    const updated = mockOperaciones.find((o) => o.id === op_id && o.viaje_id === viaje_id);

    if (!updated) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(updated);

  }



  if (p.match(/^\/viajes\/[^/]+\/operaciones\/[^/]+$/) && method === "DELETE") {

    const [, , viaje_id, , op_id] = p.split("/");

    const before = mockOperaciones.length;

    mockOperaciones = mockOperaciones.filter((o) => !(o.id === op_id && o.viaje_id === viaje_id));

    if (mockOperaciones.length === before) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse({}, true, 204);

  }



  // ===== /itinerarios =====

  if (p === "/itinerarios" && method === "GET") {

    const results = mockItinerariosData.map((it) => ({

      ...it,

      total_dias: mockDiasData.filter((d) => d.itinerario_id === it.id).length,

    }));

    return mockResponse({ count: results.length, results });

  }



  if (p === "/itinerarios" && method === "POST") {

    const nuevo: MockItinerario = {

      id: "itin-" + Date.now(),

      nombre: body.nombre ?? "Nuevo itinerario",

      descripcion: body.descripcion ?? "",

      version: 1,

      estado: "activo",

      created_at: new Date().toISOString(),

    };

    mockItinerariosData = [nuevo, ...mockItinerariosData];

    return mockResponse({ ...nuevo, total_dias: 0, dias: [] }, true, 201);

  }



  if (p.match(/^\/itinerarios\/[^/]+$/) && method === "GET") {

    const id = p.split("/")[2];

    const found = mockItinerariosData.find((it) => it.id === id);

    if (!found) return mockResponse({ detail: "No encontrado" }, false, 404);

    const dias = mockDiasData

      .filter((d) => d.itinerario_id === id)

      .map(({ itinerario_id: _iid, ...rest }) => ({

        ...rest,

        eventos: rest.eventos.map((ev) => {

          if (ev.tipo === "actividad_catalogo" && ev.actividad_id) {

            const act = mockActividades.find((a) => a.id === ev.actividad_id);

            return { ...ev, actividad: act ?? null };

          }

          return { ...ev, actividad: null };

        }),

      }));

    return mockResponse({ ...found, dias });

  }



  if (p.match(/^\/itinerarios\/[^/]+$/) && method === "PATCH") {

    const id = p.split("/")[2];

    mockItinerariosData = mockItinerariosData.map((it) =>

      it.id === id ? { ...it, ...body } : it

    );

    const updated = mockItinerariosData.find((it) => it.id === id);

    if (!updated) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(updated);

  }



  if (p.match(/^\/itinerarios\/[^/]+$/) && method === "DELETE") {

    const id = p.split("/")[2];

    const before = mockItinerariosData.length;

    mockItinerariosData = mockItinerariosData.filter((it) => it.id !== id);

    mockDiasData = mockDiasData.filter((d) => d.itinerario_id !== id);

    if (mockItinerariosData.length === before) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse({}, true, 204);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/clonar$/) && method === "POST") {

    const id = p.split("/")[2];

    const original = mockItinerariosData.find((it) => it.id === id);

    if (!original) return mockResponse({ detail: "No encontrado" }, false, 404);

    const clon: MockItinerario = {

      id: "itin-" + Date.now(),

      nombre: `${original.nombre} (copia)`,

      descripcion: original.descripcion,

      version: original.version,

      estado: "activo",

      created_at: new Date().toISOString(),

    };

    mockItinerariosData = [clon, ...mockItinerariosData];

    const diasOriginales = mockDiasData.filter((d) => d.itinerario_id === id);

    diasOriginales.forEach((dia) => {

      mockDiasData.push({

        ...dia,

        id: "d-" + Date.now() + "-" + dia.numero_dia,

        itinerario_id: clon.id,

        eventos: dia.eventos.map((ev) => ({ ...ev, id: "e-" + Date.now() + "-" + ev.orden })),

      });

    });

    return mockResponse({ ...clon, total_dias: diasOriginales.length }, true, 201);

  }



  // ===== /itinerarios/:id/dias =====

  if (p.match(/^\/itinerarios\/[^/]+\/dias$/) && method === "GET") {

    const itin_id = p.split("/")[2];

    const dias = mockDiasData

      .filter((d) => d.itinerario_id === itin_id)

      .map(({ itinerario_id: _iid, ...rest }) => rest);

    return mockResponse(dias);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias$/) && method === "POST") {

    const itin_id = p.split("/")[2];

    const nuevo: MockDia = {

      id: "d-" + Date.now(),

      itinerario_id: itin_id,

      numero_dia: body.numero_dia ?? mockDiasData.filter((d) => d.itinerario_id === itin_id).length + 1,

      titulo: body.titulo ?? "Nuevo día",

      resumen: body.resumen ?? "",

      alojamiento_pernocta: body.alojamiento_pernocta ?? "",

      destino_nombre: body.destino_nombre ?? "",

      eventos: [],

    };

    mockDiasData.push(nuevo);

    const { itinerario_id: _iid, ...respDia } = nuevo;

    return mockResponse(respDia, true, 201);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+$/) && method === "PATCH") {

    const dia_id = p.split("/")[4];

    mockDiasData = mockDiasData.map((d) =>

      d.id === dia_id ? { ...d, ...body } : d

    );

    const updated = mockDiasData.find((d) => d.id === dia_id);

    if (!updated) return mockResponse({ detail: "No encontrado" }, false, 404);

    const { itinerario_id: _iid, ...respDia } = updated;

    return mockResponse(respDia);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+$/) && method === "DELETE") {

    const dia_id = p.split("/")[4];

    const before = mockDiasData.length;

    mockDiasData = mockDiasData.filter((d) => d.id !== dia_id);

    if (mockDiasData.length === before) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse({}, true, 204);

  }



  // ===== /itinerarios/:id/dias/:dia_id/eventos =====

  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+\/eventos$/) && method === "GET") {

    const dia_id = p.split("/")[4];

    const dia = mockDiasData.find((d) => d.id === dia_id);

    if (!dia) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(dia.eventos);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+\/eventos$/) && method === "POST") {

    const dia_id = p.split("/")[4];

    const dia = mockDiasData.find((d) => d.id === dia_id);

    if (!dia) return mockResponse({ detail: "No encontrado" }, false, 404);

    const nuevoEvento: MockEvento = {

      id: "e-" + Date.now(),

      tipo: body.tipo ?? "texto_libre",

      descripcion: body.descripcion ?? "",

      hora_inicio: body.hora_inicio ?? null,

      hora_fin: body.hora_fin ?? null,

      actividad_id: body.actividad_id ?? null,

      orden: body.orden ?? dia.eventos.length,

    };

    dia.eventos.push(nuevoEvento);

    return mockResponse(nuevoEvento, true, 201);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+\/eventos\/[^/]+$/) && method === "PATCH") {

    const [, , , , dia_id, , evento_id] = p.split("/");

    const dia = mockDiasData.find((d) => d.id === dia_id);

    if (!dia) return mockResponse({ detail: "No encontrado" }, false, 404);

    dia.eventos = dia.eventos.map((ev) =>

      ev.id === evento_id ? { ...ev, ...body } : ev

    );

    const updated = dia.eventos.find((ev) => ev.id === evento_id);

    if (!updated) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse(updated);

  }



  if (p.match(/^\/itinerarios\/[^/]+\/dias\/[^/]+\/eventos\/[^/]+$/) && method === "DELETE") {

    const [, , , , dia_id, , evento_id] = p.split("/");

    const dia = mockDiasData.find((d) => d.id === dia_id);

    if (!dia) return mockResponse({ detail: "No encontrado" }, false, 404);

    const before = dia.eventos.length;

    dia.eventos = dia.eventos.filter((ev) => ev.id !== evento_id);

    if (dia.eventos.length === before) return mockResponse({ detail: "No encontrado" }, false, 404);

    return mockResponse({}, true, 204);

  }



  // ===== /actividades (catálogo) =====

  if (p === "/actividades" && method === "GET") {

    return mockResponse({ count: mockActividades.length, results: mockActividades });

  }



  // ===== Endpoint no mockeado =====

  console.warn(`[mockFetch] Endpoint no mockeado: ${method} ${p}`);

  return mockResponse({ error: "Endpoint no implementado en mock" }, false, 404);

}



// ============================================

// FUNCION PRINCIPAL

// ============================================



/**

 * Llama al backend Django (o devuelve mock si USE_MOCK = true).

 *

 * @example

 *   const res = await fetchDjango("/viajeros");

 *   const data = await res.json();

 */

export async function fetchDjango(path: string, init?: RequestInit): Promise<Response> {

  if (USE_MOCK) {

    return mockFetch(path, init);

  }



  const url = `${API_BASE_URL}${path}`;

  

  // Agregar Token JWT (Totem o Supabase)

  const headers = new Headers(init?.headers);

  

  const totemToken = typeof window !== "undefined" ? localStorage.getItem("totem_token") : null;

  if (totemToken) {

    headers.set("Authorization", `Bearer ${totemToken}`);

  } else if (typeof window !== "undefined") {

    const supabase = createSupabaseBrowserClient();

    if (supabase) {

      const now = Math.floor(Date.now() / 1000);
      const cached = (window as any).__supabaseSessionCache as { token: string; expiresAt: number } | undefined;
      let activeToken: string | null = null;
      if (cached && cached.expiresAt - now > 60) {
        activeToken = cached.token;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const expiresAt = session.expires_at ?? 0;
          if (expiresAt - now < 60) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed.session?.access_token) {
              activeToken = refreshed.session.access_token;
              localStorage.setItem("totem_token", activeToken);
              document.cookie = `totem_token=${activeToken}; path=/; max-age=604800; SameSite=Lax`;
              (window as any).__supabaseSessionCache = { token: activeToken, expiresAt: refreshed.session.expires_at ?? now + 3600 };
            }
          } else {
            activeToken = session.access_token;
            (window as any).__supabaseSessionCache = { token: activeToken, expiresAt: expiresAt };
          }
        }
      }
      if (activeToken) {
        headers.set("Authorization", `Bearer ${activeToken}`);
        localStorage.setItem("totem_token", activeToken);
      }
    }
  }

  try {

    return await fetch(url, { ...init, headers });

  } catch (error) {

    console.error(`[fetchDjango] Error fetching ${url}:`, error);

    // Devolvemos una respuesta de error amigable en lugar de lanzar excepcion

    return new Response(JSON.stringify({ error: "No se pudo conectar con el servidor" }), {

      status: 503,

      headers: { "Content-Type": "application/json" },

    });

  }

}
