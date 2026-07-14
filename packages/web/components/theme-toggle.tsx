'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

// Uses resolvedTheme so the button reflects what the user ACTUALLY sees
// (dark or light) even when the current mode is "system". Clicking sets an
// explicit override; there's no third "system" state on the toggle itself.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes needs a client-only guard to avoid an SSR/CSR mismatch —
  // the resolved theme is unknown until after hydration.
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {mounted ? (resolvedTheme === 'dark' ? 'Light' : 'Dark') : '—'}
    </Button>
  );
}
