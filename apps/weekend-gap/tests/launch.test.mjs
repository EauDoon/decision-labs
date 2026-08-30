import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedNodeVersion, parseLaunchOptions, urlFromServerOutput } from "../scripts/launch.mjs";

test("launcher validates Node.js 20 and parses the loopback URL", () => {
  assert.equal(isSupportedNodeVersion("20.0.0"), true);
  assert.equal(isSupportedNodeVersion("19.9.0"), false);
  assert.equal(isSupportedNodeVersion("not-a-version"), false);
  assert.equal(urlFromServerOutput("Weekend Gap is running at http://127.0.0.1:5173"), "http://127.0.0.1:5173");
  assert.equal(urlFromServerOutput("other output"), null);
});

test("launcher accepts only the optional no-browser flag", () => {
  assert.deepEqual(parseLaunchOptions([]), { noOpen: false });
  assert.deepEqual(parseLaunchOptions(["--no-open"]), { noOpen: true });
  assert.equal(parseLaunchOptions(["--unknown"]), null);
});
