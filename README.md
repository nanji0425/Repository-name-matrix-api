# MatrixAPI

MatrixAPI uses `QuantumNous/new-api` as the production gateway, console, token, pricing, log, wallet, and admin core. The previous custom NestJS/Next.js stack is kept as `docker-compose.legacy.yml` for rollback.

## What Is Included

- MatrixAPI branded dynamic homepage served by Nginx at `/`
- New API console at `/console`
- OpenAI-compatible `/v1/*` gateway
- Token management, token copy/import, token groups and model restrictions
- Model marketplace, pricing filters, usage logs and task logs
- Upstream channel routing through `https://api.bblabu.chat`
- ZPay EPay-compatible payment with Alipay only
- Default retail markup: upstream price times `1.4`

New API is AGPLv3. Keep the required attribution and original project link visible unless you obtain a separate commercial authorization.

## Production Deployment

Required `.env` values:

```bash
DB_PASSWORD=...
REDIS_PASSWORD=...
SESSION_SECRET=...
CRYPTO_SECRET=...
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_TRUSTED_URL=https://matrixapi.online,https://www.matrixapi.online
```

Deploy:

```bash
./deploy.sh
```

Public entry points:

- Site: `https://matrixapi.online`
- Console: `https://matrixapi.online/console`
- Pricing: `https://matrixapi.online/pricing`
- OpenAI-compatible API: `https://matrixapi.online/v1`
- Status: `https://matrixapi.online/api/status`

The public homepage lives in `nginx/site/`. New API still owns `/console`, `/pricing`, `/login`, `/register`, `/api/*`, and `/v1/*`.

## Bootstrap

Optional bootstrap after deploy:

```bash
set -a
. ./.env
set +a
node scripts/bootstrap-new-api.mjs
```

The API bootstrap can create the first root account, configure ZPay Alipay, set the default group markup to `1.4`, and create the `bblabu-upstream` OpenAI-compatible channel. If New API rejects API-based admin option writes because of sensitive-action authorization, `deploy.sh` falls back to `scripts/bootstrap-new-api-db.sh`, which writes the same production options directly to the New API database.

## Upstream Setup

The upstream OpenAI-compatible channel should use:

- Base URL: `https://api.bblabu.chat`
- Key: upstream account API key
- Group: `default`
- Status: enabled
- Weight: `100`

Pricing rule:

```text
MatrixAPI price = upstream price * 1.4
```

After configuration, verify `/pricing`, create a token, and call:

```bash
curl https://matrixapi.online/v1/models -H "Authorization: Bearer <MatrixAPI token>"
```

## ZPay / Alipay Setup

New API has an EPay-compatible payment provider. Configure ZPay in Admin Console -> System Settings -> Billing / Payment Gateway:

- PayAddress: `https://zpayz.cn/`
- EpayId: your ZPay PID
- EpayKey: your ZPay merchant key
- PayMethods: only Alipay

Payment method JSON:

```json
[
  {
    "name": "Alipay",
    "icon": "SiAlipay",
    "type": "alipay"
  }
]
```

ZPay callback paths:

```text
https://matrixapi.online/api/user/epay/notify
https://matrixapi.online/api/subscription/epay/notify
```

Run a small real Alipay top-up before opening the site publicly. The callback should return `success`, create a successful top-up record, and credit quota exactly once.

## Rollback

The old custom implementation is preserved:

```bash
docker compose -f docker-compose.legacy.yml up -d
```

Before rollback, back up the current New API database volume and logs, then restore the legacy `.env` values used by the old stack.
