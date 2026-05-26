import type { AssistantIntent, ChatSession } from "../domain/chat-session.js";

export type TravelToolName =
  | "buscar_lugares"
  | "buscar_restaurantes"
  | "calcular_ruta"
  | "buscar_vuelos"
  | "calculate_budget"
  | "generate_itinerary";

export type TravelToolResult = {
  readonly tool_name: TravelToolName;
  readonly result: Record<string, unknown>;
};

type TravelToolInput = {
  readonly content: string;
  readonly session: ChatSession;
  readonly intent: AssistantIntent;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function destinationFrom(input: TravelToolInput): string {
  return text(input.intent.entities.destination) ?? text(input.session.intentData.destination) ?? "Peru";
}

function daysFrom(input: TravelToolInput): number {
  return Math.min(30, positiveInteger(input.intent.entities.days, positiveInteger(input.session.intentData.days, 4)));
}

function travelersFrom(input: TravelToolInput): number {
  return Math.min(80, positiveInteger(input.intent.entities.travelers, positiveInteger(input.session.intentData.travelers, 2)));
}

function currencyFrom(input: TravelToolInput): "USD" | "PEN" {
  return input.content.toLowerCase().includes("sol") || input.content.toLowerCase().includes("pen") ? "PEN" : "USD";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
}

function mapsKey(): string | null {
  const value = process.env.GOOGLE_MAPS_API_KEY;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function googlePlaces(query: string, type: "tourist_attraction" | "restaurant"): Promise<readonly Record<string, unknown>[] | null> {
  const key = mapsKey();
  if (key === null) {
    if (isProduction()) throw new Error("GOOGLE_MAPS_API_KEY is required for assistant places tools in production.");
    return null;
  }
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": key,
      "x-goog-fieldmask": "places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types"
    },
    body: JSON.stringify({ textQuery: query, includedType: type, languageCode: "es", maxResultCount: 6 })
  });
  if (!response.ok) throw new Error(`Google Places failed (${response.status}).`);
  const payload = await response.json() as { places?: readonly Record<string, unknown>[] };
  return payload.places ?? [];
}

async function googleRoute(destination: string): Promise<Record<string, unknown> | null> {
  const key = mapsKey();
  if (key === null) {
    if (isProduction()) throw new Error("GOOGLE_MAPS_API_KEY is required for assistant route tools in production.");
    return null;
  }
  return {
    destination,
    source: "google_maps_configured",
    note: "Route planning requires origin and waypoints for exact distance/time. Ask the user for origin or use agency default pickup point."
  };
}

function dailyBudget(destination: string, currency: "USD" | "PEN"): number {
  const normalized = destination.toLowerCase();
  const usd =
    normalized.includes("machu") || normalized.includes("cusco") ? 125 :
    normalized.includes("lima") ? 105 :
    normalized.includes("ica") || normalized.includes("paracas") ? 95 :
    normalized.includes("iquitos") || normalized.includes("tarapoto") ? 115 :
    90;
  return currency === "PEN" ? Math.round(usd * 3.75) : usd;
}

function shouldRun(content: string, names: readonly TravelToolName[]): boolean {
  const lower = content.toLowerCase();
  return names.some((name) => lower.includes(name)) ||
    names.some((name) => {
      if (name === "buscar_lugares") return /lugar|atracci[oó]n|visitar|actividad|experiencia/.test(lower);
      if (name === "buscar_restaurantes") return /restaurante|comer|comida|gastronom/.test(lower);
      if (name === "calcular_ruta") return /ruta|traslado|distancia|mover|transporte/.test(lower);
      if (name === "buscar_vuelos") return /vuelo|aerol[ií]nea|airport|aeropuerto/.test(lower);
      if (name === "calculate_budget") return /presupuesto|budget|precio|costo|coste|usd|\$|soles|pen/.test(lower);
      return /itinerario|plan|viaje|d[ií]as|agenda/.test(lower);
    });
}

async function places(destination: string): Promise<Record<string, unknown>> {
  const live = await googlePlaces(`atracciones turísticas en ${destination}`, "tourist_attraction");
  if (live !== null) {
    return { destination, source: "google_places", items: live };
  }
  const normalized = destination.toLowerCase();
  const items =
    normalized.includes("cusco") || normalized.includes("machu")
      ? [
          { name: "Centro historico de Cusco", type: "cultural", recommended_time: "medio dia" },
          { name: "Valle Sagrado", type: "naturaleza/cultura", recommended_time: "1 dia" },
          { name: "Machu Picchu", type: "arqueologia", recommended_time: "1 dia" }
        ]
      : normalized.includes("lima")
        ? [
            { name: "Centro historico de Lima", type: "cultural", recommended_time: "medio dia" },
            { name: "Miraflores y malecon", type: "urbano", recommended_time: "medio dia" },
            { name: "Barranco", type: "arte/gastronomia", recommended_time: "tarde-noche" }
          ]
        : [
            { name: `Centro de ${destination}`, type: "orientacion", recommended_time: "medio dia" },
            { name: `Experiencia local en ${destination}`, type: "cultura", recommended_time: "medio dia" },
            { name: `Ruta panoramica de ${destination}`, type: "naturaleza", recommended_time: "1 dia" }
          ];
  return { destination, source: "development_fallback_estimate", items };
}

async function restaurants(destination: string): Promise<Record<string, unknown>> {
  const live = await googlePlaces(`restaurantes recomendados en ${destination}`, "restaurant");
  if (live !== null) {
    return { destination, source: "google_places", items: live };
  }
  return {
    destination,
    source: "development_fallback_estimate",
    items: [
      { name: `Cocina regional en ${destination}`, style: "local", budget_level: "medio" },
      { name: `Menu turistico curado - ${destination}`, style: "grupo", budget_level: "medio/bajo" },
      { name: `Cena experiencia ${destination}`, style: "premium", budget_level: "alto" }
    ]
  };
}

async function route(destination: string, days: number): Promise<Record<string, unknown>> {
  const live = await googleRoute(destination);
  if (live !== null) return live;
  return {
    destination,
    source: "development_fallback_estimate",
    route: [
      { day: 1, segment: `Llegada y aclimatacion en ${destination}`, transport: "privado o taxi oficial" },
      { day: Math.max(2, Math.ceil(days / 2)), segment: "Excursion principal", transport: "bus turistico/van" },
      { day: days, segment: "Retorno y buffer operativo", transport: "traslado programado" }
    ],
    risk_notes: ["Confirmar horarios reales con proveedor antes de vender.", "Mantener buffer por trafico, clima o altura."]
  };
}

async function flights(destination: string, travelers: number): Promise<Record<string, unknown>> {
  const providerUrl = process.env.FLIGHTS_PROVIDER_URL;
  if (typeof providerUrl === "string" && providerUrl.trim().length > 0) {
    const response = await fetch(providerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination, travelers })
    });
    if (!response.ok) throw new Error(`Flights provider failed (${response.status}).`);
    return { destination, travelers, source: "flights_provider", payload: await response.json() };
  }
  if (isProduction()) throw new Error("FLIGHTS_PROVIDER_URL is required for assistant flight search in production.");
  return {
    destination,
    travelers,
    source: "development_fallback_estimate",
    options: [
      { cabin: "economy", stops: "direct_or_1_stop", price_band: "low-mid", booking_window: "21-45 dias" },
      { cabin: "economy", stops: "flexible", price_band: "mid", booking_window: "7-21 dias" }
    ],
    warning: "No es disponibilidad live; validar con GDS/proveedor antes de confirmar."
  };
}

function budget(input: TravelToolInput): Record<string, unknown> {
  const destination = destinationFrom(input);
  const days = daysFrom(input);
  const travelers = travelersFrom(input);
  const currency = currencyFrom(input);
  const perPersonDaily = dailyBudget(destination, currency);
  const subtotal = perPersonDaily * days * travelers;
  const contingency = Math.round(subtotal * 0.12);
  return {
    destination,
    days,
    travelers,
    currency,
    source: "computed_from_tool_context",
    per_person_daily: perPersonDaily,
    subtotal,
    contingency,
    total: subtotal + contingency,
    includes: ["alojamiento base", "alimentacion diaria", "actividades principales", "traslados locales"],
    excludes: ["vuelos internacionales", "seguros", "gastos personales"]
  };
}

function itinerary(input: TravelToolInput): Record<string, unknown> {
  const destination = destinationFrom(input);
  const days = daysFrom(input);
  const items = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return {
      day,
      title: day === 1 ? `Llegada a ${destination}` : day === days ? "Cierre y retorno" : `Exploracion dia ${day}`,
      morning: day === 1 ? "Recepcion, check-in y orientacion" : "Actividad principal",
      afternoon: day === days ? "Traslado de salida" : "Experiencia local o visita guiada",
      evening: "Cena libre o recomendada",
      operations_note: day === 1 ? "Validar hora de llegada y restricciones de altura." : "Confirmar cupos y tiempos reales con operador."
    };
  });
  return { destination, days, source: "computed_from_tool_context", itinerary: items };
}

export async function runTravelTools(input: TravelToolInput): Promise<readonly TravelToolResult[]> {
  if (input.intent.category !== "trip_planning" && input.intent.category !== "booking") return [];
  const requested: TravelToolName[] = [];
  const candidates: readonly TravelToolName[] = [
    "buscar_lugares",
    "buscar_restaurantes",
    "calcular_ruta",
    "buscar_vuelos",
    "calculate_budget",
    "generate_itinerary"
  ];
  for (const candidate of candidates) {
    if (shouldRun(input.content, [candidate])) requested.push(candidate);
  }
  if (requested.length === 0 && input.intent.category === "trip_planning") {
    requested.push("generate_itinerary", "calculate_budget", "buscar_lugares");
  }
  const destination = destinationFrom(input);
  const days = daysFrom(input);
  const travelers = travelersFrom(input);
  const results: TravelToolResult[] = [];
  for (const toolName of requested.slice(0, 6)) {
    if (toolName === "buscar_lugares") results.push({ tool_name: toolName, result: await places(destination) });
    else if (toolName === "buscar_restaurantes") results.push({ tool_name: toolName, result: await restaurants(destination) });
    else if (toolName === "calcular_ruta") results.push({ tool_name: toolName, result: await route(destination, days) });
    else if (toolName === "buscar_vuelos") results.push({ tool_name: toolName, result: await flights(destination, travelers) });
    else if (toolName === "calculate_budget") results.push({ tool_name: toolName, result: budget(input) });
    else results.push({ tool_name: toolName, result: itinerary(input) });
  }
  return results;
}
