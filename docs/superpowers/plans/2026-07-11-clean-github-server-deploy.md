# MatrixAPI Clean GitHub and Server Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a sanitized New API-based MatrixAPI source tree to GitHub, build it only on the reset production server, initialize a fresh database, restore HTTPS, and pass every production release gate.

**Architecture:** Root files provide Compose orchestration, Nginx branding, bootstrap, and QA; `output/new-api-src` is the only application build context. The obsolete NestJS/Next.js stack is removed. GitHub `main` becomes the immutable server input, and the low-memory server builds a serialized Dockerfile before running New API, PostgreSQL, Redis, and Nginx.

**Tech Stack:** Git, GitHub, Go 1.26, Bun, Rsbuild, Docker Engine, Docker Compose, PostgreSQL 16, Redis 7, Nginx, Node.js, Playwright, Let's Encrypt.

---

### Task 1: Add the Release-Tree Contract

**Files:**
- Create: `scripts/qa-release-source-tree.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Create a QA script that defines the deployable tree**

```js
#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const required = [
  'docker-compose.yml', 'deploy.sh', '.env.production.example',
  'nginx/nginx.conf', 'nginx/site/brand-init.js',
  'scripts/bootstrap-new-api.mjs', 'scripts/qa-production-runtime.mjs',
  'output/new-api-src/Dockerfile', 'output/new-api-src/go.mod',
  'output/new-api-src/go.sum', 'output/new-api-src/web/bun.lock',
  'output/new-api-src/LICENSE', 'output/new-api-src/NOTICE',
  'output/new-api-src/THIRD-PARTY-LICENSES.md',
];
const forbidden = [
  'backend', 'frontend', 'docker-compose.legacy.yml', 'screenshots',
];
const sensitive = ['PROJECT_FULL_CONTEXT_REDACTED.txt', '.env.production'];
const generatedNames = new Set(['node_modules', '.next', 'dist', 'coverage', '.cache']);
const missing = required.filter((path) => !existsSync(join(root, path)));
const presentForbidden = forbidden.filter((path) => existsSync(join(root, path)));
const trackedSensitive = sensitive.filter(
  (path) => spawnSync('git', ['ls-files', '--error-unmatch', path]).status === 0,
);
const generated = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.git') continue;
    const absolute = join(directory, entry.name);
    if (generatedNames.has(entry.name)) {
      generated.push(relative(root, absolute).replaceAll('\\', '/'));
    } else {
      walk(absolute);
    }
  }
}
walk(join(root, 'output', 'new-api-src'));

assert.deepEqual(missing, [], `missing required paths: ${missing.join(', ')}`);
assert.deepEqual(presentForbidden, [], `forbidden paths exist: ${presentForbidden.join(', ')}`);
assert.deepEqual(trackedSensitive, [], `sensitive paths are tracked: ${trackedSensitive.join(', ')}`);
assert.deepEqual(generated, [], `generated directories exist: ${generated.join(', ')}`);
console.log(JSON.stringify({ pass: true, required: required.length }, null, 2));
```

- [ ] **Step 2: Prove the contract fails before cleanup**

Run: `node scripts/qa-release-source-tree.mjs`

Expected: non-zero exit containing `backend`, `frontend`, and `docker-compose.legacy.yml`.

- [ ] **Step 3: Add generated-source exclusions after `!output/new-api-src/**`**

```gitignore
output/new-api-src/**/node_modules/
output/new-api-src/**/dist/
output/new-api-src/**/.cache/
output/new-api-src/**/coverage/
output/new-api-src/**/*.db
output/new-api-src/**/*.db-journal
```

- [ ] **Step 4: Verify all sensitive/generated examples are ignored**

Run: `git check-ignore -v PROJECT_FULL_CONTEXT_REDACTED.txt .env.production output/new-api-src/web/node_modules output/new-api-src/web/default/dist`

Expected: four matching ignore rules.

### Task 2: Delete the Approved Legacy and Generated Content

**Files:**
- Delete: `backend/`, `frontend/`, `docker-compose.legacy.yml`, `gateway/`, `screenshots/`, root `node_modules/`
- Delete: every `output/` child except `output/new-api-src`
- Delete: generated directories under `output/new-api-src`

- [ ] **Step 1: Resolve and validate root deletion targets**

```powershell
$root = (Resolve-Path '.').Path
$targets = @('backend','frontend','gateway','screenshots','node_modules')
foreach ($target in $targets) {
  $absolute = [IO.Path]::GetFullPath((Join-Path $root $target))
  if (-not $absolute.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe path: $absolute" }
  "$target -> $absolute"
}
```

Expected: every target resolves below `E:\token_API\`.

- [ ] **Step 2: Remove those validated targets and the legacy Compose file**

```powershell
$root = (Resolve-Path '.').Path
$targets = @('backend','frontend','gateway','screenshots','node_modules')
foreach ($target in $targets) {
  $absolute = [IO.Path]::GetFullPath((Join-Path $root $target))
  if (Test-Path -LiteralPath $absolute) { Remove-Item -LiteralPath $absolute -Recurse -Force }
}
git rm --ignore-unmatch -- docker-compose.legacy.yml
```

Expected: targets are absent and tracked content is recorded as deleted.

- [ ] **Step 3: Reduce `output/` to clean New API source**

```powershell
$output = (Resolve-Path 'output').Path
Get-ChildItem -LiteralPath $output -Force | Where-Object Name -ne 'new-api-src' | ForEach-Object {
  if (-not $_.FullName.StartsWith($output + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe path: $($_.FullName)" }
  Remove-Item -LiteralPath $_.FullName -Recurse -Force
}
$source = (Resolve-Path 'output/new-api-src').Path
Get-ChildItem -LiteralPath $source -Directory -Recurse -Force |
  Where-Object { @('node_modules','dist','.cache','coverage') -contains $_.Name } |
  Sort-Object { $_.FullName.Length } -Descending |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }
```

Expected: `Get-ChildItem output -Force` lists only `new-api-src`; generated directories are absent.

- [ ] **Step 4: Prove the release-tree contract now passes**

Run: `node scripts/qa-release-source-tree.mjs`

Expected: JSON contains `"pass": true` and `"required": 14`.

### Task 3: Remove Legacy References While Preserving Active QA

**Files:**
- Delete: `scripts/qa-admin-login-routing.mjs`, `docs/MODEL_SYNC_GUIDE.md`, `docs/ruflo-queen-memory.md`
- Rename: `docs/new-api-migration.md` to `docs/production-deployment.md`
- Modify: `scripts/qa-matrix-console-source.mjs`, `scripts/qa-production-security.mjs`
- Modify: `deploy.sh`, `deploy.ps1`, `README.md`, `PROJECT_HANDOFF.md`, `docker-compose.yml`
- Modify: `nginx/nginx.conf`, `nginx/ssl.conf.template`, `nginx/conf.d/ssl.conf`

- [ ] **Step 1: Remove legacy-only files and rename deployment documentation**

Run: `git rm --ignore-unmatch -- scripts/qa-admin-login-routing.mjs docs/MODEL_SYNC_GUIDE.md docs/ruflo-queen-memory.md; git mv docs/new-api-migration.md docs/production-deployment.md`

Expected: three deletions and one rename are recorded.

- [ ] **Step 2: Remove deleted-source reads/assertions from `qa-matrix-console-source.mjs`**

Delete all variables prefixed `legacy`, their paths in `sourceFiles`, and assertions consuming those variables. Keep active Compose, Nginx, New API source, bootstrap, license, sensitive-file, payment, channel, and cold-start checks.

Run: `node scripts/qa-matrix-console-source.mjs`

Expected: no `ENOENT`; JSON has `"pass": true` and `"failures": []`.

- [ ] **Step 3: Remove legacy backup branches from deployment scripts**

Delete `backup_legacy_database`/`Backup-LegacyDatabase` and their calls. Replace the container block in `deploy.sh` with:

```bash
echo "Replacing existing MatrixAPI containers if they exist..."
docker rm -f matrixapi-new-api matrixapi-nginx matrixapi-db matrixapi-redis >/dev/null 2>&1 || true
```

Replace the PowerShell block with:

```powershell
Write-Host "Replacing existing MatrixAPI containers if they exist..."
docker rm -f matrixapi-new-api matrixapi-nginx matrixapi-db matrixapi-redis *> $null
```

Expected: `rg -n "legacy|matrixapi-backend|matrixapi-frontend" deploy.sh deploy.ps1` returns no matches.

- [ ] **Step 4: Update active documentation and configuration**

`README.md`, `docs/production-deployment.md`, and `PROJECT_HANDOFF.md` must describe New API as the only stack, GitHub `main` as the source, and a fresh database. Remove rollback/legacy backup instructions. Remove the legacy comment from `docker-compose.yml`. Change `docker-compose(\.legacy)?\.yml` to `docker-compose\.yml` in all three Nginx files. Remove `/docker-compose.legacy.yml` from `qa-production-security.mjs`.

Run: `rg -n "docker-compose\.legacy|backend/|frontend/|matrixapi-backend|matrixapi-frontend" README.md PROJECT_HANDOFF.md docs/production-deployment.md scripts deploy.sh deploy.ps1 docker-compose.yml nginx`

Expected: no active removed-stack reference; the approved design document may retain historical scope wording.

- [ ] **Step 5: Install Gitleaks, scan the staged cleanup/source import, then commit**

```powershell
git add -- .gitignore README.md PROJECT_HANDOFF.md docker-compose.yml deploy.sh deploy.ps1 nginx scripts docs output/new-api-src
git add -u -- backend frontend docker-compose.legacy.yml screenshots .claude-flow .superpowers
git diff --cached --check
if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) { winget install --id Gitleaks.Gitleaks --exact --accept-package-agreements --accept-source-agreements }
git diff --cached --binary | gitleaks stdin --redact --no-banner
git commit -m "refactor(deploy): remove legacy application stack"
```

Expected: commit succeeds without environments, databases, dependencies, screenshots, binaries, or archives.

### Task 4: Serialize the Dockerfile for the 896 MiB Host

**Files:**
- Modify: `output/new-api-src/Dockerfile`

- [ ] **Step 1: Replace the two independent frontend stages with one sequential stage**

```dockerfile
FROM oven/bun:1@sha256:0733e50325078969732ebe3b15ce4c4be5082f18c4ac1a0f0ca4839c2e4e42a7 AS web-builder
WORKDIR /build/web
COPY web/package.json web/bun.lock ./
COPY web/default/package.json ./default/package.json
COPY web/classic/package.json ./classic/package.json
RUN bun install --frozen-lockfile
COPY ./web/default ./default
COPY ./web/classic ./classic
COPY ./VERSION /build/VERSION
RUN cd default && DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat /build/VERSION) bun run build
RUN cd classic && VITE_REACT_APP_VERSION=$(cat /build/VERSION) bun run build
```

Add `ENV GOMAXPROCS=1`; copy both dist directories from `web-builder`; change Go build to `go build -p=1 -ldflags ... -o new-api`.

- [ ] **Step 2: Verify serialization without a local image build**

```powershell
$text = Get-Content -Raw output/new-api-src/Dockerfile
if (($text | Select-String -AllMatches ' AS web-builder').Matches.Count -ne 1) { throw 'web-builder missing' }
if ($text -match 'builder-classic') { throw 'parallel builder remains' }
if ($text -notmatch 'GOMAXPROCS=1' -or $text -notmatch 'go build -p=1') { throw 'Go limit missing' }
```

Expected: exit 0; no Docker build runs locally.

- [ ] **Step 3: Commit the build change**

Run: `git add -- output/new-api-src/Dockerfile; git diff --cached --check; git diff --cached --binary | gitleaks stdin --redact --no-banner; git commit -m "build(new-api): serialize low-memory image build"`

Expected: one focused commit.

### Task 5: Run Local Source Gates Without Building a Docker Image

**Files:**
- Test: `output/new-api-src/**/*_test.go`, `output/new-api-src/web/**`, `scripts/qa-*.mjs`

- [ ] **Step 1: Run Go tests from `output/new-api-src`**

Run: `go test ./...`

Expected: all packages pass.

- [ ] **Step 2: Install Bun if absent and verify web workspaces**

```powershell
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) { powershell -NoProfile -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"; $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path" }
Set-Location output/new-api-src/web
bun install --frozen-lockfile
bun --cwd default run typecheck
bun --cwd default run lint
bun --cwd default test
bun --cwd default run build
bun --cwd classic run lint
bun --cwd classic run build
Set-Location ../../..
```

Expected: every command exits 0; no Docker image is built.

- [ ] **Step 3: Remove dependencies and build output recreated by verification**

```powershell
$source = (Resolve-Path 'output/new-api-src').Path
Get-ChildItem -LiteralPath $source -Directory -Recurse -Force |
  Where-Object { @('node_modules','dist','.cache','coverage') -contains $_.Name } |
  Sort-Object { $_.FullName.Length } -Descending |
  ForEach-Object {
    if (-not $_.FullName.StartsWith($source + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe path: $($_.FullName)" }
    Remove-Item -LiteralPath $_.FullName -Recurse -Force
  }
```

Expected: no generated directory remains beneath `output/new-api-src`.

- [ ] **Step 4: Run MatrixAPI source gates**

```powershell
npm ci
node --check nginx/site/brand-init.js
node scripts/qa-release-source-tree.mjs
node scripts/qa-new-api-channel-migration.mjs
node scripts/qa-matrix-console-source.mjs
node scripts/qa-brand-assets.mjs
node scripts/qa-copy-integrity.mjs
node scripts/qa-visual-system.mjs
node scripts/qa-cold-start-shell.mjs
node scripts/qa-public-site-static.mjs
git diff --check
Remove-Item -LiteralPath (Join-Path (Resolve-Path '.').Path 'node_modules') -Recurse -Force
```

Expected: all exit 0; JSON reports have `pass: true` and no failures.

### Task 6: Stage and Scan the Exact GitHub Payload

**Files:**
- Stage: active root orchestration, `nginx/`, `scripts/`, `docs/`, `output/new-api-src`
- Exclude: local context, environments, databases, dependencies, caches, binaries, archives

- [ ] **Step 1: Install Gitleaks if absent**

Run: `if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) { winget install --id Gitleaks.Gitleaks --exact --accept-package-agreements --accept-source-agreements }; gitleaks version`

Expected: a version is printed.

- [ ] **Step 2: Stage approved content and reject forbidden paths**

```powershell
git add -- .gitignore .dockerignore .env.production.example README.md PROJECT_HANDOFF.md package.json package-lock.json docker-compose.yml deploy.sh deploy.ps1 nginx scripts docs output/new-api-src
git add -u -- backend frontend docker-compose.legacy.yml gateway screenshots .claude-flow .superpowers
$staged = git diff --cached --name-only
$forbidden = $staged | Where-Object {
  ($_ -match 'PROJECT_FULL_CONTEXT_REDACTED|node_modules|(^|/)dist/|\.next|coverage|screenshots|\.(db|sqlite|tgz|tar|zip|exe)$') -or
  (($_ -match '(^|/)\.env($|\.)') -and ($_ -notmatch '(^|/)\.env(\.production)?\.example$'))
}
if ($forbidden) { $forbidden; throw 'Forbidden staged paths' }
git diff --cached --check
```

Expected: no forbidden path and no whitespace error.

- [ ] **Step 3: Scan staged content and history**

```powershell
git diff --cached --binary | gitleaks stdin --redact --no-banner
gitleaks git --redact --no-banner .
```

Expected: no staged finding. A real historical finding requires credential rotation before push.

- [ ] **Step 4: Commit remaining approved active changes**

Run: `git commit -m "chore(release): publish clean New API source tree"`

Expected: commit succeeds; remaining status entries are ignored local context or explicitly excluded unrelated files.

- [ ] **Step 5: Validate a clean archive**

```powershell
$archive = Join-Path $env:TEMP 'matrixapi-release-check.tar'
git archive --format=tar -o $archive HEAD
$listing = tar -tf $archive
$required = @('docker-compose.yml','deploy.sh','output/new-api-src/Dockerfile','output/new-api-src/go.sum','output/new-api-src/web/bun.lock','output/new-api-src/LICENSE','nginx/nginx.conf')
foreach ($path in $required) { if ($listing -notcontains $path) { throw "Archive missing $path" } }
if ($listing -match 'PROJECT_FULL_CONTEXT_REDACTED|(^|/)\.env$|node_modules|(^|/)dist/') { throw 'Forbidden archive content' }
Remove-Item -LiteralPath $archive -Force
```

Expected: required paths exist and forbidden content is absent.

### Task 7: Publish GitHub Branch and Fast-Forward `main`

**Files:**
- Remote: `origin/codex/spa-cold-start`, `origin/main`

- [ ] **Step 1: Prove the update is fast-forward only**

Run: `git fetch origin; git merge-base --is-ancestor origin/main HEAD; if ($LASTEXITCODE -ne 0) { throw 'main cannot fast-forward' }`

Expected: exit 0.

- [ ] **Step 2: Push and verify both remote SHAs**

```powershell
$releaseCommit = git rev-parse HEAD
git push origin HEAD:codex/spa-cold-start
git push origin HEAD:main
$branchCommit = (git ls-remote origin refs/heads/codex/spa-cold-start) -split '\s+' | Select-Object -First 1
$mainCommit = (git ls-remote origin refs/heads/main) -split '\s+' | Select-Object -First 1
if ($branchCommit -ne $releaseCommit -or $mainCommit -ne $releaseCommit) { throw 'Remote SHA mismatch' }
```

Expected: both pushes are non-forced and both SHAs equal HEAD.

### Task 8: Provision the Reset Server

**Files:**
- Remote: Docker repository/configuration, `/swap-matrixapi`, `/etc/fstab`, `/root/token_API`

- [ ] **Step 1: Install Git and Docker over authenticated SSH**

```bash
dnf -y install dnf-plugins-core git curl ca-certificates
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
git --version
docker version --format '{{.Server.Version}}'
docker compose version
```

Expected: all three version checks succeed.

- [ ] **Step 2: Expand total swap to at least 4 GiB**

```bash
current_kib=$(awk 'NR>1 {sum += $3} END {print sum + 0}' /proc/swaps)
target_kib=4194304
if [ "$current_kib" -lt "$target_kib" ]; then
  missing_kib=$((target_kib - current_kib))
  fallocate -l "${missing_kib}K" /swap-matrixapi
  chmod 600 /swap-matrixapi
  mkswap /swap-matrixapi
  swapon /swap-matrixapi
  grep -q '^/swap-matrixapi ' /etc/fstab || echo '/swap-matrixapi none swap sw 0 0' >> /etc/fstab
fi
free -h
df -h /
```

Expected: swap is at least 4 GiB and free root disk exceeds 15 GiB.

- [ ] **Step 3: Preserve 22/8888 and open host HTTP/HTTPS rules**

```bash
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
fi
ss -lntp | grep -E ':(22|8888)\b'
```

Expected: SSH and BaoTa remain listening. Alibaba Cloud security-group TCP 80/443 must also be open before ACME.

- [ ] **Step 4: Clone the recorded GitHub commit**

```bash
rm -rf /root/token_API
git clone --branch main --single-branch https://github.com/nanji0425/Repository-name-matrix-api.git /root/token_API
cd /root/token_API
git rev-parse HEAD
git status --short
```

Expected: SHA equals the recorded release commit and status is empty.

### Task 9: Transfer Secrets and Start Fresh HTTP

**Files:**
- Local sensitive inputs: `PROJECT_FULL_CONTEXT_REDACTED.txt`, `.env.production`
- Remote create: `/root/token_API/.env` mode `0600`

- [ ] **Step 1: Prepare the environment outside the repository**

Create `$env:TEMP\matrixapi-production.env`. Generate new DB/Redis/session/crypto secrets; source administrator, upstream, and ZPay values from local sensitive context without printing them. Include every `.env.production.example` key. Validate only names and lengths:

```powershell
$envFile = Join-Path $env:TEMP 'matrixapi-production.env'
$required = @('DB_PASSWORD','REDIS_PASSWORD','SESSION_SECRET','CRYPTO_SECRET','NEW_API_ADMIN_USERNAME','NEW_API_ADMIN_PASSWORD','UPSTREAM_BASE_URL','UPSTREAM_API_KEY','ZPAY_GATEWAY','ZPAY_PID','ZPAY_KEY','NEW_API_GROUP_RATIO','NEW_API_TOPUP_GROUP_RATIO','NEW_API_DEFAULT_MODELS')
$map = @{}; Get-Content -LiteralPath $envFile | ForEach-Object { if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $map[$matches[1]] = $matches[2] } }
foreach ($name in $required) { if (-not $map.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($map[$name])) { throw "$name missing" } }
if ($map.DB_PASSWORD.Length -lt 12 -or $map.REDIS_PASSWORD.Length -lt 12 -or $map.SESSION_SECRET.Length -lt 32 -or $map.CRYPTO_SECRET.Length -lt 32) { throw 'Secret length failure' }
'environment validation passed'
```

Expected: only the validation message is printed.

- [ ] **Step 2: Transfer securely and erase the local temporary file**

```powershell
$envFile = Join-Path $env:TEMP 'matrixapi-production.env'
scp $envFile root@matrixapi.online:/root/token_API/.env
ssh root@matrixapi.online 'chmod 600 /root/token_API/.env'
Remove-Item -LiteralPath $envFile -Force
```

Expected: transfer succeeds, remote mode is 600, local temp file is absent.

- [ ] **Step 3: Build the custom image only on the server**

```bash
cd /root/token_API
export COMPOSE_PARALLEL_LIMIT=1
docker compose pull postgres redis nginx
docker compose build --progress=plain new-api 2>&1 | tee /root/matrixapi-build.log
docker image inspect matrixapi-new-api:v1.0.0-rc.18 --format '{{.Id}}'
```

Expected: build exits 0 and records an image ID; no local/CI image build occurs.

- [ ] **Step 4: Deploy HTTP and bootstrap the fresh database**

```bash
cd /root/token_API
chmod +x deploy.sh scripts/*.sh
./deploy.sh
docker compose ps
docker exec matrixapi-nginx nginx -t
```

Expected: New API, PostgreSQL, Redis are healthy; Nginx is up and valid; administrator/channel bootstrap succeeds.

### Task 10: Issue the Certificate and Enable HTTPS

**Files:**
- Remote create: `/etc/letsencrypt/live/matrixapi.online/`, `nginx/conf.d/ssl.conf`

- [ ] **Step 1: Verify public HTTP before ACME**

Run: `$response = Invoke-WebRequest -UseBasicParsing http://matrixapi.online/api/status -TimeoutSec 20; if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }`

Expected: HTTP 200. A timeout blocks deployment until cloud security-group TCP 80 is open.

- [ ] **Step 2: Request the certificate through the mounted webroot**

```bash
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot -d matrixapi.online -d www.matrixapi.online --agree-tos --register-unsafely-without-email --non-interactive
test -s /etc/letsencrypt/live/matrixapi.online/fullchain.pem
test -s /etc/letsencrypt/live/matrixapi.online/privkey.pem
```

Expected: certificate issuance succeeds and both files are non-empty.

- [ ] **Step 3: Re-run deployment to activate TLS**

```bash
cd /root/token_API
./deploy.sh
docker exec matrixapi-nginx nginx -t
curl -fsSI http://matrixapi.online/ | grep -i '^location: https://matrixapi.online/'
curl -fsSI https://matrixapi.online/api/status
```

Expected: valid Nginx config, HTTP redirects to HTTPS, HTTPS is 200.

### Task 11: Run Production Gates and Record Evidence

**Files:**
- Test: `scripts/qa-production-runtime.mjs`, `scripts/qa-public-route-audit.mjs`, `scripts/qa-production-security.mjs`, `scripts/qa-production-smoke.mjs`

- [ ] **Step 1: Verify runtime data without exposing secrets**

```bash
cd /root/token_API
docker compose ps
set -a; . ./.env; set +a
docker compose exec -T redis redis-cli -a "$REDIS_PASSWORD" ping
docker compose exec -T postgres psql -U matrixapi -d new_api -tAc 'select count(*) from users;'
docker compose exec -T postgres psql -U matrixapi -d new_api -tAc "select count(*) from channels where name='kukuai-upstream' and status=1;"
```

Expected: `PONG`, user count at least 1, enabled canonical channel count exactly 1.

- [ ] **Step 2: Run non-destructive production QA locally**

```powershell
node scripts/qa-production-runtime.mjs
node scripts/qa-public-route-audit.mjs
node scripts/qa-production-security.mjs
node scripts/qa-production-smoke.mjs
```

Expected: all exit 0 and each JSON report has `"failures": []`.

- [ ] **Step 3: Check principal routes**

```powershell
$routes = @('/','/sign-in','/console','/console/topup','/console/models','/console/deployment','/pricing','/wallet')
foreach ($route in $routes) {
  $response = Invoke-WebRequest -UseBasicParsing -MaximumRedirection 5 "https://matrixapi.online$route" -TimeoutSec 30
  if ($response.StatusCode -ne 200) { throw "$route returned $($response.StatusCode)" }
  "$route 200"
}
```

Expected: every route resolves to 200 after redirects without a blank shell.

- [ ] **Step 4: Capture immutable release evidence**

```bash
cd /root/token_API
printf 'commit=%s\n' "$(git rev-parse HEAD)"
printf 'image=%s\n' "$(docker image inspect matrixapi-new-api:v1.0.0-rc.18 --format '{{.Id}}')"
docker compose ps
docker exec matrixapi-nginx nginx -t
```

Expected: commit equals GitHub `main`, image ID is non-empty, containers are healthy, and all QA is green. Only then declare the site online.
