/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Public: used by the widget script tag and demo fetches to point
    // at the deployed backend. Falls back to localhost in dev.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SITEKEY: process.env.NEXT_PUBLIC_SITEKEY || '',
  },
};

export default nextConfig;
