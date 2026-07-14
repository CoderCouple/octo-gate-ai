'use client';

import {
  Play,
  Pause,
  Contrast,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoveDiagonal,
  Shuffle,
  Gauge,
  Circle,
  Grid3x3,
  Move,
  RotateCcw,
  Camera,
  Video,
} from 'lucide-react';

// Control bar for the ghost renderer — used on both Try-to-beat-it and
// Write-your-own tabs. Emits changes upward via callbacks; the parent owns
// the state and passes the live values as props to DotText, which reads
// them via a ref so the dot pool never re-initializes.

const DIRECTION_ICONS = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
  diagonal: MoveDiagonal,
  random: Shuffle,
} as const;

interface GhostControlsProps {
  paused: boolean;
  onPausedChange: (v: boolean) => void;

  inverted: boolean;
  onInvertedChange: (v: boolean) => void;

  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal' | 'random';
  onDirectionChange: (v: GhostControlsProps['direction']) => void;

  speed: number;
  onSpeedChange: (v: number) => void;

  dotSize: number;
  onDotSizeChange: (v: number) => void;

  density: number;
  onDensityChange: (v: number) => void;

  onReset: () => void;
  onShufflePosition: () => void;
  onDownloadFrame: () => void;
  onRecordClip: () => void;
  recording?: boolean;
}

export function GhostControls({
  paused,
  onPausedChange,
  inverted,
  onInvertedChange,
  direction,
  onDirectionChange,
  speed,
  onSpeedChange,
  dotSize,
  onDotSizeChange,
  density,
  onDensityChange,
  onReset,
  onShufflePosition,
  onDownloadFrame,
  onRecordClip,
  recording,
}: GhostControlsProps) {
  const DirIcon = DIRECTION_ICONS[direction];
  return (
    <div className="border-t border-border font-mono text-[11px] tracking-widest uppercase">
      {/* Row 1 — buttons */}
      <div className="flex flex-nowrap items-center gap-2 px-4 py-3 overflow-x-auto">
        <Btn
          onClick={() => onPausedChange(!paused)}
          active={paused}
          icon={paused ? <Play size={12} /> : <Pause size={12} />}
        >
          {paused ? 'Play' : 'Pause'}
        </Btn>
        <Btn
          onClick={() => onInvertedChange(!inverted)}
          active={inverted}
          icon={<Contrast size={12} />}
        >
          Invert
        </Btn>
        <Btn
          onClick={() => {
            const order: GhostControlsProps['direction'][] = [
              'down', 'up', 'left', 'right', 'diagonal', 'random',
            ];
            const idx = order.indexOf(direction);
            onDirectionChange(order[(idx + 1) % order.length]!);
          }}
          icon={<DirIcon size={12} />}
          title="Flow direction — bg moves this way, letters move opposite"
        >
          Direction: {direction}
        </Btn>
        <Btn onClick={onShufflePosition} icon={<Move size={12} />} title="Move text to a random in-bounds position">
          Shuffle
        </Btn>
        <Btn onClick={onReset} icon={<RotateCcw size={12} />}>
          Reset
        </Btn>
        <span className="flex-1" />
        <Btn onClick={onDownloadFrame} icon={<Camera size={12} />}>
          Frame ↓
        </Btn>
        <Btn
          onClick={onRecordClip}
          primary
          active={recording}
          icon={<Video size={12} />}
          title="Record a 3-second WebM clip of the canvas"
        >
          {recording ? 'Recording…' : 'Clip ↓'}
        </Btn>
      </div>
      {/* Row 2 — sliders */}
      <div className="flex flex-wrap items-center gap-6 px-4 pb-3 border-t border-border pt-3">
        <label className="flex items-center gap-2 shrink-0">
          <Gauge size={12} className="text-muted-foreground" />
          Speed
          <input
            type="range"
            min={20}
            max={300}
            step={5}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-40 accent-primary"
            aria-label="Motion speed"
          />
          <span className="text-muted-foreground tabular-nums w-16">{speed}px/s</span>
        </label>
        <label className="flex items-center gap-2 shrink-0">
          <Circle size={12} className="text-muted-foreground" fill="currentColor" />
          Dot
          <input
            type="range"
            min={1}
            max={4}
            step={0.2}
            value={dotSize}
            onChange={(e) => onDotSizeChange(Number(e.target.value))}
            className="w-32 accent-primary"
            aria-label="Dot size"
          />
          <span className="text-muted-foreground tabular-nums w-10">{dotSize.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 shrink-0" title="Number of dots — changing this re-initializes the pool">
          <Grid3x3 size={12} className="text-muted-foreground" />
          Density
          <input
            type="range"
            min={5000}
            max={200000}
            step={5000}
            value={density}
            onChange={(e) => onDensityChange(Number(e.target.value))}
            className="w-40 accent-primary"
            aria-label="Dot density"
          />
          <span className="text-muted-foreground tabular-nums w-16">{(density / 1000).toFixed(0)}k</span>
        </label>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  active,
  primary,
  title,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  primary?: boolean;
  title?: string;
  icon?: React.ReactNode;
}) {
  // Base has hover:bg-secondary (light gray) which is right for neutral
  // buttons. Primary + active states need to keep their filled bg on hover
  // — else white text lands on gray gray and disappears.
  const base =
    'inline-flex items-center gap-1.5 border border-border px-3 h-8 font-mono text-[11px] tracking-widest uppercase transition-opacity shrink-0';
  const filled = primary || active;
  const stateCls = filled
    ? ' bg-primary text-primary-foreground border-transparent hover:bg-primary hover:opacity-90'
    : ' hover:bg-secondary';
  return (
    <button type="button" onClick={onClick} title={title} className={base + stateCls}>
      {icon}
      {children}
    </button>
  );
}
