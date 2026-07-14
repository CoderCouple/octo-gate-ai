'use client';

// SVG logo candidates. Each is a self-contained mark drawn on a 32-unit
// viewBox and inherits `currentColor` from CSS — so they follow the theme
// (green in dark, black in light) without props.

interface MarkProps {
  size?: number;
  className?: string;
}

// 1. Octagon of dots — 8 vertices + 1 center. "Octo" (8-sided) + Gate
//    (enclosed) + dots (product primitive).
export function OctoDot({ size = 32, className }: MarkProps) {
  const cx = 16;
  const cy = 16;
  const r = 12;
  const dots = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2} fill="currentColor" />
      ))}
      <circle cx={cx} cy={cy} r={2} fill="currentColor" />
    </svg>
  );
}

// 2. Portal — hollow square frame with a small dot cluster inside. Literal
//    "gate" reading.
export function DotPortal({ size = 32, className }: MarkProps) {
  const clusterPositions = [
    { x: 11, y: 11 }, { x: 16, y: 11 }, { x: 21, y: 11 },
    { x: 11, y: 16 }, { x: 16, y: 16 }, { x: 21, y: 16 },
    { x: 11, y: 21 }, { x: 16, y: 21 }, { x: 21, y: 21 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <rect x={4} y={4} width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} />
      {clusterPositions.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.4} fill="currentColor" />
      ))}
    </svg>
  );
}

// 3. Motion ring — a circle built from dots, with density falling off in
//    the top-right quadrant (as if the ring is "moving"). Directional
//    energy without needing animation.
export function MotionRing({ size = 32, className }: MarkProps) {
  const cx = 16;
  const cy = 16;
  const r = 11;
  const N = 24;
  const dots = Array.from({ length: N }, (_, i) => {
    const a = (i * Math.PI * 2) / N;
    // Fade opacity as we go into upper-right quadrant.
    const inQuadrant = a > -Math.PI / 2 && a < 0;
    const opacity = inQuadrant ? 0.35 : 1;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, opacity };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.4} fill="currentColor" opacity={d.opacity} />
      ))}
    </svg>
  );
}

// 4. Pixel grid glyph — 8x8 lit cells forming an inward-pointing arrow /
//    "gate open" shape. Very terminal / low-fi.
export function PixelGate({ size = 32, className }: MarkProps) {
  // 8x8 grid; 1 = lit
  const grid = [
    [0,0,1,1,1,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
    [1,0,0,1,1,0,0,1],
    [1,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,1,0],
    [0,0,1,1,1,1,0,0],
  ];
  const cell = 4;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {grid.flatMap((row, y) =>
        row.map((v, x) =>
          v ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

// 5. Corner brackets — terminal-style frame with a single dot center. Reads
//    as "sensor targeting" — human detected.
export function TargetBrackets({ size = 32, className }: MarkProps) {
  const p = 4;
  const l = 8;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {/* top-left */}
      <path d={`M ${p} ${p + l} L ${p} ${p} L ${p + l} ${p}`} fill="none" stroke="currentColor" strokeWidth={2} />
      {/* top-right */}
      <path d={`M ${32 - p - l} ${p} L ${32 - p} ${p} L ${32 - p} ${p + l}`} fill="none" stroke="currentColor" strokeWidth={2} />
      {/* bottom-left */}
      <path d={`M ${p} ${32 - p - l} L ${p} ${32 - p} L ${p + l} ${32 - p}`} fill="none" stroke="currentColor" strokeWidth={2} />
      {/* bottom-right */}
      <path d={`M ${32 - p - l} ${32 - p} L ${32 - p} ${32 - p} L ${32 - p} ${32 - p - l}`} fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx={16} cy={16} r={2.5} fill="currentColor" />
    </svg>
  );
}

// 6. Dot O — solid ring where the outline is built of small dots. Reads as
//    both the letter O (Octo) and a portal.
export function DotO({ size = 32, className }: MarkProps) {
  const cx = 16;
  const cy = 16;
  const r = 11;
  const N = 20;
  const dots = Array.from({ length: N }, (_, i) => {
    const a = (i * Math.PI * 2) / N;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.5} fill="currentColor" />
      ))}
    </svg>
  );
}

// 7. Blackhole spiral — dots converging along a logarithmic spiral toward a
//    central singularity. Grok's black-hole aesthetic applied to the CAPTCHA
//    idea: motion pulling inward.
export function BlackholeSpiral({ size = 32, className }: MarkProps) {
  const cx = 16;
  const cy = 16;
  const N = 40;
  const turns = 2.2;
  const rMax = 13;
  const dots = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1); // 0..1
    const angle = t * turns * Math.PI * 2;
    const r = rMax * (1 - t) ** 1.4; // ease-in to center
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      r: 0.6 + t * 1.4,
    };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="currentColor" />
      ))}
      <circle cx={cx} cy={cy} r={2.4} fill="currentColor" />
    </svg>
  );
}

// 8. OG blackhole monogram — concentric arcs form an "O", with an inward
//    radial stem forming the crossbar of a "G". Reads as OG on close look,
//    as a portal/event-horizon at a glance.
export function OGBlackhole({ size = 32, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {/* outer arc — the O */}
      <circle cx={16} cy={16} r={12} fill="none" stroke="currentColor" strokeWidth={2} />
      {/* inner ring — accretion disk */}
      <circle cx={16} cy={16} r={7} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="1.6 1.4" />
      {/* horizontal G crossbar */}
      <line x1={16} y1={16} x2={26} y2={16} stroke="currentColor" strokeWidth={2} />
      {/* singularity */}
      <circle cx={16} cy={16} r={1.5} fill="currentColor" />
    </svg>
  );
}

// 9. Concentric rings — pure event-horizon vibe. Dashed outer ring gives a
//    sense of rotation; solid inner disc is the singularity.
export function ConcentricGate({ size = 32, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      <circle cx={16} cy={16} r={13} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="2 2" />
      <circle cx={16} cy={16} r={8} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle cx={16} cy={16} r={3} fill="currentColor" />
    </svg>
  );
}
