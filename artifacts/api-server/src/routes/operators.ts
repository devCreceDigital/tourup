import { Router } from "express";
import { db } from "@workspace/db";
import {
  operatorsTable,
  trustScoresTable,
  socialProfilesTable,
  reviewsTable,
  bookingCapabilitiesTable,
  certificationsTable,
  seoMetricsTable,
} from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql, or } from "drizzle-orm";

const router = Router();

function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    elite: "World-Class Operator",
    premium: "High Trust",
    advanced: "Digitally Mature",
    growing: "Mid Maturity",
    emerging: "Low Digitalization",
    risk: "Weak Trust",
  };
  return labels[level] ?? level;
}

function scoreToLevel(score: number): string {
  if (score >= 90) return "elite";
  if (score >= 80) return "premium";
  if (score >= 70) return "advanced";
  if (score >= 60) return "growing";
  if (score >= 40) return "emerging";
  return "risk";
}

function computeTtdmi(scores: {
  reviews: number;
  social: number;
  website: number;
  seo: number;
  engagement: number;
  formalidad: number;
  conversion: number;
  freshness: number;
  network: number;
  validationFactor: number;
}): number {
  const base =
    0.25 * scores.reviews +
    0.15 * scores.social +
    0.15 * scores.website +
    0.10 * scores.seo +
    0.10 * scores.engagement +
    0.10 * scores.formalidad +
    0.10 * scores.conversion +
    0.05 * scores.freshness;
  return Math.min(100, Math.max(0, base * scores.validationFactor));
}

router.get("/operators", async (req, res) => {
  try {
    const {
      search,
      region,
      operator_type,
      clase,
      modalidad,
      level,
      min_score,
      max_score,
      verified,
      page = "1",
      limit = "20",
      sort_by = "ttdmi_score",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(operatorsTable.commercialName, `%${search}%`),
          ilike(operatorsTable.legalName, `%${search}%`),
          ilike(operatorsTable.region, `%${search}%`),
          ilike(operatorsTable.ruc, `%${search}%`)
        )
      );
    }
    if (region) conditions.push(ilike(operatorsTable.region, `%${region}%`));
    if (clase) conditions.push(ilike(sql`COALESCE(${operatorsTable.clase}, ${operatorsTable.operatorType})`, `%${clase}%`));
    if (operator_type && !clase) conditions.push(ilike(operatorsTable.operatorType, `%${operator_type}%`));
    if (modalidad) conditions.push(ilike(sql`COALESCE(${operatorsTable.modalidadAutorizada}, '')`, `%${modalidad}%`));
    if (verified !== undefined) conditions.push(eq(operatorsTable.verified, verified === "true"));
    if (level) conditions.push(eq(operatorsTable.level, level));
    if (min_score) conditions.push(gte(sql`${operatorsTable.ttdmiScore}::numeric`, parseFloat(min_score)));
    if (max_score) conditions.push(lte(sql`${operatorsTable.ttdmiScore}::numeric`, parseFloat(max_score)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderCol =
      sort_by === "commercial_name"
        ? asc(operatorsTable.commercialName)
        : sort_by === "region"
        ? asc(operatorsTable.region)
        : sort_by === "rank_nacional"
        ? asc(operatorsTable.rankNacional)
        : desc(sql`${operatorsTable.ttdmiScore}::numeric`);

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(operatorsTable)
        .where(where)
        .orderBy(orderCol)
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(operatorsTable)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    res.json({
      data: rows.map((op) => ({
        id: op.id,
        legal_name: op.legalName,
        commercial_name: op.commercialName,
        ruc: op.ruc,
        region: op.region,
        province: op.province,
        district: op.district,
        operator_type: op.clase ?? op.operatorType,
        clase: op.clase,
        modalidad_autorizada: op.modalidadAutorizada,
        niche: op.niche,
        languages: op.languages,
        verified: op.verified,
        ttdmi_score: parseFloat(op.ttdmiScore ?? "0"),
        level: op.level,
        level_label: getLevelLabel(op.level),
        website: op.website,
        logo_url: op.logoUrl,
        description: op.description,
        rank_nacional: op.rankNacional,
        created_at: op.createdAt.toISOString(),
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/operators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    const [op] = await db.select().from(operatorsTable).where(eq(operatorsTable.id, id));
    if (!op) return void res.status(404).json({ error: "Not found" });

    const [score, socials, reviews, booking, certs] = await Promise.all([
      db.select().from(trustScoresTable).where(eq(trustScoresTable.operatorId, id)),
      db.select().from(socialProfilesTable).where(eq(socialProfilesTable.operatorId, id)),
      db.select().from(reviewsTable).where(eq(reviewsTable.operatorId, id)),
      db.select().from(bookingCapabilitiesTable).where(eq(bookingCapabilitiesTable.operatorId, id)),
      db.select().from(certificationsTable).where(eq(certificationsTable.operatorId, id)),
    ]);

    const sc = score[0];
    const bc = booking[0];

    const totalReviews = reviews.reduce((sum, r) => sum + r.reviewCount, 0);
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + parseFloat(r.rating) * r.reviewCount, 0) / Math.max(1, totalReviews)
        : 0;

    res.json({
      id: op.id,
      legal_name: op.legalName,
      commercial_name: op.commercialName,
      ruc: op.ruc,
      region: op.region,
      province: op.province,
      district: op.district,
      operator_type: op.clase ?? op.operatorType,
      clase: op.clase,
      modalidad_autorizada: op.modalidadAutorizada,
      rep_legal: op.repLegal,
      nro_certificado: op.nroCertificado,
      fecha_expedicion: op.fechaExpedicion,
      ubigeo: op.ubigeo,
      source: op.source,
      niche: op.niche,
      languages: op.languages,
      verified: op.verified,
      ttdmi_score: parseFloat(op.ttdmiScore ?? "0"),
      level: op.level,
      level_label: getLevelLabel(op.level),
      website: op.website,
      logo_url: op.logoUrl,
      description: op.description,
      phone: op.phone,
      email: op.email,
      rank_nacional: op.rankNacional,
      created_at: op.createdAt.toISOString(),
      score_breakdown: sc
        ? {
            operator_id: sc.operatorId,
            total_score: parseFloat(sc.totalScore ?? "0"),
            reviews_score: parseFloat(sc.reviewsScore ?? "0"),
            social_score: parseFloat(sc.socialScore ?? "0"),
            website_score: parseFloat(sc.websiteScore ?? "0"),
            seo_score: parseFloat(sc.seoScore ?? "0"),
            engagement_score: parseFloat(sc.engagementScore ?? "0"),
            formalidad_score: parseFloat(sc.formalidadScore ?? "0"),
            conversion_score: parseFloat(sc.conversionScore ?? "0"),
            freshness_score: parseFloat(sc.freshnessScore ?? "0"),
            network_score: parseFloat(sc.networkScore ?? "0"),
            validation_factor: parseFloat(sc.validationFactor ?? "1"),
            level: op.level,
            level_label: getLevelLabel(op.level),
            score_details: sc.scoreDetails,
            updated_at: sc.updatedAt.toISOString(),
          }
        : null,
      social_profiles: socials.map((s) => ({
        id: s.id,
        platform: s.platform,
        handle: s.handle,
        followers: s.followers,
        engagement_rate: parseFloat(s.engagementRate ?? "0"),
        verified: s.verified,
        last_post_date: s.lastPostDate?.toISOString() ?? null,
        posts_per_week: s.postsPerWeek ? parseFloat(s.postsPerWeek) : null,
      })),
      reviews_summary: {
        average_rating: Math.round(avgRating * 10) / 10,
        total_reviews: totalReviews,
        authenticity_score:
          reviews.length > 0
            ? reviews.reduce((s, r) => s + parseFloat(r.authenticityScore ?? "0.8"), 0) / reviews.length
            : 0.8,
        sources: reviews.map((r) => ({
          source: r.source,
          count: r.reviewCount,
          avg_rating: parseFloat(r.rating),
        })),
        sentiment_score: reviews.length > 0 ? reviews.reduce((s, r) => s + parseFloat(r.sentiment ?? "0.7"), 0) / reviews.length : 0.7,
        recency_score: 70,
      },
      booking_capabilities: bc
        ? {
            booking_engine: bc.bookingEngine,
            online_payment: bc.onlinePayment,
            whatsapp_cta: bc.whatsappCta,
            chatbot: bc.chatbot,
            lead_form: bc.leadForm,
            response_time_hours: bc.responseTimeHours ? parseFloat(bc.responseTimeHours) : null,
            ota_presence: bc.otaPresence,
          }
        : null,
      certifications: certs.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        verified: c.verified,
        expiry_date: c.expiryDate?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/operators", async (req, res) => {
  try {
    const {
      legal_name,
      commercial_name,
      ruc,
      region,
      province,
      district,
      operator_type,
      niche,
      languages,
      website,
      description,
      phone,
      email,
    } = req.body;

    if (!legal_name || !commercial_name || !region || !operator_type) {
      return void res.status(400).json({ error: "Missing required fields" });
    }

    const [op] = await db
      .insert(operatorsTable)
      .values({
        legalName: legal_name,
        commercialName: commercial_name,
        ruc: ruc ?? null,
        region,
        province: province ?? null,
        district: district ?? null,
        operatorType: operator_type,
        niche: niche ?? null,
        languages: languages ?? ["es"],
        website: website ?? null,
        description: description ?? null,
        phone: phone ?? null,
        email: email ?? null,
        ttdmiScore: "30",
        level: "risk",
      })
      .returning();

    res.status(201).json({
      id: op.id,
      legal_name: op.legalName,
      commercial_name: op.commercialName,
      ruc: op.ruc,
      region: op.region,
      province: op.province,
      district: op.district,
      operator_type: op.operatorType,
      niche: op.niche,
      languages: op.languages,
      verified: op.verified,
      ttdmi_score: parseFloat(op.ttdmiScore ?? "0"),
      level: op.level,
      level_label: getLevelLabel(op.level),
      website: op.website,
      logo_url: op.logoUrl,
      description: op.description,
      rank_nacional: op.rankNacional,
      created_at: op.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/operators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    const {
      legal_name,
      commercial_name,
      ruc,
      region,
      province,
      district,
      operator_type,
      niche,
      languages,
      website,
      description,
      phone,
      email,
      verified,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (legal_name !== undefined) updates.legalName = legal_name;
    if (commercial_name !== undefined) updates.commercialName = commercial_name;
    if (ruc !== undefined) updates.ruc = ruc;
    if (region !== undefined) updates.region = region;
    if (province !== undefined) updates.province = province;
    if (district !== undefined) updates.district = district;
    if (operator_type !== undefined) updates.operatorType = operator_type;
    if (niche !== undefined) updates.niche = niche;
    if (languages !== undefined) updates.languages = languages;
    if (website !== undefined) updates.website = website;
    if (description !== undefined) updates.description = description;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (verified !== undefined) updates.verified = verified;

    const [op] = await db.update(operatorsTable).set(updates).where(eq(operatorsTable.id, id)).returning();

    if (!op) return void res.status(404).json({ error: "Not found" });

    res.json({
      id: op.id,
      legal_name: op.legalName,
      commercial_name: op.commercialName,
      ruc: op.ruc,
      region: op.region,
      province: op.province,
      district: op.district,
      operator_type: op.operatorType,
      niche: op.niche,
      languages: op.languages,
      verified: op.verified,
      ttdmi_score: parseFloat(op.ttdmiScore ?? "0"),
      level: op.level,
      level_label: getLevelLabel(op.level),
      website: op.website,
      logo_url: op.logoUrl,
      description: op.description,
      rank_nacional: op.rankNacional,
      created_at: op.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/operators/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    await db.delete(operatorsTable).where(eq(operatorsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/operators/:id/score", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    const [[op], [sc]] = await Promise.all([
      db.select().from(operatorsTable).where(eq(operatorsTable.id, id)),
      db.select().from(trustScoresTable).where(eq(trustScoresTable.operatorId, id)),
    ]);

    if (!op) return void res.status(404).json({ error: "Not found" });

    if (!sc) {
      return void res.json({
        operator_id: id,
        total_score: parseFloat(op.ttdmiScore ?? "0"),
        reviews_score: 0,
        social_score: 0,
        website_score: 0,
        seo_score: 0,
        engagement_score: 0,
        formalidad_score: 0,
        conversion_score: 0,
        freshness_score: 0,
        network_score: 0,
        validation_factor: 1,
        level: op.level,
        level_label: getLevelLabel(op.level),
        score_details: null,
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      operator_id: sc.operatorId,
      total_score: parseFloat(sc.totalScore ?? "0"),
      reviews_score: parseFloat(sc.reviewsScore ?? "0"),
      social_score: parseFloat(sc.socialScore ?? "0"),
      website_score: parseFloat(sc.websiteScore ?? "0"),
      seo_score: parseFloat(sc.seoScore ?? "0"),
      engagement_score: parseFloat(sc.engagementScore ?? "0"),
      formalidad_score: parseFloat(sc.formalidadScore ?? "0"),
      conversion_score: parseFloat(sc.conversionScore ?? "0"),
      freshness_score: parseFloat(sc.freshnessScore ?? "0"),
      network_score: parseFloat(sc.networkScore ?? "0"),
      validation_factor: parseFloat(sc.validationFactor ?? "1"),
      level: op.level,
      level_label: getLevelLabel(op.level),
      score_details: sc.scoreDetails,
      updated_at: sc.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/operators/:id/score", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: "Invalid id" });

    const [[op], socials, reviews, [booking]] = await Promise.all([
      db.select().from(operatorsTable).where(eq(operatorsTable.id, id)),
      db.select().from(socialProfilesTable).where(eq(socialProfilesTable.operatorId, id)),
      db.select().from(reviewsTable).where(eq(reviewsTable.operatorId, id)),
      db.select().from(bookingCapabilitiesTable).where(eq(bookingCapabilitiesTable.operatorId, id)),
    ]);

    if (!op) return void res.status(404).json({ error: "Not found" });

    const totalReviews = reviews.reduce((s, r) => s + r.reviewCount, 0);
    const avgRating = totalReviews > 0 ? reviews.reduce((s, r) => s + parseFloat(r.rating) * r.reviewCount, 0) / totalReviews : 0;
    const reviewsScore = Math.min(100, (avgRating / 5) * 100 * (totalReviews > 100 ? 1 : totalReviews / 100));

    const totalFollowers = socials.reduce((s, sp) => s + sp.followers, 0);
    const avgEngagement = socials.length > 0 ? socials.reduce((s, sp) => s + parseFloat(sp.engagementRate ?? "0"), 0) / socials.length : 0;
    const socialScore = Math.min(100, (Math.log10(totalFollowers + 1) / 5) * 60 + avgEngagement * 40);

    const websiteScore = op.website ? 65 : 10;
    const seoScore = Math.floor(Math.random() * 30) + 40;
    const engagementScore = avgEngagement * 10;
    const formalidadScore = op.ruc ? 70 : 30;
    const conversionScore = booking
      ? (booking.bookingEngine ? 25 : 0) +
        (booking.onlinePayment ? 20 : 0) +
        (booking.whatsappCta ? 15 : 0) +
        (booking.leadForm ? 15 : 0) +
        (booking.chatbot ? 10 : 0) +
        (booking.otaPresence.length > 0 ? 15 : 0)
      : 10;
    const freshnessScore = 60;
    const networkScore = 50;

    const validationFactor =
      (op.verified ? 1.1 : 1.0) * (op.ruc ? 1.05 : 0.95) * (op.website ? 1.05 : 0.9);
    const clampedFactor = Math.min(1.2, Math.max(0.6, validationFactor));

    const totalScore = computeTtdmi({
      reviews: reviewsScore,
      social: socialScore,
      website: websiteScore,
      seo: seoScore,
      engagement: engagementScore,
      formalidad: formalidadScore,
      conversion: conversionScore,
      freshness: freshnessScore,
      network: networkScore,
      validationFactor: clampedFactor,
    });

    const newLevel = scoreToLevel(totalScore);

    const existing = await db.select().from(trustScoresTable).where(eq(trustScoresTable.operatorId, id));
    let sc;
    if (existing.length > 0) {
      const [updated] = await db.update(trustScoresTable).set({
        totalScore: totalScore.toFixed(2),
        reviewsScore: reviewsScore.toFixed(2),
        socialScore: socialScore.toFixed(2),
        websiteScore: websiteScore.toFixed(2),
        seoScore: seoScore.toFixed(2),
        engagementScore: engagementScore.toFixed(2),
        formalidadScore: formalidadScore.toFixed(2),
        conversionScore: conversionScore.toFixed(2),
        freshnessScore: freshnessScore.toFixed(2),
        networkScore: networkScore.toFixed(2),
        validationFactor: clampedFactor.toFixed(3),
      }).where(eq(trustScoresTable.operatorId, id)).returning();
      sc = updated;
    } else {
      const [inserted] = await db.insert(trustScoresTable).values({
        operatorId: id,
        totalScore: totalScore.toFixed(2),
        reviewsScore: reviewsScore.toFixed(2),
        socialScore: socialScore.toFixed(2),
        websiteScore: websiteScore.toFixed(2),
        seoScore: seoScore.toFixed(2),
        engagementScore: engagementScore.toFixed(2),
        formalidadScore: formalidadScore.toFixed(2),
        conversionScore: conversionScore.toFixed(2),
        freshnessScore: freshnessScore.toFixed(2),
        networkScore: networkScore.toFixed(2),
        validationFactor: clampedFactor.toFixed(3),
      }).returning();
      sc = inserted;
    }

    await db.update(operatorsTable).set({ ttdmiScore: totalScore.toFixed(2), level: newLevel }).where(eq(operatorsTable.id, id));

    res.json({
      operator_id: sc.operatorId,
      total_score: parseFloat(sc.totalScore ?? "0"),
      reviews_score: parseFloat(sc.reviewsScore ?? "0"),
      social_score: parseFloat(sc.socialScore ?? "0"),
      website_score: parseFloat(sc.websiteScore ?? "0"),
      seo_score: parseFloat(sc.seoScore ?? "0"),
      engagement_score: parseFloat(sc.engagementScore ?? "0"),
      formalidad_score: parseFloat(sc.formalidadScore ?? "0"),
      conversion_score: parseFloat(sc.conversionScore ?? "0"),
      freshness_score: parseFloat(sc.freshnessScore ?? "0"),
      network_score: parseFloat(sc.networkScore ?? "0"),
      validation_factor: parseFloat(sc.validationFactor ?? "1"),
      level: newLevel,
      level_label: getLevelLabel(newLevel),
      score_details: sc.scoreDetails,
      updated_at: sc.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
