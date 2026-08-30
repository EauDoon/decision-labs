import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createCommonCartServer } from "../scripts/dev-server.mjs";
import { DEFAULT_HOST, DEFAULT_PORT, parsePort } from "../scripts/listen-config.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const launchScript = fileURLToPath(new URL("../scripts/launch.mjs", import.meta.url));
const serverScript = fileURLToPath(new URL("../scripts/dev-server.mjs", import.meta.url));

function run(script, env = {}) {
  const result = spawnSync(process.execPath, [script, "--no-open"], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 5000
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}

test("PORT defaults to 4173 on loopback and accepts in-range integers", () => {
  assert.equal(DEFAULT_PORT, 4173);
  assert.equal(DEFAULT_HOST, "127.0.0.1");
  assert.deepEqual(parsePort(undefined), { port: 4173 });
  assert.deepEqual(parsePort("1"), { port: 1 });
  assert.deepEqual(parsePort("4174"), { port: 4174 });
  assert.deepEqual(parsePort("65535"), { port: 65535 });
  assert.deepEqual(parsePort(" 80 "), { port: 80 });
});

test("PORT rejects empty, zero, out-of-range, and non-integer values", () => {
  const cases = [
    ["", /PORT is empty/u],
    ["   ", /PORT is empty/u],
    ["0", /PORT must be an integer from 1 through 65535/u],
    ["-1", /PORT must be an integer from 1 through 65535/u],
    ["65536", /PORT must be an integer from 1 through 65535/u],
    ["4173.5", /PORT must be an integer from 1 through 65535/u],
    ["4173foo", /PORT must be an integer from 1 through 65535/u],
    ["0x104d", /PORT must be an integer from 1 through 65535/u],
    ["+4173", /PORT must be an integer from 1 through 65535/u],
    ["abc", /PORT must be an integer from 1 through 65535/u]
  ];
  for (const [value, pattern] of cases) {
    const parsed = parsePort(value);
    assert.equal("error" in parsed, true, `PORT=${JSON.stringify(value)}`);
    assert.match(parsed.error, pattern, `PORT=${JSON.stringify(value)}`);
  }
});

test("launcher and server reject invalid PORT before listening", () => {
  for (const [script, port, pattern] of [
    [launchScript, "", /PORT is empty/u],
    [launchScript, "0", /PORT must be an integer from 1 through 65535/u],
    [launchScript, "65536", /PORT must be an integer from 1 through 65535/u],
    [serverScript, "abc", /PORT must be an integer from 1 through 65535/u],
    [serverScript, "4173.5", /PORT must be an integer from 1 through 65535/u]
  ]) {
    const result = run(script, { PORT: port });
    assert.equal(result.status, 1, `${script} PORT=${JSON.stringify(port)}`);
    assert.match(result.stderr, pattern, `${script} PORT=${JSON.stringify(port)}`);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /running at/u);
  }
});

test("server serves GET and HEAD consistently and rejects unsupported methods", async () => {
  const directory = await mkdtemp(join(tmpdir(), "common-cart-server-"));
  const publicDirectory = join(directory, "public");
  const server = createCommonCartServer(publicDirectory);
  try {
    await mkdir(publicDirectory);
    await writeFile(join(publicDirectory, "index.html"), "<!doctype html><title>ok</title>\n", "utf8");
    await writeFile(join(directory, "secret.txt"), "outside root\n", "utf8");
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, DEFAULT_HOST, resolve);
    });
    const address = server.address();
    assert.equal(typeof address, "object");
    const url = `http://${DEFAULT_HOST}:${address.port}`;

    const get = await fetch(url);
    assert.equal(get.status, 200);
    assert.equal(await get.text(), "<!doctype html><title>ok</title>\n");

    const post = await fetch(url, { method: "POST" });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get("allow"), "GET, HEAD");
    assert.equal(await post.text(), "Method not allowed");

    const head = await fetch(url, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), get.headers.get("content-length"));
    assert.equal(await head.text(), "");

    const traversal = await fetch(`${url}/%2e%2e%2fsecret.txt`);
    assert.equal(traversal.status, 404);
    assert.equal(await traversal.text(), "Not found");
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await rm(directory, { recursive: true, force: true });
  }
  assert.equal(server.listening, false);
  await assert.rejects(access(directory), (error) => error.code === "ENOENT");
});
