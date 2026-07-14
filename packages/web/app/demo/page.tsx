'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteHeader } from '@/components/site-header';
import { LiveWidget } from '@/components/live-widget';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function DemoPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild variant="link" size="sm" className="px-0">
          <Link href="/">← Home</Link>
        </Button>
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tightest uppercase">Demo</h1>
        <p className="mt-3 text-[14px]">
          Solve the challenge below. On success you&apos;ll get a one-shot token — your backend redeems it with
          the site secret.
        </p>

        <Card className="mt-8">
          <CardContent className="p-4">
            <LiveWidget
              onSuccess={(t) => {
                setToken(t);
                setStatus('Token received. Verify server-side via /api/siteverify.');
              }}
            />
          </CardContent>
        </Card>

        {status && <p className="mt-4 text-[12px] tracking-widish uppercase">{status}</p>}
        {token && (
          <pre className="mt-4 border border-border p-3 text-[11px] leading-relaxed break-all whitespace-pre-wrap">
            {token}
          </pre>
        )}

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>&gt; Server-side redemption</CardTitle>
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
      </section>
    </main>
  );
}
