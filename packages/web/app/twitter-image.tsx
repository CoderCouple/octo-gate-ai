// Twitter uses the same 1200×630 layout as Open Graph for `summary_large_image`.
// Re-export the OG image so we don't duplicate the render code.
export { default, runtime, alt, size, contentType } from './opengraph-image';
