'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const SITEKEY = process.env.NEXT_PUBLIC_SITEKEY ?? '';

interface LiveWidgetProps {
  theme?: 'dark' | 'light';
  onSuccess?: (token: string) => void;
}

// Design rule (see memory): widget dots are green in dark mode, black in
// light mode — never invert.

// Mounts the vanilla-JS widget (served by the backend at /widget/v1.js) into
// a div. Injects the script tag exactly once per page even if multiple
// LiveWidgets render — the widget's auto-mount picks up all `.octogate` divs.
export function LiveWidget({ theme, onSuccess }: LiveWidgetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Wait for hydration before deciding theme. next-themes' resolvedTheme is
  // undefined on first render, and defaulting to 'dark' locks light-mode
  // browsers into the wrong widget palette until they toggle.
  useEffect(() => setMounted(true), []);
  const effectiveTheme: 'dark' | 'light' = theme ?? (resolvedTheme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    if (!SITEKEY || !ref.current) return;
    // Register onSuccess handler on the widget's single global. Multiple
    // LiveWidget instances on a page would collide here; that's fine for v0.
    if (onSuccess) {
      (window as unknown as { OctoGateAI?: { onSuccess?: (t: string) => void } }).OctoGateAI = {
        ...(window as unknown as { OctoGateAI?: object }).OctoGateAI,
        onSuccess,
      };
    }

    // The widget's auto-mount only runs once on script load. If this
    // LiveWidget mounts AFTER that (React tab switch, hot-reload, etc.), we
    // have to call autoMount() ourselves — otherwise the fresh `.octogate`
    // div sits empty forever.
    const runAutoMount = () => {
      const og = (window as unknown as { OctoGateAI?: { autoMount?: () => unknown } }).OctoGateAI;
      og?.autoMount?.();
    };

    const existing = document.querySelector('script[data-og-widget]');
    if (existing) {
      // Script already loaded — attempt mount now (and once more on next tick
      // in case the script is still executing).
      runAutoMount();
      const t = setTimeout(runAutoMount, 30);
      return () => clearTimeout(t);
    }
    const s = document.createElement('script');
    s.src = `${API}/widget/v1.js`;
    s.async = true;
    s.setAttribute('data-og-widget', '1');
    s.onload = runAutoMount;
    document.head.appendChild(s);
  }, [onSuccess, effectiveTheme]);

  if (!SITEKEY) {
    return (
      <p className="text-[11px] tracking-widish uppercase text-muted-foreground">
        NEXT_PUBLIC_SITEKEY not set — build w/ env to embed the live challenge.
      </p>
    );
  }
  // Reserve the space during hydration so layout doesn't jump when the
  // widget mounts.
  if (!mounted) {
    return <div className="w-full min-h-[240px] border border-border" aria-hidden="true" />;
  }
  // `key={effectiveTheme}` forces React to unmount + remount the .octogate
  // div when the theme changes, which prompts the widget script's autoMount
  // to re-render the canvas with the new theme colors. Without this the
  // widget stays locked to whatever theme was active on first mount.
  return (
    <div
      key={effectiveTheme}
      ref={ref}
      className="octogate"
      data-sitekey={SITEKEY}
      data-api={API}
      data-theme={effectiveTheme}
    />
  );
}
