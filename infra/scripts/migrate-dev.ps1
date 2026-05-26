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
#   4. .env en la raíz del repo (copia de .env.example con tus valores)

param(
    [string]$DbHost,
    [string]$DbPort,
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPassword
)

$ErrorActionPreference = "Stop"
$Root = "C:\Users\Ronaldinhoo\tourup"

# ── 1. Leer variables desde el archivo .env de la raíz ───────────────────────
$envFile = Join-Path $Root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        # Ignorar comentarios y líneas vacías; parsear CLAVE=valor
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim()
            # No sobreescribir variables que ya existan en el entorno de la sesión
            if ([string]::IsNullOrEmpty([System.Environment]::GetEnvironmentVariable($k))) {
                [System.Environment]::SetEnvironmentVariable($k, $v)
            }
        }
    }
    Write-Host "✓ Variables de entorno cargadas desde .env" -ForegroundColor DarkGray
} else {
    Write-Host "⚠ No se encontró .env — crea uno desde .env.example" -ForegroundColor Yellow
}

# ── 2. Resolver credenciales (param > env > error) ───────────────────────────
if (-not $DbHost)     { $DbHost     = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" } }
if (-not $DbPort)     { $DbPort     = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" } }
if (-not $DbName)     { $DbName     = $env:POSTGRES_DB }
if (-not $DbUser)     { $DbUser     = $env:POSTGRES_USER }
if (-not $DbPassword) { $DbPassword = $env:POSTGRES_PASSWORD }

if ([string]::IsNullOrEmpty($DbName) -or [string]::IsNullOrEmpty($DbUser) -or [string]::IsNullOrEmpty($DbPassword)) {
    Write-Host ""
    Write-Host "✗ Faltan credenciales de base de datos." -ForegroundColor Red
    Write-Host "  Define en .env (o como variables de entorno):" -ForegroundColor Yellow
    Write-Host "    POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD" -ForegroundColor Yellow
    Write-Host "  Copia .env.example a .env y ajusta los valores." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Tourup — prisma migrate deploy (15 servicios)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ── 3. Verificar Docker / Postgres ────────────────────────────────────────────
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

# ── 4. Servicios ──────────────────────────────────────────────────────────────
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

# ── 5. Resumen ────────────────────────────────────────────────────────────────
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
