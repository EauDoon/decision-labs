import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createWorkbenchServer, DEFAULT_PORT, LISTEN_HOST, listenWorkbench, resolveListenOptions } from '../scripts/dev-server.mjs';

const script = fileURLToPath(new URL('../scripts/dev-server.mjs', import.meta.url));

function assertRejectedPort(value) {
  assert.throws(() => resolveListenOptions({ PORT: value }), /PORT must be an integer from 1 through 65535/);
}

test('listen options default to loopback port 4173 and ignore HOST', () => {
  assert.deepEqual(resolveListenOptions({}), { host: LISTEN_HOST, port: DEFAULT_PORT });
  assert.deepEqual(resolveListenOptions({ PORT: '', HOST: '0.0.0.0' }), { host: '127.0.0.1', port: 4173 });
  assert.deepEqual(resolveListenOptions({ PORT: '4174', HOST: '0.0.0.0' }), { host: '127.0.0.1', port: 4174 });
  assert.deepEqual(resolveListenOptions({ PORT: '1' }), { host: '127.0.0.1', port: 1 });
  assert.deepEqual(resolveListenOptions({ PORT: '65535' }), { host: '127.0.0.1', port: 65535 });
});

test('invalid PORT values are rejected instead of coerced', () => {
  for (const value of ['0', '65536', '-1', '4173.5', '0x105d', '1e3', '4173foo', ' 4173', 'nope', '+4173']) {
    assertRejectedPort(value);
  }
});

test('invalid PORT exits before listening', () => {
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, PORT: 'nope' },
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PORT must be an integer from 1 through 65535\. Received "nope"\./);
  assert.equal(result.stdout, '');
});

test('workbench server reports the bound loopback address', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'partnership-breakpoint-'));
  await writeFile(join(directory, 'index.html'), '<!doctype html><title>ok</title>\n');
  const server = createWorkbenchServer(directory);
  const listening = await listenWorkbench(server, { host: LISTEN_HOST, port: 0 });
  try {
    assert.equal(listening.host, '127.0.0.1');
    assert.notEqual(listening.port, 0);
    assert.equal(listening.url, `http://127.0.0.1:${listening.port}`);
    const response = await fetch(listening.url);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<!doctype html><title>ok</title>\n');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
