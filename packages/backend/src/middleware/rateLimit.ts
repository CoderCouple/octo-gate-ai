import type { Request, Response, NextFunction } from 'express';
import { redis } from '../redis.js';
import { config } from '../config.js';
import { posthog } from '../posthog.js';

// Fixed 60-second window per IP. Atomic via INCR; the first hit in a window
// also sets EXPIRE. There is a benign race where two concurrent first-hits
// both call EXPIRE — that's fine, the second call just resets the TTL to 60
// which is what we want anyway.
export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = req.ip ?? 'unknown';
  const key = `rl:${ip}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }
    if (count > config.rateLimit) {
      posthog.capture({
        distinctId: ip,
        event: 'rate_limit_exceeded',
        properties: {
          path: req.path,
          request_count: count,
          limit: config.rateLimit,
          $process_person_profile: false,
        },
      });
      res.status(429).json({ success: false, reason: 'rate_limited' });
      return;
    }
    next();
  } catch (err) {
    // If Redis is down we fail closed on rate-limit checks — it's safer to
    // reject verify requests than to let an attacker bypass the throttle by
    // taking Redis offline. Log so ops can catch it fast.
    console.error('[rateLimit] redis error', (err as Error).message);
    res.status(503).json({ success: false, reason: 'unavailable' });
  }
}
