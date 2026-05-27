# TTDMI — Directorio Inteligente de Prestadores Turísticos del Perú

Tourism Trust & Digital Maturity Index: directorio de inteligencia turística con motor de scoring TTDMI, rankings dinámicos, analytics dashboard y perfiles de operadores.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/turismo-peru run dev` — Frontend Vite (port auto)
- `pnpm run typecheck` — typecheck completo en todos los paquetes
- `pnpm run build` — typecheck + build todos los paquetes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks y schemas desde OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema (solo dev)
- Env requeridos: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + shadcn/ui + Recharts
- API: Express 5 + Zod validation + pino logging
- DB: PostgreSQL + Drizzle ORM
- Codegen: Orval (OpenAPI → React Query hooks + Zod schemas)
- Router: wouter (frontend) con BASE_URL desde Vite env

## Where things live

- `lib/db/src/schema/operators.ts` — schema maestro: 7 tablas (operators, trust_scores, social_profiles, reviews, booking_capabilities, certifications, seo_metrics)
- `lib/api-spec/openapi.yaml` — contrato OpenAPI (fuente de verdad)
- `lib/api-client-react/src/generated/` — hooks React Query generados por Orval
- `artifacts/api-server/src/routes/` — operadores.ts, rankings.ts, analytics.ts
- `artifacts/turismo-peru/src/pages/` — HomePage, DirectorioPage, RankingsPage, AnalyticsPage, OperatorDetailPage, NuevoOperadorPage
- `artifacts/turismo-peru/src/components/` — Layout, LevelBadge, ScoreGauge
- `artifacts/turismo-peru/src/index.css` — paleta peruana: terracota (primary), oro inca (secondary), verde amazónico

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → hooks tipados en el frontend. Nunca editar archivos generados en `/generated/`.
- TTDMI Score = suma ponderada de 8 dimensiones × validation_factor (certificaciones). Lógica en `api-server/src/routes/operators.ts`.
- Niveles TTDMI: elite(90-100), premium(80-89), advanced(70-79), growing(60-69), emerging(40-59), risk(0-39).
- Rankings dinámicos calculados en SQL con CTEs. 6 tipos: nacional, trust, conversion, seo, freshness, hidden_gems.
- Analytics endpoints con SQL aggregations: distribución, región, nicho, hidden gems, digital gaps, score trend.

## Product

- **Directorio**: tabla filtrable (región, tipo, nicho, nivel) con paginación y búsqueda en tiempo real
- **Rankings**: 6 clasificaciones dinámicas con indicadores de cambio de posición
- **Operator Detail**: score gauge, radar chart 8 dimensiones, barras de subscores, redes sociales, booking capabilities, reputación online, certificaciones
- **Analytics Dashboard**: KPIs, distribución pie, trend line, barras por región y nicho, hidden gems, digital gaps
- **Registro**: formulario multi-step 3 pasos con validación Zod

## User preferences

- Idioma: español peruano en toda la UI
- Paleta: terracota andina (#F97316), oro inca (#D4AF37), verde amazónico (#10B981)
- 20 operadores turísticos reales del Perú sembrados como datos de demostración

## Gotchas

- Vite usa BASE_URL desde env — siempre usar `import.meta.env.BASE_URL` para rutas, nunca hardcodear `/`.
- El router de wouter debe recibir `base={import.meta.env.BASE_URL.replace(/\/$/, "")}` para funcionar detrás del proxy.
- Los archivos en `lib/api-client-react/src/generated/` son auto-generados — no editar manualmente.
- `pnpm --filter @workspace/api-spec run codegen` debe ejecutarse después de cualquier cambio al OpenAPI spec.
- Para arrays vacíos en PostgreSQL: usar `ARRAY[]::text[]` explícitamente.

## Pointers

- Ver `pnpm-workspace` skill para estructura del workspace, TypeScript setup y detalles de paquetes
- Ver `lib/api-spec/openapi.yaml` para el contrato completo de la API
