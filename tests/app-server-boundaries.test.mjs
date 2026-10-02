import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { createServer, request } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { APPS } from '../scripts/apps.mjs';

async function start(t, app) {
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL(`../apps/${app}/scripts/dev-server.mjs`, import.meta.url))], {
    env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    if (child.kill()) await exited;
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${app} did not start`)), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error(`${app} exited before ready`)); });
    child.stdout.on('data', chunk => {
      if (String(chunk).includes(`http://127.0.0.1:${port}`)) { clearTimeout(timer); resolve(); }
    });
  });
  return (path, { host = `127.0.0.1:${port}`, method = 'GET' } = {}) => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers: { host }, timeout: 5000 }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body, headers: response.headers }));
    });
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end();
  });
}

for (const { id } of APPS) {
  test(`${id}: server rejects foreign hosts, hidden paths and outside-root links`, async t => {
    const root = fileURLToPath(new URL(`../apps/${id}/`, import.meta.url));
    const fixture = await mkdtemp(join(root, 'server-boundary-'));
    let outside;
    const link = join(fixture, 'outside');
    const hiddenLink = join(fixture, 'visible');
    t.after(async () => {
      await unlink(link).catch(error => { if (error.code !== 'ENOENT') throw error; });
      await unlink(hiddenLink).catch(error => { if (error.code !== 'ENOENT') throw error; });
      await rm(fixture, { recursive: true, force: true });
      if (outside) await rm(outside, { recursive: true, force: true });
    });
    outside = await mkdtemp(join(tmpdir(), 'decision-labs-outside-'));
    await writeFile(join(fixture, '.hidden'), 'hidden sentinel');
    await writeFile(join(outside, 'sentinel.txt'), 'outside sentinel');
    await mkdir(join(fixture, '.inside'));
    await writeFile(join(fixture, '.inside', 'sentinel.txt'), 'hidden sentinel');
    // Windows junctions do not require file-symlink privilege. Failure is a failure, not a skipped guard.
    await symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    await symlink(join(fixture, '.inside'), hiddenLink, process.platform === 'win32' ? 'junction' : 'dir');
    const call = await start(t, id);
    const prefix = `/${basename(fixture)}`;
    for (const path of ['/', '/styles.css', '/src/app.js', '/standalone.html']) {
      const response = await call(path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
    }
    assert.equal((await call('/', { host: 'attacker.invalid' })).status, 403);
    assert.equal((await call('/', { host: 'localhost' })).status, 200);
    for (const path of [`${prefix}/.hidden`, `${prefix}/%2ehidden`, `${prefix}/outside/sentinel.txt`, `${prefix}/visible/sentinel.txt`]) {
      const response = await call(path);
      assert.ok([403, 404].includes(response.status), `${path}: ${response.status}`);
      assert.doesNotMatch(response.body, /sentinel/);
    }
    assert.ok([400, 404].includes((await call('/%ZZ')).status));
    assert.equal((await call('/', { method: 'POST' })).status, 405);
    const head = await call('/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
  });
}
