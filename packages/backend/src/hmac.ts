import crypto from 'node:crypto';
import { config } from './config.js';
import { redis } from './redis.js';

interface TokenPayload {
  jti: string;    // one-shot id, used as the Redis replay key
  sk: string;     // sitekey that issued this token
  iat: number;    // ms since epoch
  ttl: number;    // seconds
  kind: 'success';
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function hmac(body: string): Buffer {
  return crypto.createHmac('sha256', config.secret).update(body).digest();
}

export function issueToken(sk: string): { token: string; jti: string; ttl: number; iat: number } {
  const jti = crypto.randomUUID();
  const iat = Date.now();
  const payload: TokenPayload = {
    jti,
    sk,
    iat,
    ttl: config.tokenTtlSec,
    kind: 'success',
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(hmac(body));
  return { token: `${body}.${sig}`, jti, ttl: config.tokenTtlSec, iat };
}

export type VerifiedToken =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'bad_payload' };

export function verifyToken(token: string): VerifiedToken {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [body, sig] = parts as [string, string];

  let presented: Buffer;
  try {
    presented = b64urlDecode(sig);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const expected = hmac(body);
  // Timing-safe compare — must match on both length and bytes.
  if (presented.length !== expected.length || !crypto.timingSafeEqual(presented, expected)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }
  if (
    typeof payload.jti !== 'string' ||
    typeof payload.sk !== 'string' ||
    typeof payload.iat !== 'number' ||
    typeof payload.ttl !== 'number'
  ) {
    return { ok: false, reason: 'bad_payload' };
  }
  if ((Date.now() - payload.iat) / 1000 > payload.ttl) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, payload };
}

// Atomic single-redemption: SET NX + PX. If the key already exists we lose.
// Returns true iff this caller was the first to redeem this jti.
export async function redeemJti(jti: string, ttlSec: number): Promise<boolean> {
  const res = await redis.set(`jti:${jti}`, '1', 'PX', ttlSec * 1000, 'NX');
  return res === 'OK';
}
