import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createCommonCartServer } from "../scripts/dev-server.mjs";
import { DEFAULT_HOST, DEFAULT_PORT, parsePort } from "../scripts/listen-config.mjs";

async function withServer(serveRoot, run) {
  const server = createCommonCartServer(serveRoot);
  await new Promise((resolve) => server.listen(0, DEFAULT_HOST, resolve));
  const { port } = server.address();
  try {
    await run(`http://${DEFAULT_HOST}:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function fixtureDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "common-cart-dev-server-"));
  await writeFile(join(directory, "index.html"), "<!doctype html><title>ok</title>\n");
  return directory;
}

test("listen config defaults to loopback 4173 and rejects a non-integer PORT", () => {
  assert.deepEqual(parsePort(undefined), { port: DEFAULT_PORT });
  assert.equal(DEFAULT_HOST, "127.0.0.1");
  // parsePort trims before validating, so surrounding spaces are accepted.
  assert.deepEqual(parsePort(" 4173 "), { port: 4173 });
  for (const value of ["0", "65536", "-1", "4173.5", "0x105d", "1e3", "nope", "", "4173foo", "+4173"]) {
    assert.ok(parsePort(value).error, `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test("served responses carry X-Content-Type-Options: nosniff", async () => {
  // Partnership Breakpoint, The Smallest Agreement, and Weekend Gap all send
  // nosniff on the 200 path. Common Cart did not, which let a browser
  // content-sniff a served file as a type the workbench never declared.
  const directory = await fixtureDirectory();
  await withServer(directory, async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(await response.text(), "<!doctype html><title>ok</title>\n");
  });
});

test("a file with an undeclared extension is still served as octet-stream with nosniff", async () => {
  const directory = await fixtureDirectory();
  await writeFile(join(directory, "notes.bin"), "raw bytes", "utf8");
  await withServer(directory, async (url) => {
    const response = await fetch(`${url}/notes.bin`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/octet-stream");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  });
});

test("HEAD keeps the same headers and sends no body", async () => {
  const directory = await fixtureDirectory();
  await withServer(directory, async (url) => {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(await response.text(), "");
  });
});

test("rejected and missing paths still answer, and non-GET is 405", async () => {
  const directory = await fixtureDirectory();
  await withServer(directory, async (url) => {
    const traversal = await fetch(`${url}/../package.json`, { signal: AbortSignal.timeout(5000) });
    assert.equal(traversal.status, 404);

    const missing = await fetch(`${url}/absent.html`, { signal: AbortSignal.timeout(5000) });
    assert.equal(missing.status, 404);

    const posted = await fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) });
    assert.equal(posted.status, 405);
    assert.equal(posted.headers.get("allow"), "GET, HEAD");
  });
});
