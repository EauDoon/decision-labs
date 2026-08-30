import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { isStandaloneCurrent, standaloneBytes } from "../scripts/build-standalone.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const buildScript = fileURLToPath(new URL("../scripts/build-standalone.mjs", import.meta.url));

test("standalone artifact is current, self-contained, and LF-normalized", async () => {
  execFileSync(process.execPath, [buildScript, "--check"], { cwd: root, stdio: "pipe" });
  const html = await standaloneBytes();
  assert.equal(isStandaloneCurrent(html.replace(/\n/gu, "\r\n"), html), true);
  assert.equal(isStandaloneCurrent("stale", html), false);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/u)?.[1];
  assert.match(html, /<style>\n/u);
  assert.match(html, /<script type="module">\n/u);
  assert.doesNotMatch(html, /<link\b|<script\b[^>]*\bsrc\s*=|\bhttps?:\/\//iu);
  assert.doesNotMatch(html, /\r/u);
  assert.match(csp ?? "", /^default-src 'none'; /u);
  assert.match(csp ?? "", /script-src 'unsafe-inline'/u);
  assert.match(csp ?? "", /style-src 'unsafe-inline'/u);
  assert.match(csp ?? "", /connect-src 'none';/u);
  assert.match(csp ?? "", /object-src 'none';/u);
  assert.match(csp ?? "", /base-uri 'none';/u);
  assert.match(csp ?? "", /form-action 'none'/u);
  assert.match(html, /Threshold margin/u);
  assert.match(html, /Closest gap/u);
  assert.match(html, /id="max-change-cost"/u);
  assert.match(html, /data-field="group-floor"/u);
  assert.match(html, /data-field="clause-lock"/u);
  assert.match(html, /Constraint checks/u);
  assert.match(html, /aria-describedby="floor-note"/u);
  assert.match(html, /Copyright \(c\) 2026 EauDoon/u);
});

async function savedWorkbench(storage, hash = "") {
  const html = await standaloneBytes();
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/u)[1];
  const elements = new Map();
  const documentEvents = new Map();
  const canvasContext = { setTransform() {}, clearRect() {}, fillRect() {}, fillText() {} };
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, { value: "", textContent: "", innerHTML: "", clientWidth: 400,
      events: new Map(), addEventListener(name, callback) { this.events.set(name, callback); }, getContext: () => canvasContext });
    return elements.get(selector);
  };
  const context = vm.createContext({ console, TextDecoder, Uint8Array, atob,
    document: { querySelector: element, addEventListener: (name, callback) => documentEvents.set(name, callback) },
    window: { devicePixelRatio: 1, addEventListener() {} },
    location: { hash, protocol: "file:" },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  new vm.Script(script).runInContext(context, { timeout: 5000 });
  return {
    title: () => element("#proposal-title").value,
    message: () => element("#autosave-status").textContent,
    alert: () => element("#result-alert").textContent,
    summary: () => element("#result-summary").innerHTML,
    clauses: () => element("#clauses-editor").innerHTML,
    disabled: (selector) => element(selector).disabled,
    click: (selector) => element(selector).events.get("click")(),
    importJson: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "draft.json",
      };
      await element("#import-file").events.get("change")({ target });
    },
    setTitle: (value) => {
      const target = element("#proposal-title");
      target.value = value;
      target.events.get("input")({ target });
    },
    edit: (field, value) => {
      const target = { value: String(value), valueAsNumber: value, validity: { badInput: false }, dataset: { field: "group-floor", groupId: "g" } };
      if (field === "budget") element("#max-change-cost").events.get("input")({ target });
      else documentEvents.get("input")({ target });
    },
  };
}

test("invalid thresholds in storage and share links fail closed without replacing the workshop", async () => {
  const key = "smallest-agreement:proposal:v1";
  const valid = { title: "Custom saved workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  for (const value of [101, -1, null, "70", false, {}]) {
    const storage = new Map([[key, JSON.stringify({ ...valid, threshold: value })]]);
    const app = await savedWorkbench(storage);
    assert.equal(app.title(), "Neighbourhood Plan: the shared green", `stored threshold ${String(value)}`);
    assert.match(app.message(), /Local draft ignored: threshold must be a number from 0 to 100/u, `stored threshold ${String(value)}`);
    assert.doesNotMatch(app.alert(), /Fix the proposal before searching/u);
  }
  const encoded = Buffer.from(JSON.stringify({ ...valid, threshold: 101 })).toString("base64url");
  const shared = await savedWorkbench(new Map(), `#agreement=${encoded}`);
  assert.equal(shared.title(), "Neighbourhood Plan: the shared green");
  assert.match(shared.message(), /Share link ignored: threshold must be a number from 0 to 100/u);
});

test("share links reject malformed UTF-8 instead of loading replacement text", async () => {
  const draft = { title: "Corrupt workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const bytes = Buffer.from(JSON.stringify(draft));
  const titleStart = bytes.indexOf("Corrupt");
  bytes[titleStart] = 0xc3;
  bytes[titleStart + 1] = 0x28;

  const app = await savedWorkbench(new Map(), `#agreement=${bytes.toString("base64url")}`);
  assert.equal(app.title(), "Neighbourhood Plan: the shared green");
  assert.match(app.message(), /Share link ignored: it is not valid UTF-8/u);
});

test("share-link and storage parse failures name the decode or JSON cause", async () => {
  const key = "smallest-agreement:proposal:v1";
  const cases = [
    ["#agreement=%", /Share link ignored: the URL encoding is invalid/u],
    ["#agreement=$$$$", /Share link ignored: it is not valid base64/u],
    [`#agreement=${Buffer.from("not-json").toString("base64url")}`, /Share link ignored: the text is not valid JSON/u],
  ];
  for (const [hash, pattern] of cases) {
    const app = await savedWorkbench(new Map(), hash);
    assert.equal(app.title(), "Neighbourhood Plan: the shared green", hash);
    assert.match(app.message(), pattern, hash);
  }

  const storedJson = await savedWorkbench(new Map([[key, "{not json"]]));
  assert.equal(storedJson.title(), "Neighbourhood Plan: the shared green");
  assert.match(storedJson.message(), /Local draft ignored: the text is not valid JSON/u);
});

test("import failures name JSON syntax, the first invalid field, and oversize files", async () => {
  const draft = { title: "Imported workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const app = await savedWorkbench(new Map());
  await app.importJson("{not json");
  assert.match(app.message(), /Import failed: the text is not valid JSON/u);
  await app.importJson("[]");
  assert.match(app.message(), /Import failed: Proposal must be an object/u);
  await app.importJson(JSON.stringify({ ...draft, threshold: 101 }));
  assert.match(app.message(), /Import failed: threshold must be a number from 0 to 100/u);
  await app.importJson("{}", { size: 250_001 });
  assert.match(app.message(), /Import failed: files must be 250 KB or smaller/u);
  assert.equal(app.title(), "Neighbourhood Plan: the shared green");
});

test("invalid budget and floor edits preserve the last valid custom autosave across reloads", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = { title: "Custom saved workshop", threshold: 70, maxChangeCost: 3,
    groups: [{ id: "g", name: "Custom group", weight: 1, minSupport: 50 }],
    clauses: [{ id: "clause", title: "Custom clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  for (const [field, invalid, corrected] of [["budget", -1, 2], ["floor", 101, 75]]) {
    const storage = new Map([[key, JSON.stringify(draft)]]);
    const app = await savedWorkbench(storage);
    app.setTitle(`Custom ${field} workshop`);
    const lastValid = storage.get(key);
    assert.match(app.message(), /Saved in this browser/u);
    app.edit(field, invalid);
    assert.match(app.message(), field === "budget"
      ? /Invalid edits are not saved: maxChangeCost must be from 0 through/u
      : /Invalid edits are not saved: groups\[0\]\.minSupport must be from 0 to 100/u);
    assert.equal(storage.get(key), lastValid);
    const reloaded = await savedWorkbench(storage);
    assert.equal(reloaded.title(), `Custom ${field} workshop`);
    assert.deepEqual(JSON.parse(storage.get(key)), JSON.parse(lastValid));
    app.edit(field, corrected);
    assert.match(app.message(), /Saved in this browser/u);
    const persisted = JSON.parse(storage.get(key));
    assert.equal(field === "budget" ? persisted.maxChangeCost : persisted.groups[0].minSupport, corrected);
    assert.equal((await savedWorkbench(storage)).title(), `Custom ${field} workshop`);
  }
});

test("empty and whitespace title edits clear stale results and block export and sharing until corrected", async () => {
  const key = "smallest-agreement:proposal:v1";
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Custom title kept in storage");
  const lastValid = storage.get(key);
  for (const title of ["", "   "]) {
    app.setTitle(title);
    assert.equal(app.title(), title, "typing must preserve the entered text");
    assert.match(app.message(), /Invalid edits are not saved: title must be a non-empty string no longer than 120 characters/u);
    assert.match(app.alert(), /Fix the proposal before searching: title must be a non-empty string no longer than 120 characters/u);
    assert.match(app.summary(), /Not evaluated/u);
    assert.equal(app.disabled("#export-button"), true);
    assert.equal(app.disabled("#share-button"), true);
    assert.equal(storage.get(key), lastValid);
    assert.doesNotThrow(() => app.click("#export-button"));
    assert.match(app.message(), /Correct invalid inputs before exporting JSON/u);
    await app.click("#share-button");
    assert.match(app.message(), /Correct invalid inputs before sharing/u);
  }
  app.setTitle("Corrected workshop title");
  assert.equal(app.title(), "Corrected workshop title");
  assert.doesNotMatch(app.alert(), /Fix the proposal before searching/u);
  assert.doesNotMatch(app.summary(), /Not evaluated/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.equal(app.disabled("#share-button"), false);
  assert.equal(JSON.parse(storage.get(key)).title, "Corrected workshop title");
});

test("editor disables add controls at the model's validation caps", async () => {
  const key = "smallest-agreement:proposal:v1";
  const base = { title: "Bounded workshop", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };

  const groupCapped = structuredClone(base);
  groupCapped.groups = Array.from({ length: 24 }, (_, index) => ({ id: `g${index}`, name: `Group ${index}`, weight: 1 }));
  for (const option of groupCapped.clauses[0].options) option.support = Object.fromEntries(groupCapped.groups.map(({ id }) => [id, 50]));
  assert.equal((await savedWorkbench(new Map([[key, JSON.stringify(groupCapped)]]))).disabled('[data-action="add-group"]'), true);

  const clauseCapped = structuredClone(base);
  clauseCapped.clauses = Array.from({ length: 20 }, (_, index) => ({ ...structuredClone(base.clauses[0]), id: `clause-${index}` }));
  assert.equal((await savedWorkbench(new Map([[key, JSON.stringify(clauseCapped)]]))).disabled('[data-action="add-clause"]'), true);

  const optionCapped = structuredClone(base);
  optionCapped.clauses[0].options.push(...Array.from({ length: 21 }, (_, index) => ({
    id: `extra-${index}`, label: `Extra ${index}`, original: false, changeCost: index + 3, support: { g: 50 },
  })));
  assert.match((await savedWorkbench(new Map([[key, JSON.stringify(optionCapped)]]))).clauses(), /data-action="add-option"[^>]*disabled/u);
});
