import { pgTable, text, serial, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const operatorsTable = pgTable("operators", {
  id: serial("id").primaryKey(),
  legalName: text("legal_name").notNull(),
  commercialName: text("commercial_name").notNull(),
  ruc: text("ruc"),
  region: text("region").notNull(),
  province: text("province"),
  district: text("district"),
  operatorType: text("operator_type").notNull(),
  niche: text("niche"),
  languages: text("languages").array().notNull().default(["es"]),
  verified: boolean("verified").notNull().default(false),
  ttdmiScore: decimal("ttdmi_score", { precision: 5, scale: 2 }).notNull().default("0"),
  level: text("level").notNull().default("risk"),
  website: text("website"),
  logoUrl: text("logo_url"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  rankNacional: integer("rank_nacional"),
  // MINCETUR-specific fields (populated via CSV ingesta)
  clase: text("clase"),
  modalidadAutorizada: text("modalidad_autorizada"),
  repLegal: text("rep_legal"),
  nroCertificado: text("nro_certificado"),
  fechaExpedicion: text("fecha_expedicion"),
  ubigeo: text("ubigeo"),
  fechaCorte: text("fecha_corte"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOperatorSchema = createInsertSchema(operatorsTable).omit({ id: true, createdAt: true, updatedAt: true, rankNacional: true });
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operatorsTable.$inferSelect;

export const trustScoresTable = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).notNull().default("0"),
  reviewsScore: decimal("reviews_score", { precision: 5, scale: 2 }).notNull().default("0"),
  socialScore: decimal("social_score", { precision: 5, scale: 2 }).notNull().default("0"),
  websiteScore: decimal("website_score", { precision: 5, scale: 2 }).notNull().default("0"),
  seoScore: decimal("seo_score", { precision: 5, scale: 2 }).notNull().default("0"),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).notNull().default("0"),
  formalidadScore: decimal("formalidad_score", { precision: 5, scale: 2 }).notNull().default("0"),
  conversionScore: decimal("conversion_score", { precision: 5, scale: 2 }).notNull().default("0"),
  freshnessScore: decimal("freshness_score", { precision: 5, scale: 2 }).notNull().default("0"),
  networkScore: decimal("network_score", { precision: 5, scale: 2 }).notNull().default("0"),
  validationFactor: decimal("validation_factor", { precision: 4, scale: 3 }).notNull().default("1"),
  scoreDetails: jsonb("score_details"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type TrustScore = typeof trustScoresTable.$inferSelect;

export const socialProfilesTable = pgTable("social_profiles", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  handle: text("handle"),
  followers: integer("followers").notNull().default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  verified: boolean("verified").notNull().default(false),
  lastPostDate: timestamp("last_post_date", { withTimezone: true }),
  postsPerWeek: decimal("posts_per_week", { precision: 5, scale: 2 }),
});

export type SocialProfile = typeof socialProfilesTable.$inferSelect;

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  sentiment: decimal("sentiment", { precision: 4, scale: 3 }),
  reviewDate: timestamp("review_date", { withTimezone: true }).notNull().defaultNow(),
  authenticityScore: decimal("authenticity_score", { precision: 4, scale: 3 }).notNull().default("0.8"),
  reviewCount: integer("review_count").notNull().default(0),
});

export type Review = typeof reviewsTable.$inferSelect;

export const bookingCapabilitiesTable = pgTable("booking_capabilities", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  bookingEngine: boolean("booking_engine").notNull().default(false),
  onlinePayment: boolean("online_payment").notNull().default(false),
  whatsappCta: boolean("whatsapp_cta").notNull().default(false),
  chatbot: boolean("chatbot").notNull().default(false),
  leadForm: boolean("lead_form").notNull().default(false),
  responseTimeHours: decimal("response_time_hours", { precision: 5, scale: 1 }),
  otaPresence: text("ota_presence").array().notNull().default([]),
});

export type BookingCapabilities = typeof bookingCapabilitiesTable.$inferSelect;

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  verified: boolean("verified").notNull().default(false),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
});

export type Certification = typeof certificationsTable.$inferSelect;

export const seoMetricsTable = pgTable("seo_metrics", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  domainAuthority: integer("domain_authority").notNull().default(0),
  backlinks: integer("backlinks").notNull().default(0),
  organicTraffic: integer("organic_traffic").notNull().default(0),
  keywords: integer("keywords").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SeoMetrics = typeof seoMetricsTable.$inferSelect;
