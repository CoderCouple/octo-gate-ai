import { Redis } from 'ioredis';
import { config } from './config.js';

// Single shared client. ioredis handles rediss:// (Upstash) natively.
export const redis = new Redis(config.redisUrl, {
  // Fail fast in tests / boot rather than reconnecting forever.
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (err: Error) => {
  console.error('[redis] error', err.message);
});

export async function closeRedis(): Promise<void> {
  await redis.quit().catch(() => redis.disconnect());
}
