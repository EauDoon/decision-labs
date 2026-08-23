import assert from "node:assert/strict";
import test from "node:test";
import { buildStandalone, isStandaloneCurrent, standaloneCsp } from "../scripts/build-standalone.mjs";

test("standalone build is self-contained, LF-only, and deterministic", async () => {
  const first = await buildStandalone();
  const second = await buildStandalone();
  assert.equal(first, second);
  assert.equal(isStandaloneCurrent(first, second), true);
  assert.equal(isStandaloneCurrent("stale", second), false);
  assert.match(first, /data-weekend-gap-standalone="true"/);
  assert.match(first, /Sharing unavailable in standalone file/);
  assert.match(first, /A\$\$\{/);
  assert.match(first, new RegExp(`<meta http-equiv="Content-Security-Policy" content="${standaloneCsp}">`));
  assert.doesNotMatch(first, /(?:script|style)-src[^\"]*(?:'self'|https?:|data:|blob:)/);
  assert.doesNotMatch(first, /src="src\/app\.js"|href="styles\.css"|href="MODEL\.md"/);
  assert.doesNotMatch(first, /\r/);
});
