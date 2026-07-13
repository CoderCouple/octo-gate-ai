'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const SITEKEY = process.env.NEXT_PUBLIC_SITEKEY ?? '';

function LiveWidget() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current || !SITEKEY) return;
    const s = document.createElement('script');
    s.src = `${API}/widget/v1.js`;
    s.async = true;
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);
  if (!SITEKEY) {
    return (
      <p className="text-[11px] tracking-widish uppercase text-muted-foreground">
        Set NEXT_PUBLIC_SITEKEY to embed the live challenge here.
      </p>
    );
  }
  return <div ref={ref} className="octogate" data-sitekey={SITEKEY} data-api={API} data-theme="dark" />;
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="text-[12px] tracking-widest uppercase">OctoGateAI</div>
        <nav className="flex items-center gap-3">
          <Button asChild variant="link" size="sm">
            <Link href="/demo">Demo</Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tightest uppercase leading-[0.96]">
          Verify humans.
          <br />
          Read what you can&apos;t screenshot.
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed">
          The challenge word never exists as text, image, or font mask on the client. A field of statistically
          identical dots. The word appears only in coherent motion — humans read it in about one second. Any
          single frame is uniform noise.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8 grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>&gt; Try it</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveWidget />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>&gt; Why this works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-[14px] leading-relaxed">
              <li>
                <strong className="tracking-widish uppercase">Humans pass fast.</strong> Gestalt common-fate
                perception reads coherent motion in ~1 second.
              </li>
              <li>
                <strong className="tracking-widish uppercase">Screenshots are empty.</strong> Every frame is
                statistically flat noise. No OCR, no vision model, gets the word from one image.
              </li>
              <li>
                <strong className="tracking-widish uppercase">Decoys punish analysis.</strong> A near-static
                second word attracts naive motion clustering to the wrong answer first.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>&gt; Integration</CardTitle>
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
    // send token to your backend to redeem via /api/siteverify
    document.getElementById('captcha_token').value = token;
    document.getElementById('signup_form').submit();
  };
</script>`}
            </pre>
            <div className="mt-4">
              <Button asChild variant="link" size="sm">
                <Link href="/demo">See a working demo →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border mt-16 px-6 py-6 text-[11px] tracking-widest uppercase text-muted-foreground">
        OctoGateAI · v0
      </footer>
    </main>
  );
}
