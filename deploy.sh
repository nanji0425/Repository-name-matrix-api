#!/usr/bin/env bash
set -euo pipefail

echo "Starting MatrixAPI deployment..."

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is required."
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    cp .env.production .env
  else
    echo ".env.production is missing."
    exit 1
  fi
fi

echo "Building and starting containers..."
$COMPOSE up --build -d

echo "Waiting for services..."
sleep 20

echo "Initializing database..."
$COMPOSE exec -T backend npx prisma db push --accept-data-loss
$COMPOSE exec -T backend node dist/prisma/seed.js

echo "Service status:"
$COMPOSE ps

echo ""
echo "MatrixAPI deployment complete."
echo "Frontend: http://47.82.105.81"
echo "API docs: http://47.82.105.81/api/docs"
echo "OpenAI-compatible API: http://47.82.105.81/v1"
