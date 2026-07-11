# Matrix API Brand, Wallet, Navigation, and Playground Design

## Goal

Make the live Matrix API experience consistently branded, restore working Alipay wallet top-up, simplify navigation, enforce a strict positive-wallet-balance requirement for Playground conversations, and set the default user-group billing ratio to `1.0`.

## Root causes confirmed

- Nginx serves a retired static `/wallet` login gate instead of the native authenticated wallet route.
- `scripts/bootstrap-new-api.mjs` calls `/api/option/payment_compliance` without the required JSON body, so the backend returns a business error while HTTP status remains 200. Payment compliance stays false and the top-up API removes all payment methods.
- The sidebar falls back to a default `chat=true` configuration because production has no `SidebarModulesAdmin` option row; the second Chat item remains visible.
- The API-key row action opens external chat presets and resolves a real API key. It must navigate locally to `/playground` without exposing or resolving the key.
- Playground send, retry, and edit-submit paths do not refresh or check the current wallet quota before calling `/pg/chat/completions`. The backend may also use an active subscription when wallet quota is zero.

## Architecture

Keep the existing New API + Nginx static-injection architecture. Use Nginx only for public route/brand overrides; use the native New API wallet, authentication, Playground, and payment APIs for authenticated workflows. Put balance enforcement in the shared Playground send path and in the backend Playground controller so all send, retry, edit, and direct API paths share the same policy.

## Changes

1. Brand all public/native surfaces as `Matrix API`; use the transparent Matrix logo at approximately twice its current displayed size and use the same asset for favicon/apple-touch-icon metadata and injected native-app branding.
2. Remove `/wallet` and `/wallet/` static login locations so authenticated users reach native `/wallet`; retain `/topup` as a compatibility redirect to `/wallet`.
3. Fix bootstrap payment compliance confirmation to send JSON `{ confirmed: true }`; persist `SidebarModulesAdmin` with `chat=false`; set `GroupRatio` default to `1.0`, leaving `TopupGroupRatio` at `1.0`.
4. Make the API-key Chat action navigate to `/playground`, removing real-key resolution and external chat-preset launching for that action. Remove the second Chat sidebar item and make default sidebar configuration keep it hidden.
5. Add a reusable Playground wallet guard that refreshes `/api/user/self` before a new send, treats unknown quota as loading/disabled, and blocks quota `<= 0` with a clear recharge prompt. Apply it to send, regenerate, and edit-submit paths. Add a backend check in the Playground controller that rejects zero/negative wallet quota before creating a billing session, regardless of subscription preference.

## Error handling

- Payment bootstrap must fail loudly when compliance confirmation fails rather than silently continuing with a locked wallet.
- Wallet UI must show the native “online top-up unavailable” state only when the API truly reports it; after bootstrap it must show Alipay and amount controls.
- Playground quota failures must not send a network request and must display a recharge action. Backend 403 errors must preserve a useful nested error message for direct callers.

## Verification

- Unit/source regression tests cover payment request body, sidebar hidden state, API-key navigation, balance guard for send/retry/edit, backend wallet rejection, and default ratio values.
- Run `node --check`, focused QA scripts, frontend build, and `git diff --check`.
- Deploy with a timestamped backup, run the bootstrap once, verify `/api/user/topup/info` reports online top-up enabled with only Alipay, verify production route status, run Nginx syntax and Docker health checks, and browser-check brand, wallet, sidebar, API-key action, Playground zero-balance blocking, and positive-balance flow.

