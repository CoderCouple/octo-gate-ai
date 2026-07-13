import { build } from 'esbuild';
import { mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, 'dist');
const backendPublic = resolve(here, '..', 'backend', 'public', 'widget');

mkdirSync(dist, { recursive: true });
mkdirSync(backendPublic, { recursive: true });

const outfile = resolve(dist, 'v1.js');

await build({
  entryPoints: [resolve(here, 'src', 'widget.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2018'],
  outfile,
  legalComments: 'none',
});

// The backend serves the built bundle at /widget/v1.js. Copy so a single
// deploy of the backend ships the current widget without a separate CDN step.
cpSync(outfile, resolve(backendPublic, 'v1.js'));

console.log('widget built →', outfile);
console.log('               →', resolve(backendPublic, 'v1.js'));
