import { query } from './db.js';

// Auto-migrate on boot. Idempotent: safe to run every startup.
// Kept intentionally small; a real migration tool comes with the dashboard milestone.
export async function migrate(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS sites (
      sitekey     TEXT PRIMARY KEY,
      secret_hash TEXT NOT NULL,
      name        TEXT NOT NULL,
      origins     JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id          BIGSERIAL PRIMARY KEY,
      sitekey     TEXT NOT NULL,
      kind        TEXT NOT NULL,
      solve_ms    INTEGER,
      ip          TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS events_sitekey_created_idx
      ON events (sitekey, created_at DESC);
  `);
}
