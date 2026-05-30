"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_DIRECTORIO_API_URL ?? "http://localhost:8080";

export interface Operator {
  id: number;
  commercial_name: string;
  legal_name: string;
  ruc?: string;
  region: string;
  province?: string;
  district?: string;
  clase?: string;
  operator_type?: string;
  modalidad_autorizada?: string;
  rep_legal?: string;
  nro_certificado?: string;
  fecha_expedicion?: string;
  ubigeo?: string;
  source?: string;
  website?: string;
  phone?: string;
  email?: string;
  niche?: string;
  languages?: string[];
  verified?: boolean;
  level: string;
  ttdmi_score: number;
  description?: string;
  score_breakdown?: {
    reviews_score: number;
    social_score: number;
    website_score: number;
    seo_score: number;
    engagement_score: number;
    formalidad_score: number;
    conversion_score: number;
    freshness_score: number;
    network_score: number;
    validation_factor: number;
  } | null;
  social_profiles?: {
    id: number;
    platform: string;
    handle?: string;
    followers: number;
    engagement_rate: number;
    verified: boolean;
  }[];
  reviews_summary?: {
    average_rating: number;
    total_reviews: number;
    authenticity_score: number;
    sentiment_score?: number;
    recency_score?: number;
    sources?: { source: string; count: number; avg_rating: number }[];
  } | null;
  booking_capabilities?: {
    booking_engine: boolean;
    online_payment: boolean;
    whatsapp_cta: boolean;
    chatbot: boolean;
    lead_form: boolean;
    response_time_hours?: number | null;
    ota_presence?: string[];
  } | null;
  certifications?: {
    id: number;
    name: string;
    issuer: string;
    verified: boolean;
  }[];
}

export interface ListResult {
  data: Operator[];
  total: number;
  page: number;
  limit: number;
}

export interface RankingEntry {
  rank: number;
  operator_id: number;
  commercial_name: string;
  region: string;
  operator_type: string;
  niche?: string;
  ttdmi_score: number;
  level: string;
  verified: boolean;
  rank_change: number | null;
}

export interface AnalyticsSummary {
  total_operators: number;
  verified_operators: number;
  avg_ttdmi_score: number;
  elite_count: number;
  digital_gap_operators: number;
  hidden_gems_count: number;
  top_region: string;
}

function useFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = () => setTick((t) => t + 1);
  return { data, isLoading, refetch };
}

export function useListOperators(params: Record<string, string | number>) {
  const qs = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => { acc[k] = String(v); return acc; }, {})
  ).toString();
  return useFetch<ListResult>(`${API}/api/operators?${qs}`, [JSON.stringify(params)]);
}

export function useGetOperator(id: number) {
  return useFetch<Operator>(`${API}/api/operators/${id}`, [id]);
}

export function useGetRankings(params: { type: string; limit?: number }) {
  const qs = new URLSearchParams({ type: params.type, limit: String(params.limit ?? 20) }).toString();
  return useFetch<{ data: RankingEntry[] }>(`${API}/api/rankings?${qs}`, [params.type, params.limit]);
}

export function useAnalyticsSummary() {
  return useFetch<AnalyticsSummary>(`${API}/api/analytics/summary`, []);
}

export function useScoreDistribution() {
  return useFetch<{ level: string; label: string; count: number; avg_score: number; color: string }[]>(
    `${API}/api/analytics/score-distribution`, []
  );
}

export function useRegionStats() {
  return useFetch<{ region: string; count: number; avg_score: number; elite_count: number }[]>(
    `${API}/api/analytics/regions`, []
  );
}

export function useNicheStats() {
  return useFetch<{ niche: string; count: number; avg_score: number }[]>(
    `${API}/api/analytics/niches`, []
  );
}

export function useHiddenGems(limit = 6) {
  return useFetch<{ operator_id: number; commercial_name: string; region: string; ttdmi_score: number; potential_score: number; insight: string }[]>(
    `${API}/api/analytics/hidden-gems?limit=${limit}`, [limit]
  );
}

export function useDigitalGaps(limit = 6) {
  return useFetch<{ operator_id: number; commercial_name: string; region: string; operator_type: string; digital_score: number; gap: number; recommendation: string }[]>(
    `${API}/api/analytics/digital-gaps?limit=${limit}`, [limit]
  );
}

export function useScoreTrend() {
  return useFetch<{ month: string; avg_score: number }[]>(
    `${API}/api/analytics/score-trend`, []
  );
}
