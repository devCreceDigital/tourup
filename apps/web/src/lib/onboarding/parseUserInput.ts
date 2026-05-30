export type ParsedTripData = {
  destinationMain?: string;
  durationDays?: number;
  travelerTypes?: string[];
  maxCapacity?: number;
  activities?: string[];
  priceFrom?: number;
  currency?: string;
  startDate?: string;
};

const TRAVELER_PATTERNS: [RegExp, string][] = [
  [/(pareja|parejas)/i,             "Parejas"],
  [/(familia|familias)/i,           "Familias"],
  [/(amigos|grupo|grupos)/i,        "Grupos de amigos"],
  [/(solo|mochilero|individual)/i,  "Solo viajeros"],
  [/(ejecutivo|negocios|corporat)/i,"Ejecutivos"],
  [/(adultos mayores|personas mayores|tercera edad)/i, "Personas mayores"],
  [/(niños|familia con niños)/i,    "Familias con niños"],
];

const ACTIVITY_PATTERNS: [RegExp, string][] = [
  [/senderi|hiking|trekking|camina/i, "Senderismo"],
  [/buceo|snorkel|diving/i,           "Buceo"],
  [/gastronom|comida|culinari|restaur/i, "Gastronomía"],
  [/museo|galería|arte/i,             "Museos"],
  [/playa|costa|mar/i,                "Playas"],
  [/montaña|cerro|pico/i,             "Montañas"],
  [/ciudad|centro histórico|urbano/i, "Ciudades"],
  [/templo|santuario|iglesia|catedral/i, "Templos"],
  [/fotograf/i,                       "Fotografía"],
  [/meditac|yoga|wellness|bienestar/i,"Meditación"],
  [/safari|fauna|wildlife/i,          "Safari"],
  [/esquí|ski|nieve/i,                "Ski"],
];

const MONTH_MAP: Record<string, number> = {
  enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5,
  julio:6, agosto:7, septiembre:8, octubre:9, noviembre:10, diciembre:11,
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function parseUserInput(input: string): ParsedTripData {
  const result: ParsedTripData = {};

  // Destination
  const destMatch = input.match(/(?:a|en|hacia|viaje a|viajar a|tour a|tour en)\s+([A-Za-záéíóúüñÁÉÍÓÚÜÑ\s]+?)(?=\s+(?:en|durante|por|para|con|\d|,|$|\.|\?|!|oct|nov|dic|ene|feb|mar|abr|may|jun|jul|ago|sep))/i);
  if (destMatch?.[1]) {
    result.destinationMain = capitalize(destMatch[1].trim());
  }

  // Duration
  const durMatch = input.match(/(\d+)\s*(días?|semanas?|meses?|noches?)/i);
  if (durMatch) {
    const num = parseInt(durMatch[1]);
    const unit = durMatch[2].toLowerCase();
    if (unit.startsWith("semana")) result.durationDays = num * 7;
    else if (unit.startsWith("mes")) result.durationDays = num * 30;
    else result.durationDays = num;
  }

  // Traveler types
  const types: string[] = [];
  for (const [pattern, label] of TRAVELER_PATTERNS) {
    if (pattern.test(input) && !types.includes(label)) types.push(label);
  }
  if (types.length > 0) result.travelerTypes = types;

  // Capacity
  const capMatch = input.match(/(?:para|con|somos|grupo de|grupos? de)\s+(\d+)/i);
  if (capMatch) {
    result.maxCapacity = parseInt(capMatch[1]);
  } else if (result.travelerTypes?.includes("Parejas") && !result.maxCapacity) {
    result.maxCapacity = 2;
  }

  // Activities
  const acts: string[] = [];
  for (const [pattern, label] of ACTIVITY_PATTERNS) {
    if (pattern.test(input) && !acts.includes(label)) acts.push(label);
  }
  if (acts.length > 0) result.activities = acts;

  // Price
  const priceMatch = input.match(/\$\s*(\d[\d,.]*)|(\d[\d,.]*)\s*(?:dólares?|USD|EUR)/i);
  if (priceMatch) {
    const raw = (priceMatch[1] ?? priceMatch[2]).replace(/[,.]/g, "");
    result.priceFrom = parseInt(raw);
    result.currency = /EUR/i.test(input) ? "EUR" : "USD";
  }

  // Month/date
  const lower = input.toLowerCase();
  for (const [month, idx] of Object.entries(MONTH_MAP)) {
    if (lower.includes(month)) {
      const now = new Date();
      const year = idx <= now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
      result.startDate = new Date(year, idx, 1).toISOString().split("T")[0] ?? "";
      break;
    }
  }

  return result;
}
