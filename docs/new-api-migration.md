# MatrixAPI New API Migration Checklist

## Decision

Use `QuantumNous/new-api` as the MatrixAPI production core. This is the better fit because the upstream reference site already exposes the same class of features: console, token management, model pricing, request logs, task logs, wallet, EPay payment, channel routing, dashboards, i18n and theme switching.

## Pre-Deploy Backup

Run these on the production server before switching:

```bash
cd /root/token_API
sudo cp docker-compose.yml docker-compose.yml.bak.$(date +%Y%m%d%H%M%S)
sudo cp .env .env.bak.$(date +%Y%m%d%H%M%S)
sudo docker exec matrixapi-db pg_dump -U matrixapi matrix_api | sudo tee /root/matrix_api_legacy_backup_$(date +%Y%m%d%H%M%S).sql >/dev/null
```

If the server uses a different current project path, run `sudo docker compose ls` and use the listed config path.

## Deploy

```bash
cd /root/token_API
git pull
cp .env.production.example .env
nano .env
./deploy.sh
```

Required `.env` values:

- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `SESSION_SECRET`
- `CRYPTO_SECRET`

Use long random values. Do not reuse the legacy JWT secret as the New API session or crypto secret.

The deploy script removes the legacy `matrixapi-backend` and `matrixapi-frontend` containers before starting New API, because the old backend binds `127.0.0.1:3000`, which conflicts with the new gateway. Docker volumes are not deleted by this step.

Optional bootstrap:

```bash
set -a
. ./.env
set +a
node scripts/bootstrap-new-api.mjs
```

The bootstrap script uses the optional `NEW_API_ADMIN_*`, `UPSTREAM_*`, and `ZPAY_*` environment variables from `.env`. It creates the first root account when setup is still open, confirms payment compliance, enables only Alipay through ZPay, sets the default group ratio to `1.4`, and creates a `bblabu-upstream` channel if it does not already exist.

## First Setup

1. Open `https://matrixapi.online/setup` or `http://47.82.105.81/setup` before TLS is issued.
2. Create the root admin account.
3. Keep demo mode off for production.
4. Login and open `/console`.

## Configure Upstream

Create an OpenAI-compatible channel:

- Base URL: `https://api.bblabu.chat` or the primary upstream endpoint visible in the upstream console.
- API key: use the upstream account key.
- Test model: choose a low-cost chat model that exists upstream.
- Enable automatic retry and health checks.

Then sync/import models where available.

## Configure Pricing

MatrixAPI retail pricing must be upstream plus 40%.

Formula:

```text
retail = upstream * 1.4
```

In New API this can be implemented by:

- setting model ratios to 1.4 times the upstream baseline, or
- setting group ratio to include the 1.4 markup, or
- importing upstream ratios and multiplying the imported values by 1.4.

After saving, verify at least three visible model rows in `/pricing` against upstream pricing.

## Configure ZPay

Admin Console -> System Settings -> Billing / Payment Gateway:

- `PayAddress`: `https://zpayz.cn/`
- `EpayId`: ZPay merchant PID
- `EpayKey`: ZPay merchant key
- payment compliance: confirmed
- payment methods:

```json
[
  {
    "name": "支付宝",
    "icon": "SiAlipay",
    "type": "alipay"
  }
]
```

Do not enable WeChat Pay, Stripe, Waffo or custom methods unless the merchant account is configured for them.

ZPay notify URLs:

- `https://matrixapi.online/api/user/epay/notify`
- `https://matrixapi.online/api/subscription/epay/notify`

## Smoke Test

```bash
curl -fsS https://matrixapi.online/api/status
curl -fsS https://matrixapi.online/pricing >/dev/null
curl -fsS https://matrixapi.online/console >/dev/null
```

Manual checks:

1. Register/login works.
2. Console button opens `/console`.
3. Theme and language toggles work.
4. Token creation works.
5. Token copy/import UI is usable and not clipped.
6. `/v1/models` works with a MatrixAPI token.
7. `/v1/chat/completions` routes to upstream.
8. Pricing shows upstream +40%.
9. Alipay top-up creates an order.
10. A small real payment credits quota once.
11. Request logs and top-up logs are visible.

## Rollback

```bash
cd /root/token_API
docker compose down
docker compose -f docker-compose.legacy.yml up -d
```

If needed, restore the legacy `.env` backup before starting the legacy compose file.
