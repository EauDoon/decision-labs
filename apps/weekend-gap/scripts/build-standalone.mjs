import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const outputPath = path.join(projectRoot, "standalone.html");
const sourcePaths = Object.freeze({
  html: path.join(projectRoot, "index.html"),
  css: path.join(projectRoot, "styles.css"),
  model: path.join(projectRoot, "src", "model.js"),
  app: path.join(projectRoot, "src", "app.js"),
});
const cssMarker = '<link rel="stylesheet" href="styles.css">';
const appMarker = '<script type="module" src="src/app.js"></script>';
const modelLinkMarker = '<p class="method-link"><a href="MODEL.md">Read the model notes and formulas</a></p>';
const htmlMarker = '<html lang="en">';
const cspMarker = '<meta charset="utf-8">';
export const standaloneCsp = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src 'none'",
  "font-src 'none'",
  "connect-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
].join("; ");
const appImportMarker = `import {
  createWeekendReviewPacket,
  replayWeekendReviewPacket,
  WEEKEND_REVIEW_TOOLS,
  analyzeWeekendReview,
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  formatTime,
  weekendCloseOverlapNotice,
  mondaySaturdayHolidayNotice,
  runSimulation,
  sanitizeScenario,
  scenarioFromHash,
  scenarioFromJSON,
  scenarioToHash,
  scenarioToJSON,
  compareScenarios,
  planReserve,
  analysisToJSON,
  analyzeTimeline,
  attributeBottlenecks,
  bottleneckCountsToMarkdown,
  previewWindowShift,
  compareDemandProfiles,
  previewDemandProfileStep,
  buildGateGanttSvg,
  ganttToCSV,
  selectedGanttHourToMarkdown,
  remainingReserveAtHourToMarkdown,
  peakQueueHourToMarkdown,
  selectedVersusPeakHourToMarkdown,
  nextPayoutHourToMarkdown,
  closedGanttHoursToMarkdown,
  fxGanttHoursToMarkdown,
  weekendFxHourCountsToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedBankHourToMarkdown,
  firstClosedIssuerHourToMarkdown,
  firstClosedPayoutHourToMarkdown,
  firstOpenPayoutHourToMarkdown,
  firstOpenFxHourToMarkdown,
  firstOpenBankHourToMarkdown,
  firstOpenIssuerHourToMarkdown,
  lastOpenIssuerHourToMarkdown,
  lastOpenBankHourToMarkdown,
  lastOpenPayoutHourToMarkdown,
  lastOpenFxHourToMarkdown,
  lastClosedIssuerHourToMarkdown,
  lastClosedBankHourToMarkdown,
  lastClosedFxHourToMarkdown,
  arrivalCohortsToMarkdown,
  firstClosedGanttHour,
  firstClosedFxGanttHour,
  firstClosedIssuerGanttHour,
  firstClosedPayoutGanttHour,
  firstOpenPayoutGanttHour,
  firstOpenFxGanttHour,
  firstOpenBankGanttHour,
  firstOpenIssuerGanttHour,
  ganttHourClosedOnAnyGate,
  ganttHourClosedOnEveryGate,
  ganttHourOpenOnEveryGate,
  ganttHourIsWeekend,
  ganttHourHasZeroQueue,
  ganttHourBankClosed,
  ganttHourIssuerClosed,
  ganttHourPayoutClosed,
  ganttHourFxClosed,
  ganttHourPayoutOpen,
  ganttHourFxOpen,
  ganttHourBankOpen,
  ganttHourIssuerOpen,
  ganttHourWeekendIssuerOpen,
  ganttHourWeekendIssuerClosed,
  ganttHourWeekendBankClosed,
  ganttHourWeekendBankOpen,
  ganttHourWeekendPayoutOpen,
  ganttHourWeekendFxOpen,
  ganttHourWeekendPayoutClosed,
  GANTT_GATE_FILTERS,
  gateDisplayLabels,
  GENERIC_GATE_LABELS,
  buildGateSchedule,
  compareGateSchedules,
  buildComparisonGanttSvg,
  buildQueueChartSvg,
  buildSensitivityBarsSvg,
  compareSavedExperiments,
  runSensitivity,
  libraryFromJSON,
  workspaceToJSON,
  workspaceFromJSON,
  createScenarioHistory,
  timelineToCSV,
  queueToCSV,
  reportToHTML,
  reportToMarkdown,
  dashboardToMarkdown,
  hoursToClearQueueToMarkdown,
  hoursToFirstSettlementToMarkdown,
  dashboardToCSV,
  compareScenarioFiles,
  compareThreeScenarioFiles
} from "./model.js";`;
const exportedNames = Object.freeze([
  "SIMULATION_HOURS",
  "START_DAY_INDEX",
  "START_HOUR",
  "DEFAULT_SCENARIO",
  "PRESETS",
  "finiteNumber",
  "clamp",
  "normaliseWindow",
  "sanitizeScenario",
  "dayAndHourAt",
  "formatTime",
  "isBusinessDay",
  "weekendCloseOverlapNotice",
  "mondaySaturdayHolidayNotice",
  "isWithinHours",
  "isOperational",
  "getOperationalStatus",
  "buildDemandSchedule",
  "capacityForHour",
  "estimateDiscountBps",
  "nextPayoutTime",
  "hoursToFirstSettlement",
  "hoursToClearQueue",
  "createSnapshot",
  "runSimulation",
  "compareScenarios",
  "planReserve",
  "analysisToJSON",
  "scenarioToHash",
  "scenarioFromHash",
  "scenarioToJSON",
  "scenarioFromJSON",
  "compareScenarioFiles",
  "compareThreeScenarioFiles",
  "analyzeTimeline",
  "runSensitivity",
  "libraryFromJSON",
  "CHART_VIEWS",
  "workspaceToJSON",
  "workspaceFromJSON",
  "createScenarioHistory",
  "timelineToCSV",
  "queueToCSV",
  "reportToHTML",
  "reportToMarkdown",
  "dashboardToMarkdown",
  "hoursToClearQueueToMarkdown",
  "hoursToFirstSettlementToMarkdown",
  "dashboardToCSV",
  "BOTTLENECK_LABELS",
  "attributeBottlenecks",
  "bottleneckCountsToMarkdown",
  "WINDOW_GATES",
  "shiftOperatingWindow",
  "previewWindowShift",
  "DEMAND_PROFILES",
  "DEMAND_PROFILE_STEP_ORDER",
  "stepDemandProfile",
  "previewDemandProfileStep",
  "compareDemandProfiles",
  "GENERIC_GATE_LABELS",
  "redactGateLabels",
  "gateDisplayLabels",
  "buildGateSchedule",
  "firstClosedGanttHour",
  "firstClosedFxGanttHour",
  "firstClosedIssuerGanttHour",
  "firstClosedPayoutGanttHour",
  "firstOpenPayoutGanttHour",
  "firstOpenFxGanttHour",
  "firstOpenBankGanttHour",
  "firstOpenIssuerGanttHour",
  "lastOpenIssuerGanttHour",
  "lastOpenBankGanttHour",
  "lastOpenPayoutGanttHour",
  "lastOpenFxGanttHour",
  "lastClosedIssuerGanttHour",
  "lastClosedBankGanttHour",
  "lastClosedFxGanttHour",
  "ganttHourClosedOnAnyGate",
  "ganttHourClosedOnEveryGate",
  "ganttHourOpenOnEveryGate",
  "ganttHourIsWeekend",
  "ganttHourHasZeroQueue",
  "ganttHourBankClosed",
  "ganttHourIssuerClosed",
  "ganttHourPayoutClosed",
  "ganttHourFxClosed",
  "ganttHourPayoutOpen",
  "ganttHourFxOpen",
  "ganttHourBankOpen",
  "ganttHourIssuerOpen",
  "ganttHourWeekendIssuerOpen",
  "ganttHourWeekendIssuerClosed",
  "ganttHourWeekendBankClosed",
  "ganttHourWeekendBankOpen",
  "ganttHourWeekendPayoutOpen",
  "ganttHourWeekendFxOpen",
  "ganttHourWeekendPayoutClosed",
  "GANTT_GATE_FILTERS",
  "buildGateGanttSvg",
  "ganttToCSV",
  "selectedGanttHourToMarkdown",
  "remainingReserveAtHourToMarkdown",
  "peakQueueHourToMarkdown",
  "selectedVersusPeakHourToMarkdown",
  "nextPayoutHourToMarkdown",
  "closedGanttHoursToMarkdown",
  "fxGanttHoursToMarkdown",
  "weekendFxHourCountsToMarkdown",
  "firstClosedFxHourToMarkdown",
  "firstClosedBankHourToMarkdown",
  "firstClosedIssuerHourToMarkdown",
  "firstClosedPayoutHourToMarkdown",
  "firstOpenPayoutHourToMarkdown",
  "firstOpenFxHourToMarkdown",
  "firstOpenBankHourToMarkdown",
  "firstOpenIssuerHourToMarkdown",
  "lastOpenIssuerHourToMarkdown",
  "lastOpenBankHourToMarkdown",
  "lastOpenPayoutHourToMarkdown",
  "lastOpenFxHourToMarkdown",
  "lastClosedIssuerHourToMarkdown",
  "lastClosedBankHourToMarkdown",
  "lastClosedFxHourToMarkdown",
  "arrivalCohortsToMarkdown",
  "compareGateSchedules",
  "buildComparisonGanttSvg",
  "buildQueueChartSvg",
  "buildSensitivityBarsSvg",
  "compareSavedExperiments",
  "WEEKEND_REVIEW_TOOLS",
  "analyzeWeekendReview",
  "createWeekendReviewPacket",
  "replayWeekendReviewPacket"
]);

function normaliseLf(text) {
  return text.replace(/\r\n?/g, "\n");
}

function replaceExactlyOnce(source, marker, replacement, label) {
  const matches = source.split(marker).length - 1;
  if (matches !== 1) throw new Error(`${label} replacement marker must appear exactly once; found ${matches}.`);
  return source.replace(marker, () => replacement);
}

function assertNoUnsafeInlineBoundary(source, label, closingTag) {
  if (source.toLowerCase().includes(closingTag)) {
    throw new Error(`${label} contains ${closingTag}, which cannot be safely inlined.`);
  }
}

function bundleModel(modelSource) {
  const exported = [...modelSource.matchAll(/^export (?:const|function) (\w+)/gm)].map((match) => match[1]);
  if (exported.length !== exportedNames.length || exported.some((name, index) => name !== exportedNames[index])) {
    throw new Error("Model export markers changed. Refusing to build an unsafe standalone bundle.");
  }
  const body = modelSource.replace(/^export /gm, "");
  return `window.__WeekendGapModel = Object.freeze((() => {\n${body}\nreturn { ${exportedNames.join(", ")} };\n})());`;
}

function bundleApp(appSource) {
  const bindings = `const { ${exportedNames.join(", ")} } = window.__WeekendGapModel;`;
  const bundled = replaceExactlyOnce(appSource, appImportMarker, bindings, "App module import");
  if (/^\s*import\s/m.test(bundled)) throw new Error("App contains an unresolved import. Refusing to build standalone HTML.");
  return bundled;
}

function assertSelfContained(html) {
  if (/<(?:link|script)\b[^>]*(?:href|src)=/i.test(html)) {
    throw new Error("Standalone HTML still contains an external stylesheet or script reference.");
  }
  if (/href="(?!#)/i.test(html)) {
    throw new Error("Standalone HTML still contains an external resource reference.");
  }
  const csp = `<meta http-equiv="Content-Security-Policy" content="${standaloneCsp}">`;
  if (html.split(csp).length - 1 !== 1) {
    throw new Error("Standalone HTML must contain exactly one restrictive CSP meta tag.");
  }
  if (/\r/.test(html)) throw new Error("Standalone HTML must use LF line endings only.");
}

export async function buildStandalone() {
  const [rawHtml, rawCss, rawModel, rawApp] = await Promise.all([
    readFile(sourcePaths.html, "utf8"),
    readFile(sourcePaths.css, "utf8"),
    readFile(sourcePaths.model, "utf8"),
    readFile(sourcePaths.app, "utf8"),
  ]);
  const html = normaliseLf(rawHtml);
  const css = normaliseLf(rawCss);
  const model = normaliseLf(rawModel);
  const app = normaliseLf(rawApp);

  assertNoUnsafeInlineBoundary(css, "Stylesheet", "</style");
  assertNoUnsafeInlineBoundary(model, "Model", "</script");
  assertNoUnsafeInlineBoundary(app, "App", "</script");
  if (/@import\s|url\s*\(/i.test(css)) throw new Error("Stylesheet contains an external resource reference.");

  let output = replaceExactlyOnce(html, htmlMarker, '<html lang="en" data-weekend-gap-standalone="true">', "HTML mode");
  output = replaceExactlyOnce(
    output,
    cspMarker,
    `${cspMarker}\n    <meta http-equiv="Content-Security-Policy" content="${standaloneCsp}">`,
    "Content Security Policy",
  );
  output = replaceExactlyOnce(output, cssMarker, `<style>\n${css}\n</style>`, "Stylesheet");
  output = replaceExactlyOnce(output, modelLinkMarker, '<p class="method-link">Detailed formulas and limits are included in this standalone simulator.</p>', "Model link");
  output = replaceExactlyOnce(output, appMarker, `<script>\n${bundleModel(model)}\n</script>\n<script>\n${bundleApp(app)}\n</script>`, "App script");
  output = `${output.trimEnd()}\n`;
  assertSelfContained(output);
  return output;
}

export function isStandaloneCurrent(current, expected) {
  return typeof current === "string" && normaliseLf(current) === normaliseLf(expected);
}

export async function main(args = process.argv.slice(2)) {
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    console.error("Usage: npm run build:standalone [-- --check]");
    return 1;
  }
  const output = await buildStandalone();
  if (args[0] === "--check") {
    let current = null;
    try {
      current = await readFile(outputPath, "utf8");
    } catch {
      // A missing file is stale and must be regenerated.
    }
    if (!isStandaloneCurrent(current, output)) {
      console.error("standalone.html is missing or stale. Run npm run build:standalone.");
      return 1;
    }
    console.log("standalone.html is current.");
    return 0;
  }
  await writeFile(outputPath, output, "utf8");
  console.log("Built standalone.html.");
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().then((exitCode) => {
    if (exitCode !== 0) process.exitCode = exitCode;
  }).catch((error) => {
    console.error(`Standalone build failed: ${error.message}`);
    process.exitCode = 1;
  });
}
