# OctoGateAI

A motion-based CAPTCHA. The challenge word never exists as text, image, or font mask on the client — it appears only in coherent motion across ~4,000 statistically identical dots. Humans read it in about one second. Any single frame is uniform noise.

**Naming caveat:** OctoGate IT Security Systems GmbH is an existing security company. Get a trademark opinion before spending on brand assets.

## Repo layout

npm workspaces monorepo — same shape as CoderCouple/octoflash-ai-frontend.

```
packages/
├── core/      @octogate/core     — pure TS. Types, API client, runtime config.
├── backend/   @octogate/backend  — Node/Express API. Railway deploy.
├── web/       @octogate/web      — Next.js 15 + Tailwind + shadcn + TanStack Query. Vercel deploy.
└── widget/    @octogate/widget   — Vanilla JS widget, esbuild-bundled to backend/public/widget/v1.js.
design/        HTML mockups — visual source-of-truth (see `design/*.dc.html`).
```

Every cross-package import goes through `@octogate/core` — never relative.

## Local development

Prereqs: Node 22, Docker Desktop.

```bash
# 1. Install everything.
npm install

# 2. Bring up Postgres + Redis on non-standard ports (55432 / 63790 avoid
#    collisions with a native Postgres.app on 5432 or Homebrew Redis on 6379).
docker compose up -d

# 3. Copy env and generate an HMAC secret.
cp packages/backend/.env.example packages/backend/.env
openssl rand -hex 32   # paste into OCTOGATE_SECRET

# 4. Build once (core → widget → backend).
npm run build:core && npm run build:widget

# 5. Run backend + web in parallel.
npm run dev

# 6. Create a sitekey for local testing.
cd packages/backend
npm run cli -- create-site "Local Test" http://localhost:3001
#   → prints a sitekey (ogk_...) and a secret (ogs_...) — the secret is
#     shown once.

# 7. Point the web app at your sitekey.
echo "NEXT_PUBLIC_SITEKEY=ogk_..."         >  packages/web/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" >> packages/web/.env.local

# 8. Restart `npm run dev` and open http://localhost:3001.
```

## Tests

Backend has 19 e2e tests hitting real Postgres + Redis. They cover all seven security invariants plus the two concurrency races (5× parallel /verify on one challenge → exactly one winner; 5× parallel /siteverify on one token → exactly one winner).

```bash
npm test              # requires docker compose services healthy
npm run typecheck     # every workspace
```

## Deploy

### Backend → Railway (~$5/month)

1. Create Supabase project. Grab the **transaction pooler** connection string (port 6543, not the direct 5432).
2. Create Upstash Redis database. Grab the `rediss://` URL.
3. Push to GitHub. Railway → New Project → Deploy from Repo. It auto-detects `railway.json` and the Dockerfile.
4. Set env vars in Railway:
   ```
   DATABASE_URL       (Supabase pooler URL, port 6543)
   REDIS_URL          (Upstash rediss://)
   OCTOGATE_SECRET    (openssl rand -hex 32; do not lose it or all tokens die on redeploy)
   RATE_LIMIT         30
   MIN_SOLVE_MS       800
   PORT               3000
   ```
5. Generate a domain. Smoke test `GET /healthz`.
6. Wire Cloudflare in front (Full-strict TLS, proxy on) for DDoS.

Don't set `DEBUG` or `SEED_DEMO` in production — `DEBUG` puts answers in API responses (guarded off by the config, but don't tempt it).

### Web → Vercel (free tier)

1. Vercel → New Project → import the repo.
2. Root directory: leave as `/` (Vercel reads `vercel.json`).
3. Env vars:
   ```
   NEXT_PUBLIC_API_URL   https://api.yourdomain.com   (the Railway domain)
   NEXT_PUBLIC_SITEKEY   ogk_...                      (from `create-site`)
   ```
4. Deploy.

## Threat model — honest

Client-rendered dot payloads are analytically clusterable by a code-executing attacker who reads the JSON. The current motion scheme (single oscillation axis for target-word dots) is the first pass, not the final story. The mitigation roadmap:

- **Milestone 1** — Accessibility fallback (audio/cognitive alternative, WCAG 2.1 AA).
- **Milestone 2** — Customer dashboard (Next.js + shadcn + TanStack Query, Supabase auth).
- **Milestone 3** — Encoding rotation (multiple motion schemes randomly per challenge — oscillation, directional drift with moving stencil, flow-through-glyph).
- **Milestone 4** — Server-rendered video mode (separate render service; ships pixels instead of parameters).

## Design

`design/` holds HTML mockups from earlier design iterations (Motionglyph). These are visual references — the tokens in `packages/web/app/globals.css` and the palette rule (green-on-black dark, black-on-white light, no gradients / no shadows / no rounded corners) are the actual spec.
