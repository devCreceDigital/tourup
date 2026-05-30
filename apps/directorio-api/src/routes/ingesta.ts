import { Router } from "express";
import { db } from "@workspace/db";
import {
  operatorsTable, trustScoresTable, socialProfilesTable,
  reviewsTable, bookingCapabilitiesTable, certificationsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { LEVEL_THRESHOLDS } from "../lib/levels.js";
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
  fechaExpedicion: string | null;
}): { score: number; level: string } {
  let score = 45; // base: registered in MINCETUR

  if (row.website) score += 15;
  if (row.email) score += 8;
  if (row.phone) score += 5;
  if (row.hasCertificate) score += 5;

  // Professional email (not gmail/hotmail/yahoo/outlook)
  if (row.email) {
    const e = row.email.toLowerCase();
    if (!e.includes("gmail") && !e.includes("hotmail") && !e.includes("yahoo") && !e.includes("outlook")) {
      score += 3;
    }
  }

  if (row.fechaExpedicion) score += 2;
  if (row.modalidad) score += 2;

  score = Math.min(100, score);
  // Add decimal variation based on cert number hash for visual differentiation
  if (row.hasCertificate && row.fechaExpedicion) {
    const hash = row.fechaExpedicion.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    score = Math.round((score + (hash % 10) / 10) * 10) / 10;
  }

  let level = "risk";
  if (score >= LEVEL_THRESHOLDS.elite)    level = "elite";
  else if (score >= LEVEL_THRESHOLDS.premium)  level = "premium";
  else if (score >= LEVEL_THRESHOLDS.advanced) level = "advanced";
  else if (score >= LEVEL_THRESHOLDS.growing)  level = "growing";
  else if (score >= LEVEL_THRESHOLDS.emerging) level = "emerging";

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

    // Detect encoding: try UTF-8, fallback to latin1 for Windows-1252 MINCETUR files
    const rawBuffer = Buffer.concat(chunks);
    let raw = rawBuffer.toString("utf-8");
    if ((raw.match(/�/g)?.length ?? 0) > 5) {
      raw = rawBuffer.toString("latin1");
    }

    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV vacío o sin datos" });
    }

    const dataLines = lines[0].startsWith("FECHA_CORTE") ? lines.slice(1) : lines;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const BATCH = 100;

    for (let i = 0; i < dataLines.length; i += BATCH) {
      const batch = dataLines.slice(i, i + BATCH);
      const rows: typeof operatorsTable.$inferInsert[] = [];

      for (const line of batch) {
        if (!line.trim()) continue;
        try {
          const f = parseCSVLine(line);
          const ruc = clean(f[1]);
          const legalName = clean(f[2]) ?? "–";
          const commercialName = clean(f[3]) ?? legalName;
          const region = normalizeRegion(clean(f[12]));
          const province = clean(f[13]);
          const district = clean(f[14]);
          const ubigeo = clean(f[11]);
          const phone = normalizePhone([f[16] ?? "", f[17] ?? "", f[18] ?? "", f[19] ?? ""]);
          const email = clean(f[22])?.toLowerCase() ?? null;
          const website = normalizeWebsite(clean(f[23]));
          const clase = mapClase(clean(f[24]));
          const modalidad = clean(f[27]);
          const repLegal = clean(f[28]);
          const nroCert = clean(f[29]);
          const fechaExp = clean(f[30]);
          const fechaCorte = clean(f[0]);

          const { score, level } = computeBasicScore({
            website, email, phone, modalidad,
            hasCertificate: !!nroCert, fechaExpedicion: fechaExp,
          });

          rows.push({
            legalName, commercialName, ruc, region,
            province, district, operatorType: clase,
            languages: ["es"], verified: !!(nroCert && website),
            ttdmiScore: score.toFixed(2), level,
            website, phone, email, clase, modalidadAutorizada: modalidad,
            repLegal, nroCertificado: nroCert, fechaExpedicion: fechaExp,
            ubigeo, fechaCorte, source: "mincetur",
          });
        } catch {
          skipped++;
        }
      }

      if (rows.length === 0) continue;

      // Upsert rows with RUC (conflict target)
      const withRuc = rows.filter((r) => r.ruc);
      const withoutRuc = rows.filter((r) => !r.ruc);

      const upsertOne = async (r: typeof operatorsTable.$inferInsert) => {
        if (r.ruc) {
          await db.insert(operatorsTable).values(r).onConflictDoUpdate({
            target: operatorsTable.ruc,
            set: {
              commercialName: sql`EXCLUDED.commercial_name`,
              legalName: sql`EXCLUDED.legal_name`,
              region: sql`EXCLUDED.region`,
              province: sql`EXCLUDED.province`,
              district: sql`EXCLUDED.district`,
              operatorType: sql`EXCLUDED.clase`,
              clase: sql`EXCLUDED.clase`,
              modalidadAutorizada: sql`EXCLUDED.modalidad_autorizada`,
              repLegal: sql`EXCLUDED.rep_legal`,
              nroCertificado: sql`EXCLUDED.nro_certificado`,
              fechaExpedicion: sql`EXCLUDED.fecha_expedicion`,
              ubigeo: sql`EXCLUDED.ubigeo`,
              fechaCorte: sql`EXCLUDED.fecha_corte`,
              phone: sql`COALESCE(EXCLUDED.phone, operators.phone)`,
              email: sql`COALESCE(EXCLUDED.email, operators.email)`,
              website: sql`COALESCE(EXCLUDED.website, operators.website)`,
              source: sql`EXCLUDED.source`,
              updatedAt: sql`NOW()`,
            },
          });
        } else {
          await db.insert(operatorsTable).values(r).onConflictDoNothing();
        }
      };

      try {
        // Try batch first (fast path)
        if (withRuc.length > 0) {
          await db.insert(operatorsTable).values(withRuc).onConflictDoUpdate({
            target: operatorsTable.ruc,
            set: {
              commercialName: sql`EXCLUDED.commercial_name`,
              legalName: sql`EXCLUDED.legal_name`,
              region: sql`EXCLUDED.region`,
              province: sql`EXCLUDED.province`,
              district: sql`EXCLUDED.district`,
              operatorType: sql`EXCLUDED.clase`,
              clase: sql`EXCLUDED.clase`,
              modalidadAutorizada: sql`EXCLUDED.modalidad_autorizada`,
              repLegal: sql`EXCLUDED.rep_legal`,
              nroCertificado: sql`EXCLUDED.nro_certificado`,
              fechaExpedicion: sql`EXCLUDED.fecha_expedicion`,
              ubigeo: sql`EXCLUDED.ubigeo`,
              fechaCorte: sql`EXCLUDED.fecha_corte`,
              phone: sql`COALESCE(EXCLUDED.phone, operators.phone)`,
              email: sql`COALESCE(EXCLUDED.email, operators.email)`,
              website: sql`COALESCE(EXCLUDED.website, operators.website)`,
              source: sql`EXCLUDED.source`,
              updatedAt: sql`NOW()`,
            },
          });
          imported += withRuc.length;
        }
        if (withoutRuc.length > 0) {
          await db.insert(operatorsTable).values(withoutRuc).onConflictDoNothing();
          imported += withoutRuc.length;
        }
      } catch {
        // Batch failed — retry row by row to salvage the good ones
        for (const r of rows) {
          try {
            await upsertOne(r);
            imported++;
          } catch (rowErr) {
            skipped++;
            errors.push(String(rowErr).slice(0, 150));
          }
        }
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

// POST /api/ingesta/seed-demo — generates demo data for all operators
router.post("/ingesta/seed-demo", async (req, res) => {
  try {
    // Deterministic pseudo-random seeded by operator id
    const rng = (id: number, offset: number, max: number, min = 0) => {
      const x = Math.sin(id * 9301 + offset * 49297 + 233) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const LEVEL_CFG: Record<string, {
      rating: [number, number]; reviews: [number, number]; auth: number; sentiment: number;
      fb: [number, number]; ig: number; yt: number; tt: number;
      booking: boolean; payment: boolean; whatsapp: boolean; chatbot: boolean; lead: boolean;
      response_h: [number, number];
      reviews_score: [number, number]; social_score: [number, number];
      website_score: [number, number]; seo_score: [number, number];
      engagement: [number, number]; formalidad: [number, number];
      conversion: [number, number]; freshness: [number, number];
    }> = {
      elite:    { rating:[4.6,5.0], reviews:[150,500], auth:0.93, sentiment:0.88,
                  fb:[5000,40000], ig:0.7, yt:0.4, tt:0.2,
                  booking:true, payment:true, whatsapp:true, chatbot:true, lead:true, response_h:[1,4],
                  reviews_score:[78,95], social_score:[70,90], website_score:[75,92], seo_score:[60,85],
                  engagement:[65,85], formalidad:[80,95], conversion:[70,90], freshness:[65,85] },
      premium:  { rating:[4.2,4.7], reviews:[60,200],  auth:0.88, sentiment:0.80,
                  fb:[1500,12000], ig:0.55, yt:0.25, tt:0.12,
                  booking:false, payment:true, whatsapp:true, chatbot:false, lead:true, response_h:[3,8],
                  reviews_score:[58,78], social_score:[50,72], website_score:[65,82], seo_score:[45,68],
                  engagement:[50,70], formalidad:[72,88], conversion:[55,75], freshness:[55,72] },
      advanced: { rating:[3.9,4.4], reviews:[25,90],   auth:0.82, sentiment:0.72,
                  fb:[400,4000],   ig:0.4,  yt:0.12, tt:0.07,
                  booking:false, payment:false, whatsapp:true, chatbot:false, lead:true, response_h:[6,18],
                  reviews_score:[40,60], social_score:[35,55], website_score:[55,72], seo_score:[35,55],
                  engagement:[38,55], formalidad:[62,78], conversion:[40,60], freshness:[45,62] },
      growing:  { rating:[3.5,4.1], reviews:[8,40],    auth:0.76, sentiment:0.65,
                  fb:[100,1200],   ig:0.25, yt:0.06, tt:0.03,
                  booking:false, payment:false, whatsapp:true, chatbot:false, lead:false, response_h:[12,36],
                  reviews_score:[25,42], social_score:[20,38], website_score:[35,55], seo_score:[20,38],
                  engagement:[22,40], formalidad:[52,68], conversion:[25,42], freshness:[35,52] },
      emerging: { rating:[3.1,3.8], reviews:[2,18],    auth:0.70, sentiment:0.58,
                  fb:[20,400],     ig:0.15, yt:0.03, tt:0.01,
                  booking:false, payment:false, whatsapp:false, chatbot:false, lead:false, response_h:[24,72],
                  reviews_score:[12,28], social_score:[8,22],  website_score:[15,35], seo_score:[10,25],
                  engagement:[10,22], formalidad:[40,58], conversion:[10,25], freshness:[22,40] },
    };

    const operators = await db.select({
      id: operatorsTable.id, level: operatorsTable.level,
      ttdmiScore: operatorsTable.ttdmiScore, website: operatorsTable.website,
      email: operatorsTable.email, ruc: operatorsTable.ruc,
      verified: operatorsTable.verified, nroCertificado: operatorsTable.nroCertificado,
    }).from(operatorsTable);

    let seeded = 0;
    const BATCH = 100;

    for (let i = 0; i < operators.length; i += BATCH) {
      const batch = operators.slice(i, i + BATCH);

      const trustRows = [];
      const socialRows = [];
      const reviewRows = [];
      const bookingRows = [];
      const certRows = [];

      for (const op of batch) {
        const id = op.id;
        const level = op.level ?? "emerging";
        const cfg = LEVEL_CFG[level] ?? LEVEL_CFG.emerging!;

        // Trust scores
        const rs  = rng(id, 1, cfg.reviews_score[1], cfg.reviews_score[0]);
        const ss  = rng(id, 2, cfg.social_score[1], cfg.social_score[0]);
        const ws  = op.website ? rng(id, 3, cfg.website_score[1], cfg.website_score[0]) : 10;
        const seo = rng(id, 4, cfg.seo_score[1], cfg.seo_score[0]);
        const eng = rng(id, 5, cfg.engagement[1], cfg.engagement[0]);
        const frm = rng(id, 6, cfg.formalidad[1], cfg.formalidad[0]);
        const cnv = rng(id, 7, cfg.conversion[1], cfg.conversion[0]);
        const frs = rng(id, 8, cfg.freshness[1], cfg.freshness[0]);
        const vf  = op.verified ? 1.05 : 1.0;

        trustRows.push({
          operatorId: id, totalScore: parseFloat(op.ttdmiScore ?? "50").toFixed(2),
          reviewsScore: rs.toFixed(2), socialScore: ss.toFixed(2),
          websiteScore: ws.toFixed(2), seoScore: seo.toFixed(2),
          engagementScore: eng.toFixed(2), formalidadScore: frm.toFixed(2),
          conversionScore: cnv.toFixed(2), freshnessScore: frs.toFixed(2),
          networkScore: "50.00", validationFactor: vf.toFixed(3),
        });

        // Social profiles
        const fbFollowers = rng(id, 10, cfg.fb[1], cfg.fb[0]);
        socialRows.push({
          operatorId: id, platform: "Facebook",
          handle: null, followers: fbFollowers,
          engagementRate: (rng(id, 11, 80, 15) / 10).toFixed(2),
          verified: false,
        });
        if (rng(id, 12, 100) < cfg.ig * 100) {
          socialRows.push({
            operatorId: id, platform: "Instagram",
            handle: null, followers: rng(id, 13, Math.floor(fbFollowers * 0.8), Math.floor(fbFollowers * 0.3)),
            engagementRate: (rng(id, 14, 90, 20) / 10).toFixed(2),
            verified: false,
          });
        }
        if (rng(id, 15, 100) < cfg.yt * 100) {
          socialRows.push({
            operatorId: id, platform: "YouTube",
            handle: null, followers: rng(id, 16, Math.floor(fbFollowers * 0.4), 50),
            engagementRate: (rng(id, 17, 30, 5) / 10).toFixed(2),
            verified: false,
          });
        }

        // Reviews: Google Reviews always, TripAdvisor for advanced+, Booking for premium+
        const googleRating = (cfg.rating[0] + rng(id, 20, Math.round((cfg.rating[1] - cfg.rating[0]) * 10)) / 10).toFixed(1);
        const googleCount  = rng(id, 21, cfg.reviews[1], cfg.reviews[0]);
        reviewRows.push({
          operatorId: id, source: "Google Reviews",
          rating: googleRating, sentiment: cfg.sentiment.toFixed(3),
          reviewCount: googleCount, authenticityScore: cfg.auth.toFixed(3),
        });
        if (["elite","premium","advanced"].includes(level)) {
          const taRating = Math.max(3.0, parseFloat(googleRating) - 0.1 - rng(id, 22, 3) * 0.1).toFixed(1);
          reviewRows.push({
            operatorId: id, source: "TripAdvisor",
            rating: taRating, sentiment: (cfg.sentiment - 0.03).toFixed(3),
            reviewCount: Math.floor(googleCount * (0.3 + rng(id, 23, 30) / 100)),
            authenticityScore: (cfg.auth - 0.02).toFixed(3),
          });
        }
        if (["elite","premium"].includes(level)) {
          const bkRating = Math.max(3.0, parseFloat(googleRating) + rng(id, 24, 2) * 0.1 - 0.1).toFixed(1);
          reviewRows.push({
            operatorId: id, source: "Booking.com",
            rating: bkRating, sentiment: (cfg.sentiment + 0.02).toFixed(3),
            reviewCount: Math.floor(googleCount * (0.15 + rng(id, 25, 20) / 100)),
            authenticityScore: cfg.auth.toFixed(3),
          });
        }

        // Booking capabilities
        const otas: string[] = [];
        if (cfg.booking) otas.push("Airbnb");
        if (["elite","premium"].includes(level)) otas.push("TripAdvisor");
        bookingRows.push({
          operatorId: id,
          bookingEngine: cfg.booking, onlinePayment: cfg.payment,
          whatsappCta: cfg.whatsapp, chatbot: cfg.chatbot, leadForm: cfg.lead,
          responseTimeHours: (rng(id, 30, cfg.response_h[1], cfg.response_h[0]) + rng(id, 31, 10) / 10).toFixed(1),
          otaPresence: otas,
        });

        // Certifications (if has MINCETUR cert number)
        if (op.nroCertificado) {
          certRows.push({
            operatorId: id, name: "Registro MINCETUR",
            issuer: "Ministerio de Comercio Exterior y Turismo",
            verified: true,
          });
        }
      }

      await Promise.all([
        db.insert(trustScoresTable).values(trustRows)
          .onConflictDoUpdate({
            target: trustScoresTable.operatorId,
            set: {
              totalScore: sql`EXCLUDED.total_score`,
              reviewsScore: sql`EXCLUDED.reviews_score`,
              socialScore: sql`EXCLUDED.social_score`,
              websiteScore: sql`EXCLUDED.website_score`,
              seoScore: sql`EXCLUDED.seo_score`,
              engagementScore: sql`EXCLUDED.engagement_score`,
              formalidadScore: sql`EXCLUDED.formalidad_score`,
              conversionScore: sql`EXCLUDED.conversion_score`,
              freshnessScore: sql`EXCLUDED.freshness_score`,
              networkScore: sql`EXCLUDED.network_score`,
              validationFactor: sql`EXCLUDED.validation_factor`,
            },
          }),
        db.insert(socialProfilesTable).values(socialRows)
          .onConflictDoUpdate({
            target: [socialProfilesTable.operatorId, socialProfilesTable.platform],
            set: {
              followers: sql`EXCLUDED.followers`,
              engagementRate: sql`EXCLUDED.engagement_rate`,
            },
          }),
        db.insert(reviewsTable).values(reviewRows)
          .onConflictDoUpdate({
            target: [reviewsTable.operatorId, reviewsTable.source],
            set: {
              rating: sql`EXCLUDED.rating`,
              sentiment: sql`EXCLUDED.sentiment`,
              reviewCount: sql`EXCLUDED.review_count`,
              authenticityScore: sql`EXCLUDED.authenticity_score`,
            },
          }),
        db.insert(bookingCapabilitiesTable).values(bookingRows)
          .onConflictDoUpdate({
            target: bookingCapabilitiesTable.operatorId,
            set: {
              bookingEngine: sql`EXCLUDED.booking_engine`,
              onlinePayment: sql`EXCLUDED.online_payment`,
              whatsappCta: sql`EXCLUDED.whatsapp_cta`,
              chatbot: sql`EXCLUDED.chatbot`,
              leadForm: sql`EXCLUDED.lead_form`,
              responseTimeHours: sql`EXCLUDED.response_time_hours`,
              otaPresence: sql`EXCLUDED.ota_presence`,
            },
          }),
        certRows.length > 0
          ? db.insert(certificationsTable).values(certRows).onConflictDoNothing()
          : Promise.resolve(),
      ]);
      seeded += batch.length;
    }

    res.json({ success: true, seeded, message: `Demo data seeded for ${seeded} operators` });
  } catch (err) {
    req.log.error({ err }, "Error seeding demo data");
    res.status(500).json({ error: "Error seeding demo data", detail: String(err) });
  }
});

export default router;
