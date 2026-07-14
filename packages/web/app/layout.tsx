import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

const SITE_URL = 'https://octogate.dev';
const SITE_NAME = 'OctoGateAI';
const TITLE_DEFAULT = 'OctoGateAI — The CAPTCHA AI Can’t Read';
const DESCRIPTION =
  'A motion-based CAPTCHA. The challenge word never appears as text, image, or font on the client. Humans read it in about a second through coherent motion; frontier AI models — GPT, Claude, Gemini — miss the message on screenshots, frames, or video.';
const KEYWORDS = [
  'captcha',
  'motion captcha',
  'AI-resistant captcha',
  'bot detection',
  'human verification',
  'reCAPTCHA alternative',
  'AI abuse prevention',
  'ghost font',
  'signup form protection',
  'anti-bot',
  'OctoGateAI',
];

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: '%s — OctoGateAI',
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: 'OctoGateAI' }],
  creator: 'OctoGateAI',
  publisher: 'OctoGateAI',
  applicationName: SITE_NAME,
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_DEFAULT,
    description: DESCRIPTION,
    creator: '@octogateai',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// Schema.org SoftwareApplication — lets search engines render rich results
// (name, description, category, publisher). No pricing offer yet — v0 is
// design-partner only.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'SecurityApplication',
  applicationSubCategory: 'CAPTCHA',
  operatingSystem: 'Web',
  description: DESCRIPTION,
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    availability: 'https://schema.org/PreOrder',
    priceCurrency: 'USD',
    price: '0',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
