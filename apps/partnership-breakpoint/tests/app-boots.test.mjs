import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// M9 final-review regression guard: only weekend-gap executed its app module
// in tests, so load-time evaluation-order crashes (like the Common Cart
// contingency TDZ) went undetected elsewhere. This test boots the real
// partnership module top-to-bottom in a stub DOM and fails on any load-time
// throw. The stub is intentionally tolerant: it guards evaluation order, not
// markup completeness or behavior.
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

class Element {
  constructor() {
    this.value = "";
    this.checked = false;
    this.type = "";
    this.textContent = "";
    this.innerHTML = "";
    this.hidden = false;
    this.disabled = false;
    this.children = [];
    this.handlers = {};
    this.dataset = {};
    this.attributes = {};
    this.style = {};
    this.options = [];
    this.selectedIndex = 0;
    this.tagName = "DIV";
    this.classList = { toggle() {}, add() {}, remove() {}, contains() { return false; } };
  }
  focus() {}
  select() {}
  click() { return this.emit("click"); }
  cloneNode() { return new Element(); }
  get content() {
    if (!this._content) this._content = new Element();
    return this._content;
  }
  get firstElementChild() {
    if (!this._first) this._first = new Element();
    return this._first;
  }
  get lastElementChild() {
    if (!this._last) this._last = new Element();
    return this._last;
  }
  get valueAsNumber() { return this.value.trim() === "" ? NaN : Number(this.value); }
  addEventListener(type, handler) { (this.handlers[type] ||= []).push(handler); }
  async emit(type) { for (const handler of this.handlers[type] || []) await handler({ target: this }); }
  append(...items) { this.children.push(...items.flatMap((item) => (item && item.fragment ? item.children : [item]))); }
  appendChild(item) { this.append(item); return item; }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  remove() {}
  closest() { return null; }
  contains() { return false; }
  querySelector(selector) {
    if (!this._scoped) this._scoped = new Map();
    if (!this._scoped.has(selector)) this._scoped.set(selector, new Element());
    return this._scoped.get(selector);
  }
  querySelectorAll() { return []; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  getBoundingClientRect() { return { width: 900, height: 300 }; }
  getContext() { return new Proxy({}, { get: (target, key) => target[key] ?? (() => {}), set: (target, key, value) => (target[key] = value, true) }); }
}

test("app module evaluates top-to-bottom without a load-time throw", async () => {
  const nodes = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const node = new Element();
    node.value = match[0].match(/\bvalue="([^"]*)"/)?.[1] || "";
    node.type = match[0].match(/\btype="([^"]*)"/)?.[1] || "";
    node.checked = /\bchecked\b/.test(match[0]);
    node.hidden = /\shidden(?:\s|>)/.test(match[0]);
    node.disabled = /\sdisabled(?:\s|>)/.test(match[0]);
    node.tagName = (match[0].match(/^<([a-zA-Z0-9]+)/)?.[1] || "div").toUpperCase();
    nodes.set(match[1], node);
  }
  const generic = new Map();
  const document = {
    documentElement: { dataset: {} },
    body: new Element(),
    activeElement: null,
    hidden: false,
    querySelector(selector) {
      const id = selector.startsWith("#") && !selector.includes(" ") ? selector.slice(1) : null;
      if (id && nodes.has(id)) return nodes.get(id);
      if (!generic.has(selector)) generic.set(selector, new Element());
      return generic.get(selector);
    },
    getElementById(id) { return this.querySelector("#" + id); },
    querySelectorAll() { return []; },
    createElement(tag) { const node = new Element(); node.tagName = String(tag).toUpperCase(); return node; },
    createDocumentFragment() { const node = new Element(); node.fragment = true; return node; },
    addEventListener() {},
  };
  const store = new Map();
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  };
  const location = { hash: "", pathname: "/index.html", search: "", origin: "http://localhost", protocol: "http:" };
  const window = {
    location,
    devicePixelRatio: 1,
    confirm: () => true,
    addEventListener() {},
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    history: { replaceState() {} },
  };
  Object.assign(globalThis, {
    document,
    window,
    localStorage,
    history: window.history,
  });
  const executable = source.replace("'./model.js'", JSON.stringify(new URL("../src/model.js", import.meta.url).href));
  await import("data:text/javascript;base64," + Buffer.from(executable).toString("base64"));
  const workbench = nodes.get("workbench");
  assert.ok(workbench, "workbench mount exists in markup");
  assert.match(workbench.innerHTML, /app-grid/);
});
