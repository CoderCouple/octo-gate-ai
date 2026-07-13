import crypto from 'node:crypto';
import { rasterizeWord, isInMask } from './font.js';
import { redis } from './redis.js';
import { config } from './config.js';

export interface Dot {
  x: number;
  y: number;
  a: number;  // oscillation axis (radians)
  p: number;  // phase (radians)
  f: number;  // frequency (Hz)
  m: number;  // amplitude (px)
}

export interface Challenge {
  challenge_id: string;
  width: number;
  height: number;
  size: number;
  dots: Dot[];
}

const WORDS = [
  'HUMAN', 'ROBOT', 'PROOF', 'CANDY', 'RIVER', 'HORSE', 'PIANO', 'TIGER',
  'CLOUD', 'MANGO', 'BREAD', 'GLASS', 'NORTH', 'SOUTH', 'PLANE', 'STORM',
  'LIGHT', 'CROWN', 'STONE', 'GREEN',
];

function pickWord(exclude?: string): string {
  let w = WORDS[Math.floor(Math.random() * WORDS.length)]!;
  while (w === exclude) {
    w = WORDS[Math.floor(Math.random() * WORDS.length)]!;
  }
  return w;
}

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

interface StoredChallenge {
  answer: string;
  sk: string;
  iat: number;
}

// Generate a challenge and persist server-side truth (answer, sitekey, iat)
// in Redis with TTL. The returned Challenge intentionally omits `answer` —
// invariant #1: the answer must never appear in any client-bound payload.
export async function createChallenge(sitekey: string): Promise<Challenge> {
  const width = 480;
  const height = 140;
  const target = pickWord();
  const decoy = pickWord(target);

  const scale = 10;
  const targetMask = rasterizeWord(target, width, height, {
    scale,
    cx: width / 2,
    cy: height / 2,
  });
  const decoyMask = rasterizeWord(decoy, width, height, {
    scale,
    cx: width / 2 + rand(-40, 40),
    cy: height / 2 + rand(-12, 12),
  });

  // Target: strong coherent motion. All target-dot params share axis/phase/freq
  // (+ epsilon noise so they can't be trivially k-means clustered on those axes).
  const tAxis = Math.random() * Math.PI;
  const tPhase = Math.random() * 2 * Math.PI;
  const tFreq = rand(1.6, 2.2);
  const tAmp = rand(3.2, 4.4);

  // Decoy: near-static. Low amplitude, low frequency. Attracts naive
  // motion-clustering scripts to the wrong answer first.
  const dAxis = Math.random() * Math.PI;
  const dPhase = Math.random() * 2 * Math.PI;
  const dFreq = rand(0.2, 0.4);
  const dAmp = rand(0.4, 0.9);

  const total = 4000;
  const dots: Dot[] = new Array(total);
  for (let i = 0; i < total; i++) {
    // Sample position uniformly at random. This is what keeps invariant #2
    // holding: per-frame dot density is Poisson-uniform across the canvas
    // regardless of which word we chose.
    const x = Math.random() * width;
    const y = Math.random() * height;
    if (isInMask(targetMask, x, y, width, height)) {
      dots[i] = {
        x, y,
        a: tAxis + rand(-0.04, 0.04),
        p: tPhase + rand(-0.08, 0.08),
        f: tFreq + rand(-0.03, 0.03),
        m: tAmp + rand(-0.3, 0.3),
      };
    } else if (isInMask(decoyMask, x, y, width, height)) {
      dots[i] = {
        x, y,
        a: dAxis + rand(-0.04, 0.04),
        p: dPhase + rand(-0.08, 0.08),
        f: dFreq + rand(-0.02, 0.02),
        m: dAmp + rand(-0.1, 0.1),
      };
    } else {
      dots[i] = {
        x, y,
        a: Math.random() * 2 * Math.PI,
        p: Math.random() * 2 * Math.PI,
        f: rand(0.3, 3.0),
        m: rand(0.8, 3.5),
      };
    }
  }

  // Fisher-Yates shuffle so target/decoy/background dots aren't grouped
  // by index. An attacker can't gain information from array order alone.
  for (let i = dots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = dots[i]!;
    const b = dots[j]!;
    dots[i] = b;
    dots[j] = a;
  }

  const challenge_id = crypto.randomUUID();
  const stored: StoredChallenge = { answer: target, sk: sitekey, iat: Date.now() };
  await redis.set(`ch:${challenge_id}`, JSON.stringify(stored), 'EX', config.challengeTtlSec);

  return { challenge_id, width, height, size: total, dots };
}

// Atomic single-attempt: fetch and destroy in one Redis op.
// Second caller for the same challenge_id gets null.
export async function consumeChallenge(challenge_id: string): Promise<StoredChallenge | null> {
  const raw = await redis.getdel(`ch:${challenge_id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredChallenge;
  } catch {
    return null;
  }
}
