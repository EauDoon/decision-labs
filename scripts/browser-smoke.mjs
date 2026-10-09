import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { APP_ROUTES } from './apps.mjs';
import { createLauncher, notFoundPage } from './serve.mjs';

// Optional developer tooling only. The applications remain dependency-free.
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
// AXE_MODULE optionally points at an axe-core package directory; when set,
// every shipped page must report zero axe violations.
const axeSource = process.env.AXE_MODULE ? readFileSync(resolve(process.env.AXE_MODULE, 'axe.min.js'), 'utf8') : null;
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined });
const server = createLauncher();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const AXE_PAGES = ['index.html', '404.html', ...APP_ROUTES];
const cases = [
  { id: 'common-cart', field: 'input[data-field="quantity"]', value: '3', alternate: '4', metric: '#metric-units', result: /^15$/, dismiss: '#coach-dismiss', export: '#export-button', import: '#import-file', status: '#status', share: '#share-button' },
  { id: 'partnership-breakpoint', field: '[data-path="deal.feePerTransaction"]', value: '0.19', alternate: '0.18', metric: '.status-line', result: /exit|fail|not|break/i, dismiss: '[data-action="dismiss-coach"]', export: '[data-action="export"]', import: '[data-action="import"]', status: '#notice' },
  { id: 'smallest-agreement', field: '#threshold-number', value: '75', alternate: '76', metric: '#result-summary', result: /recommended approval\s+76\.4%/i, dismiss: '#coach-skip', export: '#export-button', import: '#import-file', status: '#autosave-status', share: '#share-button' },
  { id: 'weekend-gap', field: '#reserveCashAud', value: '0', alternate: '100', metric: '#settled-total-value', result: /^A\$0$/, dismiss: '#coach-dismiss', export: '#export-button', import: '#import-file', status: '#input-message', share: '#share-button' },
];

async function exportJson(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).first().click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function edit(page, item, value) {
  await page.locator(item.field).first().fill(value);
  await page.locator(item.field).first().press('Tab');
}

function watch(page) {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(origin + '/')) remoteRequests.push(request.url()); });
  return { errors, remoteRequests };
}

async function pageWidth(page) {
  return page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
}

// Each shipped page in file mode at 1280x900 on first load, before any edit.
async function axePass() {
  for (const path of AXE_PAGES) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(new URL(`../${path}`, import.meta.url).href);
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(() => globalThis.axe.run(document, { resultTypes: ['violations'] }));
    const found = result.violations.flatMap(violation => violation.nodes.map(node => `${violation.id} (${violation.impact}): ${node.target.join(' ')}`));
    assert.deepEqual(found, [], `${path}: axe violations`);
    console.log(`PASS axe ${path}: 0 violations (axe-core ${result.testEngine.version})`);
    await context.close();
  }
}

// The catalog through the loopback launcher: every Open workbench link serves
// its standalone page, the skip link moves focus, the page fits 390px, and an
// unknown path serves the 404 page.
async function catalogJourney() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const { errors, remoteRequests } = watch(page);
  const response = await page.goto(`${origin}/`);
  assert.equal(response.status(), 200, 'catalog status');
  const links = await page.locator('a.open').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
  assert.deepEqual(links, [...APP_ROUTES], 'catalog: Open workbench links');
  for (const href of links) {
    const opened = await page.request.get(new URL(href, `${origin}/`).href);
    assert.equal(opened.status(), 200, `catalog: ${href}`);
    assert.match(await opened.text(), /<!doctype html>/i, `catalog: ${href} is a page`);
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.closest('.skip-links') !== null), true, 'catalog: first Tab reaches the skip links');
  const target = await page.evaluate(() => document.activeElement.getAttribute('href'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(id => document.activeElement?.id === id, target.slice(1));
  await page.setViewportSize({ width: 390, height: 844 });
  const width = await pageWidth(page);
  assert.ok(width.width <= width.viewport + 1, `catalog: 390px page overflow ${JSON.stringify(width)}`);
  const missing = await page.goto(`${origin}/missing`);
  assert.equal(missing.status(), 404, 'catalog: unknown path status');
  assert.equal(await missing.text(), notFoundPage(), 'catalog: unknown path serves 404.html');
  assert.match(await page.locator('h1').innerText(), /not in the catalog/);
  assert.ok((await pageWidth(page)).width <= 391, 'catalog: 404 fits 390px');
  assert.deepEqual(errors, [], 'catalog: browser errors');
  assert.deepEqual(remoteRequests, [], 'catalog: external requests');
  console.log('PASS catalog: four workbench links, skip link focus, 390px, 404 page, no external requests');
  await context.close();
}

try {
  if (axeSource) await axePass();
  await catalogJourney();
  for (const item of cases) {
    const storageKeys = item.id === 'partnership-breakpoint'
      ? ['partnership-breakpoint.v1', 'partnership-breakpoint.cases.v1']
      : item.id === 'smallest-agreement' ? ['smallest-agreement:proposal:v1'] : [];
    let initialScenario;
    for (const mode of ['file', 'server', 'storage-unavailable', ...(storageKeys.length ? ['corrupt-storage', 'empty-storage', 'corrupt-storage-share'] : [])]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
      const preserveStorage = mode === 'corrupt-storage' || mode === 'empty-storage' || mode === 'corrupt-storage-share';
      const preserved = mode === 'empty-storage' ? '' : mode === 'corrupt-storage-share' ? '{}' : '{unreadable';
      if (preserveStorage) await context.addInitScript(({ keys, raw }) => {
        for (const key of keys) localStorage.setItem(key, raw);
      }, { keys: storageKeys, raw: preserved });
      if (mode === 'storage-unavailable') await context.addInitScript(() => {
        for (const method of ['getItem', 'setItem', 'removeItem']) {
          Storage.prototype[method] = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };
        }
      });
      const page = await context.newPage();
      const { errors, remoteRequests } = watch(page);
      page.on('dialog', dialog => dialog.accept());
      let url = mode === 'file'
        ? new URL(`../apps/${item.id}/standalone.html`, import.meta.url).href
        : `${origin}/apps/${item.id}/standalone.html`;
      if (mode === 'corrupt-storage-share') url += `#${item.id === 'partnership-breakpoint' ? 'deal' : 'agreement'}=${Buffer.from(JSON.stringify(initialScenario)).toString('base64url')}`;
      await page.goto(url);
      const dismiss = page.locator(item.dismiss).first();
      if (await dismiss.isVisible()) await dismiss.click();
      if (mode === 'file') initialScenario = await exportJson(page, item.export);
      const before = await page.locator(item.metric).first().innerText();
      await edit(page, item, item.value);
      await page.waitForFunction(({ selector, before }) => document.querySelector(selector)?.textContent.trim() !== before.trim(), { selector: item.metric, before });
      assert.match(await page.locator(item.metric).first().innerText(), item.result);
      const saved = await exportJson(page, item.export);
      await edit(page, item, item.alternate);
      await page.locator(item.import).setInputFiles({ name: 'synthetic-roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
      await page.waitForFunction(({ field, value }) => document.querySelector(field)?.value === value, { field: item.field, value: item.value });
      assert.deepEqual(await exportJson(page, item.export), saved, `${item.id}: JSON round trip`);
      await page.locator(item.import).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') });
      await page.waitForFunction(selector => /invalid|failed|reject|not valid|could not/i.test(document.querySelector(selector)?.textContent || ''), item.status);
      assert.deepEqual(await exportJson(page, item.export), saved, `${item.id}: rejected import preserves draft`);
      if (mode === 'file') {
        if (item.share) {
          const share = page.locator(item.share);
          if (await share.isDisabled()) assert.match(await share.getAttribute('title') || '', /export|local file|portable/i);
          else {
            await share.click();
            await page.waitForFunction(selector => /export|local file|portable/i.test(document.querySelector(selector)?.textContent || ''), item.status);
          }
        } else assert.equal(await page.locator('[data-action="copy-share-url"]').count(), 0);
      }
      if (mode === 'storage-unavailable') {
        await edit(page, item, item.value);
        const storageStatus = item.id === 'common-cart' ? '#save-state' : item.id === 'weekend-gap' ? '#storage-status' : item.status;
        await page.waitForFunction(selector => /unavailable|could not|preserved/i.test(document.querySelector(selector)?.textContent || ''), storageStatus);
        assert.deepEqual(await exportJson(page, item.export), saved, `${item.id}: export without storage`);
      }
      if (preserveStorage) {
        await edit(page, item, item.alternate);
        await page.waitForFunction(selector => /preserved/i.test(document.querySelector(selector)?.textContent || ''), item.status);
        if (item.id === 'partnership-breakpoint') {
          await page.locator('[data-action="case-name"]').fill('Synthetic recovery case');
          await page.locator('[data-action="save-case"]').click();
          assert.match(await page.locator(item.status).innerText(), /library.*preserved/i);
        }
        assert.deepEqual(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), storageKeys), storageKeys.map(() => preserved), `${item.id}: unreadable bytes preserved`);
        await edit(page, item, item.value);
        assert.deepEqual(await exportJson(page, item.export), saved, `${item.id}: export remains available with unreadable storage`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator(item.field).first().focus();
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.activeElement !== document.body), `${item.id}: keyboard focus`);
      await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));
      if (process.env.BROWSER_EVIDENCE_DIR && mode === 'file') {
        await mkdir(process.env.BROWSER_EVIDENCE_DIR, { recursive: true });
        await page.screenshot({ path: resolve(process.env.BROWSER_EVIDENCE_DIR, `${item.id}-390px.png`) });
      }
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth,
        elements: [...document.querySelectorAll('body *')].filter(node => node.scrollWidth > node.clientWidth + 3).slice(0, 25).map(node => ({ node: `${node.tagName}#${node.id}.${node.className}`, client: node.clientWidth, scroll: node.scrollWidth, overflow: getComputedStyle(node).overflowX, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right })) }));
      assert.ok(overflow.width <= overflow.viewport + 1, `${item.id}: 390px page overflow ${JSON.stringify(overflow)}`);
      assert.deepEqual(errors, [], `${item.id}: browser errors`);
      assert.deepEqual(remoteRequests, [], `${item.id}: external requests`);
      console.log(`PASS ${item.id} ${mode}: edit, visible result, JSON round trip, rejected import, focus, 390px, no external requests`);
      await context.close();
    }
  }
  console.log(`Browser: Chromium ${browser.version()}; platform: ${process.platform}`);
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
