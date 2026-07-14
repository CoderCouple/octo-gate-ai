import { Router } from 'express';
import { findSiteBySecret } from '../sites.js';
import { verifyToken, redeemJti } from '../hmac.js';
import { posthog } from '../posthog.js';

export const siteverifyRouter = Router();

siteverifyRouter.post('/siteverify', async (req, res) => {
  const secret = typeof req.body?.secret === 'string' ? req.body.secret : null;
  const token = typeof req.body?.token === 'string' ? req.body.token : null;
  if (!secret || !token) {
    res.status(400).json({ success: false, reason: 'missing_fields' });
    return;
  }

  const site = await findSiteBySecret(secret);
  if (!site) {
    res.status(401).json({ success: false, reason: 'bad_secret' });
    return;
  }

  const v = verifyToken(token);
  if (!v.ok) {
    posthog.capture({
      distinctId: site.sitekey,
      event: 'token_rejected',
      properties: {
        sitekey: site.sitekey,
        reason: v.reason,
        $process_person_profile: false,
      },
    });
    res.json({ success: false, reason: v.reason });
    return;
  }

  // Cross-site guard on the redemption side too: a token issued for site A
  // must not be redeemable by site B, even if B holds a valid token string.
  if (v.payload.sk !== site.sitekey) {
    posthog.capture({
      distinctId: site.sitekey,
      event: 'token_rejected',
      properties: {
        sitekey: site.sitekey,
        reason: 'cross_site',
        $process_person_profile: false,
      },
    });
    res.json({ success: false, reason: 'cross_site' });
    return;
  }

  // Atomic single redemption. First caller wins, replays lose.
  const won = await redeemJti(v.payload.jti, v.payload.ttl);
  if (!won) {
    posthog.capture({
      distinctId: site.sitekey,
      event: 'token_rejected',
      properties: {
        sitekey: site.sitekey,
        reason: 'replay',
        $process_person_profile: false,
      },
    });
    res.json({ success: false, reason: 'replay' });
    return;
  }

  posthog.capture({
    distinctId: site.sitekey,
    event: 'token_redeemed',
    properties: {
      sitekey: site.sitekey,
      kind: v.payload.kind,
      issued_at: v.payload.iat,
      $process_person_profile: false,
    },
  });
  res.json({
    success: true,
    kind: v.payload.kind,
    issued_at: v.payload.iat,
  });
});
