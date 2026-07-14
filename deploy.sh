#!/usr/bin/env bash
set -euo pipefail

echo "Starting MatrixAPI New API deployment..."

if [ ! -f .env ]; then
  echo ".env is missing. Copy .env.production.example to .env on the server and fill real secrets."
  exit 1
fi

set -a
. ./.env
set +a

for required in DB_PASSWORD REDIS_PASSWORD SESSION_SECRET CRYPTO_SECRET; do
  if [ -z "${!required:-}" ]; then
    echo "$required is missing in .env"
    exit 1
  fi
done

reject_placeholder() {
  local name="$1"
  local value="${!name:-}"
  case "$value" in
    change-me*|your-*|example|example-*|test|test-*|demo|demo-*)
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

for name in DB_PASSWORD REDIS_PASSWORD SESSION_SECRET CRYPTO_SECRET; do
  reject_placeholder "$name"
done

require_min_length DB_PASSWORD 12
require_min_length REDIS_PASSWORD 12
require_min_length SESSION_SECRET 32
require_min_length CRYPTO_SECRET 32

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
  echo "HTTPS is enabled with /etc/letsencrypt/live/matrixapi.online certificates."
else
  echo "HTTPS certificates were not found on the host; starting HTTP only."
  echo "After issuing certificates, rerun this script to enable port 443."
fi

echo "Pulling dependency images..."
$COMPOSE pull postgres redis nginx

echo "Building the MatrixAPI new-api image..."
$COMPOSE build new-api

echo "Replacing existing MatrixAPI containers if they exist..."
docker rm -f matrixapi-new-api matrixapi-nginx matrixapi-db matrixapi-redis >/dev/null 2>&1 || true

$COMPOSE up -d postgres redis

echo "Waiting for database and cache..."
for attempt in $(seq 1 60); do
  if $COMPOSE exec -T postgres pg_isready -U matrixapi -d new_api >/dev/null 2>&1 && \
     $COMPOSE exec -T redis redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
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

echo "Starting application..."
$COMPOSE up -d --remove-orphans new-api nginx

echo "Waiting for New API..."
for attempt in $(seq 1 90); do
  if curl -fsS http://127.0.0.1/api/status >/dev/null 2>&1; then
    echo "New API is ready."
    break
  fi

  if [ "$attempt" -eq 90 ]; then
    echo "New API did not become ready in time."
    $COMPOSE logs --tail=160 new-api
    exit 1
  fi

  sleep 2
done

echo "Service status:"
$COMPOSE ps

echo "Smoke checks:"
curl -fsS http://127.0.0.1/api/status
echo
curl -fsS http://127.0.0.1/pricing >/dev/null
curl -fsS http://127.0.0.1/console >/dev/null || true

if [ -n "${NEW_API_ADMIN_USERNAME:-}" ] && [ -n "${NEW_API_ADMIN_PASSWORD:-}" ] && \
   [ -n "${UPSTREAM_API_KEY:-}" ] && [ -n "${ZPAY_PID:-}" ] && [ -n "${ZPAY_KEY:-}" ]; then
  echo "Running optional New API bootstrap..."
  if command -v node >/dev/null 2>&1; then
    MATRIXAPI_URL="${MATRIXAPI_URL:-http://127.0.0.1}" node scripts/bootstrap-new-api.mjs || {
      echo "API bootstrap failed; falling back to direct database bootstrap."
      bash scripts/bootstrap-new-api-db.sh
    }
  else
    docker run --rm --network host --env-file .env -e MATRIXAPI_URL="${MATRIXAPI_URL:-http://127.0.0.1}" \
      -v "$PWD/scripts:/scripts:ro" node:22-alpine node /scripts/bootstrap-new-api.mjs || {
        echo "API bootstrap failed; falling back to direct database bootstrap."
        bash scripts/bootstrap-new-api-db.sh
      }
  fi
else
  echo "Skipping optional bootstrap. Set NEW_API_ADMIN_USERNAME, NEW_API_ADMIN_PASSWORD, UPSTREAM_API_KEY, ZPAY_PID, and ZPAY_KEY in .env to enable it."
fi

if [ -n "${NEW_API_ADMIN_USERNAME:-}" ]; then
  echo "Ensuring configured admin account has administrator access..."
  if [ -n "${NEW_API_ADMIN_PASSWORD:-}" ]; then
    if command -v node >/dev/null 2>&1; then
      MATRIXAPI_URL="${MATRIXAPI_URL:-http://127.0.0.1}" node scripts/ensure-new-api-admin.mjs
    else
      docker run --rm --network host \
        -v "$PWD/scripts:/scripts:ro" \
        -e MATRIXAPI_URL="${MATRIXAPI_URL:-http://127.0.0.1}" \
        -e NEW_API_ADMIN_USERNAME="$NEW_API_ADMIN_USERNAME" \
        -e NEW_API_ADMIN_PASSWORD="$NEW_API_ADMIN_PASSWORD" \
        node:22-alpine node /scripts/ensure-new-api-admin.mjs
    fi
  fi
  bash scripts/ensure-new-api-admin-db.sh
fi

echo ""
echo "MatrixAPI New API deployment complete."
echo "Site: https://matrixapi.online"
echo "Console: https://matrixapi.online/dashboard/overview"
echo "Pricing: https://matrixapi.online/pricing"
echo "OpenAI-compatible API: https://matrixapi.online/v1"
