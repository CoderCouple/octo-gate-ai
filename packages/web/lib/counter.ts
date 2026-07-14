// Browser-local solve counter. Persists between reloads via localStorage.
// It is deliberately not authoritative — the real solve/pass telemetry lives
// in the backend `events` table (see /api/stats). The landing shows this
// counter as a "you've solved N challenges" side-effect of hero interaction.

const KEY = 'og-solves';

export function readSolveCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function bumpSolveCount(): number {
  if (typeof window === 'undefined') return 0;
  const next = readSolveCount() + 1;
  window.localStorage.setItem(KEY, String(next));
  return next;
}
