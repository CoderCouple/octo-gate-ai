'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface DotTextProps {
  text: string;
  className?: string;
  // If omitted, DotText auto-syncs to its parent's computed font-size so
  // it stays visually the same height as surrounding hero text at every
  // breakpoint.
  fontSize?: number;
  color?: string;
  sampleStep?: number;
  noiseCount?: number;
  amp?: number;
  freq?: number;
  inlineBaseline?: boolean;
  // Ghost mode — matches the mixfont ghost-font invariant: letter and noise
  // dots render identically in size / appearance, so a still frame is
  // indistinguishable from pure noise. Trails are OFF. Use this when the
  // component is presented as a real challenge preview. Default true.
  // Turn off for decorative hero marks where showy trails are desired.
  ghost?: boolean;
  dotSize?: number;
  width?: number;
  height?: number;
  // Runtime controls — read every frame via ref so changes don't reset the
  // dot pool. Undefined = keep current internal defaults.
  paused?: boolean;
  speed?: number;   // px/s magnitude of the flow (bg moves in `direction`, letters oppose)
  invert?: boolean; // toggles canvas CSS filter: invert(1)
  direction?: 'up' | 'down' | 'left' | 'right' | 'diagonal' | 'random';
  // Text position. Undefined = centered. Any number = re-roll a random
  // in-bounds position on that seed change. The random position always
  // clamps so the whole word is inside the canvas.
  positionSeed?: number;
}

// Renders `text` as an inline canvas where letter strokes are drawn as green
// dots that oscillate coherently — same "common fate" motion pattern the
// CAPTCHA uses to hide the answer from screenshots. A field of random-motion
// noise dots surrounds the letters as decoy.
//
// Baseline alignment: the canvas bottom is NOT the text baseline, so a naive
// `vertical-align: baseline` places the text visually above surrounding
// letters. We compute the descent (px below baseline) and apply a negative
// `marginBottom` so the internal text baseline lands on the parent baseline.
export function DotText({
  text,
  className,
  fontSize,
  color,
  sampleStep = 3,
  noiseCount = 500,
  amp = 3.2,
  freq = 1.9,
  inlineBaseline = false,
  ghost = true,
  dotSize = 1.6,
  width,
  height,
  paused,
  speed,
  invert,
  direction = 'down',
  positionSeed,
}: DotTextProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [descentPx, setDescentPx] = useState(0);
  const { resolvedTheme } = useTheme();
  const effectiveColor = color ?? (resolvedTheme === 'light' ? '#000000' : '#00ff41');
  const effectiveBg = resolvedTheme === 'light' ? '#ffffff' : '#000000';

  // Live-control mailbox — the draw loop reads these each frame, but they
  // are NOT in the effect deps → changing pause / speed / dotSize / invert
  // never re-initializes the dot pool.
  // Random direction is picked once and preserved across re-renders in a
  // ref so re-selecting the `random` option doesn't scramble the direction
  // mid-render. It's regenerated when the direction leaves 'random' and
  // comes back, giving the user a way to shuffle by picking random again.
  const randAngleRef = useRef<number>(Math.random() * Math.PI * 2);
  const prevDirRef = useRef<string>('down');
  function unitVec(dir: string): { ux: number; uy: number } {
    switch (dir) {
      case 'up': return { ux: 0, uy: -1 };
      case 'down': return { ux: 0, uy: 1 };
      case 'left': return { ux: -1, uy: 0 };
      case 'right': return { ux: 1, uy: 0 };
      case 'diagonal': return { ux: Math.SQRT1_2, uy: Math.SQRT1_2 };
      case 'random': {
        return { ux: Math.cos(randAngleRef.current), uy: Math.sin(randAngleRef.current) };
      }
      default: return { ux: 0, uy: 1 };
    }
  }

  const controls = useRef({
    paused: paused ?? false,
    speed: speed ?? 60,
    dotSize,
    invert: invert ?? false,
    ux: 0,
    uy: 1,
  });
  useEffect(() => {
    if (direction === 'random' && prevDirRef.current !== 'random') {
      randAngleRef.current = Math.random() * Math.PI * 2;
    }
    prevDirRef.current = direction;
    controls.current.paused = paused ?? false;
    controls.current.speed = speed ?? controls.current.speed;
    controls.current.dotSize = dotSize;
    controls.current.invert = invert ?? false;
    const { ux, uy } = unitVec(direction);
    controls.current.ux = ux;
    controls.current.uy = uy;
  }, [paused, speed, dotSize, invert, direction]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measureAndDraw = () => {
      const parent = canvas.parentElement;
      const effectiveFontSize = fontSize ?? (parent ? parseFloat(getComputedStyle(parent).fontSize) : 128);
      if (!effectiveFontSize || effectiveFontSize < 12) return;

      const dpr = window.devicePixelRatio || 1;
      const font = `900 ${effectiveFontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d');
      if (!offCtx) return;
      offCtx.font = font;

      // Font-box metrics (not text-specific bounding box). These match the
      // FONT's ascent/descent, which is what the surrounding text uses to
      // compute its line-box baseline — so aligning to these keeps the two
      // baselines in sync regardless of what letters happen to be in `text`.
      const m = offCtx.measureText(text);
      const ascent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || effectiveFontSize * 0.8;
      const descent = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || effectiveFontSize * 0.2;
      const padX = Math.round(effectiveFontSize * 0.08);
      const padTop = Math.round(effectiveFontSize * 0.06);
      const padBottom = Math.round(effectiveFontSize * 0.02);
      // Prefer explicit width/height when provided (Compose preview needs a
      // full-size noise field even when text is empty). Otherwise size to text.
      const naturalW = Math.ceil(m.width) + padX * 2;
      const naturalH = Math.ceil(ascent + descent) + padTop + padBottom;
      const w = width ?? naturalW;
      const h = height ?? naturalH;

      // Text placement. Undefined positionSeed → centered (H + V).
      // Any positionSeed → random position that keeps the whole word inside
      // the canvas with the same padding used at the sides.
      let textX: number;
      let baselineY: number;
      if (positionSeed === undefined || positionSeed === null) {
        textX = width ? Math.round((w - m.width) / 2) : padX;
        baselineY = height ? Math.round((h - ascent - descent) / 2 + ascent) : ascent + padTop;
      } else {
        const xRange = Math.max(0, w - m.width - padX * 2);
        const yRange = Math.max(0, h - ascent - descent - padTop - padBottom);
        textX = Math.round(padX + Math.random() * xRange);
        baselineY = Math.round(ascent + padTop + Math.random() * yRange);
      }

      off.width = w;
      off.height = h;
      offCtx.font = font;
      offCtx.fillStyle = '#000';
      offCtx.textBaseline = 'alphabetic';
      if (text) offCtx.fillText(text, textX, baselineY);

      // In ghost mode we take a completely different approach: a FLOW FIELD.
      // The letter bitmap becomes a per-pixel direction map — inside letter
      // strokes dots drift UP, everywhere else they drift DOWN. All dots
      // share the same appearance and there is ONE uniform pool of random
      // positions across the whole canvas. Density is identical in every
      // region (that's the invariant the user asked for) — the letters
      // exist only as opposing motion vectors, invisible in any single
      // frame and only readable via common-fate motion perception.
      const img = offCtx.getImageData(0, 0, w, h);
      // 1-bit mask of the rasterized text, one byte per pixel for fast lookup.
      const mask = new Uint8Array(w * h);
      if (ghost && text) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            mask[y * w + x] = (img.data[(y * w + x) * 4 + 3] ?? 0) > 128 ? 1 : 0;
          }
        }
      }
      // Non-ghost (decorative hero mark) keeps the old sampled-position pool.
      const positions: { x: number; y: number }[] = [];
      if (!ghost) {
        for (let y = 0; y < h; y += sampleStep) {
          for (let x = 0; x < w; x += sampleStep) {
            const alpha = img.data[(y * w + x) * 4 + 3] ?? 0;
            if (alpha > 128) positions.push({ x, y });
          }
        }
      }

      // Motion params for non-ghost (oscillating) mode.
      const tAxis = (Math.random() - 0.5) * 0.35;
      const tPhase = Math.random() * Math.PI * 2;
      const letters = positions.map((p) => ({
        x: p.x,
        y: p.y,
        a: tAxis + (Math.random() - 0.5) * 0.06,
        p: tPhase + (Math.random() - 0.5) * 0.12,
        f: freq + (Math.random() - 0.5) * 0.05,
        m: amp + (Math.random() - 0.5) * 0.5,
      }));
      // Guard: cap keeps a runaway prop from freezing the tab.
      const safeNoise = Math.min(Math.max(0, noiseCount), 200000);
      // Two independent full-canvas noise layers in ghost mode:
      //   bg   — every dot moves DOWN, drawn only OUTSIDE the letter mask
      //   fg   — every dot moves UP, drawn only INSIDE the letter mask
      // Each layer is uniformly dense across the whole canvas, so the
      // composite is uniformly dense too — the mask only chooses which
      // layer is visible where. No accumulation, no vertical stripes.
      const noise = Array.from({ length: safeNoise }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        a: Math.random() * Math.PI * 2,
        p: Math.random() * Math.PI * 2,
        f: 0.3 + Math.random() * 2.5,
        m: 0.8 + Math.random() * 2.5,
      }));
      const fgLayer = ghost
        ? Array.from({ length: safeNoise }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
          }))
        : [];

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      // Baseline compensation for CSS. Only applies when the canvas is used
      // INLINE with surrounding text — otherwise the negative marginBottom
      // pulls the following block up into the canvas and causes overlap.
      setDescentPx(inlineBaseline ? h - baselineY : 0);

      cancelAnimationFrame(raf);
      let lastT = performance.now();
      const start = lastT;

      // ── Ghost mode step 1: uniform noise flow ───────────────────────────
      // Every noise dot moves at the SAME velocity. Toroidal wrap at edges.
      // Uniform density is guaranteed by symmetry — every dot moves in the
      // same direction at the same speed, so nothing accumulates. Next step
      // will add opposing motion for letter regions.
      const NOISE_VX = 0;   // px/s — no horizontal motion for now
      const NOISE_VY = 60;  // px/s — downward
      // Non-ghost trail settings.
      const TRAIL_STEPS = ghost ? 1 : 4;
      const TRAIL_DT = 0.028;

      const drawFrame = (t: number) => {
        const dt = Math.min(0.05, (t - lastT) / 1000);
        lastT = t;
        // Paint the background into the canvas bitmap itself (not just via
        // CSS) — otherwise captureStream records a transparent bg and the
        // resulting video plays back black.
        ctx.fillStyle = effectiveBg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = effectiveColor;

        if (ghost) {
          // Two-layer masked ghost. Both axes: bg moves in (ux, uy), letters
          // move in (-ux, -uy). Toroidal wrap on both axes preserves density.
          const c = controls.current;
          const effectiveSpeed = c.paused ? 0 : c.speed;
          const stepX = c.ux * effectiveSpeed * dt;
          const stepY = c.uy * effectiveSpeed * dt;
          const ds = c.dotSize;
          for (const d of noise) {
            d.x += stepX;
            d.y += stepY;
            if (d.x >= w) d.x -= w;
            else if (d.x < 0) d.x += w;
            if (d.y >= h) d.y -= h;
            else if (d.y < 0) d.y += h;
            const ix = d.x | 0;
            const iy = d.y | 0;
            if (mask[iy * w + ix] === 0) {
              ctx.fillRect(ix, iy, ds, ds);
            }
          }
          for (const d of fgLayer) {
            d.x -= stepX;
            d.y -= stepY;
            if (d.x >= w) d.x -= w;
            else if (d.x < 0) d.x += w;
            if (d.y >= h) d.y -= h;
            else if (d.y < 0) d.y += h;
            const ix = d.x | 0;
            const iy = d.y | 0;
            if (mask[iy * w + ix] === 1) {
              ctx.fillRect(ix, iy, ds, ds);
            }
          }
        } else {
          // Non-ghost: original oscillation for the hero mark.
          const elapsed = (t - start) / 1000;
          for (const d of noise) {
            const ph = 2 * Math.PI * d.f * elapsed + d.p;
            const o = d.m * Math.sin(ph);
            const px = d.x + Math.cos(d.a) * o;
            const py = d.y + Math.sin(d.a) * o;
            ctx.fillRect(px | 0, py | 0, dotSize, dotSize);
          }
          for (let step = TRAIL_STEPS - 1; step >= 0; step--) {
            const pastT = elapsed - step * TRAIL_DT;
            ctx.globalAlpha = TRAIL_STEPS === 1 ? 1 : 1 - step / TRAIL_STEPS;
            for (const d of letters) {
              const ph = 2 * Math.PI * d.f * pastT + d.p;
              const o = d.m * Math.sin(ph);
              const px = d.x + Math.cos(d.a) * o;
              const py = d.y + Math.sin(d.a) * o;
              ctx.fillRect(px | 0, py | 0, dotSize, dotSize);
            }
          }
          ctx.globalAlpha = 1;
        }
        raf = requestAnimationFrame(drawFrame);
      };
      raf = requestAnimationFrame(drawFrame);
    };

    let raf = 0;
    measureAndDraw();

    // Re-measure when the parent font-size changes (e.g. Tailwind breakpoint
    // switches text-6xl → text-9xl on window resize).
    const parent = canvas.parentElement;
    let ro: ResizeObserver | null = null;
    if (parent && !fontSize) {
      ro = new ResizeObserver(() => measureAndDraw());
      ro.observe(parent);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [text, fontSize, effectiveColor, effectiveBg, sampleStep, noiseCount, amp, freq, inlineBaseline, ghost, dotSize, width, height, positionSeed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={text}
      style={{
        verticalAlign: 'baseline',
        marginBottom: `-${descentPx}px`,
        // Explicit background so `filter: invert(1)` swaps BOTH bg and dots
        // — without this the canvas is transparent and inverting only
        // touches the dots (light-mode: black→white on the white page = blank).
        background: 'hsl(var(--background))',
        filter: invert ? 'invert(1)' : undefined,
      }}
    />
  );
}
