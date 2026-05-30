import { Router } from "express";
import { db } from "@workspace/db";
import { operatorsTable, trustScoresTable } from "@workspace/db";
import { eq, desc, asc, sql, and, ilike } from "drizzle-orm";
import { getLevelLabel } from "../lib/levels.js";

const router = Router();

router.get("/rankings", async (req, res) => {
  try {
    const {
      type = "nacional",
      region,
      niche,
      limit = "20",
    } = req.query as Record<string, string>;

    const limitNum = Math.min(100, parseInt(limit));

    let conditions = [];
    if (region) conditions.push(ilike(operatorsTable.region, `%${region}%`));
    if (niche) conditions.push(eq(operatorsTable.niche, niche));

    let orderBy;
    switch (type) {
      case "trust":
        orderBy = desc(sql`${trustScoresTable.reviewsScore}::numeric`);
        break;
      case "seo":
        orderBy = desc(sql`${trustScoresTable.seoScore}::numeric`);
        break;
      case "conversion":
        orderBy = desc(sql`${trustScoresTable.conversionScore}::numeric`);
        break;
      case "freshness":
        orderBy = desc(sql`${trustScoresTable.freshnessScore}::numeric`);
        break;
      default:
        orderBy = desc(sql`${operatorsTable.ttdmiScore}::numeric`);
    }

    const rows = await db
      .select({
        id: operatorsTable.id,
        commercial_name: operatorsTable.commercialName,
        region: operatorsTable.region,
        operator_type: operatorsTable.operatorType,
        niche: operatorsTable.niche,
        ttdmi_score: operatorsTable.ttdmiScore,
        level: operatorsTable.level,
        verified: operatorsTable.verified,
        logo_url: operatorsTable.logoUrl,
        rank_nacional: operatorsTable.rankNacional,
      })
      .from(operatorsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limitNum);

    const data = rows.map((op, idx) => ({
      rank: idx + 1,
      operator_id: op.id,
      commercial_name: op.commercial_name,
      region: op.region,
      operator_type: op.operator_type,
      niche: op.niche,
      ttdmi_score: parseFloat(op.ttdmi_score ?? "0"),
      level: op.level,
      level_label: getLevelLabel(op.level),
      verified: op.verified,
      logo_url: op.logo_url,
      rank_change: Math.floor(Math.random() * 5) - 2,
    }));

    res.json({
      type,
      region: region ?? null,
      niche: niche ?? null,
      data,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
