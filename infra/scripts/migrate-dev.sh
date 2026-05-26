#!/usr/bin/env bash
# migrate-dev.sh
# Crea las migraciones iniciales de Prisma para todos los servicios.
# Ejecutar desde la raíz del repo: bash infra/scripts/migrate-dev.sh
#
# Pre-requisitos:
#   1. Docker Desktop corriendo
#   2. Postgres levantado: docker compose up postgres -d
#   3. pnpm instalado
set -euo pipefail

MIGRATION_NAME="${1:-init}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-totem_hub}"
DB_USER="${DB_USER:-totem}"
DB_PASSWORD="${DB_PASSWORD:-totem_dev_password}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Tourup — Prisma migrate dev (todos los servicios)"
echo "════════════════════════════════════════════════════════"
echo ""

# ── 1. Verificar pnpm ─────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  echo "➤ pnpm no encontrado — activando via corepack..."
  corepack enable pnpm
  corepack prepare pnpm@11.3.0 --activate
  echo "✓ pnpm instalado"
else
  echo "✓ pnpm $(pnpm --version) encontrado"
fi

# ── 2. pnpm install ───────────────────────────────────────────────────────────
echo ""
echo "➤ Instalando dependencias del workspace..."
cd "$ROOT"
pnpm install --frozen-lockfile --silent
echo "✓ Dependencias instaladas"

# ── 3. Servicios ─────────────────────────────────────────────────────────────
declare -A SERVICES=(
  [identity]="identity"
  [tenancy]="tenancy"
  [catalog]="catalog"
  [itineraries]="itineraries"
  [trips]="trips"
  [enrollments]="enrollments"
  [payments]="payments"
  [subscriptions]="subscriptions"
  [documents]="documents"
  [rooming]="rooming"
  [notifications]="notifications"
  [assistant]="assistant"
  [support]="support"
  [platform]="platform"
  [audit]="audit"
)

OK=()
FAIL=()

for SVC in "${!SERVICES[@]}"; do
  SCHEMA="${SERVICES[$SVC]}"
  SVC_DIR="$ROOT/services/$SVC"
  DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${SCHEMA}"

  echo ""
  echo "──────────────────────────────────────────────────────"
  echo "  [$SVC]"

  # Crear .env del servicio
  echo "DATABASE_URL=$DB_URL" > "$SVC_DIR/.env"

  cd "$SVC_DIR"
  export DATABASE_URL="$DB_URL"

  MIGRATIONS_DIR="$SVC_DIR/prisma/migrations"
  if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
    echo "  → Aplicando migraciones existentes..."
    if pnpm exec prisma migrate deploy --schema prisma/schema.prisma 2>&1; then
      echo "  ✓ $SVC — OK"
      OK+=("$SVC")
    else
      echo "  ✗ $SVC — FALLO"
      FAIL+=("$SVC")
    fi
  else
    echo "  → Creando migración inicial..."
    if pnpm exec prisma migrate dev --name "$MIGRATION_NAME" --schema prisma/schema.prisma --skip-seed 2>&1; then
      echo "  ✓ $SVC — OK"
      OK+=("$SVC")
    else
      echo "  ✗ $SVC — FALLO"
      FAIL+=("$SVC")
    fi
  fi
done

# ── 4. Resumen ────────────────────────────────────────────────────────────────
cd "$ROOT"
echo ""
echo "════════════════════════════════════════════════════════"
echo "  RESUMEN"
echo "════════════════════════════════════════════════════════"
echo "  ✓ Exitosos (${#OK[@]}): ${OK[*]}"

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
