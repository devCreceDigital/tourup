import type { TripPlan } from "../../domain/chat-session.js";

/** PDF mínimo válido (texto) para descarga de itinerario compartido. */
export function generateTripPlanPdf(plan: TripPlan): Buffer {
  const lines = [
    `Viaje: ${plan.title || plan.destination}`,
    `Destino: ${plan.destination}`,
    `Días: ${plan.days}`,
    `Viajeros: ${plan.travelers}`,
    "",
    "Itinerario:",
    ...plan.itinerary.map((day, index) => {
      if (typeof day === "object" && day !== null) {
        const entry = day as Record<string, unknown>;
        return `Día ${entry.dia ?? index + 1}: ${entry.actividad ?? entry.destino ?? JSON.stringify(entry)}`;
      }
      return `Día ${index + 1}: ${String(day)}`;
    })
  ];
  const text = lines.join("\n");
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = `BT /F1 12 Tf 50 750 Td (${escaped}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${content.length} >>stream
${content}
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000270 00000 n 
0000000368 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
456
%%EOF`;
  return Buffer.from(pdf, "utf-8");
}
