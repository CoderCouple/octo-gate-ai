import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildApp } from '../src/server.js';
import { migrate } from '../src/schema.js';
import { pool, closeDb } from '../src/db.js';
import { redis, closeRedis } from '../src/redis.js';
import { createSite } from '../src/sites.js';

let app: Express;

interface StoredChallenge {
  answer: string;
  sk: string;
  iat: number;
}

async function reset(): Promise<void> {
  await pool.query('TRUNCATE sites, events RESTART IDENTITY');
  await redis.flushdb();
}

// Peek the ground-truth answer for a challenge by reading Redis directly.
// Tests need this because invariant #1 forbids leaking the answer to the
// client — and that includes tests over HTTP.
async function peekAnswer(challenge_id: string): Promise<string> {
  const raw = await redis.get(`ch:${challenge_id}`);
  if (!raw) throw new Error('challenge missing from redis');
  return (JSON.parse(raw) as StoredChallenge).answer;
}

async function issueChallenge(sitekey: string, origin?: string) {
  const req = request(app).post('/api/challenge').send({ sitekey });
  if (origin) req.set('Origin', origin);
  return req;
}

async function solveOnce(
  sitekey: string,
  origin?: string,
): Promise<{ token: string; challenge_id: string; solve_ms: number }> {
  const chRes = await issueChallenge(sitekey, origin);
  expect(chRes.status).toBe(200);
  const { challenge_id } = chRes.body;
  const answer = await peekAnswer(challenge_id);
  await new Promise((r) => setTimeout(r, 600)); // > MIN_SOLVE_MS=500
  const req = request(app).post('/api/verify').send({ sitekey, challenge_id, answer });
  if (origin) req.set('Origin', origin);
  const vRes = await req;
  expect(vRes.status).toBe(200);
  expect(vRes.body.success).toBe(true);
  return { token: vRes.body.token, challenge_id, solve_ms: 150 };
}

beforeAll(async () => {
  await migrate();
  app = buildApp();
});

beforeEach(async () => {
  await reset();
});

afterAll(async () => {
  await closeDb();
  await closeRedis();
});

// ---- Invariant #1: answer never client-bound -------------------------------

describe('invariant #1: answer never leaks to client', () => {
  it('challenge response contains no answer/word/target field and no answer substring', async () => {
    const { sitekey } = await createSite('Test', []);
    const res = await issueChallenge(sitekey);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('answer');
    expect(res.body).not.toHaveProperty('word');
    expect(res.body).not.toHaveProperty('target');
    expect(res.body).not.toHaveProperty('_debug_answer');

    // Full-payload scan: the answer must not appear anywhere in the response
    // body or headers, in any casing.
    const answer = await peekAnswer(res.body.challenge_id);
    const bodyStr = JSON.stringify(res.body).toUpperCase();
    expect(bodyStr.includes(answer)).toBe(false);
    for (const [k, v] of Object.entries(res.headers)) {
      const combined = `${k} ${String(v)}`.toUpperCase();
      expect(combined.includes(answer)).toBe(false);
    }
  });
});

// ---- Invariant #2: density uniform per frame -------------------------------

describe('invariant #2: rendered-frame dot density is uniform', () => {
  it('CV of dot counts across an 8x4 grid stays below 0.15 across five sampled frames and challenges', async () => {
    const { sitekey } = await createSite('Test', []);
    for (let ch = 0; ch < 5; ch++) {
      const res = await issueChallenge(sitekey);
      const { width, height, dots } = res.body as {
        width: number;
        height: number;
        dots: { x: number; y: number; a: number; p: number; f: number; m: number }[];
      };
      for (let s = 0; s < 5; s++) {
        const t = Math.random() * 3; // seconds
        const cols = 8;
        const rows = 4;
        const bins = new Array(cols * rows).fill(0) as number[];
        const cw = width / cols;
        const rh = height / rows;
        for (const d of dots) {
          const phase = 2 * Math.PI * d.f * t + d.p;
          const offset = d.m * Math.sin(phase);
          const px = d.x + Math.cos(d.a) * offset;
          const py = d.y + Math.sin(d.a) * offset;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const cx = Math.min(cols - 1, Math.floor(px / cw));
          const cy = Math.min(rows - 1, Math.floor(py / rh));
          bins[cy * cols + cx]! += 1;
        }
        const mean = bins.reduce((a, b) => a + b, 0) / bins.length;
        const variance = bins.reduce((a, b) => a + (b - mean) ** 2, 0) / bins.length;
        const cv = Math.sqrt(variance) / mean;
        expect(cv).toBeLessThan(0.15);
      }
    }
  });
});

// ---- Site + origin auth ----------------------------------------------------

describe('site auth', () => {
  it('rejects unknown sitekey', async () => {
    const res = await issueChallenge('ogk_unknown');
    expect(res.status).toBe(401);
    expect(res.body.reason).toBe('unknown_sitekey');
  });

  it('enforces origin allow-list when non-empty', async () => {
    const { sitekey } = await createSite('Acme', ['https://acme.com']);
    const bad = await issueChallenge(sitekey, 'https://evil.example');
    expect(bad.status).toBe(403);
    expect(bad.body.reason).toBe('origin_not_allowed');
    const good = await issueChallenge(sitekey, 'https://acme.com');
    expect(good.status).toBe(200);
  });

  it('empty origin allow-list permits any origin (v1 dev default)', async () => {
    const { sitekey } = await createSite('Open', []);
    const res = await issueChallenge(sitekey, 'https://whatever.example');
    expect(res.status).toBe(200);
  });
});

// ---- Verify flow -----------------------------------------------------------

describe('verify', () => {
  it('rejects sub-MIN_SOLVE_MS answers as too_fast', async () => {
    const { sitekey } = await createSite('Test', []);
    const chRes = await issueChallenge(sitekey);
    const answer = await peekAnswer(chRes.body.challenge_id);
    // Immediate — no wait — should trip the timing gate (MIN_SOLVE_MS=100).
    const res = await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: chRes.body.challenge_id,
      answer,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('too_fast');
  });

  it('rejects wrong answer', async () => {
    const { sitekey } = await createSite('Test', []);
    const chRes = await issueChallenge(sitekey);
    await new Promise((r) => setTimeout(r, 600));
    const res = await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: chRes.body.challenge_id,
      answer: 'ZZZZZ',
    });
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('wrong_answer');
  });

  it('challenge is one-shot: second verify on same challenge_id is expired', async () => {
    const { sitekey } = await createSite('Test', []);
    const chRes = await issueChallenge(sitekey);
    const answer = await peekAnswer(chRes.body.challenge_id);
    await new Promise((r) => setTimeout(r, 600));
    const first = await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: chRes.body.challenge_id,
      answer,
    });
    expect(first.body.success).toBe(true);
    const second = await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: chRes.body.challenge_id,
      answer,
    });
    expect(second.body.success).toBe(false);
    expect(second.body.reason).toBe('expired_or_consumed');
  });

  it('cross-site challenge redemption is rejected', async () => {
    const a = await createSite('A', []);
    const b = await createSite('B', []);
    const chRes = await issueChallenge(a.sitekey);
    const answer = await peekAnswer(chRes.body.challenge_id);
    await new Promise((r) => setTimeout(r, 600));
    // Same challenge_id but presented under site B's sitekey.
    const res = await request(app).post('/api/verify').send({
      sitekey: b.sitekey,
      challenge_id: chRes.body.challenge_id,
      answer,
    });
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('cross_site');
  });
});

// ---- Token lifecycle -------------------------------------------------------

describe('siteverify', () => {
  it('accepts a fresh token; rejects replay', async () => {
    const { sitekey, secret } = await createSite('Test', []);
    const { token } = await solveOnce(sitekey);

    const first = await request(app).post('/api/siteverify').send({ secret, token });
    expect(first.body.success).toBe(true);
    expect(first.body.kind).toBe('success');

    const replay = await request(app).post('/api/siteverify').send({ secret, token });
    expect(replay.body.success).toBe(false);
    expect(replay.body.reason).toBe('replay');
  });

  it('rejects tampered signature', async () => {
    const { sitekey, secret } = await createSite('Test', []);
    const { token } = await solveOnce(sitekey);
    // Flip a byte in the signature half. Base64url alphabet — swap 'A' for 'B'
    // or the reverse. The token structure is body.sig — mutate the sig.
    const [body, sig] = token.split('.');
    const mutated = sig![0] === 'A' ? 'B' + sig!.slice(1) : 'A' + sig!.slice(1);
    const bad = `${body}.${mutated}`;
    const res = await request(app).post('/api/siteverify').send({ secret, token: bad });
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('bad_signature');
  });

  it('rejects malformed token', async () => {
    const { secret } = await createSite('Test', []);
    const res = await request(app).post('/api/siteverify').send({ secret, token: 'not-a-token' });
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('malformed');
  });

  it('rejects cross-site: token issued to A cannot be redeemed by B', async () => {
    const a = await createSite('A', []);
    const b = await createSite('B', []);
    const { token } = await solveOnce(a.sitekey);
    const res = await request(app).post('/api/siteverify').send({ secret: b.secret, token });
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toBe('cross_site');
  });

  it('rejects bad secret', async () => {
    const { sitekey } = await createSite('Test', []);
    const { token } = await solveOnce(sitekey);
    const res = await request(app).post('/api/siteverify').send({ secret: 'ogs_wrong', token });
    expect(res.status).toBe(401);
    expect(res.body.reason).toBe('bad_secret');
  });
});

// ---- Rate limiting ---------------------------------------------------------

describe('rate limit', () => {
  it('per-IP window rejects requests beyond RATE_LIMIT', async () => {
    const { sitekey } = await createSite('Test', []);
    // RATE_LIMIT=20 in vitest config. Fire 22 sequential; the tail hits 429.
    const codes: number[] = [];
    for (let i = 0; i < 22; i++) {
      const res = await issueChallenge(sitekey);
      codes.push(res.status);
    }
    expect(codes.slice(0, 20).every((c) => c === 200)).toBe(true);
    expect(codes.slice(20).some((c) => c === 429)).toBe(true);
  });
});

// ---- Stats -----------------------------------------------------------------

describe('stats', () => {
  it('aggregates pass / fail / too_fast counts', async () => {
    const { sitekey, secret } = await createSite('Test', []);
    // one pass
    await solveOnce(sitekey);
    // one too_fast
    const ch1 = await issueChallenge(sitekey);
    await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: ch1.body.challenge_id,
      answer: await peekAnswer(ch1.body.challenge_id),
    });
    // one fail
    const ch2 = await issueChallenge(sitekey);
    await new Promise((r) => setTimeout(r, 600));
    await request(app).post('/api/verify').send({
      sitekey,
      challenge_id: ch2.body.challenge_id,
      answer: 'ZZZZZ',
    });
    // event inserts are fire-and-forget — give them a moment to land.
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app).post('/api/stats').send({ secret, hours: 1 });
    expect(res.body.success).toBe(true);
    const byKind: Record<string, number> = {};
    for (const row of res.body.stats as { kind: string; count: number }[]) {
      byKind[row.kind] = row.count;
    }
    expect(byKind.pass).toBe(1);
    expect(byKind.fail).toBe(1);
    expect(byKind.too_fast).toBe(1);
  });
});

// ---- Concurrency races (the load-bearing invariant tests) ------------------

describe('concurrency', () => {
  it('N parallel /verify on one challenge yields exactly one success', async () => {
    const { sitekey } = await createSite('Test', []);
    const chRes = await issueChallenge(sitekey);
    const answer = await peekAnswer(chRes.body.challenge_id);
    await new Promise((r) => setTimeout(r, 600));

    const N = 5;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        request(app).post('/api/verify').send({
          sitekey,
          challenge_id: chRes.body.challenge_id,
          answer,
        }),
      ),
    );
    const successes = results.filter((r) => r.body.success === true).length;
    const expired = results.filter((r) => r.body.reason === 'expired_or_consumed').length;
    expect(successes).toBe(1);
    expect(expired).toBe(N - 1);
  });

  it('N parallel /siteverify on one token yields exactly one success', async () => {
    const { sitekey, secret } = await createSite('Test', []);
    const { token } = await solveOnce(sitekey);

    const N = 5;
    const results = await Promise.all(
      Array.from({ length: N }, () =>
        request(app).post('/api/siteverify').send({ secret, token }),
      ),
    );
    const successes = results.filter((r) => r.body.success === true).length;
    const replays = results.filter((r) => r.body.reason === 'replay').length;
    expect(successes).toBe(1);
    expect(replays).toBe(N - 1);
  });
});

// ---- Health ----------------------------------------------------------------

describe('health', () => {
  it('/healthz returns ok when DB + Redis are up', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
