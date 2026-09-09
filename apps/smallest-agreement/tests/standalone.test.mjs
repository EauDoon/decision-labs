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
  assert.match(html, /Clause contribution/u);
  assert.match(html, /Near-miss explorer/u);
  assert.match(html, /aria-describedby="floor-note"/u);
  assert.match(html, /id="veto-note"/u);
  assert.match(html, /Import support CSV/u);
  assert.match(html, /Try this option/u);
  assert.match(html, /Leave one group out/u);
  assert.match(html, /id="coach-overlay"/u);
  assert.match(html, /id="shortcut-overlay"/u);
  assert.match(html, /id="find-agreement"/u);
  assert.match(html, /Side-by-side package/u);
  assert.match(html, /Lock recommended package/u);
  assert.match(html, /id="near-miss-sort"/u);
  assert.match(html, /Lock this package/u);
  assert.match(html, /workplace-hybrid/u);
  assert.match(html, /id="clause-filter"/u);
  assert.match(html, /id="clause-filter-status"/u);
  assert.match(html, /aria-live="polite"/u);
  assert.match(html, /id="support-drop-range"/u);
  assert.match(html, /id="printable-ballot"/u);
  assert.match(html, /Discussion worksheet/u);
  assert.match(html, /Facilitator note \(optional\)/u);
  assert.match(html, /Duplicate group/u);
  assert.match(html, /Duplicate clause/u);
  assert.match(html, /id="worksheet-button"/u);
  assert.match(html, /id="coach-again"/u);
  assert.match(html, /Duplicate option/u);
  assert.match(html, /Move up/u);
  assert.match(html, /id="weight-shares"/u);
  assert.match(html, /Budget remaining/u);
  assert.match(html, /Group contribution/u);
  assert.match(html, /Filter clauses by title or option label/u);
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
    document: {
      querySelector: element,
      querySelectorAll: () => [],
      addEventListener: (name, callback) => documentEvents.set(name, callback),
    },
    window: { devicePixelRatio: 1, addEventListener() {} },
    location: { hash, protocol: "file:" },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  new vm.Script(script).runInContext(context, { timeout: 5000 });
  return {
    numberInput: (selector, value) => element(selector).events.get("input")({ target: { valueAsNumber: value } }),
    field: (selector, value) => { element(selector).value = value; },
    title: () => element("#proposal-title").value,
    message: () => element("#autosave-status").textContent,
    alert: () => element("#result-alert").textContent,
    summary: () => element("#result-summary").innerHTML,
    clauses: () => element("#clauses-editor").innerHTML,
    groups: () => element("#groups-editor").innerHTML,
    disabled: (selector) => element(selector).disabled,
    click: (selector) => element(selector).events.get("click")(),
    importJson: async (contents, { size, read } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => read === undefined ? contents : await read }],
        value: "draft.json",
      };
      await element("#import-file").events.get("change")({ target });
    },
    setTitle: (value) => {
      const target = element("#proposal-title");
      target.value = value;
      target.events.get("input")({ target });
    },
    edit: (field, value, dataset = {}) => {
      const target = { value: String(value), valueAsNumber: value, validity: { badInput: false }, dataset: { field: "group-floor", groupId: "g", ...dataset } };
      if (field === "budget") element("#max-change-cost").events.get("input")({ target });
      else documentEvents.get("input")({ target });
    },
    filterClauses: (value) => {
      const target = element("#clause-filter");
      target.value = value;
      target.events.get("input")({ target });
    },
    filterStatus: () => element("#clause-filter-status").textContent,
    ballot: () => element("#ballot-body").innerHTML,
    shares: () => element("#weight-shares").innerHTML,
    sideBySide: () => element("#side-by-side").innerHTML,
    nearMisses: () => element("#near-misses-list").innerHTML,
    sortNearMisses: (value) => {
      const target = element("#near-miss-sort");
      target.value = value;
      target.events.get("change")({ target });
    },
    coachHidden: () => element("#coach-overlay").hidden,
    clickAction: (action, dataset = {}) => {
      documentEvents.get("click")({
        target: {
          closest: (selector) => selector === "[data-action]"
            ? { disabled: false, dataset: { action, ...dataset } }
            : null,
        },
      });
    },
    changeManual: (clauseId, optionId) => {
      documentEvents.get("change")({
        target: { dataset: { field: "manual-option", clauseId }, value: optionId },
      });
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

test("newer imports and edits supersede slower file reads", async () => {
  const draft = { title: "Earlier import", threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const storage = new Map();
  const app = await savedWorkbench(storage);
  let releaseEarlier;
  const earlierRead = new Promise((resolve) => { releaseEarlier = resolve; });
  const earlierImport = app.importJson("", { size: 100, read: earlierRead });
  await app.importJson(JSON.stringify({ ...draft, title: "Latest import" }));
  releaseEarlier(JSON.stringify(draft));
  await earlierImport;
  assert.equal(app.title(), "Latest import");

  let releasePending;
  const pendingRead = new Promise((resolve) => { releasePending = resolve; });
  const pendingImport = app.importJson("", { size: 100, read: pendingRead });
  app.setTitle("Intervening edit");
  releasePending(JSON.stringify({ ...draft, title: "Stale import" }));
  await pendingImport;
  assert.equal(app.title(), "Intervening edit");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).title, "Intervening edit");
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
  const cappedGroups = await savedWorkbench(new Map([[key, JSON.stringify(groupCapped)]]));
  assert.equal(cappedGroups.disabled('[data-action="add-group"]'), true);
  assert.match(cappedGroups.groups(), /data-action="duplicate-group"[^>]*disabled/u);

  const clauseCapped = structuredClone(base);
  clauseCapped.clauses = Array.from({ length: 20 }, (_, index) => ({ ...structuredClone(base.clauses[0]), id: `clause-${index}` }));
  assert.equal((await savedWorkbench(new Map([[key, JSON.stringify(clauseCapped)]]))).disabled('[data-action="add-clause"]'), true);

  const optionCapped = structuredClone(base);
  optionCapped.clauses[0].options.push(...Array.from({ length: 21 }, (_, index) => ({
    id: `extra-${index}`, label: `Extra ${index}`, original: false, changeCost: index + 3, support: { g: 50 },
  })));
  assert.match((await savedWorkbench(new Map([[key, JSON.stringify(optionCapped)]]))).clauses(), /data-action="add-option"[^>]*disabled/u);
  const duplicateCapped = await savedWorkbench(new Map([[key, JSON.stringify(clauseCapped)]]));
  assert.match(duplicateCapped.clauses(), /data-action="duplicate-clause"[^>]*disabled/u);
});


test("undo and redo restore edits and replacement imports; new edits clear redo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const original = app.title();
  assert.equal(app.disabled("#undo-button"), true);
  app.setTitle("Negotiation draft");
  app.click("#undo-button");
  assert.equal(app.title(), original);
  app.click("#redo-button");
  assert.equal(app.title(), "Negotiation draft");
  app.click("#undo-button");
  app.setTitle("Another round");
  assert.equal(app.disabled("#redo-button"), true);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).title, "Another round");
});


test("named snapshots survive reload, load independently, and support undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("First round");
  app.field("#scenario-name", "Working group");
  app.click("#save-scenario");
  app.setTitle("Second round");
  app.field("#scenario-select", "0");
  app.click("#load-scenario");
  assert.equal(app.title(), "First round");
  app.click("#undo-button");
  assert.equal(app.title(), "Second round");
  const next = await savedWorkbench(storage);
  next.field("#scenario-select", "0");
  next.click("#load-scenario");
  assert.equal(next.title(), "First round");
  assert.equal(JSON.parse(storage.get("smallest-agreement:scenarios:v1"))[0].name, "Working group");
});

test("invalid scenario libraries are preserved and cannot be overwritten", async () => {
  const key = "smallest-agreement:scenarios:v1";
  const storage = new Map([[key, "{broken"]]);
  const app = await savedWorkbench(storage);
  assert.equal(app.disabled("#save-scenario"), true);
  app.click("#save-scenario");
  assert.equal(storage.get(key), "{broken");
});


test("required numeric edits remain invalid instead of silently changing support, cost, or weight", async () => {
  for (const [field, value, details] of [
    ["group-weight", 0, { groupId: "residents" }],
    ["group-weight", NaN, { groupId: "residents" }],
    ["option-support", 101, { clauseId: "hours", optionId: "hours-original", groupId: "residents" }],
    ["option-support", NaN, { clauseId: "hours", optionId: "hours-original", groupId: "residents" }],
    ["option-cost", -1, { clauseId: "hours", optionId: "hours-seasonal" }],
  ]) {
    const storage = new Map();
    const app = await savedWorkbench(storage);
    app.setTitle("Valid saved draft");
    const before = storage.get("smallest-agreement:proposal:v1");
    app.edit(field, value, { field, ...details });
    assert.match(app.alert(), /Fix the proposal before searching/);
    assert.equal(app.disabled("#export-button"), true);
    assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
    app.click("#undo-button");
    assert.doesNotMatch(app.alert(), /Fix the proposal/);
  }
});


test("exact thresholds preserve decimals and reject missing values without corrupting autosave", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.numberInput("#threshold-number", 68.125);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68.125);
  app.numberInput("#threshold-number", NaN);
  assert.match(app.alert(), /Fix the proposal/);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68.125);
  app.click("#undo-button");
  assert.doesNotMatch(app.alert(), /Fix the proposal/);
});


test("saving snapshots cannot overwrite a library changed by another tab", async () => {
  const storage = new Map();
  const first = await savedWorkbench(storage);
  const second = await savedWorkbench(storage);
  first.field("#scenario-name", "First tab snapshot");
  first.click("#save-scenario");
  const saved = storage.get("smallest-agreement:scenarios:v1");
  second.click("#save-scenario");
  assert.equal(storage.get("smallest-agreement:scenarios:v1"), saved);
  assert.match(second.message(), /changed in another tab/);
});

test("weight shares and leftover budget are visible accounting, not voting rights", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "protected-access");
  app.click("#load-preset");
  assert.match(app.shares(), /Regular participants/u);
  assert.match(app.shares(), /mixing weights/u);
  assert.match(app.summary(), /Budget remaining/u);
});

test("workplace hybrid preset loads a valid three-group office policy", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "workplace-hybrid");
  app.click("#load-preset");
  assert.match(app.title(), /Workplace Hybrid: office presence policy/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Weekly office presence/u);
  assert.match(app.clauses(), /Core collaboration hours/u);
  assert.match(app.clauses(), /Desk assignment/u);
  assert.match(app.clauses(), /On-site staff|data-group-id="onsite"|onsite/u);
});

test("show workshop tour reopens the first-run coach after it was dismissed", async () => {
  const storage = new Map([["smallest-agreement:coach:v1", "dismissed"]]);
  const app = await savedWorkbench(storage);
  assert.equal(app.coachHidden(), true);
  app.click("#coach-again");
  assert.equal(app.coachHidden(), false);
  app.click("#coach-skip");
  assert.equal(app.coachHidden(), true);
  assert.equal(storage.get("smallest-agreement:coach:v1"), "dismissed");
});

test("clause notes persist on the worksheet and can be undone without changing search inputs otherwise", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause notes");
  app.edit("clause-note", "Ask about lighting.", { field: "clause-note", clauseId: "path" });
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.find((clause) => clause.id === "path").note, "Ask about lighting.");
  assert.match(app.clauses(), /Facilitator note/u);
  assert.match(app.ballot(), /Facilitator note: Ask about lighting\./u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "path").note, undefined);
});

test("printable worksheet lists every clause option without recording a vote", async () => {
  const app = await savedWorkbench(new Map());
  assert.match(app.ballot(), /Neighbourhood Plan: the shared green/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Close at 20:00 every day \(original\)/u);
  assert.match(app.ballot(), /ballot-box/u);
});

test("moving a clause changes documented tie-breaker order and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause order");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.clickAction("move-clause", { clauseId: "hours", direction: "down" });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses[0].id, before.clauses[1].id);
  assert.equal(after.clauses[1].id, "hours");
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].id, "hours");
});

test("duplicate option copies an alternative's scores and cost with a new identifier", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for option copies");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const source = before.clauses[0].options[1];
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: source.id });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const copy = after.clauses[0].options.at(-1);
  assert.equal(after.clauses[0].options.length, before.clauses[0].options.length + 1);
  assert.equal(copy.original, false);
  assert.equal(copy.id === source.id, false);
  assert.equal(copy.label, `${source.label} (copy)`);
  assert.equal(copy.changeCost, source.changeCost);
  assert.deepEqual(copy.support, source.support);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.length, before.clauses[0].options.length);
});

test("duplicate group copies weight and support scores with a unique id and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for group copies");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const source = before.groups[0];
  app.clickAction("duplicate-group", { groupId: source.id });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, before.groups.length + 1);
  const copy = after.groups[1];
  assert.equal(copy.id === source.id, false);
  assert.equal(copy.name, `${source.name} (copy)`);
  assert.equal(copy.weight, source.weight);
  assert.equal(after.clauses[0].options[0].support[copy.id], before.clauses[0].options[0].support[source.id]);
  assert.match(app.groups(), /Duplicate group/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("duplicate clause copies options and locks with new identifiers and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for duplication");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.clickAction("duplicate-clause", { clauseId: "hours" });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, before.clauses.length + 1);
  assert.equal(after.clauses[1].title, "Park access hours (copy)");
  assert.equal(after.clauses[1].id === "hours", false);
  assert.equal(after.clauses[1].options[0].id === "hours-original", false);
  assert.equal(after.clauses[1].options[0].label, before.clauses[0].options[0].label);
  assert.match(app.clauses(), /Park access hours \(copy\)/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
});

test("clause filter matches title or option labels without changing the stored draft", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterClauses("zzzz-no-match");
  assert.match(app.clauses(), /No clauses match this filter/u);
  assert.match(app.filterStatus(), /No clauses match this filter/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterClauses("Park access");
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  app.filterClauses("clean-up bond");
  assert.match(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
});

test("clause filter live region announces when no clauses match", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="clause-filter-status"[^>]*role="status"/u);
  assert.match(html, /id="clause-filter-status"[^>]*aria-live="polite"/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.filterStatus(), "");
  app.filterClauses("no-such-clause-zzzz");
  assert.match(app.filterStatus(), /No clauses match this filter/u);
  app.filterClauses("");
  assert.equal(app.filterStatus(), "");
});

test("side-by-side pins original, solver, and custom package columns", async () => {
  const app = await savedWorkbench(new Map());
  assert.match(app.sideBySide(), /Current original/u);
  assert.match(app.sideBySide(), /Solver recommendation/u);
  assert.match(app.sideBySide(), /Custom package/u);
  assert.match(app.sideBySide(), /Custom approval/u);
  assert.match(app.sideBySide(), /Close at 20:00 every day/u);
  assert.match(app.sideBySide(), /Lock recommended package/u);
  app.changeManual("hours", "hours-pilot");
  assert.match(app.sideBySide(), /Trial a 21:00 Friday close for three months/u);
  assert.match(app.sideBySide(), /\(custom\)/u);
});

test("locking a package applies every clause lock in one undoable step", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for package locks");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(before.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  const optionIds = before.clauses.map((clause) => clause.options[1].id);
  app.clickAction("lock-package", { optionIds: optionIds.join("|") });
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.deepEqual(after.clauses.map((clause) => clause.lockedOptionId), optionIds);
  assert.match(app.message(), /Locked every clause to that package/u);
  app.click("#undo-button");
  const restored = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(restored.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  app.clickAction("lock-package", { optionIds: "missing" });
  assert.match(app.message(), /Could not lock that package/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.every((clause) => clause.lockedOptionId === undefined), true);
});

test("near-miss explorer can sort closest misses by cost or approval gap", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Near miss sort workshop",
    threshold: 90,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "cheap", label: "Cheap miss", original: false, changeCost: 1, support: { g: 50 } },
      { id: "near", label: "Near miss", original: false, changeCost: 5, support: { g: 80 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  const byGap = app.nearMisses();
  assert.match(byGap, /Closest misses/u);
  assert.ok(byGap.indexOf("Near miss") < byGap.indexOf("Cheap miss"));
  app.sortNearMisses("change_cost");
  const byCost = app.nearMisses();
  assert.ok(byCost.indexOf("Cheap miss") < byCost.indexOf("Near miss"));
  app.sortNearMisses("approval_gap");
  assert.ok(app.nearMisses().indexOf("Near miss") < app.nearMisses().indexOf("Cheap miss"));
});
