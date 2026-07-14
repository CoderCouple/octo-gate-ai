'use client';

import { useEffect, useState } from 'react';

interface RecordingOverlayProps {
  active: boolean;
  durationMs: number;
}

// Semi-transparent overlay with a circular progress ring + countdown number,
// shown over the canvas while the clip recorder is running.
export function RecordingOverlay({ active, durationMs }: RecordingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const e = Math.min(durationMs, now - start);
      setElapsed(e);
      if (e < durationMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs]);

  if (!active) return null;

  const progress = elapsed / durationMs;
  const remaining = Math.max(1, Math.ceil((durationMs - elapsed) / 1000));
  const size = 140;
  const r = 60;
  const c = 2 * Math.PI * r;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10 pointer-events-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-primary">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={5}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 60ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className="text-5xl font-black tabular-nums leading-none">{remaining}</span>
          <span className="mt-2 text-[10px] tracking-widest uppercase text-muted-foreground">Recording</span>
        </div>
      </div>
    </div>
  );
}
