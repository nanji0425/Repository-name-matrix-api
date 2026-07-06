# MatrixAPI deployment - new server 47.82.105.81
$ErrorActionPreference = "Stop"

Write-Host "Starting MatrixAPI deployment..."

function Get-EnvValue($Name) {
  if (-not $envMap.ContainsKey($Name)) {
    return ""
  }
  return [string]$envMap[$Name]
}

function Reject-Placeholder($Name) {
  $value = Get-EnvValue $Name
  if ($value -match '^(change-me|sk-change-me|your-|example|example-|test|test-|demo|demo-)') {
    throw "$Name still contains a placeholder value. Fill a real production value in .env."
  }
}

function Require-MinLength($Name, $Min) {
  $value = Get-EnvValue $Name
  if ($value.Length -lt $Min) {
    throw "$Name must be at least $Min characters."
  }
}

function Require-HttpUrl($Name) {
  $value = Get-EnvValue $Name
  if ($value -notmatch '^https?://') {
    throw "$Name must start with http:// or https://"
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

@("DB_PASSWORD", "JWT_SECRET", "ADMIN_PASSWORD", "UPSTREAM_API_KEY", "NEXT_PUBLIC_API_URL", "FRONTEND_URL", "FRONTEND_URLS", "API_PUBLIC_URL", "ZPAY_PID", "ZPAY_KEY", "ZPAY_NOTIFY_URL", "ZPAY_RETURN_URL") | ForEach-Object {
  if (-not $envMap.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envMap[$_])) {
    throw "$_ is missing in .env"
  }
}

@("DB_PASSWORD", "JWT_SECRET", "ADMIN_PASSWORD", "UPSTREAM_API_KEY", "NEXT_PUBLIC_API_URL", "FRONTEND_URL", "FRONTEND_URLS", "API_PUBLIC_URL", "ZPAY_PID", "ZPAY_KEY", "ZPAY_NOTIFY_URL", "ZPAY_RETURN_URL") | ForEach-Object {
  Reject-Placeholder $_
}

Require-MinLength "JWT_SECRET" 32
Require-MinLength "ADMIN_PASSWORD" 12
Require-MinLength "DB_PASSWORD" 12
Require-MinLength "ZPAY_KEY" 16
Require-MinLength "ZPAY_PID" 8
Require-MinLength "UPSTREAM_API_KEY" 20

@("NEXT_PUBLIC_API_URL", "FRONTEND_URL", "API_PUBLIC_URL", "ZPAY_NOTIFY_URL", "ZPAY_RETURN_URL") | ForEach-Object {
  Require-HttpUrl $_
}

if ($envMap.ContainsKey("UPSTREAM_BASE_URL") -and -not [string]::IsNullOrWhiteSpace($envMap["UPSTREAM_BASE_URL"])) {
  Require-HttpUrl "UPSTREAM_BASE_URL"
}

if ($envMap.ContainsKey("ZPAY_GATEWAY") -and -not [string]::IsNullOrWhiteSpace($envMap["ZPAY_GATEWAY"])) {
  Require-HttpUrl "ZPAY_GATEWAY"
}

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
  Copy-Item "nginx/https-redirect.conf.template" "nginx/conf.d/https-redirect.conf" -Force
  Write-Host "HTTPS is enabled with /etc/letsencrypt/live/matrixapi.online certificates."
} else {
  Write-Host "HTTPS certificates were not found on the host; starting HTTP only."
  Write-Host "After issuing certificates, rerun this script to enable port 443."
}

Write-Host "Building images and starting dependencies..."
Invoke-Expression "$compose build backend frontend"
Invoke-Expression "$compose up -d postgres redis"

Write-Host "Waiting for database and cache..."
for ($attempt = 1; $attempt -le 60; $attempt++) {
  $postgresReady = $false
  $redisReady = $false
  try {
    Invoke-Expression "$compose exec -T postgres pg_isready -U matrixapi" | Out-Null
    if ($LASTEXITCODE -eq 0) { $postgresReady = $true }
  } catch {}
  try {
    Invoke-Expression "$compose exec -T redis redis-cli ping" | Out-Null
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

Write-Host "Initializing database..."
Invoke-Expression "$compose run --rm --no-deps backend npx prisma db push --accept-data-loss"
Invoke-Expression "$compose run --rm --no-deps backend node dist/prisma/seed.js"

Write-Host "Starting application services..."
Invoke-Expression "$compose up -d backend frontend nginx"

Write-Host "Waiting for services..."
for ($attempt = 1; $attempt -le 60; $attempt++) {
  try {
    Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/api/health/ready" -TimeoutSec 5 | Out-Null
    Write-Host "Backend is ready."
    break
  } catch {
    if ($attempt -eq 60) {
      Write-Host "Backend did not become ready in time."
      Invoke-Expression "$compose logs --tail=120 backend"
      throw
    }
    Start-Sleep -Seconds 2
  }
}

Invoke-Expression "$compose ps"

Write-Host "Smoke checks:"
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/api/health" | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/api/health/ready" | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1/v1/models" | Out-Null
Write-Host "Gateway model list is reachable."

Write-Host ""
Write-Host "MatrixAPI deployment complete."
Write-Host "Frontend: https://matrixapi.online"
Write-Host "API docs: https://matrixapi.online/api/docs"
Write-Host "OpenAI-compatible API: https://matrixapi.online/v1"
