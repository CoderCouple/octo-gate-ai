import { Router } from 'express';
import { findSiteBySecret } from '../sites.js';
import { getStats } from '../events.js';

export const statsRouter = Router();

statsRouter.post('/stats', async (req, res) => {
  const secret = typeof req.body?.secret === 'string' ? req.body.secret : null;
  const hoursRaw = req.body?.hours;
  const hours = Number.isFinite(Number(hoursRaw)) && Number(hoursRaw) > 0 ? Math.min(Number(hoursRaw), 24 * 30) : 24;
  if (!secret) {
    res.status(400).json({ success: false, reason: 'missing_fields' });
    return;
  }
  const site = await findSiteBySecret(secret);
  if (!site) {
    res.status(401).json({ success: false, reason: 'bad_secret' });
    return;
  }
  const rows = await getStats(site.sitekey, hours);
  res.json({ success: true, sitekey: site.sitekey, hours, stats: rows });
});
