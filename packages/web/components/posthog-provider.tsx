'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';

// Reads NEXT_PUBLIC_POSTHOG_KEY at build time. If unset (local dev without
// analytics, forks, etc.) PostHog silently no-ops — no requests, no errors.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !KEY) return;
    if (posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      // Only identify users we explicitly identify() — anonymous events
      // still capture, but PostHog won't spin up a Person profile until
      // we call identify. Cheaper on the free tier.
      person_profiles: 'identified_only',
      // We handle pageviews via PageviewTracker below so we can catch
      // App Router client-side navigations (Next's default only fires on
      // hard nav).
      capture_pageview: false,
      capture_pageleave: true,
      // Session recordings off by default — flip via PostHog dashboard
      // Feature Flags → session_recording rollout when we want them.
      disable_session_recording: true,
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !pathname) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    ph.capture('$pageview', { $current_url: url });
  }, [ph, pathname, searchParams]);

  return null;
}
