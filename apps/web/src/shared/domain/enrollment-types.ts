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
