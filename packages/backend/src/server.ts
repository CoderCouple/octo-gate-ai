import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit } from './middleware/rateLimit.js';
import { challengeRouter } from './routes/challenge.js';
import { verifyRouter } from './routes/verify.js';
import { siteverifyRouter } from './routes/siteverify.js';
import { statsRouter } from './routes/stats.js';
import { healthRouter } from './routes/health.js';
import { demoRouter } from './routes/demo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/dist/server.js → ../../public/ (built widget + any static assets)
// backend/src/server.ts (tsx runtime) → ../public/
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

export function buildApp(): express.Express {
  const app = express();

  // Trust the first proxy (Railway edge / Cloudflare). Without this, req.ip
  // would be the proxy address instead of the real client, breaking the
  // per-IP rate limiter.
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '16kb' }));

  // CORS. The frontend (Vercel) and any embedding customer page will call
  // this API cross-origin. The real security boundary is the per-sitekey
  // origin allow-list checked inside each widget route — CORS just gets the
  // browser to accept the response. Reflecting Origin (+ Vary) is standard.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(healthRouter);

  // Serve the built widget bundle from /widget/v1.js (and anything else
  // dropped into backend/public/). Long cache since the URL is versioned —
  // v1.js is immutable; a new widget ships as v2.js.
  app.use(
    express.static(PUBLIC_DIR, {
      maxAge: '365d',
      immutable: true,
      fallthrough: true,
    }),
  );

  // Rate-limit ONLY the widget-facing endpoints. `app.use(prefix, mw, router)`
  // runs mw on every request matching prefix regardless of which router
  // handles it, so we mount the middleware at the specific paths instead.
  // Server-to-server endpoints (siteverify, stats) intentionally have no
  // rate limit — they're called from customer backends and throttling
  // legitimate signups would be self-harm.
  app.use('/api/challenge', rateLimit);
  app.use('/api/verify', rateLimit);
  // Landing playground counter — public, rate-limited so it can't be
  // spammed by scripts inflating the global solve count.
  app.use('/api/demo/bump', rateLimit);

  app.use('/api', challengeRouter);
  app.use('/api', verifyRouter);
  app.use('/api', siteverifyRouter);
  app.use('/api', statsRouter);
  app.use('/api', demoRouter);

  // JSON 404 for anything under /api — the widget expects JSON, not HTML.
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, reason: 'not_found' });
  });

  return app;
}
