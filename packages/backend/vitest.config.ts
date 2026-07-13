import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // These are applied before any test module (and therefore src/config.ts)
    // loads. dotenv does not override values already in process.env, so the
    // dev .env file cannot leak into the test run.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://octogate:octogate@localhost:55432/octogate',
      REDIS_URL: 'redis://localhost:63790',
      OCTOGATE_SECRET: 'test-secret-0123456789abcdef0123456789abcdef',
      // Low enough to trigger in-suite, high enough that the concurrency
      // race tests (5 parallel /verify after 1 /challenge = 6 hits) don't
      // trip the throttle.
      RATE_LIMIT: '20',
      // Large enough that an "immediate" verify (which still incurs ~100ms
      // of challenge generation + HTTP round-trip) sits comfortably under
      // the threshold. Test solves wait 600ms to comfortably pass.
      MIN_SOLVE_MS: '500',
    },
  },
});
