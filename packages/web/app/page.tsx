'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SiteHeader } from '@/components/site-header';
import { DotText } from '@/components/dot-text';
import { TryOrWrite } from '@/components/try-or-write';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  // Hover pauses the ghost renderer — the word disappears and only uniform
  // noise remains, demonstrating that motion is what makes the letters
  // readable. touch: paused briefly, then resumes (mobile UX).
  const [heroHovered, setHeroHovered] = useState(false);

  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <div className="flex flex-col items-center text-center">
        <Badge variant="outline" className="text-[10px] tracking-widest uppercase px-3 py-1">
          Motion-based CAPTCHA · v0
        </Badge>
        <div className="mt-6 font-mono font-black tracking-tightest text-center">
          <div
            className="my-2 flex justify-center"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
            onTouchStart={() => setHeroHovered(true)}
            onTouchEnd={() => setHeroHovered(false)}
          >
            <DotText
              text="Captcha"
              fontSize={140}
              width={720}
              height={220}
              noiseCount={30000}
              ghost
              dotSize={1.6}
              direction="down"
              speed={60}
              paused={heroHovered}
            />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl leading-none">
            AI can&apos;t Read
          </h1>
        </div>
        <p className="mt-8 max-w-5xl text-[15px] md:text-[17px] leading-relaxed">
          A word is moving in the dots below. Humans see it in about a second. Frontier AI models — given screenshots, frames, even full video — read the decoy and miss the message.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="mailto:hello@octogateai.com?subject=Design%20partner">Talk to us</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/demo">Live demo →</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16">
        <TryOrWrite />
      </div>
    </section>
  );
}

// ── Why this works ─────────────────────────────────────────────────────────

function WhyThisWorks() {
  const cols = [
    {
      title: '> Humans pass fast',
      body:
        'No distorted letters, no fire hydrants. The moving word pops out of the noise in under a second, at any age and reading level.',
    },
    {
      title: '> Screenshots are empty',
      body:
        'Pause the challenge or download a frame: a frozen image is statistically flat noise. There is no glyph to OCR, so vision-model attacks return nothing.',
    },
    {
      title: '> Decoys punish analysis',
      body:
        'A near-static decoy word hides in every challenge. Agents doing frame analysis find it, answer confidently — and answer wrong. Motion vectors randomize per challenge.',
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tightest uppercase">Why this works</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.title} className="border border-border p-5">
            <div className="text-[11px] tracking-widest uppercase pb-3 border-b border-border">{c.title}</div>
            <p className="mt-4 text-[14px] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Frontier models on the record ──────────────────────────────────────────

function ModelReceipts() {
  const models = [
    { name: 'GPT-5', status: 'pending' },
    { name: 'Claude Opus 4.7', status: 'pending' },
    { name: 'Gemini 2.5 Pro', status: 'pending' },
    { name: 'Grok 4', status: 'pending' },
    { name: 'Llama 4 Behemoth', status: 'pending' },
    { name: 'DeepSeek R2', status: 'pending' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tightest uppercase">Frontier models, on the record</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed">
        We feed every challenge to leading models and publish the transcripts — the guesses, the hallucinated
        decoys, the reasoning chains that end in the wrong word.
      </p>
      <p className="mt-2 text-[11px] tracking-widish uppercase text-muted-foreground">
        Sample layout — replace with documented runs before launch.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <div key={m.name} className="border border-border p-4">
            <div className="text-[11px] tracking-widest uppercase text-muted-foreground">Model</div>
            <div className="mt-1 text-lg font-bold tracking-tightest">{m.name}</div>
            <div className="mt-3 text-[11px] tracking-widish uppercase">Verdict</div>
            <div className="mt-1 text-[14px] tracking-widish uppercase text-muted-foreground">— run pending —</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Integration ────────────────────────────────────────────────────────────

function Integration() {
  return (
    <section id="integration" className="mx-auto max-w-6xl px-6 py-12 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tightest uppercase">Drop in the snippet</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed">
        Two elements on the customer page. One siteverify call from your backend to redeem the token. That&apos;s
        the whole surface.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>&gt; On the customer page</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[12px] leading-relaxed overflow-x-auto">
{`<script src="${API}/widget/v1.js" async defer></script>

<div class="octogate"
     data-sitekey="ogk_..."
     data-api="${API}"
     data-theme="dark"></div>

<script>
  window.OctoGateAI.onSuccess = function (token) {
    document.getElementById('captcha_token').value = token;
    document.getElementById('signup_form').submit();
  };
</script>`}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>&gt; Your backend redeems it</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[12px] leading-relaxed overflow-x-auto">
{`POST ${API}/api/siteverify
Content-Type: application/json

{
  "secret": "ogs_...",
  "token":  "<token from widget>"
}

// → { "success": true, "kind": "success", "issued_at": ... }`}
            </pre>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Button asChild variant="link" size="sm">
          <Link href="/demo">See a working demo →</Link>
        </Button>
      </div>
    </section>
  );
}

// ── CTA ─────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 border-t border-border">
      <div className="border border-foreground p-8 md:p-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tightest uppercase leading-tight max-w-2xl">
          Bleeding from AI-generated abuse? Let&apos;s talk.
        </h2>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed">
          Design partner slots open. If your signup, comments, or forms are getting flooded by AI-driven traffic,
          we want to hear about it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="mailto:hello@octogateai.com?subject=Design%20partner">hello@octogateai.com</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/CoderCouple/octo-gate-ai" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer className="border-t border-border mt-8 px-6 py-8 text-[12px] tracking-tight text-muted-foreground">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <span>OctoGateAI · v0</span>
        <span>Built on Railway + Vercel + Supabase + Upstash</span>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Hero />
      <WhyThisWorks />
      <ModelReceipts />
      <Integration />
      <CTA />
      <SiteFooter />
    </main>
  );
}
