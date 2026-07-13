// Runtime config resolution. Never hard-code the API URL in a component;
// always call getRuntimeConfig() so the same code works in every environment.
//
// Priority: explicit runtime override > build-time env > localhost fallback.

export interface RuntimeConfig {
  apiUrl: string;
}

let override: Partial<RuntimeConfig> | null = null;

export function setRuntimeConfig(cfg: Partial<RuntimeConfig>): void {
  override = { ...override, ...cfg };
}

export function getRuntimeConfig(): RuntimeConfig {
  if (override?.apiUrl) return { apiUrl: override.apiUrl };

  // Next.js: process.env.NEXT_PUBLIC_API_URL is inlined at build time.
  // In pure-Node contexts we just read process.env directly.
  const envApi =
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_URL ?? process.env?.API_URL)) ||
    '';
  if (envApi) return { apiUrl: envApi };

  return { apiUrl: 'http://localhost:3000' };
}
