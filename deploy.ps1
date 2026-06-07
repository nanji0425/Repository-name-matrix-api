# MatrixAPI deployment - new server 47.82.105.81
$ErrorActionPreference = "Stop"

Write-Host "Starting MatrixAPI deployment..."

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.production") {
    Copy-Item ".env.production" ".env"
  } else {
    throw ".env.production is missing."
  }
}

$compose = "docker compose"
docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
  $compose = "docker-compose"
}

Invoke-Expression "$compose up --build -d"
Start-Sleep -Seconds 20
Invoke-Expression "$compose exec -T backend npx prisma db push --accept-data-loss"
Invoke-Expression "$compose exec -T backend node dist/prisma/seed.js"
Invoke-Expression "$compose ps"

Write-Host ""
Write-Host "MatrixAPI deployment complete."
Write-Host "Frontend: http://47.82.105.81"
Write-Host "API docs: http://47.82.105.81/api/docs"
Write-Host "OpenAI-compatible API: http://47.82.105.81/v1"
