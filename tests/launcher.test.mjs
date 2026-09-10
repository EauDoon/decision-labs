import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createLauncher, parsePort, PUBLIC_PATHS, publicFile, CONTENT_SECURITY_POLICY, notFoundPage, catalogVersionLine, catalogJobs } from '../scripts/serve.mjs';

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
  assert.match(missing.body, /id="copy-trust"/);
  assert.match(missing.body, />Copy Trust and limits</);
  assert.match(missing.body, /id="trust"/);
  assert.match(missing.body, /Not a live policy feed/);
  assert.match(missing.body, /id="copy-how"/);
  assert.match(missing.body, />Copy How it works</);
  assert.match(missing.body, /id="how-it-works"/);
  assert.match(missing.body, /id="copy-jobs"/);
  assert.match(missing.body, />Copy jobs</);
  assert.match(missing.body, /id="catalog-jobs"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-lede"/);
  assert.match(missing.body, />Copy catalog intro</);
  assert.match(missing.body, /class="lede"/);
  assert.match(missing.body, /ledeMarkdown/);
  assert.match(missing.body, /id="copy-version-line"/);
  assert.match(missing.body, />Copy version line</);
  assert.match(missing.body, /versionLineMarkdown/);
  assert.doesNotMatch(missing.body, /\bfetch\s*\(/);
  assert.doesNotMatch(missing.body, /XMLHttpRequest/);
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

test('404 copy versions markdown comes from the printed catalog line', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const versionLine = { textContent: `Current catalog: ${catalogVersionLine()}.` };
  const document = {
    getElementById(id) {
      if (id === 'copy-versions') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-versions-status') return { textContent: '' };
      if (id === 'copy-versions-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  const expected = catalogVersionLine().split(', ').map((part) => `- ${part}`).join('\n');
  assert.equal(copied, expected);
  assert.doesNotMatch(copied, /Current catalog/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy How it works markdown comes from the printed heading and list', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const heading = { textContent: 'How it works' };
  const items = [
    { textContent: 'Local catalog. The launcher serves only the catalog page and the four workbenches.' },
    { textContent: 'Standalone files. Every workbench ships interface, styles, and model in one document.' },
  ];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-versions') return { addEventListener() {} };
      if (id === 'copy-versions-status') return { textContent: '' };
      if (id === 'copy-versions-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-trust') return { addEventListener() {} };
      if (id === 'copy-trust-status') return { textContent: '' };
      if (id === 'copy-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-how') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-how-status') return { textContent: '' };
      if (id === 'copy-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'how-it-works') return section;
      return null;
    },
    querySelector() { return null; },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '## How it works\n- Local catalog. The launcher serves only the catalog page and the four workbenches.\n- Standalone files. Every workbench ships interface, styles, and model in one document.');
  assert.doesNotMatch(copied, /live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy Trust markdown comes from the printed heading and list', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const heading = { textContent: 'Trust and limits' };
  const items = [
    { textContent: 'Local-first. Pages run in your browser.' },
    { textContent: 'No account. There is no sign-in.' },
  ];
  const section = {
    querySelector(selector) {
      return selector === 'h2' ? heading : null;
    },
    querySelectorAll(selector) {
      return selector === 'ul li' ? items : [];
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-versions') return { addEventListener() {} };
      if (id === 'copy-versions-status') return { textContent: '' };
      if (id === 'copy-versions-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-trust') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-trust-status') return { textContent: '' };
      if (id === 'copy-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'trust') return section;
      return null;
    },
    querySelector() { return null; },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '## Trust and limits\n- Local-first. Pages run in your browser.\n- No account. There is no sign-in.');
  assert.doesNotMatch(copied, /live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy-how script parses as classic browser JavaScript', () => {
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
  assert.match(source, /howMarkdown/);
  assert.match(source, /Not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
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
  assert.match(source, /trustMarkdown/);
  assert.match(source, /Not a live policy feed/);
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

test('404 copy How it works uses the printed heading and list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="copy-how-fallback"/);
  assert.match(page, /textarea id="copy-how-fallback"/);
  assert.match(page, /howMarkdown/);
  assert.match(page, /id="how-it-works"/);
  assert.match(page, /id="how-title">How it works/);
  assert.match(page, /Local catalog/);
  assert.match(page, /not a fifth product/);
  assert.match(page, /Not a live policy feed/);
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

test('404 copy Trust uses the printed heading and list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-trust"/);
  assert.match(page, />Copy Trust and limits</);
  assert.match(page, /id="copy-trust-fallback"/);
  assert.match(page, /textarea id="copy-trust-fallback"/);
  assert.match(page, /trustMarkdown/);
  assert.match(page, /id="trust"/);
  assert.match(page, /id="trust-title">Trust and limits/);
  assert.match(page, /Local-first/);
  assert.match(page, /Not a decision maker/);
  assert.match(page, /Not a live policy feed/);
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

test('404 copy jobs markdown comes from the printed catalog jobs list', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const items = catalogJobs().map(({ name, job }) => ({ textContent: `${name}: ${job}` }));
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-jobs-status') return { textContent: '' };
      if (id === 'copy-jobs-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector() { return null; },
    querySelectorAll(selector) {
      return selector === '#catalog-jobs li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  const expected = catalogJobs().map(({ name, job }) => `- ${name}: ${job}`).join('\n');
  assert.equal(copied, expected);
  assert.doesNotMatch(copied, /live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy jobs uses the printed names and jobs without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-jobs"/);
  assert.match(page, />Copy jobs</);
  assert.match(page, /id="copy-jobs-fallback"/);
  assert.match(page, /textarea id="copy-jobs-fallback"/);
  assert.match(page, /jobsMarkdown/);
  assert.match(page, /id="catalog-jobs"/);
  assert.match(page, /Not a live product feed/);
  for (const { name, job } of catalogJobs()) {
    assert.equal(page.includes(`${name}: ${job}`), true, `${name} job missing from 404 page`);
  }
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

test('404 copy-jobs script parses as classic browser JavaScript', () => {
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
  assert.match(source, /jobsMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy jobs shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const items = [{ textContent: 'Partnership Breakpoint: Find which participant in a revenue split.' }];
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-jobs-status') return status;
      if (id === 'copy-jobs-fallback') return fallback;
      return null;
    },
    querySelector() { return null; },
    querySelectorAll(selector) {
      return selector === '#catalog-jobs li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Partnership Breakpoint: Find which participant in a revenue split.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy jobs stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-jobs-path',
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
  assert.match(missing.body, /id="copy-jobs"/);
  assert.match(missing.body, />Copy jobs</);
  assert.match(missing.body, /Partnership Breakpoint:/);
  assert.match(missing.body, /Not a live product feed/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
});

test('404 copy catalog intro markdown comes from the printed heading and lede', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const heading = { textContent: 'This path is not in the catalog' };
  const lede = { textContent: 'The local launcher serves only the Decision Labs catalog page and the four workbenches.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-lede-status') return { textContent: '' };
      if (id === 'copy-lede-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === 'h1') return heading;
      if (selector === 'p.lede') return lede;
      return null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '# This path is not in the catalog\n\nThe local launcher serves only the Decision Labs catalog page and the four workbenches.');
  assert.doesNotMatch(copied, /live product feed/);
  heading.textContent = '';
  lede.textContent = '';
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy catalog intro uses the printed heading and lede without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-lede"/);
  assert.match(page, />Copy catalog intro</);
  assert.match(page, /id="copy-lede-fallback"/);
  assert.match(page, /textarea id="copy-lede-fallback"/);
  assert.match(page, /ledeMarkdown/);
  assert.match(page, /class="lede"/);
  assert.match(page, /querySelector\('h1'\)/);
  assert.match(page, /querySelector\('p\.lede'\)/);
  assert.match(page, /Not a live product feed/);
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

test('404 copy-lede script parses as classic browser JavaScript', () => {
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
  assert.match(source, /ledeMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy catalog intro shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-lede') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-lede-status') return status;
      if (id === 'copy-lede-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      if (selector === 'h1') return { textContent: 'This path is not in the catalog' };
      if (selector === 'p.lede') return { textContent: 'The local launcher serves only the Decision Labs catalog page.' };
      return null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '# This path is not in the catalog\n\nThe local launcher serves only the Decision Labs catalog page.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy catalog intro stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-lede-path',
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
  assert.match(missing.body, /id="copy-lede"/);
  assert.match(missing.body, />Copy catalog intro</);
  assert.match(missing.body, /class="lede"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  assert.equal((await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-lede-path',
      method: 'HEAD',
      headers: { host: `127.0.0.1:${port}` },
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  })).status, 404);
});

test('404 copy version line markdown is the printed catalogVersionLine', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const versionLine = { textContent: `Current catalog: ${catalogVersionLine()}.` };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-version-line-status') return { textContent: '' };
      if (id === 'copy-version-line-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, catalogVersionLine());
  assert.doesNotMatch(copied, /Current catalog/);
  assert.doesNotMatch(copied, /^- /);
  assert.doesNotMatch(copied, /\n/);
  assert.match(copied, /Partnership Breakpoint/);
  versionLine.textContent = '   ';
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy version line is distinct from Copy versions list', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickVersions = null;
  let clickLine = null;
  const versionLine = { textContent: `Current catalog: ${catalogVersionLine()}.` };
  const document = {
    getElementById(id) {
      if (id === 'copy-versions') return { addEventListener(name, handler) { if (name === 'click') clickVersions = handler; } };
      if (id === 'copy-versions-status') return { textContent: '' };
      if (id === 'copy-versions-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-version-line') return { addEventListener(name, handler) { if (name === 'click') clickLine = handler; } };
      if (id === 'copy-version-line-status') return { textContent: '' };
      if (id === 'copy-version-line-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? versionLine : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickVersions();
  const list = lastCopied;
  await clickLine();
  const line = lastCopied;
  assert.match(list, /^- /);
  assert.match(list, /\n/);
  assert.equal(line, catalogVersionLine());
  assert.notEqual(line, list);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy version line uses the printed listing without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-version-line"/);
  assert.match(page, />Copy version line</);
  assert.match(page, /id="copy-version-line-fallback"/);
  assert.match(page, /textarea id="copy-version-line-fallback"/);
  assert.match(page, /versionLineMarkdown/);
  assert.match(page, /querySelector\('\.version-line'\)/);
  assert.match(page, /Current catalog:/);
  assert.equal(page.includes(catalogVersionLine()), true);
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

test('404 copy-version-line script parses as classic browser JavaScript', () => {
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
  assert.match(source, /versionLineMarkdown/);
  assert.match(source, /Not a live product version/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy version line shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-version-line') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-version-line-status') return status;
      if (id === 'copy-version-line-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '.version-line' ? { textContent: `Current catalog: ${catalogVersionLine()}.` } : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, catalogVersionLine());
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product version/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy version line stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-version-line-path',
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
  assert.match(missing.body, /id="copy-version-line"/);
  assert.match(missing.body, />Copy version line</);
  assert.match(missing.body, /Current catalog:/);
  assert.equal(missing.body.includes(catalogVersionLine()), true);
  assert.match(missing.body, /Not a live product version/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-version-line-path',
      method: 'HEAD',
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
  assert.equal(head.status, 404);
  assert.equal(head.body, '');
});
