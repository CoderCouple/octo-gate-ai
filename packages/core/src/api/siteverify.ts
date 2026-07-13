import { api } from './client.js';
import type { SiteVerifyResponse, StatsResponse } from '../types.js';

export function siteverify(input: { secret: string; token: string }): Promise<SiteVerifyResponse> {
  return api.post<SiteVerifyResponse>('/api/siteverify', input);
}

export function getStats(input: { secret: string; hours?: number }): Promise<StatsResponse> {
  return api.post<StatsResponse>('/api/stats', input);
}
