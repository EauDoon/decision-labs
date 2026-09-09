import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const app of ['partnership-breakpoint', 'common-cart', 'smallest-agreement', 'weekend-gap']) {
  test(`${app}: standalone scripts parse in their browser script mode`, () => {
    const html = readFileSync(new URL(`../apps/${app}/standalone.html`, import.meta.url), 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length, 'A bundled application script must exist.');
    for (const [, attributes, source] of scripts) {
      // VM scripts permit duplicate function declarations which browser modules reject.
      const mode = /type=["']module["']/.test(attributes) ? 'module' : 'commonjs';
      const result = spawnSync(process.execPath, [`--input-type=${mode}`, '--check'], {
        input: source, encoding: 'utf8', maxBuffer: 1024 * 1024,
      });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
    }
  });
}
