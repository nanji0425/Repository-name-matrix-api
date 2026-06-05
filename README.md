# MatrixAPI - AI Model Aggregation Platform

Unified API for GPT, Claude, Gemini, DeepSeek, Qwen, Grok and more.

## 🚀 Deploy to Cloud Server (43.154.77.5)

### 1. SSH into server
```bash
ssh root@43.154.77.5
```

### 2. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Upload project
```bash
# From your local machine:
scp -r /path/to/matrix-api root@43.154.77.5:/opt/
```

### 4. Deploy
```bash
cd /opt/matrix-api
export OPENAI_API_KEY="sk-zHnceNpfUBAdct7O70dU5XlJeICxbC2M89C5bY7VvOCeO5jP"
docker compose up --build -d

# Wait for DB, then seed
sleep 15
docker compose exec backend npx prisma db push
docker compose exec backend npx ts-node prisma/seed.ts
```

### 5. Access
| Service | URL |
|---------|-----|
| Web App | `http://43.154.77.5` |
| API | `http://43.154.77.5/api` |
| API Docs | `http://43.154.77.5/api/docs` |
| OpenAI Compatible | `http://43.154.77.5/v1/chat/completions` |

## 📖 Quick Start (Local Dev)

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## 🔑 Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123456 |
| User | demo | user123456 |

## 🏗️ Architecture

```
Nginx :80/:443
  ├── /api/*  → Backend API (NestJS :3000)
  ├── /v1/*   → OpenAI Gateway (streaming supported)
  └── /*      → Frontend (Next.js :3001)
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Ant Design UI |
| Backend | NestJS + Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 + BullMQ |
| AI Gateway | OpenAI-compatible, multi-provider routing |
| Proxy | Nginx (with SSL support) |
| Deployment | Docker Compose |

## 📁 Project Structure

```
matrix-api/
├── backend/
│   ├── prisma/              # Schema & seeds
│   └── src/
│       ├── gateway/         # OpenAI-compatible API gateway
│       ├── modules/         # Feature modules (auth, wallet, models...)
│       │   ├── groups/      # Group multiplier system (0.1x, 1x, 2x...)
│       │   ├── dynamic-rate/ # Dynamic pricing rate
│       │   └── ...
│       └── common/          # Guards, decorators, filters
├── frontend/
│   └── src/
│       ├── app/             # Pages
│       │   ├── dashboard/   # User console
│       │   ├── admin/       # Admin panel
│       │   ├── pricing/     # Model pricing page
│       │   └── ...
│       ├── components/      # Shared UI components
│       └── lib/             # API client & utilities
├── nginx/
│   └── nginx.conf           # Reverse proxy config
├── docker-compose.yml       # Production stack
└── deploy.sh                # Deployment script
```

## 🌐 API Reference

The gateway is OpenAI-compatible — use any OpenAI SDK:

```python
from openai import OpenAI
client = OpenAI(
    base_url="http://43.154.77.5/v1",
    api_key="sk-your-matrixapi-key"
)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://... | PostgreSQL connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| JWT_SECRET | *(required)* | JWT signing key |
| OPENAI_API_KEY | *(required)* | Upstream OpenAI key |
| NEXT_PUBLIC_API_URL | http://localhost:3000/api | Frontend API base |
