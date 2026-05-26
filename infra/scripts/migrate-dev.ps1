# migrate-dev.ps1
# Aplica las migraciones de Prisma a la base de datos local (Docker).
# Los archivos SQL ya están generados en prisma/migrations/
#
# Ejecutar desde la raíz del repo:
#   .\infra\scripts\migrate-dev.ps1
#
# Pre-requisitos:
#   1. Docker Desktop corriendo
#   2. Postgres levantado: docker compose up postgres -d
#   3. pnpm instalado

param(
    [string]$DbHost     = "localhost",
    [string]$DbPort     = "5432",
    [string]$DbName     = "totem_hub",
    [string]$DbUser     = "totem",
    [string]$DbPassword = "totem_dev_password"
)

$ErrorActionPreference = "Stop"
$Root = "C:\Users\Ronaldinhoo\tourup"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Tourup — prisma migrate deploy (15 servicios)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verificar Docker / Postgres ────────────────────────────────────────────
Write-Host "➤ Verificando conexión a PostgreSQL..." -ForegroundColor Yellow
$dockerOk = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker no responde. Levanta Docker Desktop primero." -ForegroundColor Red
    exit 1
}

$pgOk = docker compose -f "$Root\docker-compose.yml" ps postgres 2>$null | Select-String "healthy|running"
if (-not $pgOk) {
    Write-Host "  postgres no está corriendo. Levantando..." -ForegroundColor Yellow
    docker compose -f "$Root\docker-compose.yml" up postgres -d
    Write-Host "  Esperando que postgres esté listo..."
    Start-Sleep -Seconds 8
}
Write-Host "✓ PostgreSQL disponible" -ForegroundColor Green

# ── 2. Servicios ──────────────────────────────────────────────────────────────
$services = @(
  @{name="identity";      schema="identity"},
  @{name="tenancy";       schema="tenancy"},
  @{name="catalog";       schema="catalog"},
  @{name="itineraries";   schema="itineraries"},
  @{name="trips";         schema="trips"},
  @{name="enrollments";   schema="enrollments"},
  @{name="payments";      schema="payments"},
  @{name="subscriptions"; schema="subscriptions"},
  @{name="documents";     schema="documents"},
  @{name="rooming";       schema="rooming"},
  @{name="notifications"; schema="notifications"},
  @{name="assistant";     schema="assistant"},
  @{name="support";       schema="support"},
  @{name="platform";      schema="platform"},
  @{name="audit";         schema="audit"}
)

$ok = @(); $fail = @()

foreach ($svc in $services) {
    $svcName = $svc.name
    $svcDir  = Join-Path $Root "services\$svcName"
    $dbUrl   = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}?schema=$($svc.schema)"

    Write-Host ""
    Write-Host "  [$svcName]" -ForegroundColor White

    Set-Content -Path (Join-Path $svcDir ".env") -Value "DATABASE_URL=$dbUrl" -Encoding utf8
    $env:DATABASE_URL = $dbUrl
    Set-Location $svcDir

    try {
        $out = pnpm exec prisma migrate deploy 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($out -join "`n") }
        $applied = ($out | Select-String "migration").Count
        Write-Host "  ✓ $svcName OK ($applied migrations)" -ForegroundColor Green
        $ok += $svcName
    } catch {
        Write-Host "  ✗ $svcName FALLO: $_" -ForegroundColor Red
        $fail += $svcName
    }
}

# ── 3. Resumen ────────────────────────────────────────────────────────────────
Set-Location $Root
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN: $($ok.Count) OK  |  $($fail.Count) fallidos" -ForegroundColor $(if ($fail.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "=================================================" -ForegroundColor Cyan

if ($fail.Count -gt 0) {
    Write-Host "  Fallidos: $($fail -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "  Genera los clientes Prisma con:" -ForegroundColor Cyan
    Write-Host "  pnpm prisma:generate" -ForegroundColor White
}
