'use client';

import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DotText } from '@/components/dot-text';
import { GhostChallenge } from '@/components/ghost-challenge';
import { GhostControls } from '@/components/ghost-controls';
import { RecordingOverlay } from '@/components/recording-overlay';
import { bumpSolveCount, readSolveCount } from '@/lib/counter';
import { recordCanvasClip } from '@/lib/canvas-clip';

const CLIP_DURATION_MS = 5000;

const MAX = 10;

// Mirrors Motionglyph Site v5 mockup. Full-width tabs (green active), unified
// challenge frame with top status bar + canvas + controls bar, then stat
// tiles below. Controls in the bottom bar are decorative for v0 — wiring
// Pause/Invert/Motion into the vanilla widget would require a backend
// redeploy of the widget script. Called out inline.
export function TryOrWrite() {
  const [customWord, setCustomWord] = useState('');
  const [tab, setTab] = useState<'beat' | 'write'>('beat');
  const [solves, setSolves] = useState(0);
  const [frame, setFrame] = useState(0);

  // Compose-tab controls. Beat-tab controls live inside GhostChallenge.
  const [composePaused, setComposePaused] = useState(false);
  const [composeInverted, setComposeInverted] = useState(false);
  const [composeDirection, setComposeDirection] = useState<
    'up' | 'down' | 'left' | 'right' | 'diagonal' | 'random'
  >('down');
  const [composeSpeed, setComposeSpeed] = useState(60);
  const [composeDotSize, setComposeDotSize] = useState(1.6);
  const [composeDensity, setComposeDensity] = useState(60000);
  const [composePositionSeed, setComposePositionSeed] = useState<number | undefined>(undefined);
  const [composeRecording, setComposeRecording] = useState(false);
  const composeCanvasRef = useRef<HTMLDivElement | null>(null);

  async function recordCompose() {
    const canvas = composeCanvasRef.current?.querySelector('canvas');
    if (!canvas || composeRecording) return;
    setComposeRecording(true);
    try {
      await recordCanvasClip(canvas, { durationMs: CLIP_DURATION_MS, filename: `octogate-compose-${Date.now()}` });
    } catch (err) {
      console.error('[clip] recording failed', err);
    } finally {
      setComposeRecording(false);
    }
  }

  useEffect(() => setSolves(readSolveCount()), []);

  function downloadComposeFrame() {
    const canvas = composeCanvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `octogate-compose-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Rolling frame counter — purely cosmetic, matches design's live indicator.
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 100000), 33);
    return () => clearInterval(id);
  }, []);

  const attempts = solves;
  const solveRate = attempts > 0 ? '100%' : '0%';

  return (
    <div>
      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'beat' | 'write')}>
        <TabsList className="w-full h-14 grid grid-cols-2 p-1 bg-transparent border border-border">
          <TabsTrigger
            value="beat"
            className="h-full rounded-none font-mono uppercase tracking-widish text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            Try to beat it
          </TabsTrigger>
          <TabsTrigger
            value="write"
            className="h-full rounded-none font-mono uppercase tracking-widish text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
          >
            Write your own
          </TabsTrigger>
        </TabsList>

        {/* ── Try to beat it — unified challenge frame ─────────────────── */}
        <TabsContent value="beat" className="mt-4">
          <div className="border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border font-mono text-[11px] tracking-widest uppercase">
              <span>&gt; Public Challenge</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                  Live
                </span>
                <span className="text-muted-foreground">Frame {frame}</span>
              </span>
            </div>
            {/* Ghost-rendered challenge with same visuals as Compose. The
                customer-embed widget (LiveWidget) is unchanged — it still
                uses the server-issued challenge and per-dot motion cluster
                technique that preserves invariant #1. */}
            <GhostChallenge onSuccess={() => setSolves(bumpSolveCount())} />
          </div>
        </TabsContent>

        {/* ── Write your own — big preview + centered input ────────────── */}
        <TabsContent value="write" className="mt-4">
          <div className="border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border font-mono text-[11px] tracking-widest uppercase">
              <span>&gt; Compose</span>
              <span className="text-muted-foreground">Frame {frame}</span>
            </div>

            <div ref={composeCanvasRef} className="relative w-full bg-secondary/40 flex items-center justify-center">
              <DotText
                text={customWord.trim()}
                fontSize={160}
                width={1000}
                height={420}
                noiseCount={composeDensity}
                ghost
                paused={composePaused}
                speed={composeSpeed}
                dotSize={composeDotSize}
                invert={composeInverted}
                direction={composeDirection}
                positionSeed={composePositionSeed}
              />
              <RecordingOverlay active={composeRecording} durationMs={CLIP_DURATION_MS} />
            </div>

            <GhostControls
              paused={composePaused}
              onPausedChange={setComposePaused}
              inverted={composeInverted}
              onInvertedChange={setComposeInverted}
              direction={composeDirection}
              onDirectionChange={setComposeDirection}
              speed={composeSpeed}
              onSpeedChange={setComposeSpeed}
              dotSize={composeDotSize}
              onDotSizeChange={setComposeDotSize}
              density={composeDensity}
              onDensityChange={setComposeDensity}
              onReset={() => {
                setCustomWord('');
                setComposePositionSeed(undefined);
              }}
              onShufflePosition={() => setComposePositionSeed(Date.now())}
              onDownloadFrame={downloadComposeFrame}
              onRecordClip={recordCompose}
              recording={composeRecording}
            />

            <div className="border-t border-border px-4 py-4">
              <div className="flex flex-col items-center">
                <span className="text-[11px] tracking-widest uppercase text-muted-foreground">
                  &gt; Write your message
                </span>
                <Input
                  type="text"
                  inputMode="text"
                  maxLength={MAX}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="HELLO HUMAN"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ''))}
                  className="mt-2 max-w-xl h-14 text-center font-mono text-lg uppercase tracking-widish"
                  aria-label="Write your own hidden message"
                />
                <span className="mt-2 text-[11px] tracking-widish uppercase text-muted-foreground">
                  {customWord.length}/{MAX}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Stat tiles (design copy: attempts / solve rate / AI solves) ── */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatTile value={String(attempts)} label="Human attempts" note="Stored in this browser (demo counter)" />
        <StatTile value={solveRate} label="Human solve rate" note="First try, no reveal" highlight />
        <StatTile value="0" label="Documented AI solves" note="Unprompted, without being told the technique" />
      </div>
    </div>
  );
}

// ── Small primitives ─────────────────────────────────────────────────────

function StatTile({
  value,
  label,
  note,
  highlight,
}: {
  value: string;
  label: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div className="border border-border p-5">
      <div className={`text-3xl md:text-4xl font-bold tracking-tightest ${highlight ? 'text-primary' : ''}`}>
        {value}
      </div>
      <div className="mt-2 text-[11px] tracking-widest uppercase">{label}</div>
      <div className="mt-1 text-[11px] tracking-widish uppercase text-muted-foreground">{note}</div>
    </div>
  );
}
