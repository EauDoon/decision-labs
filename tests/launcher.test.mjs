import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createLauncher, parsePort, PUBLIC_PATHS, publicFile, CONTENT_SECURITY_POLICY, notFoundPage, catalogVersionLine } from '../scripts/serve.mjs';

test('launcher serves only workbenches and refuses hostile hosts and methods', async (t) => {
  const server = createLauncher();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const get = (path, method = 'GET', host = `127.0.0.1:${port}`) => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers: { host } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
  const page = await get('/');
  assert.equal(page.status, 200);
  assert.match(page.body, /Decision Labs/);
  assert.match(page.body, /What's new/);
  assert.match(page.body, /Share-to-hold/);
  assert.match(page.body, /CSV roster, capacity, and notes/);
  assert.match(page.body, /Queue-clear hours and Gantt compare/);
  const partnershipVersion = JSON.parse(readFileSync(new URL('../apps/partnership-breakpoint/package.json', import.meta.url), 'utf8')).version;
  assert.ok(page.body.includes('data-app="partnership-breakpoint">' + partnershipVersion + '<'));
  assert.match(page.body, /Trust and limits/);
  assert.match(page.body, /The workbenches/);
  assert.match(page.body, /Open workbench/);
  assert.doesNotMatch(page.body, /Index of/);
  assert.match(page.headers['content-security-policy'], /connect-src 'none'/);
  assert.match(page.headers['content-security-policy'], /script-src 'unsafe-inline'/);
  assert.equal(page.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  for (const app of ['partnership-breakpoint', 'common-cart', 'smallest-agreement', 'weekend-gap']) {
    assert.equal((await get(`/apps/${app}/standalone.html`)).status, 200);
  }
  for (const path of ['/.git/config', '/package.json', '/apps/common-cart/src/app.js', '/apps/common-cart/../../.git/config', '/%2e%2e/.git/config', '/apps/missing/standalone.html']) {
    assert.equal((await get(path)).status, 404, path);
  }
  assert.equal((await get('/', 'POST')).status, 405);
  assert.equal((await get('/', 'GET', 'hostile.invalid')).status, 403);
  const head = await get('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});

test('launcher public path set is exact, documented, and closed', async (t) => {
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
  assert.equal(publicFile('/apps/weekend-gap/MODEL.md'), null);
  assert.equal(publicFile('/apps/weekend-gap/standalone.html/'), null);
  assert.equal(publicFile('/README.md'), null);

  const server = createLauncher();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const call = (path, method = 'GET', host = `127.0.0.1:${port}`) => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers: { host } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });

  for (const path of PUBLIC_PATHS) {
    const get = await call(path);
    assert.equal(get.status, 200, `GET ${path}`);
    assert.match(get.body, /<!doctype html>/i);
    const head = await call(path, 'HEAD');
    assert.equal(head.status, 200, `HEAD ${path}`);
    assert.equal(head.body, '');
  }

  const indexWithQuery = await call('/index.html?from=catalog');
  assert.equal(indexWithQuery.status, 200);

  const denied = [
    '/about.html',
    '/MODEL.md',
    '/README.md',
    '/package.json',
    '/scripts/serve.mjs',
    '/tests/launcher.test.mjs',
    '/apps/partnership-breakpoint/index.html',
    '/apps/partnership-breakpoint/MODEL.md',
    '/apps/common-cart/src/model.js',
    '/apps/smallest-agreement/standalone.html.bak',
    '/apps/weekend-gap/standalone.htm',
    '/apps/weekend-gap/standalone.html/',
    '/apps/weekend-gap/standalone.html%00',
    '/index.htm',
    '//index.html',
    '/./index.html',
  ];
  for (const path of denied) {
    assert.equal((await call(path)).status, 404, path);
    const head = await call(path, 'HEAD');
    assert.equal(head.status, 404, `HEAD ${path}`);
    assert.equal(head.body, '');
  }

  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const blocked = await call('/', method);
    assert.equal(blocked.status, 405, method);
    assert.equal(blocked.headers.allow, 'GET, HEAD');
  }

  assert.equal((await call('/', 'GET', 'hostile.invalid')).status, 403);
  assert.equal((await call('/', 'GET', '0.0.0.0')).status, 403);
  assert.equal((await call('/', 'GET', '[::1]')).status, 403);
  assert.equal((await call('/', 'GET', `localhost:${port}`)).status, 200);
});

test('launcher 404 body names the catalog and still returns 404', async (t) => {
  const server = createLauncher();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const get = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers: { host: `127.0.0.1:${port}` } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });

  assert.match(notFoundPage(), /Decision Labs/);
  assert.match(notFoundPage(), /Partnership Breakpoint/);
  assert.match(notFoundPage(), /Common Cart/);
  assert.match(notFoundPage(), /The Smallest Agreement/);
  assert.match(notFoundPage(), /Weekend Gap/);
  assert.match(notFoundPage(), /href="\/"/);
  assert.match(notFoundPage(), /Current catalog:/);
  assert.equal(notFoundPage().includes(catalogVersionLine()), true);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);

  const missing = await get('/README.md');
  assert.equal(missing.status, 404);
  assert.match(missing.body, /Decision Labs/);
  assert.match(missing.body, /not in the catalog/);
  assert.match(missing.body, /<!doctype html>/i);
  assert.match(missing.body, /Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap/);
  assert.match(missing.body, /href="\/"/);
  assert.match(missing.body, /Current catalog:/);
  assert.equal(missing.body.includes(catalogVersionLine()), true);
  assert.match(missing.body, /id="copy-versions"/);
  assert.match(missing.body, />Copy versions</);
  assert.match(missing.body, /querySelector\('\.version-line'\)/);
  assert.doesNotMatch(missing.body, /\bfetch\s*\(/);
  assert.doesNotMatch(missing.body, /Four local workbenches you can open today/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);

  const source = await get('/scripts/serve.mjs');
  assert.equal(source.status, 404);
  assert.match(source.body, /Decision Labs/);
  assert.doesNotMatch(source.body, /export const PUBLIC_PATHS/);
  assert.doesNotMatch(source.body, /createLauncher/);

  const model = await get('/apps/weekend-gap/src/model.js');
  assert.equal(model.status, 404);
  assert.match(model.body, /Decision Labs/);
  assert.doesNotMatch(model.body, /export function/);

  const head = await get('/README.md', 'HEAD');
  assert.equal(head.status, 404);
  assert.equal(head.body, '');
});

test('launcher port rejects ambiguous, empty and out-of-range values', () => {
  assert.equal(parsePort(), 4170);
  assert.equal(parsePort('65535'), 65535);
  for (const raw of ['', '0', '65536', '-1', '1.5', '0x1000', ' 4170', 'NaN']) {
    assert.throws(() => parsePort(raw), /PORT/);
  }
});

test('404 copy-versions script parses as classic browser JavaScript', () => {
  const page = notFoundPage();
  const scripts = [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const [, attributes, source] = scripts[0];
  assert.equal(attributes.trim(), '');
  const result = spawnSync(process.execPath, ['--check'], {
    input: source,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest/);
});

test('404 copy versions uses the printed catalog line without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-versions"/);
  assert.match(page, />Copy versions</);
  assert.match(page, /id="copy-versions-fallback"/);
  assert.match(page, /textarea id="copy-versions-fallback"/);
  assert.match(page, /versionsMarkdown/);
  assert.match(page, /querySelector\('\.version-line'\)/);
  assert.match(page, /Current catalog:/);
  assert.match(page, /Not a live product version/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.doesNotMatch(page, /XMLHttpRequest/);
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.deepEqual([...PUBLIC_PATHS], [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.equal(publicFile('/package.json'), null);
});

test('404 version listing does not expand PUBLIC_PATHS or change CSP', () => {
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.deepEqual([...PUBLIC_PATHS], [
    '/',
    '/index.html',
    '/apps/partnership-breakpoint/standalone.html',
    '/apps/common-cart/standalone.html',
    '/apps/smallest-agreement/standalone.html',
    '/apps/weekend-gap/standalone.html',
  ]);
  assert.equal(
    CONTENT_SECURITY_POLICY,
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  );
  assert.equal(publicFile('/package.json'), null);
  assert.equal(publicFile('/apps/weekend-gap/MODEL.md'), null);
  assert.equal(notFoundPage().includes(catalogVersionLine()), true);
});

test('404 page still names the Decision Labs catalog', async (t) => {
  assert.match(notFoundPage(), /This path is not in the catalog/);
  assert.match(notFoundPage(), /Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap/);
  assert.match(notFoundPage(), /href="\/"/);
  assert.match(notFoundPage(), /Current catalog:/);
  assert.equal(PUBLIC_PATHS.length, 6);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);

  const server = createLauncher();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const missing = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-such-catalog-path',
      method: 'GET',
      headers: { host: `127.0.0.1:${port}` },
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(missing.status, 404);
  assert.match(missing.body, /Decision Labs catalog/);
  assert.match(missing.body, /not in the catalog/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
});
