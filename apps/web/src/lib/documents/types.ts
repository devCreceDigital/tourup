export interface ExtractedProgram {
  id: string;
  title: string;
  description: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  durationDays: number;
  travelerTypes: string[];
  maxCapacity: number;
  priceFrom: number;
  priceTo: number;
  currency: string;
  activities: string[];
  includes: string[];
  type: string;
  confidence: number;
  warnings: string[];
  source?: string;
}

export const SUPPORTED_EXTENSIONS = [
  ".pdf", ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt",
  ".json", ".csv", ".enex", ".md", ".html", ".htm", ".zip",
];

export const FORMATS_GRID = {
  documents: [
    "PDF", "Excel (.xlsx, .xls)", "Word (.docx, .doc)",
    "PowerPoint (.pptx, .ppt)", "CSV / JSON",
  ],
  notes: [
    "Notion (JSON export)", "Obsidian (.md + YAML)", "Evernote (.enex)",
    "OneNote (HTML export)", "Google Keep", "Apple Notes (HTML)",
    "Markdown (.md)", "HTML (.html)",
  ],
};

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

export function validateFileSize(file: File): string | null {
  const MAX = 10 * 1024 * 1024;
  if (file.size > MAX) return `El archivo es demasiado grande (máx. 10 MB). Este pesa ${(file.size / 1024 / 1024).toFixed(1)} MB.`;
  if (file.size === 0) return "El archivo está vacío.";
  return null;
}

export function isValidExtension(file: File): boolean {
  const name = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => name.endsWith(ext));
}
