import { Router } from 'express';
import { redis } from '../redis.js';
import { posthog } from '../posthog.js';

// Public demo counter — landing playground calls /bump on each solve,
// tile reads /stats. Stored in Redis under a single INCR key. No sitekey,
// no auth. Rate-limited at the middleware layer to keep it un-spammable.

export const demoRouter = Router();

const KEY = 'demo:solves';

demoRouter.post('/demo/bump', async (_req, res) => {
  const total = await redis.incr(KEY);
  posthog.capture({
    distinctId: 'demo',
    event: 'demo_challenge_solved',
    properties: {
      total_solves: total,
      $process_person_profile: false,
    },
  });
  res.json({ total });
});

demoRouter.get('/demo/stats', async (_req, res) => {
  const raw = await redis.get(KEY);
  const total = raw ? Number(raw) : 0;
  res.json({ total });
});
