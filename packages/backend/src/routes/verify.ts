import { Router } from 'express';
import { getSite, originAllowed } from '../sites.js';
import { consumeChallenge } from '../challenge.js';
import { issueToken } from '../hmac.js';
import { logEvent } from '../events.js';
import { config } from '../config.js';

export const verifyRouter = Router();

verifyRouter.post('/verify', async (req, res) => {
  const sitekey = typeof req.body?.sitekey === 'string' ? req.body.sitekey : null;
  const challenge_id = typeof req.body?.challenge_id === 'string' ? req.body.challenge_id : null;
  const rawAnswer = typeof req.body?.answer === 'string' ? req.body.answer : null;
  if (!sitekey || !challenge_id || rawAnswer === null) {
    res.status(400).json({ success: false, reason: 'missing_fields' });
    return;
  }

  const site = await getSite(sitekey);
  if (!site) {
    res.status(401).json({ success: false, reason: 'unknown_sitekey' });
    return;
  }
  const origin = req.header('origin') ?? undefined;
  if (!originAllowed(site, origin)) {
    res.status(403).json({ success: false, reason: 'origin_not_allowed' });
    return;
  }

  // Atomic one-shot: fetch & delete in one op. Second caller for the same
  // challenge_id gets null here — this is the concurrency-race invariant.
  const stored = await consumeChallenge(challenge_id);
  if (!stored) {
    await logEvent(site.sitekey, 'expired', null, req.ip ?? null);
    res.json({ success: false, reason: 'expired_or_consumed' });
    return;
  }

  // Cross-site guard: a challenge issued for site A cannot be verified against
  // site B, even if both sitekeys are known to the attacker.
  if (stored.sk !== site.sitekey) {
    await logEvent(site.sitekey, 'fail', null, req.ip ?? null);
    res.json({ success: false, reason: 'cross_site' });
    return;
  }

  const solve_ms = Date.now() - stored.iat;

  // Timing gate: no human reads a motion challenge sub-800ms. This catches
  // scripts that fire /verify immediately after /challenge without rendering.
  if (solve_ms < config.minSolveMs) {
    await logEvent(site.sitekey, 'too_fast', solve_ms, req.ip ?? null);
    res.json({ success: false, reason: 'too_fast' });
    return;
  }

  const answer = rawAnswer.trim().toUpperCase();
  if (answer !== stored.answer) {
    await logEvent(site.sitekey, 'fail', solve_ms, req.ip ?? null);
    res.json({ success: false, reason: 'wrong_answer' });
    return;
  }

  const { token } = issueToken(site.sitekey);
  logEvent(site.sitekey, 'pass', solve_ms, req.ip ?? null);
  res.json({ success: true, token });
});
