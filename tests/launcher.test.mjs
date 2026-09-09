import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createLauncher, parsePort } from '../scripts/serve.mjs';

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

test('launcher port rejects ambiguous, empty and out-of-range values', () => {
  assert.equal(parsePort(), 4170);
  assert.equal(parsePort('65535'), 65535);
  for (const raw of ['', '0', '65536', '-1', '1.5', '0x1000', ' 4170', 'NaN']) {
    assert.throws(() => parsePort(raw), /PORT/);
  }
});
