'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DotText } from '@/components/dot-text';
import { GhostControls } from '@/components/ghost-controls';
import { RecordingOverlay } from '@/components/recording-overlay';
import { recordCanvasClip } from '@/lib/canvas-clip';
import { WORDS } from '@/lib/words';

const CLIP_DURATION_MS = 5000;

interface GhostChallengeProps {
  onSuccess?: () => void;
}

// Landing-only challenge. Uses the same two-layer masked ghost renderer as
// Compose, with a demo word picked client-side (the answer never leaves the
// browser, so there's no security invariant to preserve here — this is a
// visual demo, not the customer-embed widget).
//
// The real widget shipped to customer sites (LiveWidget) still uses the
// server-issued challenge and per-dot motion cluster technique, which
// preserves invariant #1: the answer never appears in any client-bound
// payload.
function pickWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)]!;
}

export function GhostChallenge({ onSuccess }: GhostChallengeProps) {
  const [word, setWord] = useState<string>(() => pickWord());
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success' | 'toofast'>('idle');
  const [issuedAt, setIssuedAt] = useState<number>(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [direction, setDirection] = useState<
    'up' | 'down' | 'left' | 'right' | 'diagonal' | 'random'
  >('down');
  const [speed, setSpeed] = useState(60);
  const [dotSize, setDotSize] = useState(1.6);
  const [density, setDensity] = useState(60000);
  const [positionSeed, setPositionSeed] = useState<number | undefined>(undefined);
  const [recording, setRecording] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  function findCanvas(): HTMLCanvasElement | null {
    return canvasWrapRef.current?.querySelector('canvas') ?? null;
  }
  async function recordClip() {
    const canvas = findCanvas();
    if (!canvas || recording) return;
    setRecording(true);
    try {
      await recordCanvasClip(canvas, { durationMs: CLIP_DURATION_MS, filename: `octogate-clip-${Date.now()}` });
    } catch (err) {
      console.error('[clip] recording failed', err);
    } finally {
      setRecording(false);
    }
  }

  const key = useMemo(() => `${word}-${issuedAt}`, [word, issuedAt]);

  function downloadFrame() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `octogate-frame-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function submit() {
    if (status === 'success') return;
    const elapsed = Date.now() - issuedAt;
    if (elapsed < 800) {
      setStatus('toofast');
      return;
    }
    if (answer.trim().toUpperCase() === word) {
      setStatus('success');
      onSuccess?.();
    } else {
      setStatus('wrong');
    }
  }

  function nextChallenge() {
    setWord(pickWord());
    setAnswer('');
    setStatus('idle');
    setIssuedAt(Date.now());
    setPositionSeed(undefined); // back to centered on reset
  }

  return (
    <div>
      <div ref={canvasWrapRef} className="relative w-full flex items-center justify-center">
        <DotText
          key={key}
          text={word}
          fontSize={160}
          width={1000}
          height={420}
          noiseCount={density}
          ghost
          paused={paused}
          speed={speed}
          dotSize={dotSize}
          invert={inverted}
          direction={direction}
          positionSeed={positionSeed}
        />
        <RecordingOverlay active={recording} durationMs={CLIP_DURATION_MS} />
      </div>

      <GhostControls
        paused={paused}
        onPausedChange={setPaused}
        inverted={inverted}
        onInvertedChange={setInverted}
        direction={direction}
        onDirectionChange={setDirection}
        speed={speed}
        onSpeedChange={setSpeed}
        dotSize={dotSize}
        onDotSizeChange={setDotSize}
        density={density}
        onDensityChange={setDensity}
        onReset={nextChallenge}
        onShufflePosition={() => setPositionSeed(Date.now())}
        onDownloadFrame={downloadFrame}
        onRecordClip={recordClip}
        recording={recording}
      />

      <div className="border-t border-border px-4 py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <span className="text-[11px] tracking-widest uppercase text-muted-foreground shrink-0">
            &gt; Type the word
          </span>
          <Input
            type="text"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
            value={answer}
            onChange={(e) => setAnswer(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            disabled={status === 'success'}
            placeholder="_"
            className="flex-1 h-12 font-mono text-lg tracking-widish uppercase"
            aria-label="Type the word you see in the motion"
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={status === 'success' || answer.length < 3}>
              Verify
            </Button>
            <Button variant="outline" onClick={nextChallenge}>
              New
            </Button>
          </div>
        </div>

        <div className="mt-3 min-h-[1.25em] text-[11px] tracking-widish uppercase">
          {status === 'success' && <span className="text-primary">Verified.</span>}
          {status === 'wrong' && <span className="text-muted-foreground">Wrong answer. Read again or try New.</span>}
          {status === 'toofast' && <span className="text-muted-foreground">Too fast — read the motion.</span>}
        </div>
      </div>
    </div>
  );
}
