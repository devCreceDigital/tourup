import type { ExtractedProgram } from "./types";
import { detectFileFormat } from "./types";

// Mock parser: simulates AI extraction with realistic programs.
// Production would use pdfjs-dist, xlsx, mammoth, gray-matter, etc.
export async function parseDocument(file: File): Promise<ExtractedProgram[]> {
  await new Promise(r => setTimeout(r, 3000));

  const format = detectFileFormat(file);

  return [
    {
      id: `prog_${Date.now()}_1`,
      title: "Tour Clásico a Machu Picchu",
      description:
        "Paquete integral de 4 días y 3 noches. Incluye billetes de tren Vistadome, acceso al santuario histórico, guía privado bilingüe y traslados internos desde Cusco.",
      destination: "Cusco, Perú",
      dateStart: "2025-10-15",
      dateEnd: "2025-10-18",
      durationDays: 4,
      travelerTypes: ["Parejas", "Familias"],
      maxCapacity: 12,
      priceFrom: 1500,
      priceTo: 2000,
      currency: "USD",
      activities: ["Senderismo", "Fotografía", "Cultura", "Templos"],
      includes: ["Transporte", "Alojamiento", "Guía turístico", "Entradas"],
      type: "Cultural y patrimonio",
      confidence: 81,
      warnings: [],
      source: format,
    },
    {
      id: `prog_${Date.now()}_2`,
      title: "Excursión Valle Sagrado de los Incas",
      description:
        "Recorrido de día completo visitando los mercados de Pisac, las ruinas de Ollantaytambo y los telares de Chinchero. Almuerzo buffet incluido en Urubamba.",
      destination: "Valle Sagrado, Cusco",
      dateStart: "",
      dateEnd: "",
      durationDays: 1,
      travelerTypes: ["Grupos de amigos", "Familias"],
      maxCapacity: 20,
      priceFrom: 120,
      priceTo: 0,
      currency: "USD",
      activities: ["Cultura", "Museos", "Gastronomía"],
      includes: ["Transporte", "Alimentos", "Guía turístico"],
      type: "Cultural y patrimonio",
      confidence: 78,
      warnings: [],
      source: format,
    },
    {
      id: `prog_${Date.now()}_3`,
      title: "Traslado Aeropuerto - Hotel Cusco",
      description:
        "Servicio de transporte privado en Van ejecutiva desde el Aeropuerto Internacional Alejandro Velasco Astete hacia tu hotel en el centro histórico de Cusco.",
      destination: "Cusco, Perú",
      dateStart: "",
      dateEnd: "",
      durationDays: 0,
      travelerTypes: [],
      maxCapacity: 0,
      priceFrom: 50,
      priceTo: 0,
      currency: "USD",
      activities: [],
      includes: ["Transporte"],
      type: "Otro",
      confidence: 62,
      warnings: ["Faltan campos importantes: horario, capacidad"],
      source: format,
    },
  ];
}
