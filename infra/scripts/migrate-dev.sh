#!/usr/bin/env bash
# migrate-dev.sh
# Aplica las migraciones de Prisma a la base de datos local (Docker).
# Los archivos SQL ya están generados en prisma/migrations/
#
# Ejecutar desde la raíz del repo: bash infra/scripts/migrate-dev.sh
#
# Pre-requisitos:
#   1. Docker Desktop corriendo
#   2. Postgres levantado: docker compose up postgres -d
#   3. pnpm instalado
#   4. .env en la raíz del repo (copia de .env.example con tus valores)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ── 1. Leer variables desde el archivo .env de la raíz ───────────────────────
ENV_FILE="$ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  # Carga las variables pero no sobreescribe las que ya están en el entorno
  while IFS='=' read -r key value; do
    # Ignorar líneas vacías y comentarios
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Ignorar si la variable ya está definida en el entorno
    [[ -z "${!key+x}" ]] && export "$key=$value"
  done < <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$')
  echo "✓ Variables de entorno cargadas desde .env"
else
  echo "⚠ No se encontró .env — crea uno desde .env.example" >&2
fi

# ── 2. Resolver credenciales (env > error) ────────────────────────────────────
# POSTGRES_HOST y POSTGRES_PORT tienen defaults seguros (no sensibles)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

# POSTGRES_DB, POSTGRES_USER y POSTGRES_PASSWORD son requeridos — fallan si no están definidos
DB_NAME="${POSTGRES_DB:?'POSTGRES_DB no está definido. Crea .env desde .env.example.'}"
DB_USER="${POSTGRES_USER:?'POSTGRES_USER no está definido. Crea .env desde .env.example.'}"
DB_PASSWORD="${POSTGRES_PASSWORD:?'POSTGRES_PASSWORD no está definido. Crea .env desde .env.example.'}"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Tourup — Prisma migrate deploy (15 servicios)"
echo "════════════════════════════════════════════════════════"
echo ""

# ── 3. Verificar pnpm ─────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  echo "➤ pnpm no encontrado — activando via corepack..."
  corepack enable pnpm
  corepack prepare pnpm@11.3.0 --activate
  echo "✓ pnpm instalado"
else
  echo "✓ pnpm $(pnpm --version) encontrado"
fi

# ── 4. Servicios ─────────────────────────────────────────────────────────────
SERVICES=(
  "identity:identity"
  "tenancy:tenancy"
  "catalog:catalog"
  "itineraries:itineraries"
  "trips:trips"
  "enrollments:enrollments"
  "payments:payments"
  "subscriptions:subscriptions"
  "documents:documents"
  "rooming:rooming"
  "notifications:notifications"
  "assistant:assistant"
  "support:support"
  "platform:platform"
  "audit:audit"
)

OK=()
FAIL=()

for ENTRY in "${SERVICES[@]}"; do
  SVC="${ENTRY%%:*}"
  SCHEMA="${ENTRY##*:}"
  SVC_DIR="$ROOT/services/$SVC"
  DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${SCHEMA}"

  echo ""
  echo "──────────────────────────────────────────────────────"
  echo "  [$SVC]"

  # Crear .env del servicio con la DATABASE_URL generada
  echo "DATABASE_URL=$DB_URL" > "$SVC_DIR/.env"

  cd "$SVC_DIR"
  export DATABASE_URL="$DB_URL"

  if pnpm exec prisma migrate deploy 2>&1; then
    echo "  ✓ $SVC — OK"
    OK+=("$SVC")
  else
    echo "  ✗ $SVC — FALLO"
    FAIL+=("$SVC")
  fi
done

# ── 5. Resumen ────────────────────────────────────────────────────────────────
cd "$ROOT"
echo ""
echo "════════════════════════════════════════════════════════"
echo "  RESUMEN"
echo "════════════════════════════════════════════════════════"
echo "  ✓ Exitosos (${#OK[@]}): ${OK[*]:-ninguno}"

if [ ${#FAIL[@]} -gt 0 ]; then
  echo "  ✗ Fallidos (${#FAIL[@]}): ${FAIL[*]}"
  echo ""
  echo "  Verifica que:"
  echo "    1. Docker Desktop está corriendo"
  echo "    2. El contenedor postgres está levantado: docker compose up postgres -d"
  echo "    3. Las credenciales en .env son correctas"
  exit 1
else
  echo ""
  echo "  Todas las migraciones aplicadas exitosamente."
  echo "  Genera los clientes Prisma con: pnpm prisma:generate"
fi
