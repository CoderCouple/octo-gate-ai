'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { DotPortal } from '@/components/logo-marks';

// Sticky app header — matches the shadcn "site-header" pattern used in the
// octoflash reference. Left: brand. Right: nav + theme + primary CTA.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
            <DotPortal size={20} />
            <span>OctoGateAI</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/#integration">Docs</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="https://github.com/CoderCouple/octo-gate-ai" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <a href="https://calendly.com/sunil28071987/30min" target="_blank" rel="noreferrer">Talk to us</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
