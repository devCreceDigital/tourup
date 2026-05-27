import { readFileSync } from "fs";
import { Client } from "pg";

const CSV_PATH = process.argv[2] ?? "attached_assets/bd_agencias_1779854527325.csv";

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

function clean(v: string | undefined): string | null {
  if (!v || v.trim() === "" || v.trim() === "." || v.trim() === "S/N") return null;
  return v.trim();
}

function normalizeWebsite(raw: string | null): string | null {
  if (!raw) return null;
  let url = raw.toLowerCase().trim();
  if (!url.startsWith("http")) url = "https://" + url;
  return url.length <= 500 ? url : null;
}

const regionMap: Record<string, string> = {
  "AMAZONAS":"Amazonas","ÁNCASH":"Áncash","ANCASH":"Áncash","APURÍMAC":"Apurímac",
  "AREQUIPA":"Arequipa","AYACUCHO":"Ayacucho","CAJAMARCA":"Cajamarca","CALLAO":"Callao",
  "CUSCO":"Cusco","HUANCAVELICA":"Huancavelica","HUÁNUCO":"Huánuco","HUANUCO":"Huánuco",
  "ICA":"Ica","JUNÍN":"Junín","JUNIN":"Junín","LA LIBERTAD":"La Libertad",
  "LAMBAYEQUE":"Lambayeque","LIMA":"Lima","LORETO":"Loreto","MADRE DE DIOS":"Madre de Dios",
  "MOQUEGUA":"Moquegua","PASCO":"Pasco","PIURA":"Piura","PUNO":"Puno",
  "SAN MARTÍN":"San Martín","SAN MARTIN":"San Martín","TACNA":"Tacna",
  "TUMBES":"Tumbes","UCAYALI":"Ucayali",
};

function normalizeRegion(dep: string | null): string {
  if (!dep) return "Lima";
  return regionMap[dep.toUpperCase()] ?? dep;
}

function mapClase(clase: string | null): string {
  if (!clase) return "Operador de Turismo";
  const c = clase.trim();
  if (c === "Operador Turismo") return "Operador de Turismo";
  return c;
}

function computeScore(website: string | null, email: string | null, phone: string | null, modalidad: string | null, nroCert: string | null): { score: number; level: string } {
  let s = 45;
  if (website) s += 15;
  if (email) s += 8;
  if (phone) s += 5;
  if (modalidad?.includes("Digital")) s += 12;
  if (nroCert) s += 5;
  s = Math.min(75, s);
  let level = "risk";
  if (s >= 60) level = "growing";
  else if (s >= 40) level = "emerging";
  return { score: Math.round(s * 10) / 10, level };
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to DB");

  const raw = readFileSync(CSV_PATH, "utf-8");
  const allLines = raw.split(/\r?\n/).filter((l) => l.trim());
  const dataLines = allLines[0].startsWith("FECHA_CORTE") ? allLines.slice(1) : allLines;
  console.log(`Processing ${dataLines.length} rows...`);

  const BATCH = 300;
  let totalImported = 0;
  let totalSkipped = 0;

  for (let batchStart = 0; batchStart < dataLines.length; batchStart += BATCH) {
    const chunk = dataLines.slice(batchStart, batchStart + BATCH);
    const rows: Array<{
      legalName: string; commercialName: string; ruc: string | null;
      region: string; province: string | null; district: string | null;
      clase: string; website: string | null; phone: string | null;
      email: string | null; score: number; level: string;
      modalidad: string | null; repLegal: string | null; nroCert: string | null;
      fechaExp: string | null; ubigeo: string | null; fechaCorte: string | null;
    }> = [];

    for (const line of chunk) {
      try {
        const f = parseCSVLine(line);
        if (!f[2]) continue;
        const ruc = clean(f[1]);
        const legalName = clean(f[2]) ?? "–";
        const commercialName = clean(f[3]) ?? legalName;
        const region = normalizeRegion(clean(f[12]));
        const province = clean(f[13]);
        const district = clean(f[14]);
        const ubigeo = clean(f[11]);
        const phones = [f[16], f[17], f[18], f[19]].map((p) => clean(p)).filter(Boolean);
        const phone = phones[0] ?? null;
        const email = clean(f[22])?.toLowerCase() ?? null;
        const website = normalizeWebsite(clean(f[23]));
        const clase = mapClase(clean(f[24]));
        const modalidad = clean(f[27]);
        const repLegal = clean(f[28]);
        const nroCert = clean(f[29]);
        const fechaExp = clean(f[30]);
        const fechaCorte = clean(f[0]);
        const { score, level } = computeScore(website, email, phone, modalidad, nroCert);
        rows.push({ legalName, commercialName, ruc, region, province, district, clase, website, phone, email, score, level, modalidad, repLegal, nroCert, fechaExp, ubigeo, fechaCorte });
      } catch {
        totalSkipped++;
      }
    }

    if (rows.length === 0) continue;

    // Deduplicate by RUC within the batch (keep last occurrence)
    const deduped = new Map<string, typeof rows[0]>();
    for (const r of rows) {
      const key = r.ruc ?? `null_${Math.random()}`; // nulls get unique keys
      deduped.set(key, r);
    }
    const dedupedRows = Array.from(deduped.values());

    // Build parameterized query
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let p = 1;

    for (const r of dedupedRows) {
      placeholders.push(
        `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},NULL,ARRAY['es']::text[],false,$${p++},$${p++},$${p++},NULL,NULL,$${p++},$${p++},NULL,NOW(),NOW(),$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},'mincetur')`
      );
      values.push(
        r.legalName, r.commercialName, r.ruc, r.region, r.province, r.district, r.clase,
        r.score, r.level, r.website, r.phone, r.email,
        r.clase, r.modalidad, r.repLegal, r.nroCert, r.fechaExp, r.ubigeo, r.fechaCorte
      );
    }

    try {
      await client.query(`
        INSERT INTO operators (
          legal_name, commercial_name, ruc, region, province, district, operator_type,
          niche, languages, verified, ttdmi_score, level, website, logo_url, description,
          phone, email, rank_nacional, created_at, updated_at,
          clase, modalidad_autorizada, rep_legal, nro_certificado, fecha_expedicion,
          ubigeo, fecha_corte, source
        ) VALUES ${placeholders.join(",\n")}
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
          source = 'mincetur',
          updated_at = NOW()
      `, values);
      totalImported += rows.length;
    } catch (err) {
      console.error(`Batch ${batchStart}–${batchStart + BATCH} error:`, String(err).slice(0, 200));
      totalSkipped += rows.length;
    }

    if ((batchStart / BATCH) % 5 === 0) {
      console.log(`  Progress: ${batchStart + rows.length}/${dataLines.length} (${totalImported} imported)`);
    }
  }

  await client.end();
  console.log(`\nDone! Imported: ${totalImported} | Skipped: ${totalSkipped} | Total: ${dataLines.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
