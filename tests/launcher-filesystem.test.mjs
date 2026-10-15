import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'decision-labs-launcher-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, 'catalog');
  await mkdir(join(root, 'scripts'), { recursive: true });
  await mkdir(join(root, 'apps'));
  for (const name of ['serve.mjs', 'apps.mjs']) {
    await copyFile(new URL(`../scripts/${name}`, import.meta.url), join(root, 'scripts', name));
  }
  await writeFile(join(root, 'index.html'), '<h1>Public catalog</h1>');
  await writeFile(join(root, '404.html'), '<h1>Public not found</h1>');
  const launcher = await import(pathToFileURL(join(root, 'scripts', 'serve.mjs')).href);
  const server = launcher.createLauncher();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const call = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path, method, timeout: 5000 }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on('timeout', () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
    req.end();
  });
  return { directory, root, launcher, call };
}

test('catalog allowlist rejects directory links to outside and nonpublic files', async t => {
  const { directory, root, call } = await fixture(t);
  const link = join(root, 'apps', 'common-cart');
  for (const target of [join(directory, 'outside'), join(directory, 'catalog-private'), join(root, '.private'), join(root, 'drafts')]) {
    await mkdir(target);
    await writeFile(join(target, 'standalone.html'), 'private sentinel');
    // Directory junctions exercise the same boundary without Windows symlink privileges.
    await symlink(target, link, process.platform === 'win32' ? 'junction' : 'dir');
    try {
      for (const method of ['GET', 'HEAD']) {
        const response = await call('/apps/common-cart/standalone.html', method);
        assert.equal(response.status, 404, `${method}: ${target}`);
        assert.doesNotMatch(response.body, /private sentinel/);
        assert.match(response.headers['content-security-policy'], /connect-src 'none'/);
        if (method === 'HEAD') assert.equal(response.body, '');
      }
    } finally {
      await unlink(link);
    }
  }
  // Rejecting one app must not stop the server or hide normal public files.
  await mkdir(link);
  await writeFile(join(link, 'standalone.html'), '<h1>Public workbench</h1>');
  assert.equal((await call('/apps/common-cart/standalone.html')).status, 200);
  assert.equal((await call('/')).status, 200);
});

test('a linked checkout works even when Node preserves its symlink path', async t => {
  const { directory, root } = await fixture(t);
  const link = join(directory, 'linked-catalog');
  await symlink(root, link, process.platform === 'win32' ? 'junction' : 'dir');
  await mkdir(join(root, 'apps', 'common-cart'));
  await writeFile(join(root, 'apps', 'common-cart', 'standalone.html'), '<h1>Public workbench</h1>');
  const url = pathToFileURL(join(link, 'scripts', 'serve.mjs')).href;
  const result = spawnSync(process.execPath, ['--preserve-symlinks', '--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import { createLauncher, notFoundPage } from ${JSON.stringify(url)};
    const server = createLauncher();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      for (const path of ['/', '/index.html', '/apps/common-cart/standalone.html']) {
        const response = await fetch('http://127.0.0.1:' + server.address().port + path);
        assert.equal(response.status, 200, path);
        assert.match(await response.text(), /Public/);
      }
      assert.match(notFoundPage(), /Public not found/);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  `], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('root, requests and error pages use the same canonical path spelling', async t => {
  const { directory, root } = await fixture(t);
  const alias = join(directory, 'short-root');
  await symlink(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const url = pathToFileURL(join(root, 'scripts', 'serve.mjs')).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    const original = fs.realpathSync;
    const canonical = original.native(${JSON.stringify(root)});
    // Model Windows short-name/canonical spelling differences without needing
    // a Windows host. Both spellings refer to the same real checkout.
    fs.realpathSync = Object.assign((path, options) => {
      const resolved = original(path, options);
      return resolved.startsWith(canonical)
        ? ${JSON.stringify(alias)} + resolved.slice(canonical.length) : resolved;
    }, { native: original.native });
    syncBuiltinESMExports();
    const { createLauncher, notFoundPage } = await import(${JSON.stringify(url)});
    const server = createLauncher();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/');
      assert.equal(response.status, 200);
      assert.match(await response.text(), /Public catalog/);
      assert.match(notFoundPage(), /Public not found/);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  `], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('catalog rejects a public filename linked to a private file', { skip: process.platform === 'win32' }, async t => {
  const { root, call } = await fixture(t);
  await writeFile(join(root, 'draft.html'), 'private sentinel');
  await unlink(join(root, 'index.html'));
  await symlink(join(root, 'draft.html'), join(root, 'index.html'));
  for (const path of ['/', '/index.html']) {
    const response = await call(path);
    assert.equal(response.status, 404);
    assert.doesNotMatch(response.body, /private sentinel/);
  }
});

test('missing or redirected error pages use a safe fallback', async t => {
  const { root, launcher, call } = await fixture(t);
  await unlink(join(root, '404.html'));
  assert.equal(launcher.notFoundPage(), 'Not found');
  assert.equal((await call('/missing')).status, 404);
  assert.equal((await call('/missing', 'HEAD')).body, '');
  if (process.platform !== 'win32') {
    await writeFile(join(root, 'draft.html'), 'private sentinel');
    await symlink(join(root, 'draft.html'), join(root, '404.html'));
    assert.equal(launcher.notFoundPage(), 'Not found');
    assert.doesNotMatch((await call('/missing')).body, /private sentinel/);
  }
  assert.equal((await call('/')).status, 200);
});
