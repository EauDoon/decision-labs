// Runs every root catalog test. Files are discovered from tests/*.test.mjs so a
// new catalog test can never be left out of `npm test` by a hard-coded list.
// No glob is passed to node: Node 20 and cmd.exe do not expand one.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export function catalogTestFiles(directory = new URL('../tests/', import.meta.url)) {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => `tests/${name}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = catalogTestFiles();
  if (files.length === 0) {
    console.error('No catalog tests found in tests/*.test.mjs.');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not run the catalog tests: ${result.error.message}`);
    process.exit(1);
  }
  process.exitCode = result.status ?? 1;
}
