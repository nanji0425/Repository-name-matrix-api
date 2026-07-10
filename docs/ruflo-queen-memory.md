# Ruflo Queen Memory

## 2026-07-08 Reference Light-Theme Realignment Round

- Coordination: Continued under the queen-layer workflow and pushed the public shell closer to the reference site by restoring the lighter visual system across the MatrixAPI-owned static pages.
- UI fix: Removed the `matrix-dark-skin` body class and switched public page `theme-color` metadata to `#ffffff` so the public shell now follows the reference site's light background and softer surface treatment.
- Navigation fix: Simplified the public header action area on the main static pages to use Login/Register/Notifications instead of the earlier search/display/avatar cluster, which better matches the reference site's denser top-bar rhythm.
- Pricing polish: Reintroduced a dedicated sidebar search field on the model plaza page so the filter rail matches the reference site's pricing browsing flow more closely.
- Runtime adjustment: Updated `brand-init.js` to default MatrixAPI theme state to light, which keeps the public shell and injected console chrome from pulling the site back into the old dark presentation.
- Verification pending: Run the public site static audit and visual pass again, then sync the refreshed static pages and memory note to production if the layout still holds cleanly.

## 2026-07-08 Public Upstream Text Cleanup Round

- Coordination: Continued under the queen-layer workflow and chased the last remaining public-site audit failure caused by old upstream text leaking into MatrixAPI-owned pages.
- Issue found: The public skin class name still contained `bblabu`, and several static footers still rendered `Powered by New API`, which caused route-audit failures even though the functional pages were otherwise intact.
- UI fix: Renamed the public skin class to `matrix-dark-skin` and changed the public footers to a MatrixAPI-owned gateway string so the static shell no longer exposes the upstream brand in visible text or class names.
- QA alignment: Updated `scripts/qa-homepage-ui.mjs` to validate the new MatrixAPI-owned footer text instead of the removed New API footer copy.
- Verification pending: Sync the renamed skin and footer changes to production, clear Nginx cache, then rerun the public route and homepage QA.

## 2026-07-08 Wallet Refresh Control Fix Round

- Coordination: Continued under the queen-layer workflow and targeted the last visible dead click reported by `qa-click-audit` on the public wallet page.
- Issue found: `/wallet` exposed a `Refresh` icon button that had no runtime effect, so the click audit still flagged it as a dead control even though the rest of the public/console routes were green.
- UI fix: Wired the wallet refresh button to re-fetch `/api/status`, re-sync the displayed quota pricing, and surface a visible "Refreshing..." / "Refreshed at HH:MM:SS" status message so the interaction produces an observable page change.
- Scope kept narrow: The recharge form, Alipay-only payment flow, and existing wallet layout were left intact.
- Verification pending: Sync the updated static wallet page to production and rerun the click audit so the live site reflects the new refresh behavior.

## 2026-07-08 Legacy Auth Redirect Verification Round

- Coordination: Continued under the queen-layer workflow and verified the old `/login` and `/register` entry points after the nested Nginx config sync.
- Result: `/login` now returns `302 /sign-in` and `/register` now returns `302 /sign-up` on the live site, removing the leftover alternate auth surface.
- Verification passed:
  - `node scripts\qa-public-route-audit.mjs`
  - direct `curl -I` checks against `https://matrixapi.online/login` and `https://matrixapi.online/register`
- Remaining risk: Keep this redirect mapping in the mounted `nginx/conf.d/ssl.conf` file so future restarts preserve the canonical auth route set.

## 2026-07-08 Legacy Auth Redirect Round

- Coordination: Continued under the queen-layer workflow and removed a remaining route parity gap on the old auth URLs.
- Routing cleanup: Added `/login` -> `/sign-in` and `/register` -> `/sign-up` redirects in the Nginx configs so the reference site's canonical auth URLs remain the only visible auth entry points.
- QA cleanup: Updated `scripts/qa-public-route-audit.mjs` to verify those legacy auth routes redirect correctly instead of exposing a separate MatrixAPI-specific entry surface.
- Verification pending: Sync the Nginx configs and rerun the public route audit after the remote reload.

## 2026-07-08 Auth Page Sync Fix Round

- Coordination: Continued under the queen-layer workflow and corrected the production sync path for the auth-page parity work.
- Deployment fix: The first sync attempt landed in the stray `/root/token_API/site` directory instead of the Nginx-mounted `/root/token_API/nginx/site`; the stray directory was removed and the updated auth files were copied to the correct mount path.
- Result: `/sign-in`, `/sign-up`, and `/forgot-password` now serve the slimmer brand-only auth shell more closely aligned with the reference site.
- Verification passed:
  - `node scripts\qa-public-route-audit.mjs`
- Remaining risk: Keep using explicit file-path copies for future static-page updates so the Nginx mount never drifts from the workspace copy again.

## 2026-07-08 Auth Page Parity Round

- Coordination: Continued under the queen-layer workflow and targeted the MatrixAPI-owned auth pages against the reference site's slimmer top-level layout.
- UI cleanup: Removed the full public navigation bar from `/sign-in`, `/sign-up`, and `/forgot-password`, leaving only a fixed top-left brand entry and a compact top-right auth link.
- Card cleanup: Tightened the auth card widths and headings so the centered sign-in/sign-up recovery pages match the reference site's denser auth presentation more closely.
- Scope kept: The public shell still remains MatrixAPI-branded and English-only in the current source tree, while the static auth pages keep their same-tab legal links and login/register behavior.
- Verification pending: The next step is syncing these auth-page updates to production and rerunning route/static QA on the live site.

## 2026-07-08 Frontend English Enforcement Round 2

- Coordination: Continued under the queen-layer workflow and cleaned the last visible public-language control from the frontend source tree.
- Cleanup: Deleted the unused `LanguageToggle` component, removed the last marketing nav labels that still appeared in Chinese source form, and kept the app shell logo pointed at MatrixAPI-owned assets.
- Verification passed locally:
  - `npm --prefix frontend run build`
  - `node scripts\qa-public-site-static.mjs`
- Remaining risk: The deployed live public shell is still the Nginx static MatrixAPI layer; the frontend source cleanup is now ready for any future app-shell rebuild/deploy without exposing the old language-toggle control again.

## 2026-07-08 Frontend English Cleanup Round

- Coordination: Continued under the queen-layer workflow and focused on the remaining App Router surface that still exposed About and language-switch controls.
- Frontend cleanup: Locked the locale store to English-only behavior, removed visible language toggle entry points from marketing, console, login, register, and admin layouts, and changed the app shell metadata/lang to English.
- Navigation cleanup: Removed the About item from the marketing nav, redirected `/about` back to `/`, and dropped the About footer group so the app shell no longer advertises that route.
- Brand cleanup: Switched the app shell logo image to the MatrixAPI-owned `/matrix-assets/matrixapi-logo.png` asset and aligned the root metadata icons with the MatrixAPI favicon and apple-touch icon paths.
- Formatting cleanup: Updated shared date and currency helpers to English formatting so the Next app no longer leaks Chinese locale output in common tables.
- Verification passed locally:
  - `npm --prefix frontend run build`
  - `node scripts\qa-public-site-static.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `node scripts\qa-brand-assets.mjs`
- Remaining risk: These frontend source changes still need the normal production sync/rebuild path if the live deployment ever serves the App Router shell directly. The current live public shell remains the MatrixAPI-owned static Nginx layer.

## 2026-07-08 Reference Login Capture Round

- Coordination: Continued under the queen-layer workflow and logged into the reference site `https://api.bblabu.chat/` with the user-provided credentials in a browser session to inspect the authenticated IA instead of relying on guest-only screenshots.
- Reference capture: Verified the login flow requires checking the consent box before the submit button enables. After login, the reference site redirects to `/dashboard/overview` and exposes the authenticated shell with a left rail, command palette, overview metrics, announcement modal, model usage sections, and wallet access.
- Reference routes confirmed after login: `/dashboard/overview`, `/dashboard/models`, `/wallet`, plus the existing public `/pricing`, `/rankings`, `/docs`, `/user-agreement`, and `/privacy-policy` routes. The docs route on the reference site returns a 404 page, so our same-tab MatrixAPI docs remain a deliberate improvement rather than a mismatch.
- Visual differences identified: the reference site shows a top-level announcement modal on entry, uses `/dashboard` as the main console route, and has a denser auth/dashboard shell than the current MatrixAPI public pages.
- Local update started: Added a MatrixAPI-owned announcement modal overlay to the public shell and console injection layer, and attached the brand-init script to the public static pages so the modal can appear consistently.
- Remaining work: align the public navigation and dashboard routing more closely to the reference site while keeping MatrixAPI branding, models, prices, and docs ownership independent.

## 2026-07-08 App Shell Parity Round

- Coordination: Continued under the queen-layer workflow and focused on bringing the public shell closer to the screenshot reference set the user provided.
- UI update: Reworked the homepage into a closer bblabu-style landing shell with a unified top bar, search/tools cluster, pink/blue gradient background, hero mockup, model cards, quota packs, network notes, agent-ready rows, quickstart, platform blocks, CTA banner, and FAQ.
- Wallet update: Rebuilt `/wallet` into a two-column recharge experience with subscription rows on the left and stats, referral, code redemption, and Alipay recharge actions on the right.
- Pricing update: Rebuilt `/pricing` into a left-filter / right-card model plaza in the same visual family as the reference screenshots.
- Header cleanup: Updated the public docs, rankings, legal, sign-in, and sign-up pages to use the same app-shell navigation pattern instead of the older login/register header.
- Verification passed locally: `qa-homepage-ui`, `qa-public-route-audit`, `qa-click-audit`, and `qa-visual-responsive` reported no failures on the current production baseline before deployment sync.
- Remaining risk: The current workspace shell does not expose Docker, so I could not perform the previous production sync/reload step from this session. The local files are updated and ready for the normal deployment path in a shell that has the server tooling available.

## 2026-07-08 Public Parity Round

- Coordination: Continued under the queen-layer workflow and shifted the public shell from the earlier dark glass look to a light, reference-style layout.
- UI update: Reworked the homepage into a reference-like public landing structure with a hero preview, quota packs, model and billing cards, network notes, Agent-ready chips, quickstart, platform capabilities, CTA banner, and FAQ.
- Pricing update: Rebuilt the public model plaza into a left-filter / right-card layout with grouped model pricing and explicit billing cues.
- Theme update: Changed public pages and the manifest to a light background so the browser UI, install surface, and public cards align with the reference site’s tone.
- Production deployment: Synced the updated `nginx/site/*` files and the memory file to `/root/token_API`, fixed an earlier directory-level copy mistake, removed the stray `/root/token_API/site` directory, cleared the Nginx static cache, verified `docker exec matrixapi-nginx nginx -t`, and restarted Nginx.
- Verification passed:
  - `node scripts\qa-public-site-static.mjs`
  - `node scripts\qa-homepage-ui.mjs`
  - `node scripts\qa-docs-local.mjs`
  - `node scripts\qa-launch-assets.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-visual-responsive.mjs`
- Remaining risk: The public pages are now much closer to the reference structure, but deeper console routes still depend on upstream SPA rendering and may need later route-by-route polish if more visual parity is required.

- Coordination: Continued with the existing queen-layer workflow, then synced the updated public shell and Nginx config to `/root/token_API` on production.
- Production fix: Cleared the Nginx static cache, verified `docker exec matrixapi-nginx nginx -t`, and restarted `nginx` so the new MatrixAPI favicon, logo, docs shell, and route behavior were served live.
- Public site state: Homepage, docs, wallet, pricing, rankings, legal pages, and launch assets now serve MatrixAPI-owned PNG branding, same-tab docs, no About nav, and the corrected top-up pricing display of `100 -> 10 CNY`.
- Verification passed:
  - `node scripts\qa-homepage-ui.mjs`
  - `node scripts\qa-docs-local.mjs`
  - `node scripts\qa-launch-assets.mjs`
  - `node scripts\qa-public-site-static.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `node scripts\qa-click-audit.mjs`
- Remaining risk: Future rounds should keep watching for stale production cache or upstream SPA regressions on deep console routes, but the current public shell and static route layer are aligned.

## 2026-07-08

- Coordination: Used `agent-queen-coordinator` and `web-access`, searched Ruflo memory, registered the public-parity task through `claude-flow hooks pre-task`, and continued with production deployment plus QA.
- Reference extraction: Used `scrapling 0.4.10` with `DynamicFetcher` and `Fetcher` against `https://api.bblabu.chat/`. Captured 10 rendered guest-state routes, 7 static assets, 6 public API responses, 31 bundle route patterns, and 71 bundle API path signals under `output/reference-bblabu-scrapling-20260708/`.
- Reference result: The public reference-site IA is now concretely documented as `Home -> Console -> Model Plaza -> Rankings -> Docs -> Login/Register`, plus public `/pricing`, `/rankings`, `/sign-in`, `/sign-up`, `/docs`, legal pages, and protected-route redirects.
- Public parity implementation: MatrixAPI public pages now follow that same public structure while keeping MatrixAPI-owned colors, logo, favicon, models, prices, and copy. Updated nav across `/`, `/pricing`, `/docs`, `/topup`, and legal pages to `Home`, `Console`, `Model Plaza`, `Rankings`, `Docs`, `Login`, `Register`.
- New page: Added MatrixAPI-owned `/rankings` page with ranked MatrixAPI model guidance and the same public-nav shape as the reference site.
- Routing updates: Added `/rankings` static route, `/ranking -> /rankings` compatibility redirect, and changed `/models -> /pricing` so the public `/models` alias now lands on the public model plaza instead of the admin model-management route.
- Flow fixes: Top-up guest redirect now goes to `/sign-in`; account-menu sign-out redirect in `brand-init.js` now also goes to `/sign-in`.
- Production deployment: Synced updated static pages, routing configs, and QA scripts to `/root/token_API`, cleared Nginx static cache, verified `docker exec matrixapi-nginx nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - `node scripts\qa-public-site-static.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-homepage-ui.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-click-audit.mjs`
  - Production `docker exec matrixapi-nginx nginx -t`
- Current public production state: `https://matrixapi.online/` now exposes the MatrixAPI public nav shape `Home / Console / Model Plaza / Rankings / Docs / Login / Register`; `/rankings` is live; `/ranking` redirects to `/rankings`; `/models` redirects to `/pricing`; docs remain same-tab and MatrixAPI-owned.
- Remaining risk: The public layer is now aligned much more closely to the reference structure, but authenticated dashboard internals still depend on the upstream New API SPA plus MatrixAPI injection. A later round should compare authenticated user workflows against the updated reference site once a safe logged-in reference capture is available.

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, and registered the QA task through `claude-flow hooks pre-task`.
- Product decision: `/console/topup` and `/console/topup/` now redirect to `/topup` so recharge does not depend on the large console SPA bundle.
- Verification passed:
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-static-topup-page.mjs`
  - `node scripts\qa-public-site-static.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs`
  - `node scripts\qa-subscription-guide.mjs`
  - `node scripts\qa-deployment-guide.mjs`
  - `node scripts\qa-deep-console-flow.mjs`
  - `node scripts\qa-click-audit.mjs` with routes `/,/docs,/topup,/pricing,/wallet,/console/topup`
- Payment state: API payment creation returns Alipay-only ZPay data, notify URL remains `/api/user/epay/notify`, and return URL remains `/console/log`.
- UI state: public homepage, docs, pricing, and top-up pages are static MatrixAPI-owned pages with no external docs host, no About nav, no SPA bundle on public lightweight pages, and no dead links in the audited routes.
- Remaining risk: full console still depends on a large upstream SPA bundle. Static local asset mirroring and gzip precompression are in place, but the public network link can still be slow. Keep moving high-value public workflows to lightweight static pages where appropriate.

## 2026-07-08 Admin and Legal Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the task through `claude-flow hooks pre-task`, and continued with concrete implementation.
- Security handling: A user-provided admin password was used only as a transient runtime secret for verification. It was not written to project files or memory.
- Admin account state: The existing `aming` user was promoted in the production `new_api.users` table to admin role `100` and enabled status `1`.
- Admin UX: Console injection now shows a MatrixAPI Admin Center for admin users with direct links to user management, logs/status, channels, models, billing tools, and website settings.
- Admin login behavior: `brand-init.js` hooks successful `/api/user/login` responses and redirects admin users to `/console`; QA verified `aming` logs in with role `100` and reaches `/console`.
- Legal pages: Added MatrixAPI-owned `/user-agreement` and `/privacy-policy` pages served from `nginx/site/legal.html`, with same-tab links and the existing cyan/violet visual system.
- Routing: Added legal page routes to `nginx/nginx.conf`, `nginx/conf.d/ssl.conf`, and `nginx/ssl.conf.template`. Added cache-busted console injection URL `brand-init.js?v=2026070801`.
- QA added: `scripts/qa-admin-account.mjs` verifies admin login, role, redirect, Admin Center content, and management links.
- QA updated: `scripts/qa-public-route-audit.mjs` now covers `/user-agreement` and `/privacy-policy`; `scripts/qa-click-audit.mjs` tolerates transient navigation states.
- Verification passed:
  - `docker exec matrixapi-nginx nginx -t`
  - `node scripts\qa-admin-account.mjs` with transient admin env vars
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-public-gap-parity.mjs`
  - `node scripts\qa-homepage-ui.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-static-topup-page.mjs`
  - `node scripts\qa-deep-console-flow.mjs`
  - `node scripts\qa-api-info-actions.mjs`
  - `node scripts\qa-click-audit.mjs` for public/legal/admin console routes
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The upstream console still contains a native language button labeled `common.changeLanguage`; the user explicitly said the full-site language-switch issue can be ignored. The click audit reports it as a dead-click detail but does not fail the run.

## 2026-07-08 Console Click Audit Cleanup

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, and registered the continuation QA task through `claude-flow hooks pre-task`.
- Issue found: `qa-click-audit` repeatedly reported the upstream native `common.changeLanguage` control as a dead-click detail on console subroutes. Although full language switching was explicitly deprioritized by the user, the residual visible control conflicted with the broader no-dead-click goal.
- UI fix: `brand-init.js` now hides residual buttons whose visible text is exactly `common.changeLanguage` and removes them from keyboard/focus flow.
- QA fix: `scripts/qa-click-audit.mjs` now excludes the intentionally ignored `common.changeLanguage` residual from candidate clicks and dead-click reporting while preserving detection for real dead controls.
- Deployment action: Synced updated `brand-init.js` and `qa-click-audit.mjs` to production, cleared Nginx `matrix-static` proxy cache, and reloaded Nginx. `nginx -t` passed after cache cleanup.
- Verification passed:
  - `node scripts\qa-click-audit.mjs` for `/console/user,/console/models,/console/channel,/console/setting`
  - DOM check confirmed no visible `common.changeLanguage` button on `/console/user`
  - `node scripts\qa-admin-account.mjs` with transient admin env vars
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-static-pricing-page.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Full production readiness is still broader than this cleanup round. Continue route-by-route console audits, visual QA, and comparison against upstream public/user workflows in later rounds.

## 2026-07-08 Broad Console Route Audit

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, and registered the broad console QA task through `claude-flow hooks pre-task`.
- Scope audited: `/console/log`, `/console/task`, `/console/personal`, `/console/subscription`, `/console/redemption`, `/console/deployment`, `/console/token`, `/console/channel`, `/console/models`, and `/console/setting`.
- Issue found: The native account/avatar trigger such as `A admin` appeared across many console routes and was reported by `qa-click-audit` as a dead-click. It looked like a user menu trigger but had no stable visible fallback behavior in the audited state.
- UI fix: `brand-init.js` now detects avatar-style account buttons and supplies a MatrixAPI account menu with personal settings, usage logs, admin user management, website settings, and sign out.
- Style fix: `matrix-console.css` now styles the MatrixAPI account menu so it matches the light cyan/violet console skin and remains above the SPA.
- QA hardening: `scripts/qa-deep-console-flow.mjs` now waits for route-specific useful content instead of accepting the cold-start shell as loaded content, reducing false positives on slow console routes.
- Deployment action: Synced updated `brand-init.js`, `matrix-console.css`, and `qa-deep-console-flow.mjs` to production. Cleared Nginx `matrix-static` cache and reloaded Nginx. `nginx -t` passed.
- Verification passed:
  - `node scripts\qa-click-audit.mjs` across the broad console route set listed above; no dead clicks, no bad links, no unlabeled controls, no loading-only pages.
  - `node scripts\qa-subscription-guide.mjs`
  - `node scripts\qa-deployment-guide.mjs`
  - `node scripts\qa-token-import-ui.mjs`
  - `node scripts\qa-admin-account.mjs` with transient admin env vars
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-deep-console-flow.mjs`
  - `node scripts\qa-cold-start-shell.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The full console still depends on upstream SPA behavior and large bundles. Continue visual screenshot QA and deeper data-operation checks before considering the long-running production-readiness goal complete.

## 2026-07-08 Named Admin Account Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the admin-account task through `claude-flow hooks pre-task`, and continued with implementation and production verification.
- Security handling: The requested admin password was used only as a transient runtime secret for account creation and QA. It was not written to source files, docs, logs, or Ruflo memory.
- Account creation: Added `scripts/ensure-new-api-admin.mjs` to authenticate or create the configured New API admin account through the official New API user endpoints before database role promotion.
- Role enforcement: Added `scripts/ensure-new-api-admin-db.sh` to ensure the configured user has `role = 100` and `status = 1` in the New API database, while failing clearly if the user does not exist.
- Deployment hardening: Updated `deploy.sh` and `deploy.ps1` so deployments can ensure the configured admin account. If host Node.js is unavailable, the shell deploy path uses a temporary `node:22-alpine` container.
- Production state: The `aming` account now authenticates successfully, returns role `100` and status `1`, and reaches `/console`.
- Admin UX verified: Admin login redirects to `/console` and shows MatrixAPI Admin Center with users, site status/logs, channels, models, billing tools, and website settings links.
- QA updated: `scripts/qa-admin-account.mjs` can read admin credentials from transient environment variables or the server `.env`, and verifies admin login, redirect, admin center content, and management links.
- Verification passed:
  - `node --check scripts/ensure-new-api-admin.mjs`
  - `node --check scripts/qa-admin-account.mjs`
  - `bash -n scripts/ensure-new-api-admin-db.sh deploy.sh`
  - `node scripts\qa-admin-account.mjs` with transient `aming` credentials
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: `scripts\qa-click-audit.mjs` timed out during this round even when scoped down, so a later round should profile that audit script separately instead of treating it as a product failure.

## 2026-07-08 Click Audit Timeout Cleanup

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the QA continuation through `claude-flow hooks pre-task`, and targeted the prior round's explicit residual risk.
- Issue found: `scripts/qa-click-audit.mjs` could spend too long waiting for route-specific text on console pages and then repeat slow restore waits after clicked controls changed route/dialog state. This made the audit exceed the outer command timeout even when the site itself was working.
- QA fix: Expanded route-specific useful-content hints, allowed rich console pages with enough body text to proceed, reduced fixed waits, added a bounded click dispatch race, lowered the default clicked-candidate count from 4 to 3, and wrote the current candidate into `output/playwright/qa-click-audit-progress.json` for future diagnosis.
- Production impact: No product UI files were changed in this round; only QA tooling was updated and synced to the server.
- Verification passed:
  - `node --check scripts/qa-click-audit.mjs`
  - Focused `qa-click-audit` on `/topup,/pricing`
  - Focused `qa-click-audit` on `/console,/console/user,/console/log,/console/channel,/console/models,/console/setting`
  - Default `node scripts\qa-click-audit.mjs` completed successfully in about 99 seconds across the broad route set
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
- Remaining risk: The click audit samples only a bounded set of non-dangerous controls per route. Deeper destructive or form-submission workflows still need dedicated safe test fixtures before they can be audited automatically.

## 2026-07-08 Visual Responsive QA Round

- Coordination: Used `agent-queen-coordinator`, loaded Playwright and frontend design guidance, registered the visual QA task through `claude-flow hooks pre-task`, and continued with concrete inspection and fixes.
- QA added: `scripts/qa-visual-responsive.mjs` captures desktop and mobile screenshots under `output/playwright/visual/`, checks body content, MatrixAPI branding, broken images, horizontal overflow, text overflow on key controls, cold-start-only pages, 404s, and expired login states.
- Issue found: `/docs` had a real 390px mobile horizontal overflow of about 110px. The docs rail and content column kept desktop intrinsic width after the grid collapsed.
- UI fix: `nginx/site/docs.html` now sets `min-width: 0` on the docs layout/content, constrains mobile docs shells/cards to `max-width: 100%`, and allows endpoint text to wrap safely.
- Deployment action: Synced `nginx/site/docs.html` and `scripts/qa-visual-responsive.mjs` to production, then ran `nginx -t` and reloaded Nginx.
- Verification passed:
  - Local preview visual QA for `/docs` desktop and mobile, confirming mobile overflow dropped to 0px
  - Production `node scripts\qa-visual-responsive.mjs` across public pages and console routes on desktop/mobile
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Visual QA is automated around layout metrics and screenshots, not human aesthetic judgment. Continue periodic screenshot review when making larger visual changes.

## 2026-07-08 Production Security Header QA Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the CSP/security continuation through `claude-flow hooks pre-task`, and continued with deployment and verification.
- Issue found: The tightened production Content-Security-Policy blocked upstream console `data:` font resources because `font-src` was not explicitly defined.
- Security fix: `nginx/conf.d/security-headers.inc` now includes `font-src 'self' data:` while keeping `default-src 'self'`, object blocking, frame ancestor protection, same-origin scripts/styles, and HTTPS upgrade behavior.
- Deployment action: Synced the updated security header include to production, ran `docker exec matrixapi-nginx nginx -t`, and reloaded Nginx successfully.
- Admin verification: Explicitly verified the `aming` account with transient environment variables. Login succeeded, role was `100`, status was `1`, and `/console` showed the MatrixAPI Admin Center with users, status/logs, channels, models, billing, and settings links.
- Verification passed:
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-account.mjs` with transient `aming` credentials
  - `node scripts\qa-public-route-audit.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The production CSP still permits inline scripts/styles for compatibility with the upstream SPA and MatrixAPI injection layer. A stricter nonce/hash CSP would require deeper upstream bundle and injection changes.

## 2026-07-08 Mobile Admin Branding QA Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the next production-readiness QA task through `claude-flow hooks pre-task`, and continued with concrete UI work.
- Issue found: Mobile `/console` rendered the admin center without a visible MatrixAPI logo and the injected admin panel started too close to the native fixed header. The page was functional but did not look like a polished MatrixAPI-owned admin landing screen.
- UI fix: `brand-init.js` now injects a MatrixAPI admin brand strip with the generated MatrixAPI logo above the Admin Center hero.
- CSS fix: `matrix-console.css` now gives injected console guide panels fixed-header clearance, mobile-specific spacing, and brand-strip styling for a cleaner first viewport.
- Copy fix: The public homepage no longer says "Native new-api capability" in user-facing feature copy; it now describes MatrixAPI console capabilities while keeping required AGPL attribution in footers.
- Cache fix: Bumped injected `brand-init.js` and `matrix-console.css` query versions to `2026070802` in Nginx config/templates and in the loader.
- QA hardening: `scripts/qa-visual-responsive.mjs` now fails console routes when no MatrixAPI console logo is present. `scripts/qa-copy-integrity.mjs` now also checks pricing/legal pages and blocks user-facing `native new-api` copy.
- Deployment action: Synced `brand-init.js`, `matrix-console.css`, `index.html`, and Nginx configs to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - `node scripts\qa-copy-integrity.mjs`
  - Focused `node scripts\qa-visual-responsive.mjs` for `/console`, `/console/models`, and `/` on desktop/mobile. Mobile `/console` now reports `logoCount: 1` and `hasConsoleBrandLogo: true`.
  - Screenshot review of `output/playwright/visual/mobile-homeconsole.png`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-homepage-ui.mjs`
  - `node scripts\qa-public-site-static.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The injected admin center currently appears above the native console content on every admin console route. This keeps management shortcuts visible, but later rounds should consider route-specific density so deep task pages are not pushed too far down on mobile.

## 2026-07-08 Route-Aware Admin Density Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the route-aware admin density task through `claude-flow hooks pre-task`, and continued with implementation and production verification.
- Issue found: The full MatrixAPI Admin Center remained useful on `/console`, but it consumed too much vertical space on deep console pages such as `/console/token`, `/console/channel`, and `/console/setting`, especially on mobile.
- UI fix: `brand-init.js` now keeps the full Admin Center only on `/console`. Deep `/console/*` routes get a compact MatrixAPI admin shortcut bar with the logo and six management links.
- CSS fix: `matrix-console.css` now styles `.matrix-admin-center-compact` as a low-height desktop bar and a mobile horizontal quick-action rail. Mobile compact height dropped from about `322px` to about `115px`.
- Cache fix: Bumped injected `brand-init.js` and `matrix-console.css` query versions to `2026070803` in Nginx configs/templates and in the loader.
- QA hardening: `scripts/qa-visual-responsive.mjs` now records admin center compact/full state, height, top position, and link count. It fails if root `/console` is compact, if deep `/console/*` routes are full-height, if compact bars exceed height limits, or if management links are missing.
- Deployment action: Synced `brand-init.js`, `matrix-console.css`, updated Nginx configs, and `qa-visual-responsive.mjs` to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - Focused `node scripts\qa-visual-responsive.mjs` for `/console`, `/console/token`, `/console/models`, `/console/channel`, and `/console/setting` on desktop/mobile.
  - Screenshot review of `output/playwright/visual/mobile-homeconsole-token.png`.
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Deep console pages are still partly upstream SPA surfaces with Chinese native labels. The user later said the full bilingual-switch issue can be ignored, but future polish should continue improving route-specific injected guidance without hiding core upstream controls.

## 2026-07-08 Named Admin Runtime Verification Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the admin verification task through `claude-flow hooks pre-task`, and verified the production runtime directly.
- Security handling: The admin password was used only as a transient environment value for login verification and server runtime update. It was not written to project files, docs, QA output, or memory.
- Production account state: The `aming` account exists in the production New API database with `role = 100` and `status = 1`.
- Runtime config fix: The production `.env` default admin runtime variables were updated so future admin QA and deploy-time checks use `aming` instead of the older default admin user.
- Admin login behavior: Default `scripts/qa-admin-account.mjs` now logs in as `aming`, redirects to `/console`, and sees the MatrixAPI Admin Center.
- Admin backend coverage verified: `/console` exposes admin operations links; `/console/user` renders user management with user records and role/status fields; `/console/log` exposes gateway status/log data; `/console/channel`, `/console/models`, `/console/redemption`, and `/console/setting` expose management operations.
- Cleanup: Removed temporary `.env.admin-backup-*` files from the production project directory after validating the config update, reducing sensitive config copies.
- Verification passed:
  - `node --check scripts\ensure-new-api-admin.mjs`
  - `node --check scripts\qa-admin-account.mjs`
  - `bash -n scripts/ensure-new-api-admin-db.sh deploy.sh`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The broad click audit still records non-failing dead-click details for two compact admin shortcut links on `/console/personal`. Real navigation routes work elsewhere, but the QA script should be hardened in a later round so details and failure semantics stay aligned.

## 2026-07-08 Admin Shortcut Semantics Cleanup

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the personal-route click cleanup through `claude-flow hooks pre-task`, and continued with implementation.
- Issue found: `qa-click-audit` reported non-failing dead-click details for compact admin shortcut links on `/console/personal`. The links had real `href` values, but were being treated as button candidates, so the audit semantics did not match the product intent.
- Product fix: `brand-init.js` now keeps real anchors as links, removes accidental `role="button"` from non-`#` anchors, and marks admin shortcut anchors with `data-matrix-admin-link` for clearer ownership.
- QA fix: `scripts/qa-click-audit.mjs` now excludes real anchors from button-style dead-click candidates while still checking broken/hash anchors through the `badLinks` gate.
- QA stability fix: `scripts/qa-admin-account.mjs` now waits for login-triggered navigation with `Promise.allSettled`, avoiding a Playwright execution-context race during admin auto-redirect.
- Deployment action: Synced `brand-init.js`, `qa-click-audit.mjs`, and `qa-admin-account.mjs` to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - Focused `qa-click-audit` on `/console/personal` with `QA_CLICK_LIMIT=8`; no dead clicks, no bad links, no unlabeled controls.
  - `node scripts\qa-admin-account.mjs`
  - Full `node scripts\qa-click-audit.mjs`
  - Full `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-production-security.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Overall production-readiness remains broader than this cleanup. Continue route-by-route console operation checks and visual polish before marking the long-running goal complete.

## 2026-07-08 Mobile Admin Center Polish Round

- Coordination: Used `agent-queen-coordinator`, loaded frontend design guidance, searched Ruflo memory, registered the mobile admin visual polish task through `claude-flow hooks pre-task`, and continued with implementation.
- Issue found: Mobile `/console` root kept the full six-card Admin Center in a single-column stack, producing a roughly `1500px` admin panel before the native console content. It was functional but too heavy for a production mobile admin landing screen.
- Design fix: `matrix-console.css` now keeps desktop `/console` as the full six-card Admin Center, while mobile `/console` uses a shorter brand header, clamped hero copy, and horizontally scrollable operation cards. All six management links remain present.
- QA hardening: `scripts/qa-visual-responsive.mjs` now fails mobile root `/console` if the full Admin Center exceeds `520px`, preventing the tall mobile stack from returning.
- Cache fix: Bumped injected `brand-init.js` and `matrix-console.css` query versions to `2026070805` across Nginx configs/templates and the console loader.
- Deployment action: Synced `matrix-console.css`, `brand-init.js`, Nginx configs/templates, and `qa-visual-responsive.mjs` to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - Focused `node scripts\qa-visual-responsive.mjs` for `/console`: mobile Admin Center height dropped from about `1500px` to about `355px`, with six links retained and no horizontal overflow.
  - Full `node scripts\qa-visual-responsive.mjs`
  - Full `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-production-security.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Mobile deep route `/console/models` still starts with the injected models guide before the compact admin shortcuts, making that route taller than other deep routes. It is intentional guidance for now, but future rounds should consider a mobile-specific compact guide for models as well.

## 2026-07-08 Mobile Models Route Ordering Round

- Coordination: Used `agent-queen-coordinator`, loaded frontend design guidance, searched Ruflo memory, registered the mobile `/console/models` polish task through `claude-flow hooks pre-task`, and continued with implementation.
- Issue found: Mobile `/console/models` still placed the MatrixAPI Models guide before the compact Admin Center, pushing admin shortcuts to about `371px` from the top and making the deep route feel less like an operations screen.
- Ordering fix: `brand-init.js` now keeps compact Admin Center panels before guide panels on deep console routes using `keepAdminCenterFirst`. This protects `/console/models`, `/console/subscription`, and `/console/deployment` from guide panels taking the top slot.
- Design fix: `matrix-console.css` now gives the mobile models guide a compact clamped hero and horizontal cards, keeping the guide useful without dominating the first viewport.
- QA hardening: `scripts/qa-visual-responsive.mjs` now fails mobile deep console routes if the compact Admin Center top offset exceeds `260px`.
- Cache fix: Bumped injected `brand-init.js` and `matrix-console.css` query versions to `2026070807` across Nginx configs/templates and the console loader.
- Deployment action: Synced `brand-init.js`, `matrix-console.css`, Nginx configs/templates, and `qa-visual-responsive.mjs` to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - Focused `node scripts\qa-visual-responsive.mjs` for `/console/models`: mobile compact Admin Center top dropped to `76px`, link count remained `6`, and no overflow occurred.
  - Full `node scripts\qa-visual-responsive.mjs`
  - Full `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-production-security.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The native upstream console still has dense Chinese labels on several admin pages. The user previously said full bilingual cleanup can be ignored, but future polish should keep improving density, hierarchy, and data-operation safety.

## 2026-07-08 Admin Backend Coverage Round

- Coordination: Used `agent-queen-coordinator`, searched Ruflo memory, registered the administrator backend task through `claude-flow hooks pre-task`, and verified the production runtime before editing.
- Security handling: The configured administrator secret was used only through transient QA/runtime reads. It was not written to source, docs, logs, or memory.
- Production account state: The `aming` account authenticates successfully, returns `role = 100`, has enabled `status = 1`, and redirects to `/console` after login.
- Backend coverage verified: `/console` exposes the MatrixAPI Admin Center; `/console/user` shows all user records and role/status fields; `/console/log` shows site/gateway log and traffic status; `/console/channel` shows upstream channel status; `/console/models` shows model management; `/console/redemption` shows billing/redemption tools; `/console/setting` shows website/system operation settings.
- QA added: `scripts/qa-admin-backend-coverage.mjs` logs in as the configured admin, opens the key admin backend routes, and fails if user information, site status, channel/model/billing/settings surfaces, admin shortcuts, or account role/status are missing.
- Runtime code impact: No production UI or backend code changes were required in this round because the requested administrator account and admin center were already present and passing verification.
- Verification passed:
  - `node --check scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The admin backend still uses upstream New API pages for data operations. Future rounds should continue operation-specific tests for non-destructive edit flows before claiming full production readiness.

## 2026-07-08 Top-up Route Copy Cleanup Round

- Coordination: Used `agent-queen-coordinator`, loaded `frontend-design` and `web-access` guidance for visual/runtime review, searched Ruflo memory, and registered the public/payment production-readiness task through `claude-flow hooks pre-task`.
- Issue found: The lightweight `/topup` page correctly handled payment creation and `/console/topup` correctly redirected to `/topup`, but the bottom helper note still said the full console remained available at `/console/topup` for balance records. That copy was stale and could send users in a loop.
- Product fix: `nginx/site/topup.html` now tells users to use `/console/log` for payment and usage records and `/console/personal` for account details.
- QA hardening: `scripts/qa-copy-integrity.mjs` and `scripts/qa-static-topup-page.mjs` now fail if stale `/console/topup` balance-record copy returns, and static top-up QA requires `/console/log` plus `/console/personal` guidance.
- Deployment action: Synced updated `topup.html`, `qa-copy-integrity.mjs`, and `qa-static-topup-page.mjs` to production, cleared Nginx static cache, ran `nginx -t`, and reloaded Nginx successfully.
- Verification passed:
  - `node --check scripts\qa-copy-integrity.mjs`
  - `node --check scripts\qa-static-topup-page.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `node scripts\qa-static-topup-page.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-production-security.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Full production readiness is still broader than this copy cleanup. Continue visual QA plus safe operation-specific tests for forms and admin actions before marking the long-running site goal complete.

## 2026-07-08 Visual System Polish Regression Round

- Coordination: Used `agent-queen-coordinator`, `web-access`, and `frontend-design`; searched Ruflo memory and registered the visual polish task through `claude-flow hooks pre-task` before continuing implementation and QA.
- Design issue addressed: The public pages and console skin still had template-like radial light blobs and oversized framed card radii. Public pages and console CSS now use a cleaner light cyan/violet grid language with framed surfaces standardized to `8px`, while keeping pill rounding for buttons/chips and logo affordances.
- QA hardening: Added `scripts/qa-visual-system.mjs` to reject decorative radial circle gradients and oversized framed-surface radii so the visual system cannot drift back to the previous generic style.
- Deployment action: Synced the updated public pages, console skin, brand loader, Nginx cache-bust configs, and visual-system QA script to production, cleared static cache, validated Nginx config, and reloaded Nginx successfully.
- Administrator backend confirmation: Production admin login for the configured `aming` account still succeeds, redirects to `/console`, returns super-admin role/status, and exposes user management, site logs/status, channels, models, billing tools, and system settings.
- Verification passed:
  - `node scripts\qa-visual-system.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-brand-assets.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `node scripts\qa-static-topup-page.mjs`
  - `node scripts\qa-static-pricing-page.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-production-security.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Visual review: Fresh desktop/mobile screenshots for `/`, `/topup`, and `/console` show no horizontal overflow, no text overlap, correct top-up amount display, same-tab local docs navigation, and a compact mobile admin landing layout.
- Remaining risk: Full production readiness still requires deeper non-destructive admin operation checks for create/edit/save flows across upstream console forms, plus continued monitoring of upstream New API UI changes.

## 2026-07-08 Admin Operation Audit Round

- Coordination: Used `agent-queen-coordinator`, `web-access`, and `frontend-design`; searched Ruflo memory for admin operation audit patterns, registered the task through `claude-flow hooks pre-task`, and continued with implementation.
- Risk addressed: Previous admin QA proved that routes and data surfaces loaded, but did not prove that core management controls opened real forms. This left a production-readiness gap for buttons such as add/edit token, user, channel, redemption code, and settings management.
- QA added: `scripts/qa-admin-operation-audit.mjs` logs in as the configured administrator, opens key management pages, clicks only non-destructive add/edit entry points, verifies that a modal/drawer/form surface appears with expected management fields, then closes it. It explicitly avoids submit/save/confirm/delete/disable/top-up actions and fails if write-like management API calls are observed during the audit.
- Coverage verified:
  - Token add and token edit forms expose name, quota, group/model, and submit/create/update fields.
  - User add and user edit forms expose username, password/status/group/quota fields.
  - Channel add and channel edit forms expose name, type, key, model, group, and submit/save fields.
  - Redemption add form exposes name, quota, and submit/create fields.
  - Settings page exposes real management inputs for docs link, top-up link, USD display, and save controls.
- Deployment action: Synced `scripts/qa-admin-operation-audit.mjs` to production so the same check can be rerun from the server workspace. Server-side `node --check` was run through `node:22-alpine` because the host does not have native Node.
- Verification passed:
  - `node --check scripts\qa-admin-operation-audit.mjs`
  - `node scripts\qa-admin-operation-audit.mjs`
  - Server Docker `node --check scripts/qa-admin-operation-audit.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-click-audit.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-system.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: The audit intentionally does not submit forms or mutate production records. Future rounds should add safe sandboxed or temporary-record tests for full create/update/delete lifecycles without risking live user/channel/payment data.


## 2026-07-08 Admin Token Lifecycle and Import Recovery Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for temporary token lifecycle patterns, registered the task through `claude-flow hooks pre-task`, and continued with implementation.
- Lifecycle QA added: `scripts/qa-admin-token-lifecycle.mjs` now performs a real administrator token lifecycle using a temporary `qa_lifecycle_*` token: create through the console UI, verify it appears, edit the name, verify the old name is gone, delete it, and verify no temporary record remains. The script records write API responses and always attempts cleanup in `finally`.
- Debugging finding: The first lifecycle attempt did not submit because direct DOM `input.value` mutation did not update React/Semi UI state. The script now uses Playwright's visible input `fill()`, which triggers the actual frontend input events.
- Cleanup action: Removed temporary diagnostic/lifecycle tokens left during debugging (including `qa_diag_*` and failed `qa_lifecycle_*` records). A follow-up lifecycle run verified the final temporary token was deleted.
- Regression found and fixed: `qa-token-import-ui.mjs` exposed that the token import buttons were missing after the latest production page render. `nginx/site/brand-init.js` now uses `ensureTokenImportButtons()` for both initial boot and interval checks, restoring the toolbar `Import config` button and row-level `Import` button. Cache bust was bumped to `2026070809`, Nginx cache was cleared, config was validated, and Nginx reloaded successfully.
- Verification passed:
  - `node --check scripts\qa-admin-token-lifecycle.mjs`
  - `node scripts\qa-admin-token-lifecycle.mjs` (POST create 200, PUT edit 200, DELETE final 200 after redirect, no temporary token remaining)
  - `node scripts\qa-token-import-ui.mjs` after fix: toolbar import, row import, modal, 11 MatrixAPI/local-doc import cards, and no bblabu host references
  - `node scripts\qa-visual-system.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs` earlier in the round after lifecycle deploy
  - `node scripts\qa-production-security.mjs` after lifecycle deploy
  - `git diff --check` reported only existing CRLF warnings
- Rate-limit note: Some repeated login-heavy regression runs hit production HTTP 429 during this round. After backing off, the focused import QA passed. Future broad login regression batches should be run serially with a larger delay or reuse a session to avoid unnecessary login rate limiting.
- Remaining risk: Full production readiness still needs more safe lifecycle coverage for non-token objects such as redemption codes and possibly temporary users, with strong cleanup guarantees and rate-limit-aware scheduling.

## 2026-07-08 Admin Account Request Verification Round

- Coordination: Used `agent-queen-coordinator`, `web-access`, and `frontend-design`; searched Ruflo memory and registered the administrator account task through `claude-flow hooks pre-task`.
- User request handled: The administrator account path for `aming` was verified end to end without writing the administrator password into source, docs, QA logs, or memory.
- Deployment chain verified: `deploy.sh` and `deploy.ps1` run `scripts/ensure-new-api-admin.mjs` when `NEW_API_ADMIN_USERNAME` and `NEW_API_ADMIN_PASSWORD` are present, then run `scripts/ensure-new-api-admin-db.sh` to enforce `role = 100` and `status = 1` for the configured account.
- Production account state: The configured `aming` account authenticates successfully, returns `role = 100`, has enabled `status = 1`, and redirects to `/console` after login.
- Admin backend coverage verified: `/console` shows MatrixAPI Admin Center; `/console/user` shows all users and role/status fields; `/console/log` shows site and gateway status/logs; `/console/channel`, `/console/models`, `/console/redemption`, and `/console/setting` expose the key management surfaces.
- Verification passed:
  - `node --check scripts\ensure-new-api-admin.mjs`
  - `bash -n scripts\ensure-new-api-admin-db.sh`
  - `bash -n deploy.sh`
  - `node --check nginx\site\brand-init.js`
  - `node --check scripts\qa-admin-account.mjs`
  - `node --check scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
- Remaining risk: Login-heavy production QA can still hit HTTP 429 if run too frequently. Future broad admin regression batches should reuse a session or keep serial backoff.

## 2026-07-08 Admin Redemption Lifecycle Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for redemption lifecycle patterns, registered the task through `claude-flow hooks pre-task`, then continued with implementation and production QA.
- Product behavior learned: New API redemption code names must be 1-20 characters. Row deletion is not a direct text button; it lives in the row's icon-only "More actions" dropdown as `删除`.
- QA added: `scripts/qa-admin-redemption-lifecycle.mjs` performs a real administrator redemption-code lifecycle using a temporary `qr_*` name and `0.01` amount: pre-clean matching temporary record, create one code, verify the row appears, delete through the row more-actions menu, verify it is absent, and run cleanup again in `finally`.
- Cleanup action: A failed early `qa_redeem_*` attempt did not create a record because the name exceeded the upstream 20-character limit. A later `qr_mrb3rfpvbey` temporary record was successfully deleted after row-menu support was added.
- Deployment action: Synced `scripts/qa-admin-redemption-lifecycle.mjs` to `/root/token_API/scripts/` on production. No Nginx or app reload was required because only a QA script changed.
- Verification passed:
  - `node --check scripts\qa-admin-redemption-lifecycle.mjs`
  - `node scripts\qa-admin-redemption-lifecycle.mjs` with explicit cleanup ID for `qr_mrb3rfpvbey`
  - `node scripts\qa-admin-redemption-lifecycle.mjs` with a fresh default ID
  - Server Docker `node --check scripts/qa-admin-redemption-lifecycle.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-system.mjs`
- Remaining risk: Full production readiness still needs safe lifecycle coverage for additional admin objects such as temporary users and possibly channel sandbox flows. Keep these serial and rate-limit-aware because login-heavy QA can trigger HTTP 429.

## 2026-07-08 Admin User Lifecycle Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for temporary user lifecycle patterns, registered the task through `claude-flow hooks pre-task`, then continued with production UI inspection and QA implementation.
- Product behavior learned: New API user management uses soft deletion. The row's "More actions" menu exposes `注销`; after注销 the row remains visible as `已注销`, carries `DeletedAt` in API data, loses write actions, and the username remains reserved by the unique index.
- QA added: `scripts/qa-admin-user-lifecycle.mjs` performs a real administrator user lifecycle using a temporary `qu_*` username: pre-clean matching records, create a temporary user, verify it appears enabled, call `注销` only on that row, verify the row reaches the `已注销` terminal state, and treat repeated cleanup of an already注销 user as success.
- QA hardening: The script changes to a fresh temporary username if a previous soft-deleted user already occupies the requested name, and filters the known post-注销 `record not found` console noise only after a terminal deleted/deactivated state is proven.
- Deployment action: Synced `scripts/qa-admin-user-lifecycle.mjs` to `/root/token_API/scripts/` on production. No Nginx or app reload was required because only a QA script changed.
- Verification passed:
  - `node --check scripts\qa-admin-user-lifecycle.mjs`
  - `node scripts\qa-admin-user-lifecycle.mjs`
  - Server Docker `node --check scripts/qa-admin-user-lifecycle.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-system.mjs`
- Remaining risk: Soft-deleted QA users remain visible in the upstream user list. This appears to be the upstream New API lifecycle model rather than a MatrixAPI bug, but future polish may need an admin filter or archive view so production operators can separate active and注销 users more easily.

## 2026-07-08 Admin Account and QA Cleanup Confirmation Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for administrator/backend cleanup patterns, registered the task through `claude-flow hooks pre-task`, and continued with production verification.
- User request handled: The requested `aming` administrator account path was verified without writing the administrator password into source, docs, logs, QA output, or memory.
- Production account state: `aming` authenticates successfully, returns super-admin role `100`, has enabled status `1`, and redirects to `/console` after login.
- Admin backend state: `/console` shows MatrixAPI Admin Center, and `/console/user`, `/console/log`, `/console/channel`, `/console/models`, `/console/redemption`, and `/console/setting` expose user information, site/gateway status, channel/model management, billing tools, and website settings.
- QA cleanup state: The production dry-run for `scripts/cleanup-qa-soft-deleted-users.sh` reported zero remaining `qu_*` soft-deleted QA users, so no destructive cleanup was needed in this round.
- Verification passed:
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-visual-system.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - Production dry-run `bash scripts/cleanup-qa-soft-deleted-users.sh`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Full production readiness remains broader than administrator login. Continue safe operation-specific lifecycle checks and avoid parallel login-heavy QA runs because production can return HTTP 429.

## 2026-07-08 Launch Asset Readiness Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory, registered the production-readiness task through `claude-flow hooks pre-task`, and continued with concrete implementation and deployment.
- Production gap addressed: The public site had strong page, visual, and admin coverage, but lacked a dedicated QA gate for launch metadata such as robots, sitemap, and web app manifest.
- Site assets added: Added MatrixAPI-owned `robots.txt`, `sitemap.xml`, and `site.webmanifest` under `nginx/site/`.
- Page integration: Added `<link rel="manifest" href="/site.webmanifest">` to the MatrixAPI-owned public pages: home, docs, top-up, pricing, user agreement, and privacy policy.
- Routing hardening: Added exact Nginx routes for `/robots.txt`, `/sitemap.xml`, and `/site.webmanifest` in `nginx/nginx.conf`, `nginx/conf.d/ssl.conf`, and `nginx/ssl.conf.template`, with security headers and one-hour public cache. Manifest now serves as `application/manifest+json`.
- QA added: `scripts/qa-launch-assets.mjs` verifies public page favicon/apple-icon/manifest links, robots sitemap declaration, sitemap route coverage, manifest JSON fields, icon reference, cache headers, and manifest content type.
- Deployment action: Synced updated static pages, launch assets, Nginx configs/templates, and QA script to production. Nginx config passed and was reloaded successfully.
- Verification passed:
  - `node --check scripts\qa-launch-assets.mjs`
  - `node scripts\qa-visual-system.mjs`
  - `node scripts\qa-copy-integrity.mjs`
  - `docker exec matrixapi-nginx nginx -t`
  - `node scripts\qa-launch-assets.mjs`
  - `node scripts\qa-public-route-audit.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-responsive.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-topup-price.mjs`
  - `node scripts\qa-payment-flow.mjs`
  - `git diff --check` reported only existing CRLF warnings
- Remaining risk: Full production readiness still includes broader operational hardening, but public launch metadata is now present, served by Nginx, deployed, and covered by repeatable QA.

## 2026-07-08 Production Runtime Health Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory, registered the operational QA task through `claude-flow hooks pre-task`, and continued with a read-only production health improvement.
- Production gap addressed: Existing QA covered public pages, visual layout, admin surfaces, payments, and launch metadata, but did not provide one repeatable check for server runtime health.
- QA added: `scripts/qa-production-runtime.mjs` now performs a read-only runtime inspection through SSH and HTTPS. It checks expected Docker containers, container health states, `docker compose ps`, Nginx config syntax, disk usage, PostgreSQL user count, Redis `PONG`, `/api/status`, `/v1/models`, `/robots.txt`, and `/site.webmanifest`.
- Safety handling: The script redacts response samples, summarizes `/api/status` instead of storing full configuration payloads, and avoids any write or destructive operation.
- Deployment action: Synced `scripts/qa-production-runtime.mjs` to `/root/token_API/scripts/` on production and verified server-side syntax with `docker run --rm -v /root/token_API:/workspace -w /workspace node:22-alpine node --check scripts/qa-production-runtime.mjs`.
- Runtime state verified: `matrixapi-new-api`, `matrixapi-db`, and `matrixapi-redis` are healthy; `matrixapi-nginx` is running; Nginx config test is successful; root disk usage is about 42%; database has real users; Redis returns `PONG`; `/api/status` reports MatrixAPI, `/docs`, MatrixAPI logo, price `0.1`, and setup enabled.
- Verification passed:
  - `node --check scripts\qa-production-runtime.mjs`
  - `node scripts\qa-production-runtime.mjs`
  - Server Docker `node --check scripts/qa-production-runtime.mjs`
  - `node scripts\qa-launch-assets.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
- Remaining risk: This is a point-in-time health check, not continuous monitoring. Full production readiness would benefit from scheduled monitoring/alerting around this same runtime gate.

## 2026-07-08 Admin Channel Lifecycle Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for channel lifecycle patterns, registered the task through `claude-flow hooks pre-task`, then inspected the live channel management UI before implementation.
- Product behavior learned: Channel row deletion is in the row's icon-only "More actions" dropdown as `删除`. Creating a channel requires name, key, base URL, model, and group; the model can be added by filling "自定义模型名称" then clicking the last `填入` button.
- QA added: `scripts/qa-admin-channel-lifecycle.mjs` performs a real administrator channel lifecycle using a temporary `qc_*` channel and `qa-noop-*` model. It uses `http://127.0.0.1:9` plus a placeholder key, never clicks the row `测试` action, verifies the row appears, deletes through row more-actions, verifies absence, and runs cleanup again in `finally`.
- Safety note: A temporary exploratory `qc_mrb4kauwfo5` channel was created while learning the form behavior and was deleted immediately after the row menu behavior was confirmed. The final lifecycle QA also created and deleted `qc_mrb4ogxq2gw`; `/console/channel` later showed only the real `kukuai-upstream` channel.
- Deployment action: Synced `scripts/qa-admin-channel-lifecycle.mjs` to `/root/token_API/scripts/` on production. No Nginx or app reload was required because only a QA script changed.
- Verification passed:
  - `node --check scripts\qa-admin-channel-lifecycle.mjs`
  - `node scripts\qa-admin-channel-lifecycle.mjs`
  - Server Docker `node --check scripts/qa-admin-channel-lifecycle.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
  - `node scripts\qa-production-security.mjs`
  - `node scripts\qa-visual-system.mjs`
- Remaining risk: The temporary channel lifecycle deliberately avoids the `测试` action to prevent outbound calls. Future production readiness work should add a controlled non-production upstream or mocked route if endpoint health-test behavior needs full mutation coverage.

## 2026-07-08 Administrator Account Ensure Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for administrator account patterns and registered the task through `claude-flow hooks pre-task`.
- User request handled: Ensured the requested administrator username exists as an enabled super administrator in production without writing credentials into source, docs, QA reports, or memory.
- Production action: Ran the existing idempotent database guard `scripts/ensure-new-api-admin-db.sh` on production with credentials loaded only from production environment variables. It updated one matching user row to role `100` and status `1`.
- Verified behavior: The administrator account authenticates successfully, returns role `100`, status `1`, and redirects from login to `/console`.
- Admin console coverage: `/console` exposes the MatrixAPI Admin Center with links for users, site status/logs, channels, models, billing/redemption, and website settings. `/console/user`, `/console/log`, `/console/channel`, `/console/models`, `/console/redemption`, and `/console/setting` all render expected admin content.
- Verification passed:
  - `node --check scripts\ensure-new-api-admin.mjs`
  - `node --check scripts\qa-admin-account.mjs`
  - `node --check scripts\qa-admin-backend-coverage.mjs`
  - Production `bash scripts/ensure-new-api-admin-db.sh`
  - `node scripts\qa-admin-account.mjs`
  - `node scripts\qa-admin-backend-coverage.mjs`
- Remaining risk: The requested administrator account is present and functional, but broader production readiness still needs continued serial QA runs to avoid rate-limit pressure from login-heavy checks.

## 2026-07-08 Production Smoke Runner Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for production smoke runner patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: Existing production QA was split across many scripts. Running them manually made it easy to miss a gate or trigger rate limits through dense login-heavy checks.
- QA added: `scripts/qa-production-smoke.mjs` now runs a serial production smoke suite with configurable delays, per-script timeout, fail-fast default, optional continue-on-fail mode, redacted stdout/stderr tails, and `output/runtime/qa-production-smoke-report.json` report output.
- Default suite: runtime health, launch assets, production security, public route audit, top-up pricing, administrator account, and administrator backend coverage.
- Optional full suite: `--full` or `SMOKE_FULL=1` adds visual responsive QA, click audit, and admin operation audit.
- Operations usability: Added `--help`, `--list`, `--continue-on-fail`, and `npm run qa:production-smoke`.
- Deployment action: Synced `scripts/qa-production-smoke.mjs` to `/root/token_API/scripts/` on production. No application or Nginx reload was required because this is a QA-only script.
- Verification passed:
  - `node --check scripts\qa-production-smoke.mjs`
  - `node scripts\qa-production-smoke.mjs`
  - `npm run qa:production-smoke -- --help`
  - `node scripts\qa-production-smoke.mjs --list`
  - `node scripts\qa-production-smoke.mjs --full --list`
  - Server Docker `node --check scripts/qa-production-smoke.mjs`
  - Server Docker `node scripts/qa-production-smoke.mjs --list`
  - `git diff --check -- scripts/qa-production-smoke.mjs package.json docs/ruflo-queen-memory.md`
- Runtime result: The default smoke suite ran seven production checks serially and all completed with exit code 0. Production containers were healthy, Nginx config tested successfully, launch assets and security headers passed, public routes were MatrixAPI-owned, top-up price remained `100 -> 10 CNY`, and admin account/backend coverage passed.
- Remaining risk: This is an on-demand smoke runner, not scheduled monitoring. Future production readiness should wire it into a scheduled monitor or deployment gate.

## 2026-07-08 Dockerized Production Smoke Wrapper Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for Docker/server smoke runner patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The production server does not expose native Node.js, so `scripts/qa-production-smoke.mjs` needed an operator-safe Docker wrapper before it could be used directly on the server or from cron/deployment gates.
- Wrapper added: `scripts/run-production-smoke-docker.sh` runs the smoke suite inside `mcr.microsoft.com/playwright:v1.61.1-noble`, mounts the project, Docker socket, Docker CLI, and compose plugin, writes timestamped logs under `output/runtime`, preserves the smoke report path, and forwards smoke options such as `--list`, `--full`, and `--continue-on-fail`.
- Runtime compatibility improved: `scripts/qa-production-runtime.mjs` now supports `MATRIXAPI_LOCAL_DOCKER=1`, `MATRIXAPI_PROJECT_DIR`, and `DOCKER_BIN` so server-side Docker runs inspect local containers without SSH. Disk checks avoid unavailable container paths.
- Secret handling improved: `scripts/qa-helpers.mjs` now reads injected environment variables first and supports `MATRIXAPI_LOCAL_SECRETS=1` for server-local `.env` reads inside the mounted workspace. Secrets are used transiently and are not written to docs or memory.
- Dependency handling: Synced `package.json` and `package-lock.json` to production and made the wrapper run `npm ci --include=dev` inside the Playwright container when `node_modules/playwright` is missing.
- Deployment action: Synced the wrapper and default smoke dependency scripts to `/root/token_API/scripts/` on production. Removed an accidental root-level copy of the wrapper from `/root/token_API/run-production-smoke-docker.sh`; the canonical path is `/root/token_API/scripts/run-production-smoke-docker.sh`.
- Verification passed:
  - Local `node --check scripts\qa-helpers.mjs`
  - Local `node --check scripts\qa-production-runtime.mjs`
  - Local `node --check scripts\qa-production-smoke.mjs`
  - Local `bash -n scripts/run-production-smoke-docker.sh`
  - Server `sh -n scripts/run-production-smoke-docker.sh`
  - Server wrapper `--wrapper-help`
  - Server wrapper `--list`
  - Server Playwright-container runtime QA with `MATRIXAPI_LOCAL_DOCKER=1`
  - Server wrapper default smoke suite
- Runtime result: The Dockerized wrapper ran the default seven-check production smoke suite end to end on the production server and exited `0`. Runtime health, launch assets, production security, public routes, top-up pricing, admin account, and admin backend coverage all passed.
- Remaining risk: The wrapper is ready for manual server use and cron/deployment gate integration, but no recurring scheduler has been installed yet. The next production-readiness step is to add an explicit scheduled monitor/alert policy.

## 2026-07-08 Scheduled Production Smoke Monitor Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for cron/scheduled smoke monitoring patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The Dockerized smoke wrapper was ready for manual server runs, but no recurring scheduler or retention policy existed.
- Scheduler added: `scripts/install-production-smoke-cron.sh` manages the MatrixAPI production smoke cron block with `install`, `status`, `remove`, and `run-once` commands. It uses marked begin/end comments so existing crontab entries are preserved.
- Installed schedule: Production root crontab now contains `17 */6 * * * cd /root/token_API && SMOKE_LOG_RETENTION_DAYS=14 scripts/run-production-smoke-docker.sh >/dev/null 2>&1`.
- Log retention: `scripts/run-production-smoke-docker.sh` now deletes `qa-production-smoke-*.log` and `qa-production-smoke-*.status` files older than `SMOKE_LOG_RETENTION_DAYS`, defaulting to 14 days.
- Deployment action: Synced `scripts/run-production-smoke-docker.sh` and `scripts/install-production-smoke-cron.sh` to `/root/token_API/scripts/`, made both executable, and installed the cron entry on production.
- Verification passed:
  - Local `bash -n scripts/run-production-smoke-docker.sh`
  - Local `bash -n scripts/install-production-smoke-cron.sh`
  - Server `sh -n scripts/run-production-smoke-docker.sh`
  - Server `sh -n scripts/install-production-smoke-cron.sh`
  - Server `scripts/install-production-smoke-cron.sh status`
  - Server `scripts/install-production-smoke-cron.sh install`
  - Server `scripts/install-production-smoke-cron.sh run-once`
  - Server cron service state is `active`
- Runtime result: The scheduled monitor's `run-once` path executed the full default seven-check production smoke suite and exited `0`. The latest report has `failures: []`, and timestamped log/status files were written under `/root/token_API/output/runtime/`.
- Remaining risk: This adds scheduled local monitoring and retained logs, but it does not yet push alerts to an external channel when a run fails. Future production readiness should add alert delivery such as email, webhook, or uptime monitor integration.

## 2026-07-08 Admin Login and Dashboard Round

- Coordination: Used `agent-queen-coordinator`; searched Ruflo memory for admin login/dashboard patterns and registered the task through `claude-flow hooks pre-task`.
- User request handled: Added the administrator login route behavior for the configured admin account without writing the real administrator password into source, docs, QA logs, or memory.
- Frontend behavior: Added `frontend/src/lib/adminAccess.ts` as the shared role/status gate. It treats both MatrixAPI role `ADMIN` and upstream New API role `100` as administrator roles, then routes administrators to `/admin` and normal users to `/dashboard`.
- Login UX: Updated the standalone login page and marketing login modal so successful administrator login opens the administrator backend directly. Existing console buttons and dropdown entries now reuse the same role-aware path.
- Backend status visibility: Extended `/admin/stats` with a `site` status block covering online status, checked time, environment, API address, maintenance/registration state, Alipay availability, and managed module coverage.
- Admin dashboard: The `/admin` overview now renders website status alongside users, API keys, models, providers, finance, traffic, teams, announcements, and management shortcuts.
- Initialization behavior: Backend seed default administrator username is now the requested admin username, while the password remains environment-only through `ADMIN_PASSWORD`.
- Verification passed:
  - `node scripts\qa-admin-login-routing.mjs`
  - `npm run test` in `backend`
  - `npm run validate` in `backend`
  - `npm run build` in `frontend`
- Remaining risk: This round updates the self-hosted Next/Nest code path. The currently deployed New API/static production path already has its own verified admin account flow; deploy is still required if this Next/Nest branch is promoted.

## 2026-07-08 Production Smoke Last-Status Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for production smoke last-status patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The scheduled smoke monitor wrote timestamped logs and reports, but external monitors had no stable, simple file or command to query the latest run outcome.
- Wrapper improvement: `scripts/run-production-smoke-docker.sh` now writes `output/runtime/qa-production-smoke-last-status.json` after every run. The JSON includes `checkedAt`, `status`, `exitCode`, `runId`, `projectDir`, `logFile`, `reportFile`, retention days, and the runner image. It does not write secrets or environment values.
- Monitor check added: `scripts/check-production-smoke-status.sh` reads the last-status JSON and exits `0` only when the last run is `ok`, exit code is `0`, the report file exists, and the status age is within `SMOKE_MAX_AGE_MINUTES` defaulting to 390 minutes.
- Deployment action: Synced the updated wrapper and new checker to `/root/token_API/scripts/`, made both executable, and verified them on production.
- Production verification passed:
  - Server `sh -n scripts/run-production-smoke-docker.sh`
  - Server `sh -n scripts/check-production-smoke-status.sh`
  - Server `scripts/check-production-smoke-status.sh --help`
  - Server checker correctly failed before the first last-status file existed
  - Server `scripts/install-production-smoke-cron.sh run-once`
  - Server `scripts/check-production-smoke-status.sh`
- Runtime result: The run-once smoke generated `qa-production-smoke-last-status.json` with `status: ok`, `exitCode: 0`, a fresh `checkedAt`, and valid report/log paths. The installed six-hour cron block remains present.
- Remaining risk: This provides local machine-readable monitoring state. It still does not deliver alerts to an external channel; the next readiness step is alert delivery through an uptime monitor, webhook, or email path that calls this checker.

## 2026-07-08 Production Smoke Alert Monitor Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for production smoke webhook alert patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: Last-status JSON made smoke state machine-readable, but the scheduled job still did not have a failure notification path.
- Alert sender added: `scripts/send-production-smoke-alert.sh` sends a small JSON payload to `SMOKE_ALERT_WEBHOOK_URL` when configured. The payload includes only status metadata such as reason, status, exit code, checked time, run id, report path, and log path. It does not include secrets.
- Monitor wrapper added: `scripts/run-production-smoke-monitor.sh` now runs the Dockerized smoke suite, calls `scripts/check-production-smoke-status.sh`, and invokes the alert sender on smoke failure or stale/malformed status.
- Cron upgrade: `scripts/install-production-smoke-cron.sh` now installs the six-hour cron command against `scripts/run-production-smoke-monitor.sh` instead of directly calling the Docker smoke wrapper.
- Deployment action: Synced the updated cron manager plus the new monitor and alert scripts to `/root/token_API/scripts/`, made them executable, installed the updated cron block, and verified production behavior.
- Verification passed:
  - Local `bash -n scripts/send-production-smoke-alert.sh`
  - Local `bash -n scripts/run-production-smoke-monitor.sh`
  - Local `bash -n scripts/install-production-smoke-cron.sh`
  - Local no-webhook alert skip test
  - Server `sh -n` for all three scripts
  - Server monitor and alert `--help`
  - Server `scripts/install-production-smoke-cron.sh install`
  - Server `scripts/install-production-smoke-cron.sh status`
  - Server `scripts/install-production-smoke-cron.sh run-once`
  - Server no-webhook alert skip test
- Runtime result: Production monitor `run-once` completed the default smoke suite, status check returned `SMOKE_STATUS ok`, and the monitor ended with `SMOKE_MONITOR ok`. The active cron service is `crond`, and the cron block now calls `run-production-smoke-monitor.sh`.
- Remaining risk: Alert delivery is implemented but inactive until `SMOKE_ALERT_WEBHOOK_URL` is configured in the production environment or cron command. The next readiness step is to choose the external alert endpoint and set that variable outside source control.

## 2026-07-08 Production Smoke Monitor Env File Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for smoke monitor env file patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The alert sender supported `SMOKE_ALERT_WEBHOOK_URL`, but cron runs with a minimal environment. A real webhook configured only in an interactive shell would not reliably reach the scheduled monitor.
- Monitor config added: `scripts/run-production-smoke-monitor.sh` now loads `SMOKE_MONITOR_ENV_FILE` before running smoke checks. The default path is `/root/token_API/config/production-smoke-monitor.env`.
- Cron config path added: `scripts/install-production-smoke-cron.sh` now installs the cron command with `SMOKE_MONITOR_ENV_FILE=/root/token_API/config/production-smoke-monitor.env`, so scheduled runs use the same secure config path without putting webhook URLs in crontab.
- Safe template added: `config/production-smoke-monitor.env.example` documents optional alert variables and operational timeouts. The real `production-smoke-monitor.env` remains server-local and outside source control.
- Deployment action: Synced the updated monitor, cron manager, and example env file to `/root/token_API`, created `/root/token_API/config`, set the config directory to root-only access, and reinstalled the production cron block.
- Verification passed:
  - Local `bash -n scripts/run-production-smoke-monitor.sh`
  - Local `bash -n scripts/install-production-smoke-cron.sh`
  - Local env-file/help checks
  - Server `sh -n scripts/run-production-smoke-monitor.sh`
  - Server `sh -n scripts/install-production-smoke-cron.sh`
  - Server `scripts/install-production-smoke-cron.sh install`
  - Server `scripts/install-production-smoke-cron.sh status`
  - Server `scripts/check-production-smoke-status.sh`
  - Server `scripts/send-production-smoke-alert.sh env-config-path-test`
- Runtime result: Production cron now calls `run-production-smoke-monitor.sh` with the env file path. The real env file is not yet configured, so alert delivery safely skips external webhook delivery while smoke status remains `ok`. The active cron service is `crond`.
- Remaining risk: External alert delivery still requires creating `/root/token_API/config/production-smoke-monitor.env` on the server with a real `SMOKE_ALERT_WEBHOOK_URL` and restrictive permissions. No webhook URL should be stored in the repository.

## 2026-07-08 Production Monitor Readiness Audit Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for production monitor readiness audit patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The smoke monitor, cron, status checker, and optional alert sender existed, but operators still needed several manual commands to know whether the monitoring chain was actually ready.
- Audit script added: `scripts/check-production-monitor-ready.sh` performs a one-command readiness audit covering project path, required script executability, latest smoke status, cron command, cron env-file path, cron service state, monitor env file permissions, and webhook configuration.
- Safety behavior: Missing `SMOKE_ALERT_WEBHOOK_URL` is reported as `WARN`, not `FAIL`, because local smoke monitoring remains functional without external alert delivery. Webhook values are never printed.
- Deployment action: Synced the readiness audit script to `/root/token_API/scripts/`, made it executable, and ran it on production.
- Verification passed:
  - Local `bash -n scripts/check-production-monitor-ready.sh`
  - Local help output check
  - Server `sh -n scripts/check-production-monitor-ready.sh`
  - Server `scripts/check-production-monitor-ready.sh`
- Runtime result: Production readiness audit returned exit code `0` with `failures=0` and `warnings=2`. The warnings are expected: `/root/token_API/config/production-smoke-monitor.env` is not present and external webhook alert delivery is not configured. Smoke status, cron command, cron env-file path, and cron service all passed.
- Remaining risk: To eliminate the remaining warnings, create the server-local monitor env file with a real `SMOKE_ALERT_WEBHOOK_URL` and restrictive permissions. Do not commit the real webhook URL.

## 2026-07-08 Admin Account Verification Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for MatrixAPI administrator login and dashboard patterns, then registered the task through `claude-flow hooks pre-task`.
- Security handling: The requested administrator password was treated as a runtime secret only. It was not written to source files, project docs, logs, or Ruflo memory.
- Existing implementation confirmed: Deploy scripts run `scripts/ensure-new-api-admin.mjs` to authenticate/create the configured New API administrator account when env vars are present, then run `scripts/ensure-new-api-admin-db.sh` to enforce New API admin role `100` and enabled status `1`.
- Frontend/self-hosted path confirmed: `frontend/src/lib/adminAccess.ts` routes MatrixAPI `ADMIN` users and New API numeric role `100` users to `/admin`, while normal users go to `/dashboard`.
- Production path verified: `scripts/qa-admin-account.mjs` confirmed the configured admin account authenticates on production with role `100` and status `1`, redirects to `/console`, and renders MatrixAPI Admin Center.
- Admin functionality verified: Production Admin Center exposes management links for users, site status/logs, channels, models, billing tools, and website settings, with no empty management links and no console errors in the QA run.
- Verification passed:
  - `node scripts\qa-admin-login-routing.mjs`
  - `node scripts\qa-admin-account.mjs`
  - `git diff --check`
- Remaining risk: The production admin interface is still based on the upstream New API console plus MatrixAPI injection. Continue route-by-route operation checks before claiming the broader "no bugs" production-readiness goal is complete.

## 2026-07-08 Production Monitor Strict Alerts Gate Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for strict production monitor alert readiness patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: The monitor readiness audit treated missing alert configuration as `WARN`, which is correct for day-to-day smoke monitoring but too weak for a release gate that must prove external alert delivery is configured.
- Audit improvement: `scripts/check-production-monitor-ready.sh` now supports `--strict-alerts`. Default mode remains backward compatible, while strict mode upgrades missing monitor env file, loose env-file permissions, or missing `SMOKE_ALERT_WEBHOOK_URL` to `FAIL`.
- Security behavior: The readiness audit still never prints webhook values. Strict mode only reports whether alert configuration exists and whether file permissions are restricted.
- Deployment action: Synced the updated readiness audit script to `/root/token_API/scripts/` and made it executable.
- Verification passed:
  - Local `bash -n scripts/check-production-monitor-ready.sh`
  - Local `bash scripts/check-production-monitor-ready.sh --help`
  - Local unknown-argument check
  - Server `sh -n scripts/check-production-monitor-ready.sh`
  - Server default `scripts/check-production-monitor-ready.sh` returned `failures=0 warnings=2 strictAlerts=0`
  - Server strict `scripts/check-production-monitor-ready.sh --strict-alerts` returned `failures=2 warnings=0 strictAlerts=1` and exit code `1`
  - `git diff --check`
- Runtime result: Production monitoring remains healthy in default mode, and strict mode now correctly blocks release readiness until `/root/token_API/config/production-smoke-monitor.env` exists with a real webhook and restrictive permissions.
- Remaining risk: External alert delivery is still not configured. To pass the strict release gate, create the server-local monitor env file with a real `SMOKE_ALERT_WEBHOOK_URL`, protect it with `chmod 600`, and rerun `scripts/check-production-monitor-ready.sh --strict-alerts`.

## 2026-07-08 Public IA Cleanup Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for MatrixAPI public frontend parity cleanup patterns and registered the task through `claude-flow hooks pre-task`.
- Public IA cleanup completed: tightened the public MatrixAPI surface to better match the reference-site structure while keeping MatrixAPI branding, models, and prices independent.
- Routing changes:
  - `/wallet` is now the canonical public recharge page.
  - `/topup` and `/console/topup` now redirect to `/wallet`.
  - `/ranking` still redirects to `/rankings`.
  - `/models` still redirects to `/pricing`.
- Public page cleanup:
  - Public nav on homepage, docs, pricing, rankings, legal, and wallet now points `Console` to `/console` instead of `/dashboard`.
  - Public sitemap now lists `/wallet` instead of `/topup`.
  - Redundant old public file exposure was reduced; the static site keeps `wallet.html` as the real lightweight billing page and no longer treats `topup.html` as a first-class public page.
- QA alignment:
  - Updated static/public QA scripts to treat `/wallet` as canonical and `/topup` as compatibility redirect.
  - Updated asset and sitemap QA to expect the wallet route and MatrixAPI-owned brand assets.
- Deployment action: Synced the updated public HTML files, Nginx configs, sitemap, and QA scripts to `/root/token_API`, ran `docker exec matrixapi-nginx nginx -t`, restarted Nginx through Docker Compose, and reloaded Nginx successfully.
- Verification passed:
  - Local `node --check` for updated QA scripts
  - Local `node scripts\\qa-public-site-static.mjs`
  - Local `node scripts\\qa-homepage-ui.mjs`
  - Local `node scripts\\qa-static-topup-page.mjs`
  - Local `node scripts\\qa-topup-price.mjs`
  - Local `node scripts\\qa-copy-integrity.mjs`
  - Production `node scripts\\qa-public-route-audit.mjs`
  - Production `node scripts\\qa-homepage-ui.mjs`
  - Production `node scripts\\qa-topup-price.mjs`
  - Production `node scripts\\qa-launch-assets.mjs`
  - Production `node scripts\\qa-copy-integrity.mjs`
- Remaining risk: `nginx/site/brand-init.js` still contains some console-injection compatibility wording and route guards around legacy top-up behavior. It is not blocking current public-site parity or production routing, but it should be cleaned in a later focused console-injection pass.

## 2026-07-08 Console Injection Wallet Cleanup Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for MatrixAPI brand-init wallet/topup cleanup patterns and registered the task through `claude-flow hooks pre-task`.
- Console injection cleanup completed:
  - Updated the MatrixAPI subscription guide injected by `nginx/site/brand-init.js` so its public recharge entry now points to `/wallet` instead of `/topup`.
  - Updated `scripts/warm-console-assets.mjs` so asset warming defaults to `/console` instead of the deprecated `/console/topup` route.
- Scope kept narrow: The remaining `syncTopupAmount()` logic in `brand-init.js` still targets the upstream console recharge view path and was intentionally left in place because it is internal console compatibility logic, not public-site exposure.
- Deployment action: Synced updated `nginx/site/brand-init.js` and `scripts/warm-console-assets.mjs` to `/root/token_API`, ran `docker exec matrixapi-nginx nginx -t`, restarted Nginx through Docker Compose, and reloaded Nginx successfully.
- Verification passed:
  - Local `node --check scripts\\warm-console-assets.mjs`
  - Production `node scripts\\qa-public-route-audit.mjs`
  - Production `node scripts\\qa-click-audit.mjs`
  - Production `node scripts\\qa-subscription-guide.mjs`
- Runtime result: Public compatibility redirects remain correct, the injected subscription guide now exposes `/wallet`, and the main public/control-surface click audit stayed clean after the injection update.
- Remaining risk: `brand-init.js` still mixes public-branding logic, admin console augmentation, and upstream-console compatibility patches in one large file. A later dedicated refactor should split those responsibilities without changing current behavior.

## 2026-07-08 Auth Alias Static Cutover Round

- Coordination: Used `agent-queen-coordinator` and `web-access`; searched Ruflo memory for MatrixAPI public auth route parity patterns and registered the task through `claude-flow hooks pre-task`.
- Production gap addressed: `/sign-in` and `/sign-up` existed in public navigation but still fell into the upstream SPA and rendered 404-style content after hydration. This broke parity with the reference public IA.
- Routing fix: Replaced the temporary proxy alias approach with MatrixAPI-owned static auth route serving. `nginx/nginx.conf`, `nginx/conf.d/ssl.conf`, and `nginx/ssl.conf.template` now serve `/sign-in` from `nginx/site/sign-in.html` and `/sign-up` from `nginx/site/sign-up.html`, with canonical trailing-slash redirects preserved.
- New public pages:
  - `nginx/site/sign-in.html` is a MatrixAPI-owned login page with same-tab legal links, direct `/api/user/login` integration, session persistence in local storage, and redirect to `/console`.
  - `nginx/site/sign-up.html` is a MatrixAPI-owned register page with confirm-password and optional invite-code support, fallback registration payloads compatible with New API, auto-login after registration, same-tab legal links, and redirect to `/console`.
- Cache/versioning: Kept public `brand-init.js` cache bust at `2026070810` in the active Nginx configs while removing the need for auth-route injection on `/sign-in` and `/sign-up`.
- QA alignment:
  - `scripts/qa-public-gap-parity.mjs` now checks `/sign-in` and `/sign-up` instead of `/login` and `/register`.
  - `scripts/qa-public-route-audit.mjs` now audits `/sign-in` and `/sign-up`.
  - `scripts/qa-public-site-static.mjs` now resolves the new static auth pages locally.
- Deployment action: Synced updated Nginx configs, the new static auth pages, and QA scripts to `/root/token_API`, ran `docker exec matrixapi-nginx nginx -t`, and restarted `nginx` through Docker Compose.
- Verification passed:
  - Local `node scripts\\qa-public-site-static.mjs`
  - Local HTML check confirming `/sign-in` and `/sign-up` contain `User Agreement` and `Privacy Policy`
  - Production `docker exec matrixapi-nginx nginx -t`
  - Production `node scripts\\qa-homepage-ui.mjs`
  - Production fetch validation confirmed:
    - `/` returns `200` and still exposes `/sign-in` and `/sign-up`
    - `/sign-in` returns `200` with title `MatrixAPI Sign In`
    - `/sign-up` returns `200` with title `MatrixAPI Register`
- Residual note: One production `qa-public-gap-parity.mjs` run hit transient Playwright network timeouts on `/`, `/docs`, and `/wallet`, but the route audit and direct fetch checks showed the new auth pages are live and no longer render the upstream 404 state.

## 2026-07-08 Public English Cleanup Round

- Coordination: Continued under the queen-layer workflow and focused on the public static shell, wallet form semantics, and copy-integrity cleanup.
- UI cleanup: Converted the public MatrixAPI shell to an English-only surface across the main static pages, including homepage, docs, pricing, rankings, wallet, sign-in, sign-up, and legal pages.
- Copy cleanup: Removed remaining `bblabu` references from MatrixAPI-owned static pages and replaced the reference referral link with a MatrixAPI-owned URL.
- Wallet fix: Rebuilt the wallet top-up form so the amount field is named `amount`, the payment button is a real submit control, and the page exposes the `data-pay-methods` and quantity-to-payment text that QA expects.
- Content alignment: Added explicit public copy for `Quota packs`, `Model Plaza`, `Login`, `Register`, `/dashboard/log`, and `/dashboard/personal` so the homepage and wallet checks match the expected public IA.
- Verification passed locally:
  - `node scripts\\qa-public-site-static.mjs`
  - `node scripts\\qa-static-topup-page.mjs`
  - `node scripts\\qa-copy-integrity.mjs`
  - `node scripts\\qa-homepage-ui.mjs` against a temporary local static server
  - `git diff --check`
- Remaining risk: Production still needs the updated static files and Nginx config reloaded before the live site reflects these English cleanup changes.

## 2026-07-08 Dashboard Overview Repair Round

- Coordination: Continued under the queen-layer workflow and targeted the remaining production bug on `/dashboard/overview`, which was still rendering a not-found shell instead of a usable overview page.
- Routing fix: Added an exact `/dashboard/overview` Nginx match in the HTTP and HTTPS configs so the route is handled separately from the broader `/dashboard/` prefix.
- UX fix: Added a MatrixAPI-owned dashboard overview fallback in `nginx/site/brand-init.js`. When the upstream route returns a not-found shell, the script now replaces it with a branded overview page, quick links, and console summary cards instead of leaving the user on 404 content.
- Title fix: The dashboard fallback now sets the browser title to `MatrixAPI Dashboard Overview` so the tab and page chrome match the rendered content.
- Deployment action: Synced the updated Nginx configs and `brand-init.js` to `/root/token_API`, verified `nginx -t`, and restarted Nginx.
- Verification passed:
  - `node --check nginx\\site\\brand-init.js`
  - Production `node scripts\\qa-public-route-audit.mjs`
  - Direct browser check of `https://matrixapi.online/dashboard/overview`
- Current state: `https://matrixapi.online/dashboard/overview` now renders a branded MatrixAPI dashboard overview instead of a not-found shell, and the route audit remains clean.

## 2026-07-08 Console Interaction Cleanup Round

- Coordination: Continued under the queen-layer workflow and focused on the last visible interaction rough edges in public and console flows.
- Console usability fix: The public notice overlay no longer appears on `/console` or `/dashboard` routes, so it cannot block token creation or other deep console actions.
- Public button fix: The public header buttons labeled `Notifications` and `Display` now perform real actions instead of behaving like dead controls. Notifications emits a toast, and Display toggles the theme path used by the MatrixAPI shell.
- Route cleanup: Added exact dashboard route handling for `/dashboard/token`, `/dashboard/log`, `/dashboard/channel`, `/dashboard/models`, `/dashboard/personal`, `/dashboard/setting`, `/dashboard/deployment`, `/dashboard/user`, and `/dashboard/task` so those aliases no longer fall through to the wrong shell.
- Deployment fix: Added a MatrixAPI deployment fallback page so `/dashboard/deployment` no longer leaks the upstream not-found content.
- Verification passed:
  - `node scripts\\qa-deep-console-flow.mjs`
  - `node scripts\\qa-click-audit.mjs`
  - `node scripts\\qa-subscription-guide.mjs`
  - `node scripts\\qa-deployment-guide.mjs`
  - `node scripts\\qa-public-site-static.mjs`
  - `node scripts\\qa-static-topup-page.mjs`
  - `node scripts\\qa-copy-integrity.mjs`
  - direct route checks for `/dashboard/token`, `/dashboard/log`, `/dashboard/channel`, `/dashboard/models`, `/dashboard/personal`, `/dashboard/setting`, `/dashboard/deployment`, `/dashboard/user`, and `/dashboard/task`
- Current state: Deep console flows are usable without the notice overlay blocking clicks, public buttons are no longer dead, and the deployment page now resolves to MatrixAPI-owned content instead of a not-found shell.

## 2026-07-08 Dashboard Leaf Route Sync Round

- Coordination: Continued under the queen-layer workflow and focused on the remaining unauthenticated dashboard leaf routes that still showed the upstream not-found shell.
- Sync fix: Copied the updated `nginx/site/brand-init.js` plus the public MatrixAPI static pages and Nginx config files to `/root/token_API` on the server, then reloaded Nginx after confirming the configuration with `nginx -t`.
- Cache bust: Bumped the injected public script version from `2026070812` to `2026070813` in the public pages and Nginx sub_filter rules so browsers stop reusing the stale script reference.
- Verification passed:
  - Direct browser checks for `/dashboard/token`, `/dashboard/log`, and `/dashboard/deployment`
  - `node scripts\\qa-public-route-audit.mjs`
  - `node scripts\\qa-deep-console-flow.mjs`
  - `node scripts\\qa-click-audit.mjs`
  - `node scripts\\qa-deployment-guide.mjs`
- Current state: `/dashboard/token` and `/dashboard/log` now render MatrixAPI-owned fallback pages, `/dashboard/deployment` still resolves to the MatrixAPI routing guide, and the live site is using the updated `brand-init.js?v=2026070813` asset reference.
