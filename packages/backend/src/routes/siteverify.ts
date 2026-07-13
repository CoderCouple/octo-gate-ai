import { Router } from 'express';
import { findSiteBySecret } from '../sites.js';
import { verifyToken, redeemJti } from '../hmac.js';

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
    res.json({ success: false, reason: v.reason });
    return;
  }

  // Cross-site guard on the redemption side too: a token issued for site A
  // must not be redeemable by site B, even if B holds a valid token string.
  if (v.payload.sk !== site.sitekey) {
    res.json({ success: false, reason: 'cross_site' });
    return;
  }

  // Atomic single redemption. First caller wins, replays lose.
  const won = await redeemJti(v.payload.jti, v.payload.ttl);
  if (!won) {
    res.json({ success: false, reason: 'replay' });
    return;
  }

  res.json({
    success: true,
    kind: v.payload.kind,
    issued_at: v.payload.iat,
  });
});
