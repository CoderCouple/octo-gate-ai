'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const SITEKEY = process.env.NEXT_PUBLIC_SITEKEY ?? '';

export default function DemoPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!SITEKEY) return;
    (window as unknown as { OctoGateAI?: { onSuccess?: (t: string) => void } }).OctoGateAI = {
      onSuccess: (t: string) => {
        setToken(t);
        setStatus('Token received. Verify server-side via /api/siteverify.');
      },
    };
    const s = document.createElement('script');
    s.src = `${API}/widget/v1.js`;
    s.async = true;
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return (
    <main className="min-h-screen px-6 py-10 mx-auto max-w-3xl">
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
          {SITEKEY ? (
            <div className="octogate" data-sitekey={SITEKEY} data-api={API} data-theme="dark" />
          ) : (
            <p className="text-[11px] tracking-widish uppercase text-muted-foreground">
              Set NEXT_PUBLIC_SITEKEY (env var) to embed the live challenge.
            </p>
          )}
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

// → { "success": true, "kind": "success", "issued_at": 1710000000000 }`}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
