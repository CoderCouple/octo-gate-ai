// Compact 5x7 bitmap font for uppercase A-Z. Written as strings for
// readability — '#' = filled pixel, '.' = empty. Words used in challenges
// are drawn from the WORDS list in challenge.ts, which only uses A-Z, so we
// don't ship digits or punctuation yet.

const GLYPHS_RAW: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;

const GLYPHS: Record<string, number[]> = {};
for (const [ch, rows] of Object.entries(GLYPHS_RAW)) {
  GLYPHS[ch] = rows.map((r) => {
    let n = 0;
    for (let i = 0; i < GLYPH_W; i++) {
      if (r[i] === '#') n |= 1 << (GLYPH_W - 1 - i);
    }
    return n;
  });
}

export interface RasterOpts {
  scale: number;
  letterSpacing?: number;
  cx?: number;
  cy?: number;
}

// Draw `word` into a canvasW x canvasH byte mask (1 = filled). Centered on
// (cx, cy) if provided, otherwise on the canvas center. Missing glyphs are
// treated as spaces.
export function rasterizeWord(
  word: string,
  canvasW: number,
  canvasH: number,
  opts: RasterOpts,
): Uint8Array {
  const scale = opts.scale;
  const spacing = opts.letterSpacing ?? 1;
  const mask = new Uint8Array(canvasW * canvasH);
  const letters = word.toUpperCase().split('');
  const stride = (GLYPH_W + spacing) * scale;
  const wordW = letters.length * stride - spacing * scale;
  const wordH = GLYPH_H * scale;
  const cx = opts.cx ?? canvasW / 2;
  const cy = opts.cy ?? canvasH / 2;
  const x0 = Math.round(cx - wordW / 2);
  const y0 = Math.round(cy - wordH / 2);

  for (let li = 0; li < letters.length; li++) {
    const glyph = GLYPHS[letters[li]!];
    if (!glyph) continue;
    const lx = x0 + li * stride;
    for (let gy = 0; gy < GLYPH_H; gy++) {
      const row = glyph[gy] ?? 0;
      for (let gx = 0; gx < GLYPH_W; gx++) {
        const on = (row >> (GLYPH_W - 1 - gx)) & 1;
        if (!on) continue;
        const bx = lx + gx * scale;
        const by = y0 + gy * scale;
        for (let py = 0; py < scale; py++) {
          const y = by + py;
          if (y < 0 || y >= canvasH) continue;
          const rowStart = y * canvasW;
          for (let px = 0; px < scale; px++) {
            const x = bx + px;
            if (x < 0 || x >= canvasW) continue;
            mask[rowStart + x] = 1;
          }
        }
      }
    }
  }
  return mask;
}

export function isInMask(
  mask: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || ix >= w || iy < 0 || iy >= h) return false;
  return mask[iy * w + ix] === 1;
}
