#!/bin/bash
# ============================================
# MatrixAPI Deployment Script
# Target: 43.154.77.5
# ============================================

set -e

echo "🚀 Starting MatrixAPI deployment..."

# 1. Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install: curl -fsSL https://get.docker.com | sh"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ docker-compose is required"; exit 1; }

# 2. Generate secrets
if [ ! -f .env ]; then
  echo "🔑 Generating production secrets..."
  cat > .env << EOF
# MatrixAPI Production Environment
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
OPENAI_API_KEY=${OPENAI_API_KEY:-"sk-your-key-here"}
EOF
  echo "✅ .env file created"
fi

# 3. Create nginx/sites directory
mkdir -p nginx/sites

# 4. Install SSL certificate (if domain is set)
if [ -n "$DOMAIN" ]; then
  echo "🔒 Setting up SSL for $DOMAIN..."
  docker run --rm -it \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN
fi

# 5. Pull latest images and rebuild
echo "🏗️  Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# 6. Run database migrations
echo "🗄️  Running database migrations..."
sleep 10  # Wait for PostgreSQL to be ready
docker-compose exec -T backend npx prisma migrate deploy
docker-compose exec -T backend npx ts-node prisma/seed.ts

# 7. Check status
echo "📊 Checking deployment status..."
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: http://$(curl -s ifconfig.me):3001"
echo "   API:      http://$(curl -s ifconfig.me):3000/api"
echo "   Docs:     http://$(curl -s ifconfig.me):3000/api/docs"
echo ""
echo "   For SSL, set DOMAIN=your-domain.com and re-run this script"
