'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteHeader } from '@/components/site-header';
import {
  OctoDot,
  DotPortal,
  MotionRing,
  PixelGate,
  TargetBrackets,
  DotO,
  BlackholeSpiral,
  OGBlackhole,
  ConcentricGate,
} from '@/components/logo-marks';
import { Radar, ScanEye, Shield, Fingerprint } from 'lucide-react';

// Lucide icons wrapped so they share the MarkProps shape (size + className,
// currentColor inheritance). Lucide already renders with stroke=currentColor
// by default, so theme-following is free.
function LucideRadar({ size = 32, className }: { size?: number; className?: string }) {
  return <Radar size={size} className={className} strokeWidth={1.75} />;
}
function LucideScanEye({ size = 32, className }: { size?: number; className?: string }) {
  return <ScanEye size={size} className={className} strokeWidth={1.75} />;
}
function LucideShield({ size = 32, className }: { size?: number; className?: string }) {
  return <Shield size={size} className={className} strokeWidth={1.75} />;
}
function LucideFingerprint({ size = 32, className }: { size?: number; className?: string }) {
  return <Fingerprint size={size} className={className} strokeWidth={1.75} />;
}

const MARKS: {
  id: string;
  name: string;
  desc: string;
  Mark: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    id: 'octo-dot',
    name: '1 · Octagon of dots',
    desc: '8 vertices + center. Reads as Octo (8-sided) + Gate (enclosed) + dots (product).',
    Mark: OctoDot,
  },
  {
    id: 'dot-portal',
    name: '2 · Dot portal',
    desc: 'Hollow gate frame with a 3×3 cluster inside. Literal "gate you pass through."',
    Mark: DotPortal,
  },
  {
    id: 'motion-ring',
    name: '3 · Motion ring',
    desc: 'Dot ring with directional fade — implies movement without needing animation.',
    Mark: MotionRing,
  },
  {
    id: 'pixel-gate',
    name: '4 · Pixel gate',
    desc: '8×8 pixel glyph, terminal / low-fi feel. Scales sharply at every size.',
    Mark: PixelGate,
  },
  {
    id: 'target',
    name: '5 · Target brackets',
    desc: 'Corner brackets + center dot. "Human detected." Feels like a sensor UI.',
    Mark: TargetBrackets,
  },
  {
    id: 'dot-o',
    name: '6 · Dot O',
    desc: 'Ring built of dots. Reads as both letter O (Octo) and portal. Cleanest mark.',
    Mark: DotO,
  },
  {
    id: 'blackhole-spiral',
    name: '7 · Blackhole spiral',
    desc: 'Dots spiraling into a singularity — Grok-blackhole vibe applied to the CAPTCHA idea (motion pulling inward).',
    Mark: BlackholeSpiral,
  },
  {
    id: 'og-blackhole',
    name: '8 · OG blackhole monogram',
    desc: 'Concentric arcs form an O; radial stem = crossbar of a G. Reads OG on close look, portal at a glance.',
    Mark: OGBlackhole,
  },
  {
    id: 'concentric-gate',
    name: '9 · Concentric gate',
    desc: 'Dashed outer ring + solid inner ring + singularity. Pure event-horizon; strong at any size.',
    Mark: ConcentricGate,
  },
  {
    id: 'lucide-radar',
    name: '10 · Lucide · Radar',
    desc: 'Radar sweep icon. Off-the-shelf via lucide-react; ties to motion detection.',
    Mark: LucideRadar,
  },
  {
    id: 'lucide-scaneye',
    name: '11 · Lucide · ScanEye',
    desc: 'Eye with a scan reticle. Detection metaphor.',
    Mark: LucideScanEye,
  },
  {
    id: 'lucide-shield',
    name: '12 · Lucide · Shield',
    desc: 'Standard security-product shield. Safe but generic.',
    Mark: LucideShield,
  },
  {
    id: 'lucide-fingerprint',
    name: '13 · Lucide · Fingerprint',
    desc: 'Human verification metaphor. Overused in the space but instantly readable.',
    Mark: LucideFingerprint,
  },
];

const SIZES = [16, 24, 40, 64, 128];

export default function LogosPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="link" size="sm" className="px-0">
          <Link href="/">← Home</Link>
        </Button>
        <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-tightest uppercase font-mono">
          Logo options
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground">
          Six directions. All follow the theme (green in dark, black in light) via
          <code className="mx-1 border border-border px-1">currentColor</code>. Click any concept name to
          tell me the pick — I&apos;ll wire it into the nav.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {MARKS.map(({ id, name, desc, Mark }) => (
            <Card key={id}>
              <CardHeader>
                <CardTitle>&gt; {name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[13px] leading-relaxed">{desc}</p>
                <div className="flex items-end gap-6 pt-2 border-t border-border">
                  {SIZES.map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <Mark size={s} />
                      <span className="text-[10px] tracking-widish uppercase text-muted-foreground">
                        {s}px
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 border border-border p-6">
          <div className="text-[11px] tracking-widest uppercase text-muted-foreground">
            &gt; In-context preview (matches nav placement)
          </div>
          <div className="mt-4 grid gap-3">
            {MARKS.map(({ id, name, Mark }) => (
              <div key={id} className="flex items-center gap-3">
                <Mark size={16} />
                <span className="text-[12px] tracking-widest uppercase">OctoGateAI</span>
                <span className="ml-auto text-[10px] tracking-widish uppercase text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
