import type { MetadataRoute } from 'next';

const SITE_URL = 'https://octogate.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /logos is an internal design-review page for logo candidates;
        // no reason to have it in search results.
        disallow: ['/logos'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
