import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// downloadText() revoked its object URL in the same task as link.click().
// The browser has not started reading the blob at that point, so Firefox
// cancels the save. Partnership Breakpoint, Common Cart and Weekend Gap already
// defer the revoke; this pins the same contract here so the helper cannot
// regress back to a synchronous revoke.
const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const match = /function downloadText\(filename, content, type\) \{[\s\S]*?\n\}\r?\n/.exec(source);
assert.ok(match, "app.js defines a top-level downloadText helper");
const body = match[0];

function harness() {
  const created = [];
  const revoked = [];
  const timers = [];
  let clicked = 0;
  const link = { href: "", download: "", click() { clicked += 1; } };
  const context = vm.createContext({
    Blob: class { constructor(parts) { this.parts = parts; } },
    URL: {
      createObjectURL(blob) { created.push(blob); return "blob:workshop-1"; },
      revokeObjectURL(url) { revoked.push(url); },
    },
    document: { createElement: () => link },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
  });
  vm.runInContext(`${body}\ndownloadText("workshop.json", "{}", "application/json");`, context);
  return { created, revoked, timers, clicked: () => clicked };
}

test("downloadText clicks the link before any object URL is revoked", () => {
  const { created, revoked, clicked } = harness();
  assert.equal(created.length, 1);
  assert.equal(clicked(), 1);
  assert.deepEqual(revoked, [], "the blob URL is still live when the download starts");
});

test("downloadText revokes the object URL on a later task, not synchronously", () => {
  const { revoked, timers } = harness();
  assert.equal(timers.length, 1);
  assert.ok(timers[0].ms >= 100, `expected a deferred revoke, got ${timers[0].ms}ms`);
  assert.deepEqual(revoked, []);
  timers[0].fn();
  assert.deepEqual(revoked, ["blob:workshop-1"]);
});