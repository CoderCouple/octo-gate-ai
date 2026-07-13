# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OctoGateAI is a motion-based CAPTCHA / human-verification service. The core idea: the challenge word never exists as text, image, or font mask on the client. The server generates ~4,000 statistically identical dots; dots inside the word's letter strokes share (approximately) one oscillation axis, phase, and frequency, so the word is visible only as coherent motion — humans read it in ~1 second (Gestalt "common fate"), while any single frame is uniform noise. A near-static decoy word is embedded so attackers who cluster the payload analytically find the wrong answer first.

Flow mirrors reCAPTCHA: widget fetches challenge → user types the word → server issues a signed one-shot token → customer backend redeems it via `siteverify`.

Naming caveat: "OctoGate IT Security Systems GmbH" is an existing security company. Get a trademark opinion before spending on brand assets. Do not treat the name as legally cleared.

## Tech stack (locked — do not substitute)

Substituting any of these silently is a bug, not a helpful refactor. If a change seems warranted, surface it and wait.

- **Runtime**: Node.js 22, Express. If starting fresh, use TypeScript; if extending the v1 codebase, keep plain JS unless asked.
- **Durable data**: Supabase Postgres via the **transaction pooler on port 6543**. Consequence: **no named prepared statements** (pgbouncer transaction mode breaks them). Tables: `sites` (sitekey, secret, name, origins JSONB) and `events` (analytics). Schema auto-migrates on boot.
- **Hot state**: Redis (Upstash, `rediss://`). Every hot-path security check must be a **single atomic Redis op** — do not read-then-write:
  - one attempt per challenge → `GETDEL ch:{id}`
  - one redemption per token → `SET jti:{id} 1 PX ttl NX`
  - per-IP rate limiting → `INCR` + `EXPIRE` on a fixed 60s window
- **Widget**: vanilla JavaScript, zero dependencies, Canvas 2D, **under 15KB**. Runs on customers' pages: no globals besides `OctoGateAI`, no framework, no CSS leakage. The widget must never receive the answer in any form — no word string, no mask, no font.
- **Deploy** (split, one bill):
  - **Backend** → Railway. Docker (`node:22-slim`), `railway.json` with `/healthz` healthcheck, stateless container (all state in Supabase/Upstash). Cloudflare free plan in front for CDN, TLS, DDoS.
  - **Frontend** → Vercel (free tier). Next.js 15 + Tailwind. Landing + demo + future dashboard.
  - **Widget bundle** is served by the backend at a versioned URL (`/widget/v1.js`) so customer integrations don't break on deploy.
- **Config via env**: `DATABASE_URL`, `REDIS_URL`, `OCTOGATE_SECRET` (HMAC key, required in prod), `RATE_LIMIT` (default 30/min/IP), `MIN_SOLVE_MS` (default 800), `DEBUG` and `SEED_DEMO` (**never in production** — `DEBUG` puts answers in API responses).

Forgetting `OCTOGATE_SECRET` means tokens silently die on every redeploy.

## Security invariants (violating any of these is a failed build)

1. The answer never appears in any client-bound payload, header, or asset. Verified by a test that inspects the full challenge response.
2. Every frame of the rendered challenge is statistically flat: dot density uniform across regions. Verified by an automated density test (the "screenshot test").
3. Challenges: 90s TTL, exactly one attempt (atomic), bound to a sitekey.
4. Tokens: HMAC-SHA256 over base64url body, **timing-safe comparison**, 2min TTL, single redemption (atomic), bound to the issuing sitekey. `siteverify` requires the site secret and rejects cross-site tokens.
5. Sub-`MIN_SOLVE_MS` answers are rejected as `too_fast` — no human reads a motion challenge in under ~800ms.
6. Widget endpoints enforce per-sitekey origin allow-lists.
7. Every pass/fail/too_fast/expired is logged to `events` with `solve_ms`.

## API surface

- `POST /api/challenge {sitekey}` → `{challenge_id, width, height, size, dots:[{x,y,a,p,f,m}]}` — dots shuffled, params carry per-dot epsilon noise
- `POST /api/verify {sitekey, challenge_id, answer}` → `{success, token?}`
- `POST /api/siteverify {secret, token}` → `{success, kind, issued_at}`
- `POST /api/stats {secret, hours?}` → per-kind counts + avg solve time
- `GET /healthz`
- CLI: `node cli.js create-site <name> <origin...>` → sitekey + secret

## Testing

End-to-end suite runs against **real Postgres + Redis** (local services in dev, not mocks). All tests must pass before presenting work as done. Coverage required:

- auth failures
- payload hygiene (invariant 1)
- density uniformity (invariant 2)
- `too_fast` gate
- wrong answer
- one-shot challenge
- token lifecycle: accept, replay, tamper, cross-site
- stats aggregation
- rate limiting
- **concurrency races**: N simultaneous verifies on one challenge and N simultaneous redemptions of one token must each produce exactly one winner

The concurrency tests are the load-bearing proof that the Redis atomicity strategy actually works. Do not weaken them.

## Milestones (in priority order — confirm scope before starting each)

1. **Accessibility fallback** — non-visual challenge path (server-generated audio or cognitive alternative) behind the same one-shot/token flow. Treat as a first-class attack surface with its own rate limits. Respect `prefers-reduced-motion` in the widget. WCAG 2.1 AA target.
2. **Customer dashboard** — Next.js + Tailwind, Supabase auth. Self-serve sitekey creation, origin management, stats charts (pass rate, solve-time distribution, `too_fast`/fail trends).
3. **Encoding rotation** — multiple motion schemes (oscillation, directional drift with moving stencil, flow-through-glyph) selected randomly per challenge with randomized decoy count/behavior, so no single decode script generalizes.
4. **Server-rendered video mode** — separate render service (Go or Rust) producing short encoded clips from a pre-generated pool in Redis; ships pixels instead of dot parameters. Design doc first, then implementation.

Threat-model honesty (belongs in the README): client-rendered dot payloads are clusterable by a code-executing attacker. Milestones 3 and 4 are the mitigation — do not hide this in marketing copy.

## Repo layout

npm workspaces monorepo — same shape as [CoderCouple/octoflash-ai-frontend](https://github.com/CoderCouple/octoflash-ai-frontend). Flat `packages/*`.

```
packages/
├── core/     @octogate/core     — pure TS. Types, API client (per-domain modules), runtime config.
├── backend/  @octogate/backend  — Node/Express API + widget bundle serving. Railway deploy.
├── web/      @octogate/web      — Next.js 15 (App Router) + Tailwind + shadcn (new-york/neutral)
│                                  + TanStack Query + next-themes + Zustand (when needed). Vercel deploy.
└── widget/   @octogate/widget   — Vanilla JS, esbuild-bundled to `packages/backend/public/widget/v1.js`.
                                  No React, no dependencies. Under 15KB gzipped.
design/       HTML mockups as visual source-of-truth (Motionglyph landings — reference for layout/copy).
tsconfig.base.json                shared TS config extended by every workspace.
docker-compose.yml                local Postgres on 55432 + Redis on 63790 (non-standard to avoid
                                  collisions with Postgres.app on 5432 or Homebrew Redis on 6379).
railway.json                      backend Dockerfile deploy config.
vercel.json                       web build config.
```

Every cross-package import goes through `@octogate/core` — never relative `../../core`. `packages/core` builds to `dist/` (tsc); backend and web import via the package entry.

Root scripts: `npm run dev` (backend + web in parallel via concurrently), `npm run build` (core → widget → backend → web), `npm test` (backend e2e), `npm run typecheck` (all workspaces).

## Design system

Two themes, no chrome, no accents beyond a single ink color. Tokens live as raw HSL triplets in `packages/web/app/globals.css` under `:root` and `.dark`, surfaced to Tailwind via `hsl(var(--x))` (shadcn's idiom):

- **Dark**: `--background 0 0% 0%` / `--foreground 135 100% 50%` (terminal green on black; #00ff41).
- **Light**: `--background 0 0% 100%` / `--foreground 0 0% 0%` (pure paper).

`--radius` stays `0px` — no rounded corners on major surfaces. **No gradients, no shadows.** Do not change these values without updating the design/ mockups; the design HTMLs assume this exact palette.

Typography: uppercase headlines with `tracking-tightest`, monospace body via the mono font stack. Terminal-style section markers (`> Try it`, `> Why this works`) borrowed from the Motionglyph reference in `design/`.

Copy hooks: "Verify humans." / "Read what you can't screenshot." / "Screenshots are empty." / "Decoys punish analysis."

## shadcn / component convention

- Style: **new-york**, base color: **neutral** (but overridden by our HSL tokens above).
- Components live in `packages/web/components/ui/`. Add new ones via `cd packages/web && npx shadcn@latest add <name>` — do **not** hand-roll a component that shadcn ships.
- Cross-cutting UI (theme toggle, providers) lives in `packages/web/components/`.
- The `@/` alias resolves to `packages/web/` (see `tsconfig.json` paths).

## Style

Small files, boring code. Comments explain **WHY** on anything security-relevant, not what. No feature creep beyond the current milestone.

## Common commands

Prereqs: Node 22, Docker Desktop.

```bash
# First-time setup
npm install
docker compose up -d
npm run build:core && npm run build:widget   # produces backend/public/widget/v1.js

# Dev
npm run dev                     # backend :3000 + web :3001 in parallel
npm run dev:backend             # backend only
npm run dev:web                 # web only

# CLI (creates a sitekey + secret)
cd packages/backend && npm run cli -- create-site "Local" http://localhost:3001

# Tests / typecheck
npm test                        # backend e2e (19 tests, needs docker compose up)
npm run typecheck               # all workspaces

# Build
npm run build                   # core → widget → backend → web (in order)
npm run build:web               # web only (Vercel does this)
```

## v1 heritage

If a v1 "OctoProof" codebase is dropped in (Express server, vanilla JS widget, Supabase + Redis storage, ~17-test suite): extend it, do not rebuild. Rename `OCTOPROOF_SECRET` → `OCTOGATE_SECRET` and the `OctoProof` widget global → `OctoGateAI` as the first task.
