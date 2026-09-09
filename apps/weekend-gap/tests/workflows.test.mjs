import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
let runId = 0;

class Element {
  constructor(value = "") { this.value = value; this.checked = false; this.type = ""; this.textContent = ""; this.children = []; this.handlers = {}; this.dataset = {}; this.disabled = false; this.attributes = {}; this.classList = { toggle() {} }; }
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
    nodes.set(match[1], node);
  }
  for (const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option value="([^"]*)"/g)) nodes.get(match[1]).value = match[2];
  const presets = ["normal", "weekendRush", "marketStress"].map(key => { const element = new Element(); element.dataset.preset = key; return element; });
  const document = {
    documentElement: { dataset: {} }, body: new Element(),
    querySelector(selector) { const node = nodes.get(selector.slice(1)); assert.ok(node, `Missing markup for ${selector}`); return node; },
    getElementById(id) { return this.querySelector("#" + id); },
    querySelectorAll(selector) { assert.equal(selector, "[data-preset]"); return presets; },
    createElement() { return new Element(); },
    createDocumentFragment() { const node = new Element(); node.fragment = true; return node; },
    addEventListener() {}
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
  return { nodes, presets, storage, async edit(id, value, type = "input") { const node = nodes.get(id); node.value = String(value); await node.emit(type); } };
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
  await ui.edit("timeline-range", 65);
  const persisted = JSON.parse(ui.storage.get("weekend-gap:workspace:v1"));
  assert.equal(persisted.current.name, "Market Stress"); assert.equal(persisted.selectedHour, 65);
  const reloaded = await boot(ui.storage);
  assert.equal(reloaded.nodes.get("scenario-title").textContent, "Market Stress");
  assert.equal(reloaded.nodes.get("baseline-name").textContent, "Normal Friday");
  assert.equal(reloaded.nodes.get("workspace-notes").value, "Keep this baseline");
  assert.equal(reloaded.nodes.get("timeline-range").value, "65");
  assert.equal(reloaded.nodes.get("scenario-library").children.length, 1);
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
test("reduced motion advances a single hour instead of starting playback",async()=>{
  const ui=await boot(new Map(),{reduced:true});assert.equal(ui.nodes.get("play-button").textContent,"Step hour");
  await ui.nodes.get("play-button").click();assert.equal(ui.nodes.get("timeline-range").value,"1");assert.equal(ui.nodes.get("play-button").attributes["aria-pressed"],"false");
});
