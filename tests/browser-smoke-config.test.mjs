import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/browser-smoke.mjs', import.meta.url));

// docs/BROWSER_CHECKS.md tells developers to point PLAYWRIGHT_MODULE and
// AXE_MODULE at package directories installed outside the checkout. A stand-in
// package that refuses to launch proves which directory was loaded without a
// real browser, and the run stops before any page or listener is opened.
test('PLAYWRIGHT_MODULE and AXE_MODULE read relative directories from the working directory', () => {
  const work = mkdtempSync(join(tmpdir(), 'browser-smoke-config-'));
  try {
    mkdirSync(join(work, 'tools', 'playwright-core'), { recursive: true });
    writeFileSync(join(work, 'tools', 'playwright-core', 'package.json'), '{"name":"playwright-core","main":"index.js"}\n');
    writeFileSync(join(work, 'tools', 'playwright-core', 'index.js'), 'exports.chromium = { launch: async () => { throw new Error("stand-in playwright loaded"); } };\n');
    mkdirSync(join(work, 'tools', 'axe-core'), { recursive: true });
    writeFileSync(join(work, 'tools', 'axe-core', 'axe.min.js'), '/* stand-in axe-core */\n');
    const result = spawnSync(process.execPath, [script], {
      cwd: work,
      encoding: 'utf8',
      timeout: 15000,
      env: {
        ...process.env,
        PLAYWRIGHT_MODULE: join('tools', 'playwright-core'),
        AXE_MODULE: join('tools', 'axe-core'),
        BROWSER_EXECUTABLE: '',
      },
    });
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /stand-in playwright loaded/, result.stderr);
    assert.doesNotMatch(result.stderr, /Cannot find module|ENOENT/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
