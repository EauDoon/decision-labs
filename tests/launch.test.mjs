import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
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
