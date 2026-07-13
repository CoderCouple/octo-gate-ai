// Types shared by backend, web, and any future SDKs. Kept dependency-free
// so this file compiles to a pure TS declaration surface.

export type EventKind = 'pass' | 'fail' | 'too_fast' | 'expired';

export type FailReason =
  | 'missing_fields'
  | 'unknown_sitekey'
  | 'origin_not_allowed'
  | 'expired_or_consumed'
  | 'cross_site'
  | 'too_fast'
  | 'wrong_answer'
  | 'bad_secret'
  | 'malformed'
  | 'bad_signature'
  | 'expired'
  | 'bad_payload'
  | 'replay'
  | 'rate_limited'
  | 'not_found'
  | 'unavailable';

export interface Dot {
  x: number;
  y: number;
  a: number; // oscillation axis (radians)
  p: number; // phase (radians)
  f: number; // frequency (Hz)
  m: number; // amplitude (px)
}

export interface ChallengeResponse {
  challenge_id: string;
  width: number;
  height: number;
  size: number;
  dots: Dot[];
}

export interface VerifySuccess {
  success: true;
  token: string;
}

export interface VerifyFailure {
  success: false;
  reason: FailReason;
}

export type VerifyResponse = VerifySuccess | VerifyFailure;

export interface SiteVerifySuccess {
  success: true;
  kind: 'success';
  issued_at: number;
}

export interface SiteVerifyFailure {
  success: false;
  reason: FailReason;
}

export type SiteVerifyResponse = SiteVerifySuccess | SiteVerifyFailure;

export interface StatsRow {
  kind: EventKind;
  count: number;
  avg_solve_ms: number | null;
}

export interface StatsResponse {
  success: true;
  sitekey: string;
  hours: number;
  stats: StatsRow[];
}
