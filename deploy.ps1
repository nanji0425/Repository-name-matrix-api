# MatrixAPI deployment - New API core
$ErrorActionPreference = "Stop"

Write-Host "Starting MatrixAPI New API deployment..."

function Get-EnvValue($Name) {
  if (-not $envMap.ContainsKey($Name)) {
    return ""
  }
  return [string]$envMap[$Name]
}

function Reject-Placeholder($Name) {
  $value = Get-EnvValue $Name
  if ($value -match '^(change-me|your-|example|example-|test|test-|demo|demo-)') {
    throw "$Name still contains a placeholder value. Fill a real production value in .env."
  }
}

function Require-MinLength($Name, $Min) {
  $value = Get-EnvValue $Name
  if ($value.Length -lt $Min) {
    throw "$Name must be at least $Min characters."
  }
}

function Backup-LegacyDatabase {
  $containerNames = docker ps --format "{{.Names}}"
  if ($containerNames -contains "matrixapi-db") {
    docker exec matrixapi-db psql -U matrixapi -d matrix_api -tAc "select 1" *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "matrixapi-db is running, but the legacy matrix_api database is not present; skipping legacy DB backup."
      return
    }

    $backupDir = if ($envMap["LEGACY_BACKUP_DIR"]) { $envMap["LEGACY_BACKUP_DIR"] } else { "/root/matrixapi-backups" }
    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    $backupFile = "$backupDir/matrix_api_legacy_$stamp.sql"

    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Backing up legacy MatrixAPI database to $backupFile..."
    cmd /c "docker exec matrixapi-db pg_dump -U matrixapi matrix_api > `"$backupFile`""
    if ($LASTEXITCODE -ne 0) {
      Remove-Item $backupFile -Force -ErrorAction SilentlyContinue
      throw "Legacy database backup failed. Stop here instead of risking a migration without a fallback."
    }
    Write-Host "Legacy database backup created."
  }
}

if (-not (Test-Path ".env")) {
  throw ".env is missing. Copy .env.production.example to .env on the server and fill real secrets."
}

$envMap = @{}
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $key, $value = $line.Split("=", 2)
    $envMap[$key.Trim()] = $value.Trim().Trim('"')
  }
}

@("DB_PASSWORD", "REDIS_PASSWORD", "SESSION_SECRET", "CRYPTO_SECRET") | ForEach-Object {
  if (-not $envMap.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envMap[$_])) {
    throw "$_ is missing in .env"
  }
  Reject-Placeholder $_
}

Require-MinLength "DB_PASSWORD" 12
Require-MinLength "REDIS_PASSWORD" 12
Require-MinLength "SESSION_SECRET" 32
Require-MinLength "CRYPTO_SECRET" 32

$compose = "docker compose"
docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  $compose = "docker-compose"
  docker-compose version *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose is required."
  }
}

New-Item -ItemType Directory -Path "nginx/conf.d" -Force | Out-Null
New-Item -ItemType Directory -Path "/var/www/certbot" -Force | Out-Null
Remove-Item "nginx/conf.d/ssl.conf" -Force -ErrorAction SilentlyContinue
Remove-Item "nginx/conf.d/https-redirect.conf" -Force -ErrorAction SilentlyContinue
if ((Test-Path "/etc/letsencrypt/live/matrixapi.online/fullchain.pem") -and (Test-Path "/etc/letsencrypt/live/matrixapi.online/privkey.pem")) {
  Copy-Item "nginx/ssl.conf.template" "nginx/conf.d/ssl.conf" -Force
  Write-Host "HTTPS is enabled with /etc/letsencrypt/live/matrixapi.online certificates."
} else {
  Write-Host "HTTPS certificates were not found on the host; starting HTTP only."
  Write-Host "After issuing certificates, rerun this script to enable port 443."
}

Backup-LegacyDatabase

Write-Host "Pulling images and starting dependencies..."
Invoke-Expression "$compose pull"

Write-Host "Stopping legacy containers if they exist..."
docker rm -f matrixapi-backend matrixapi-frontend matrixapi-nginx matrixapi-db matrixapi-redis *> $null

Invoke-Expression "$compose up -d postgres redis"

Write-Host "Waiting for database and cache..."
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $postgresReady = $false
  $redisReady = $false
  try {
    Invoke-Expression "$compose exec -T postgres pg_isready -U matrixapi -d new_api" | Out-Null
    if ($LASTEXITCODE -eq 0) { $postgresReady = $true }
  } catch {}
  try {
    Invoke-Expression "$compose exec -T redis redis-cli -a `"$($envMap["REDIS_PASSWORD"])`" ping" | Out-Null
    if ($LASTEXITCODE -eq 0) { $redisReady = $true }
  } catch {}

  if ($postgresReady -and $redisReady) {
    Write-Host "Dependencies are healthy."
    break
  }

  if ($attempt -eq 60) {
    Write-Host "Dependencies did not become healthy in time."
    Invoke-Expression "$compose ps"
    Invoke-Expression "$compose logs --tail=120 postgres redis"
    throw "Dependencies did not become healthy in time."
  }

  Start-Sleep -Seconds 2
}

Write-Host "Starting application..."
Invoke-Expression "$compose up -d --remove-orphans new-api nginx"

Write-Host "Waiting for New API..."
for ($attempt = 1; $attempt -le 90; $attempt++) {
  try {
    Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/api/status" -TimeoutSec 5 | Out-Null
    Write-Host "New API is ready."
    break
  } catch {
    if ($attempt -eq 90) {
      Write-Host "New API did not become ready in time."
      Invoke-Expression "$compose logs --tail=160 new-api"
      throw
    }
    Start-Sleep -Seconds 2
  }
}

Invoke-Expression "$compose ps"

Write-Host "Smoke checks:"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/api/status" | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/pricing" | Out-Null

if ($envMap["NEW_API_ADMIN_USERNAME"] -and $envMap["NEW_API_ADMIN_PASSWORD"] -and $envMap["UPSTREAM_API_KEY"] -and $envMap["ZPAY_PID"] -and $envMap["ZPAY_KEY"]) {
  Write-Host "Running optional New API bootstrap..."
  $env:MATRIXAPI_URL = if ($envMap["MATRIXAPI_URL"]) { $envMap["MATRIXAPI_URL"] } else { "http://127.0.0.1" }
  $env:NEW_API_ADMIN_USERNAME = $envMap["NEW_API_ADMIN_USERNAME"]
  $env:NEW_API_ADMIN_PASSWORD = $envMap["NEW_API_ADMIN_PASSWORD"]
  $env:UPSTREAM_BASE_URL = $envMap["UPSTREAM_BASE_URL"]
  $env:UPSTREAM_API_KEY = $envMap["UPSTREAM_API_KEY"]
  $env:ZPAY_GATEWAY = $envMap["ZPAY_GATEWAY"]
  $env:ZPAY_PID = $envMap["ZPAY_PID"]
  $env:ZPAY_KEY = $envMap["ZPAY_KEY"]
  $env:NEW_API_GROUP_RATIO = $envMap["NEW_API_GROUP_RATIO"]
  $env:NEW_API_TOPUP_GROUP_RATIO = $envMap["NEW_API_TOPUP_GROUP_RATIO"]
  $env:NEW_API_DEFAULT_MODELS = $envMap["NEW_API_DEFAULT_MODELS"]
  $env:NEW_API_MIN_TOPUP = $envMap["NEW_API_MIN_TOPUP"]
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    node scripts/bootstrap-new-api.mjs
  } else {
    docker run --rm --network host --env-file .env -e "MATRIXAPI_URL=$($env:MATRIXAPI_URL)" -v "${PWD}/scripts:/scripts:ro" node:22-alpine node /scripts/bootstrap-new-api.mjs
  }
} else {
  Write-Host "Skipping optional bootstrap. Set NEW_API_ADMIN_USERNAME, NEW_API_ADMIN_PASSWORD, UPSTREAM_API_KEY, ZPAY_PID, and ZPAY_KEY in .env to enable it."
}

if ($envMap["NEW_API_ADMIN_USERNAME"]) {
  Write-Host "Ensuring configured admin account has administrator access..."
  $env:NEW_API_ADMIN_USERNAME = $envMap["NEW_API_ADMIN_USERNAME"]
  if ($envMap["NEW_API_ADMIN_PASSWORD"]) {
    $env:MATRIXAPI_URL = if ($envMap["MATRIXAPI_URL"]) { $envMap["MATRIXAPI_URL"] } else { "http://127.0.0.1" }
    $env:NEW_API_ADMIN_PASSWORD = $envMap["NEW_API_ADMIN_PASSWORD"]
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
      node scripts/ensure-new-api-admin.mjs
    } else {
      docker run --rm --network host `
        -v "${PWD}/scripts:/scripts:ro" `
        -e "MATRIXAPI_URL=$($env:MATRIXAPI_URL)" `
        -e "NEW_API_ADMIN_USERNAME=$($env:NEW_API_ADMIN_USERNAME)" `
        -e "NEW_API_ADMIN_PASSWORD=$($env:NEW_API_ADMIN_PASSWORD)" `
        node:22-alpine node /scripts/ensure-new-api-admin.mjs
    }
  }
  bash scripts/ensure-new-api-admin-db.sh
}

Write-Host ""
Write-Host "MatrixAPI New API deployment complete."
Write-Host "Site: https://matrixapi.online"
Write-Host "Console: https://matrixapi.online/console"
Write-Host "Pricing: https://matrixapi.online/pricing"
Write-Host "OpenAI-compatible API: https://matrixapi.online/v1"
