# MatrixAPI Clean GitHub and Server Deployment Design

Date: 2026-07-11
Status: Approved in conversation; awaiting written-spec review

## Objective

Replace the reset production server with a fresh MatrixAPI deployment built from a sanitized GitHub source tree. Remove the obsolete NestJS/Next.js rollback stack, keep the active New API implementation and its license obligations, initialize a new database, and verify the public site before declaring the deployment complete.

## Confirmed Constraints

- The active application is `QuantumNous/new-api` under `output/new-api-src`, with MatrixAPI Nginx static injection and production scripts at the repository root.
- Delete `backend/`, `frontend/`, and `docker-compose.legacy.yml` from the current code line. Do not create a legacy archive branch or tag.
- Do not rewrite Git history. Historical commits remain unchanged.
- Do not build a Docker image on the local workstation or in CI. Build the image only on the production server.
- The reset server has about 896 MiB RAM, 1 GiB swap, and 22 GiB free disk. It currently has no Docker, Git, project checkout, certificates, or application data volumes.
- Initialize a fresh PostgreSQL database. Previous users, balances, tokens, and logs will not be restored.
- Never commit or upload `.env.production`, `PROJECT_FULL_CONTEXT_REDACTED.txt`, databases, credentials, private keys, or other runtime secrets.

## Repository Cleanup

Delete the obsolete application stack and every active-only reference to it:

- `backend/`
- `frontend/`
- `docker-compose.legacy.yml`
- legacy-only documentation, QA scripts, deployment code paths, and README rollback instructions
- generated dependencies and build output such as `node_modules`, `.next`, `dist`, caches, local databases, screenshots, audit copies, staging directories, binaries, and release archives

Keep the production source and operational files:

- `output/new-api-src` source files, package locks, Go modules, Dockerfile, version file, and source documentation
- upstream `LICENSE`, `NOTICE`, and `THIRD-PARTY-LICENSES.md`
- `nginx/` production proxy, static site, injection scripts, and security configuration
- active bootstrap and production QA scripts under `scripts/`
- `docker-compose.yml`, Linux deployment tooling, environment template, provenance documentation, and active operator documentation

The GitHub payload must contain clean source, not the physical `output/` directory as it exists locally. The expected New API source payload is about 20.8 MB and 2,181 files after ignored dependencies and build output are excluded.

## GitHub Publication

1. Remove obsolete files and update every active reference affected by their removal.
2. Stage an explicit allowlist of production source and documentation.
3. Inspect the exact staged name list and staged diff.
4. Run whitespace, credential, sensitive-path, license, and source-completeness checks against the staged content.
5. Create a clean Git archive from the candidate commit and verify that it contains the Compose build context, Dockerfile, locks, licenses, Nginx files, and deployment scripts.
6. Push the candidate commit to the current GitHub branch.
7. Verify the remote commit and downloadable archive.
8. Update remote `main` to the same commit only by non-forced fast-forward. Do not force-push or rewrite remote history.

If `main` cannot be fast-forwarded, stop and reconcile it explicitly before deployment. The server must deploy a recorded commit, never an uncommitted workspace snapshot.

## Low-Memory Server Build

Install Git, Docker Engine, and the Docker Compose plugin on the reset Alibaba Cloud Linux host. Retain the existing SSH and BaoTa panel access while opening only the website ports required for HTTP and HTTPS.

Before building:

- expand swap to approximately 4 GiB while preserving sufficient disk headroom
- serialize the default and classic frontend builds in one Docker frontend stage so BuildKit cannot run them concurrently
- limit Go build concurrency
- build one application image at a time
- record free memory, swap use, disk use, and the exact Git commit

The local workstation and CI may run source-level verification, but they must not produce or upload a Docker image. If the server build exhausts memory or disk, stop, retain diagnostics, and adjust the server build path explicitly. Do not silently replace the custom build with an upstream or stale image.

## Runtime Initialization

Create `/root/token_API` from the verified GitHub `main` commit. Generate the production `.env` from the locally held deployment context over the authenticated SSH channel, set mode `0600`, and never print its values.

Start PostgreSQL and Redis with new named volumes, then bootstrap:

- one production administrator
- one enabled canonical upstream channel
- the configured upstream base URL
- Alipay-only payment presentation and callbacks
- the approved 40 percent markup rules
- required New API system settings

Database and Redis ports remain bound to localhost. Application traffic reaches New API through Nginx only.

## HTTP and TLS Activation

Because the reset server has no certificate, first start the HTTP-compatible deployment and confirm DNS reaches the server. Open TCP ports 80 and 443 at the host and cloud firewall layers. Obtain a new Let's Encrypt certificate for the production domain, then recreate or reload Nginx with the HTTPS configuration.

Do not claim completion while TLS is absent or while ports 80 and 443 are unreachable. Keep port 8888 unchanged for the existing panel; do not expose PostgreSQL or Redis publicly.

## Verification Gates

### Before GitHub Push

- Git diff and whitespace checks pass.
- Removed legacy paths have no active references.
- New API Go tests pass.
- New API frontend type checks, lint, unit tests, and source build checks pass without building a Docker image locally.
- MatrixAPI channel migration and Nginx/static source QA pass.
- The staged secret scan has no unresolved findings.
- Required upstream attribution and license files remain present.
- A clean archive contains every server build input and excludes secrets, databases, dependencies, caches, binaries, and generated output.

### On the Server

- The deployed checkout matches the recorded Git commit.
- The custom image builds successfully on the server.
- New API, PostgreSQL, and Redis report healthy; Nginx is running.
- `nginx -t` reports valid syntax and a successful configuration test.
- Redis returns `PONG`.
- The fresh database contains the administrator and exactly one enabled canonical upstream channel.
- Upstream address, Alipay-only presentation, callbacks, and markup settings match the approved configuration.

### Public Production

Run production runtime, public route, security, and default smoke QA. Each process must exit with status 0 and report an empty `failures` array.

Verify the homepage, authentication, console, recharge, models, and deployment guidance routes. They must render without a cold-start blank screen, broken links, stale upstream copy, or unintended large SPA loading on static public pages.

After certificate issuance, verify HTTP-to-HTTPS redirect behavior, TLS validity, HSTS, CSP, and the remaining required security headers. Do not run destructive full-lifecycle tests against production.

## Failure Handling and Completion Rule

Each phase is a gate. A failed cleanup check blocks GitHub publication; a failed GitHub archive check blocks server deployment; a failed image build blocks runtime initialization; and a failed runtime, TLS, route, or security check blocks the completion claim.

Retain diagnostic logs and the failed build state until the cause is understood. Do not hide failures with stale artifacts, official upstream images, or partial HTTP-only availability.

The deployment is complete only when the recorded Git commit, server image ID, healthy container state, valid TLS configuration, initialized production settings, and all required QA results have been captured with no unresolved failures.
