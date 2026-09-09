import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createLauncher, parsePort, PUBLIC_PATHS, publicFile } from '../scripts/serve.mjs';

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
  assert.match(page.headers['content-security-policy'], /connect-src 'none'/);
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

test('launcher port rejects ambiguous, empty and out-of-range values', () => {
  assert.equal(parsePort(), 4170);
  assert.equal(parsePort('65535'), 65535);
  for (const raw of ['', '0', '65536', '-1', '1.5', '0x1000', ' 4170', 'NaN']) {
    assert.throws(() => parsePort(raw), /PORT/);
  }
});
