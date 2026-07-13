import { query } from './db.js';

export type EventKind = 'pass' | 'fail' | 'too_fast' | 'expired';

// Awaitable analytics. The insert is fast (~1ms local) and callers await it
// so that (a) tests can reason about state, and (b) a completed HTTP response
// implies the event is durable. Errors are swallowed — a Postgres blip must
// not fail a verify.
export async function logEvent(
  sitekey: string,
  kind: EventKind,
  solve_ms: number | null,
  ip: string | null,
): Promise<void> {
  try {
    await query(
      'INSERT INTO events (sitekey, kind, solve_ms, ip) VALUES ($1, $2, $3, $4)',
      [sitekey, kind, solve_ms, ip],
    );
  } catch (err) {
    console.error('[events] insert failed', (err as Error).message);
  }
}

export interface StatsRow {
  kind: EventKind;
  count: number;
  avg_solve_ms: number | null;
}

export async function getStats(sitekey: string, hours: number): Promise<StatsRow[]> {
  const res = await query<{ kind: EventKind; count: string; avg_solve_ms: string | null }>(
    `SELECT kind, COUNT(*)::text AS count, AVG(solve_ms)::text AS avg_solve_ms
     FROM events
     WHERE sitekey = $1 AND created_at > NOW() - ($2 || ' hours')::interval
     GROUP BY kind`,
    [sitekey, String(hours)],
  );
  return res.rows.map((r) => ({
    kind: r.kind,
    count: Number(r.count),
    avg_solve_ms: r.avg_solve_ms === null ? null : Math.round(Number(r.avg_solve_ms)),
  }));
}
