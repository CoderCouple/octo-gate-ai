import { Router } from 'express';
import { query } from '../db.js';
import { redis } from '../redis.js';

export const healthRouter = Router();

healthRouter.get('/healthz', async (_req, res) => {
  try {
    await query('SELECT 1');
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error('redis ping failed');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: (err as Error).message });
  }
});
