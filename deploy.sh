#!/usr/bin/env bash
set -euo pipefail

echo "Starting MatrixAPI deployment..."

if [ ! -f .env ]; then
  echo ".env is missing. Copy .env.production.example to .env on the server and fill real secrets."
  exit 1
fi

set -a
. ./.env
set +a

for required in DB_PASSWORD JWT_SECRET ADMIN_PASSWORD UPSTREAM_API_KEY NEXT_PUBLIC_API_URL FRONTEND_URL FRONTEND_URLS API_PUBLIC_URL ZPAY_PID ZPAY_KEY ZPAY_NOTIFY_URL ZPAY_RETURN_URL; do
  if [ -z "${!required:-}" ]; then
    echo "$required is missing in .env"
    exit 1
  fi
done

reject_placeholder() {
  local name="$1"
  local value="${!name:-}"
  case "$value" in
    change-me*|sk-change-me|your-*|example|example-*|test|test-*|demo|demo-*)
      echo "$name still contains a placeholder value. Fill a real production value in .env."
      exit 1
      ;;
  esac
}

require_min_length() {
  local name="$1"
  local min="$2"
  local value="${!name:-}"
  if [ "${#value}" -lt "$min" ]; then
    echo "$name must be at least $min characters."
    exit 1
  fi
}

require_http_url() {
  local name="$1"
  local value="${!name:-}"
  case "$value" in
    http://*|https://*) ;;
    *)
      echo "$name must start with http:// or https://"
      exit 1
      ;;
  esac
}

for name in DB_PASSWORD JWT_SECRET ADMIN_PASSWORD UPSTREAM_API_KEY NEXT_PUBLIC_API_URL FRONTEND_URL FRONTEND_URLS API_PUBLIC_URL ZPAY_PID ZPAY_KEY ZPAY_NOTIFY_URL ZPAY_RETURN_URL; do
  reject_placeholder "$name"
done

require_min_length JWT_SECRET 32
require_min_length ADMIN_PASSWORD 12
require_min_length DB_PASSWORD 12
require_min_length ZPAY_KEY 16
require_min_length ZPAY_PID 8
require_min_length UPSTREAM_API_KEY 20

require_http_url NEXT_PUBLIC_API_URL
require_http_url FRONTEND_URL
require_http_url API_PUBLIC_URL
require_http_url ZPAY_NOTIFY_URL
require_http_url ZPAY_RETURN_URL

if [ -n "${UPSTREAM_BASE_URL:-}" ]; then
  require_http_url UPSTREAM_BASE_URL
fi

if [ -n "${ZPAY_GATEWAY:-}" ]; then
  require_http_url ZPAY_GATEWAY
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is required."
  exit 1
fi

mkdir -p nginx/conf.d
mkdir -p /var/www/certbot
rm -f nginx/conf.d/ssl.conf
rm -f nginx/conf.d/https-redirect.conf
if [ -f /etc/letsencrypt/live/matrixapi.online/fullchain.pem ] && [ -f /etc/letsencrypt/live/matrixapi.online/privkey.pem ]; then
  cp nginx/ssl.conf.template nginx/conf.d/ssl.conf
  cp nginx/https-redirect.conf.template nginx/conf.d/https-redirect.conf
  echo "HTTPS is enabled with /etc/letsencrypt/live/matrixapi.online certificates."
else
  echo "HTTPS certificates were not found on the host; starting HTTP only."
  echo "After issuing certificates, rerun this script to enable port 443."
fi

echo "Building images and starting dependencies..."
$COMPOSE build backend frontend
$COMPOSE up -d postgres redis

echo "Waiting for database and cache..."
for attempt in $(seq 1 60); do
  if $COMPOSE exec -T postgres pg_isready -U matrixapi >/dev/null 2>&1 && \
     $COMPOSE exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo "Dependencies are healthy."
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "Dependencies did not become healthy in time."
    $COMPOSE ps
    $COMPOSE logs --tail=120 postgres redis
    exit 1
  fi

  sleep 2
done

echo "Initializing database..."
$COMPOSE run --rm --no-deps backend npx prisma db push --accept-data-loss
$COMPOSE run --rm --no-deps backend node dist/prisma/seed.js

echo "Starting application services..."
$COMPOSE up -d backend frontend nginx

echo "Waiting for services..."
for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1/api/health/ready >/dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "Backend did not become ready in time."
    $COMPOSE logs --tail=120 backend
    exit 1
  fi

  sleep 2
done

echo "Service status:"
$COMPOSE ps

echo "Smoke checks:"
curl -fsS http://127.0.0.1/api/health
echo
curl -fsS http://127.0.0.1/api/health/ready
echo
curl -fsS http://127.0.0.1/v1/models >/dev/null
echo "Gateway model list is reachable."

echo ""
echo "MatrixAPI deployment complete."
echo "Frontend: https://matrixapi.online"
echo "API docs: https://matrixapi.online/api/docs"
echo "OpenAI-compatible API: https://matrixapi.online/v1"
