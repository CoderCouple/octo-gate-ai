import { migrate } from './schema.js';
import { createSite } from './sites.js';
import { closeDb } from './db.js';
import { closeRedis } from './redis.js';

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'create-site') {
    const [name, ...origins] = rest;
    if (!name) {
      console.error('usage: cli create-site <name> [origin ...]');
      process.exit(2);
    }
    await migrate();
    const { sitekey, secret } = await createSite(name, origins);
    console.log('created site:');
    console.log(`  name:    ${name}`);
    console.log(`  origins: ${origins.length ? origins.join(', ') : '(any — permissive)'}`);
    console.log(`  sitekey: ${sitekey}    (public, embed in widget)`);
    console.log(`  secret:  ${secret}    (private, server-side only — shown once)`);
    return;
  }
  console.error('unknown command. commands:');
  console.error('  create-site <name> [origin ...]');
  process.exit(2);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb().catch(() => {});
    await closeRedis().catch(() => {});
  });
