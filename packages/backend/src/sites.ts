import crypto from 'node:crypto';
import { query } from './db.js';
import { posthog } from './posthog.js';

export interface Site {
  sitekey: string;
  name: string;
  origins: string[];
}

function randHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function createSite(
  name: string,
  origins: string[],
): Promise<{ sitekey: string; secret: string }> {
  const sitekey = `ogk_${randHex(16)}`;
  const secret = `ogs_${randHex(32)}`;
  await query(
    'INSERT INTO sites (sitekey, secret_hash, name, origins) VALUES ($1, $2, $3, $4::jsonb)',
    [sitekey, sha256(secret), name, JSON.stringify(origins)],
  );
  posthog.identify({
    distinctId: sitekey,
    properties: {
      $set: {
        site_name: name,
        origins,
        sitekey,
      },
      $set_once: {
        created_at: new Date().toISOString(),
      },
    },
  });
  posthog.capture({
    distinctId: sitekey,
    event: 'site_created',
    properties: {
      sitekey,
      site_name: name,
      origin_count: origins.length,
    },
  });
  return { sitekey, secret };
}

export async function getSite(sitekey: string): Promise<Site | null> {
  const res = await query<{ sitekey: string; name: string; origins: string[] }>(
    'SELECT sitekey, name, origins FROM sites WHERE sitekey = $1',
    [sitekey],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { sitekey: row.sitekey, name: row.name, origins: row.origins };
}

export async function findSiteBySecret(secret: string): Promise<Site | null> {
  // Constant-time-ish: hash first, then use a single indexed lookup. We never
  // put the plaintext secret in a WHERE clause.
  const hash = sha256(secret);
  const res = await query<{ sitekey: string; name: string; origins: string[] }>(
    'SELECT sitekey, name, origins FROM sites WHERE secret_hash = $1',
    [hash],
  );
  const row = res.rows[0];
  if (!row) return null;
  return { sitekey: row.sitekey, name: row.name, origins: row.origins };
}

// Empty origins array = permissive (allowed during v1 pilots without an
// explicit origin list). Non-empty = strict match against the request Origin.
export function originAllowed(site: Site, origin: string | undefined): boolean {
  if (!site.origins || site.origins.length === 0) return true;
  if (!origin) return false;
  return site.origins.includes(origin);
}
