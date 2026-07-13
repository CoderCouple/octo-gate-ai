import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'OctoGateAI — Verify humans, not screenshots',
  description:
    'A motion-based CAPTCHA. The challenge word never exists on the client — only in coherent motion that humans read in one second.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
