import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { APPS } from './apps.mjs';

const commands = new Set(['test', 'check', 'build:standalone']);
const command = process.argv[2];
if (!commands.has(command) || process.argv.length !== 3) {
  console.error('Usage: node scripts/run-apps.mjs <test|check|build:standalone>');
  process.exit(1);
}
const npm = process.env.npm_execpath;
if (!npm) {
  console.error('Run this command through npm from the repository root.');
  process.exit(1);
}
let failures = 0;
for (const { id } of APPS) {
  console.log(`\n${id}: ${command}`);
  const cwd = fileURLToPath(new URL(`../apps/${id}/`, import.meta.url));
  const result = spawnSync(process.execPath, [npm, 'run', command], { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    failures += 1;
    console.error(`${id}: ${command} failed.`);
  }
}
process.exitCode = failures ? 1 : 0;
