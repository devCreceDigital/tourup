import { Router } from "express";
import { db } from "@workspace/db";
import { operatorsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { Readable } from "stream";

const router = Router();

// POST /api/ingesta/csv — accepts multipart CSV upload
// Also GET /api/ingesta/stats
router.get("/ingesta/stats", async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE source = 'mincetur') AS total_mincetur,
        COUNT(*) FILTER (WHERE source = 'manual') AS total_manual,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE clase = 'Operador de Turismo') AS operadores,
        COUNT(*) FILTER (WHERE clase = 'Minorista') AS minoristas,
        COUNT(*) FILTER (WHERE clase = 'Mayorista') AS mayoristas,
        COUNT(*) FILTER (WHERE clase = 'Agencia de Viajes') AS agencias,
        COUNT(DISTINCT region) AS regions_covered,
        COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') AS with_website,
        COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') AS with_email,
        COUNT(*) FILTER (WHERE modalidad_autorizada ILIKE '%Digital%') AS digital_mode,
        MAX(created_at) AS last_imported
      FROM operators
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    req.log.error({ err }, "Error fetching ingesta stats");
    res.status(500).json({ error: "Error fetching stats" });
  }
});

// Helper: parse a CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function clean(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "." || val.trim() === "S/N") return null;
  return val.trim();
}

function normalizeWebsite(raw: string | null): string | null {
  if (!raw) return null;
  let url = raw.toLowerCase().trim();
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}

function mapClase(clase: string | null): string {
  if (!clase) return "Operador de Turismo";
  const c = clase.trim();
  if (c === "Operador de Turismo") return "Operador de Turismo";
  if (c === "Minorista") return "Minorista";
  if (c === "Mayorista") return "Mayorista";
  return c;
}

function normalizePhone(phones: string[]): string | null {
  const p = phones.map(s => clean(s)).filter(Boolean);
  return p.length > 0 ? p[0] : null;
}

function normalizeRegion(dep: string | null): string {
  if (!dep) return "Lima";
  const map: Record<string, string> = {
    "AMAZONAS": "Amazonas",
    "ÁNCASH": "Áncash",
    "ANCASH": "Áncash",
    "APURÍMAC": "Apurímac",
    "AREQUIPA": "Arequipa",
    "AYACUCHO": "Ayacucho",
    "CAJAMARCA": "Cajamarca",
    "CALLAO": "Callao",
    "CUSCO": "Cusco",
    "HUANCAVELICA": "Huancavelica",
    "HUÁNUCO": "Huánuco",
    "HUANUCO": "Huánuco",
    "ICA": "Ica",
    "JUNÍN": "Junín",
    "JUNIN": "Junín",
    "LA LIBERTAD": "La Libertad",
    "LAMBAYEQUE": "Lambayeque",
    "LIMA": "Lima",
    "LORETO": "Loreto",
    "MADRE DE DIOS": "Madre de Dios",
    "MOQUEGUA": "Moquegua",
    "PASCO": "Pasco",
    "PIURA": "Piura",
    "PUNO": "Puno",
    "SAN MARTÍN": "San Martín",
    "SAN MARTIN": "San Martín",
    "TACNA": "Tacna",
    "TUMBES": "Tumbes",
    "UCAYALI": "Ucayali",
  };
  const normalized = map[dep.toUpperCase()] ?? dep;
  return normalized;
}

// Compute a basic TTDMI score from available data
function computeBasicScore(row: {
  website: string | null;
  email: string | null;
  phone: string | null;
  modalidad: string | null;
  hasCertificate: boolean;
}): { score: number; level: string } {
  let score = 20; // base score for being registered

  // Formalidad (MINCETUR registered = big trust boost)
  score += 25; // all records are MINCETUR certified

  // Website presence
  if (row.website) score += 15;

  // Email
  if (row.email) score += 8;

  // Phone
  if (row.phone) score += 5;

  // Digital capability
  if (row.modalidad?.includes("Digital")) score += 12;

  // Certificate number
  if (row.hasCertificate) score += 5;

  score = Math.min(75, score); // cap at 75 without social/review data

  let level = "risk";
  if (score >= 90) level = "elite";
  else if (score >= 80) level = "premium";
  else if (score >= 70) level = "advanced";
  else if (score >= 60) level = "growing";
  else if (score >= 40) level = "emerging";

  return { score: Math.round(score * 10) / 10, level };
}

// POST /api/ingesta/csv
router.post("/ingesta/csv", async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => {
      req.on("end", resolve);
      req.on("error", reject);
    });
    const raw = Buffer.concat(chunks).toString("utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV vacío o sin datos" });
    }

    // Detect header line (skip it)
    const dataLines = lines[0].startsWith("FECHA_CORTE") ? lines.slice(1) : lines;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const BATCH = 200;

    for (let i = 0; i < dataLines.length; i += BATCH) {
      const batch = dataLines.slice(i, i + BATCH);
      const values: string[] = [];

      for (const line of batch) {
        if (!line.trim()) continue;
        const f = parseCSVLine(line);
        // Fields: [0]FECHA_CORTE [1]RUC [2]RAZON_SOCIAL [3]NOMBRE_COMERCIAL
        // [12]DEPARTAMENTO [13]PROVINCIA [14]DISTRITO [11]UBIGEO
        // [16]TELEF1 [17]TELEF2 [22]E_MAIL [23]PAGINA_WEB
        // [24]CLASE [27]MODALIDAD_AUTORIZADA [28]REP_LEGAL [29]NRO_CERTIFICADO [30]FECHA_EXPEDICION
        const ruc = clean(f[1]);
        const legalName = clean(f[2]) ?? "–";
        const commercialName = clean(f[3]) ?? legalName;
        const region = normalizeRegion(clean(f[12]));
        const province = clean(f[13]);
        const district = clean(f[14]);
        const ubigeo = clean(f[11]);
        const phone = normalizePhone([f[16], f[17], f[18], f[19]]);
        const email = clean(f[22])?.toLowerCase() ?? null;
        const website = normalizeWebsite(clean(f[23]));
        const clase = mapClase(clean(f[24]));
        const modalidad = clean(f[27]);
        const repLegal = clean(f[28]);
        const nroCert = clean(f[29]);
        const fechaExp = clean(f[30]);
        const fechaCorte = clean(f[0]);

        const { score, level } = computeBasicScore({
          website,
          email,
          phone,
          modalidad,
          hasCertificate: !!nroCert,
        });

        const esc = (v: string | null) =>
          v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`;

        values.push(
          `(${esc(legalName)}, ${esc(commercialName)}, ${esc(ruc)}, ${esc(region)}, ` +
          `${esc(province)}, ${esc(district)}, ${esc(clase)}, NULL, ARRAY['es'], false, ` +
          `${score}, ${esc(level)}, ${esc(website)}, NULL, NULL, ${esc(phone)}, ${esc(email)}, ` +
          `NULL, NOW(), NOW(), ${esc(clase)}, ${esc(modalidad)}, ${esc(repLegal)}, ` +
          `${esc(nroCert)}, ${esc(fechaExp)}, ${esc(ubigeo)}, ${esc(fechaCorte)}, 'mincetur')`
        );
      }

      if (values.length === 0) continue;

      try {
        await db.execute(sql.raw(`
          INSERT INTO operators (
            legal_name, commercial_name, ruc, region, province, district,
            operator_type, niche, languages, verified, ttdmi_score, level,
            website, logo_url, description, phone, email,
            rank_nacional, created_at, updated_at,
            clase, modalidad_autorizada, rep_legal, nro_certificado,
            fecha_expedicion, ubigeo, fecha_corte, source
          ) VALUES ${values.join(",\n")}
          ON CONFLICT (ruc) DO UPDATE SET
            commercial_name = EXCLUDED.commercial_name,
            legal_name = EXCLUDED.legal_name,
            region = EXCLUDED.region,
            province = EXCLUDED.province,
            district = EXCLUDED.district,
            operator_type = EXCLUDED.clase,
            clase = EXCLUDED.clase,
            modalidad_autorizada = EXCLUDED.modalidad_autorizada,
            rep_legal = EXCLUDED.rep_legal,
            nro_certificado = EXCLUDED.nro_certificado,
            fecha_expedicion = EXCLUDED.fecha_expedicion,
            ubigeo = EXCLUDED.ubigeo,
            fecha_corte = EXCLUDED.fecha_corte,
            phone = COALESCE(EXCLUDED.phone, operators.phone),
            email = COALESCE(EXCLUDED.email, operators.email),
            website = COALESCE(EXCLUDED.website, operators.website),
            source = EXCLUDED.source,
            updated_at = NOW()
        `));
        imported += values.length;
      } catch (batchErr) {
        skipped += values.length;
        errors.push(String(batchErr).slice(0, 200));
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      total_lines: dataLines.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    req.log.error({ err }, "Error processing CSV ingestion");
    res.status(500).json({ error: "Error processing CSV", detail: String(err) });
  }
});

export default router;
