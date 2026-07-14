// Wrappers around the backend's public demo counter endpoints. Fails
// silently in the client — a network hiccup shouldn't break the tile.

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchDemoTotal(): Promise<number> {
  try {
    const res = await fetch(`${API}/api/demo/stats`, { cache: 'no-store' });
    if (!res.ok) return 0;
    const j = (await res.json()) as { total?: number };
    return Number.isFinite(j.total) ? Number(j.total) : 0;
  } catch {
    return 0;
  }
}

export async function bumpDemoTotal(): Promise<number> {
  try {
    const res = await fetch(`${API}/api/demo/bump`, { method: 'POST' });
    if (!res.ok) return 0;
    const j = (await res.json()) as { total?: number };
    return Number.isFinite(j.total) ? Number(j.total) : 0;
  } catch {
    return 0;
  }
}
