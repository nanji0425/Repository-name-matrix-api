# MatrixAPI - AI Model Aggregation Platform

Unified API for GPT, Claude, Gemini, DeepSeek, Qwen, Grok and more.

## Production deployment

### Deployment target
Run the full stack on your server with Docker Compose:

- `frontend`: Next.js standalone server on port `3001`
- `backend`: NestJS API and OpenAI-compatible gateway on port `3000`
- `nginx`: public reverse proxy on port `80`
- `postgres` and `redis`: internal dependencies

### Required server environment
Copy `.env.production.example` to `.env` on the server and fill real secrets. Do not commit `.env` or `.env.production`.

Required variables: `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, `UPSTREAM_API_KEY`, `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `FRONTEND_URLS`, `API_PUBLIC_URL`, `ZPAY_PID`, `ZPAY_KEY`, `ZPAY_NOTIFY_URL`, `ZPAY_RETURN_URL`.

Keep `ENABLE_DEMO_DATA=false` in production. Demo accounts and demo API keys are only created when `ENABLE_DEMO_DATA=true` and `DEMO_PASSWORD` is explicitly set.

Deploy:
```bash
./deploy.sh
```

The deploy script builds images, starts PostgreSQL and Redis first, applies the Prisma schema in a one-off backend container, runs seed data, starts the app services, waits for `/api/health/ready`, and prints logs if readiness times out.

Health checks:
```bash
curl http://matrixapi.online/api/health
curl http://matrixapi.online/api/health/ready
curl http://matrixapi.online/v1/models
```

ZPay callback URL:
```bash
https://matrixapi.online/api/wallet/zpay/notify
```

The ZPay callback must be reachable from the public internet and must return the plain text `success` after a valid paid notification.

### API base URL
```bash
https://matrixapi.online/api
```

### OpenAI-compatible gateway
```bash
https://matrixapi.online/v1/chat/completions
```

### Production go-live checklist

Before opening the site to users:

1. Point the domain DNS `A` record to the server IP.
2. Fill `.env` with real values from `.env.production.example`; the deploy script rejects placeholders.
3. Run `./deploy.sh` on the server.
4. Verify `https://matrixapi.online`, `/api/health/ready`, and `/v1/models`.
5. Issue TLS certificates for `matrixapi.online` and `www.matrixapi.online` into `/etc/letsencrypt/live/matrixapi.online`.
   Example:
   ```bash
   certbot certonly --webroot -w /var/www/certbot -d matrixapi.online -d www.matrixapi.online
   ```
6. Change public URLs in `.env` to `https://...`, including `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `API_PUBLIC_URL`, `ZPAY_NOTIFY_URL`, and `ZPAY_RETURN_URL`.
7. Run `./deploy.sh` again; it enables `nginx/conf.d/ssl.conf` and HTTP-to-HTTPS redirect automatically when the certificate files exist.
8. Verify `https://matrixapi.online`, `https://matrixapi.online/api/health/ready`, and `https://matrixapi.online/v1/models`.
9. Register or log in, create an API key, and call `/v1/chat/completions`.
10. Create a recharge order and confirm the ZPay cashier URL opens.
11. Complete a real small payment and confirm the callback credits the wallet exactly once.
