import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, PRESETS, attributeBottlenecks, reportToHTML, reportToMarkdown } from "../src/model.js";
test("report is deterministic, self-contained and escapes imported text",()=>{
 const scenario={...DEFAULT_SCENARIO,name:'<img src=x onerror=alert(1)>'}, options={notes:'</pre><script>alert(1)</script>&"'};
 const report=reportToHTML(scenario,PRESETS.marketStress,options);
 assert.equal(report,reportToHTML(scenario,PRESETS.marketStress,options));
 assert.ok(report.includes('&lt;img'));assert.ok(report.includes('&lt;script&gt;'));
 assert.doesNotMatch(report,/<script|<img|<iframe|<link|<form/i);assert.match(report,/Content-Security-Policy/);assert.match(report,/@media print/);
 for(const field of Object.keys(DEFAULT_SCENARIO)) assert.ok(report.includes(field));
});
test("report clearly describes an unreachable target and rejects invalid controls",()=>{
 const report=reportToHTML({...DEFAULT_SCENARIO,payoutThroughputAudPerHour:0},DEFAULT_SCENARIO);
 assert.match(report,/Unreachable by reserve alone/);assert.match(report,/72 intervals/);
 assert.throws(()=>reportToHTML(DEFAULT_SCENARIO,DEFAULT_SCENARIO,{targetPercent:101}),RangeError);
});
test("report inlines the current-scenario gate Gantt as SVG",()=>{
 const report=reportToHTML(DEFAULT_SCENARIO,DEFAULT_SCENARIO,{selectedHour:21});
 assert.match(report,/Gate Gantt/);
 assert.match(report,/<svg /);
 assert.match(report,/>First payout /);
 assert.match(report,/Selected Sat 12:00/);
});
test("report inlines the paired baseline versus current Gantt",()=>{
 const report=reportToHTML({...DEFAULT_SCENARIO,mondayHoliday:true},DEFAULT_SCENARIO,{selectedHour:65});
 assert.match(report,/Baseline versus current Gantt/);
 assert.match(report,/Issuer current/);
 assert.match(report,/Issuer baseline/);
 assert.match(report,/paired rows/);
});
test("report lists hours to first settlement for both scenarios",()=>{
 const open=reportToHTML(DEFAULT_SCENARIO,DEFAULT_SCENARIO);
 assert.match(open,/Hours to first settlement/);
 assert.doesNotMatch(open,/No settlement in 72h/);
 const closed=reportToHTML({...DEFAULT_SCENARIO,payoutThroughputAudPerHour:0},DEFAULT_SCENARIO);
 assert.match(closed,/No settlement in 72h/);
});
test("report inlines the queue path and hourly limiting-gate table",()=>{
 const report=reportToHTML(PRESETS.weekendRush,DEFAULT_SCENARIO,{selectedHour:21});
 assert.match(report,/Queue path/);
 assert.match(report,/<path d="M/);
 assert.match(report,/Hourly limiting gate/);
 assert.match(report,/>issuer</);
 assert.match(report,/Share of 72h/);
 const hours=attributeBottlenecks(PRESETS.weekendRush).rows.find((row)=>row.label==="none").hours;
 assert.match(report,new RegExp(">"+String(hours)+"<"));
});
test("report lists hours to clear the queue including residual-queue wording",()=>{
 const open=reportToHTML(DEFAULT_SCENARIO,DEFAULT_SCENARIO);
 assert.match(open,/Hours to clear queue/);
 assert.doesNotMatch(open,/queue remains/);
 const leftover=reportToHTML(PRESETS.marketStress,DEFAULT_SCENARIO);
 assert.match(leftover,/queue remains/);
});

test("Markdown report copies hours to clear the queue and the peak queue hour",()=>{
 const open=reportToMarkdown(DEFAULT_SCENARIO,DEFAULT_SCENARIO);
 assert.equal(open, reportToMarkdown(DEFAULT_SCENARIO,DEFAULT_SCENARIO));
 assert.match(open,/Hours to clear queue/);
 assert.match(open,/Peak queue hour/);
 assert.match(open,/69 hours/);
 assert.match(open,/Mon 08:00 \(hour 65\)/);
 assert.doesNotMatch(open,/timestamp|createdAt|exportedAt/i);
 const leftover=reportToMarkdown(PRESETS.marketStress,DEFAULT_SCENARIO);
 assert.match(leftover,/queue remains/);
 assert.match(leftover,/Mon 15:00 \(hour 72\)/);
 const empty=reportToMarkdown({...DEFAULT_SCENARIO, redemptionDemandAud: 0}, DEFAULT_SCENARIO);
 assert.match(empty,/No queue in 72h/);
 const named=reportToMarkdown({...DEFAULT_SCENARIO, name: "A | B <script>"}, DEFAULT_SCENARIO, {notes: "# not a heading"});
 assert.doesNotMatch(named, /A \| B/);
 assert.doesNotMatch(named, /<script>/);
});

test("Markdown report copy control is present beside the printable report", async () => {
 const { readFile } = await import("node:fs/promises");
 const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
 const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
 assert.match(html, /id="copy-markdown-report"/);
 assert.match(html, /Copy Markdown report/);
 assert.match(app, /reportToMarkdown/);
 assert.match(app, /hours to clear the queue and the peak queue hour/);
});
