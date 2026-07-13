import { api } from './client.js';
import type { ChallengeResponse, VerifyResponse } from '../types.js';

export function createChallenge(sitekey: string): Promise<ChallengeResponse> {
  return api.post<ChallengeResponse>('/api/challenge', { sitekey });
}

export function verifyAnswer(input: {
  sitekey: string;
  challenge_id: string;
  answer: string;
}): Promise<VerifyResponse> {
  return api.post<VerifyResponse>('/api/verify', input);
}
