import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  CONTENT_SECURITY_POLICY,
  PUBLIC_PATHS,
  catalogVersionLine,
  createLauncher,
  notFoundPage,
  parsePort,
  publicFile,
} from '../scripts/serve.mjs';

function call(server, path, method = 'GET', host = `127.0.0.1:${server.address().port}`) {
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: { host },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runningServer(t) {
  const server = createLauncher();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return server;
}

test('analyst commands reject Windows console aliases before opening input', { skip: process.platform !== 'win32' }, () => {
  const commands = [
    ['common-cart', ['market', '--input'], 1],
    ['smallest-agreement', ['solve'], 2],
    ['partnership-breakpoint', ['summary'], 1],
    ['weekend-gap', ['simulate'], 1],
  ];
  for (const [app, args, exitCode] of commands) {
    for (const alias of ['CONIN$', 'CONOUT$']) {
      const script = fileURLToPath(new URL(`../apps/${app}/scripts/analyze.mjs`, import.meta.url));
      const result = spawnSync(process.execPath, [script, ...args, alias], { encoding: 'utf8', timeout: 5000 });
      assert.ifError(result.error);
      assert.equal(result.status, exitCode, app + ': ' + result.stderr);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /local file|device|network/);
    }
  }
});

test('launcher serves the catalog and four standalone workbenches with security headers', async (t) => {
  const server = await runningServer(t);
  const page = await call(server, '/');
  assert.equal(page.status, 200);
  assert.match(page.body, /Decision Labs/);
  assert.match(page.body, /The workbenches/);
  assert.equal([...page.body.matchAll(/class="open" href="apps\//g)].length, 4);
  assert.match(page.body, /Trust and limits/);
  assert.match(page.headers['content-security-policy'], /connect-src 'none'/);
  assert.equal(page.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  assert.equal(page.headers['x-content-type-options'], 'nosniff');
  assert.equal(page.headers['x-frame-options'], 'DENY');
  assert.equal(page.headers['referrer-policy'], 'no-referrer');
  for (const app of ['partnership-breakpoint', 'common-cart', 'smallest-agreement', 'weekend-gap']) {
    const response = await call(server, `/apps/${app}/standalone.html`);
    assert.equal(response.status, 200, app);
    assert.match(response.body, /<!doctype html>/i);
  }
  for (const path of ['/.git/config', '/package.json', '/apps/common-cart/src/app.js', '/apps/common-cart/../../.git/config', '/%2e%2e/.git/config', '/apps/missing/standalone.html']) {
    assert.equal((await call(server, path)).status, 404, path);
  }
});

test('launcher allowlist, methods, hosts, queries, and HEAD semantics stay closed', async (t) => {
  const server = await runningServer(t);
  assert.deepEqual(PUBLIC_PATHS, [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.equal(publicFile('/'), 'index.html');
  assert.equal(publicFile('/index.html'), 'index.html');
  assert.equal(publicFile('/apps/weekend-gap/standalone.html'), 'apps/weekend-gap/standalone.html');
  for (const path of ['/404.html', '/README.md', '/scripts/serve.mjs', '/apps/weekend-gap/MODEL.md', '/apps/weekend-gap/standalone.html/', '//index.html', '/./index.html']) {
    assert.equal(publicFile(path), null, path);
    assert.equal((await call(server, path)).status, 404, path);
    const head = await call(server, path, 'HEAD');
    assert.equal(head.status, 404, `HEAD ${path}`);
    assert.equal(head.body, '');
  }
  assert.equal((await call(server, '/index.html?from=catalog')).status, 200);
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const blocked = await call(server, '/', method);
    assert.equal(blocked.status, 405, method);
    assert.equal(blocked.headers.allow, 'GET, HEAD');
  }
  assert.equal((await call(server, '/', 'GET', 'hostile.invalid')).status, 403);
  assert.equal((await call(server, '/', 'GET', '0.0.0.0')).status, 403);
  assert.equal((await call(server, '/', 'GET', '[::1]')).status, 403);
  assert.equal((await call(server, '/', 'GET', `localhost:${server.address().port}`)).status, 200);
  const head = await call(server, '/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});

test('404 is concise, current, and links only to the catalog and four workbenches', async (t) => {
  const server = await runningServer(t);
  const page = notFoundPage();
  assert.equal(page.split(/\r?\n/).length < 120, true);
  assert.match(page, /That page is not in the catalog/);
  assert.match(page, /href="\/"/);
  assert.equal(page.includes(catalogVersionLine()), true);
  assert.equal([...page.matchAll(/href="\/apps\/[^\"]+\/standalone\.html"/g)].length, 4);
  assert.doesNotMatch(page, /<script\b|fetch\s*\(|XMLHttpRequest|copy-|Keyboard shortcuts|What's new/i);
  const response = await call(server, '/missing');
  assert.equal(response.status, 404);
  assert.equal(response.body, page);
  assert.equal(response.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
});

test('launcher port validation rejects ambiguous, empty, and out-of-range values', () => {
  assert.equal(parsePort(), 4170);
  assert.equal(parsePort('65535'), 65535);
  for (const raw of ['', '0', '65536', '-1', '1.5', 'abc', ' 4170']) {
    assert.throws(() => parsePort(raw), /PORT/);
  }
});
