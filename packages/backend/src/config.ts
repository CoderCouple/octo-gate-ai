import 'dotenv/config';

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing env: ${name}`);
  return v;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Env ${name} is not a number: ${raw}`);
  return n;
}

function bool(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true';
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

// Detect Supabase transaction pooler (port 6543). We must disable named
// prepared statements when routed through pgbouncer transaction mode,
// otherwise queries fail with "prepared statement does not exist" under load.
function isPoolerUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.port === '6543';
  } catch {
    return false;
  }
}

const databaseUrl = req('DATABASE_URL');

export const config = {
  nodeEnv,
  isProd,
  port: num('PORT', 3000),
  databaseUrl,
  usePooler: isPoolerUrl(databaseUrl),
  redisUrl: req('REDIS_URL'),
  // In prod OCTOGATE_SECRET must be set explicitly. In dev we still require
  // a value but tolerate the default from .env.example.
  secret: (() => {
    const v = process.env.OCTOGATE_SECRET;
    if (!v) {
      if (isProd) throw new Error('OCTOGATE_SECRET must be set in production');
      throw new Error('OCTOGATE_SECRET missing — copy .env.example to .env');
    }
    return v;
  })(),
  rateLimit: num('RATE_LIMIT', 30),
  minSolveMs: num('MIN_SOLVE_MS', 800),
  // DEBUG puts the answer in the challenge response. Guard belt-and-suspenders:
  // even if someone sets DEBUG=1 in prod, we refuse to honor it.
  debug: bool('DEBUG') && !isProd,
  challengeTtlSec: 90,
  tokenTtlSec: 120,
} as const;

export type Config = typeof config;
