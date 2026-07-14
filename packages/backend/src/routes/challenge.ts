import { Router } from 'express';
import { getSite, originAllowed } from '../sites.js';
import { createChallenge } from '../challenge.js';
import { posthog } from '../posthog.js';

export const challengeRouter = Router();

challengeRouter.post('/challenge', async (req, res) => {
  const sitekey = typeof req.body?.sitekey === 'string' ? req.body.sitekey : null;
  if (!sitekey) {
    res.status(400).json({ success: false, reason: 'missing_sitekey' });
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
  const challenge = await createChallenge(site.sitekey);
  posthog.capture({
    distinctId: site.sitekey,
    event: 'challenge_requested',
    properties: {
      sitekey: site.sitekey,
      site_name: site.name,
      origin: origin ?? null,
      challenge_id: challenge.challenge_id,
      $process_person_profile: false,
    },
  });
  res.json({
    challenge_id: challenge.challenge_id,
    width: challenge.width,
    height: challenge.height,
    size: challenge.size,
    dots: challenge.dots,
  });
});
