/**
 * Datos mock del viaje promocional.
 * Estructura usada por la landing pública (app/page.tsx).
 *
 * Cuando se conecte el backend, reemplazar el export `viaje`
 * por el contrato publico /trips/public/{slug} del gateway.
 */

export interface Actividad {
  hora: string;
  descripcion: string;
}

export interface DiaItinerario {
  dia: string;
  actividades: Actividad[];
}

export interface Beneficio {
  icono: string; // Nombre del icono Lucide (debe coincidir con IconMap en page.tsx)
  titulo: string;
}

export interface Viaje {
  destino: string;
  fechas: string;
  precio: number;
  itinerario: DiaItinerario[];
  incluye: string[];
  noIncluye: string[];
  beneficios: Beneficio[];
}

export const viaje: Viaje = {
  destino: "Paracas, Ica & Huacachina",
  fechas: "Sábado 14 de marzo, 2026",
  precio: 285,

  itinerario: [
    {
      dia: "Día Único — Full Day",
      actividades: [
        {
          hora: "05:30",
          descripcion:
            "Salida desde Lima en bus turístico full equipo. Recojo en puntos acordados con el grupo.",
        },
        {
          hora: "08:30",
          descripcion:
            "Llegada al puerto de Paracas. Embarque en lanchas rápidas para visitar las Islas Ballestas y observar lobos marinos, pingüinos de Humboldt y aves guaneras.",
        },
        {
          hora: "11:00",
          descripcion:
            "Traslado a Playa La Mina dentro de la Reserva Nacional de Paracas. Tiempo libre para nadar y disfrutar del mar.",
        },
        {
          hora: "13:30",
          descripcion:
            "Almuerzo típico en restaurante local con menú a elegir (incluido pescado fresco o pollo).",
        },
        {
          hora: "15:30",
          descripcion:
            "Traslado a Huacachina. Paseo en buggy por las dunas y sandboarding (tabla incluida).",
        },
        {
          hora: "18:00",
          descripcion:
            "Atardecer en el oasis de Huacachina. Foto grupal y tiempo libre.",
        },
        {
          hora: "19:30",
          descripcion: "Retorno a Lima. Llegada estimada a las 23:30.",
        },
      ],
    },
  ],

  incluye: [
    "Transporte ida y vuelta en bus turístico full equipo",
    "Tour en lancha por las Islas Ballestas",
    "Ingreso a la Reserva Nacional de Paracas",
    "Almuerzo en restaurante local (menú a elegir)",
    "Paseo en buggy por las dunas de Huacachina",
    "Tabla de sandboard",
    "Guía profesional bilingüe durante todo el recorrido",
    "Seguro de viaje básico",
    "Botella de agua y snack durante el trayecto",
  ],

  noIncluye: [
    "Bebidas adicionales en el almuerzo",
    "Propinas a guías y conductores (opcional)",
    "Gastos personales y souvenirs",
    "Servicios no especificados en el programa",
  ],

  beneficios: [
    { icono: "Flag", titulo: "Bandera del colegio personalizada" },
    { icono: "Users", titulo: "Polo grupal de recuerdo incluido" },
    { icono: "Video", titulo: "Video profesional del viaje" },
    { icono: "Moon", titulo: "Después-fiesta privada en discoteca" },
    { icono: "Gift", titulo: "Sorteo de premios entre asistentes" },
    { icono: "Cake", titulo: "Torta de despedida para el grupo" },
  ],
};