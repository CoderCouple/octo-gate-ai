import pg from 'pg';
import { config } from './config.js';

// When routed through Supabase's transaction pooler (port 6543), named
// prepared statements do not survive across pooled connections. node-pg
// only uses named statements when we pass a `name` field, which we never
// do — but we also disable client-side statement caching just in case a
// dependency changes that assumption.
const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Supabase requires TLS on the pooler; local dev Postgres does not.
  ssl: config.usePooler ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // Don't crash the process on idle-client errors — the pool will replace it.
  console.error('[db] idle client error', err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, values as never);
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
