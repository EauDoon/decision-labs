import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
let runId = 0;

class Element {
  constructor(value = "") { this.value = value; this.checked = false; this.selected = false; this.type = ""; this.textContent = ""; this.innerHTML = ""; this.hidden = false; this.children = []; this.handlers = {}; this.dataset = {}; this.disabled = false; this.attributes = {}; this.classList = { toggle() {} }; }
  focus() { this.focused = true; }
  get valueAsNumber() { return this.value.trim() === "" ? NaN : Number(this.value); }
  addEventListener(type, handler) { (this.handlers[type] ||= []).push(handler); }
  async emit(type) { for (const handler of this.handlers[type] || []) await handler({ target: this }); }
  click() { return this.emit("click"); }
  append(...items) { this.children.push(...items.flatMap(item => item.fragment ? item.children : [item])); }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  remove() {}
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { width: 900, height: 300 }; }
  getContext() { return new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => (target[key] = value, true) }); }
}

async function boot(storage = new Map(), { blockedStorage = false, hash = "", reduced = false, canvasAvailable = true } = {}) {
  const nodes = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const value = match[0].match(/\bvalue="([^"]*)"/)?.[1] || "";
    const node = new Element(value);
    node.type = match[0].match(/\btype="([^"]*)"/)?.[1] || "";
    node.checked = /\bchecked\b/.test(match[0]);
    node.hidden = /\shidden(?:\s|>)/.test(match[0]);
    node.disabled = /\sdisabled(?:\s|>)/.test(match[0]);
    nodes.set(match[1], node);
  }
  for (const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option value="([^"]*)"/g)) nodes.get(match[1]).value = match[2];
  const presets = ["normal", "weekendRush", "marketStress", "thinFxTightWindows", "longWeekendFridayStart", "compressedFridayClose", "paydayFridayBurst", "publicHolidayMonday", "saturdayMarketBurst", "sundayStallClose", "thinSaturdayFx", "earlyMondayBankOpen", "fridayLateFxClose", "mondayLateIssuerOpen", "saturdayEarlyFxOpen", "sundayLateBankClose", "sundayLatePayoutClose", "saturdayEarlyPayoutOpen", "fridayEarlyPayoutOpen", "saturdayLatePayoutOpen", "sundayEarlyPayoutOpen", "sundayLateIssuerClose", "sundayEarlyIssuerOpen", "saturdayEarlyIssuerOpen", "fridayEarlyIssuerOpen", "saturdayEarlyBankOpen", "fridayEarlyBankOpen", "saturdayLateBankOpen", "fridayLateBankOpen", "fridayLateFxOpen", "saturdayLateFxOpen", "sundayLateFxOpen", "sundayEarlyFxOpen", "mondayEarlyFxOpen", "mondayLateFxOpen", "tuesdayEarlyFxOpen", "tuesdayLateFxOpen", "wednesdayEarlyFxOpen", "wednesdayLateFxOpen"].map(key => { const element = new Element(); element.dataset.preset = key; return element; });
  const document = {
    documentElement: { dataset: {} }, body: new Element(),
    handlers: {},
    querySelector(selector) { const node = nodes.get(selector.slice(1)); assert.ok(node, `Missing markup for ${selector}`); return node; },
    getElementById(id) { return this.querySelector("#" + id); },
    querySelectorAll(selector) { assert.equal(selector, "[data-preset]"); return presets; },
    createElement() { return new Element(); },
    createDocumentFragment() { const node = new Element(); node.fragment = true; return node; },
    addEventListener(type, handler) { (this.handlers[type] ||= []).push(handler); },
    async emit(type, event) { for (const handler of this.handlers[type] || []) await handler(event); }
  };
  nodes.get("scenario-form").elements = { namedItem: field => nodes.get(field) };
  if (!canvasAvailable) nodes.get("liquidity-chart").getContext = () => null;
  const location = { hash, pathname: "/index.html", search: "", origin: "http://localhost" };
  const localStorage = {
    getItem(key) { if (blockedStorage) throw new Error("blocked"); return storage.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw new Error("blocked"); storage.set(key, value); }
  };
  const window = { location, devicePixelRatio: 1, addEventListener() {}, setInterval() { return 1; }, clearInterval() {}, setTimeout() {}, print() {}, matchMedia() { return { matches: reduced, addEventListener() {} }; } };
  Object.assign(globalThis, { document, window, localStorage, history: { replaceState(a, b, url) { location.hash = url.startsWith("#") ? url : ""; } } });
  const executable = source.replace('"./model.js"', JSON.stringify(new URL("../src/model.js", import.meta.url).href));
  await import("data:text/javascript;base64," + Buffer.from(executable + "\n// boot " + ++runId).toString("base64"));
  return {
    nodes,
    presets,
    storage,
    async edit(id, value, type = "input") { const node = nodes.get(id); node.value = String(value); await node.emit(type); },
    async keydown(key, target = { tagName: "BODY" }, extra = {}) {
      await document.emit("keydown", {
        key,
        shiftKey: extra.shiftKey === true,
        target: { tagName: target.tagName, isContentEditable: Boolean(target.isContentEditable), closest() { return null; } },
        preventDefault() {},
        defaultPrevented: extra.defaultPrevented === true
      });
    }
  };
}

test("source mode runs library, sensitivity, undo, hourly table and workspace reload workflows", async () => {
  const ui = await boot();
  await ui.edit("workspace-notes", "Keep this baseline");
  await ui.presets[1].click();
  assert.equal(ui.nodes.get("scenario-title").textContent, "Weekend Rush");
  await ui.nodes.get("save-library").click();
  assert.equal(ui.nodes.get("scenario-library").children.length, 1);
  await ui.nodes.get("run-sensitivity").click();
  assert.equal(ui.nodes.get("sensitivity-rows").children.length, 5);
  await ui.presets[2].click();
  assert.equal(ui.nodes.get("sensitivity-rows").children.length, 0);
  await ui.nodes.get("undo-scenario").click();
  assert.equal(ui.nodes.get("scenario-title").textContent, "Weekend Rush");
  await ui.nodes.get("redo-scenario").click();
  assert.equal(ui.nodes.get("scenario-title").textContent, "Market Stress");
  await ui.edit("table-density", "all", "change");
  assert.equal(ui.nodes.get("timeline-table").children.length, 73);
  assert.equal(ui.nodes.get("timeline-table").children[0].children.length, 9);
  const peakRow = ui.nodes.get("timeline-table").children.find((row) => /is-peak-queue/.test(row.className));
  assert.ok(peakRow);
  assert.match(peakRow.children[0].textContent, /Peak queue/);
  assert.match(ui.nodes.get("peak-queue-row-note").textContent, /peak queue checkpoint/);
  await ui.edit("timeline-range", 65);
  ui.nodes.get("queue-backlog-only").checked = true;
  await ui.nodes.get("queue-backlog-only").emit("change");
  assert.ok(ui.nodes.get("timeline-table").children.length < 73);
  assert.match(ui.nodes.get("queue-backlog-filter-note").textContent, /Dashboard counts are unchanged/);
  ui.nodes.get("queue-backlog-only").checked = false;
  await ui.nodes.get("queue-backlog-only").emit("change");
  assert.equal(ui.nodes.get("timeline-table").children.length, 73);
  await ui.edit("gantt-density", "all", "change");
  assert.equal(ui.nodes.get("gantt-table").children.length, 73);
  ui.nodes.get("gantt-closed-only").checked = true;
  await ui.nodes.get("gantt-closed-only").emit("change");
  assert.ok(ui.nodes.get("gantt-table").children.length < 73);
  assert.match(ui.nodes.get("gantt-filter-note").textContent, /model still contains 72 hours/);
  ui.nodes.get("gantt-closed-only").checked = false;
  await ui.nodes.get("gantt-closed-only").emit("change");
  assert.equal(ui.nodes.get("gantt-table").children.length, 73);
  await ui.edit("timeline-range", 65);
  const persisted = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  assert.equal(persisted.current.name, "Market Stress"); assert.equal(persisted.selectedHour, 65);
  assert.equal(persisted.ganttDensity, "all");
  assert.equal(persisted.selectedChart, "queue");
  assert.equal(persisted.ganttClosedOnly, false);
  const reloaded = await boot(ui.storage);
  assert.equal(reloaded.nodes.get("scenario-title").textContent, "Market Stress");
  assert.equal(reloaded.nodes.get("baseline-name").textContent, "Normal Friday");
  assert.equal(reloaded.nodes.get("workspace-notes").value, "Keep this baseline");
  assert.equal(reloaded.nodes.get("timeline-range").value, "65");
  assert.equal(reloaded.nodes.get("gantt-density").value, "all");
  assert.equal(reloaded.nodes.get("selected-chart").value, "queue");
  assert.equal(reloaded.nodes.get("gantt-closed-only").checked, false);
  assert.equal(reloaded.nodes.get("scenario-library").children.length, 1);
});

test("workspace restore without selectedHour keeps hour zero", async () => {
  const ui = await boot();
  await ui.edit("timeline-range", 21);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.selectedHour;
  delete raw.ganttHourIndex;
  const reloaded = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(reloaded.nodes.get("timeline-range").value, "0");
  await reloaded.edit("timeline-range", 9);
  assert.equal(JSON.parse(reloaded.storage.get("weekend-gap:workspace:v1")).selectedHour, 9);
  assert.equal(JSON.parse(reloaded.storage.get("weekend-gap:workspace:v1")).ganttHourIndex, 9);
});

test("selected Gantt hour index persists in workspace JSON and older files keep the selected hour", async () => {
  const ui = await boot();
  await ui.edit("timeline-range", 21);
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).ganttHourIndex, 21);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("timeline-range").value, "21");
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.ganttHourIndex;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("timeline-range").value, "21");
});

test("workspace import replaces both scenarios and survives reload; invalid import preserves state", async () => {
  const ui = await boot();
  await ui.edit("workspace-notes", "portable");
  await ui.presets[1].click();
  const text = ui.storage.get("weekend-gap:workspace:v1");
  await ui.presets[2].click();
  const file = ui.nodes.get("workspace-file");
  file.files = [{ size: text.length, text: async () => text }]; await file.emit("change");
  assert.equal(ui.nodes.get("scenario-title").textContent, "Weekend Rush");
  const reloaded = await boot(ui.storage);
  assert.equal(reloaded.nodes.get("scenario-title").textContent, "Weekend Rush");
  const badFile = reloaded.nodes.get("workspace-file"); badFile.files = [{ size: 1, text: async () => "{" }]; await badFile.emit("change");
  assert.equal(reloaded.nodes.get("scenario-title").textContent, "Weekend Rush");
  assert.match(reloaded.nodes.get("workspace-status").textContent, /Import failed/);
});


test("incomplete numeric drafts keep the simulation and do not overwrite saved assumptions", async () => {
  const ui=await boot();await ui.presets[1].click();
  ui.nodes.get("reserveCashAud").value="";await ui.nodes.get("scenario-form").emit("input");
  assert.equal(ui.nodes.get("reserveCashAud").attributes["aria-invalid"],"true");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).current.reserveCashAud,5200000);
  assert.match(ui.nodes.get("input-message").textContent,/previous simulation is kept/);
  ui.nodes.get("reserveCashAud").value="123456";await ui.nodes.get("scenario-form").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).current.reserveCashAud,123456);
});
test("invalid planner drafts cannot make autosave restore an older scenario", async()=>{
  const ui=await boot();await ui.edit("reserve-target",75);await ui.edit("reserve-target","");await ui.presets[2].click();
  assert.match(ui.nodes.get("workspace-status").textContent,/last valid target/);
  const restored=await boot(ui.storage);assert.equal(restored.nodes.get("scenario-title").textContent,"Market Stress");assert.equal(restored.nodes.get("reserve-target").value,"75");
});
test("blocked storage and missing canvas leave the usable table and persistent warning",async()=>{
  const ui=await boot(new Map(),{blockedStorage:true,canvasAvailable:false});await ui.presets[1].click();
  assert.match(ui.nodes.get("storage-status").textContent,/autosave is unavailable/);
  assert.match(ui.nodes.get("workspace-status").textContent,/could not be saved/);
  assert.ok(ui.nodes.get("timeline-table").children.length>0);
});
test("dashboard reports hours to clear the queue or that the queue remains", async () => {
  const ui = await boot();
  assert.match(ui.nodes.get("queue-clear-value").textContent, /hour/);
  assert.doesNotMatch(ui.nodes.get("queue-clear-value").textContent, /queue remains/);
  await ui.presets[2].click();
  assert.equal(ui.nodes.get("queue-clear-value").textContent, "queue remains");
  ui.nodes.get("redemptionDemandAud").value = "0";
  await ui.nodes.get("scenario-form").emit("change");
  assert.equal(ui.nodes.get("queue-clear-value").textContent, "No queue in 72h");
});
test("holiday Saturday checkbox labels Saturday like Sunday and restores from workspace", async () => {
  const ui = await boot();
  await ui.edit("timeline-range", 21);
  assert.match(ui.nodes.get("fx-gate").textContent, /Weekend/);
  ui.nodes.get("saturdayHoliday").checked = true;
  await ui.nodes.get("scenario-form").emit("change");
  await ui.edit("timeline-range", 21);
  assert.match(ui.nodes.get("fx-gate").textContent, /Holiday Saturday/);
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).current.saturdayHoliday, true);
  const reloaded = await boot(ui.storage);
  assert.equal(reloaded.nodes.get("saturdayHoliday").checked, true);
  await reloaded.edit("timeline-range", 21);
  assert.match(reloaded.nodes.get("fx-gate").textContent, /Holiday Saturday/);
  assert.equal(reloaded.nodes.get("weekend-overlap-notice").hidden, false);
  assert.match(reloaded.nodes.get("weekend-overlap-notice").textContent, /Both weekend days are treated as closed/);
  assert.equal(reloaded.nodes.get("monday-saturday-holiday-notice").hidden, true);
  reloaded.nodes.get("mondayHoliday").checked = true;
  await reloaded.nodes.get("scenario-form").emit("change");
  assert.equal(reloaded.nodes.get("monday-saturday-holiday-notice").hidden, false);
  assert.match(reloaded.nodes.get("monday-saturday-holiday-notice").textContent, /Monday holiday and Saturday holiday are both on/);
});
test("applying a window shift notices that undo reverts it", async () => {
  const ui = await boot();
  assert.equal(ui.nodes.get("issuerOpenStartHour").value, "8");
  await ui.nodes.get("preview-window-shift").click();
  assert.equal(ui.nodes.get("apply-window-shift").disabled, false);
  await ui.nodes.get("apply-window-shift").click();
  assert.match(ui.nodes.get("input-message").textContent, /Undo scenario edit reverts this window shift/);
  assert.match(ui.nodes.get("window-shift-status").textContent, /Undo scenario edit reverts this window shift/);
  assert.equal(ui.nodes.get("issuerOpenStartHour").value, "7");
  assert.equal(ui.nodes.get("issuerOpenEndHour").value, "18");
  await ui.nodes.get("undo-scenario").click();
  assert.equal(ui.nodes.get("issuerOpenStartHour").value, "8");
  assert.equal(ui.nodes.get("issuerOpenEndHour").value, "17");
});
test("baseline versus current Gantt table lists differing hours and keeps a selected-hour fallback", async () => {
  const ui = await boot();
  assert.match(ui.nodes.get("compare-gantt-status").textContent, /match/);
  assert.equal(ui.nodes.get("compare-gantt-table").children.length, 1);
  ui.nodes.get("mondayHoliday").checked = true;
  await ui.nodes.get("scenario-form").emit("change");
  assert.match(ui.nodes.get("compare-gantt-status").textContent, /differ/);
  assert.ok(ui.nodes.get("compare-gantt-table").children.length > 1);
  assert.match(ui.nodes.get("compare-gantt").innerHTML, /Issuer current/);
  assert.match(ui.nodes.get("compare-gantt").innerHTML, /Issuer baseline/);
});
test("reduced motion advances a single hour instead of starting playback",async()=>{
  const ui=await boot(new Map(),{reduced:true});assert.equal(ui.nodes.get("play-button").textContent,"Step hour");
  await ui.nodes.get("play-button").click();assert.equal(ui.nodes.get("timeline-range").value,"1");assert.equal(ui.nodes.get("play-button").attributes["aria-pressed"],"false");
});

test("keyboard p jumps to peak queue and is a no-op when demand never queues", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.edit("timeline-range", 12);
  await ui.keydown("p");
  const peakHour = ui.nodes.get("timeline-range").value;
  assert.equal(peakHour, "65");
  await ui.edit("timeline-range", 12);
  await ui.keydown("P", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("timeline-range").value, "12");
  await ui.keydown("p", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("timeline-range").value, "12");
  ui.nodes.get("redemptionDemandAud").value = "0";
  await ui.nodes.get("scenario-form").emit("change");
  await ui.edit("timeline-range", 40);
  await ui.keydown("p");
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  assert.equal(ui.nodes.get("jump-peak").disabled, true);
});

test("keyboard s jumps to the scenario inputs and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("coach-overlay").hidden, true);
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  await ui.keydown("s");
  assert.equal(ui.nodes.get("assumptions-title").focused, true);
  assert.equal(ui.nodes.get("assumptions-title").attributes.tabindex, "-1");
  ui.nodes.get("assumptions-title").focused = false;
  await ui.keydown("S", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("assumptions-title").focused, false);
  await ui.keydown("s", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("assumptions-title").focused, false);
  await ui.keydown("s", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("assumptions-title").focused, false);
});

test("keyboard d jumps to the outcome summary and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("coach-overlay").hidden, true);
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  await ui.keydown("d");
  assert.equal(ui.nodes.get("outcome-title").focused, true);
  assert.equal(ui.nodes.get("outcome-title").attributes.tabindex, "-1");
  ui.nodes.get("outcome-title").focused = false;
  await ui.keydown("D", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown("d", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown("d", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("outcome-title").focused, false);
});

test("keyboard q jumps to the queue chart and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.edit("selected-chart", "gantt", "change");
  await ui.keydown("q");
  assert.equal(ui.nodes.get("chart-title").focused, true);
  assert.equal(ui.nodes.get("chart-title").attributes.tabindex, "-1");
  assert.equal(ui.nodes.get("selected-chart").value, "queue");
  ui.nodes.get("chart-title").focused = false;
  await ui.keydown("Q", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("chart-title").focused, false);
  await ui.keydown("q", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("chart-title").focused, false);
  await ui.keydown("q", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("chart-title").focused, false);
});

test("keyboard g jumps to the Gantt heading and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("coach-overlay").hidden, true);
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  await ui.keydown("g");
  assert.equal(ui.nodes.get("gantt-title").focused, true);
  assert.equal(ui.nodes.get("gantt-title").attributes.tabindex, "-1");
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("G", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("g", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("g", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-title").focused, false);
});

test("selected chart persists in workspace JSON and restores", async () => {
  const ui = await boot();
  await ui.edit("selected-chart", "gantt", "change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).selectedChart, "gantt");
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.selectedChart;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("selected-chart").value, "queue");
});

test("closed-hours Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-closed-only").checked = true;
  await ui.nodes.get("gantt-closed-only").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).ganttClosedOnly, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-closed-only").checked, true);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.ganttClosedOnly;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-closed-only").checked, false);
});

test("single-gate Gantt filter persists in workspace JSON and older files restore all gates", async () => {
  const ui = await boot();
  await ui.edit("gantt-gate-filter", "bank", "change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).ganttGateFilter, "bank");
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-gate-filter").value, "bank");
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Chart shows Bank only/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.ganttGateFilter;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-gate-filter").value, "all");
});

test("backlog-only queue table filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("queue-backlog-only").checked = true;
  await ui.nodes.get("queue-backlog-only").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).queueBacklogOnly, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("queue-backlog-only").checked, true);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.queueBacklogOnly;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("queue-backlog-only").checked, false);
});

test("every-gate-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-every-closed").checked = true;
  await ui.nodes.get("gantt-every-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).ganttEveryGateClosed, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-every-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /every gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.ganttEveryGateClosed;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-every-closed").checked, false);
});

test("hide-weekend Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekends").checked = true;
  await ui.nodes.get("gantt-hide-weekends").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekends").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Saturday and Sunday hours are hidden/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekends").checked, false);
});

test("hide-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-open").checked = true;
  await ui.nodes.get("gantt-hide-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /open on every gate/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-open").checked, false);
});

test("hide-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-closed").checked = true;
  await ui.nodes.get("gantt-hide-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /closed on every gate/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-closed").checked, false);
});

test("hide-zero-queue Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-zero-queue").checked = true;
  await ui.nodes.get("gantt-hide-zero-queue").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideZeroQueueGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-zero-queue").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /synthetic queue is zero/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideZeroQueueGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-zero-queue").checked, false);
});

test("hide-bank-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-bank-closed").checked = true;
  await ui.nodes.get("gantt-hide-bank-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideBankClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-bank-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /bank gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideBankClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-bank-closed").checked, false);
});

test("hide-issuer-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-issuer-closed").checked = true;
  await ui.nodes.get("gantt-hide-issuer-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideIssuerClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-issuer-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /issuer gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideIssuerClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-issuer-closed").checked, false);
});

test("hide-payout-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-payout-closed").checked = true;
  await ui.nodes.get("gantt-hide-payout-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hidePayoutClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-payout-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /payout gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hidePayoutClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-payout-closed").checked, false);
});

test("hide-FX-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-fx-closed").checked = true;
  await ui.nodes.get("gantt-hide-fx-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideFxClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-fx-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /FX gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideFxClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-fx-closed").checked, false);
});

test("hide-payout-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-payout-open").checked = true;
  await ui.nodes.get("gantt-hide-payout-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hidePayoutOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-payout-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /payout gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hidePayoutOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-payout-open").checked, false);
});

test("hide-FX-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-fx-open").checked = true;
  await ui.nodes.get("gantt-hide-fx-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideFxOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-fx-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /FX gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideFxOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-fx-open").checked, false);
});

test("hide-bank-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-bank-open").checked = true;
  await ui.nodes.get("gantt-hide-bank-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideBankOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-bank-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /bank gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideBankOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-bank-open").checked, false);
});

test("hide-issuer-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-issuer-open").checked = true;
  await ui.nodes.get("gantt-hide-issuer-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideIssuerOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-issuer-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /issuer gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideIssuerOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-issuer-open").checked, false);
});

test("hide-weekend-issuer-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-issuer-open").checked = true;
  await ui.nodes.get("gantt-hide-weekend-issuer-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendIssuerOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-issuer-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the issuer gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendIssuerOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-issuer-open").checked, false);
});

test("hide-weekend-issuer-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-issuer-closed").checked = true;
  await ui.nodes.get("gantt-hide-weekend-issuer-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendIssuerClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-issuer-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the issuer gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendIssuerClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-issuer-closed").checked, false);
});

test("hide-weekend-bank-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-bank-closed").checked = true;
  await ui.nodes.get("gantt-hide-weekend-bank-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendBankClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-bank-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the bank gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendBankClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-bank-closed").checked, false);
});

test("hide-weekend-bank-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-bank-open").checked = true;
  await ui.nodes.get("gantt-hide-weekend-bank-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendBankOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-bank-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the bank gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendBankOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-bank-open").checked, false);
});

test("hide-weekend-payout-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-payout-open").checked = true;
  await ui.nodes.get("gantt-hide-weekend-payout-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendPayoutOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-payout-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the payout gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendPayoutOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-payout-open").checked, false);
});

test("hide-weekend-FX-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-fx-open").checked = true;
  await ui.nodes.get("gantt-hide-weekend-fx-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendFxOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-fx-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the FX gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendFxOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-fx-open").checked, false);
});

test("hide-weekend-payout-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-payout-closed").checked = true;
  await ui.nodes.get("gantt-hide-weekend-payout-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendPayoutClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-payout-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the payout gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendPayoutClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-payout-closed").checked, false);
});

test("hide-weekend-FX-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekend-fx-closed").checked = true;
  await ui.nodes.get("gantt-hide-weekend-fx-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekendFxClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekend-fx-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekend hours where the FX gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekendFxClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekend-fx-closed").checked, false);
});

test("hide-weekday-FX-closed Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekday-fx-closed").checked = true;
  await ui.nodes.get("gantt-hide-weekday-fx-closed").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekdayFxClosedGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekday-fx-closed").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekday hours where the FX gate is closed/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekdayFxClosedGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekday-fx-closed").checked, false);
});

test("hide-weekday-FX-open Gantt filter persists in workspace JSON and older files restore all hours", async () => {
  const ui = await boot();
  ui.nodes.get("gantt-hide-weekday-fx-open").checked = true;
  await ui.nodes.get("gantt-hide-weekday-fx-open").emit("change");
  assert.equal(JSON.parse(ui.storage.get("weekend-gap:workspace:v1")).hideWeekdayFxOpenGanttHours, true);
  const restored = await boot(ui.storage);
  assert.equal(restored.nodes.get("gantt-hide-weekday-fx-open").checked, true);
  assert.match(restored.nodes.get("gantt-filter-note").textContent, /Weekday hours where the FX gate is open/);
  const raw = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  delete raw.hideWeekdayFxOpenGanttHours;
  const legacy = await boot(new Map([["weekend-gap:workspace:v1", JSON.stringify(raw)]]));
  assert.equal(legacy.nodes.get("gantt-hide-weekday-fx-open").checked, false);
});

test("keyboard j jumps to first settlement and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("coach-overlay").hidden, true);
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  await ui.edit("timeline-range", 65);
  await ui.keydown("j");
  assert.equal(ui.nodes.get("timeline-range").value, "1");
  await ui.edit("timeline-range", 40);
  await ui.keydown("J", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  await ui.keydown("j", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  await ui.keydown("j", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  ui.nodes.get("payoutThroughputAudPerHour").value = "0";
  await ui.nodes.get("scenario-form").emit("change");
  await ui.edit("timeline-range", 12);
  await ui.keydown("j");
  assert.equal(ui.nodes.get("timeline-range").value, "12");
});

test("keyboard f jumps to the first closed bank hour and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.edit("timeline-range", 0);
  await ui.keydown("f");
  assert.equal(ui.nodes.get("timeline-range").value, "2");
  assert.match(ui.nodes.get("input-message").textContent, /first closed bank hour/);
  await ui.edit("timeline-range", 40);
  await ui.keydown("F", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  await ui.keydown("f", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
  await ui.keydown("f", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("timeline-range").value, "40");
});

test("keyboard c copies the selected Gantt hour Markdown and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("c");
  assert.equal(ui.nodes.get("gantt-hour-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("gantt-hour-copy-fallback").value, /Weekend Gap selected hour/);
  assert.match(ui.nodes.get("gantt-hour-copy-fallback").value, /Synthetic educational calendar/);
  ui.nodes.get("gantt-hour-copy-fallback").hidden = true;
  ui.nodes.get("gantt-hour-copy-fallback").value = "";
  await ui.keydown("C", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hour-copy-fallback").hidden, true);
  await ui.keydown("c", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hour-copy-fallback").hidden, true);
  await ui.keydown("c", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hour-copy-fallback").hidden, true);
});

test("keyboard z copies remaining-reserve Markdown and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("z");
  assert.equal(ui.nodes.get("remaining-reserve-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("remaining-reserve-copy-fallback").value, /Remaining reserve:/);
  assert.match(ui.nodes.get("remaining-reserve-copy-fallback").value, /Queued AUD:/);
  assert.match(ui.nodes.get("remaining-reserve-copy-fallback").value, /Synthetic educational snapshot/);
  ui.nodes.get("remaining-reserve-copy-fallback").hidden = true;
  ui.nodes.get("remaining-reserve-copy-fallback").value = "";
  await ui.keydown("Z", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("remaining-reserve-copy-fallback").hidden, true);
  await ui.keydown("z", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("remaining-reserve-copy-fallback").hidden, true);
  await ui.keydown("z", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("remaining-reserve-copy-fallback").hidden, true);
});

test("keyboard v copies selected versus peak-queue hour Markdown and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("v");
  assert.equal(ui.nodes.get("selected-versus-peak-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("selected-versus-peak-copy-fallback").value, /Selected Gantt hour:/);
  assert.match(ui.nodes.get("selected-versus-peak-copy-fallback").value, /Peak-queue hour:/);
  assert.match(ui.nodes.get("selected-versus-peak-copy-fallback").value, /Not a forecast/);
  ui.nodes.get("selected-versus-peak-copy-fallback").hidden = true;
  ui.nodes.get("selected-versus-peak-copy-fallback").value = "";
  await ui.keydown("V", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("selected-versus-peak-copy-fallback").hidden, true);
  await ui.keydown("v", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("selected-versus-peak-copy-fallback").hidden, true);
  await ui.keydown("v", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("selected-versus-peak-copy-fallback").hidden, true);
});

test("keyboard x copies closed-hours Markdown and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("x");
  assert.equal(ui.nodes.get("closed-hours-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("closed-hours-copy-fallback").value, /Weekend Gap closed hours/);
  assert.match(ui.nodes.get("closed-hours-copy-fallback").value, /Not a bank feed/);
  ui.nodes.get("closed-hours-copy-fallback").hidden = true;
  ui.nodes.get("closed-hours-copy-fallback").value = "";
  await ui.keydown("X", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("closed-hours-copy-fallback").hidden, true);
  await ui.keydown("x", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("closed-hours-copy-fallback").hidden, true);
  await ui.keydown("x", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("closed-hours-copy-fallback").hidden, true);
});

test("keyboard t jumps to the timing review and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("t");
  assert.equal(ui.nodes.get("weekend-review-title").focused, true);
  assert.equal(ui.nodes.get("weekend-review-title").attributes.tabindex, "-1");
  assert.equal(ui.nodes.get("weekend-review").open, true);
  ui.nodes.get("weekend-review-title").focused = false;
  await ui.keydown("T", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("weekend-review-title").focused, false);
  await ui.keydown("t", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("weekend-review-title").focused, false);
  await ui.keydown("t", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("weekend-review-title").focused, false);
});

test("keyboard a jumps to analysis and export controls and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("a");
  assert.equal(ui.nodes.get("analysis-export-controls").focused, true);
  assert.equal(ui.nodes.get("analysis-export-controls").attributes.tabindex, "-1");
  ui.nodes.get("analysis-export-controls").focused = false;
  await ui.keydown("A", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("analysis-export-controls").focused, false);
  await ui.keydown("a", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("analysis-export-controls").focused, false);
  await ui.keydown("a", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("analysis-export-controls").focused, false);
});

test("keyboard n jumps to the first-payout marker and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("n");
  assert.equal(ui.nodes.get("gantt-first-payout-marker").focused, true);
  assert.equal(ui.nodes.get("gantt-first-payout-marker").attributes.tabindex, "-1");
  assert.equal(ui.nodes.get("selected-chart").value, "gantt");
  ui.nodes.get("gantt-first-payout-marker").focused = false;
  await ui.keydown("N", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-first-payout-marker").focused, false);
  await ui.keydown("n", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-first-payout-marker").focused, false);
  await ui.keydown("n", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-first-payout-marker").focused, false);
});

test("keyboard o jumps to the Payout Gantt row and to the Gantt heading when filtered away", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("o");
  assert.equal(ui.nodes.get("gantt-payout-row").focused, true);
  assert.equal(ui.nodes.get("gantt-payout-row").attributes.tabindex, "-1");
  ui.nodes.get("gantt-payout-row").focused = false;
  await ui.edit("gantt-gate-filter", "issuer", "change");
  await ui.keydown("o");
  assert.equal(ui.nodes.get("gantt-title").focused, true);
  ui.nodes.get("gantt-title").focused = false;
  ui.nodes.get("gantt-payout-row").focused = false;
  await ui.keydown("O", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-payout-row").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("o", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-payout-row").focused, false);
  await ui.keydown("o", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-payout-row").focused, false);
});

test("keyboard y jumps to the hours-to-first-settlement line and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("y");
  assert.equal(ui.nodes.get("hours-to-first-settlement-line").focused, true);
  assert.equal(ui.nodes.get("hours-to-first-settlement-line").attributes.tabindex, "-1");
  ui.nodes.get("hours-to-first-settlement-line").focused = false;
  ui.nodes.get("outcome-title").focused = false;
  await ui.keydown("Y", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-line").focused, false);
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown("y", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-line").focused, false);
  await ui.keydown("y", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-line").focused, false);
});

test("keyboard k jumps to the hours-to-clear line and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("k");
  assert.equal(ui.nodes.get("hours-to-clear-line").focused, true);
  assert.equal(ui.nodes.get("hours-to-clear-line").attributes.tabindex, "-1");
  ui.nodes.get("hours-to-clear-line").focused = false;
  await ui.keydown("K", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("hours-to-clear-line").focused, false);
  await ui.keydown("k", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("hours-to-clear-line").focused, false);
  await ui.keydown("k", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("hours-to-clear-line").focused, false);
});

test("keyboard l copies hours-to-first-settlement Markdown and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("l");
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Hours to first settlement:/);
  assert.match(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Synthetic educational snapshot/);
  assert.doesNotMatch(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Hours to clear queue/);
  ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden = true;
  ui.nodes.get("hours-to-first-settlement-copy-fallback").value = "";
  await ui.keydown("L", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
  await ui.keydown("l", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
  await ui.keydown("l", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
});

test("keyboard semicolon copies hours-to-clear Markdown through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(";");
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("hours-to-clear-copy-fallback").value, /Hours to clear queue:/);
  assert.match(ui.nodes.get("hours-to-clear-copy-fallback").value, /Synthetic educational snapshot/);
  assert.doesNotMatch(ui.nodes.get("hours-to-clear-copy-fallback").value, /Hours to first settlement:/);
  ui.nodes.get("hours-to-clear-copy-fallback").hidden = true;
  ui.nodes.get("hours-to-clear-copy-fallback").value = "";
  await ui.keydown(";", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, true);
  await ui.keydown(";", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, true);
  await ui.keydown(";", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, true);
});

test("keyboard comma copies hours-to-first-settlement Markdown through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(",");
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Hours to first settlement:/);
  assert.match(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Synthetic educational snapshot/);
  assert.doesNotMatch(ui.nodes.get("hours-to-first-settlement-copy-fallback").value, /Hours to clear queue/);
  ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden = true;
  ui.nodes.get("hours-to-first-settlement-copy-fallback").value = "";
  await ui.keydown(",", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
  await ui.keydown(",", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
  await ui.keydown(",", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("hours-to-first-settlement-copy-fallback").hidden, true);
});

test("keyboard left bracket jumps to the hours-to-clear copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("[");
  assert.equal(ui.nodes.get("copy-hours-to-clear").focused, true);
  ui.nodes.get("copy-hours-to-clear").focused = false;
  ui.nodes.get("outcome-title").focused = false;
  await ui.keydown("[", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-hours-to-clear").focused, false);
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown("[", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-hours-to-clear").focused, false);
  await ui.keydown("[", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-hours-to-clear").focused, false);
});

test("keyboard right bracket jumps to Print and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("]");
  assert.equal(ui.nodes.get("print").focused, true);
  ui.nodes.get("print").focused = false;
  ui.nodes.get("print-heading").focused = false;
  await ui.keydown("]", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("print").focused, false);
  assert.equal(ui.nodes.get("print-heading").focused, false);
  await ui.keydown("]", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("print").focused, false);
  await ui.keydown("]", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("print").focused, false);
});

test("keyboard period jumps to the first-closed-FX copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(".");
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, true);
  ui.nodes.get("copy-first-closed-fx").focused = false;
  ui.nodes.get("gantt-fx-row").focused = false;
  ui.nodes.get("outcome-title").focused = false;
  await ui.keydown(".", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  assert.equal(ui.nodes.get("gantt-fx-row").focused, false);
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown(".", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  await ui.keydown(".", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
});

test("keyboard slash jumps to remaining-reserve copy and shift-slash stays help", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  await ui.keydown("/");
  assert.equal(ui.nodes.get("copy-remaining-reserve").focused, true);
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, true);
  ui.nodes.get("copy-remaining-reserve").focused = false;
  ui.nodes.get("outcome-title").focused = false;
  await ui.keydown("?", { tagName: "BODY" });
  assert.equal(ui.nodes.get("shortcut-overlay").hidden, false);
  assert.equal(ui.nodes.get("copy-remaining-reserve").focused, false);
  ui.nodes.get("shortcut-overlay").hidden = true;
  await ui.keydown("/", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-remaining-reserve").focused, false);
  assert.equal(ui.nodes.get("outcome-title").focused, false);
  await ui.keydown("/", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-remaining-reserve").focused, false);
  await ui.keydown("/", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-remaining-reserve").focused, false);
  await ui.keydown("z");
  assert.equal(ui.nodes.get("remaining-reserve-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("remaining-reserve-copy-fallback").value, /Remaining reserve:/);
});

test("keyboard close-brace copies first closed FX hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("}");
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed FX hour:/);
  assert.match(ui.nodes.get("first-closed-fx-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed payout hour:/);
  assert.doesNotMatch(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed issuer hour:/);
  ui.nodes.get("first-closed-fx-copy-fallback").hidden = true;
  ui.nodes.get("first-closed-fx-copy-fallback").value = "";
  await ui.keydown("}", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, true);
  await ui.keydown("}", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, true);
  await ui.keydown("}", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, true);
  await ui.keydown('"');
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed payout hour:/);
  assert.notEqual(ui.nodes.get("first-closed-fx-copy-fallback").value, ui.nodes.get("first-closed-payout-copy-fallback").value);
});

test("keyboard tilde copies first open payout hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("~");
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /First open payout hour:/);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed payout hour:/);
  ui.nodes.get("first-open-payout-copy-fallback").hidden = true;
  ui.nodes.get("first-open-payout-copy-fallback").value = "";
  await ui.keydown("~", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, true);
  await ui.keydown("~", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, true);
  await ui.keydown("~", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, true);
  await ui.keydown("}");
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed FX hour:/);
  assert.notEqual(ui.nodes.get("first-open-payout-copy-fallback").value, ui.nodes.get("first-closed-fx-copy-fallback").value);
  await ui.keydown('"');
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed payout hour:/);
  assert.notEqual(ui.nodes.get("first-open-payout-copy-fallback").value, ui.nodes.get("first-closed-payout-copy-fallback").value);
});

test("keyboard open-paren copies first open FX hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("(");
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-fx-copy-fallback").value, /First open FX hour:/);
  assert.match(ui.nodes.get("first-open-fx-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-fx-copy-fallback").value, /First open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-fx-copy-fallback").value, /First closed FX hour:/);
  ui.nodes.get("first-open-fx-copy-fallback").hidden = true;
  ui.nodes.get("first-open-fx-copy-fallback").value = "";
  await ui.keydown("(", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, true);
  await ui.keydown("(", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, true);
  await ui.keydown("(", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, true);
  await ui.keydown("~");
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /First open payout hour:/);
  assert.notEqual(ui.nodes.get("first-open-fx-copy-fallback").value, ui.nodes.get("first-open-payout-copy-fallback").value);
  await ui.keydown("}");
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed FX hour:/);
  assert.notEqual(ui.nodes.get("first-open-fx-copy-fallback").value, ui.nodes.get("first-closed-fx-copy-fallback").value);
});

test("keyboard star copies first open bank hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("*");
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-bank-copy-fallback").value, /First open bank hour:/);
  assert.match(ui.nodes.get("first-open-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-bank-copy-fallback").value, /First open FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-bank-copy-fallback").value, /First open payout hour:/);
  ui.nodes.get("first-open-bank-copy-fallback").hidden = true;
  ui.nodes.get("first-open-bank-copy-fallback").value = "";
  await ui.keydown("*", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, true);
  await ui.keydown("*", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, true);
  await ui.keydown("*", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, true);
  await ui.keydown("(");
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-fx-copy-fallback").value, /First open FX hour:/);
  assert.notEqual(ui.nodes.get("first-open-bank-copy-fallback").value, ui.nodes.get("first-open-fx-copy-fallback").value);
  await ui.keydown("~");
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /First open payout hour:/);
  assert.notEqual(ui.nodes.get("first-open-bank-copy-fallback").value, ui.nodes.get("first-open-payout-copy-fallback").value);
});

test("keyboard dollar copies first open issuer hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("$");
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-issuer-copy-fallback").value, /First closed issuer hour:/);
  ui.nodes.get("first-open-issuer-copy-fallback").hidden = true;
  ui.nodes.get("first-open-issuer-copy-fallback").value = "";
  await ui.keydown("$", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("$", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("$", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("*");
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-bank-copy-fallback").value, /First open bank hour:/);
  assert.notEqual(ui.nodes.get("first-open-issuer-copy-fallback").value, ui.nodes.get("first-open-bank-copy-fallback").value);
});

test("keyboard 5 copies last open issuer hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("5");
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-issuer-copy-fallback").value, /First closed issuer hour:/);
  ui.nodes.get("last-open-issuer-copy-fallback").hidden = true;
  ui.nodes.get("last-open-issuer-copy-fallback").value = "";
  await ui.keydown("5", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("5", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("5", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  await ui.keydown("$");
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.notEqual(ui.nodes.get("last-open-issuer-copy-fallback").value, ui.nodes.get("first-open-issuer-copy-fallback").value);
});

test("keyboard 8 copies last closed issuer hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("8");
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Last closed issuer hour:/);
  assert.match(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /First closed issuer hour:/);
  ui.nodes.get("last-closed-issuer-copy-fallback").hidden = true;
  ui.nodes.get("last-closed-issuer-copy-fallback").value = "";
  await ui.keydown("8", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown("8", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown("8", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown("5");
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.notEqual(ui.nodes.get("last-closed-issuer-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
  await ui.keydown("$");
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.notEqual(ui.nodes.get("last-closed-issuer-copy-fallback").value, ui.nodes.get("first-open-issuer-copy-fallback").value);
});

test("keyboard quote copies first closed payout hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown('"');
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed payout hour:/);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed bank hour:/);
  ui.nodes.get("first-closed-payout-copy-fallback").hidden = true;
  ui.nodes.get("first-closed-payout-copy-fallback").value = "";
  await ui.keydown('"', { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, true);
  await ui.keydown('"', { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, true);
  await ui.keydown('"', { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, true);
  await ui.keydown(":");
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed issuer hour:/);
  assert.notEqual(ui.nodes.get("first-closed-payout-copy-fallback").value, ui.nodes.get("first-closed-issuer-copy-fallback").value);
});

test("keyboard colon copies first closed issuer hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(":");
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed issuer hour:/);
  assert.match(ui.nodes.get("first-closed-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed bank hour:/);
  ui.nodes.get("first-closed-issuer-copy-fallback").hidden = true;
  ui.nodes.get("first-closed-issuer-copy-fallback").value = "";
  await ui.keydown(":", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown(":", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown(":", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, true);
  await ui.keydown("'");
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-bank-copy-fallback").value, /First closed bank hour:/);
  assert.notEqual(ui.nodes.get("first-closed-issuer-copy-fallback").value, ui.nodes.get("first-closed-bank-copy-fallback").value);
});

test("keyboard apostrophe copies first closed bank hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("'");
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-bank-copy-fallback").value, /First closed bank hour:/);
  assert.match(ui.nodes.get("first-closed-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-bank-copy-fallback").value, /First closed FX hour:/);
  ui.nodes.get("first-closed-bank-copy-fallback").hidden = true;
  ui.nodes.get("first-closed-bank-copy-fallback").value = "";
  await ui.keydown("'", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, true);
  await ui.keydown("'", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, true);
  await ui.keydown("'", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, true);
});

test("keyboard plus jumps to the first-closed-FX copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("+");
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, true);
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, true);
  ui.nodes.get("copy-first-closed-fx").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("+", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("+", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  await ui.keydown("+", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  await ui.keydown("_");
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, true);
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
  await ui.keydown("=");
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, true);
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, false);
});

test("keyboard bang jumps to the first-open-payout copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("!");
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, true);
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, true);
  ui.nodes.get("copy-first-open-payout").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("!", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("!", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, false);
  await ui.keydown("!", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, false);
  await ui.keydown("+");
  assert.equal(ui.nodes.get("copy-first-closed-fx").focused, true);
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, false);
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, true);
});

test("keyboard close-paren jumps to the first-open-FX copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(")");
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, true);
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, true);
  ui.nodes.get("copy-first-open-fx").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown(")", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown(")", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, false);
  await ui.keydown(")", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, false);
  await ui.keydown("!");
  assert.equal(ui.nodes.get("copy-first-open-payout").focused, true);
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, false);
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, true);
});

test("keyboard ampersand jumps to the first-open-bank copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("&");
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, true);
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, true);
  ui.nodes.get("copy-first-open-bank").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("&", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("&", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, false);
  await ui.keydown("&", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, false);
  await ui.keydown(")");
  assert.equal(ui.nodes.get("copy-first-open-fx").focused, true);
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, false);
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, true);
});

test("keyboard caret jumps to the first-open-issuer copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("^");
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, true);
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
  ui.nodes.get("copy-first-open-issuer").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("^", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("^", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, false);
  await ui.keydown("^", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, false);
  await ui.keydown("&");
  assert.equal(ui.nodes.get("copy-first-open-bank").focused, true);
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, false);
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
});

test("keyboard 6 jumps to the last-open-issuer copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("6");
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, true);
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-open-issuer").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("6", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("6", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, false);
  await ui.keydown("6", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, false);
  await ui.keydown("^");
  assert.equal(ui.nodes.get("copy-first-open-issuer").focused, true);
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, false);
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, true);
});

test("keyboard 9 jumps to the last-closed-issuer copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("9");
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, true);
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-closed-issuer").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("9", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("9", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, false);
  await ui.keydown("9", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, false);
  await ui.keydown("6");
  assert.equal(ui.nodes.get("copy-last-open-issuer").focused, true);
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, false);
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
});

test("keyboard underscore jumps to the first-closed-payout copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("_");
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, true);
  ui.nodes.get("copy-first-closed-payout").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("_", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("_", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, false);
  await ui.keydown("_", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, false);
  await ui.keydown("-");
  assert.equal(ui.nodes.get("copy-first-closed-issuer").focused, true);
  assert.equal(ui.nodes.get("copy-first-closed-payout").focused, false);
});

test("keyboard hyphen jumps to the first-closed-issuer copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("-");
  assert.equal(ui.nodes.get("copy-first-closed-issuer").focused, true);
  ui.nodes.get("copy-first-closed-issuer").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("-", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-closed-issuer").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("-", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-closed-issuer").focused, false);
  await ui.keydown("-", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-closed-issuer").focused, false);
});

test("keyboard equals jumps to the hide-bank-closed filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("=");
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, true);
  ui.nodes.get("gantt-hide-bank-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("=", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("=", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, false);
  await ui.keydown("=", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, false);
  await ui.keydown(">");
  assert.equal(ui.nodes.get("gantt-hide-zero-queue").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, false);
});

test("keyboard pipe jumps to the hide-payout-closed filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("|");
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, true);
  ui.nodes.get("gantt-hide-payout-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("|", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("|", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, false);
  await ui.keydown("|", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, false);
  await ui.keydown("{");
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, false);
});

test("keyboard at-sign jumps to the hide-FX-closed filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("@");
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, true);
  ui.nodes.get("gantt-hide-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("@", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("@", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, false);
  await ui.keydown("@", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, false);
  await ui.keydown("|");
  assert.equal(ui.nodes.get("gantt-hide-payout-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, false);
});

test("keyboard hash jumps to the hide-payout-open filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("#");
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, true);
  ui.nodes.get("gantt-hide-payout-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("#", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("#", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, false);
  await ui.keydown("#", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, false);
  await ui.keydown("@");
  assert.equal(ui.nodes.get("gantt-hide-fx-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, false);
});

test("keyboard percent jumps to the hide-FX-open filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("%");
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, true);
  ui.nodes.get("gantt-hide-fx-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("%", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("%", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, false);
  await ui.keydown("%", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, false);
  await ui.keydown("#");
  assert.equal(ui.nodes.get("gantt-hide-payout-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, false);
});

test("keyboard backtick jumps to the hide-issuer-open filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("`");
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, true);
  ui.nodes.get("gantt-hide-issuer-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("`", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("`", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, false);
  await ui.keydown("`", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, false);
  await ui.keydown("%");
  assert.equal(ui.nodes.get("gantt-hide-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, false);
});

test("keyboard 7 jumps to the hide-weekend-issuer-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("7");
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, true);
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-issuer-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("7", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("7", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, false);
  await ui.keydown("7", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, false);
  await ui.keydown("`");
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, false);
});

test("keyboard 0 jumps to the hide-weekend-issuer-closed filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("0");
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, true);
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-issuer-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("0", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("0", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, false);
  await ui.keydown("0", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, false);
  await ui.keydown("7");
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, false);
  await ui.keydown("`");
  assert.equal(ui.nodes.get("gantt-hide-issuer-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, false);
});

test("keyboard left brace jumps to the hide-issuer-closed filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("{");
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, true);
  ui.nodes.get("gantt-hide-issuer-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("{", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("{", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, false);
  await ui.keydown("{", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, false);
  await ui.keydown("=");
  assert.equal(ui.nodes.get("gantt-hide-bank-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-issuer-closed").focused, false);
});

test("keyboard less-than jumps to the first-closed-bank copy control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("<");
  assert.equal(ui.nodes.get("copy-first-closed-bank").focused, true);
  ui.nodes.get("copy-first-closed-bank").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("<", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-first-closed-bank").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("<", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-first-closed-bank").focused, false);
  await ui.keydown("<", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-first-closed-bank").focused, false);
});

test("keyboard greater-than jumps to the hide-zero-queue filter and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown(">");
  assert.equal(ui.nodes.get("gantt-hide-zero-queue").focused, true);
  ui.nodes.get("gantt-hide-zero-queue").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown(">", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-zero-queue").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown(">", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-zero-queue").focused, false);
  await ui.keydown(">", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-zero-queue").focused, false);
});

test("copy hours-to-clear button uses the one-line helper with an honest empty", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-hours-to-clear").click();
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("hours-to-clear-copy-fallback").value, /Hours to clear queue:/);
  assert.match(ui.nodes.get("hours-to-clear-copy-fallback").value, /Synthetic educational snapshot/);
  ui.nodes.get("redemptionDemandAud").value = "0";
  await ui.nodes.get("scenario-form").emit("change");
  ui.nodes.get("hours-to-clear-copy-fallback").hidden = true;
  ui.nodes.get("hours-to-clear-copy-fallback").value = "";
  await ui.nodes.get("copy-hours-to-clear").click();
  assert.equal(ui.nodes.get("hours-to-clear-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("hours-to-clear-copy-fallback").value, /No queue in 72h/);
  assert.doesNotMatch(ui.nodes.get("hours-to-clear-copy-fallback").value, /Hours to clear queue: \./);
});

test("copy first closed bank hour uses one-line Markdown distinct from first-closed FX", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-closed-bank").click();
  assert.equal(ui.nodes.get("first-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-bank-copy-fallback").value, /First closed bank hour:/);
  assert.match(ui.nodes.get("first-closed-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-bank-copy-fallback").value, /First closed FX hour:/);
  await ui.nodes.get("copy-first-closed-fx").click();
  assert.equal(ui.nodes.get("first-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-fx-copy-fallback").value, /First closed FX hour:/);
  assert.notEqual(ui.nodes.get("first-closed-bank-copy-fallback").value, ui.nodes.get("first-closed-fx-copy-fallback").value);
});

test("copy first closed issuer hour uses one-line Markdown distinct from FX and bank", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-closed-issuer").click();
  assert.equal(ui.nodes.get("first-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed issuer hour:/);
  assert.match(ui.nodes.get("first-closed-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-closed-issuer-copy-fallback").value, /First closed bank hour:/);
  await ui.nodes.get("copy-first-closed-bank").click();
  assert.notEqual(ui.nodes.get("first-closed-issuer-copy-fallback").value, ui.nodes.get("first-closed-bank-copy-fallback").value);
});

test("copy first open payout hour uses one-line Markdown distinct from closed payout, FX, bank and issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-open-payout").click();
  assert.equal(ui.nodes.get("first-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /First open payout hour:/);
  assert.match(ui.nodes.get("first-open-payout-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed payout hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed bank hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-payout-copy-fallback").value, /First closed issuer hour:/);
  await ui.nodes.get("copy-first-closed-payout").click();
  assert.notEqual(ui.nodes.get("first-open-payout-copy-fallback").value, ui.nodes.get("first-closed-payout-copy-fallback").value);
});

test("copy first open FX hour uses one-line Markdown distinct from first-open-payout, closed FX and closed payout", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-open-fx").click();
  assert.equal(ui.nodes.get("first-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-fx-copy-fallback").value, /First open FX hour:/);
  assert.match(ui.nodes.get("first-open-fx-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-fx-copy-fallback").value, /First open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-fx-copy-fallback").value, /First closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-fx-copy-fallback").value, /First closed payout hour:/);
  await ui.nodes.get("copy-first-open-payout").click();
  assert.notEqual(ui.nodes.get("first-open-fx-copy-fallback").value, ui.nodes.get("first-open-payout-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-fx").click();
  assert.notEqual(ui.nodes.get("first-open-fx-copy-fallback").value, ui.nodes.get("first-closed-fx-copy-fallback").value);
});

test("copy first open bank hour uses one-line Markdown distinct from first-open-FX and first-closed bank", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-open-bank").click();
  assert.equal(ui.nodes.get("first-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-bank-copy-fallback").value, /First open bank hour:/);
  assert.match(ui.nodes.get("first-open-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-bank-copy-fallback").value, /First open FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-bank-copy-fallback").value, /First closed bank hour:/);
  await ui.nodes.get("copy-first-open-fx").click();
  assert.notEqual(ui.nodes.get("first-open-bank-copy-fallback").value, ui.nodes.get("first-open-fx-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-bank").click();
  assert.notEqual(ui.nodes.get("first-open-bank-copy-fallback").value, ui.nodes.get("first-closed-bank-copy-fallback").value);
});

test("copy first open issuer hour uses one-line Markdown distinct from first-open-bank and first-closed issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-open-issuer").click();
  assert.equal(ui.nodes.get("first-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.match(ui.nodes.get("first-open-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-open-issuer-copy-fallback").value, /First open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("first-open-issuer-copy-fallback").value, /First closed issuer hour:/);
  await ui.nodes.get("copy-first-open-bank").click();
  assert.notEqual(ui.nodes.get("first-open-issuer-copy-fallback").value, ui.nodes.get("first-open-bank-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-issuer").click();
  assert.notEqual(ui.nodes.get("first-open-issuer-copy-fallback").value, ui.nodes.get("first-closed-issuer-copy-fallback").value);
});

test("copy last open issuer hour uses one-line Markdown distinct from first-open-issuer copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-open-issuer").click();
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-issuer-copy-fallback").value, /First closed issuer hour:/);
  await ui.nodes.get("copy-first-open-issuer").click();
  assert.notEqual(ui.nodes.get("last-open-issuer-copy-fallback").value, ui.nodes.get("first-open-issuer-copy-fallback").value);
});

test("copy last closed issuer hour uses one-line Markdown distinct from last-open-issuer and first-closed issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-closed-issuer").click();
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Last closed issuer hour:/);
  assert.match(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /First open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-issuer-copy-fallback").value, /First closed issuer hour:/);
  await ui.nodes.get("copy-last-open-issuer").click();
  assert.notEqual(ui.nodes.get("last-closed-issuer-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-issuer").click();
  assert.notEqual(ui.nodes.get("last-closed-issuer-copy-fallback").value, ui.nodes.get("first-closed-issuer-copy-fallback").value);
});

test("keyboard 1 copies last closed bank hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("1");
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-bank-copy-fallback").value, /Last closed bank hour:/);
  assert.match(ui.nodes.get("last-closed-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-bank-copy-fallback").value, /Last closed issuer hour:/);
  ui.nodes.get("last-closed-bank-copy-fallback").hidden = true;
  ui.nodes.get("last-closed-bank-copy-fallback").value = "";
  await ui.keydown("1", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
  await ui.keydown("1", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
  await ui.keydown("1", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
  await ui.keydown("8");
  assert.equal(ui.nodes.get("last-closed-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-issuer-copy-fallback").value, /Last closed issuer hour:/);
  assert.notEqual(ui.nodes.get("last-closed-bank-copy-fallback").value, ui.nodes.get("last-closed-issuer-copy-fallback").value);
});

test("keyboard 2 jumps to the last-closed-bank copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("2");
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, true);
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-closed-bank").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("2", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("2", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, false);
  await ui.keydown("2", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, false);
  await ui.keydown("9");
  assert.equal(ui.nodes.get("copy-last-closed-issuer").focused, true);
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, false);
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
});

test("keyboard 3 jumps to the hide-weekend-bank-closed filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("3");
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, true);
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-bank-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("3", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("3", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, false);
  await ui.keydown("3", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, false);
  await ui.keydown("0");
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, false);
});

test("copy last closed bank hour uses one-line Markdown distinct from last-closed-issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-closed-bank").click();
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-bank-copy-fallback").value, /Last closed bank hour:/);
  assert.match(ui.nodes.get("last-closed-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-bank-copy-fallback").value, /Last closed issuer hour:/);
  await ui.nodes.get("copy-last-closed-issuer").click();
  assert.notEqual(ui.nodes.get("last-closed-bank-copy-fallback").value, ui.nodes.get("last-closed-issuer-copy-fallback").value);
});

test("keyboard 4 copies last open bank hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("4");
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open bank hour:/);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-bank-copy-fallback").value, /Last closed bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open issuer hour:/);
  ui.nodes.get("last-open-bank-copy-fallback").hidden = true;
  ui.nodes.get("last-open-bank-copy-fallback").value = "";
  await ui.keydown("4", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
  await ui.keydown("4", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
  await ui.keydown("4", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
  await ui.keydown("1");
  assert.equal(ui.nodes.get("last-closed-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-bank-copy-fallback").value, /Last closed bank hour:/);
  assert.notEqual(ui.nodes.get("last-open-bank-copy-fallback").value, ui.nodes.get("last-closed-bank-copy-fallback").value);
  await ui.keydown("5");
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.notEqual(ui.nodes.get("last-open-bank-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
});

test("keyboard Home jumps to the last-open-bank copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("Home");
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, true);
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-open-bank").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("Home", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("Home", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, false);
  await ui.keydown("Home", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, false);
  await ui.keydown("2");
  assert.equal(ui.nodes.get("copy-last-closed-bank").focused, true);
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, false);
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
});

test("keyboard End jumps to the hide-weekend-bank-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("End");
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, true);
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-bank-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("End", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("End", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, false);
  await ui.keydown("End", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, false);
  await ui.keydown("3");
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, false);
  await ui.keydown("0");
  assert.equal(ui.nodes.get("gantt-hide-weekend-issuer-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, false);
});

test("copy last open bank hour uses one-line Markdown distinct from last-closed-bank and last-open-issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-open-bank").click();
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open bank hour:/);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-bank-copy-fallback").value, /Last closed bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open issuer hour:/);
  await ui.nodes.get("copy-last-closed-bank").click();
  assert.notEqual(ui.nodes.get("last-open-bank-copy-fallback").value, ui.nodes.get("last-closed-bank-copy-fallback").value);
  await ui.nodes.get("copy-last-open-issuer").click();
  assert.notEqual(ui.nodes.get("last-open-bank-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
});

test("keyboard PageUp copies last open payout hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("PageUp");
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open payout hour:/);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Counts of modeled hours, not a payout calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /First open payout hour:/);
  ui.nodes.get("last-open-payout-copy-fallback").hidden = true;
  ui.nodes.get("last-open-payout-copy-fallback").value = "";
  await ui.keydown("PageUp", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
  await ui.keydown("PageUp", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
  await ui.keydown("PageUp", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
  await ui.keydown("4");
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open bank hour:/);
  assert.notEqual(ui.nodes.get("last-open-payout-copy-fallback").value, ui.nodes.get("last-open-bank-copy-fallback").value);
  await ui.keydown("5");
  assert.equal(ui.nodes.get("last-open-issuer-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-issuer-copy-fallback").value, /Last open issuer hour:/);
  assert.notEqual(ui.nodes.get("last-open-payout-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
});

test("keyboard PageDown jumps to the last-open-payout copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("PageDown");
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, true);
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-open-payout").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("PageDown", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("PageDown", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, false);
  await ui.keydown("PageDown", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, false);
  await ui.keydown("Home");
  assert.equal(ui.nodes.get("copy-last-open-bank").focused, true);
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, false);
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
});

test("keyboard ArrowUp jumps to the hide-weekend-payout-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("ArrowUp");
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, true);
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-payout-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("ArrowUp", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("ArrowUp", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, false);
  await ui.keydown("ArrowUp", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, false);
  await ui.keydown("End");
  assert.equal(ui.nodes.get("gantt-hide-weekend-bank-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, false);
});

test("copy last open payout hour uses one-line Markdown distinct from last-open-bank, last-open-issuer and first-open-payout", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-open-payout").click();
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open payout hour:/);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Counts of modeled hours, not a payout calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open issuer hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-payout-copy-fallback").value, /First open payout hour:/);
  await ui.nodes.get("copy-last-open-bank").click();
  assert.notEqual(ui.nodes.get("last-open-payout-copy-fallback").value, ui.nodes.get("last-open-bank-copy-fallback").value);
  await ui.nodes.get("copy-last-open-issuer").click();
  assert.notEqual(ui.nodes.get("last-open-payout-copy-fallback").value, ui.nodes.get("last-open-issuer-copy-fallback").value);
  await ui.nodes.get("copy-first-open-payout").click();
  assert.notEqual(ui.nodes.get("last-open-payout-copy-fallback").value, ui.nodes.get("first-open-payout-copy-fallback").value);
});

test("keyboard Insert copies last open FX hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("Insert");
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open FX hour:/);
  assert.match(ui.nodes.get("last-open-fx-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /First open FX hour:/);
  ui.nodes.get("last-open-fx-copy-fallback").hidden = true;
  ui.nodes.get("last-open-fx-copy-fallback").value = "";
  await ui.keydown("Insert", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
  await ui.keydown("Insert", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
  await ui.keydown("Insert", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
  await ui.keydown("4");
  assert.equal(ui.nodes.get("last-open-bank-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-bank-copy-fallback").value, /Last open bank hour:/);
  assert.notEqual(ui.nodes.get("last-open-fx-copy-fallback").value, ui.nodes.get("last-open-bank-copy-fallback").value);
  await ui.keydown("PageUp");
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open payout hour:/);
  assert.notEqual(ui.nodes.get("last-open-fx-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
});

test("keyboard ArrowDown jumps to the last-open-FX copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("ArrowDown");
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, true);
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-open-fx").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("ArrowDown", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("ArrowDown", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, false);
  await ui.keydown("ArrowDown", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, false);
  await ui.keydown("PageDown");
  assert.equal(ui.nodes.get("copy-last-open-payout").focused, true);
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, false);
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
});

test("keyboard ArrowLeft jumps to the hide-weekend-FX-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("ArrowLeft");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-fx-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("ArrowLeft", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("ArrowLeft", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("ArrowLeft", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("ArrowUp");
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
});

test("keyboard Delete copies last closed FX hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("Delete");
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last closed FX hour:/);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last open FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /First closed FX hour:/);
  ui.nodes.get("last-closed-fx-copy-fallback").hidden = true;
  ui.nodes.get("last-closed-fx-copy-fallback").value = "";
  await ui.keydown("Delete", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
  await ui.keydown("Delete", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
  await ui.keydown("Delete", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
  await ui.keydown("Insert");
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open FX hour:/);
  assert.notEqual(ui.nodes.get("last-closed-fx-copy-fallback").value, ui.nodes.get("last-open-fx-copy-fallback").value);
  await ui.keydown("PageUp");
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open payout hour:/);
  assert.notEqual(ui.nodes.get("last-closed-fx-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
});

test("keyboard F2 jumps to the last-closed-FX copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F2");
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, true);
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-closed-fx").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F2", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F2", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, false);
  await ui.keydown("F2", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, false);
  await ui.keydown("ArrowDown");
  assert.equal(ui.nodes.get("copy-last-open-fx").focused, true);
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, false);
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
});

test("keyboard ArrowRight jumps to the hide-weekend-payout-closed filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("ArrowRight");
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, true);
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-payout-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("ArrowRight", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("ArrowRight", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, false);
  await ui.keydown("ArrowRight", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, false);
  await ui.keydown("ArrowLeft");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, false);
  await ui.keydown("ArrowUp");
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, false);
});

test("keyboard F3 copies last closed payout hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F3");
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last closed payout hour:/);
  assert.match(ui.nodes.get("last-closed-payout-copy-fallback").value, /Counts of modeled hours, not a payout calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /First closed payout hour:/);
  ui.nodes.get("last-closed-payout-copy-fallback").hidden = true;
  ui.nodes.get("last-closed-payout-copy-fallback").value = "";
  await ui.keydown("F3", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
  await ui.keydown("F3", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
  await ui.keydown("F3", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
  await ui.keydown("Delete");
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last closed FX hour:/);
  assert.notEqual(ui.nodes.get("last-closed-payout-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
  await ui.keydown("PageUp");
  assert.equal(ui.nodes.get("last-open-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-payout-copy-fallback").value, /Last open payout hour:/);
  assert.notEqual(ui.nodes.get("last-closed-payout-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
});

test("keyboard F4 jumps to the last-closed-payout copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F4");
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, true);
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-closed-payout").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F4", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F4", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, false);
  await ui.keydown("F4", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, false);
  await ui.keydown("F2");
  assert.equal(ui.nodes.get("copy-last-closed-fx").focused, true);
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, false);
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
});

test("keyboard F7 copies last weekend-FX-closed hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F7");
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last closed payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden = true;
  ui.nodes.get("last-weekend-fx-closed-copy-fallback").value = "";
  await ui.keydown("F7", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F7", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F7", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F3");
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last closed payout hour:/);
  assert.notEqual(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-payout-copy-fallback").value);
  await ui.keydown("Delete");
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last closed FX hour:/);
  assert.notEqual(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
});

test("keyboard F8 jumps to the last-weekend-FX-closed copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F8");
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-weekend-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F8", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F8", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  await ui.keydown("F8", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  await ui.keydown("F4");
  assert.equal(ui.nodes.get("copy-last-closed-payout").focused, true);
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
});

test("keyboard F9 jumps to the hide-weekday-FX-closed filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F9");
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, true);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekday-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F9", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F9", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, false);
  await ui.keydown("F9", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, false);
  await ui.keydown("Backspace");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, false);
});

test("keyboard F10 copies last weekday-FX-closed hour through the new control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F10");
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.match(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last closed payout hour:/);
  ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden = true;
  ui.nodes.get("last-weekday-fx-closed-copy-fallback").value = "";
  await ui.keydown("F10", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "BODY" }, { defaultPrevented: true });
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F7");
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.notEqual(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, ui.nodes.get("last-weekend-fx-closed-copy-fallback").value);
});

test("keyboard F11 jumps to the last-weekday-FX-closed copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F11");
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, true);
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-weekday-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F11", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F11", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, false);
  await ui.keydown("F11", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, false);
  await ui.keydown("F11", { tagName: "BODY" }, { defaultPrevented: true });
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, false);
  await ui.keydown("F8");
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, false);
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
});

test("keyboard F12 jumps to the hide-weekend-FX-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F12");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-fx-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F12", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F12", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("F12", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("F12", { tagName: "BODY" }, { defaultPrevented: true });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("F9");
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  ui.nodes.get("gantt-hide-weekday-fx-closed").focused = false;
  await ui.keydown("ArrowLeft");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, false);
});

test("keyboard Shift+F10 copies last weekend-FX-closed hour through the existing control and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F10", { tagName: "BODY" }, { shiftKey: true });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /First weekend-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /First weekend-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /First weekday-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /First weekday-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekday-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden = true;
  ui.nodes.get("last-weekend-fx-closed-copy-fallback").value = "";
  await ui.keydown("F10", { tagName: "INPUT" }, { shiftKey: true });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "TEXTAREA" }, { shiftKey: true });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "SELECT" }, { shiftKey: true });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10", { tagName: "BODY" }, { shiftKey: true, defaultPrevented: true });
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  await ui.keydown("F10");
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.notEqual(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-weekday-fx-closed-copy-fallback").value);
});

test("keyboard Shift+F11 jumps to the last-weekend-FX-closed copy control and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F11", { tagName: "BODY" }, { shiftKey: true });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("copy-first-weekend-fx-closed").focused, undefined);
  assert.equal(ui.nodes.get("copy-first-weekend-fx-open").focused, undefined);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("copy-last-weekend-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F11", { tagName: "INPUT" }, { shiftKey: true });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F11", { tagName: "TEXTAREA" }, { shiftKey: true });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  await ui.keydown("F11", { tagName: "BODY" }, { shiftKey: true, defaultPrevented: true });
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  await ui.keydown("F11");
  assert.equal(ui.nodes.get("copy-last-weekday-fx-closed").focused, true);
  assert.equal(ui.nodes.get("copy-last-weekend-fx-closed").focused, false);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
});

test("keyboard Shift+F12 jumps to the hide-weekend-FX-open filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("F12", { tagName: "BODY" }, { shiftKey: true });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-open").focused, undefined);
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, undefined);
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-fx-open").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("F12", { tagName: "INPUT" }, { shiftKey: true });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("F12", { tagName: "TEXTAREA" }, { shiftKey: true });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("F12", { tagName: "BODY" }, { shiftKey: true, defaultPrevented: true });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  await ui.keydown("F12");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-open").focused, false);
  ui.nodes.get("gantt-hide-weekend-fx-open").focused = false;
  await ui.keydown("F9");
  assert.equal(ui.nodes.get("gantt-hide-weekday-fx-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
  ui.nodes.get("gantt-hide-weekday-fx-closed").focused = false;
  await ui.keydown("Backspace");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, false);
});

test("keyboard Backspace jumps to the hide-weekend-FX-closed filter and does not copy", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("Backspace");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, true);
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, true);
  ui.nodes.get("gantt-hide-weekend-fx-closed").focused = false;
  ui.nodes.get("gantt-title").focused = false;
  await ui.keydown("Backspace", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("Backspace", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, false);
  await ui.keydown("Backspace", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, false);
  await ui.keydown("ArrowRight");
  assert.equal(ui.nodes.get("gantt-hide-weekend-payout-closed").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, false);
  await ui.keydown("ArrowLeft");
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-open").focused, true);
  assert.equal(ui.nodes.get("gantt-hide-weekend-fx-closed").focused, false);
});

test("copy last weekend-FX-closed hour uses one-line Markdown distinct from last-closed-FX and last-closed-payout", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-weekend-fx-closed").click();
  assert.equal(ui.nodes.get("last-weekend-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.match(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, /Last closed payout hour:/);
  await ui.nodes.get("copy-last-closed-fx").click();
  assert.notEqual(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
  await ui.nodes.get("copy-last-closed-payout").click();
  assert.notEqual(ui.nodes.get("last-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-payout-copy-fallback").value);
});

test("copy last weekday-FX-open hour uses one-line Markdown distinct from last-weekend-FX-open, last-weekday-FX-closed and last-weekend-FX-closed", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-weekday-fx-open").click();
  assert.equal(ui.nodes.get("last-weekday-fx-open-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, /Last weekday-FX-open hour:/);
  assert.match(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, /Last weekend-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, /Last weekend-FX-closed hour:/);
  await ui.nodes.get("copy-last-weekend-fx-open").click();
  assert.notEqual(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, ui.nodes.get("last-weekend-fx-open-copy-fallback").value);
  await ui.nodes.get("copy-last-weekday-fx-closed").click();
  assert.notEqual(ui.nodes.get("last-weekday-fx-open-copy-fallback").value, ui.nodes.get("last-weekday-fx-closed-copy-fallback").value);
});

test("copy first weekend-FX-open hour uses one-line Markdown distinct from first-weekday-FX-closed, first-weekday-FX-open and last-weekend-FX-open", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-weekend-fx-open").click();
  assert.equal(ui.nodes.get("first-weekend-fx-open-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, /First weekend-FX-open hour:/);
  assert.match(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, /First weekday-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, /First weekday-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, /Last weekend-FX-open hour:/);
  await ui.nodes.get("copy-first-weekday-fx-closed").click();
  assert.notEqual(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, ui.nodes.get("first-weekday-fx-closed-copy-fallback").value);
  await ui.nodes.get("copy-last-weekend-fx-open").click();
  assert.notEqual(ui.nodes.get("first-weekend-fx-open-copy-fallback").value, ui.nodes.get("last-weekend-fx-open-copy-fallback").value);
});

test("copy first weekend-FX-closed hour uses one-line Markdown distinct from first-weekend-FX-open, last-weekend-FX-closed and last-closed-FX", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-weekend-fx-closed").click();
  assert.equal(ui.nodes.get("first-weekend-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, /First weekend-FX-closed hour:/);
  assert.match(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, /First weekend-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  await ui.nodes.get("copy-first-weekend-fx-open").click();
  assert.notEqual(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, ui.nodes.get("first-weekend-fx-open-copy-fallback").value);
  await ui.nodes.get("copy-last-weekend-fx-closed").click();
  assert.notEqual(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-weekend-fx-closed-copy-fallback").value);
  await ui.nodes.get("copy-last-closed-fx").click();
  assert.notEqual(ui.nodes.get("first-weekend-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
});

test("copy first weekday-FX-closed hour uses one-line Markdown distinct from first-weekday-FX-open, last-weekday-FX-closed and last-weekend-FX-closed", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-weekday-fx-closed").click();
  assert.equal(ui.nodes.get("first-weekday-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, /First weekday-FX-closed hour:/);
  assert.match(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, /First weekday-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  await ui.nodes.get("copy-first-weekday-fx-open").click();
  assert.notEqual(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, ui.nodes.get("first-weekday-fx-open-copy-fallback").value);
  await ui.nodes.get("copy-last-weekday-fx-closed").click();
  assert.notEqual(ui.nodes.get("first-weekday-fx-closed-copy-fallback").value, ui.nodes.get("last-weekday-fx-closed-copy-fallback").value);
});

test("copy first weekday-FX-open hour uses one-line Markdown distinct from last-weekday-FX-open, last-weekend-FX-open and last-weekday-FX-closed", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-weekday-fx-open").click();
  assert.equal(ui.nodes.get("first-weekday-fx-open-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, /First weekday-FX-open hour:/);
  assert.match(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, /Last weekday-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, /Last weekend-FX-open hour:/);
  assert.doesNotMatch(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, /Last weekday-FX-closed hour:/);
  await ui.nodes.get("copy-last-weekday-fx-open").click();
  assert.notEqual(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, ui.nodes.get("last-weekday-fx-open-copy-fallback").value);
  await ui.nodes.get("copy-last-weekend-fx-open").click();
  assert.notEqual(ui.nodes.get("first-weekday-fx-open-copy-fallback").value, ui.nodes.get("last-weekend-fx-open-copy-fallback").value);
});

test("copy last weekday-FX-closed hour uses one-line Markdown distinct from last-weekend-FX-closed, last-closed-FX and last-closed-payout", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-weekday-fx-closed").click();
  assert.equal(ui.nodes.get("last-weekday-fx-closed-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last weekday-FX-closed hour:/);
  assert.match(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last weekend-FX-closed hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, /Last closed payout hour:/);
  await ui.nodes.get("copy-last-weekend-fx-closed").click();
  assert.notEqual(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, ui.nodes.get("last-weekend-fx-closed-copy-fallback").value);
  await ui.nodes.get("copy-last-closed-fx").click();
  assert.notEqual(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
  await ui.nodes.get("copy-last-closed-payout").click();
  assert.notEqual(ui.nodes.get("last-weekday-fx-closed-copy-fallback").value, ui.nodes.get("last-closed-payout-copy-fallback").value);
});

test("copy last closed payout hour uses one-line Markdown distinct from last-closed-FX, last-open-payout and first-closed-payout", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-closed-payout").click();
  assert.equal(ui.nodes.get("last-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last closed payout hour:/);
  assert.match(ui.nodes.get("last-closed-payout-copy-fallback").value, /Counts of modeled hours, not a payout calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-payout-copy-fallback").value, /First closed payout hour:/);
  await ui.nodes.get("copy-last-closed-fx").click();
  assert.notEqual(ui.nodes.get("last-closed-payout-copy-fallback").value, ui.nodes.get("last-closed-fx-copy-fallback").value);
  await ui.nodes.get("copy-last-open-payout").click();
  assert.notEqual(ui.nodes.get("last-closed-payout-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-payout").click();
  assert.notEqual(ui.nodes.get("last-closed-payout-copy-fallback").value, ui.nodes.get("first-closed-payout-copy-fallback").value);
});

test("copy last closed FX hour uses one-line Markdown distinct from last-open-FX, last-open-payout and first-closed-FX", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-closed-fx").click();
  assert.equal(ui.nodes.get("last-closed-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last closed FX hour:/);
  assert.match(ui.nodes.get("last-closed-fx-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last open FX hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-closed-fx-copy-fallback").value, /First closed FX hour:/);
  await ui.nodes.get("copy-last-open-fx").click();
  assert.notEqual(ui.nodes.get("last-closed-fx-copy-fallback").value, ui.nodes.get("last-open-fx-copy-fallback").value);
  await ui.nodes.get("copy-last-open-payout").click();
  assert.notEqual(ui.nodes.get("last-closed-fx-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
  await ui.nodes.get("copy-first-closed-fx").click();
  assert.notEqual(ui.nodes.get("last-closed-fx-copy-fallback").value, ui.nodes.get("first-closed-fx-copy-fallback").value);
});

test("copy last open FX hour uses one-line Markdown distinct from last-open-bank, last-open-payout and first-open-FX", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-last-open-fx").click();
  assert.equal(ui.nodes.get("last-open-fx-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open FX hour:/);
  assert.match(ui.nodes.get("last-open-fx-copy-fallback").value, /Counts of modeled hours, not an FX calendar/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open bank hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /Last open payout hour:/);
  assert.doesNotMatch(ui.nodes.get("last-open-fx-copy-fallback").value, /First open FX hour:/);
  await ui.nodes.get("copy-last-open-bank").click();
  assert.notEqual(ui.nodes.get("last-open-fx-copy-fallback").value, ui.nodes.get("last-open-bank-copy-fallback").value);
  await ui.nodes.get("copy-last-open-payout").click();
  assert.notEqual(ui.nodes.get("last-open-fx-copy-fallback").value, ui.nodes.get("last-open-payout-copy-fallback").value);
  await ui.nodes.get("copy-first-open-fx").click();
  assert.notEqual(ui.nodes.get("last-open-fx-copy-fallback").value, ui.nodes.get("first-open-fx-copy-fallback").value);
});

test("copy first closed payout hour uses one-line Markdown distinct from FX, bank and issuer", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("copy-first-closed-payout").click();
  assert.equal(ui.nodes.get("first-closed-payout-copy-fallback").hidden, false);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed payout hour:/);
  assert.match(ui.nodes.get("first-closed-payout-copy-fallback").value, /Counts of modeled hours, not a bank calendar/);
  assert.doesNotMatch(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed FX hour:/);
  assert.doesNotMatch(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed bank hour:/);
  assert.doesNotMatch(ui.nodes.get("first-closed-payout-copy-fallback").value, /First closed issuer hour:/);
  await ui.nodes.get("copy-first-closed-issuer").click();
  assert.notEqual(ui.nodes.get("first-closed-payout-copy-fallback").value, ui.nodes.get("first-closed-issuer-copy-fallback").value);
});

test("keyboard h jumps to the selected Gantt hour table and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("h");
  assert.equal(ui.nodes.get("gantt-hour-row").focused, true);
  assert.equal(ui.nodes.get("gantt-hour-row").attributes.tabindex, "-1");
  assert.equal(ui.nodes.get("selected-chart").value, "gantt");
  ui.nodes.get("gantt-hour-row").focused = false;
  await ui.keydown("H", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-hour-row").focused, false);
  await ui.keydown("h", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-hour-row").focused, false);
  await ui.keydown("h", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-hour-row").focused, false);
});

test("keyboard w jumps to the FX Gantt row and to the Gantt heading when filtered away", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("w");
  assert.equal(ui.nodes.get("gantt-fx-row").focused, true);
  assert.equal(ui.nodes.get("gantt-fx-row").attributes.tabindex, "-1");
  ui.nodes.get("gantt-fx-row").focused = false;
  await ui.edit("gantt-gate-filter", "bank", "change");
  await ui.keydown("w");
  assert.equal(ui.nodes.get("gantt-title").focused, true);
  ui.nodes.get("gantt-title").focused = false;
  ui.nodes.get("gantt-fx-row").focused = false;
  await ui.keydown("W", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-fx-row").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("w", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-fx-row").focused, false);
  await ui.keydown("w", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-fx-row").focused, false);
});

test("keyboard i jumps to the Issuer Gantt row and to the Gantt heading when filtered away", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("i");
  assert.equal(ui.nodes.get("gantt-issuer-row").focused, true);
  assert.equal(ui.nodes.get("gantt-issuer-row").attributes.tabindex, "-1");
  ui.nodes.get("gantt-issuer-row").focused = false;
  await ui.edit("gantt-gate-filter", "bank", "change");
  await ui.keydown("i");
  assert.equal(ui.nodes.get("gantt-title").focused, true);
  ui.nodes.get("gantt-title").focused = false;
  ui.nodes.get("gantt-issuer-row").focused = false;
  await ui.keydown("I", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-issuer-row").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("i", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-issuer-row").focused, false);
  await ui.keydown("i", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-issuer-row").focused, false);
});

test("keyboard b jumps to the Bank Gantt row and to the Gantt heading when filtered away", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("b");
  assert.equal(ui.nodes.get("gantt-bank-row").focused, true);
  assert.equal(ui.nodes.get("gantt-bank-row").attributes.tabindex, "-1");
  ui.nodes.get("gantt-bank-row").focused = false;
  await ui.edit("gantt-gate-filter", "issuer", "change");
  await ui.keydown("b");
  assert.equal(ui.nodes.get("gantt-title").focused, true);
  ui.nodes.get("gantt-title").focused = false;
  ui.nodes.get("gantt-bank-row").focused = false;
  await ui.keydown("B", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("gantt-bank-row").focused, false);
  assert.equal(ui.nodes.get("gantt-title").focused, false);
  await ui.keydown("b", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("gantt-bank-row").focused, false);
  await ui.keydown("b", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("gantt-bank-row").focused, false);
});

test("keyboard m jumps to the compare Gantt heading and ignores the key while typing", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.keydown("m");
  assert.equal(ui.nodes.get("compare-gantt-title").focused, true);
  assert.equal(ui.nodes.get("compare-gantt-title").attributes.tabindex, "-1");
  assert.equal(ui.nodes.get("selected-chart").value, "gantt");
  ui.nodes.get("compare-gantt-title").focused = false;
  await ui.keydown("M", { tagName: "INPUT" });
  assert.equal(ui.nodes.get("compare-gantt-title").focused, false);
  await ui.keydown("m", { tagName: "TEXTAREA" });
  assert.equal(ui.nodes.get("compare-gantt-title").focused, false);
  await ui.keydown("m", { tagName: "SELECT" });
  assert.equal(ui.nodes.get("compare-gantt-title").focused, false);
});

test("comparing two scenario JSON files shows queue diffs and honest null settlement hours", async () => {
  const { scenarioToJSON, DEFAULT_SCENARIO, PRESETS } = await import(new URL("../src/model.js", import.meta.url));
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  await ui.nodes.get("compare-scenario-files").click();
  assert.match(ui.nodes.get("file-compare-status").textContent, /Choose two scenario JSON files/);
  const open = scenarioToJSON(DEFAULT_SCENARIO);
  const closed = scenarioToJSON({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0, name: "Closed payout" });
  ui.nodes.get("compare-file-a").files = [{ size: open.length, text: async () => open }];
  ui.nodes.get("compare-file-b").files = [{ size: closed.length, text: async () => closed }];
  await ui.nodes.get("compare-scenario-files").click();
  assert.equal(ui.nodes.get("file-compare-rows").children.length, 5);
  assert.match(ui.nodes.get("file-compare-status").textContent, /Closed payout/);
  const hourRow = ui.nodes.get("file-compare-rows").children[3];
  assert.match(hourRow.children[3].textContent, /Not comparable/);
});

test("comparing three scenario JSON files keeps honest nulls and does not replace the open scenario", async () => {
  const { scenarioToJSON, DEFAULT_SCENARIO, PRESETS } = await import(new URL("../src/model.js", import.meta.url));
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  const openName = ui.nodes.get("scenario-title").textContent;
  const baseline = scenarioToJSON(DEFAULT_SCENARIO);
  const closed = scenarioToJSON({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0, name: "Closed payout" });
  const empty = scenarioToJSON({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0, name: "No demand" });
  ui.nodes.get("compare-file-baseline").files = [{ size: baseline.length, text: async () => baseline }];
  ui.nodes.get("compare-file-current").files = [{ size: closed.length, text: async () => closed }];
  ui.nodes.get("compare-file-imported").files = [{ size: empty.length, text: async () => empty }];
  await ui.nodes.get("compare-three-scenario-files").click();
  assert.equal(ui.nodes.get("scenario-title").textContent, openName);
  assert.equal(ui.nodes.get("three-file-compare-rows").children.length, 7);
  assert.match(ui.nodes.get("three-file-compare-status").textContent, /was not replaced/);
  const settleRow = ui.nodes.get("three-file-compare-rows").children[4];
  assert.match(settleRow.children[2].textContent, /No settlement in 72h/);
  const peakHourRow = ui.nodes.get("three-file-compare-rows").children[6];
  assert.equal(peakHourRow.children[3].textContent, "");
});

test("demand timing earlier and later previews apply without randomness", async () => {
  const ui = await boot(new Map([["weekend-gap:coach:v1", "dismissed"]]));
  assert.equal(ui.nodes.get("demandProfile").value, "flat");
  assert.equal(ui.nodes.get("apply-demand-step").disabled, true);
  await ui.nodes.get("preview-demand-later").click();
  assert.equal(ui.nodes.get("apply-demand-step").disabled, false);
  assert.match(ui.nodes.get("demand-step-status").textContent, /mondayRush/);
  assert.match(ui.nodes.get("demand-step-status").textContent, /no randomness/);
  await ui.nodes.get("apply-demand-step").click();
  assert.equal(ui.nodes.get("demandProfile").value, "mondayRush");
  await ui.nodes.get("preview-demand-later").click();
  assert.equal(ui.nodes.get("apply-demand-step").disabled, true);
  assert.match(ui.nodes.get("demand-step-status").textContent, /Already at the later end/);
  await ui.nodes.get("preview-demand-earlier").click();
  await ui.nodes.get("apply-demand-step").click();
  assert.equal(ui.nodes.get("demandProfile").value, "flat");
  await ui.nodes.get("undo-scenario").click();
  assert.equal(ui.nodes.get("demandProfile").value, "mondayRush");
});

test("invalid numeric edit clears timing review and blocks a stale export", async () => {
 const ui=await boot();await ui.nodes.get("weekend-review-run").click();assert.equal(ui.nodes.get("weekend-review-export").disabled,false);ui.nodes.get("reserveCashAud").value="";await ui.nodes.get("scenario-form").emit("input");assert.equal(ui.nodes.get("weekend-review-export").disabled,true);await ui.nodes.get("weekend-review-run").click();assert.equal(ui.nodes.get("weekend-review-export").disabled,true);assert.match(ui.nodes.get("weekend-review-output").textContent,/Complete invalid/);
});
