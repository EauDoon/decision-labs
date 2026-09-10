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
  const presets = ["normal", "weekendRush", "marketStress", "thinFxTightWindows", "longWeekendFridayStart", "compressedFridayClose", "paydayFridayBurst", "publicHolidayMonday", "saturdayMarketBurst", "sundayStallClose", "thinSaturdayFx", "earlyMondayBankOpen"].map(key => { const element = new Element(); element.dataset.preset = key; return element; });
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
  const window = { location, devicePixelRatio: 1, addEventListener() {}, setInterval() { return 1; }, clearInterval() {}, setTimeout() {}, matchMedia() { return { matches: reduced, addEventListener() {} }; } };
  Object.assign(globalThis, { document, window, localStorage, history: { replaceState(a, b, url) { location.hash = url.startsWith("#") ? url : ""; } } });
  const executable = source.replace('"./model.js"', JSON.stringify(new URL("../src/model.js", import.meta.url).href));
  await import("data:text/javascript;base64," + Buffer.from(executable + "\n// boot " + ++runId).toString("base64"));
  return {
    nodes,
    presets,
    storage,
    async edit(id, value, type = "input") { const node = nodes.get(id); node.value = String(value); await node.emit(type); },
    async keydown(key, target = { tagName: "BODY" }) {
      await document.emit("keydown", {
        key,
        target: { tagName: target.tagName, isContentEditable: Boolean(target.isContentEditable), closest() { return null; } },
        preventDefault() {}
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
