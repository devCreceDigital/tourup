/**
 * Tipos compartidos del proyecto Totem HUB (multi-tenant SaaS).
 */

// ── ROLES ────────────────────────────────────────────────────────────────────
export type AppRole = "superadmin" | "admin" | "viajero";

// ── ESTADOS ──────────────────────────────────────────────────────────────────
export type EstadoPago = "pendiente" | "parcial" | "completo";
export type EstadoDocumentos = "completo" | "incompleto" | "faltante" | "pendiente";
export type EstadoDocumentoItem =
  | "pendiente"
  | "subido"
  | "en_revision"
  | "aprobado"
  | "rechazado";
export type EstadoViaje =
  | "borrador"
  | "confirmado"
  | "publicado"
  | "en_operacion"
  | "cerrado"
  | "cancelado";
export type EstadoReserva =
  | "cotizacion"
  | "confirmado"
  | "pagado"
  | "finalizado"
  | "cancelada";
export type EstadoInscripcion =
  | "pre_inscrito"
  | "pendiente_pago"
  | "confirmado"
  | "cancelado";
export type EstadoCuota = "pendiente" | "pagada" | "vencida";
export type EstadoTenant = "activo" | "inactivo" | "suspendido" | "trial";

// ── PLAN (suscripción) ────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_mensual: number;
  precio_anual?: number;
  max_viajes?: number;
  max_viajeros?: number;
  features?: Record<string, unknown>;
  activo: boolean;
}

// ── TENANT ────────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  nombre: string;
  dominio?: string;
  zona_horaria: string;
  plan_id: string;
  estado: EstadoTenant;
  logo_url?: string;
  configuracion?: Record<string, unknown>;
  created_at?: string;
}

// ── PERFIL ────────────────────────────────────────────────────────────────────
export interface Perfil {
  id: string;
  tenant_id?: string;
  email: string;
  nombre: string;
  rol: AppRole;
  avatar_url?: string;
  telefono?: string;
  created_at?: string;
}

// ── VIAJE ─────────────────────────────────────────────────────────────────────
export interface Viaje {
  id: string;
  tenant_id?: string;
  nombre: string;
  estado: EstadoViaje | string;
  fecha_inicio: string | null;
  fecha_fin?: string | null;
  cupos: number;
  responsable: string;
  slug?: string;
  codigo?: string;
  itinerario_id?: string;
  configuracion?: Record<string, unknown>;
  created_at?: string;
}

// ── INSCRIPCIÓN ───────────────────────────────────────────────────────────────
export interface Inscripcion {
  id: string;
  tenant_id?: string;
  viaje_id: string;
  perfil_id: string;
  estado: EstadoInscripcion;
  nombre_viajero?: string;
  email_viajero?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  documento_identidad?: string;
  datos_salud?: Record<string, unknown>;
  habitacion_id?: string;
  created_at?: string;
}

// ── CUOTA ─────────────────────────────────────────────────────────────────────
export interface Cuota {
  id: string;
  inscripcion_id: string;
  numero: number;
  monto: number;
  fecha_vencimiento: string;
  estado: EstadoCuota;
  fecha_pago?: string;
}

// ── PAGO ──────────────────────────────────────────────────────────────────────
export interface Pago {
  id: string;
  inscripcion_id: string;
  cuota_id?: string;
  monto: number;
  metodo: "efectivo" | "transferencia" | "mercadopago" | "tarjeta" | "otro";
  estado: "pendiente" | "acreditado" | "rechazado" | "reembolsado";
  referencia?: string;
  comprobante_url?: string;
  notas?: string;
  created_at?: string;
}

// ── DOCUMENTO ─────────────────────────────────────────────────────────────────
export interface Documento {
  id: string;
  inscripcion_id: string;
  tipo: string;
  nombre: string;
  estado: EstadoDocumentoItem;
  archivo_url?: string;
  motivo_rechazo?: string;
  fecha_subida?: string;
  revisado_por?: string;
  fecha_revision?: string;
}

// ── HABITACIÓN ────────────────────────────────────────────────────────────────
export interface Habitacion {
  id: string;
  viaje_id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  precio_extra?: number;
}

// ── CATÁLOGO ──────────────────────────────────────────────────────────────────
export type CategoriaActividad = "cultural" | "deportiva" | "gastronomica" | "naturaleza" | "otro";
export type TipoAlojamiento = "hotel" | "hostal" | "albergue" | "otro";

export interface Destino {
  id: string;
  nombre: string;
  pais: string;
  descripcion?: string;
  latitud?: number;
  longitud?: number;
  imagenes?: string[];
}

export interface Actividad {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaActividad;
  duracion_horas?: number;
  localizacion?: string;
  proveedor?: string;
  imagenes?: string[];
  destino_id?: string;
  destino_nombre?: string;
}

export interface Alojamiento {
  id: string;
  nombre: string;
  tipo: TipoAlojamiento;
  categoria_estrellas?: number;
  direccion?: string;
  destino_id?: string;
  destino_nombre?: string;
}

// ── ITINERARIO ────────────────────────────────────────────────────────────────
export type TipoEvento = "texto_libre" | "actividad_catalogo";
export type EstadoItinerario = "activo" | "inactivo" | "archivado";

export interface EventoItinerario {
  id: string;
  tipo: TipoEvento;
  descripcion: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  actividad_id?: string | null;
  actividad?: Actividad | null;
  orden: number;
}

export interface DiaItinerario {
  id: string;
  numero_dia: number;
  titulo: string;
  resumen?: string;
  alojamiento_pernocta?: string;
  destino_nombre?: string;
  eventos: EventoItinerario[];
}

export interface Itinerario {
  id: string;
  nombre: string;
  descripcion?: string;
  version: number;
  estado: EstadoItinerario | string;
  total_dias?: number;
  dias?: DiaItinerario[];
  created_at?: string;
}

// ── RESERVA ───────────────────────────────────────────────────────────────────
export interface Reserva {
  id: string;
  codigo: string;
  cliente: string;
  viaje_id: string | null;
  pax: number;
  monto: number;
  estado: EstadoReserva | string;
  created_at?: string;
}

// ── ALUMNO / VIAJERO (listado) ────────────────────────────────────────────────
export interface Alumno {
  id: string;
  nombre: string;
  grupo: string;
  pago: EstadoPago;
  documentos: EstadoDocumentos;
  email?: string;
  telefono?: string;
  documento_identidad?: string;
  fecha_nacimiento?: string;
}

export interface DocumentoViajero {
  id?: string;
  nombre: string;
  estado: EstadoDocumentoItem;
  archivo_url?: string;
  motivo_rechazo?: string;
  fecha_subida?: string;
}

// ── WALLET ────────────────────────────────────────────────────────────────────
export interface WalletMovimiento {
  id: string;
  perfil_id: string;
  tipo: "credito" | "debito";
  monto: number;
  concepto: string;
  created_at?: string;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  viajes_activos: number;
  inscritos_total: number;
  pagos_pendientes: number;
  documentos_faltantes: number;
  recaudado: number;
  recaudado_esperado: number;
  pct_docs_completos: number;
  pct_pagos_al_corriente: number;
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
export type CampoOrden = "nombre" | "grupo" | "pago" | "documentos";
export type DireccionOrden = "asc" | "desc";

// ── ASISTENTE IA ──────────────────────────────────────────────────────────────

export type LeadStatus = "new" | "contacted" | "converted" | "closed";

export interface MatchResult {
  trip_id: string;
  company_id?: string;
  itinerary_id: string;
  agency_name: string;
  agency_rating: number | null;
  trip_name: string;
  duration_days: number;
  next_departure: string | null;
  currency: string;
  available_seats: number;
  price_from: number;
  match_score: number;
  semantic_score: number;
  highlights: string[];
}

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type: "attraction" | "hotel" | "restaurant" | "route";
}

export type PipelineStepStatus = "pending" | "running" | "done";

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  type: "agent" | "tool";
  summary?: string;
}

// ── Tool result shapes ────────────────────────────────────────────────────────

export interface ItineraryDay {
  dia: number;
  actividad: string;
  destino: string;
}

export interface BudgetResult {
  travelers: number;
  days: number;
  category: string;
  breakdown: {
    hospedaje: number;
    alimentacion: number;
    transporte: number;
    extras: number;
  };
  total_soles: number;
  per_person: number;
}

export interface WeatherResult {
  temperature: string;
  condition: string;
  best_time: string;
}

export interface HotelItem {
  nombre: string;
  rating: number;
  precio_nivel: string;
  lat?: number;
  lng?: number;
  foto_url?: string;
  place_id?: string;
}

export interface HotelsResult {
  hoteles: HotelItem[];
  total: number;
  destino: string;
}

export interface ToolResultItem {
  tool_name: string;
  result: ItineraryDay[] | BudgetResult | WeatherResult | HotelsResult | Record<string, unknown>;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  matches?: MatchResult[];
  clarification?: string;
  isStreaming?: boolean;
  pipelineSteps?: PipelineStep[];
  toolResults?: ToolResultItem[];
  ts?: string;
};

export interface LeadFormData {
  traveler_name: string;
  traveler_email: string;
  traveler_msg?: string;
}

export interface LeadRecord {
  id: string;
  traveler_name: string;
  traveler_email: string;
  traveler_msg: string | null;
  intent_data: {
    destination: string | null;
    duration: string | null;
    group_type: string | null;
    group_size: number | null;
    budget_range: string | null;
    interests: string[];
    departure_month: string | null;
  };
  trip_name: string;
  match_score: number;
  status: LeadStatus;
  created_at: string;
}
