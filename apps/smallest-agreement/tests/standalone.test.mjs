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
  assert.match(html, /Import groups CSV/u);
  assert.match(html, /id="groups-import-file"/u);
  assert.match(html, /Import clauses CSV/u);
  assert.match(html, /id="clauses-import-file"/u);
  assert.match(html, /Try this option/u);
  assert.match(html, /Leave one group out/u);
  assert.match(html, /id="coach-overlay"/u);
  assert.match(html, /id="shortcut-overlay"/u);
  assert.match(html, /Focus the clause filter/u);
  assert.match(html, /<kbd>\/<\/kbd> Focus the clause filter/u);
  assert.match(html, /Focus Add group/u);
  assert.match(html, /Jump to the first locked clause/u);
  assert.match(html, /<kbd>v<\/kbd> Toggle the veto-only group filter/u);
  assert.match(html, /<kbd>b<\/kbd> Jump to the first veto-blocker highlight, or the veto list/u);
  assert.match(html, /<kbd>g<\/kbd> Focus the participant groups heading or the first group card/u);
  assert.match(html, /<kbd>c<\/kbd> Jump to the change-budget field/u);
  assert.match(html, /<kbd>p<\/kbd> Print the facilitator pack/u);
  assert.match(html, /<kbd>k<\/kbd> Jump to the first unlocked clause card, or the lock controls/u);
  assert.match(html, /<kbd>t<\/kbd> Jump to the approval threshold field/u);
  assert.match(html, /<kbd>a<\/kbd> Focus Add clause/u);
  assert.match(html, /<kbd>w<\/kbd> Jump to group weights or renormalize controls/u);
  assert.match(html, /<kbd>m<\/kbd> Jump to remaining change-budget or cost margin/u);
  assert.match(html, /<kbd>d<\/kbd> Jump to the first group below its support floor, or the groups heading/u);
  assert.match(html, /<kbd>o<\/kbd> Jump to the first recommended-package option card, or the clauses heading/u);
  assert.match(html, /<kbd>j<\/kbd> Copy remaining change-budget as one-line Markdown/u);
  assert.match(html, /<kbd>x<\/kbd> Focus the JSON export control/u);
  assert.match(html, /<kbd>h<\/kbd> Jump to the workshop method \/ How it works heading/u);
  assert.match(html, /<kbd>i<\/kbd> Copy original versus recommended labels and costs as compact Markdown/u);
  assert.match(html, /<kbd>q<\/kbd> Jump to the first clause that differs from the recommendation, or the clauses heading/u);
  assert.match(html, /<kbd>y<\/kbd> Jump to the first veto group card, or the groups heading/u);
  assert.match(html, /<kbd>z<\/kbd> Jump to the numeric approval threshold field, or the method heading/u);
  assert.match(html, /<kbd>,<\/kbd> Copy the recommended package option count as one-line Markdown/u);
  assert.match(html, /<kbd>\.<\/kbd> Jump to the first locked clause card, or the clauses heading/u);
  assert.match(html, /<kbd>;<\/kbd> Copy the current lock count as one-line Markdown/u);
  assert.match(html, /id="method-heading"/u);
  assert.match(html, /id="find-agreement"/u);
  assert.match(html, /Side-by-side package/u);
  assert.match(html, /Lock recommended package/u);
  assert.match(html, /Lock this option/u);
  assert.match(html, /data-action="toggle-clause-lock"/u);
  assert.match(html, /id="clear-locks"/u);
  assert.match(html, /Clear all locks/u);
  assert.match(html, /veto-blocking/u);
  assert.match(html, /id="near-miss-sort"/u);
  assert.match(html, /Lock this package/u);
  assert.match(html, /workplace-hybrid/u);
  assert.match(html, /club-constitution/u);
  assert.match(html, /library-quiet-hours/u);
  assert.match(html, /sports-fixture-night/u);
  assert.match(html, /market-stall-hours/u);
  assert.match(html, /shared-bike-shed/u);
  assert.match(html, /street-stall-lighting/u);
  assert.match(html, /hall-hire-hours/u);
  assert.match(html, /community-garden-watering/u);
  assert.match(html, /id="clause-filter"/u);
  assert.match(html, /id="clause-filter-status"/u);
  assert.match(html, /id="veto-groups-only"/u);
  assert.match(html, /Show veto groups only/u);
  assert.match(html, /id="locked-clauses-only"/u);
  assert.match(html, /Show locked clauses only/u);
  assert.match(html, /id="hide-unlocked-clauses"/u);
  assert.match(html, /Hide unlocked clauses/u);
  assert.match(html, /id="changed-clauses-only"/u);
  assert.match(html, /Show clauses that differ from the recommendation/u);
  assert.match(html, /id="over-budget-clauses-only"/u);
  assert.match(html, /Show clauses whose cheapest remaining change exceeds remaining budget/u);
  assert.match(html, /id="no-cheaper-remaining-clauses-only"/u);
  assert.match(html, /Show clauses with no remaining cheaper option than the recommendation/u);
  assert.match(html, /id="below-floor-groups-only"/u);
  assert.match(html, /Show groups below their support floor/u);
  assert.match(html, /id="hide-groups-at-floor"/u);
  assert.match(html, /Hide groups currently meeting their support floor/u);
  assert.match(html, /id="hide-groups-without-floors"/u);
  assert.match(html, /Hide groups that have no support floor/u);
  assert.match(html, /id="veto-groups-status"/u);
  assert.match(html, /aria-live="polite"/u);
  assert.match(html, /id="support-drop-range"/u);
  assert.match(html, /id="printable-ballot"/u);
  assert.match(html, /Print facilitator pack/u);
  assert.match(html, /Print redacted/u);
  assert.match(html, /id="print-redacted-button"/u);
  assert.match(html, /Facilitator pack\. The workshop tour is hidden/u);
  assert.match(html, /one-line lock count on the worksheet/u);
  assert.match(html, /Discussion worksheet/u);
  assert.match(html, /Facilitator note \(optional\)/u);
  assert.match(html, /Duplicate group/u);
  assert.match(html, /Reset support to blank/u);
  assert.match(html, /data-action="reset-group-support"/u);
  assert.match(html, /Duplicate clause/u);
  assert.match(html, /id="worksheet-button"/u);
  assert.match(html, /id="worksheet-csv-button"/u);
  assert.match(html, /id="export-workspace-button"/u);
  assert.match(html, /Export workspace JSON/u);
  assert.match(html, /id="export-locks-button"/u);
  assert.match(html, /Export locks JSON/u);
  assert.match(html, /id="import-locks-button"/u);
  assert.match(html, /Import locks JSON/u);
  assert.match(html, /id="locks-import-file"/u);
  assert.match(html, /id="clause-density"/u);
  assert.match(html, /id="copy-veto-button"/u);
  assert.match(html, /Copy veto blockers/u);
  assert.match(html, /id="copy-packages-table-button"/u);
  assert.match(html, /Copy package table/u);
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /Copy group support/u);
  assert.match(html, /id="group-support-fallback"/u);
  assert.match(html, /id="copy-remaining-budget-button"/u);
  assert.match(html, /Copy remaining budget/u);
  assert.match(html, /id="remaining-budget-fallback"/u);
  assert.match(html, /id="copy-approval-threshold-button"/u);
  assert.match(html, /Copy approval threshold/u);
  assert.match(html, /id="approval-threshold-fallback"/u);
  assert.match(html, /id="copy-original-versus-recommended-button"/u);
  assert.match(html, /Copy original versus recommended/u);
  assert.match(html, /id="original-versus-recommended-fallback"/u);
  assert.match(html, /id="package-markdown-fallback"/u);
  assert.match(html, /id="copy-option-count-button"/u);
  assert.match(html, /Copy option count/u);
  assert.match(html, /id="option-count-fallback"/u);
  assert.match(html, /id="copy-locks-button"/u);
  assert.match(html, /Copy current locks/u);
  assert.match(html, /id="locks-markdown-fallback"/u);
  assert.match(html, /id="copy-lock-count-button"/u);
  assert.match(html, /Copy lock count/u);
  assert.match(html, /id="lock-count-fallback"/u);
  assert.match(html, /id="copy-change-cost-button"/u);
  assert.match(html, /Copy change-cost table/u);
  assert.match(html, /id="change-cost-csv-fallback"/u);
  assert.match(html, /id="package-table-fallback"/u);
  assert.match(html, /id="clause-paste"/u);
  assert.match(html, /Paste clause options TSV or CSV/u);
  assert.match(html, /id="clause-paste-button"/u);
  assert.match(html, /id="groups-paste"/u);
  assert.match(html, /Paste participant groups TSV or CSV/u);
  assert.match(html, /id="groups-paste-button"/u);
  assert.match(html, /id="file-compare-heading"/u);
  assert.match(html, /id="compare-files-button"/u);
  assert.match(html, /id="coach-again"/u);
  assert.match(html, /Duplicate option/u);
  assert.match(html, /Move up/u);
  assert.match(html, /id="weight-shares"/u);
  assert.match(html, /id="weight-renorm"/u);
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
  let focusedSelector = "";
  const canvasContext = { setTransform() {}, clearRect() {}, fillRect() {}, fillText() {} };
  const element = (selector) => {
    if (!elements.has(selector)) {
      const node = {
        value: "",
        textContent: "",
        innerHTML: "",
        className: "",
        clientWidth: 400,
        append() {},
        replaceChildren() {},
        setAttribute() {},
        events: new Map(),
        addEventListener(name, callback) { this.events.set(name, callback); },
        getContext: () => canvasContext,
        focus() { focusedSelector = selector; },
        classList: {
          toggle(name, force) {
            const names = new Set((node.className || "").split(/\s+/u).filter(Boolean));
            if (force) names.add(name);
            else names.delete(name);
            node.className = [...names].join(" ");
          },
        },
      };
      elements.set(selector, node);
    }
    return elements.get(selector);
  };
  const clipboard = { text: "", blocked: false, writeText(value) {
    if (this.blocked) return Promise.reject(new Error("clipboard blocked"));
    this.text = value;
    return Promise.resolve();
  } };
  let printCalls = 0;
  const context = vm.createContext({ console, TextEncoder, TextDecoder, Uint8Array, atob,
    document: {
      querySelector: element,
      createElement: (tag) => element(Symbol(tag)),
      querySelectorAll: () => [],
      addEventListener: (name, callback) => documentEvents.set(name, callback),
    },
    window: {
      devicePixelRatio: 1,
      addEventListener() {},
      navigator: { clipboard },
      print() { printCalls += 1; },
    },
    navigator: { clipboard },
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
    clauseDensityClass: () => element("#clauses-editor").className || "",
    setDensity: (value) => {
      const target = element("#clause-density");
      target.value = value;
      target.events.get("change")({ target: { value } });
    },
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
    importGroupsCsv: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "groups.csv",
      };
      await element("#groups-import-file").events.get("change")({ target });
    },
    importClausesCsv: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "clauses.csv",
      };
      await element("#clauses-import-file").events.get("change")({ target });
    },
    pasteClauses: (value) => { element("#clause-paste").value = value; },
    pasteGroups: (value) => { element("#groups-paste").value = value; },
    importLocksJson: async (contents, { size } = {}) => {
      const target = {
        files: [{ size: size ?? contents.length, text: async () => contents }],
        value: "locks.json",
      };
      await element("#locks-import-file").events.get("change")({ target });
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
    filterVetoGroups: (checked) => {
      const target = element("#veto-groups-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    vetoGroupsStatus: () => element("#veto-groups-status").textContent,
    filterLockedClauses: (checked) => {
      const target = element("#locked-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideUnlockedClauses: (checked) => {
      const target = element("#hide-unlocked-clauses");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterChangedClauses: (checked) => {
      const target = element("#changed-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterOverBudgetClauses: (checked) => {
      const target = element("#over-budget-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterNoCheaperRemainingClauses: (checked) => {
      const target = element("#no-cheaper-remaining-clauses-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterBelowFloorGroups: (checked) => {
      const target = element("#below-floor-groups-only");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsAtFloor: (checked) => {
      const target = element("#hide-groups-at-floor");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    filterHideGroupsWithoutFloors: (checked) => {
      const target = element("#hide-groups-without-floors");
      target.checked = checked;
      target.events.get("change")({ target: { checked } });
    },
    ballot: () => element("#ballot-body").innerHTML,
    shares: () => element("#weight-shares").innerHTML,
    coalition: () => element("#coalition-table").innerHTML,
    constraints: () => element("#constraint-checks").innerHTML,
    weightRenorm: () => element("#weight-renorm").innerHTML,
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
    focused: () => focusedSelector,
    clipboardText: () => clipboard.text,
    blockClipboard: () => { clipboard.blocked = true; },
    printCalls: () => printCalls,
    packageTable: () => element("#package-table-fallback").value,
    packageMarkdown: () => element("#package-markdown-fallback").value,
    groupSupport: () => element("#group-support-fallback").value,
    remainingBudget: () => element("#remaining-budget-fallback").value,
    approvalThreshold: () => element("#approval-threshold-fallback").value,
    optionCount: () => element("#option-count-fallback").value,
    originalVersusRecommended: () => element("#original-versus-recommended-fallback").value,
    locksMarkdown: () => element("#locks-markdown-fallback").value,
    lockCount: () => element("#lock-count-fallback").value,
    changeCostCsv: () => element("#change-cost-csv-fallback").value,
    fileComparison: () => element("#file-comparison").innerHTML,
    compareFiles: async (left, right) => {
      await element("#compare-file-left").events.get("change")({
        target: { files: [{ size: left.length, text: async () => left }], value: "left.json" },
      });
      await element("#compare-file-right").events.get("change")({
        target: { files: [{ size: right.length, text: async () => right }], value: "right.json" },
      });
      await element("#compare-files-button").events.get("click")();
    },
    clearFocus: () => { focusedSelector = ""; },
    keydown: (key, target = { tagName: "BODY", isContentEditable: false }) => {
      documentEvents.get("keydown")({
        key,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        preventDefault() {},
        target,
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

test("club constitution preset loads a distinct synthetic membership-meeting workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  assert.match(app.title(), /Club Constitution: membership meetings/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Meeting quorum/u);
  assert.match(app.clauses(), /Proxy votes/u);
  assert.match(app.clauses(), /Guest speakers at general meetings/u);
  assert.match(app.groups(), /Officers/u);
  assert.match(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
});

test("library quiet hours preset loads a distinct synthetic reading-room workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "library-quiet-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Library Quiet Hours: shared reading rooms/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Evening hours/u);
  assert.match(app.clauses(), /Children&#39;s area sound rules/u);
  assert.match(app.clauses(), /After-hours events/u);
  assert.match(app.groups(), /Readers/u);
  assert.match(app.groups(), /Families/u);
  assert.match(app.groups(), /Library staff/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Meeting quorum/u);
});

test("sports fixture night preset loads a distinct synthetic match-evening workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "sports-fixture-night");
  app.click("#load-preset");
  assert.match(app.title(), /Sports Fixture Night: match end-time, floodlights, and parking/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Match end-time/u);
  assert.match(app.clauses(), /Floodlights/u);
  assert.match(app.clauses(), /Match-night parking/u);
  assert.match(app.groups(), /Members/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Council rangers/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Weekly office presence/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Meeting quorum/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
});

test("market stall hours preset loads a distinct synthetic stall workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "market-stall-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Market stall hours: open hours, packing, and neighbour noise/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Stall open hours/u);
  assert.match(app.clauses(), /Packing and pack-down/u);
  assert.match(app.clauses(), /Neighbour noise/u);
  assert.match(app.groups(), /Stallholders/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
});

test("shared bike shed preset loads a distinct synthetic neighbour workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "shared-bike-shed");
  app.click("#load-preset");
  assert.match(app.title(), /Shared bike shed: access hours, lighting, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Access hours/u);
  assert.match(app.clauses(), /Shed lighting/u);
  assert.match(app.clauses(), /Lock-up/u);
  assert.match(app.groups(), /Bike users/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
});

test("street stall lighting preset loads a distinct synthetic lighting workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "street-stall-lighting");
  app.click("#load-preset");
  assert.match(app.title(), /Street stall lighting: lighting hours, glare, and pack-down/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Lighting hours/u);
  assert.match(app.clauses(), /Glare/u);
  assert.match(app.clauses(), /Pack-down lighting/u);
  assert.match(app.groups(), /Stallholders/u);
  assert.match(app.groups(), /Nearby residents/u);
  assert.match(app.groups(), /Council officers/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
});

test("hall hire hours preset loads a distinct synthetic hall workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "hall-hire-hours");
  app.click("#load-preset");
  assert.match(app.title(), /Hall hire hours: close time, PA volume, and clean-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Close time/u);
  assert.match(app.clauses(), /PA volume/u);
  assert.match(app.clauses(), /Clean-up/u);
  assert.match(app.groups(), /Hirers/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.title(), /Community garden watering/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Stallholders/u);
  assert.doesNotMatch(app.groups(), /Nearby residents/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Council officers/u);
  assert.doesNotMatch(app.groups(), /Plot-holders/u);
  assert.doesNotMatch(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.clauses(), /Watering hours/u);
  assert.doesNotMatch(app.clauses(), /Hose noise/u);
});

test("community garden watering preset loads a distinct synthetic watering workshop", async () => {
  const app = await savedWorkbench(new Map());
  app.field("#preset-select", "community-garden-watering");
  app.click("#load-preset");
  assert.match(app.title(), /Community garden watering: watering hours, hose noise, and lock-up/u);
  assert.equal(app.disabled("#export-button"), false);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.clauses(), /Watering hours/u);
  assert.match(app.clauses(), /Hose noise/u);
  assert.match(app.clauses(), /Garden lock-up/u);
  assert.match(app.groups(), /Plot-holders/u);
  assert.match(app.groups(), /Neighbours/u);
  assert.match(app.groups(), /Garden committee/u);
  assert.doesNotMatch(app.title(), /Hall hire hours/u);
  assert.doesNotMatch(app.title(), /Street stall lighting/u);
  assert.doesNotMatch(app.title(), /Market stall hours/u);
  assert.doesNotMatch(app.title(), /Shared bike shed/u);
  assert.doesNotMatch(app.title(), /Sports Fixture Night/u);
  assert.doesNotMatch(app.title(), /Neighbourhood Plan/u);
  assert.doesNotMatch(app.title(), /Library Quiet Hours/u);
  assert.doesNotMatch(app.title(), /Open Source Policy/u);
  assert.doesNotMatch(app.title(), /Association Budget/u);
  assert.doesNotMatch(app.title(), /Protected Access/u);
  assert.doesNotMatch(app.title(), /Workplace Hybrid/u);
  assert.doesNotMatch(app.title(), /Club Constitution/u);
  assert.doesNotMatch(app.clauses(), /Close time/u);
  assert.doesNotMatch(app.clauses(), /PA volume/u);
  assert.doesNotMatch(app.clauses(), /Clean-up/u);
  assert.doesNotMatch(app.clauses(), /Lighting hours/u);
  assert.doesNotMatch(app.clauses(), /Stall open hours/u);
  assert.doesNotMatch(app.clauses(), /Access hours/u);
  assert.doesNotMatch(app.clauses(), /Match end-time/u);
  assert.doesNotMatch(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Evening hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.groups(), /Hirers/u);
  assert.doesNotMatch(app.groups(), /Hall committee/u);
  assert.doesNotMatch(app.groups(), /Stallholders/u);
  assert.doesNotMatch(app.groups(), /Nearby residents/u);
  assert.doesNotMatch(app.groups(), /Market officers/u);
  assert.doesNotMatch(app.groups(), /Building managers/u);
  assert.doesNotMatch(app.groups(), /Council officers/u);
});

test("keyboard f focuses the clause filter unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("f");
  assert.equal(app.focused(), "#clause-filter");
  app.clearFocus();
  app.keydown("f", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("f", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("F");
  assert.equal(app.focused(), "#clause-filter");
});

test("keyboard slash focuses the clause filter unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("/");
  assert.equal(app.focused(), "#clause-filter");
  app.clearFocus();
  app.keydown("/", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("/", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("/", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
});

test("keyboard n focuses Add group unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("n");
  assert.equal(app.focused(), "#add-group");
  app.clearFocus();
  app.keydown("n", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("n", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("N");
  assert.equal(app.focused(), "#add-group");
});

test("keyboard l jumps to the first locked clause unless an input is active", async () => {
  const app = await savedWorkbench(new Map());
  app.keydown("l");
  assert.equal(app.focused(), "#clear-locks");
  app.clearFocus();
  app.keydown("l", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("l", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clearFocus();
  app.keydown("L");
  assert.equal(app.focused(), '[data-field="clause-lock"][data-clause-id="hours"]');
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
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
});

test("print facilitator pack keeps pin columns, notes, and veto highlights while hiding the coach", async () => {
  const html = await standaloneBytes();
  assert.match(html, /Print facilitator pack/u);
  assert.match(html, /Print redacted/u);
  assert.match(html, /Facilitator pack\. The workshop tour is hidden/u);
  assert.match(html, /\.package-table-fallback-label, #package-table-fallback, #package-table-fallback-note, \.locks-markdown-fallback-label, #locks-markdown-fallback, #locks-markdown-fallback-note, \.lock-count-fallback-label, #lock-count-fallback, #lock-count-fallback-note, \.change-cost-csv-fallback-label, #change-cost-csv-fallback, #change-cost-csv-fallback-note, \.clause-paste-label, #clause-paste, #clause-paste-note, \.groups-paste-label, #groups-paste, #groups-paste-note, \.package-markdown-fallback-label, #package-markdown-fallback, #package-markdown-fallback-note, \.option-count-fallback-label, #option-count-fallback, #option-count-fallback-note, \.original-versus-recommended-fallback-label, #original-versus-recommended-fallback, #original-versus-recommended-fallback-note, \.group-support-fallback-label, #group-support-fallback, #group-support-fallback-note, \.remaining-budget-fallback-label, #remaining-budget-fallback, #remaining-budget-fallback-note, \.approval-threshold-fallback-label, #approval-threshold-fallback, #approval-threshold-fallback-note \{ display: none !important; \}/u);
  assert.match(html, /\.locked-clauses-filter, #locked-clauses-filter-note, \.hide-unlocked-clauses-filter, #hide-unlocked-clauses-filter-note, \.changed-clauses-filter, #changed-clauses-filter-note, \.over-budget-clauses-filter, #over-budget-clauses-filter-note, \.no-cheaper-remaining-clauses-filter, #no-cheaper-remaining-clauses-filter-note/u);
  assert.match(html, /\.below-floor-groups-filter, #below-floor-groups-filter-note/u);
  assert.match(html, /\.hide-groups-at-floor-filter, #hide-groups-at-floor-filter-note/u);
  assert.match(html, /\.hide-groups-without-floors-filter, #hide-groups-without-floors-filter-note/u);
  assert.match(html, /#side-by-side, #printable-ballot, #constraint-checks, #coalition-table \{ display: block !important; \}/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for print notes");
  app.edit("clause-note", "Ask about lighting.", { field: "clause-note", clauseId: "path" });
  assert.match(app.sideBySide(), /Facilitator note: Ask about lighting\./u);
  assert.match(app.ballot(), /Facilitator note: Ask about lighting\./u);
  assert.equal(app.coachHidden(), false);
});

test("print facilitator pack includes recommended package option labels", async () => {
  const html = await standaloneBytes();
  assert.match(html, /recommended package option labels/u);
  const draft = {
    title: "Print labels workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "one", title: "Hours", options: [
        { id: "one-original", label: "Keep original hours", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Extend hours", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Cut hours", original: false, changeCost: 2, support: { g: 20 } },
      ] },
    ],
  };
  const storage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const app = await savedWorkbench(storage);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.match(app.ballot(), /Extend hours \(recommended\)/u);
  assert.match(app.ballot(), /Keep original hours \(original\)/u);
  assert.doesNotMatch(app.ballot(), /Keep original hours \(original\) \(recommended\)/u);
  assert.match(app.ballot(), /Participant groups: Residents/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.match(app.ballot(), /Participant groups: Residents/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1/u);
  assert.match(app.ballot(), /Recommended: Extend hours/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
});

test("print facilitator pack includes remaining change-budget without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /remaining change-budget, the numeric approval threshold on the worksheet, and a one-line lock count/u);
  assert.match(html, /not a legal appropriation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for remaining-budget print");
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  assert.match(app.ballot(), /not a legal appropriation/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /leftover change-budget is unlimited/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const leftover = {
    title: "Print leftover workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep", options: [
        { id: "keep-original", label: "Keep original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend", options: [
        { id: "spend-original", label: "Keep original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const leftoverStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(leftover)]]);
  const leftoverApp = await savedWorkbench(leftoverStorage);
  assert.match(leftoverApp.ballot(), /Remaining change-budget: 1\.0/u);
  leftoverApp.click("#print-redacted-button");
  assert.match(leftoverApp.ballot(), /Participant groups: Group 1/u);
  assert.match(leftoverApp.ballot(), /Remaining change-budget: 1\.0/u);
  assert.doesNotMatch(leftoverApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(leftoverStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");

  const exhausted = {
    title: "Print exhausted workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(exhausted)]]));
  assert.match(spent.ballot(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  assert.match(spent.ballot(), /not a legal appropriation/u);
});

test("print facilitator pack includes a one-line lock count without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /one-line lock count on the worksheet/u);
  assert.match(html, /not a legal hold/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for lock-count print");
  assert.match(app.ballot(), /Current lock count: 0/u);
  assert.match(app.ballot(), /not a legal hold/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Current lock count: 0/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /Current lock count: 0/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.some((clause) => clause.lockedOptionId), false);

  const locked = {
    title: "Print lock count workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [
      { id: "one", title: "Hours", lockedOptionId: "one-alt", options: [
        { id: "one-original", label: "Keep original hours", original: true, changeCost: 0, support: { g: 90 } },
        { id: "one-alt", label: "Extend hours", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Cut hours", original: false, changeCost: 2, support: { g: 20 } },
      ] },
      { id: "two", title: "Path", options: [
        { id: "two-original", label: "Keep original path", original: true, changeCost: 0, support: { g: 90 } },
        { id: "two-alt", label: "Warm path", original: false, changeCost: 1, support: { g: 40 } },
        { id: "two-other", label: "Motion path", original: false, changeCost: 2, support: { g: 20 } },
      ] },
    ],
  };
  const lockedStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(locked)]]);
  const lockedApp = await savedWorkbench(lockedStorage);
  assert.match(lockedApp.ballot(), /Current lock count: 1\. Locks are draft choices, not a legal hold/u);
  lockedApp.click("#print-redacted-button");
  assert.match(lockedApp.ballot(), /Participant groups: Group 1/u);
  assert.match(lockedApp.ballot(), /Current lock count: 1/u);
  assert.doesNotMatch(lockedApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(lockedStorage.get("smallest-agreement:proposal:v1")).clauses[0].lockedOptionId, "one-alt");
});

test("print facilitator pack includes the numeric approval threshold without changing the saved draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /numeric approval threshold on the worksheet/u);
  assert.match(html, /not a legal quorum/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for threshold print");
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  assert.match(app.ballot(), /not a legal quorum/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.match(app.ballot(), /Approval threshold: 68\.0%/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).threshold, 68);

  const exact = {
    title: "Print threshold workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Residents", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 40 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const exactStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(exact)]]);
  const exactApp = await savedWorkbench(exactStorage);
  assert.match(exactApp.ballot(), /Approval threshold: 70\.0%\. This is a number you entered, not a legal quorum/u);
  exactApp.click("#print-redacted-button");
  assert.match(exactApp.ballot(), /Participant groups: Group 1/u);
  assert.match(exactApp.ballot(), /Approval threshold: 70\.0%/u);
  assert.doesNotMatch(exactApp.ballot(), /Residents/u);
  assert.equal(JSON.parse(exactStorage.get("smallest-agreement:proposal:v1")).groups[0].name, "Residents");
  assert.equal(JSON.parse(exactStorage.get("smallest-agreement:proposal:v1")).threshold, 70);
});

test("print redacted replaces group display names without changing the saved draft", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for redacted print");
  app.edit("group-floor", 40, { field: "group-floor", groupId: "residents" });
  assert.match(app.coalition(), /Residents/u);
  assert.match(app.sideBySide(), /Residents/u);
  assert.match(app.constraints(), /Residents support/u);
  assert.match(app.ballot(), /Participant groups: Residents, Shopkeepers, Park stewards/u);
  assert.match(app.groups(), /Residents/u);
  app.click("#print-button");
  assert.equal(app.printCalls(), 1);
  assert.match(app.coalition(), /Residents/u);
  app.click("#print-redacted-button");
  assert.equal(app.printCalls(), 2);
  assert.match(app.coalition(), /Group 1/u);
  assert.match(app.coalition(), /Group 2/u);
  assert.match(app.coalition(), /Group 3/u);
  assert.doesNotMatch(app.coalition(), /Residents/u);
  assert.match(app.sideBySide(), /Group 1/u);
  assert.doesNotMatch(app.sideBySide(), /Residents/u);
  assert.match(app.constraints(), /Group 1 support/u);
  assert.doesNotMatch(app.constraints(), /Residents/u);
  assert.match(app.ballot(), /Participant groups: Group 1, Group 2, Group 3/u);
  assert.doesNotMatch(app.ballot(), /Residents/u);
  assert.match(app.groups(), /Residents/u);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.groups[0].name, "Residents");
  assert.equal(saved.groups[1].name, "Shopkeepers");
  assert.equal(saved.groups[2].name, "Park stewards");
});

test("moving a clause changes documented tie-breaker order and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause order");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.clickAction("move-clause", { clauseId: "hours", direction: "up" });
  assert.match(app.message(), /Could not move that clause/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].id, "hours");
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
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: source.id });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.at(-1).label, `${source.label} (copy 2)`);
  app.clickAction("duplicate-option", { clauseId: "hours", optionId: "hours-original" });
  const fromOriginal = JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options.at(-1);
  assert.equal(fromOriginal.original, false);
  assert.equal(fromOriginal.changeCost, 0);
  app.click("#undo-button");
  app.click("#undo-button");
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
  app.clickAction("duplicate-group", { groupId: source.id });
  const names = JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.map((group) => group.name);
  assert.equal(names.includes(`${source.name} (copy)`), true);
  assert.equal(names.includes(`${source.name} (copy 2)`), true);
  assert.equal(new Set(names).size, names.length);
  app.click("#undo-button");
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

test("hide-unlocked-clauses hides unlocked cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-unlocked-clauses"/u);
  assert.match(html, /Hide unlocked clauses/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideUnlockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding unlocked clauses/u);
  assert.match(app.filterStatus(), /No clauses remain after hiding unlocked clauses/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No clauses remain after hiding unlocked clauses/u);
  app.filterLockedClauses(false);
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  app.filterChangedClauses(false);
  app.filterHideUnlockedClauses(false);
  assert.match(app.clauses(), /Park access hours/u);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.filterHideUnlockedClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, true);
  assert.equal(Object.hasOwn(JSON.parse(storage.get("smallest-agreement:proposal:v1")), "hideUnlockedClauses"), false);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.length, 3);
  app.clearFocus();
  app.keydown("k");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="market"]');
  assert.match(app.clauses(), /Weekend market use/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, false);
});

test("locked-clause filter hides unlocked cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="locked-clauses-only"/u);
  assert.match(html, /Show locked clauses only/u);
  assert.match(html, /draft choice, not a recorded vote/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.match(app.filterStatus(), /No locked clauses match this filter/u);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.match(app.ballot(), /Weekend market use/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterLockedClauses(false);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.doesNotMatch(app.clauses(), /Weekend market use/u);
  assert.doesNotMatch(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 1 of 3 clauses/u);
  assert.match(app.ballot(), /Weekend market use/u);
  const saved = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(saved.clauses.length, 3);
  assert.equal(saved.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
});

test("changed-clause filter hides unchanged cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="changed-clauses-only"/u);
  assert.match(html, /Show clauses that differ from the recommendation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  assert.match(app.filterStatus(), /No clauses differ between the original and recommended packages/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Changed clause filter workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "Keep this", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 90 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 1, support: { g: 40 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 2, support: { g: 20 } },
      ] },
      { id: "two", title: "Change this", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 40 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 1, support: { g: 90 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filtered = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  filtered.filterChangedClauses(true);
  assert.match(filtered.clauses(), /Change this/u);
  assert.doesNotMatch(filtered.clauses(), /Keep this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Keep this/u);
});

test("over-budget clause filter hides affordable remaining changes without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="over-budget-clauses-only"/u);
  assert.match(html, /Show clauses whose cheapest remaining change exceeds remaining budget/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterOverBudgetClauses(true);
  assert.match(app.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(app.filterStatus(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Over budget filter workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep this", options: [
        { id: "keep-original", label: "Original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Costly keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend this", options: [
        { id: "spend-original", label: "Original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filtered = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /Keep this/u);
  assert.doesNotMatch(filtered.clauses(), /Spend this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Spend this/u);
  assert.doesNotMatch(filtered.alert(), /Fix the proposal/u);
  const exhausted = {
    title: "Exhausted budget filter workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "First clause", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 2, support: { g: 90 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "two", title: "Second clause", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 90 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 1, support: { g: 40 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(exhausted)]]));
  spent.filterOverBudgetClauses(true);
  assert.match(spent.clauses(), /First clause/u);
  assert.match(spent.clauses(), /Second clause/u);
  assert.match(spent.filterStatus(), /Showing 2 of 2 clauses/u);
});

test("no-cheaper-remaining clause filter hides clauses that still have a cheaper option than the recommendation", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="no-cheaper-remaining-clauses-only"/u);
  assert.match(html, /Show clauses with no remaining cheaper option than the recommendation/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterNoCheaperRemainingClauses(true);
  assert.match(app.clauses(), /Park access hours/u);
  assert.match(app.clauses(), /Weekend market use/u);
  assert.match(app.clauses(), /Path lighting/u);
  assert.match(app.filterStatus(), /Showing 3 of 3 clauses/u);
  assert.match(app.ballot(), /Park access hours/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "No cheaper remaining workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep this", options: [
        { id: "keep-original", label: "Original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Change this", options: [
        { id: "spend-original", label: "Original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterNoCheaperRemainingClauses(true);
  assert.match(filtered.clauses(), /Keep this/u);
  assert.doesNotMatch(filtered.clauses(), /Change this/u);
  assert.match(filtered.filterStatus(), /Showing 1 of 2 clauses/u);
  assert.match(filtered.ballot(), /Change this/u);
  filtered.filterLockedClauses(true);
  assert.match(filtered.clauses(), /No locked clauses match this filter/u);
  filtered.filterLockedClauses(false);
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "No cheaper remaining workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).noCheaperRemainingClausesOnly, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "noCheaperRemainingClausesOnly"), false);
  const allChanged = {
    title: "All cheaper remaining workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "one", title: "First change", options: [
        { id: "one-original", label: "Original one", original: true, changeCost: 0, support: { g: 40 } },
        { id: "one-alt", label: "Alt one", original: false, changeCost: 1, support: { g: 90 } },
        { id: "one-other", label: "Other one", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "two", title: "Second change", options: [
        { id: "two-original", label: "Original two", original: true, changeCost: 0, support: { g: 40 } },
        { id: "two-alt", label: "Alt two", original: false, changeCost: 2, support: { g: 90 } },
        { id: "two-other", label: "Other two", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const empty = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(allChanged)]]));
  empty.filterNoCheaperRemainingClauses(true);
  assert.match(empty.clauses(), /No clauses lack a remaining cheaper option than the recommendation/u);
  assert.match(empty.filterStatus(), /No clauses lack a remaining cheaper option than the recommendation/u);
  assert.match(empty.ballot(), /First change/u);
});

test("below-floor group filter hides groups that meet their floor or threshold", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="below-floor-groups-only"/u);
  assert.match(html, /Show groups below their support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterBelowFloorGroups(true);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.doesNotMatch(app.groups(), /Park stewards/u);
  assert.match(app.shares(), /Park stewards/u);
  assert.match(app.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
});

test("hide-groups-at-floor hides groups that meet a declared floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-at-floor"/u);
  assert.match(html, /Hide groups currently meeting their support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsAtFloor(true);
  assert.match(app.groups(), /Residents/u);
  assert.match(app.groups(), /Shopkeepers/u);
  assert.match(app.groups(), /Park stewards/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  const draft = {
    title: "Hide at floor workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
      { id: "short", name: "Short", weight: 1, minSupport: 90 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 80, short: 20 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 70, short: 30 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 60, short: 40 } },
    ] }],
  };
  const filteredStorage = new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]);
  const filtered = await savedWorkbench(filteredStorage);
  filtered.filterHideGroupsAtFloor(true);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.match(filtered.groups(), /Open/u);
  assert.match(filtered.groups(), /Short/u);
  assert.match(filtered.shares(), /Cleared/u);
  assert.match(filtered.vetoGroupsStatus(), /Showing 2 of 3 groups/u);
  filtered.filterLockedClauses(true);
  assert.match(filtered.clauses(), /No locked clauses match this filter/u);
  filtered.filterLockedClauses(false);
  filtered.filterOverBudgetClauses(true);
  assert.match(filtered.clauses(), /No clauses have a cheapest remaining change that exceeds the remaining budget/u);
  assert.match(filtered.groups(), /Open/u);
  assert.doesNotMatch(filtered.groups(), /data-group-id="cleared"/u);
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")).title, "Hide at floor workshop");
  assert.equal(JSON.parse(filteredStorage.get("smallest-agreement:workspace:v1")).hideGroupsAtFloor, true);
  assert.equal(Object.hasOwn(JSON.parse(filteredStorage.get("smallest-agreement:proposal:v1")), "hideGroupsAtFloor"), false);
});

test("hide-groups-without-floors hides groups with no floor without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="hide-groups-without-floors"/u);
  assert.match(html, /Hide groups that have no support floor/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterHideGroupsWithoutFloors(true);
  assert.match(app.groups(), /No groups remain after hiding groups that have no support floor/u);
  assert.match(app.shares(), /Residents/u);
  assert.match(app.shares(), /Shopkeepers/u);
  assert.match(app.shares(), /Park stewards/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterHideGroupsAtFloor(true);
  assert.match(app.groups(), /No groups remain after hiding groups that currently meet their support floor or have no support floor/u);
  app.filterHideGroupsAtFloor(false);
  app.filterLockedClauses(true);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  app.filterLockedClauses(false);
  app.filterChangedClauses(true);
  assert.match(app.clauses(), /No clauses differ between the original and recommended packages/u);
  app.filterChangedClauses(false);
  app.filterHideGroupsWithoutFloors(false);
  assert.match(app.groups(), /Residents/u);

  const protectedStorage = new Map();
  const protectedApp = await savedWorkbench(protectedStorage);
  protectedApp.field("#preset-select", "protected-access");
  protectedApp.click("#load-preset");
  const protectedBefore = protectedStorage.get("smallest-agreement:proposal:v1");
  protectedApp.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(protectedApp.groups(), /data-group-id="regular"/u);
  assert.match(protectedApp.groups(), /New participants/u);
  assert.match(protectedApp.shares(), /Regular participants/u);
  assert.match(protectedApp.vetoGroupsStatus(), /Showing 1 of 2 groups/u);
  protectedApp.filterHideGroupsAtFloor(true);
  assert.match(protectedApp.groups(), /No groups remain after hiding groups that currently meet their support floor or have no support floor/u);
  assert.match(protectedApp.shares(), /Regular participants/u);
  protectedApp.filterHideGroupsAtFloor(false);
  assert.match(protectedApp.groups(), /New participants/u);
  assert.doesNotMatch(protectedApp.groups(), /data-group-id="regular"/u);
  assert.equal(JSON.parse(protectedStorage.get("smallest-agreement:proposal:v1")).title, "Protected Access: shared workshop");
  assert.equal(JSON.parse(protectedStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, true);
  assert.equal(Object.hasOwn(JSON.parse(protectedStorage.get("smallest-agreement:proposal:v1")), "hideGroupsWithoutFloors"), false);
  assert.equal(protectedStorage.get("smallest-agreement:proposal:v1"), protectedBefore);

  const clubStorage = new Map();
  const club = await savedWorkbench(clubStorage);
  club.field("#preset-select", "club-constitution");
  club.click("#load-preset");
  club.filterHideGroupsWithoutFloors(true);
  assert.doesNotMatch(club.groups(), /data-group-id="officers"/u);
  club.clearFocus();
  club.keydown("y");
  assert.equal(club.focused(), '[data-field="group-name"][data-group-id="officers"]');
  assert.match(club.groups(), /Officers/u);
  assert.equal(JSON.parse(clubStorage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
});

test("veto-only group filter hides non-veto cards without changing the stored draft", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="veto-groups-status"[^>]*role="status"/u);
  assert.match(html, /id="veto-groups-status"[^>]*aria-live="polite"/u);
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.filterVetoGroups(true);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.vetoGroupsStatus(), /No veto groups match this filter/u);
  assert.match(app.shares(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.filterVetoGroups(false);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.filterVetoGroups(true);
  assert.match(app.groups(), /Officers/u);
  assert.doesNotMatch(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.shares(), /Members/u);
  assert.match(app.vetoGroupsStatus(), /Showing 1 of 3 groups/u);
});

test("keyboard v toggles the veto-only group filter unless an input is active", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  const before = storage.get("smallest-agreement:proposal:v1");
  app.keydown("v");
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.vetoGroupsStatus(), /No veto groups match this filter/u);
  assert.match(app.shares(), /Residents/u);
  assert.equal(storage.get("smallest-agreement:proposal:v1"), before);
  app.clearFocus();
  app.keydown("v", { tagName: "INPUT", isContentEditable: false });
  assert.match(app.groups(), /No veto groups match this filter/u);
  app.keydown("v", { tagName: "TEXTAREA", isContentEditable: false });
  assert.match(app.groups(), /No veto groups match this filter/u);
  app.keydown("v");
  assert.match(app.groups(), /Residents/u);
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.keydown("V");
  assert.match(app.groups(), /Officers/u);
  assert.doesNotMatch(app.groups(), /Club staff/u);
  assert.doesNotMatch(app.groups(), /data-group-id="members"/u);
  assert.match(app.shares(), /Members/u);
});

test("keyboard b jumps to the first veto-blocker highlight unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>b<\/kbd> Jump to the first veto-blocker highlight, or the veto list/u);
  const app = await savedWorkbench(new Map());
  app.keydown("b");
  assert.equal(app.focused(), "#constraint-checks");
  app.clearFocus();
  app.keydown("b", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("b", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto jump workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const blocked = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  assert.match(blocked.groups(), /data-veto-block="minority"/u);
  blocked.keydown("B");
  assert.equal(blocked.focused(), '[data-veto-block="minority"]');
});

test("keyboard g focuses the first group card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="groups-heading"/u);
  assert.match(html, /<kbd>g<\/kbd> Focus the participant groups heading or the first group card/u);
  const app = await savedWorkbench(new Map());
  app.keydown("g");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.clearFocus();
  app.keydown("g", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("g", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("G");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.filterVetoGroups(true);
  app.clearFocus();
  app.keydown("g");
  assert.equal(app.focused(), "#groups-heading");
});

test("keyboard c jumps to the change-budget field unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>c<\/kbd> Jump to the change-budget field/u);
  const app = await savedWorkbench(new Map());
  app.keydown("c");
  assert.equal(app.focused(), "#max-change-cost");
  app.clearFocus();
  app.keydown("c", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("c", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("C");
  assert.equal(app.focused(), "#max-change-cost");
});

test("keyboard p prints the facilitator pack unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>p<\/kbd> Print the facilitator pack/u);
  const app = await savedWorkbench(new Map());
  app.keydown("p");
  assert.equal(app.printCalls(), 1);
  app.clearFocus();
  app.keydown("p", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.printCalls(), 1);
  app.keydown("p", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.printCalls(), 1);
  app.keydown("P");
  assert.equal(app.printCalls(), 2);
});

test("keyboard k jumps to the first unlocked clause unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>k<\/kbd> Jump to the first unlocked clause card, or the lock controls/u);
  const app = await savedWorkbench(new Map());
  app.keydown("k");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="hours"]');
  app.clearFocus();
  app.keydown("k", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clickAction("toggle-clause-lock", { clauseId: "market", optionId: "market-monthly" });
  app.clickAction("toggle-clause-lock", { clauseId: "path", optionId: "path-warm" });
  app.clearFocus();
  app.keydown("K");
  assert.equal(app.focused(), "#clear-locks");
});

test("keyboard t jumps to the approval threshold field unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>t<\/kbd> Jump to the approval threshold field/u);
  assert.match(html, /id="threshold-number"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("t");
  assert.equal(app.focused(), "#threshold-number");
  app.clearFocus();
  app.keydown("t", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("t", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("t", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("T");
  assert.equal(app.focused(), "#threshold-number");
});

test("keyboard a focuses Add clause unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>a<\/kbd> Focus Add clause/u);
  assert.match(html, /id="add-clause"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("a");
  assert.equal(app.focused(), "#add-clause");
  app.clearFocus();
  app.keydown("a", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("a", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("a", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("A");
  assert.equal(app.focused(), "#add-clause");
});

test("keyboard w jumps to group weights or renormalize controls unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>w<\/kbd> Jump to group weights or renormalize controls/u);
  assert.match(html, /id="weight-renorm"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("w");
  assert.equal(app.focused(), '[data-action="preview-renorm"]');
  app.clearFocus();
  app.keydown("w", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("w", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("W");
  assert.equal(app.focused(), '[data-action="preview-renorm"]');
});

test("keyboard m jumps to remaining change-budget unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>m<\/kbd> Jump to remaining change-budget or cost margin/u);
  assert.match(html, /id="budget-remaining"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("m");
  assert.equal(app.focused(), "#budget-remaining");
  assert.match(app.summary(), /id="budget-remaining"/u);
  app.clearFocus();
  app.keydown("m", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("m", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("M");
  assert.equal(app.focused(), "#budget-remaining");
});

test("keyboard d jumps to the first group below its support floor unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>d<\/kbd> Jump to the first group below its support floor, or the groups heading/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.groups(), /data-below-floor="residents"/u);
  app.keydown("d");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  app.clearFocus();
  app.keydown("d", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("d", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("D");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="residents"]');
  const draft = {
    title: "Floor jump workshop",
    threshold: 50,
    groups: [
      { id: "cleared", name: "Cleared", weight: 1, minSupport: 40 },
      { id: "open", name: "Open", weight: 1 },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { cleared: 90, open: 90 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { cleared: 80, open: 80 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { cleared: 70, open: 70 } },
    ] }],
  };
  const cleared = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  cleared.keydown("d");
  assert.equal(cleared.focused(), "#groups-heading");
});

test("keyboard o jumps to the first recommended-package option unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>o<\/kbd> Jump to the first recommended-package option card, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.clauses(), /data-recommended-option="hours-original"/u);
  app.keydown("o");
  assert.equal(app.focused(), '[data-recommended-option="hours-original"]');
  app.clearFocus();
  app.keydown("o", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("o", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("O");
  assert.equal(app.focused(), '[data-recommended-option="hours-original"]');
  const draft = {
    title: "No recommendation jump workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  missing.keydown("o");
  assert.equal(missing.focused(), "#clauses-heading");
});

test("keyboard j copies remaining change-budget unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>j<\/kbd> Copy remaining change-budget as one-line Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown("j");
  assert.match(app.clipboardText(), /leftover change-budget is unlimited/u);
  assert.match(app.clipboardText(), /not a legal appropriation/u);
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  app.clearFocus();
  app.keydown("j", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("j", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const again = await savedWorkbench(new Map());
  again.keydown("J");
  assert.match(again.clipboardText(), /leftover change-budget is unlimited/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-remaining-budget-button");
  assert.equal(blocked.focused(), "#remaining-budget-fallback");
  blocked.clearFocus();
  blocked.keydown("j", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard y jumps to the first veto group card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>y<\/kbd> Jump to the first veto group card, or the groups heading/u);
  assert.match(html, /id="groups-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("y");
  assert.equal(app.focused(), "#groups-heading");
  app.clearFocus();
  app.keydown("y", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("y", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.field("#preset-select", "club-constitution");
  app.click("#load-preset");
  app.clearFocus();
  app.keydown("Y");
  assert.equal(app.focused(), '[data-field="group-name"][data-group-id="officers"]');
});

test("keyboard q jumps to the first clause that differs from the recommendation unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>q<\/kbd> Jump to the first clause that differs from the recommendation, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const unchanged = await savedWorkbench(new Map());
  unchanged.keydown("q");
  assert.equal(unchanged.focused(), "#clauses-heading");
  unchanged.clearFocus();
  unchanged.keydown("q", { tagName: "INPUT", isContentEditable: false });
  assert.equal(unchanged.focused(), "");
  unchanged.keydown("q", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(unchanged.focused(), "");
  const draft = {
    title: "Changed clause jump workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [
      { id: "keep", title: "Keep", options: [
        { id: "keep-original", label: "Keep original keep", original: true, changeCost: 0, support: { g: 90 } },
        { id: "keep-alt", label: "Alt keep", original: false, changeCost: 5, support: { g: 40 } },
        { id: "keep-other", label: "Other keep", original: false, changeCost: 8, support: { g: 20 } },
      ] },
      { id: "spend", title: "Spend", options: [
        { id: "spend-original", label: "Keep original spend", original: true, changeCost: 0, support: { g: 40 } },
        { id: "spend-alt", label: "Alt spend", original: false, changeCost: 2, support: { g: 90 } },
        { id: "spend-other", label: "Other spend", original: false, changeCost: 8, support: { g: 20 } },
      ] },
    ],
  };
  const changed = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  changed.keydown("Q");
  assert.equal(changed.focused(), '[data-field="clause-title"][data-clause-id="spend"]');
});

test("keyboard i copies original versus recommended labels and costs unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>i<\/kbd> Copy original versus recommended labels and costs as compact Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown("i");
  assert.match(app.clipboardText(), /^# Original versus recommended package/u);
  assert.match(app.clipboardText(), /option labels and costs only/u);
  assert.match(app.clipboardText(), /not a recorded vote/u);
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  app.clearFocus();
  app.keydown("i", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("i", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const again = await savedWorkbench(new Map());
  again.keydown("I");
  assert.match(again.clipboardText(), /^# Original versus recommended package/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-original-versus-recommended-button");
  assert.equal(blocked.focused(), "#original-versus-recommended-fallback");
  blocked.clearFocus();
  blocked.keydown("i", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard h jumps to the workshop method heading unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>h<\/kbd> Jump to the workshop method \/ How it works heading/u);
  assert.match(html, /id="method-heading"/u);
  assert.match(html, /id="method-heading"[^>]*tabindex="-1"/u);
  assert.match(html, />How it works</u);
  const app = await savedWorkbench(new Map());
  app.keydown("h");
  assert.equal(app.focused(), "#method-heading");
  app.clearFocus();
  app.keydown("h", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("h", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("h", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("H");
  assert.equal(app.focused(), "#method-heading");
});

test("keyboard period jumps to the first locked clause card unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>\.<\/kbd> Jump to the first locked clause card, or the clauses heading/u);
  assert.match(html, /id="clauses-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(".");
  assert.equal(app.focused(), "#clauses-heading");
  app.clearFocus();
  app.keydown(".", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(".", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(">");
  assert.equal(app.focused(), "");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clearFocus();
  app.keydown(".");
  assert.equal(app.focused(), '[data-field="clause-title"][data-clause-id="hours"]');
});

test("keyboard semicolon copies the current lock count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>;<\/kbd> Copy the current lock count as one-line Markdown/u);
  assert.match(html, /id="copy-lock-count-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown(";");
  assert.equal(app.clipboardText(), "Current lock count: 0. Locks are draft choices, not a legal hold.\n");
  assert.equal(app.clipboardText(), app.lockCount());
  assert.doesNotMatch(app.clipboardText(), /# Current clause locks/u);
  assert.doesNotMatch(app.clipboardText(), /Unlocked/u);
  assert.match(app.message(), /not a legal hold/u);
  app.clearFocus();
  app.keydown(";", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(";", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const shifted = await savedWorkbench(new Map());
  shifted.keydown(":");
  assert.equal(shifted.clipboardText(), "");
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  locked.clearFocus();
  locked.keydown(";");
  assert.equal(locked.clipboardText(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-lock-count-button");
  assert.equal(blocked.focused(), "#lock-count-fallback");
  blocked.clearFocus();
  blocked.keydown(";", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard comma copies the recommended package option count unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>,<\/kbd> Copy the recommended package option count as one-line Markdown/u);
  const app = await savedWorkbench(new Map());
  app.keydown(",");
  assert.equal(app.clipboardText(), "Recommended package option count: 3. This is a decision aid, not a recorded vote.\n");
  assert.doesNotMatch(app.clipboardText(), /^# Recommended package/u);
  assert.match(app.message(), /not a recorded vote/u);
  app.clearFocus();
  app.keydown(",", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown(",", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  const shifted = await savedWorkbench(new Map());
  shifted.keydown("<");
  assert.equal(shifted.clipboardText(), "");
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-option-count-button");
  assert.equal(blocked.focused(), "#option-count-fallback");
  blocked.clearFocus();
  blocked.keydown(",", { tagName: "INPUT", isContentEditable: false });
  assert.equal(blocked.focused(), "");
});

test("keyboard z jumps to the numeric approval threshold unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>z<\/kbd> Jump to the numeric approval threshold field, or the method heading/u);
  assert.match(html, /id="threshold-number"/u);
  assert.match(html, /id="method-heading"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("z");
  assert.equal(app.focused(), "#threshold-number");
  app.clearFocus();
  app.keydown("z", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("z", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("z", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("Z");
  assert.equal(app.focused(), "#threshold-number");
});

test("keyboard x focuses JSON export unless an input is active", async () => {
  const html = await standaloneBytes();
  assert.match(html, /<kbd>x<\/kbd> Focus the JSON export control/u);
  assert.match(html, /id="export-button"/u);
  const app = await savedWorkbench(new Map());
  app.keydown("x");
  assert.equal(app.focused(), "#export-button");
  app.clearFocus();
  app.keydown("x", { tagName: "INPUT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("x", { tagName: "TEXTAREA", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("x", { tagName: "SELECT", isContentEditable: false });
  assert.equal(app.focused(), "");
  app.keydown("X");
  assert.equal(app.focused(), "#export-button");
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

test("clearing all locks is one undoable draft edit", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clearing locks");
  const optionIds = JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.map((clause) => clause.options[1].id);
  app.clickAction("lock-package", { optionIds: optionIds.join("|") });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.every((clause) => clause.lockedOptionId !== undefined), true);
  assert.equal(app.disabled("#clear-locks"), false);
  app.clickAction("clear-locks");
  const cleared = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(cleared.clauses.every((clause) => clause.lockedOptionId === undefined), true);
  assert.match(app.message(), /Cleared every clause lock/u);
  app.click("#undo-button");
  const restored = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.deepEqual(restored.clauses.map((clause) => clause.lockedOptionId), optionIds);
});

test("clause cards can lock or unlock one option without applying a whole package", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause lock toggles");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  assert.match(app.clauses(), /Unlock option/u);
  assert.match(app.message(), /Locked that clause to the selected option/u);
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, undefined);
  assert.match(app.message(), /Unlocked that clause/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
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

test("veto-blocking groups are highlighted as a numerical constraint, not a legitimacy claim", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto block workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  assert.match(app.groups(), /group-row veto-blocking/u);
  assert.match(app.groups(), /numerical constraint, not a legal right/u);
  assert.doesNotMatch(app.groups(), /legitimacy/u);
  assert.match(app.coalition(), /veto-blocking/u);
  assert.match(app.constraints(), /Highlighted veto rows failed/u);
  assert.match(app.ballot(), /Veto not met on the inspected package for: Minority/u);
});

test("copy recommended package writes Markdown to the clipboard", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-package-button"/u);
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /Copy group support/u);
  assert.match(html, /id="package-markdown-fallback"/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.packageMarkdown(), /^# Recommended package\n/u);
  assert.match(app.packageMarkdown(), /Park access hours/u);
  assert.match(app.packageMarkdown(), /not a recorded vote or a claim of legitimacy/u);
  await app.click("#copy-package-button");
  assert.equal(app.clipboardText(), app.packageMarkdown());
  assert.match(app.clipboardText(), /^# Recommended package\n/u);
  assert.match(app.clipboardText(), /Neighbourhood Plan: the shared green/u);
  assert.match(app.clipboardText(), /not a recorded vote or a claim of legitimacy/u);
  assert.match(app.message(), /Recommended package copied as Markdown/u);
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-package-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#package-markdown-fallback");
  assert.match(blocked.packageMarkdown(), /Park access hours/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
});

test("copy group support writes a Markdown table and is not a legal right", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-group-support-button"/u);
  assert.match(html, /id="group-support-fallback"/u);
  assert.match(html, /not a legal right/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.groupSupport(), /^# Group support\n/u);
  assert.match(app.groupSupport(), /\| Group \| Weight \| Average support \|/u);
  assert.match(app.groupSupport(), /Residents/u);
  assert.match(app.groupSupport(), /not a legal right/u);
  await app.click("#copy-group-support-button");
  assert.equal(app.clipboardText(), app.groupSupport());
  assert.match(app.message(), /not a legal right/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-group-support-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#group-support-fallback");
  assert.match(blocked.groupSupport(), /\| Group \| Weight \| Average support \|/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal right/u);
});

test("copy original versus recommended writes compact Markdown of labels and costs with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-original-versus-recommended-button"/u);
  assert.match(html, /Copy original versus recommended/u);
  assert.match(html, /id="original-versus-recommended-fallback"/u);
  assert.match(html, /option labels and costs only/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.originalVersusRecommended(), /^# Original versus recommended package/u);
  assert.match(app.originalVersusRecommended(), /option labels and costs only/u);
  assert.match(app.originalVersusRecommended(), /not a recorded vote/u);
  assert.match(app.originalVersusRecommended(), /\(cost 0\.0\) versus /u);
  assert.doesNotMatch(app.originalVersusRecommended(), /^# Recommended package/u);
  await app.click("#copy-original-versus-recommended-button");
  assert.equal(app.clipboardText(), app.originalVersusRecommended());
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-original-versus-recommended-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#original-versus-recommended-fallback");
  assert.match(blocked.originalVersusRecommended(), /^# Original versus recommended package/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
  const draft = {
    title: "No recommendation versus workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(missing.originalVersusRecommended(), /No recommended package is available/u);
  await missing.click("#copy-original-versus-recommended-button");
  assert.match(missing.clipboardText(), /No recommended package is available/u);
  assert.match(missing.message(), /not a recorded vote/u);
});

test("copy remaining budget writes one-line Markdown distinct from package and group-support copy", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-remaining-budget-button"/u);
  assert.match(html, /Copy remaining budget/u);
  assert.match(html, /id="remaining-budget-fallback"/u);
  assert.match(html, /not a legal appropriation/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.remainingBudget(), /leftover change-budget is unlimited/u);
  assert.match(app.remainingBudget(), /not a legal appropriation/u);
  assert.doesNotMatch(app.remainingBudget(), /^# Recommended package/u);
  assert.doesNotMatch(app.remainingBudget(), /\| Group \| Weight \| Average support \|/u);
  await app.click("#copy-remaining-budget-button");
  assert.equal(app.clipboardText(), app.remainingBudget());
  assert.match(app.message(), /not a legal appropriation/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-remaining-budget-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#remaining-budget-fallback");
  assert.match(blocked.remainingBudget(), /leftover change-budget is unlimited/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal appropriation/u);
  const draft = {
    title: "Exhausted remaining budget workshop",
    threshold: 70,
    maxChangeCost: 2,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 40 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const spent = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(spent.remainingBudget(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  await spent.click("#copy-remaining-budget-button");
  assert.match(spent.clipboardText(), /Remaining change-budget is exhausted \(0\.0 leftover\)/u);
  assert.match(spent.message(), /not a legal appropriation/u);
});

test("copy recommended package option count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-option-count-button"/u);
  assert.match(html, /Copy option count/u);
  assert.match(html, /id="option-count-fallback"/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.optionCount(), "Recommended package option count: 3. This is a decision aid, not a recorded vote.\n");
  assert.doesNotMatch(app.optionCount(), /Close at 20:00/u);
  assert.doesNotMatch(app.optionCount(), /^# Recommended package/u);
  await app.click("#copy-option-count-button");
  assert.equal(app.clipboardText(), app.optionCount());
  assert.match(app.message(), /not a recorded vote/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-option-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#option-count-fallback");
  assert.match(blocked.optionCount(), /Recommended package option count: 3/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
  const draft = {
    title: "No recommendation option count workshop",
    threshold: 95,
    maxChangeCost: 0,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 10 } },
      { id: "alt", label: "Alt", original: false, changeCost: 1, support: { g: 90 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const missing = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(missing.optionCount(), /No recommended package is available/u);
  await missing.click("#copy-option-count-button");
  assert.match(missing.clipboardText(), /No recommended package is available/u);
  assert.match(missing.message(), /not a recorded vote/u);
});

test("copy approval threshold writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-approval-threshold-button"/u);
  assert.match(html, /Copy approval threshold/u);
  assert.match(html, /id="approval-threshold-fallback"/u);
  assert.match(html, /not a legal quorum/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.approvalThreshold(), "Approval threshold: 68.0%. This is a number you entered, not a legal quorum.\n");
  assert.doesNotMatch(app.approvalThreshold(), /leftover change-budget/u);
  assert.doesNotMatch(app.approvalThreshold(), /^# Recommended package/u);
  await app.click("#copy-approval-threshold-button");
  assert.equal(app.clipboardText(), app.approvalThreshold());
  assert.match(app.message(), /not a legal quorum/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-approval-threshold-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#approval-threshold-fallback");
  assert.match(blocked.approvalThreshold(), /Approval threshold: 68\.0%/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal quorum/u);
  const draft = {
    title: "Exact threshold workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { g: 90 } },
      { id: "alt", label: "Alt", original: false, changeCost: 2, support: { g: 40 } },
      { id: "other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const exact = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.equal(exact.approvalThreshold(), "Approval threshold: 70.0%. This is a number you entered, not a legal quorum.\n");
  await exact.click("#copy-approval-threshold-button");
  assert.equal(exact.clipboardText(), "Approval threshold: 70.0%. This is a number you entered, not a legal quorum.\n");
  assert.match(exact.message(), /not a legal quorum/u);
});

test("copy package table writes a Markdown comparison and keeps a textarea fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-packages-table-button"/u);
  assert.match(html, /id="package-table-fallback"/u);
  assert.match(html, /not a recorded vote/u);
  const app = await savedWorkbench(new Map());
  assert.match(app.packageTable(), /^# Original, recommended, and pinned packages\n/u);
  assert.match(app.packageTable(), /\| Clause \| Original \| Recommended \| Pinned \|/u);
  assert.match(app.packageTable(), /Park access hours/u);
  await app.click("#copy-packages-table-button");
  assert.equal(app.clipboardText(), app.packageTable());
  assert.match(app.clipboardText(), /not a recorded vote or a claim of legitimacy/u);
  assert.match(app.message(), /Package table copied as Markdown/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-packages-table-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#package-table-fallback");
  assert.match(blocked.packageTable(), /\| Clause \| Original \| Recommended \| Pinned \|/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a recorded vote/u);
});

test("copy current lock count writes one-line Markdown with a clipboard fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-lock-count-button"/u);
  assert.match(html, /Copy lock count/u);
  assert.match(html, /id="lock-count-fallback"/u);
  assert.match(html, /not a legal hold/u);
  const app = await savedWorkbench(new Map());
  assert.equal(app.lockCount(), "Current lock count: 0. Locks are draft choices, not a legal hold.\n");
  assert.doesNotMatch(app.lockCount(), /# Current clause locks/u);
  assert.doesNotMatch(app.lockCount(), /Unlocked/u);
  await app.click("#copy-lock-count-button");
  assert.equal(app.clipboardText(), app.lockCount());
  assert.match(app.message(), /not a legal hold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-lock-count-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#lock-count-fallback");
  assert.match(blocked.lockCount(), /Current lock count: 0/u);
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal hold/u);
  const locked = await savedWorkbench(new Map());
  locked.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.equal(locked.lockCount(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  await locked.click("#copy-lock-count-button");
  assert.equal(locked.clipboardText(), "Current lock count: 1. Locks are draft choices, not a legal hold.\n");
  assert.match(locked.message(), /not a legal hold/u);
});

test("copy current locks writes Markdown with a textarea fallback and is not a legal hold", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-locks-button"/u);
  assert.match(html, /id="locks-markdown-fallback"/u);
  assert.match(html, /not a legal hold/u);
  const app = await savedWorkbench(new Map());
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  assert.match(app.locksMarkdown(), /# Current clause locks/u);
  assert.match(app.locksMarkdown(), /Park access hours: Trial a 21:00 Friday close for three months/u);
  assert.match(app.locksMarkdown(), /Weekend market use: Unlocked/u);
  await app.click("#copy-locks-button");
  assert.equal(app.clipboardText(), app.locksMarkdown());
  assert.match(app.clipboardText(), /not a legal hold/u);
  assert.match(app.message(), /not a legal hold/u);
  const blocked = await savedWorkbench(new Map());
  blocked.blockClipboard();
  await blocked.click("#copy-locks-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#locks-markdown-fallback");
  assert.match(blocked.message(), /Clipboard is blocked/u);
  assert.match(blocked.message(), /not a legal hold/u);
});

test("copy change-cost table writes formula-safe CSV with a textarea fallback", async () => {
  const html = await standaloneBytes();
  assert.match(html, /id="copy-change-cost-button"/u);
  assert.match(html, /id="change-cost-csv-fallback"/u);
  const draft = {
    title: "Cost table workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "one", title: "Hours", options: [
      { id: "one-original", label: "Keep", original: true, changeCost: 0, support: { g: 40 } },
      { id: "one-change", label: "Change", original: false, changeCost: 2, support: { g: 90 } },
      { id: "one-other", label: "Other", original: false, changeCost: 8, support: { g: 20 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  assert.match(app.changeCostCsv(), /^"clause","original_option","recommended_option","cost_delta"\r\n/u);
  assert.match(app.changeCostCsv(), /"Hours","Keep","Change","2"/u);
  await app.click("#copy-change-cost-button");
  assert.equal(app.clipboardText(), app.changeCostCsv());
  const blocked = await savedWorkbench(new Map([["smallest-agreement:proposal:v1", JSON.stringify(draft)]]));
  blocked.blockClipboard();
  await blocked.click("#copy-change-cost-button");
  assert.equal(blocked.clipboardText(), "");
  assert.equal(blocked.focused(), "#change-cost-csv-fallback");
  assert.match(blocked.message(), /Clipboard is blocked/u);
});

test("copy veto blockers writes a constraint list rather than a legitimacy claim", async () => {
  const key = "smallest-agreement:proposal:v1";
  const draft = {
    title: "Veto copy workshop",
    threshold: 80,
    groups: [
      { id: "majority", name: "Majority", weight: 9 },
      { id: "minority", name: "Minority", weight: 1, veto: true },
    ],
    clauses: [{ id: "one", title: "One", options: [
      { id: "original", label: "Keep original", original: true, changeCost: 0, support: { majority: 90, minority: 10 } },
      { id: "mid", label: "Mid option", original: false, changeCost: 1, support: { majority: 88, minority: 20 } },
      { id: "other", label: "Other option", original: false, changeCost: 2, support: { majority: 85, minority: 30 } },
    ] }],
  };
  const app = await savedWorkbench(new Map([[key, JSON.stringify(draft)]]));
  await app.click("#copy-veto-button");
  assert.match(app.clipboardText(), /^# Veto constraint list\n/u);
  assert.match(app.clipboardText(), /numerical constraint list, not a legal veto or a claim of legitimacy/u);
  assert.match(app.clipboardText(), /Minority: 10\.0% against required 80\.0%/u);
  assert.match(app.message(), /not a legitimacy claim/u);
});

test("comparing two workshop JSON files lists missing group and clause ids honestly", async () => {
  const app = await savedWorkbench(new Map());
  const neighbourhood = {
    title: "Left workshop",
    threshold: 70,
    groups: [{ id: "g", name: "Group", weight: 1 }],
    clauses: [{ id: "clause", title: "Clause", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { g: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { g: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { g: 90 } },
    ] }],
  };
  const other = {
    title: "Right workshop",
    threshold: 70,
    groups: [{ id: "other", name: "Other group", weight: 1 }],
    clauses: [{ id: "path", title: "Path", options: [
      { id: "original", label: "Original", original: true, changeCost: 0, support: { other: 60 } },
      { id: "alternative", label: "Alternative", original: false, changeCost: 1, support: { other: 80 } },
      { id: "other", label: "Other", original: false, changeCost: 2, support: { other: 90 } },
    ] }],
  };
  await app.compareFiles(JSON.stringify(neighbourhood), JSON.stringify(other));
  assert.match(app.fileComparison(), /only in the first file/u);
  assert.match(app.fileComparison(), /only in the second file/u);
  assert.match(app.fileComparison(), /not share the same group and clause identifiers/u);
  assert.match(app.fileComparison(), /rather than filled with zeros/u);
  assert.match(app.message(), /Missing group and clause ids are listed/u);
});

test("groups CSV import replaces the roster with named errors and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for group CSV");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  await app.importGroupsCsv("name,weight,hidden\nA,1,x\n");
  assert.match(app.message(), /Groups CSV import failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const supportHeaders = before.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  const row = ["New residents", "4", "", "no", ...supportHeaders.map(() => "55")].join(",");
  await app.importGroupsCsv(`name,weight,min_support,veto,${supportHeaders.join(",")}\n${row}\n`);
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, 1);
  assert.equal(after.groups[0].name, "New residents");
  assert.equal(after.groups[0].weight, 4);
  assert.match(app.message(), /Imported 1 participant groups/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("clauses CSV import replaces options with named errors and supports undo", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for clause CSV");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  await app.importClausesCsv("clause_id,option_id,clause_title,option_label,original,change_cost,hidden\nhours,hours-original,Hours,Keep,yes,0,x\n");
  assert.match(app.message(), /Clauses CSV import failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const rows = [
    "hours,hours-original,Park hours,Close at 20:00,yes,0",
    "hours,hours-seasonal,Park hours,Seasonal close,no,2",
    "hours,hours-pilot,Park hours,Friday trial,no,3",
  ].join("\n");
  await app.importClausesCsv(`clause_id,option_id,clause_title,option_label,original,change_cost\n${rows}\n`);
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, 1);
  assert.equal(after.clauses[0].title, "Park hours");
  assert.equal(after.clauses[0].options[0].label, "Close at 20:00");
  assert.equal(after.clauses[0].options[0].support.residents, before.clauses[0].options[0].support.residents);
  assert.match(app.message(), /Imported 1 clauses/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
});

test("pasting TSV or CSV clause options uses the same validation and is undoable", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for pasted clauses");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  app.pasteClauses("clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost\thidden\nhours\thours-original\tHours\tKeep\tyes\t0\tx\n");
  app.click("#clause-paste-button");
  assert.match(app.message(), /Pasted clauses failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const tsv = [
    "clause_id\toption_id\tclause_title\toption_label\toriginal\tchange_cost",
    "hours\thours-original\tPark hours\tClose at 20:00\tyes\t0",
    "hours\thours-seasonal\tPark hours\tSeasonal close\tno\t2",
    "hours\thours-pilot\tPark hours\tFriday trial\tno\t3",
  ].join("\n");
  app.pasteClauses(tsv);
  app.click("#clause-paste-button");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.length, 1);
  assert.equal(after.clauses[0].title, "Park hours");
  assert.equal(after.clauses[0].options[0].label, "Close at 20:00");
  assert.equal(after.clauses[0].options[0].support.residents, before.clauses[0].options[0].support.residents);
  assert.match(app.message(), /Imported 1 clauses \(3 options\) from the pasted table/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.length, before.clauses.length);
  const csv = [
    "clause_id,option_id,clause_title,option_label,original,change_cost",
    "path,path-original,Path lighting,Keep lamps,yes,0",
    "path,path-warm,Path lighting,Warm lights,no,3",
    "path,path-motion,Path lighting,Motion lights,no,4",
  ].join("\n");
  app.pasteClauses(csv);
  app.click("#clause-paste-button");
  const csvAfter = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(csvAfter.clauses[0].id, "path");
  assert.equal(csvAfter.clauses[0].title, "Path lighting");
  assert.match(app.message(), /from the pasted table/u);
});

test("pasting TSV or CSV participant groups uses the same validation and rejects partial pastes", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for pasted groups");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const supportHeaders = before.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  app.pasteGroups(`name\tweight\thidden\nA\t1\tx\n`);
  app.click("#groups-paste-button");
  assert.match(app.message(), /Pasted groups failed \(unknown_column\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const partial = ["name", "weight", "min_support", "veto", ...supportHeaders].join("\t")
    + "\nGood\t2\t\tno\t" + supportHeaders.map(() => "55").join("\t")
    + "\nBad\tnope\t\tno\t" + supportHeaders.map(() => "40").join("\t") + "\n";
  app.pasteGroups(partial);
  app.click("#groups-paste-button");
  assert.match(app.message(), /Pasted groups failed \(invalid_weight\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
  const tsv = ["name", "weight", "min_support", "veto", ...supportHeaders].join("\t")
    + "\nStallholders\t4\t\tno\t" + supportHeaders.map(() => "55").join("\t") + "\n";
  app.pasteGroups(tsv);
  app.click("#groups-paste-button");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.length, 1);
  assert.equal(after.groups[0].name, "Stallholders");
  assert.match(app.message(), /Imported 1 participant groups from the pasted table/u);
  app.click("#undo-button");
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.length, before.groups.length);
});

test("locks JSON import replaces every lock, fails closed on unknown ids, and can be undone", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for locks JSON");
  app.clickAction("toggle-clause-lock", { clauseId: "hours", optionId: "hours-pilot" });
  app.clickAction("toggle-clause-lock", { clauseId: "market", optionId: "market-monthly" });
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(before.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  await app.importLocksJson(JSON.stringify({
    format: "smallest-agreement-locks",
    version: 1,
    locks: [{ clauseId: "missing", optionId: "hours-pilot" }],
  }));
  assert.match(app.message(), /Locks JSON import failed \(unknown_clause\)/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  await app.importLocksJson(JSON.stringify({
    format: "smallest-agreement-locks",
    version: 1,
    locks: [{ clauseId: "path", optionId: "path-warm" }],
  }));
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.clauses.find((clause) => clause.id === "hours").lockedOptionId, undefined);
  assert.equal(after.clauses.find((clause) => clause.id === "market").lockedOptionId, undefined);
  assert.equal(after.clauses.find((clause) => clause.id === "path").lockedOptionId, "path-warm");
  assert.match(app.message(), /Imported 1 clause lock/u);
  app.click("#undo-button");
  const undone = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(undone.clauses.find((clause) => clause.id === "hours").lockedOptionId, "hours-pilot");
  assert.equal(undone.clauses.find((clause) => clause.id === "market").lockedOptionId, "market-monthly");
});

test("clause density persists in workspace JSON and local workspace prefs", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for density");
  app.setDensity("compact");
  assert.match(app.clauseDensityClass(), /clause-density-compact/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).clauseDensity, "compact");
  const proposal = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const workspace = JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    clauseDensity: "compact",
    proposal,
  });
  await app.importJson(workspace);
  assert.match(app.message(), /Imported workspace/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).clauseDensity, "compact");
});

test("workspace JSON persists veto-only and locked-clause filters that the solver ignores", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for display filters");
  app.filterVetoGroups(true);
  app.filterLockedClauses(true);
  const prefs = JSON.parse(storage.get("smallest-agreement:workspace:v1"));
  assert.equal(prefs.vetoGroupsOnly, true);
  assert.equal(prefs.lockedClausesOnly, true);
  const proposal = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(Object.hasOwn(proposal, "vetoGroupsOnly"), false);
  assert.equal(Object.hasOwn(proposal, "lockedClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "changedClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "belowFloorGroupsOnly"), false);
  assert.equal(Object.hasOwn(proposal, "overBudgetClausesOnly"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsAtFloor"), false);
  assert.equal(Object.hasOwn(proposal, "hideGroupsWithoutFloors"), false);
  assert.equal(Object.hasOwn(proposal, "hideUnlockedClauses"), false);
  assert.equal(Object.hasOwn(proposal, "noCheaperRemainingClausesOnly"), false);
  assert.equal(proposal.clauses.length, 3);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.match(app.ballot(), /Park access hours/u);
  app.filterChangedClauses(true);
  app.filterBelowFloorGroups(true);
  app.filterOverBudgetClauses(true);
  app.filterHideGroupsAtFloor(true);
  app.filterHideGroupsWithoutFloors(true);
  app.filterNoCheaperRemainingClauses(true);
  app.filterHideUnlockedClauses(true);
  const nextPrefs = JSON.parse(storage.get("smallest-agreement:workspace:v1"));
  assert.equal(nextPrefs.changedClausesOnly, true);
  assert.equal(nextPrefs.belowFloorGroupsOnly, true);
  assert.equal(nextPrefs.overBudgetClausesOnly, true);
  assert.equal(nextPrefs.hideGroupsAtFloor, true);
  assert.equal(nextPrefs.hideGroupsWithoutFloors, true);
  assert.equal(nextPrefs.noCheaperRemainingClausesOnly, true);
  assert.equal(nextPrefs.hideUnlockedClauses, true);
  app.filterVetoGroups(false);
  app.filterLockedClauses(false);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    vetoGroupsOnly: true,
    lockedClausesOnly: true,
    proposal,
  }));
  assert.match(app.message(), /Imported workspace/u);
  assert.match(app.groups(), /No veto groups match this filter/u);
  assert.match(app.clauses(), /No locked clauses match this filter/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).vetoGroupsOnly, true);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    proposal,
  }));
  assert.match(app.groups(), /Residents/u);
  assert.match(app.clauses(), /Park access hours/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).vetoGroupsOnly, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).lockedClausesOnly, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideGroupsWithoutFloors, false);
  assert.equal(JSON.parse(storage.get("smallest-agreement:workspace:v1")).hideUnlockedClauses, false);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    vetoGroupsOnly: "yes",
    proposal,
  }));
  assert.match(app.message(), /Import failed \(invalid_filter\)/u);
  await app.importJson(JSON.stringify({
    format: "smallest-agreement-workspace",
    version: 1,
    extra: true,
    proposal,
  }));
  assert.match(app.message(), /Import failed \(unknown_key\)/u);
});

test("resetting one group's support to blank is undoable and leaves other scores", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for blank support");
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const residents = before.clauses[0].options[0].support.residents;
  const shopkeepers = before.clauses[0].options[0].support.shopkeepers;
  app.clickAction("reset-group-support", { groupId: "residents" });
  assert.match(app.message(), /Cleared Residents support scores to blank/u);
  assert.match(app.alert(), /Fix the proposal before searching/u);
  assert.match(app.clauses(), /data-group-id="residents"[^>]*value=""/u);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options[0].support.residents, residents);
  assert.equal(JSON.parse(storage.get("smallest-agreement:proposal:v1")).clauses[0].options[0].support.shopkeepers, shopkeepers);
  app.click("#undo-button");
  const undone = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(undone.clauses[0].options[0].support.residents, residents);
  assert.doesNotMatch(app.alert(), /Fix the proposal/u);
});

test("renormalize weights requires a preview then apply and can be undone", async () => {
  const storage = new Map();
  const app = await savedWorkbench(storage);
  app.setTitle("Workshop draft for renormalize");
  assert.match(app.weightRenorm(), /Preview renormalize weights/u);
  app.clickAction("preview-renorm");
  assert.match(app.weightRenorm(), /Apply renormalized weights/u);
  assert.match(app.weightRenorm(), /Current weight/u);
  const before = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  const total = before.groups.reduce((sum, group) => sum + group.weight, 0);
  app.clickAction("apply-renorm");
  const after = JSON.parse(storage.get("smallest-agreement:proposal:v1"));
  assert.equal(after.groups.reduce((sum, group) => sum + group.weight, 0), 1);
  assert.equal(after.groups[0].weight, before.groups[0].weight / total);
  assert.match(app.message(), /Renormalized group weights so they sum to 1/u);
  app.click("#undo-button");
  assert.deepEqual(JSON.parse(storage.get("smallest-agreement:proposal:v1")).groups.map((group) => group.weight), before.groups.map((group) => group.weight));
});

test('partial numeric edit clears the exported review even without full render', async () => {
 const app = await savedWorkbench(new Map());
 app.click('#agreement-review-run');
 assert.equal(app.disabled('#agreement-review-export'), false);
 app.numberInput('#threshold-number', 61);
 assert.equal(app.disabled('#agreement-review-export'), true);
});
