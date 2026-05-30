export interface ExtractedProgram {
  id: string;
  title: string;
  description: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  durationDays: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  activities: string[];
  includes: string[];
  confidence: number;
  type: string;
  warnings: string[];
}

// Formats we show as supported in the UI
export const SUPPORTED_EXTENSIONS = [
  ".pdf",".xlsx",".xls",".docx",".doc",".pptx",".ppt",
  ".json",".csv",".enex",".md",".html",".htm",".zip",
];

export function detectFileFormat(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "PDF Document";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "Excel Spreadsheet";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "Word Document";
  if (name.endsWith(".pptx") || name.endsWith(".ppt")) return "PowerPoint";
  if (name.endsWith(".json")) return "JSON / Notion Export";
  if (name.endsWith(".enex")) return "Evernote Notebook";
  if (name.endsWith(".md")) return "Obsidian / Markdown";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "HTML / OneNote Export";
  if (name.endsWith(".zip")) return "Compressed Archive";
  if (name.endsWith(".csv")) return "CSV Spreadsheet";
  return "Documento";
}

// Mock parser: simulates NLP extraction and returns realistic programs.
// In production, this would use pdfjs-dist, xlsx, mammoth, etc.
export async function parseDocument(file: File): Promise<ExtractedProgram[]> {
  // Simulate processing time (2–3 seconds)
  await new Promise(r => setTimeout(r, 2500));

  return [
    {
      id: "prog_1",
      title: "Tour Clásico a Machu Picchu",
      description: "Paquete integral de 4 días y 3 noches. Incluye billetes de tren Vistadome, acceso al santuario histórico, guía privado bilingüe y traslados internos desde Cusco.",
      destination: "Cusco, Perú",
      dateStart: "2025-10-15",
      dateEnd: "2025-10-18",
      durationDays: 4,
      priceFrom: 1500,
      priceTo: 2000,
      currency: "USD",
      activities: ["Senderismo", "Fotografía", "Cultura", "Templos"],
      includes: ["Transporte", "Alojamiento", "Guía turístico", "Entradas"],
      confidence: 81,
      type: "Cultural y patrimonio",
      warnings: [],
    },
    {
      id: "prog_2",
      title: "Excursión Valle Sagrado de los Incas",
      description: "Recorrido de día completo visitando los mercados de Pisac, las ruinas de Ollantaytambo y los telares de Chinchero. Almuerzo buffet incluido en Urubamba.",
      destination: "Valle Sagrado, Cusco",
      dateStart: "",
      dateEnd: "",
      durationDays: 1,
      priceFrom: 120,
      priceTo: 0,
      currency: "USD",
      activities: ["Cultura", "Museos", "Gastronomía"],
      includes: ["Transporte", "Alimentos", "Guía turístico"],
      confidence: 78,
      type: "Cultural y patrimonio",
      warnings: [],
    },
    {
      id: "prog_3",
      title: "Traslado Aeropuerto - Hotel Cusco",
      description: "Servicio de transporte privado en Van ejecutiva desde el Aeropuerto Internacional Alejandro Velasco Astete hacia tu hotel en el centro histórico de Cusco.",
      destination: "Cusco, Perú",
      dateStart: "",
      dateEnd: "",
      durationDays: 0,
      priceFrom: 50,
      priceTo: 0,
      currency: "USD",
      activities: [],
      includes: ["Transporte"],
      confidence: 62,
      type: "Otro",
      warnings: ["Faltan campos importantes: horario, capacidad"],
    },
  ];
}
