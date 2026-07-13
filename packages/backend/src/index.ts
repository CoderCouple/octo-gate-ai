import { buildApp } from './server.js';
import { config } from './config.js';
import { migrate } from './schema.js';
import { closeDb } from './db.js';
import { closeRedis } from './redis.js';

async function main(): Promise<void> {
  await migrate();
  const app = buildApp();
  const server = app.listen(config.port, () => {
    console.log(`[octogateai] listening on :${config.port} (${config.nodeEnv})`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[octogateai] ${signal} received, shutting down`);
    server.close();
    await closeDb().catch(() => {});
    await closeRedis().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[octogateai] fatal', err);
  process.exit(1);
});
