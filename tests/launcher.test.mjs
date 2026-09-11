import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createLauncher, parsePort, PUBLIC_PATHS, publicFile, CONTENT_SECURITY_POLICY, notFoundPage, catalogVersionLine, catalogJobs, catalogLastWhatsNewHeading, catalogFirstWhatsNewHeading, catalogFirstWorkbenchHeading, catalogLastWorkbenchHeading, catalogLastReviewPath, catalogFirstReviewPath, catalogFirstOpenHref } from '../scripts/serve.mjs';

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
  assert.match(missing.body, /id="copy-first-trust"/);
  assert.match(missing.body, />Copy first Trust item</);
  assert.match(missing.body, /firstTrustMarkdown/);
  assert.match(missing.body, /id="copy-first-how"/);
  assert.match(missing.body, />Copy first How it works item</);
  assert.match(missing.body, /firstHowMarkdown/);
  assert.match(missing.body, /id="copy-last-how"/);
  assert.match(missing.body, />Copy last How it works item</);
  assert.match(missing.body, /lastHowMarkdown/);
  assert.match(missing.body, /id="copy-last-review"/);
  assert.match(missing.body, />Copy last review path</);
  assert.match(missing.body, /lastReviewMarkdown/);
  assert.match(missing.body, /id="copy-first-review"/);
  assert.match(missing.body, />Copy first review path</);
  assert.match(missing.body, /firstReviewMarkdown/);
  assert.match(missing.body, /id="copy-first-open"/);
  assert.match(missing.body, />Copy first Open href</);
  assert.match(missing.body, /firstOpenMarkdown/);
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

test('404 copy first Trust item markdown is the first printed Trust list item', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const item = { textContent: 'Local-first. Pages run in your browser. The optional launcher binds loopback only.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-trust-status') return { textContent: '' };
      if (id === 'copy-first-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? item : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Local-first. Pages run in your browser. The optional launcher binds loopback only.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## Trust and limits/);
  assert.doesNotMatch(copied, /live policy feed/);
  item.textContent = '   ';
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Trust item is distinct from Copy Trust', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickTrust = null;
  let clickFirst = null;
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
      if (id === 'copy-trust') return { addEventListener(name, handler) { if (name === 'click') clickTrust = handler; } };
      if (id === 'copy-trust-status') return { textContent: '' };
      if (id === 'copy-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-trust') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-trust-status') return { textContent: '' };
      if (id === 'copy-first-trust-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'trust') return section;
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? items[0] : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickTrust();
  const list = lastCopied;
  await clickFirst();
  const line = lastCopied;
  assert.match(list, /## Trust and limits/);
  assert.match(list, /\n/);
  assert.equal(line, '- Local-first. Pages run in your browser.');
  assert.notEqual(line, list);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Trust item uses the printed list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-first-trust"/);
  assert.match(page, />Copy first Trust item</);
  assert.match(page, /id="copy-first-trust-fallback"/);
  assert.match(page, /textarea id="copy-first-trust-fallback"/);
  assert.match(page, /firstTrustMarkdown/);
  assert.match(page, /querySelector\('#trust li'\)/);
  assert.match(page, /id="trust"/);
  assert.match(page, /Local-first/);
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

test('404 copy-first-trust script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstTrustMarkdown/);
  assert.match(source, /Not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Trust item shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-trust') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-trust-status') return status;
      if (id === 'copy-first-trust-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#trust li' ? { textContent: 'Local-first. Pages run in your browser.' } : null;
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
  assert.equal(fallback.value, '- Local-first. Pages run in your browser.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Trust item stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-trust-path',
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
  assert.match(missing.body, /id="copy-first-trust"/);
  assert.match(missing.body, />Copy first Trust item</);
  assert.match(missing.body, /id="trust"/);
  assert.match(missing.body, /Local-first/);
  assert.match(missing.body, /Not a live policy feed/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-trust-path',
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

test('404 copy first How it works item markdown is the first printed How list item', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  const item = { textContent: 'Local catalog. The launcher serves only the catalog page and the four workbenches.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-how-status') return { textContent: '' };
      if (id === 'copy-first-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? item : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Local catalog. The launcher serves only the catalog page and the four workbenches.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## How it works/);
  assert.doesNotMatch(copied, /live policy feed/);
  item.textContent = '   ';
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first How it works item is distinct from Copy How it works', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickHow = null;
  let clickFirst = null;
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
      if (id === 'copy-how') return { addEventListener(name, handler) { if (name === 'click') clickHow = handler; } };
      if (id === 'copy-how-status') return { textContent: '' };
      if (id === 'copy-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-how-status') return { textContent: '' };
      if (id === 'copy-first-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'how-it-works') return section;
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? items[0] : null;
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickHow();
  const list = lastCopied;
  await clickFirst();
  const line = lastCopied;
  assert.match(list, /## How it works/);
  assert.match(list, /\n/);
  assert.equal(line, '- Local catalog. The launcher serves only the catalog page and the four workbenches.');
  assert.notEqual(line, list);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first How it works item uses the printed list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-first-how"/);
  assert.match(page, />Copy first How it works item</);
  assert.match(page, /id="copy-first-how-fallback"/);
  assert.match(page, /textarea id="copy-first-how-fallback"/);
  assert.match(page, /firstHowMarkdown/);
  assert.match(page, /querySelector\('#how-it-works li'\)/);
  assert.match(page, /id="how-it-works"/);
  assert.match(page, /Local catalog/);
  assert.match(page, /Not a live policy feed/);
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="copy-first-trust"/);
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

test('404 copy-first-how script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstHowMarkdown/);
  assert.match(source, /Not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first How it works item shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-how-status') return status;
      if (id === 'copy-first-how-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? { textContent: 'Local catalog. The launcher serves only the catalog page.' } : null;
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
  assert.equal(fallback.value, '- Local catalog. The launcher serves only the catalog page.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first How it works item stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-how-path',
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
  assert.match(missing.body, /id="copy-first-how"/);
  assert.match(missing.body, />Copy first How it works item</);
  assert.match(missing.body, /id="how-it-works"/);
  assert.match(missing.body, /Local catalog/);
  assert.match(missing.body, /Not a live policy feed/);
  assert.match(missing.body, /id="copy-how"/);
  assert.doesNotMatch(missing.body, /Copy last Trust item/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-how-path',
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

test('404 copy last How it works item markdown is the last printed How list item', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let items = [
    { textContent: 'Local catalog. The launcher serves only the catalog page and the four workbenches.' },
    { textContent: 'Standalone files. Every workbench ships interface, styles, and model in one document.' },
    { textContent: 'Independent workbenches. The four tools do not share drafts, storage keys, or versions.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-how-status') return { textContent: '' };
      if (id === 'copy-last-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#how-it-works li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Independent workbenches. The four tools do not share drafts, storage keys, or versions.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /## How it works/);
  assert.doesNotMatch(copied, /Local catalog/);
  assert.doesNotMatch(copied, /live policy feed/);
  items = [];
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last How it works item is distinct from Copy How it works and Copy first How it works item', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickHow = null;
  let clickFirst = null;
  let clickLast = null;
  const heading = { textContent: 'How it works' };
  const items = [
    { textContent: 'Local catalog. The launcher serves only the catalog page and the four workbenches.' },
    { textContent: 'Standalone files. Every workbench ships interface, styles, and model in one document.' },
    { textContent: 'Independent workbenches. The four tools do not share drafts, storage keys, or versions.' },
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
      if (id === 'copy-how') return { addEventListener(name, handler) { if (name === 'click') clickHow = handler; } };
      if (id === 'copy-how-status') return { textContent: '' };
      if (id === 'copy-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-how') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-how-status') return { textContent: '' };
      if (id === 'copy-first-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-how') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-how-status') return { textContent: '' };
      if (id === 'copy-last-how-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'how-it-works') return section;
      return null;
    },
    querySelector(selector) {
      return selector === '#how-it-works li' ? items[0] : null;
    },
    querySelectorAll(selector) {
      return selector === '#how-it-works li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickHow();
  const list = lastCopied;
  await clickFirst();
  const first = lastCopied;
  await clickLast();
  const last = lastCopied;
  assert.match(list, /## How it works/);
  assert.match(list, /\n/);
  assert.equal(first, '- Local catalog. The launcher serves only the catalog page and the four workbenches.');
  assert.equal(last, '- Independent workbenches. The four tools do not share drafts, storage keys, or versions.');
  assert.notEqual(last, first);
  assert.notEqual(last, list);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last How it works item uses the printed list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-last-how"/);
  assert.match(page, />Copy last How it works item</);
  assert.match(page, /id="copy-last-how-fallback"/);
  assert.match(page, /textarea id="copy-last-how-fallback"/);
  assert.match(page, /lastHowMarkdown/);
  assert.match(page, /querySelectorAll\('#how-it-works li'\)/);
  assert.match(page, /id="how-it-works"/);
  assert.match(page, /Local catalog/);
  assert.match(page, /Not a live policy feed/);
  assert.match(page, /id="copy-how"/);
  assert.match(page, />Copy How it works</);
  assert.match(page, /id="copy-first-how"/);
  assert.match(page, />Copy first How it works item</);
  assert.doesNotMatch(page, /id="copy-last-trust"/);
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

test('404 copy-last-how script parses as classic browser JavaScript', () => {
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
  assert.match(source, /lastHowMarkdown/);
  assert.match(source, /Not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last How it works item shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-how') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-how-status') return status;
      if (id === 'copy-last-how-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#how-it-works li' ? [{ textContent: 'Independent workbenches. The four tools do not share drafts.' }] : [];
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
  assert.equal(fallback.value, '- Independent workbenches. The four tools do not share drafts.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live policy feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last How it works item stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-last-how-path',
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
  assert.match(missing.body, /id="copy-last-how"/);
  assert.match(missing.body, />Copy last How it works item</);
  assert.match(missing.body, /id="how-it-works"/);
  assert.match(missing.body, /Local catalog/);
  assert.match(missing.body, /Not a live policy feed/);
  assert.match(missing.body, /id="copy-how"/);
  assert.match(missing.body, /id="copy-first-how"/);
  assert.doesNotMatch(missing.body, /Copy last Trust item/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-last-how-path',
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

test('404 copy last job markdown is the last printed catalog job', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let items = [
    { textContent: 'Partnership Breakpoint: Find which participant in a revenue split.' },
    { textContent: 'Common Cart: Pool buyer constraints.' },
    { textContent: 'Weekend Gap: Follow synthetic AUD redemption demand.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-job-status') return { textContent: '' };
      if (id === 'copy-last-job-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#catalog-jobs li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Partnership Breakpoint/);
  assert.doesNotMatch(copied, /live product feed/);
  items = [];
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last job is distinct from Copy jobs', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickJobs = null;
  let clickLast = null;
  const items = [
    { textContent: 'Partnership Breakpoint: Find which participant in a revenue split.' },
    { textContent: 'Weekend Gap: Follow synthetic AUD redemption demand.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-jobs') return { addEventListener(name, handler) { if (name === 'click') clickJobs = handler; } };
      if (id === 'copy-jobs-status') return { textContent: '' };
      if (id === 'copy-jobs-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-job-status') return { textContent: '' };
      if (id === 'copy-last-job-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#catalog-jobs li' ? items : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickJobs();
  const list = lastCopied;
  await clickLast();
  const last = lastCopied;
  assert.match(list, /Partnership Breakpoint/);
  assert.match(list, /\n/);
  assert.equal(last, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.notEqual(last, list);
  assert.doesNotMatch(page, /id="copy-first-job"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last job uses the printed list without extra public paths', () => {
  const page = notFoundPage();
  assert.match(page, /id="copy-last-job"/);
  assert.match(page, />Copy last job</);
  assert.match(page, /id="copy-last-job-fallback"/);
  assert.match(page, /textarea id="copy-last-job-fallback"/);
  assert.match(page, /lastJobMarkdown/);
  assert.match(page, /querySelectorAll\('#catalog-jobs li'\)/);
  assert.match(page, /id="catalog-jobs"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-jobs"/);
  assert.match(page, />Copy jobs</);
  assert.doesNotMatch(page, /id="copy-first-job"/);
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

test('404 copy-last-job script parses as classic browser JavaScript', () => {
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
  assert.match(source, /lastJobMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last job shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-job-status') return status;
      if (id === 'copy-last-job-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#catalog-jobs li' ? [{ textContent: 'Weekend Gap: Follow synthetic AUD redemption demand.' }] : [];
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
  assert.equal(fallback.value, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last job stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-last-job-path',
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
  assert.match(missing.body, /id="copy-last-job"/);
  assert.match(missing.body, />Copy last job</);
  assert.match(missing.body, /id="catalog-jobs"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-jobs"/);
  assert.doesNotMatch(missing.body, /id="copy-first-job"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-last-job-path',
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

test('404 copy last What\'s new heading markdown is the last printed What\'s new heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let headings = [
    { textContent: 'Last-job copy, last-job jump, and first-job jump' },
    { textContent: 'Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-whats-new-status') return { textContent: '' };
      if (id === 'copy-last-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#whats-new h3' ? headings : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Last-job copy/);
  assert.doesNotMatch(copied, /live product feed/);
  headings = [];
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last What\'s new heading is distinct from Copy last job', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickJob = null;
  let clickNews = null;
  const jobs = [
    { textContent: 'Partnership Breakpoint: Find which participant in a revenue split.' },
    { textContent: 'Weekend Gap: Follow synthetic AUD redemption demand.' },
  ];
  const headings = [
    { textContent: 'Last-job copy, last-job jump, and first-job jump' },
    { textContent: 'Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-job') return { addEventListener(name, handler) { if (name === 'click') clickJob = handler; } };
      if (id === 'copy-last-job-status') return { textContent: '' };
      if (id === 'copy-last-job-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickNews = handler; } };
      if (id === 'copy-last-whats-new-status') return { textContent: '' };
      if (id === 'copy-last-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '#catalog-jobs li') return jobs;
      if (selector === '#whats-new h3') return headings;
      return [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickJob();
  const job = lastCopied;
  await clickNews();
  const news = lastCopied;
  assert.equal(job, '- Weekend Gap: Follow synthetic AUD redemption demand.');
  assert.equal(news, '- Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11');
  assert.notEqual(news, job);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last What\'s new heading uses the printed heading without extra public paths', () => {
  const page = notFoundPage();
  const lastHeading = catalogLastWhatsNewHeading();
  assert.match(lastHeading, /\S/);
  assert.equal(page.includes(lastHeading), true, '404 page should print the last What\'s new heading');
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
  assert.match(page, /id="copy-last-whats-new-fallback"/);
  assert.match(page, /textarea id="copy-last-whats-new-fallback"/);
  assert.match(page, /lastWhatsNewMarkdown/);
  assert.match(page, /querySelectorAll\('#whats-new h3'\)/);
  assert.match(page, /id="whats-new"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-last-job"/);
  assert.match(page, />Copy last job</);
  assert.match(page, /id="copy-first-whats-new"/);
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

test('404 copy-last-whats-new script parses as classic browser JavaScript', () => {
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
  assert.match(source, /lastWhatsNewMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last What\'s new heading shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-whats-new-status') return status;
      if (id === 'copy-last-whats-new-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#whats-new h3' ? [{ textContent: 'Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11' }] : [];
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
  assert.equal(fallback.value, '- Sunday late payout, payout-hour copy, and payout-closed hide in Weekend Gap 1.5.11');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last What\'s new heading stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-last-whats-new-path',
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
  assert.match(missing.body, /id="copy-last-whats-new"/);
  assert.match(missing.body, />Copy last What's new heading</);
  assert.match(missing.body, /id="whats-new"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-last-job"/);
  assert.match(missing.body, /id="copy-first-whats-new"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-last-whats-new-path',
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

test('404 copy first What\'s new heading markdown is the first printed What\'s new heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let firstHeading = { textContent: 'Last What\'s new copy, last-news jump, and first-news jump' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-whats-new-status') return { textContent: '' };
      if (id === 'copy-first-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? firstHeading : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Last What\'s new copy, last-news jump, and first-news jump');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Saturday early payout/);
  assert.doesNotMatch(copied, /live product feed/);
  firstHeading = null;
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first What\'s new heading is distinct from Copy last What\'s new heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickFirst = null;
  let clickLast = null;
  const headings = [
    { textContent: 'Last What\'s new copy, last-news jump, and first-news jump' },
    { textContent: 'Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-whats-new-status') return { textContent: '' };
      if (id === 'copy-first-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-whats-new-status') return { textContent: '' };
      if (id === 'copy-last-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? headings[0] : null;
    },
    querySelectorAll(selector) {
      return selector === '#whats-new h3' ? headings : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickFirst();
  const first = lastCopied;
  await clickLast();
  const last = lastCopied;
  assert.equal(first, '- Last What\'s new copy, last-news jump, and first-news jump');
  assert.equal(last, '- Sunday early issuer open, last-open-issuer copy, and weekend-issuer-open hide in Weekend Gap 1.5.17');
  assert.notEqual(first, last);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, /id="copy-last-whats-new"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first What\'s new heading uses the printed heading without extra public paths', () => {
  const page = notFoundPage();
  const firstHeading = catalogFirstWhatsNewHeading();
  const lastHeading = catalogLastWhatsNewHeading();
  assert.match(firstHeading, /\S/);
  assert.equal(page.includes(firstHeading), true, '404 page should print the first What\'s new heading');
  assert.equal(page.includes(lastHeading), true, '404 page should still print the last What\'s new heading');
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
  assert.match(page, /id="copy-first-whats-new-fallback"/);
  assert.match(page, /textarea id="copy-first-whats-new-fallback"/);
  assert.match(page, /firstWhatsNewMarkdown/);
  assert.match(page, /querySelector\('#whats-new h3'\)/);
  assert.match(page, /id="whats-new"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-last-whats-new"/);
  assert.match(page, />Copy last What's new heading</);
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

test('404 copy-first-whats-new script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstWhatsNewMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first What\'s new heading shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-whats-new-status') return status;
      if (id === 'copy-first-whats-new-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#whats-new h3' ? { textContent: 'Last What\'s new copy, last-news jump, and first-news jump' } : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Last What\'s new copy, last-news jump, and first-news jump');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first What\'s new heading stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-whats-new-path',
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
  assert.match(missing.body, /id="copy-first-whats-new"/);
  assert.match(missing.body, />Copy first What's new heading</);
  assert.match(missing.body, /id="whats-new"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-last-whats-new"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-whats-new-path',
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

test('404 copy first workbench heading markdown is the first printed workbench heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let firstHeading = { textContent: 'Partnership Breakpoint' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-workbench-status') return { textContent: '' };
      if (id === 'copy-first-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench h3' ? firstHeading : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Partnership Breakpoint');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Common Cart/);
  assert.doesNotMatch(copied, /live product feed/);
  firstHeading = null;
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first workbench heading is distinct from Copy first What\'s new heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickWorkbench = null;
  let clickNews = null;
  const workbenchHeading = { textContent: 'Partnership Breakpoint' };
  const newsHeading = { textContent: 'Last What\'s new copy, last-news jump, and first-news jump' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') clickWorkbench = handler; } };
      if (id === 'copy-first-workbench-status') return { textContent: '' };
      if (id === 'copy-first-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-whats-new') return { addEventListener(name, handler) { if (name === 'click') clickNews = handler; } };
      if (id === 'copy-first-whats-new-status') return { textContent: '' };
      if (id === 'copy-first-whats-new-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches article.workbench h3') return workbenchHeading;
      if (selector === '#whats-new h3') return newsHeading;
      return null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickWorkbench();
  const workbench = lastCopied;
  await clickNews();
  const news = lastCopied;
  assert.equal(workbench, '- Partnership Breakpoint');
  assert.equal(news, '- Last What\'s new copy, last-news jump, and first-news jump');
  assert.notEqual(workbench, news);
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first workbench heading uses the printed heading without extra public paths', () => {
  const page = notFoundPage();
  const heading = catalogFirstWorkbenchHeading();
  assert.equal(heading, 'Partnership Breakpoint');
  assert.equal(page.includes(heading), true, '404 page should print the first workbench heading');
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
  assert.match(page, /id="copy-first-workbench-fallback"/);
  assert.match(page, /textarea id="copy-first-workbench-fallback"/);
  assert.match(page, /firstWorkbenchMarkdown/);
  assert.match(page, /querySelector\('#workbenches article\.workbench h3'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-first-whats-new"/);
  assert.match(page, />Copy first What's new heading</);
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

test('404 copy-first-workbench script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstWorkbenchMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first workbench heading shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-workbench-status') return status;
      if (id === 'copy-first-workbench-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench h3' ? { textContent: 'Partnership Breakpoint' } : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Partnership Breakpoint');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first workbench heading stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-workbench-path',
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
  assert.match(missing.body, /id="copy-first-workbench"/);
  assert.match(missing.body, />Copy first workbench heading</);
  assert.match(missing.body, /id="workbenches"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-first-whats-new"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-workbench-path',
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

test('404 copy last workbench heading markdown is the last printed workbench heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let headings = [
    { textContent: 'Partnership Breakpoint' },
    { textContent: 'Weekend Gap' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-workbench-status') return { textContent: '' };
      if (id === 'copy-last-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench h3' ? headings : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Weekend Gap');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Partnership Breakpoint/);
  assert.doesNotMatch(copied, /live product feed/);
  headings = [];
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last workbench heading is distinct from Copy first workbench heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickLast = null;
  let clickFirst = null;
  const headings = [
    { textContent: 'Partnership Breakpoint' },
    { textContent: 'Weekend Gap' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-workbench-status') return { textContent: '' };
      if (id === 'copy-last-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-workbench') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-workbench-status') return { textContent: '' };
      if (id === 'copy-first-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench h3' ? headings[0] : null;
    },
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench h3' ? headings : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickLast();
  const last = lastCopied;
  await clickFirst();
  const first = lastCopied;
  assert.equal(last, '- Weekend Gap');
  assert.equal(first, '- Partnership Breakpoint');
  assert.notEqual(last, first);
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, /id="copy-first-workbench"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last workbench heading uses the printed heading without extra public paths', () => {
  const page = notFoundPage();
  const heading = catalogLastWorkbenchHeading();
  assert.equal(heading, 'Weekend Gap');
  assert.equal(page.includes(heading), true, '404 page should print the last workbench heading');
  assert.equal(page.includes(catalogFirstWorkbenchHeading()), true, '404 page should print the first workbench heading');
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, />Copy last workbench heading</);
  assert.match(page, /id="copy-last-workbench-fallback"/);
  assert.match(page, /textarea id="copy-last-workbench-fallback"/);
  assert.match(page, /lastWorkbenchMarkdown/);
  assert.match(page, /querySelectorAll\('#workbenches article\.workbench h3'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-first-workbench"/);
  assert.match(page, />Copy first workbench heading</);
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

test('404 copy-last-workbench script parses as classic browser JavaScript', () => {
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
  assert.match(source, /lastWorkbenchMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last workbench heading shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-workbench-status') return status;
      if (id === 'copy-last-workbench-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench h3' ? [{ textContent: 'Weekend Gap' }] : [];
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
  assert.equal(fallback.value, '- Weekend Gap');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last workbench heading stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-last-workbench-path',
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
  assert.match(missing.body, /id="copy-last-workbench"/);
  assert.match(missing.body, />Copy last workbench heading</);
  assert.match(missing.body, /Weekend Gap/);
  assert.match(missing.body, /id="workbenches"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-first-workbench"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-last-workbench-path',
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

test('404 copy last review path markdown is the last printed review path', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let paths = [
    { textContent: 'Review constraints and negotiation room. First card.' },
    { textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-review-status') return { textContent: '' };
      if (id === 'copy-last-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench .review-path' ? paths : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review constraints and negotiation room/);
  assert.doesNotMatch(copied, /live product feed/);
  paths = [];
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last review path is distinct from Copy last workbench heading', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickLast = null;
  let clickHeading = null;
  const paths = [
    { textContent: 'Review constraints and negotiation room. First card.' },
    { textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' },
  ];
  const headings = [
    { textContent: 'Partnership Breakpoint' },
    { textContent: 'Weekend Gap' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-review-status') return { textContent: '' };
      if (id === 'copy-last-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-workbench') return { addEventListener(name, handler) { if (name === 'click') clickHeading = handler; } };
      if (id === 'copy-last-workbench-status') return { textContent: '' };
      if (id === 'copy-last-workbench-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '#workbenches article.workbench .review-path') return paths;
      if (selector === '#workbenches article.workbench h3') return headings;
      return [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickLast();
  const last = lastCopied;
  await clickHeading();
  const heading = lastCopied;
  assert.equal(last, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.equal(heading, '- Weekend Gap');
  assert.notEqual(last, heading);
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, /id="copy-last-workbench"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last review path uses the printed path without extra public paths', () => {
  const page = notFoundPage();
  const path = catalogLastReviewPath();
  assert.match(path, /Review the timing behind the queue/);
  assert.equal(page.includes(path), true, '404 page should print the last review path');
  assert.equal(page.includes(catalogLastWorkbenchHeading()), true, '404 page should print the last workbench heading');
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, />Copy last review path</);
  assert.match(page, /id="copy-last-review-fallback"/);
  assert.match(page, /textarea id="copy-last-review-fallback"/);
  assert.match(page, /lastReviewMarkdown/);
  assert.match(page, /querySelectorAll\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-last-workbench"/);
  assert.match(page, />Copy last workbench heading</);
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

test('404 copy-last-review script parses as classic browser JavaScript', () => {
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
  assert.match(source, /lastReviewMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last review path shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-last-review-status') return status;
      if (id === 'copy-last-review-fallback') return fallback;
      return null;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench .review-path' ? [{ textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' }] : [];
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
  assert.equal(fallback.value, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy last review path stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-last-review-path',
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
  assert.match(missing.body, /id="copy-last-review"/);
  assert.match(missing.body, />Copy last review path</);
  assert.match(missing.body, /Review the timing behind the queue/);
  assert.match(missing.body, /id="workbenches"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-last-workbench"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-last-review-path',
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

test('404 copy first review path markdown is the first printed review path', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let firstPath = { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-review-status') return { textContent: '' };
      if (id === 'copy-first-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench .review-path' ? firstPath : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review the timing behind the queue/);
  assert.doesNotMatch(copied, /live product feed/);
  firstPath = null;
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first review path is distinct from Copy last review path', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickFirst = null;
  let clickLast = null;
  const firstPath = { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' };
  const paths = [
    firstPath,
    { textContent: 'Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.' },
  ];
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-review-status') return { textContent: '' };
      if (id === 'copy-first-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-last-review') return { addEventListener(name, handler) { if (name === 'click') clickLast = handler; } };
      if (id === 'copy-last-review-status') return { textContent: '' };
      if (id === 'copy-last-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench .review-path' ? firstPath : null;
    },
    querySelectorAll(selector) {
      return selector === '#workbenches article.workbench .review-path' ? paths : [];
    },
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickFirst();
  const first = lastCopied;
  await clickLast();
  const last = lastCopied;
  assert.equal(first, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.equal(last, '- Review the timing behind the queue. Inspect arrival cohorts, closed intervals and reserve or throughput scenarios.');
  assert.notEqual(first, last);
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, /id="copy-last-review"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first review path uses the printed path without extra public paths', () => {
  const page = notFoundPage();
  const path = catalogFirstReviewPath();
  assert.match(path, /Review constraints and negotiation room/);
  assert.equal(page.includes(path), true, '404 page should print the first review path');
  assert.equal(page.includes(catalogFirstWorkbenchHeading()), true, '404 page should print the first workbench heading');
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, />Copy first review path</);
  assert.match(page, /id="copy-first-review-fallback"/);
  assert.match(page, /textarea id="copy-first-review-fallback"/);
  assert.match(page, /firstReviewMarkdown/);
  assert.match(page, /querySelector\('#workbenches article\.workbench \.review-path'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-last-review"/);
  assert.match(page, />Copy last review path</);
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

test('404 copy-first-review script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstReviewMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first review path shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-review-status') return status;
      if (id === 'copy-first-review-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches article.workbench .review-path' ? { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' } : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first review path stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-review-path',
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
  assert.match(missing.body, /id="copy-first-review"/);
  assert.match(missing.body, />Copy first review path</);
  assert.match(missing.body, /Review constraints and negotiation room/);
  assert.match(missing.body, /id="workbenches"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-last-review"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-review-path',
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

test('404 copy first Open href markdown is the first printed Open workbench href', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let copied = '';
  let click = null;
  let firstOpen = {
    getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; },
  };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-open-status') return { textContent: '' };
      if (id === 'copy-first-open-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open' ? firstOpen : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { copied = text; } } },
  });
  await click();
  assert.equal(copied, '- apps/partnership-breakpoint/standalone.html');
  assert.doesNotMatch(copied, /\n/);
  assert.doesNotMatch(copied, /Review constraints and negotiation room/);
  assert.doesNotMatch(copied, /live product feed/);
  firstOpen = null;
  copied = 'stale';
  await click();
  assert.equal(copied, '');
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Open href is distinct from Copy first review path', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let lastCopied = '';
  let clickFirst = null;
  let clickReview = null;
  const firstOpen = {
    getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; },
  };
  const firstPath = { textContent: 'Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { addEventListener(name, handler) { if (name === 'click') clickFirst = handler; } };
      if (id === 'copy-first-open-status') return { textContent: '' };
      if (id === 'copy-first-open-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      if (id === 'copy-first-review') return { addEventListener(name, handler) { if (name === 'click') clickReview = handler; } };
      if (id === 'copy-first-review-status') return { textContent: '' };
      if (id === 'copy-first-review-fallback') return { hidden: true, value: '', focus() {}, select() {} };
      return null;
    },
    querySelector(selector) {
      if (selector === '#workbenches a.open') return firstOpen;
      if (selector === '#workbenches article.workbench .review-path') return firstPath;
      return null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: { clipboard: { writeText: async (text) => { lastCopied = text; } } },
  });
  await clickFirst();
  const first = lastCopied;
  await clickReview();
  const review = lastCopied;
  assert.equal(first, '- apps/partnership-breakpoint/standalone.html');
  assert.equal(review, '- Review constraints and negotiation room. Check cost allowances, feasible volume and operational conflicts before exporting a review packet.');
  assert.notEqual(first, review);
  assert.match(page, /id="copy-first-open"/);
  assert.match(page, /id="copy-first-review"/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Open href uses the printed href without extra public paths', () => {
  const page = notFoundPage();
  const href = catalogFirstOpenHref();
  assert.equal(href, 'apps/partnership-breakpoint/standalone.html');
  assert.equal(page.includes(href), true, '404 page should print the first Open workbench href');
  assert.equal(page.includes(catalogFirstWorkbenchHeading()), true, '404 page should print the first workbench heading');
  assert.match(page, /id="copy-first-open"/);
  assert.match(page, />Copy first Open href</);
  assert.match(page, /id="copy-first-open-fallback"/);
  assert.match(page, /textarea id="copy-first-open-fallback"/);
  assert.match(page, /firstOpenMarkdown/);
  assert.match(page, /querySelector\('#workbenches a\.open'\)/);
  assert.match(page, /id="workbenches"/);
  assert.match(page, /Not a live product feed/);
  assert.match(page, /id="copy-first-review"/);
  assert.match(page, />Copy first review path</);
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

test('404 copy-first-open script parses as classic browser JavaScript', () => {
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
  assert.match(source, /firstOpenMarkdown/);
  assert.match(source, /Not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Open href shows a visible textarea when clipboard is unavailable', async () => {
  const page = notFoundPage();
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  let click = null;
  const fallback = { hidden: true, value: '', focused: false, selected: false, focus() { this.focused = true; }, select() { this.selected = true; } };
  const status = { textContent: '' };
  const document = {
    getElementById(id) {
      if (id === 'copy-first-open') return { addEventListener(name, handler) { if (name === 'click') click = handler; } };
      if (id === 'copy-first-open-status') return status;
      if (id === 'copy-first-open-fallback') return fallback;
      return null;
    },
    querySelector(selector) {
      return selector === '#workbenches a.open'
        ? { getAttribute(name) { return name === 'href' ? 'apps/partnership-breakpoint/standalone.html' : null; } }
        : null;
    },
    querySelectorAll: () => [],
  };
  vm.runInNewContext(source, {
    document,
    navigator: {},
  });
  await click();
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.focused, true);
  assert.equal(fallback.selected, true);
  assert.equal(fallback.value, '- apps/partnership-breakpoint/standalone.html');
  assert.match(status.textContent, /Clipboard unavailable/);
  assert.match(status.textContent, /not a live product feed/);
  assert.equal(PUBLIC_PATHS.length, 6);
});

test('404 copy first Open href stays GET HEAD only with connect-src none', async (t) => {
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
      path: '/no-copy-first-open-href',
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
  assert.match(missing.body, /id="copy-first-open"/);
  assert.match(missing.body, />Copy first Open href</);
  assert.match(missing.body, /apps\/partnership-breakpoint\/standalone\.html/);
  assert.match(missing.body, /id="workbenches"/);
  assert.match(missing.body, /Not a live product feed/);
  assert.match(missing.body, /id="copy-first-review"/);
  assert.equal(missing.headers['content-security-policy'], CONTENT_SECURITY_POLICY);
  const head = await new Promise((resolve, reject) => {
    const req = request({
      hostname: '127.0.0.1',
      port,
      path: '/no-copy-first-open-href',
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
