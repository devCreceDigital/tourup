export interface Inscrito {
  id: string;
  nombre: string;
  grupo: string;
  pago: "pendiente" | "parcial" | "completo";
  documentos: "completo" | "incompleto" | "faltante" | "pendiente";
  email: string;
  telefono: string;
  fecha_inscripcion: string;
  tipo_habitacion?: string;
  restricciones_alimentarias?: string;
}

export interface InscripcionAPI {
  id: string;
  viajero: string;
  viajero_nombre: string;
  viajero_email: string;
  viaje: string;
  viaje_nombre: string;
  estado: string;
  pago_estado: "pendiente" | "parcial" | "completo";
  docs_estado: string;
  documentos_estado: string;
  tipo_habitacion: string | null;
  created_at: string;
}

export const mockInscritos: Inscrito[] = [
  {
    id: "1",
    nombre: "Ana García",
    grupo: "5to A",
    pago: "completo",
    documentos: "completo",
    email: "ana.garcia@email.com",
    telefono: "+51 987 654 321",
    fecha_inscripcion: "2026-01-15T10:00:00Z",
    tipo_habitacion: "Doble",
    restricciones_alimentarias: "Ninguna",
  },
  {
    id: "2",
    nombre: "Carlos López",
    grupo: "5to B",
    pago: "parcial",
    documentos: "incompleto",
    email: "carlos.lopez@email.com",
    telefono: "+51 987 654 322",
    fecha_inscripcion: "2026-01-16T11:30:00Z",
    tipo_habitacion: "Triple",
    restricciones_alimentarias: "Vegetariano",
  },
  {
    id: "3",
    nombre: "María Rodríguez",
    grupo: "5to A",
    pago: "pendiente",
    documentos: "faltante",
    email: "maria.r@email.com",
    telefono: "+51 987 654 323",
    fecha_inscripcion: "2026-01-17T09:15:00Z",
    tipo_habitacion: "Doble",
  },
  {
    id: "4",
    nombre: "Juan Pérez",
    grupo: "5to C",
    pago: "completo",
    documentos: "pendiente",
    email: "juan.perez@email.com",
    telefono: "+51 987 654 324",
    fecha_inscripcion: "2026-01-18T14:20:00Z",
    tipo_habitacion: "Cuádruple",
    restricciones_alimentarias: "Alergia al maní",
  },
];
