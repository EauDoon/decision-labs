/**
 * Pure, deterministic agreement calculations.
 * The model treats labels as data. It never infers their meaning.
 */

export const MAX_COMBINATIONS = 50000;
export const MAX_GROUPS = 24;
export const MAX_CLAUSES = 20;
export const MAX_OPTIONS_PER_CLAUSE = 24;
export const MAX_NEAR_MISSES = 5;
export const MAX_WEIGHT = 1_000_000;
export const MAX_CHANGE_COST = 1_000_000_000;

const EPSILON = 1e-9;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RESERVED_IDS = new Set(["constructor", "prototype", "__proto__"]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function uniqueIds(items, path, errors) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item.id !== "string" || !ID_PATTERN.test(item.id) || RESERVED_IDS.has(item.id)) {
      errors.push(`${path}[${index}].id must be 1 to 64 safe identifier characters.`);
      return;
    }
    if (seen.has(item.id)) errors.push(`${path}[${index}].id must be unique.`);
    seen.add(item.id);
  });
}

/** Return structured validation errors without mutating the proposal. */
export function validateProposal(proposal) {
  const errors = [];
  if (!isPlainObject(proposal)) return { valid: false, errors: ["Proposal must be an object."] };
  if (typeof proposal.title !== "string" || !proposal.title.trim() || proposal.title.length > 120) errors.push("title must be a non-empty string no longer than 120 characters.");
  if (!isFiniteNumber(proposal.threshold) || proposal.threshold < 0 || proposal.threshold > 100) {
    errors.push("threshold must be a number from 0 to 100.");
  }
  if (Object.hasOwn(proposal, "maxChangeCost") && (!isFiniteNumber(proposal.maxChangeCost) || proposal.maxChangeCost < 0 || proposal.maxChangeCost > MAX_CHANGE_COST * MAX_CLAUSES)) {
    errors.push(`maxChangeCost must be from 0 through ${MAX_CHANGE_COST * MAX_CLAUSES}, or omitted.`);
  }
  if (!Array.isArray(proposal.groups) || proposal.groups.length < 1 || proposal.groups.length > MAX_GROUPS) {
    errors.push(`Between 1 and ${MAX_GROUPS} participant groups are required.`);
  } else {
    uniqueIds(proposal.groups, "groups", errors);
    proposal.groups.forEach((group, index) => {
      if (!isPlainObject(group) || typeof group.name !== "string" || !group.name.trim() || group.name.length > 80) {
        errors.push(`groups[${index}].name must be a non-empty string no longer than 80 characters.`);
      }
      if (!isFiniteNumber(group?.weight) || group.weight <= 0 || group.weight > MAX_WEIGHT) {
        errors.push(`groups[${index}].weight must be greater than 0 and no more than ${MAX_WEIGHT}.`);
      }
      if (isPlainObject(group) && Object.hasOwn(group, "minSupport") && (!isFiniteNumber(group.minSupport) || group.minSupport < 0 || group.minSupport > 100)) {
        errors.push(`groups[${index}].minSupport must be from 0 to 100, or omitted.`);
      }
      if (isPlainObject(group) && Object.hasOwn(group, "veto") && typeof group.veto !== "boolean") {
        errors.push(`groups[${index}].veto must be a boolean, or omitted.`);
      }
    });
  }
  if (!Array.isArray(proposal.clauses) || proposal.clauses.length < 1 || proposal.clauses.length > MAX_CLAUSES) {
    errors.push(`Between 1 and ${MAX_CLAUSES} clauses are required.`);
  } else {
    uniqueIds(proposal.clauses, "clauses", errors);
    const groupIds = new Set(Array.isArray(proposal.groups)
      ? proposal.groups.filter(isPlainObject).map((group) => group.id).filter((id) => typeof id === "string")
      : []);
    proposal.clauses.forEach((clause, clauseIndex) => {
      if (!isPlainObject(clause) || typeof clause.title !== "string" || !clause.title.trim() || clause.title.length > 120) {
        errors.push(`clauses[${clauseIndex}].title must be a non-empty string no longer than 120 characters.`);
      }
      if (!Array.isArray(clause?.options) || clause.options.length < 3 || clause.options.length > MAX_OPTIONS_PER_CLAUSE) {
        errors.push(`clauses[${clauseIndex}] needs 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`);
        return;
      }
      uniqueIds(clause.options, `clauses[${clauseIndex}].options`, errors);
      let originals = 0;
      clause.options.forEach((option, optionIndex) => {
        const path = `clauses[${clauseIndex}].options[${optionIndex}]`;
        if (!isPlainObject(option) || typeof option.label !== "string" || !option.label.trim() || option.label.length > 240) {
          errors.push(`${path}.label must be a non-empty string no longer than 240 characters.`);
        }
        if (isPlainObject(option) && Object.hasOwn(option, "original") && typeof option.original !== "boolean") {
          errors.push(`${path}.original must be a boolean, or omitted for an alternative.`);
        }
        if (isPlainObject(option) && Object.hasOwn(option, "original") && option.original === true) originals += 1;
        if (!isFiniteNumber(option?.changeCost) || option.changeCost < 0 || option.changeCost > MAX_CHANGE_COST) {
          errors.push(`${path}.changeCost must be from 0 through ${MAX_CHANGE_COST}.`);
        }
        if (!isPlainObject(option?.support)) {
          errors.push(`${path}.support must be an object.`);
        } else {
          groupIds.forEach((groupId) => {
            const score = Object.hasOwn(option.support, groupId) ? option.support[groupId] : undefined;
            if (!isFiniteNumber(score) || score < 0 || score > 100) {
              errors.push(`${path}.support.${groupId} must be a number from 0 to 100.`);
            }
          });
          if (Object.keys(option.support).some((key) => !groupIds.has(key))) {
            errors.push(`${path}.support may only contain the declared group ids.`);
          }
        }
      });
      if (originals !== 1) errors.push(`clauses[${clauseIndex}] must have exactly one original option.`);
      const original = clause.options.find((option) => isPlainObject(option) && Object.hasOwn(option, "original") && option.original === true);
      if (original && original.changeCost !== 0) errors.push(`clauses[${clauseIndex}] original option must have zero change cost.`);
      if (isPlainObject(clause) && Object.hasOwn(clause, "lockedOptionId") && (typeof clause.lockedOptionId !== "string" || !clause.options.some((option) => option?.id === clause.lockedOptionId))) {
        errors.push(`clauses[${clauseIndex}].lockedOptionId must identify an option in that clause, or be omitted.`);
      }
      if (isPlainObject(clause) && Object.hasOwn(clause, "note") && (typeof clause.note !== "string" || clause.note.length < 1 || clause.note.length > 240)) {
        errors.push(`clauses[${clauseIndex}].note must be a string of 1 to 240 characters, or omitted.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

/** Return only the validated fields that the application understands. */
export function canonicalProposal(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) throw new TypeError(validation.errors[0]);
  const groupIds = proposal.groups.map(({ id }) => id);
  return {
    title: proposal.title,
    threshold: proposal.threshold,
    ...(Object.hasOwn(proposal, "maxChangeCost") ? { maxChangeCost: proposal.maxChangeCost } : {}),
    groups: proposal.groups.map((group) => ({
      id: group.id,
      name: group.name,
      weight: group.weight,
      ...(Object.hasOwn(group, "minSupport") ? { minSupport: group.minSupport } : {}),
      ...(group.veto === true ? { veto: true } : {}),
    })),
    clauses: proposal.clauses.map((clause) => ({
      id: clause.id,
      title: clause.title,
      ...(Object.hasOwn(clause, "lockedOptionId") ? { lockedOptionId: clause.lockedOptionId } : {}),
      ...(Object.hasOwn(clause, "note") ? { note: clause.note } : {}),
      options: clause.options.map((option) => ({
        id: option.id,
        label: option.label,
        original: Object.hasOwn(option, "original") && option.original === true,
        changeCost: option.changeCost,
        support: Object.fromEntries(groupIds.map((groupId) => [groupId, option.support[groupId]])),
      })),
    })),
  };
}

export function getOriginalOptions(proposal) {
  return proposal.clauses.map((clause) => clause.options.find((option) => option.original === true));
}

export function approvalForOptions(groups, options) {
  const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
  const totalSupport = groups.reduce(
    (sum, group) => sum + group.weight * options.reduce((optionSum, option) => optionSum + option.support[group.id], 0),
    0,
  );
  const maximum = totalWeight * options.length * 100;
  return maximum === 0 ? 0 : (totalSupport / maximum) * 100;
}

export function approvalByGroup(groups, options) {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    weight: group.weight,
    approval: options.reduce((sum, option) => sum + option.support[group.id], 0) / options.length,
  }));
}

/** Weighted support for one option using the same group weights as overall approval. */
export function clauseWeightedSupport(groups, option) {
  const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
  const totalSupport = groups.reduce((sum, group) => sum + group.weight * option.support[group.id], 0);
  return totalWeight === 0 ? 0 : totalSupport / totalWeight;
}

/**
 * Show how each selected clause option contributes to overall approval versus the original options.
 * Overall approval is the mean of per-clause weighted support, so each clause pulls equally.
 * This is an accounting of supplied scores, not bargaining power or a forecast.
 */
export function clauseContributions(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => {
    const match = clause.options.find((option) => option.id === options[index]?.id);
    return match ?? null;
  });
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const originals = getOriginalOptions(proposal);
  const clauseCount = proposal.clauses.length;
  const rows = proposal.clauses.map((clause, index) => {
    const selectedSupport = clauseWeightedSupport(proposal.groups, selected[index]);
    const originalSupport = clauseWeightedSupport(proposal.groups, originals[index]);
    const delta = selectedSupport - originalSupport;
    return {
      clauseId: clause.id,
      clauseTitle: clause.title,
      optionId: selected[index].id,
      optionLabel: selected[index].label,
      originalOptionId: originals[index].id,
      originalLabel: originals[index].label,
      selectedSupport,
      originalSupport,
      delta,
      overallPull: delta / clauseCount,
    };
  });
  return {
    status: "ok",
    clauseCount,
    overallApproval: approvalForOptions(proposal.groups, selected),
    originalApproval: approvalForOptions(proposal.groups, originals),
    rows,
  };
}

export function selectionSummary(proposal, options, baselineOptions = getOriginalOptions(proposal)) {
  const changes = options
    .map((option, index) => ({ clause: proposal.clauses[index], option, baseline: baselineOptions[index] }))
    .filter(({ option, baseline }) => option.id !== baseline.id)
    .map(({ clause, option, baseline }) => ({
      clauseId: clause.id,
      clauseTitle: clause.title,
      from: baseline.label,
      to: option.label,
      changeCost: option.changeCost,
    }));
  const groupDeltas = proposal.groups.map((group) => {
    const before = baselineOptions.reduce((sum, option) => sum + option.support[group.id], 0) / baselineOptions.length;
    const after = options.reduce((sum, option) => sum + option.support[group.id], 0) / options.length;
    return { id: group.id, name: group.name, weight: group.weight, before, after, delta: after - before };
  });
  const byGroup = approvalByGroup(proposal.groups, options);
  const changeCost = changes.reduce((sum, change) => sum + change.changeCost, 0);
  const floors = proposal.groups.filter((group) => group.minSupport !== undefined).map((group) => {
    const actual = byGroup.find((row) => row.id === group.id).approval;
    return { id: group.id, name: group.name, minimum: group.minSupport, actual, met: actual + EPSILON >= group.minSupport };
  });
  const vetoes = proposal.groups.filter((group) => group.veto === true).map((group) => {
    const actual = byGroup.find((row) => row.id === group.id).approval;
    const required = group.minSupport === undefined ? proposal.threshold : Math.max(proposal.threshold, group.minSupport);
    return { id: group.id, name: group.name, required, actual, met: actual + EPSILON >= required };
  });
  const locks = proposal.clauses.flatMap((clause, index) => clause.lockedOptionId === undefined ? [] : [{
    clauseId: clause.id, clauseTitle: clause.title, optionId: clause.lockedOptionId,
    label: clause.options.find((option) => option.id === clause.lockedOptionId).label,
    met: options[index].id === clause.lockedOptionId,
  }]);
  const budget = proposal.maxChangeCost === undefined ? null : { maximum: proposal.maxChangeCost, actual: changeCost, met: changeCost <= proposal.maxChangeCost + EPSILON };
  return {
    options,
    approval: approvalForOptions(proposal.groups, options),
    byGroup,
    changes,
    changeCost,
    constraints: { floors, locks, budget, vetoes, met: floors.every((floor) => floor.met) && locks.every((lock) => lock.met) && (!budget || budget.met) && vetoes.every((veto) => veto.met) },
    changedClauseCount: changes.length,
    groupDeltas,
    supportersGained: groupDeltas.filter((group) => group.delta > EPSILON),
    supportersLost: groupDeltas.filter((group) => group.delta < -EPSILON),
  };
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Best-first ordering for passing candidates:
 * lower cost, fewer changed clauses, higher approval, then option ids by clause order.
 */
export function compareAgreements(a, b) {
  if (Math.abs(a.changeCost - b.changeCost) > EPSILON) return a.changeCost - b.changeCost;
  if (a.changedClauseCount !== b.changedClauseCount) return a.changedClauseCount - b.changedClauseCount;
  if (Math.abs(a.approval - b.approval) > EPSILON) return b.approval - a.approval;
  for (let index = 0; index < a.options.length; index += 1) {
    const comparison = compareText(a.options[index].id, b.options[index].id);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

/** Near misses prioritize closest approval gap, then the same deterministic agreement order. */
export function compareNearMisses(threshold, a, b) {
  const gapA = threshold - a.approval;
  const gapB = threshold - b.approval;
  if (Math.abs(gapA - gapB) > EPSILON) return gapA - gapB;
  return compareAgreements(a, b);
}

/**
 * Reorder described near-miss rows for display.
 * Does not change which combinations the solver retained.
 */
export function sortPackageGapRows(rows, sortBy = "approval_gap") {
  if (!Array.isArray(rows)) return { status: "invalid", errors: ["Near-miss rows must be an array."] };
  if (sortBy !== "approval_gap" && sortBy !== "change_cost") {
    return { status: "invalid", errors: ["sortBy must be approval_gap or change_cost."] };
  }
  const ordered = [...rows].sort((left, right) => {
    if (sortBy === "change_cost") {
      if (Math.abs((left.changeCost ?? 0) - (right.changeCost ?? 0)) > EPSILON) return left.changeCost - right.changeCost;
      if (Math.abs((left.approvalGap ?? 0) - (right.approvalGap ?? 0)) > EPSILON) return left.approvalGap - right.approvalGap;
    } else {
      if (Math.abs((left.approvalGap ?? 0) - (right.approvalGap ?? 0)) > EPSILON) return left.approvalGap - right.approvalGap;
      if (Math.abs((left.changeCost ?? 0) - (right.changeCost ?? 0)) > EPSILON) return left.changeCost - right.changeCost;
    }
    if ((left.changedClauseCount ?? 0) !== (right.changedClauseCount ?? 0)) return left.changedClauseCount - right.changedClauseCount;
    if (Math.abs((left.approval ?? 0) - (right.approval ?? 0)) > EPSILON) return right.approval - left.approval;
    return compareText(String(left.labels ?? ""), String(right.labels ?? ""));
  });
  return { status: "ok", sortBy, rows: ordered };
}

function samePackage(a, b) {
  if (!a || !b || a.options.length !== b.options.length) return false;
  return a.options.every((option, index) => option.id === b.options[index].id);
}

/**
 * Explain the model's constraint-compliant near misses and the next passing packages.
 * Cheaper misses cost less than the recommended package and still miss the threshold.
 * Next-over packages are later passing alternatives, not a claim that they are fairer.
 */
export function explorePackageGaps(proposal, result) {
  if (!isPlainObject(proposal) || !isPlainObject(result) || result.status === "invalid" || result.status === "too_large") {
    return {
      status: result?.status ?? "invalid",
      errors: result?.errors,
      cheaperMisses: [],
      closestMisses: [],
      nextOverThreshold: [],
      recommended: null,
    };
  }
  const recommended = result.agreement ?? null;
  const describe = (summary) => ({
    approval: summary.approval,
    changeCost: summary.changeCost,
    changedClauseCount: summary.changedClauseCount,
    approvalGap: proposal.threshold - summary.approval,
    costVsRecommended: recommended ? summary.changeCost - recommended.changeCost : null,
    cheaperThanRecommended: recommended ? summary.changeCost + EPSILON < recommended.changeCost : true,
    meetsThreshold: summary.approval + EPSILON >= proposal.threshold,
    labels: summary.options.map((option, index) => `${proposal.clauses[index].title}: ${option.label}`).join("; "),
    optionIds: summary.options.map((option) => option.id),
  });
  const closestMisses = (result.nearMisses ?? []).map(describe);
  const cheaperMisses = closestMisses.filter((row) => row.cheaperThanRecommended);
  const nextOverThreshold = (result.alternatives ?? [])
    .filter((candidate) => !samePackage(candidate, recommended))
    .map(describe);
  return {
    status: "ok",
    recommended: recommended ? describe(recommended) : null,
    cheaperMisses,
    closestMisses,
    nextOverThreshold,
  };
}

export function combinationCount(clauses, cap = Number.MAX_SAFE_INTEGER) {
  let count = 1;
  for (const clause of clauses) {
    const choices = clause.lockedOptionId === undefined ? clause.options.length : 1;
    if (choices === 0 || count > Math.floor(cap / choices)) return cap + 1;
    count *= choices;
  }
  return count;
}

/**
 * Deterministically evaluates every option combination if it is within the cap.
 * It intentionally returns too_large instead of silently sampling candidates.
 */
export function findSmallestAgreement(proposal, options = {}) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!isPlainObject(options)) {
    return { status: "invalid", errors: ["Search options must be a plain object."] };
  }
  const unknown = Object.keys(options).filter((key) => key !== "maxCombinations" && key !== "nearMissLimit" && key !== "alternativesLimit");
  if (unknown.length > 0) {
    return { status: "invalid", errors: [`Unknown search option: ${unknown.join(", ")}.`] };
  }
  const maxCombinations = Object.hasOwn(options, "maxCombinations") ? options.maxCombinations : MAX_COMBINATIONS;
  const nearMissLimit = Object.hasOwn(options, "nearMissLimit") ? options.nearMissLimit : MAX_NEAR_MISSES;
  if (!Number.isSafeInteger(maxCombinations) || maxCombinations < 1 || maxCombinations > MAX_COMBINATIONS) {
    return { status: "invalid", errors: [`maxCombinations must be an integer from 1 through ${MAX_COMBINATIONS}.`] };
  }
  if (!Number.isSafeInteger(nearMissLimit) || nearMissLimit < 0 || nearMissLimit > MAX_NEAR_MISSES) {
    return { status: "invalid", errors: [`nearMissLimit must be an integer from 0 through ${MAX_NEAR_MISSES}.`] };
  }
  const alternativesLimit = Object.hasOwn(options, "alternativesLimit") ? options.alternativesLimit : 0;
  if (!Number.isSafeInteger(alternativesLimit) || alternativesLimit < 0 || alternativesLimit > 5) {
    return { status: "invalid", errors: ["alternativesLimit must be an integer from 0 through 5."] };
  }
  const possibleCombinations = combinationCount(proposal.clauses, maxCombinations);
  if (possibleCombinations > maxCombinations) {
    return { status: "too_large", possibleCombinations, maxCombinations, nearMisses: [] };
  }

  const baseline = selectionSummary(proposal, getOriginalOptions(proposal));
  if (baseline.approval + EPSILON >= proposal.threshold && baseline.constraints.met && alternativesLimit === 0) {
    return { status: "already_passing", possibleCombinations, checkedCombinations: 1, baseline, agreement: baseline, nearMisses: [], rejected: { budget: 0, floors: 0, vetoes: 0, anyConstraint: 0 }, eligibleCombinations: 1 };
  }

  let best = null;
  const alternatives = [];
  let passingCombinations = 0;
  const nearMisses = [];
  const rejected = { budget: 0, floors: 0, vetoes: 0, anyConstraint: 0 };
  let eligibleCombinations = 0;
  const selected = [];
  const visit = (clauseIndex) => {
    if (clauseIndex === proposal.clauses.length) {
      const summary = selectionSummary(proposal, [...selected]);
      if (!summary.constraints.met) {
        rejected.anyConstraint += 1;
        if (summary.constraints.budget && !summary.constraints.budget.met) rejected.budget += 1;
        if (summary.constraints.floors.some((floor) => !floor.met)) rejected.floors += 1;
        if (summary.constraints.vetoes.some((veto) => !veto.met)) rejected.vetoes += 1;
        return;
      }
      eligibleCombinations += 1;
      if (summary.approval + EPSILON >= proposal.threshold) {
        passingCombinations += 1;
        if (!best || compareAgreements(summary, best) < 0) best = summary;
        if (alternativesLimit > 0) {
          alternatives.push(summary);
          alternatives.sort(compareAgreements);
          if (alternatives.length > alternativesLimit) alternatives.pop();
        }
      } else if (nearMissLimit > 0) {
        nearMisses.push(summary);
        nearMisses.sort((a, b) => compareNearMisses(proposal.threshold, a, b));
        if (nearMisses.length > nearMissLimit) nearMisses.pop();
      }
      return;
    }
    for (const option of proposal.clauses[clauseIndex].options) {
      if (proposal.clauses[clauseIndex].lockedOptionId !== undefined && option.id !== proposal.clauses[clauseIndex].lockedOptionId) continue;
      selected.push(option);
      visit(clauseIndex + 1);
      selected.pop();
    }
  };
  visit(0);
  const result = {
    status: best ? (best.changedClauseCount === 0 ? "already_passing" : "found") : "infeasible",
    alternatives,
    passingCombinations,
    possibleCombinations,
    checkedCombinations: possibleCombinations,
    eligibleCombinations,
    rejected,
    baseline,
    agreement: best,
    nearMisses,
  };
  return result;
}

export function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function briefText(value) {
  return String(value ?? "")
    .replace(/[\r\n|]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/([\\`*_{}\[\]()#+.!])/gu, "\\$1") || "(unnamed)";
}

function briefOption(value) {
  return `\"${briefText(value)}\"`;
}

/**
 * Produce a deterministic Markdown handoff for a result that people can review outside the GUI.
 * The brief reports the model output and inputs, but never claims legitimacy or authority.
 */
export function formatDecisionBrief(proposal, result) {
  const title = briefText(proposal?.title) || "Untitled proposal";
  const threshold = Number.isFinite(proposal?.threshold) ? formatPercent(proposal.threshold) : "unknown";
  const lines = [
    "# The Smallest Agreement",
    "",
    `Proposal: ${title}`,
    `Approval threshold: ${threshold}`,
    "",
  ];

  if (!result || result.status === "invalid") {
    lines.push("## Result", "", "The draft is not valid enough to evaluate.", "");
    for (const error of result?.errors ?? ["No result was available."]) lines.push(`- ${briefText(error)}`);
    lines.push("");
    return `${lines.join("\n")}Scores, weights, and costs remain human inputs.\n`;
  }

  lines.push("## Search constraints", "", `Maximum total change cost: ${proposal.maxChangeCost === undefined ? "unlimited" : proposal.maxChangeCost}`, "");
  const protectedGroups = proposal.groups.filter((group) => group.minSupport !== undefined);
  if (!protectedGroups.length) lines.push("No group support floors set.");
  for (const group of protectedGroups) lines.push(`- ${briefText(group.name)}: average support must be at least ${group.minSupport}%.`);
  const vetoGroups = proposal.groups.filter((group) => group.veto === true);
  if (!vetoGroups.length) lines.push("No veto groups set.");
  for (const group of vetoGroups) {
    const required = group.minSupport === undefined ? proposal.threshold : Math.max(proposal.threshold, group.minSupport);
    lines.push(`- ${briefText(group.name)} has a veto: average support must be at least ${required}%.`);
  }
  const lockedClauses = proposal.clauses.filter((clause) => clause.lockedOptionId !== undefined);
  if (!lockedClauses.length) lines.push("No clause options locked.");
  for (const clause of lockedClauses) lines.push(`- Lock ${briefText(clause.title)} to ${briefOption(clause.options.find((option) => option.id === clause.lockedOptionId).label)}.`);
  lines.push("");

  if (result.status === "too_large") {
    lines.push("## Result", "", `The exhaustive search stopped above ${Number(result.maxCombinations).toLocaleString("en-US")} combinations.`, "", "Reduce alternatives or clauses before relying on a recommendation.", "");
    return `${lines.join("\n")}Scores, weights, and costs remain human inputs.\n`;
  }

  const current = result.baseline;
  const agreement = result.agreement;
  lines.push("## Result", "");
  if (result.status === "already_passing") lines.push("The original proposal crosses the threshold and meets every constraint. No change is needed.", "");
  else if (result.status === "found") lines.push("A lowest-cost passing combination was found.", "Every configured constraint is met.", "");
  else lines.push("No permitted combination meets both the threshold and every configured constraint.", "");
  lines.push(`Search combinations checked: ${Number(result.checkedCombinations).toLocaleString("en-US")}`, `Lock-permitted search space: ${Number(result.possibleCombinations).toLocaleString("en-US")}`);
  if (result.checkedCombinations !== 1 || result.status !== "already_passing") lines.push(`Constraint-compliant combinations: ${result.eligibleCombinations}`, `Rejected by budget: ${result.rejected.budget}; by group floors: ${result.rejected.floors}; by veto groups: ${result.rejected.vetoes}. Rejection counts may overlap.`);
  lines.push(`Current approval: ${formatPercent(current.approval)}`, `Original proposal meets constraints: ${current.constraints.met ? "yes" : "no"}`);

  if (agreement) {
    lines.push(`Recommended approval: ${formatPercent(agreement.approval)}`, `Total change cost: ${agreement.changeCost.toFixed(1)}`, `Changed clauses: ${agreement.changedClauseCount}`, "");
    lines.push("## Recommendation", "");
    if (agreement.changes.length) {
      for (const change of agreement.changes) {
        lines.push(`- ${briefText(change.clauseTitle)}: ${briefOption(change.from)} => ${briefOption(change.to)} (cost ${change.changeCost.toFixed(1)})`);
      }
    } else {
      lines.push("- Keep every original option.");
    }
    lines.push("");
  } else {
    lines.push("", "## Recommendation", "", "No passing combination was found.", "");
  }

  lines.push("## Group view", "", "| Group | Weight | Current | Recommended | Change |", "| --- | ---: | ---: | ---: | ---: |");
  for (const group of current.byGroup) {
    const after = agreement?.byGroup.find((candidate) => candidate.id === group.id)?.approval;
    const recommended = Number.isFinite(after) ? formatPercent(after) : "not found";
    const delta = Number.isFinite(after) ? `${after - group.approval >= 0 ? "+" : ""}${(after - group.approval).toFixed(1)} points` : "not found";
    lines.push(`| ${briefText(group.name)} | ${group.weight} | ${formatPercent(group.approval)} | ${recommended} | ${delta} |`);
  }
  lines.push("");

  if (agreement && (protectedGroups.length || vetoGroups.length)) {
    lines.push("## Protected-group checks", "");
    for (const floor of agreement.constraints.floors) lines.push(`- ${briefText(floor.name)}: ${formatPercent(floor.actual)} against minimum ${floor.minimum}%, ${floor.met ? "met" : "not met"}.`);
    for (const veto of agreement.constraints.vetoes) lines.push(`- ${briefText(veto.name)} veto: ${formatPercent(veto.actual)} against ${veto.required}%, ${veto.met ? "met" : "not met"}.`);
    lines.push("");
  }

  if (result.alternatives?.length) {
    lines.push("## Passing packages", "", "Ranked by cost, changed clauses, approval, then option IDs. This ordering does not establish fairness.", "");
    for (const [index, candidate] of result.alternatives.entries()) {
      lines.push((index + 1) + ". Cost " + candidate.changeCost.toFixed(1) + ", approval " + formatPercent(candidate.approval) + ": " + candidate.options.map((option, i) => briefText(proposal.clauses[i].title) + ": " + briefText(option.label)).join("; "));
    }
    lines.push("");
  }

  if (result.nearMisses?.length) {
    lines.push("## Near misses", "", "These meet every configured constraint but fall below the overall threshold.", "");
    for (const miss of result.nearMisses) {
      const labels = miss.changes.length ? miss.changes.map((change) => `${briefText(change.clauseTitle)}: ${briefText(change.to)}`).join("; ") : "Keep every original option";
      lines.push(`- ${formatPercent(miss.approval)}, short by ${(proposal.threshold - miss.approval).toFixed(1)} points, cost ${miss.changeCost.toFixed(1)}: ${labels}`);
    }
    lines.push("");
  }
  lines.push("Scores, weights, and costs remain human inputs. This brief is a deliberation aid, not a decision or a claim of legitimacy.");
  return `${lines.join("\n")}\n`;
}


/** Evaluate a human-selected package, including locks, without changing the proposal. */
export function evaluatePackage(proposal, optionIds) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(optionIds) || optionIds.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === optionIds[index]));
  if (selected.some((option) => !option)) return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  const summary = selectionSummary(proposal, selected);
  return { status: summary.constraints.met && summary.approval + EPSILON >= proposal.threshold ? "passing" : "not_passing", summary };
}

function packageChoice(summary, index) {
  if (!summary) return null;
  const option = summary.options[index];
  return { optionId: option.id, label: option.label, changeCost: option.changeCost };
}

/**
 * Pin original, solver, and custom packages side by side for inspection.
 * This is a readout of three supplied packages, not a vote or a new optimization.
 */
export function comparePinnedPackages(proposal, recommendedIds, customIds) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const originalSummary = selectionSummary(proposal, getOriginalOptions(proposal));
  let recommendedSummary = null;
  if (recommendedIds != null) {
    const recommended = evaluatePackage(proposal, recommendedIds);
    if (recommended.status === "invalid") return recommended;
    recommendedSummary = recommended.summary;
  }
  let customSummary = null;
  if (customIds != null) {
    const custom = evaluatePackage(proposal, customIds);
    if (custom.status === "invalid") return custom;
    customSummary = custom.summary;
  }
  return {
    status: "ok",
    originalApproval: originalSummary.approval,
    recommendedApproval: recommendedSummary ? recommendedSummary.approval : null,
    customApproval: customSummary ? customSummary.approval : null,
    originalCost: originalSummary.changeCost,
    recommendedCost: recommendedSummary ? recommendedSummary.changeCost : null,
    customCost: customSummary ? customSummary.changeCost : null,
    clauses: proposal.clauses.map((clause, index) => ({
      clauseId: clause.id,
      clauseTitle: clause.title,
      original: packageChoice(originalSummary, index),
      recommended: packageChoice(recommendedSummary, index),
      custom: packageChoice(customSummary, index),
    })),
    groups: proposal.groups.map((group, index) => ({
      id: group.id,
      name: group.name,
      original: originalSummary.byGroup[index].approval,
      recommended: recommendedSummary ? recommendedSummary.byGroup[index].approval : null,
      custom: customSummary ? customSummary.byGroup[index].approval : null,
    })),
  };
}

/**
 * Lock every clause to the given option IDs in one copy.
 * Does not mutate the supplied proposal. Invalid identifiers fail closed.
 */
export function lockPackage(proposal, optionIds) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(optionIds) || optionIds.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const next = canonicalProposal(proposal);
  for (let index = 0; index < next.clauses.length; index += 1) {
    const optionId = optionIds[index];
    if (typeof optionId !== "string" || !next.clauses[index].options.some((option) => option.id === optionId)) {
      return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
    }
    next.clauses[index].lockedOptionId = optionId;
  }
  return { status: "ok", proposal: next };
}

/**
 * Remove every clause lock in one copy.
 * Does not mutate the supplied proposal. Invalid drafts fail closed.
 */
export function clearAllLocks(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const next = canonicalProposal(proposal);
  let cleared = 0;
  for (const clause of next.clauses) {
    if (Object.hasOwn(clause, "lockedOptionId")) {
      delete clause.lockedOptionId;
      cleared += 1;
    }
  }
  return { status: "ok", proposal: next, cleared };
}

/**
 * Lock or unlock one clause option on a copy of the proposal.
 * Locking an option replaces any previous lock on that clause. Unlocking the
 * currently locked option removes the lock. Does not mutate the input.
 */
export function toggleClauseLock(proposal, clauseId, optionId) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof clauseId !== "string" || typeof optionId !== "string") {
    return { status: "invalid", errors: ["Clause and option identifiers are required."] };
  }
  const next = canonicalProposal(proposal);
  const clause = next.clauses.find((item) => item.id === clauseId);
  if (!clause) return { status: "invalid", errors: ["Unknown clause."] };
  const option = clause.options.find((item) => item.id === optionId);
  if (!option) return { status: "invalid", errors: ["Unknown option."] };
  if (clause.lockedOptionId === optionId) {
    delete clause.lockedOptionId;
    return { status: "ok", proposal: next, locked: false, clauseId, optionId };
  }
  clause.lockedOptionId = optionId;
  return { status: "ok", proposal: next, locked: true, clauseId, optionId };
}

/**
 * Move one clause up or down on a copy of the proposal.
 * Clause order is the last documented tie breaker. Does not mutate the input.
 */
export function moveClause(proposal, clauseId, direction) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof clauseId !== "string") return { status: "invalid", errors: ["Unknown clause."] };
  if (direction !== "up" && direction !== "down") {
    return { status: "invalid", errors: ["direction must be up or down."] };
  }
  const next = canonicalProposal(proposal);
  const index = next.clauses.findIndex((clause) => clause.id === clauseId);
  if (index < 0) return { status: "invalid", errors: ["Unknown clause."] };
  const target = index + (direction === "up" ? -1 : 1);
  if (target < 0 || target >= next.clauses.length) {
    return { status: "invalid", errors: ["Clause cannot move further in that direction."] };
  }
  const [row] = next.clauses.splice(index, 1);
  next.clauses.splice(target, 0, row);
  return { status: "ok", proposal: next, clauseId, direction };
}

/**
 * Groups whose veto constraint is not met on the inspected package.
 * This names a numerical constraint failure. It is not a legal veto or a
 * legitimacy claim.
 */
export function vetoBlockingGroups(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const summary = selectionSummary(proposal, selected);
  return {
    status: "ok",
    groups: summary.constraints.vetoes.filter((veto) => !veto.met).map((veto) => ({
      id: veto.id,
      name: veto.name,
      required: veto.required,
      actual: veto.actual,
    })),
  };
}

/**
 * Preview dividing every group weight by the current total so weights would sum to 1.
 * Rejects the whole draft when any weight is invalid. Does not mutate the proposal.
 */
export function previewRenormalizedWeights(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) {
    const weightError = validation.errors.find((error) => error.includes(".weight "));
    return { status: "invalid", errors: [weightError ?? validation.errors[0]] };
  }
  const invalidIndex = proposal.groups.findIndex((group) => !Number.isFinite(group.weight) || group.weight <= 0 || group.weight > MAX_WEIGHT);
  if (invalidIndex >= 0) {
    return { status: "invalid", errors: [`groups[${invalidIndex}].weight must be greater than 0 and no more than ${MAX_WEIGHT}.`] };
  }
  const total = proposal.groups.reduce((sum, group) => sum + group.weight, 0);
  if (!(total > 0) || !Number.isFinite(total)) {
    return { status: "invalid", errors: ["Weights must be positive finite numbers before they can be renormalized."] };
  }
  const rows = proposal.groups.map((group) => ({
    id: group.id,
    name: group.name,
    current: group.weight,
    next: group.weight / total,
  }));
  const assigned = rows.slice(0, -1).reduce((sum, row) => sum + row.next, 0);
  if (rows.length) rows[rows.length - 1].next = 1 - assigned;
  return {
    status: "ok",
    total,
    nextTotal: 1,
    rows,
  };
}

/**
 * Apply renormalized weights that sum to 1.
 * Requires a valid preview. Does not mutate the supplied proposal.
 */
export function applyRenormalizedWeights(proposal) {
  const preview = previewRenormalizedWeights(proposal);
  if (preview.status !== "ok") return preview;
  const next = canonicalProposal(proposal);
  for (const group of next.groups) {
    const row = preview.rows.find((item) => item.id === group.id);
    group.weight = row.next;
  }
  return { status: "ok", proposal: next, rows: preview.rows, total: preview.total };
}

/**
 * Copy a participant group, including weight, optional floor, veto, and every option's support score.
 * The copy receives a unique id and a unique copy name. Invalid at the group cap.
 * The solver still treats it as a separate supplied group.
 */
export function duplicateParticipantGroup(proposal, groupId) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof groupId !== "string") return { status: "invalid", errors: ["Unknown group."] };
  if (proposal.groups.length >= MAX_GROUPS) {
    return { status: "invalid", errors: [`Between 1 and ${MAX_GROUPS} participant groups are required.`] };
  }
  const sourceIndex = proposal.groups.findIndex((group) => group.id === groupId);
  if (sourceIndex < 0) return { status: "invalid", errors: ["Unknown group."] };
  const next = canonicalProposal(proposal);
  const source = next.groups[sourceIndex];
  const used = new Set([
    ...next.groups.map((group) => group.id),
    ...next.clauses.flatMap((clause) => [clause.id, ...clause.options.map((option) => option.id)]),
  ]);
  let serial = 1;
  let copyId = `group-copy-${serial}`;
  while (used.has(copyId)) {
    serial += 1;
    copyId = `group-copy-${serial}`;
  }
  const usedNames = new Set(next.groups.map((group) => group.name));
  const copy = {
    id: copyId,
    name: uniqueCopyLabel(source.name, usedNames, 80),
    weight: source.weight,
    ...(source.minSupport !== undefined ? { minSupport: source.minSupport } : {}),
    ...(source.veto === true ? { veto: true } : {}),
  };
  next.groups.splice(sourceIndex + 1, 0, copy);
  for (const clause of next.clauses) {
    for (const option of clause.options) {
      option.support[copyId] = option.support[source.id];
    }
  }
  return { status: "ok", proposal: next, groupId: copyId };
}

function uniqueCopyLabel(source, used, maxLength) {
  let serial = 1;
  while (true) {
    const suffix = serial === 1 ? " (copy)" : ` (copy ${serial})`;
    const label = suffix.length >= maxLength
      ? String(serial).slice(0, maxLength)
      : source.length + suffix.length > maxLength
        ? `${source.slice(0, maxLength - suffix.length)}${suffix}`
        : `${source}${suffix}`;
    if (!used.has(label)) return label;
    serial += 1;
  }
}

/**
 * Copy one clause option with a new id, a unique copy name, and the same cost and support.
 * The copy is never an original. Invalid when the clause is already at the option cap.
 * Does not mutate the input.
 */
export function duplicateClauseOption(proposal, clauseId, optionId) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof clauseId !== "string" || typeof optionId !== "string") {
    return { status: "invalid", errors: ["Unknown option."] };
  }
  const next = canonicalProposal(proposal);
  const clause = next.clauses.find((item) => item.id === clauseId);
  if (!clause) return { status: "invalid", errors: ["Unknown clause."] };
  if (clause.options.length >= MAX_OPTIONS_PER_CLAUSE) {
    return { status: "invalid", errors: [`clauses need 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`] };
  }
  const source = clause.options.find((item) => item.id === optionId);
  if (!source) return { status: "invalid", errors: ["Unknown option."] };
  const usedIds = new Set([
    ...next.groups.map((group) => group.id),
    ...next.clauses.flatMap((item) => [item.id, ...item.options.map((option) => option.id)]),
  ]);
  let serial = 1;
  let copyId = `option-copy-${serial}`;
  while (usedIds.has(copyId)) {
    serial += 1;
    copyId = `option-copy-${serial}`;
  }
  const usedLabels = new Set(clause.options.map((option) => option.label));
  clause.options.push({
    id: copyId,
    label: uniqueCopyLabel(source.label, usedLabels, 240),
    original: false,
    changeCost: source.changeCost,
    support: { ...source.support },
  });
  return { status: "ok", proposal: next, clauseId, optionId: copyId };
}

/**
 * Clause ids whose recommended option differs from the original option.
 * Display-only. The solver ignores this list.
 */
export function changedClauseIds(proposal, result) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || typeof result !== "object" || Array.isArray(result) || !result.agreement || !Array.isArray(result.agreement.options)) {
    return { status: "ok", clauseIds: [] };
  }
  if (result.agreement.options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const originals = getOriginalOptions(proposal);
  const clauseIds = [];
  for (let index = 0; index < proposal.clauses.length; index += 1) {
    if (result.agreement.options[index]?.id !== originals[index].id) clauseIds.push(proposal.clauses[index].id);
  }
  return { status: "ok", clauseIds };
}

/**
 * Groups whose average on the inspected package is below their support floor,
 * or the approval threshold when no floor is set.
 * Display-only. Solver counts stay the same.
 */
export function groupsBelowSupportRequirement(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const byGroup = approvalByGroup(proposal.groups, selected);
  const groups = [];
  proposal.groups.forEach((group, index) => {
    const required = group.minSupport === undefined ? proposal.threshold : group.minSupport;
    const actual = byGroup[index].approval;
    if (required - actual > EPSILON) {
      groups.push({ id: group.id, name: group.name, required, actual });
    }
  });
  return { status: "ok", groups };
}

/**
 * Groups with a declared support floor whose average meets that floor
 * on the inspected package. Groups without minSupport are omitted.
 * Display-only. Solver counts stay the same.
 */
export function groupsMeetingDeclaredSupportFloor(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const byGroup = approvalByGroup(proposal.groups, selected);
  const groups = [];
  proposal.groups.forEach((group, index) => {
    if (group.minSupport === undefined) return;
    const actual = byGroup[index].approval;
    if (group.minSupport - actual <= EPSILON) {
      groups.push({ id: group.id, name: group.name, required: group.minSupport, actual });
    }
  });
  return { status: "ok", groups };
}

/**
 * Groups whose average on the inspected package meets the numeric approval threshold.
 * Distinct from groups that meet a declared support floor.
 * Display-only. Solver counts stay the same.
 */
export function groupsMeetingApprovalThreshold(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const byGroup = approvalByGroup(proposal.groups, selected);
  const groups = [];
  proposal.groups.forEach((group, index) => {
    const actual = byGroup[index].approval;
    if (proposal.threshold - actual <= EPSILON) {
      groups.push({ id: group.id, name: group.name, required: proposal.threshold, actual });
    }
  });
  return { status: "ok", groups };
}

/**
 * Groups whose average on the inspected package is below the numeric approval threshold.
 * Distinct from groups below a declared support floor and from groups that meet the threshold.
 * Display-only. Solver counts stay the same.
 */
export function groupsBelowApprovalThreshold(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const byGroup = approvalByGroup(proposal.groups, selected);
  const groups = [];
  proposal.groups.forEach((group, index) => {
    const actual = byGroup[index].approval;
    if (proposal.threshold - actual > EPSILON) {
      groups.push({ id: group.id, name: group.name, required: proposal.threshold, actual });
    }
  });
  return { status: "ok", groups };
}

/**
 * Groups with a declared support floor whose average is below that floor
 * on the inspected package. Groups without minSupport are omitted.
 * A floor is a number you entered, not a legal quorum.
 * Display-only. Solver counts stay the same.
 */
export function groupsBelowDeclaredSupportFloor(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const byGroup = approvalByGroup(proposal.groups, selected);
  const groups = [];
  proposal.groups.forEach((group, index) => {
    if (group.minSupport === undefined) return;
    const actual = byGroup[index].approval;
    if (group.minSupport - actual > EPSILON) {
      groups.push({ id: group.id, name: group.name, required: group.minSupport, actual });
    }
  });
  return { status: "ok", groups };
}

/**
 * Clause ids whose cheapest remaining change exceeds leftover change budget.
 * Remaining change is the lowest changeCost among options other than the inspected selection.
 * When leftover budget is 0 or negative, every clause is listed.
 * Unlimited budget (omitted maxChangeCost) yields an empty list.
 * Display-only. The solver ignores this list.
 */
export function overBudgetClauseIds(proposal, result) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Object.hasOwn(proposal, "maxChangeCost")) {
    return { status: "ok", clauseIds: [], remaining: null, exhausted: false };
  }
  if (!isFiniteNumber(proposal.maxChangeCost)) {
    return { status: "invalid", errors: [`maxChangeCost must be from 0 through ${MAX_CHANGE_COST * MAX_CLAUSES}, or omitted.`] };
  }
  const selected = result?.agreement?.options ?? result?.baseline?.options;
  if (!Array.isArray(selected) || selected.length !== proposal.clauses.length) {
    return { status: "ok", clauseIds: [], remaining: proposal.maxChangeCost, exhausted: proposal.maxChangeCost <= EPSILON };
  }
  const used = result?.agreement?.changeCost ?? result?.baseline?.changeCost ?? 0;
  const remaining = proposal.maxChangeCost - used;
  if (remaining <= EPSILON) {
    return { status: "ok", clauseIds: proposal.clauses.map((clause) => clause.id), remaining, exhausted: true };
  }
  const clauseIds = [];
  for (let index = 0; index < proposal.clauses.length; index += 1) {
    const clause = proposal.clauses[index];
    const selectedId = selected[index]?.id;
    let cheapest = Infinity;
    for (const option of clause.options) {
      if (option.id === selectedId) continue;
      if (option.changeCost < cheapest) cheapest = option.changeCost;
    }
    if (cheapest - remaining > EPSILON) clauseIds.push(clause.id);
  }
  return { status: "ok", clauseIds, remaining, exhausted: false };
}

/**
 * Clause ids whose recommended option has no remaining cheaper alternative.
 * Remaining cheaper means another option with a strictly lower changeCost.
 * Empty when there is no recommendation. Display-only. The solver ignores the list.
 */
export function clausesWithoutCheaperRemainingOption(proposal, result) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const selected = result?.agreement?.options;
  if (!Array.isArray(selected) || selected.length !== proposal.clauses.length) {
    return { status: "ok", clauseIds: [] };
  }
  const clauseIds = [];
  for (let index = 0; index < proposal.clauses.length; index += 1) {
    const clause = proposal.clauses[index];
    const recommended = clause.options.find((option) => option.id === selected[index]?.id);
    if (!recommended) continue;
    let cheaper = false;
    for (const option of clause.options) {
      if (option.id === recommended.id) continue;
      if (recommended.changeCost - option.changeCost > EPSILON) {
        cheaper = true;
        break;
      }
    }
    if (!cheaper) clauseIds.push(clause.id);
  }
  return { status: "ok", clauseIds };
}

/** A deterministic downside scenario, not a probability estimate or a new optimization. */
export function stressPackage(proposal, optionIds, supportDrop) {
  if (!Number.isFinite(supportDrop) || supportDrop < 0 || supportDrop > 100) {
    return { status: "invalid", errors: ["Support drop must be a number from 0 to 100."] };
  }
  const original = evaluatePackage(proposal, optionIds);
  if (original.status === "invalid") return original;
  const pessimistic = canonicalProposal(proposal);
  for (const clause of pessimistic.clauses) for (const option of clause.options) {
    for (const group of pessimistic.groups) option.support[group.id] = Math.max(0, option.support[group.id] - supportDrop);
  }
  return { ...evaluatePackage(pessimistic, optionIds), original: original.summary, supportDrop };
}


/** Compare declared assumptions by stable IDs, including additions and removals. */
export function compareScenarioInputs(before, after) {
  const flatten = (proposal) => {
    const p = canonicalProposal(proposal);
    const fields = new Map([["Proposal title", p.title], ["Approval threshold", p.threshold], ["Maximum change cost", p.maxChangeCost]]);
    for (const group of p.groups) {
      const prefix = "Group " + group.id + ": ";
      fields.set(prefix + "name", group.name);
      fields.set(prefix + "weight", group.weight);
      fields.set(prefix + "minimum support", group.minSupport);
      fields.set(prefix + "veto", group.veto);
    }
    for (const clause of p.clauses) {
      const prefix = "Clause " + clause.id + ": ";
      fields.set(prefix + "title", clause.title);
      fields.set(prefix + "locked option", clause.lockedOptionId);
      fields.set(prefix + "facilitator note", clause.note);
      for (const option of clause.options) {
        const optionPrefix = prefix + option.id + ": ";
        fields.set(optionPrefix + "label", option.label);
        fields.set(optionPrefix + "original", option.original);
        fields.set(optionPrefix + "change cost", option.changeCost);
        for (const group of p.groups) fields.set(optionPrefix + group.id + " support", option.support[group.id]);
      }
    }
    // Clause order participates in deterministic tie breaking.
    fields.set("Clause order", p.clauses.map((clause) => clause.id).join(", "));
    return fields;
  };
  const previous = flatten(before);
  const current = flatten(after);
  return [...new Set([...previous.keys(), ...current.keys()])].filter((field) => previous.get(field) !== current.get(field))
    .map((field) => ({ field, before: previous.get(field), after: current.get(field) }));
}


/** Export every modeled input with spreadsheet-safe text cells and explicit recommendation status. */
export function formatEvidenceCsv(proposal, result = findSmallestAgreement(proposal)) {
  const p = canonicalProposal(proposal);
  const rows = [["proposal", "threshold", "maximum_change_cost", "search_status", "clause_id", "clause", "locked_option_id", "option_id", "option", "original", "recommended", "change_cost", "group_id", "group", "weight", "minimum_support", "veto", "support"]];
  for (const [index, clause] of p.clauses.entries()) for (const option of clause.options) for (const group of p.groups) {
    rows.push([p.title, p.threshold, p.maxChangeCost ?? "unlimited", result.status, clause.id, clause.title, clause.lockedOptionId ?? "none", option.id, option.label, option.original ? "yes" : "no", result.agreement ? (result.agreement.options[index].id === option.id ? "yes" : "no") : "no recommendation", option.changeCost, group.id, group.name, group.weight, group.minSupport ?? "none", group.veto === true ? "yes" : "no", option.support[group.id]]);
  }
  return serializeCsv(rows);
}

const FORMULA_CELL = /^(?:[\s\u0000-\u001f]*[=+@-]|[\t\r\n])/u;

function quoteCsvCell(value) {
  let text = String(value);
  if (typeof value === "string" && FORMULA_CELL.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function serializeCsv(rows) {
  return `${rows.map((row) => row.map(quoteCsvCell).join(",")).join("\r\n")}\r\n`;
}

/** Strip a leading apostrophe added for spreadsheet safety. */
export function neutralizeCsvCell(raw) {
  const text = String(raw ?? "");
  return text.startsWith("'") ? text.slice(1) : text;
}

function namedCsvError(code, message, extra = {}) {
  return { code, message, ...extra };
}

function parseCsvRecords(text) {
  const source = String(text ?? "").replace(/^\uFEFF/u, "");
  if (source.trim() === "") return { status: "invalid", errors: [namedCsvError("empty_csv", "CSV is empty.")] };
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else inQuotes = false;
      } else cell += character;
      continue;
    }
    if (character === '"') {
      inQuotes = true;
      continue;
    }
    if (character === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character;
  }
  if (inQuotes) return { status: "invalid", errors: [namedCsvError("truncated_row", "CSV quote was not closed.")] };
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const records = rows.filter((entry) => entry.some((value) => value !== ""));
  if (records.length === 0) return { status: "invalid", errors: [namedCsvError("empty_csv", "CSV is empty.")] };
  return { status: "ok", records };
}

/** Treat a first line that contains tabs as TSV and convert it to CSV. */
function tableTextToCsv(text) {
  const source = String(text ?? "").replace(/^\uFEFF/u, "");
  const newline = source.search(/\r\n|\n|\r/u);
  const firstLine = newline === -1 ? source : source.slice(0, newline);
  if (!firstLine.includes("\t")) return source;
  const rows = [];
  for (const line of source.replace(/\r\n/gu, "\n").replace(/\r/gu, "\n").split("\n")) {
    if (line === "") continue;
    rows.push(line.split("\t"));
  }
  if (rows.length === 0) return source;
  return serializeCsv(rows);
}

function parseSupportScore(raw, path) {
  const neutralized = neutralizeCsvCell(raw);
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (typeof neutralized !== "string" || neutralized.trim() === "") {
    return { error: namedCsvError("invalid_score", `${path} must be a number from 0 to 100.`, { path }) };
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(neutralized.trim())) {
    return { error: namedCsvError("invalid_score", `${path} must be a number from 0 to 100.`, { path, value: neutralized }) };
  }
  const score = Number(neutralized);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: namedCsvError("invalid_score", `${path} must be a number from 0 to 100.`, { path, value: neutralized }) };
  }
  return { score };
}

/**
 * Import a clause-option vs group support matrix.
 * Header must be clause_id, option_id, then every group id. Unknown columns are rejected.
 * Formula-like cells are named formula_cell errors after neutralizing a leading apostrophe.
 */
export function parseSupportMatrixCsv(csvText, proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", validation.errors[0])] };
  const parsed = parseCsvRecords(csvText);
  if (parsed.status !== "ok") return parsed;
  const [header, ...body] = parsed.records;
  if (!header || header.length < 3) {
    return { status: "invalid", errors: [namedCsvError("missing_header", "CSV needs a header row with clause_id, option_id, and every group id.")] };
  }
  const columns = header.map((name) => neutralizeCsvCell(name).trim());
  if (FORMULA_CELL.test(columns[0]) || FORMULA_CELL.test(columns[1])) {
    return { status: "invalid", errors: [namedCsvError("formula_cell", "Header cells must not look like spreadsheet formulas.")] };
  }
  if (columns[0] !== "clause_id") return { status: "invalid", errors: [namedCsvError("missing_clause_id_column", "The first column must be clause_id.")] };
  if (columns[1] !== "option_id") return { status: "invalid", errors: [namedCsvError("missing_option_id_column", "The second column must be option_id.")] };
  const groupColumns = columns.slice(2);
  const errors = [];
  const seenGroups = new Set();
  for (const groupId of groupColumns) {
    if (FORMULA_CELL.test(groupId)) {
      errors.push(namedCsvError("formula_cell", `Group column ${groupId} looks like a spreadsheet formula.`));
      continue;
    }
    if (!proposal.groups.some((group) => group.id === groupId)) {
      errors.push(namedCsvError("unknown_group_column", `Unknown group column: ${groupId}.`, { groupId }));
    }
    if (seenGroups.has(groupId)) errors.push(namedCsvError("duplicate_row", `Group column ${groupId} is repeated.`, { groupId }));
    seenGroups.add(groupId);
  }
  for (const group of proposal.groups) {
    if (!seenGroups.has(group.id)) errors.push(namedCsvError("missing_group_column", `Missing group column: ${group.id}.`, { groupId: group.id }));
  }
  if (body.length === 0) errors.push(namedCsvError("empty_csv", "CSV has a header but no support rows."));
  const next = canonicalProposal(proposal);
  const seenPairs = new Set();
  let updatedCells = 0;
  body.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== columns.length) {
      errors.push(namedCsvError("truncated_row", `Row ${rowNumber} has ${record.length} cells, expected ${columns.length}.`, { row: rowNumber }));
      return;
    }
    const clauseId = neutralizeCsvCell(record[0]).trim();
    const optionId = neutralizeCsvCell(record[1]).trim();
    if (FORMULA_CELL.test(clauseId) || FORMULA_CELL.test(optionId)) {
      errors.push(namedCsvError("formula_cell", `Row ${rowNumber} identifier looks like a spreadsheet formula.`, { row: rowNumber }));
      return;
    }
    const pair = `${clauseId}\0${optionId}`;
    if (seenPairs.has(pair)) {
      errors.push(namedCsvError("duplicate_row", `Row ${rowNumber} repeats clause ${clauseId} option ${optionId}.`, { row: rowNumber, clauseId, optionId }));
      return;
    }
    seenPairs.add(pair);
    const clause = next.clauses.find((item) => item.id === clauseId);
    if (!clause) {
      errors.push(namedCsvError("unknown_clause", `Row ${rowNumber} clause_id ${clauseId} is not in this proposal.`, { row: rowNumber, clauseId }));
      return;
    }
    const option = clause.options.find((item) => item.id === optionId);
    if (!option) {
      errors.push(namedCsvError("unknown_option", `Row ${rowNumber} option_id ${optionId} is not in clause ${clauseId}.`, { row: rowNumber, clauseId, optionId }));
      return;
    }
    groupColumns.forEach((groupId, groupIndex) => {
      const path = `row ${rowNumber} ${clauseId}/${optionId}/${groupId}`;
      const parsedScore = parseSupportScore(record[groupIndex + 2], path);
      if (parsedScore.error) {
        errors.push(parsedScore.error);
        return;
      }
      option.support[groupId] = parsedScore.score;
      updatedCells += 1;
    });
  });
  if (errors.length) return { status: "invalid", errors };
  return { status: "ok", proposal: next, updatedCells };
}

/** Export only the support matrix used by parseSupportMatrixCsv. */
export function formatSupportMatrixCsv(proposal) {
  const p = canonicalProposal(proposal);
  const header = ["clause_id", "option_id", ...p.groups.map((group) => group.id)];
  const rows = [header];
  for (const clause of p.clauses) for (const option of clause.options) {
    rows.push([clause.id, option.id, ...p.groups.map((group) => option.support[group.id])]);
  }
  return serializeCsv(rows);
}

function parseCsvWeight(raw, path) {
  const neutralized = neutralizeCsvCell(raw).trim();
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (!neutralized || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(neutralized)) {
    return { error: namedCsvError("invalid_weight", `${path} must be a number greater than 0 and no more than ${MAX_WEIGHT}.`, { path }) };
  }
  const weight = Number(neutralized);
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
    return { error: namedCsvError("invalid_weight", `${path} must be a number greater than 0 and no more than ${MAX_WEIGHT}.`, { path, value: neutralized }) };
  }
  return { weight };
}

function parseCsvFloor(raw, path) {
  const neutralized = neutralizeCsvCell(raw).trim();
  if (neutralized === "") return { omit: true };
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(neutralized)) {
    return { error: namedCsvError("invalid_floor", `${path} must be a number from 0 to 100, or blank.`, { path }) };
  }
  const value = Number(neutralized);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { error: namedCsvError("invalid_floor", `${path} must be a number from 0 to 100, or blank.`, { path, value: neutralized }) };
  }
  return { value };
}

function parseCsvVeto(raw, path) {
  const neutralized = neutralizeCsvCell(raw).trim().toLowerCase();
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (neutralized === "" || neutralized === "no" || neutralized === "false" || neutralized === "0") return { veto: false };
  if (neutralized === "yes" || neutralized === "true" || neutralized === "1") return { veto: true };
  return { error: namedCsvError("invalid_veto", `${path} must be yes, no, true, false, 1, 0, or blank.`, { path, value: neutralized }) };
}

function groupIdFromName(name, used) {
  let slug = String(name).toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
  if (!slug || !/^[a-z0-9]/u.test(slug) || RESERVED_IDS.has(slug) || !ID_PATTERN.test(slug.slice(0, 64))) {
    slug = "group";
  }
  slug = slug.slice(0, 64);
  let id = slug;
  let serial = 2;
  while (used.has(id) || RESERVED_IDS.has(id) || !ID_PATTERN.test(id)) {
    const suffix = `-${serial}`;
    id = `${slug.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`;
    serial += 1;
  }
  used.add(id);
  return id;
}

/**
 * Replace participant groups from a CSV of name, weight, optional min_support and veto,
 * and one support column per existing clause option (`clauseId:optionId`).
 * Unknown columns are rejected. A first line that contains tabs is treated as TSV
 * and converted to CSV before the same validation. Does not mutate the supplied proposal.
 */
export function parseParticipantGroupsCsv(csvText, proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", validation.errors[0])] };
  const parsed = parseCsvRecords(tableTextToCsv(csvText));
  if (parsed.status !== "ok") return parsed;
  const [header, ...body] = parsed.records;
  if (!header || header.length < 2) {
    return { status: "invalid", errors: [namedCsvError("missing_header", "CSV needs a header row with name, weight, optional min_support and veto, and support columns.")] };
  }
  const columns = header.map((name) => neutralizeCsvCell(name).trim());
  if (columns.some((column) => FORMULA_CELL.test(column))) {
    return { status: "invalid", errors: [namedCsvError("formula_cell", "Header cells must not look like spreadsheet formulas.")] };
  }
  const seenHeaders = new Set();
  const errors = [];
  for (const column of columns) {
    if (seenHeaders.has(column)) errors.push(namedCsvError("duplicate_column", `Column ${column} is repeated.`, { column }));
    seenHeaders.add(column);
  }
  if (columns[0] !== "name") errors.push(namedCsvError("missing_name_column", "The first column must be name."));
  if (columns[1] !== "weight") errors.push(namedCsvError("missing_weight_column", "The second column must be weight."));
  const expectedSupport = proposal.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  const expectedSet = new Set(expectedSupport);
  const supportColumns = [];
  let minSupportIndex = -1;
  let vetoIndex = -1;
  columns.forEach((column, index) => {
    if (index < 2) return;
    if (column === "min_support") {
      minSupportIndex = index;
      return;
    }
    if (column === "veto") {
      vetoIndex = index;
      return;
    }
    if (expectedSet.has(column)) {
      supportColumns.push({ column, index });
      return;
    }
    errors.push(namedCsvError("unknown_column", `Unknown column: ${column}.`, { column }));
  });
  const seenSupport = new Set(supportColumns.map((item) => item.column));
  for (const column of expectedSupport) {
    if (!seenSupport.has(column)) errors.push(namedCsvError("missing_support_column", `Missing support column: ${column}.`, { column }));
  }
  if (body.length === 0) errors.push(namedCsvError("empty_csv", "CSV has a header but no group rows."));
  if (body.length > MAX_GROUPS) errors.push(namedCsvError("too_many_groups", `Between 1 and ${MAX_GROUPS} participant groups are required.`));
  const usedIds = new Set([
    ...proposal.clauses.flatMap((clause) => [clause.id, ...clause.options.map((option) => option.id)]),
  ]);
  const groups = [];
  body.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== columns.length) {
      errors.push(namedCsvError("truncated_row", `Row ${rowNumber} has ${record.length} cells, expected ${columns.length}.`, { row: rowNumber }));
      return;
    }
    const nameRaw = neutralizeCsvCell(record[0]);
    if (FORMULA_CELL.test(nameRaw)) {
      errors.push(namedCsvError("formula_cell", `Row ${rowNumber} name looks like a spreadsheet formula.`, { row: rowNumber }));
      return;
    }
    const name = nameRaw.trim();
    if (!name || name.length > 80) {
      errors.push(namedCsvError("invalid_name", `Row ${rowNumber} name must be a non-empty string no longer than 80 characters.`, { row: rowNumber }));
      return;
    }
    const parsedWeight = parseCsvWeight(record[1], `row ${rowNumber} weight`);
    if (parsedWeight.error) {
      errors.push(parsedWeight.error);
      return;
    }
    let minSupport;
    if (minSupportIndex >= 0) {
      const floor = parseCsvFloor(record[minSupportIndex], `row ${rowNumber} min_support`);
      if (floor.error) {
        errors.push(floor.error);
        return;
      }
      if (!floor.omit) minSupport = floor.value;
    }
    let veto = false;
    if (vetoIndex >= 0) {
      const parsedVeto = parseCsvVeto(record[vetoIndex], `row ${rowNumber} veto`);
      if (parsedVeto.error) {
        errors.push(parsedVeto.error);
        return;
      }
      veto = parsedVeto.veto;
    }
    const supportByColumn = {};
    for (const { column, index: colIndex } of supportColumns) {
      const parsedScore = parseSupportScore(record[colIndex], `row ${rowNumber} ${column}`);
      if (parsedScore.error) {
        errors.push(parsedScore.error);
        continue;
      }
      supportByColumn[column] = parsedScore.score;
    }
    const id = groupIdFromName(name, usedIds);
    groups.push({
      id,
      name,
      weight: parsedWeight.weight,
      minSupport,
      veto,
      supportByColumn,
    });
  });
  if (errors.length) return { status: "invalid", errors };
  const next = canonicalProposal(proposal);
  next.groups = groups.map((group) => ({
    id: group.id,
    name: group.name,
    weight: group.weight,
    ...(group.minSupport !== undefined ? { minSupport: group.minSupport } : {}),
    ...(group.veto === true ? { veto: true } : {}),
  }));
  for (const clause of next.clauses) {
    for (const option of clause.options) {
      option.support = {};
      for (const group of groups) {
        option.support[group.id] = group.supportByColumn[`${clause.id}:${option.id}`];
      }
    }
  }
  const imported = validateProposal(next);
  if (!imported.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", imported.errors[0])] };
  return { status: "ok", proposal: canonicalProposal(next), importedGroups: groups.length };
}

/** Export the participant-group CSV consumed by parseParticipantGroupsCsv. */
export function formatParticipantGroupsCsv(proposal) {
  const p = canonicalProposal(proposal);
  const supportHeaders = p.clauses.flatMap((clause) => clause.options.map((option) => `${clause.id}:${option.id}`));
  const header = ["name", "weight", "min_support", "veto", ...supportHeaders];
  const rows = [header];
  for (const group of p.groups) {
    rows.push([
      group.name,
      group.weight,
      group.minSupport ?? "",
      group.veto === true ? "yes" : "no",
      ...p.clauses.flatMap((clause) => clause.options.map((option) => option.support[group.id])),
    ]);
  }
  return serializeCsv(rows);
}

/**
 * Lock one option, re-run search on remaining unlocked clauses, and return a preview.
 * Does not mutate the supplied proposal.
 */
export function previewLockedOption(proposal, clauseId, optionId, searchOptions = {}) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof clauseId !== "string" || typeof optionId !== "string") {
    return { status: "invalid", errors: ["Clause and option identifiers are required."] };
  }
  const clause = proposal.clauses.find((item) => item.id === clauseId);
  if (!clause) return { status: "invalid", errors: ["Unknown clause."] };
  const option = clause.options.find((item) => item.id === optionId);
  if (!option) return { status: "invalid", errors: ["Unknown option."] };
  const next = canonicalProposal(proposal);
  next.clauses.find((item) => item.id === clauseId).lockedOptionId = optionId;
  const result = findSmallestAgreement(next, searchOptions);
  if (result.status === "invalid") return result;
  return {
    status: "preview",
    proposal: next,
    result,
    clauseId,
    optionId,
    clauseTitle: clause.title,
    optionLabel: option.label,
  };
}

/**
 * Overall approval if each group is omitted from the weighted average.
 * Remaining weights are used as-is, which renormalizes because the formula
 * divides by remaining total weight. This is a sensitivity readout, not a forecast.
 */
export function leaveOneGroupOut(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const fullApproval = approvalForOptions(proposal.groups, selected);
  const rows = proposal.groups.map((group) => {
    const remaining = proposal.groups.filter((item) => item.id !== group.id);
    if (remaining.length === 0) {
      return { id: group.id, name: group.name, weight: group.weight, approval: null, delta: null, omitted: true };
    }
    const approval = approvalForOptions(remaining, selected);
    return { id: group.id, name: group.name, weight: group.weight, approval, delta: approval - fullApproval, omitted: true };
  });
  return { status: "ok", method: "omit", fullApproval, rows };
}

/**
 * Each group's pull on overall approval is its weight share times its average support.
 * This is an accounting of supplied scores, not bargaining power or a forecast.
 */
export function groupContributions(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const originals = getOriginalOptions(proposal);
  const totalWeight = proposal.groups.reduce((sum, group) => sum + group.weight, 0);
  const selectedByGroup = approvalByGroup(proposal.groups, selected);
  const originalByGroup = approvalByGroup(proposal.groups, originals);
  const rows = proposal.groups.map((group, index) => {
    const share = group.weight / totalWeight;
    const selectedApproval = selectedByGroup[index].approval;
    const originalApproval = originalByGroup[index].approval;
    const contribution = share * selectedApproval;
    const originalContribution = share * originalApproval;
    return {
      id: group.id,
      name: group.name,
      weight: group.weight,
      share,
      selectedApproval,
      originalApproval,
      contribution,
      originalContribution,
      overallPull: contribution - originalContribution,
    };
  });
  return {
    status: "ok",
    method: "weight_share",
    overallApproval: approvalForOptions(proposal.groups, selected),
    originalApproval: approvalForOptions(proposal.groups, originals),
    rows,
  };
}

/**
 * Plain-text discussion worksheet. Labels are copied as supplied text.
 * This is a conversation aid, not a recorded vote or legal ballot.
 */
export function formatDiscussionWorksheet(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const lines = [
    "Discussion worksheet",
    "",
    p.title,
    `Approval threshold: ${p.threshold}%`,
    p.maxChangeCost === undefined ? "Change-cost budget: unlimited" : `Change-cost budget: ${p.maxChangeCost}`,
    "",
    "Mark preferred options during conversation. This sheet is a worksheet, not a recorded vote, legal ballot, or collective decision.",
    "",
  ];
  for (const group of p.groups) {
    const marks = [];
    if (group.veto === true) marks.push("veto");
    if (group.minSupport !== undefined) marks.push(`floor ${group.minSupport}%`);
    lines.push(`Group: ${group.name} (weight ${group.weight}${marks.length ? `; ${marks.join(", ")}` : ""})`);
  }
  lines.push("");
  for (const clause of p.clauses) {
    lines.push(clause.title + (clause.lockedOptionId ? " [locked]" : ""));
    if (clause.note) lines.push(`Facilitator note: ${clause.note.replace(/[\r\n]+/gu, " ")}`);
    for (const option of clause.options) {
      const tags = [];
      if (option.original === true) tags.push("original");
      if (option.changeCost) tags.push(`cost ${option.changeCost}`);
      if (clause.lockedOptionId === option.id) tags.push("locked");
      lines.push(`  [ ] ${option.label}${tags.length ? ` (${tags.join(", ")})` : ""}`);
    }
    lines.push("");
  }
  return { status: "ok", text: `${lines.join("\n").trim()}\n` };
}

/**
 * Formula-safe discussion worksheet CSV.
 * Groups, weights, clause options, and facilitator notes are exported as text.
 * This is a conversation aid, not a recorded vote or legal ballot.
 */
export function formatDiscussionWorksheetCsv(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const rows = [["row_type", "group_id", "group_name", "weight", "min_support", "veto", "clause_id", "clause_title", "clause_note", "option_id", "option_label", "original", "change_cost", "locked"]];
  for (const group of p.groups) {
    rows.push([
      "group",
      group.id,
      group.name,
      group.weight,
      group.minSupport ?? "",
      group.veto === true ? "yes" : "no",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }
  for (const clause of p.clauses) {
    for (const option of clause.options) {
      rows.push([
        "option",
        "",
        "",
        "",
        "",
        "",
        clause.id,
        clause.title,
        clause.note ?? "",
        option.id,
        option.label,
        option.original ? "yes" : "no",
        option.changeCost,
        clause.lockedOptionId === option.id ? "yes" : "no",
      ]);
    }
  }
  return { status: "ok", csv: serializeCsv(rows) };
}

/**
 * Compact Markdown of the solver recommendation for clipboard handoff.
 * This is a decision aid, not a recorded vote or a legitimacy claim.
 */
export function formatRecommendedPackageMarkdown(proposal, result = findSmallestAgreement(proposal)) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || result.status === "invalid") {
    return { status: "invalid", errors: result?.errors ?? ["No result was available."] };
  }
  if (result.status === "too_large") {
    return { status: "unavailable", text: "The search is over the safety bound, so there is no recommended package to copy.\n" };
  }
  if (!result.agreement) {
    return { status: "unavailable", text: "No recommended package is available to copy. This workshop is a decision aid, not a recorded vote.\n" };
  }
  const p = canonicalProposal(proposal);
  const agreement = result.agreement;
  const lines = [
    "# Recommended package",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This is a decision aid, not a recorded vote or a claim of legitimacy.",
    "",
    `Approval: ${formatPercent(agreement.approval)}`,
    `Change cost: ${agreement.changeCost.toFixed(1)}`,
    `Threshold: ${formatPercent(p.threshold)}`,
    "",
    "## Selected options",
    "",
  ];
  for (let index = 0; index < p.clauses.length; index += 1) {
    const clause = p.clauses[index];
    const option = agreement.options[index];
    lines.push(`- ${briefText(clause.title)}: ${briefOption(option.label)} (cost ${option.changeCost.toFixed(1)})`);
  }
  lines.push("", "Scores, weights, and costs remain human inputs.");
  return { status: "ok", text: `${lines.join("\n")}\n` };
}

/**
 * Compact Markdown of original versus recommended option labels and costs.
 * Labels and costs only. It is a decision aid, not a recorded vote.
 */
export function formatOriginalVersusRecommendedMarkdown(proposal, result = findSmallestAgreement(proposal)) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || result.status === "invalid") {
    return { status: "invalid", errors: result?.errors ?? ["No result was available."] };
  }
  if (result.status === "too_large") {
    return { status: "unavailable", text: "The search is over the safety bound, so original versus recommended labels and costs cannot be copied. This is a decision aid, not a recorded vote.\n" };
  }
  if (!result.agreement) {
    return { status: "unavailable", text: "No recommended package is available, so original versus recommended labels and costs cannot be copied. This is a decision aid, not a recorded vote.\n" };
  }
  if (!Array.isArray(result.agreement.options) || result.agreement.options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const p = canonicalProposal(proposal);
  const originals = getOriginalOptions(p);
  const lines = [
    "# Original versus recommended package",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This comparison lists option labels and costs only. It is a decision aid, not a recorded vote.",
    "",
  ];
  for (let index = 0; index < p.clauses.length; index += 1) {
    const clause = p.clauses[index];
    const original = originals[index];
    const recommended = result.agreement.options[index];
    lines.push(`- ${briefText(clause.title)}: ${briefOption(original.label)} (cost ${original.changeCost.toFixed(1)}) versus ${briefOption(recommended.label)} (cost ${recommended.changeCost.toFixed(1)})`);
  }
  lines.push("", "Scores, weights, and costs remain human inputs.");
  return { status: "ok", text: `${lines.join("\n")}\n` };
}

/**
 * Markdown table of original, recommended, and pinned option labels.
 * This is a decision aid, not a recorded vote or a legitimacy claim.
 */
export function formatPinnedPackagesMarkdown(proposal, recommendedIds, customIds) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const compared = comparePinnedPackages(proposal, recommendedIds, customIds);
  if (compared.status !== "ok") return compared;
  const p = canonicalProposal(proposal);
  const cell = (choice) => (choice ? briefText(choice.label) : "none");
  const lines = [
    "# Original, recommended, and pinned packages",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This table lists clause titles and option labels. It is a decision aid, not a recorded vote or a claim of legitimacy.",
    "",
    "| Clause | Original | Recommended | Pinned |",
    "| --- | --- | --- | --- |",
  ];
  for (const row of compared.clauses) {
    lines.push(`| ${briefText(row.clauseTitle)} | ${cell(row.original)} | ${cell(row.recommended)} | ${cell(row.custom)} |`);
  }
  lines.push("", "Scores, weights, and costs remain human inputs.");
  return { status: "ok", text: `${lines.join("\n")}\n` };
}

/**
 * Markdown list of veto groups whose average misses the required value.
 * This is a constraint readout, not a legal veto or a legitimacy claim.
 */
export function formatVetoBlockersMarkdown(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "unavailable", text: "No inspected package is available, so there is no veto constraint list to copy.\n" };
  }
  const blocking = vetoBlockingGroups(proposal, options);
  if (blocking.status !== "ok") return blocking;
  const p = canonicalProposal(proposal);
  const lines = [
    "# Veto constraint list",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This list names groups whose veto constraint is not met on the inspected package. It is a numerical constraint list, not a legal veto or a claim of legitimacy.",
    "",
  ];
  const marked = p.groups.filter((group) => group.veto === true);
  if (!marked.length) {
    lines.push("No veto groups are marked on this proposal.");
  } else if (!blocking.groups.length) {
    lines.push("Every marked veto group meets its required average on this package.");
  } else {
    lines.push("## Groups below the veto requirement", "");
    for (const group of blocking.groups) {
      lines.push(`- ${briefText(group.name)}: ${formatPercent(group.actual)} against required ${formatPercent(group.required)}`);
    }
  }
  lines.push("", "Scores, weights, and costs remain human inputs.");
  return { status: "ok", text: `${lines.join("\n")}\n`, groups: blocking.groups };
}

/**
 * Markdown list of each clause title with the locked option label, or Unlocked.
 * This is a draft choice list, not a legal hold or a recorded vote.
 */
export function formatCurrentLocksMarkdown(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const lines = [
    "# Current clause locks",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This list names each clause title and the locked option label, or Unlocked. It is a draft choice list, not a legal hold or a recorded vote.",
    "",
  ];
  for (const clause of p.clauses) {
    const locked = clause.lockedOptionId === undefined
      ? null
      : clause.options.find((option) => option.id === clause.lockedOptionId);
    lines.push(`- ${briefText(clause.title)}: ${locked ? briefText(locked.label) : "Unlocked"}`);
  }
  lines.push("", "Locks remain draft choices. They are not a legal hold.");
  return { status: "ok", text: `${lines.join("\n")}\n` };
}

/**
 * One-line Markdown of the current clause lock count for clipboard handoff.
 * Locks are draft choices, not a legal hold.
 * Distinct from current-locks copy and recommended-package option count.
 */
export function formatCurrentLockCountMarkdown(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const count = p.clauses.filter((clause) => clause.lockedOptionId !== undefined).length;
  return {
    status: "ok",
    count,
    text: `Current lock count: ${count}. Locks are draft choices, not a legal hold.\n`,
  };
}

/**
 * One-line Markdown of the first locked clause option label for clipboard handoff.
 * Honest when no clause is locked. Distinct from lock-count copy and current-locks copy.
 * Locks are draft choices, not a legal hold.
 */
export function formatFirstLockedClauseOptionLabelMarkdown(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const disclaimer = "Locks are draft choices, not a legal hold.";
  const first = p.clauses.find((clause) => clause.lockedOptionId !== undefined);
  if (!first) {
    return {
      status: "ok",
      empty: true,
      text: `No clause is locked, so there is no first locked option label to copy. ${disclaimer}\n`,
    };
  }
  const locked = first.options.find((option) => option.id === first.lockedOptionId);
  return {
    status: "ok",
    empty: false,
    label: locked.label,
    text: `First locked clause option: ${briefText(locked.label)}. ${disclaimer}\n`,
  };
}

/**
 * One-line Markdown count of groups currently below their declared support floor.
 * Honest when the count is zero or no inspected package is available.
 * Distinct from lock-count copy and remaining change-budget copy.
 * A floor is a number you entered, not a legal quorum.
 */
export function formatGroupsBelowSupportFloorCountMarkdown(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const disclaimer = "A floor is a number you entered, not a legal quorum.";
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return {
      status: "unavailable",
      empty: true,
      count: 0,
      text: `No inspected package is available, so there is no below-floor group count to copy. ${disclaimer}\n`,
    };
  }
  const listed = groupsBelowDeclaredSupportFloor(proposal, options);
  if (listed.status !== "ok") return listed;
  const count = listed.groups.length;
  return {
    status: "ok",
    empty: count === 0,
    count,
    text: `Groups below their support floor: ${count}. ${disclaimer}\n`,
  };
}

/**
 * One-line Markdown of the first group currently below its declared support floor.
 * Honest when none or no inspected package is available.
 * Distinct from below-floor count copy, lock-count copy, and first-locked-option copy.
 * A floor is a number you entered, not a legal quorum.
 * Do not treat the label as a legal identity.
 */
export function formatFirstBelowSupportFloorGroupLabelMarkdown(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const disclaimer = "A floor is a number you entered, not a legal quorum. The label is not a legal identity.";
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return {
      status: "unavailable",
      empty: true,
      text: `No inspected package is available, so there is no first below-floor group label to copy. ${disclaimer}\n`,
    };
  }
  const listed = groupsBelowDeclaredSupportFloor(proposal, options);
  if (listed.status !== "ok") return listed;
  const first = listed.groups[0];
  if (!first) {
    return {
      status: "ok",
      empty: true,
      text: `No group is below its support floor, so there is no first below-floor group label to copy. ${disclaimer}\n`,
    };
  }
  return {
    status: "ok",
    empty: false,
    label: first.name,
    text: `First below-floor group: ${briefText(first.name)}. ${disclaimer}\n`,
  };
}

/**
 * One-line Markdown count of groups currently meeting the numeric approval threshold.
 * Honest when the count is zero or no inspected package is available.
 * Distinct from below-floor count copy and first-below-floor group copy.
 * A threshold is a number you entered, not a legal quorum.
 */
export function formatGroupsMeetingApprovalThresholdCountMarkdown(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const disclaimer = "A threshold is a number you entered, not a legal quorum.";
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return {
      status: "unavailable",
      empty: true,
      count: 0,
      text: `No inspected package is available, so there is no groups-meeting-threshold count to copy. ${disclaimer}\n`,
    };
  }
  const listed = groupsMeetingApprovalThreshold(proposal, options);
  if (listed.status !== "ok") return listed;
  const count = listed.groups.length;
  return {
    status: "ok",
    empty: count === 0,
    count,
    text: `Groups meeting the approval threshold: ${count}. ${disclaimer}\n`,
  };
}

/**
 * One-line Markdown of the first group marked as a veto group.
 * Honest when none. Distinct from first-below-floor group copy and threshold-group count copy.
 * A veto is a number you entered, not a legal right.
 */
export function formatFirstVetoGroupLabelMarkdown(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  const disclaimer = "A veto is a number you entered, not a legal right.";
  const first = p.groups.find((group) => group.veto === true);
  if (!first) {
    return {
      status: "ok",
      empty: true,
      text: `No veto group is marked, so there is no first veto group label to copy. ${disclaimer}\n`,
    };
  }
  return {
    status: "ok",
    empty: false,
    label: first.name,
    text: `First veto group: ${briefText(first.name)}. ${disclaimer}\n`,
  };
}

/**
 * Markdown table of group name, mixing weight, and average support on the inspected package.
 * Mixing weights are not a legal right.
 */
export function formatGroupSupportMarkdown(proposal, options) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Array.isArray(options) || options.length !== proposal.clauses.length) {
    return { status: "unavailable", text: "No inspected package is available, so there is no group support table to copy.\n" };
  }
  const selected = proposal.clauses.map((clause, index) => clause.options.find((option) => option.id === options[index]?.id) ?? null);
  if (selected.some((option) => !option)) {
    return { status: "invalid", errors: ["Every selected option must belong to its clause."] };
  }
  const p = canonicalProposal(proposal);
  const byGroup = approvalByGroup(p.groups, selected);
  const lines = [
    "# Group support",
    "",
    `Proposal: ${briefText(p.title)}`,
    "",
    "This table lists group names, mixing weights, and average support on the inspected package. Mixing weights are not a legal right.",
    "",
    "| Group | Weight | Average support |",
    "| --- | --- | --- |",
  ];
  for (const group of byGroup) {
    lines.push(`| ${briefText(group.name)} | ${group.weight} | ${formatPercent(group.approval)} |`);
  }
  lines.push("", "Scores and weights remain human inputs. A veto is a number, not a legal right.");
  return { status: "ok", text: `${lines.join("\n")}\n` };
}

/**
 * Leftover change-budget on the recommended package.
 * Display-only accounting. It is not a legal appropriation.
 */
export function remainingChangeBudget(proposal, result = findSmallestAgreement(proposal)) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || result.status === "invalid") {
    return { status: "invalid", errors: result?.errors ?? ["No result was available."] };
  }
  if (!Object.hasOwn(proposal, "maxChangeCost")) {
    return { status: "ok", unlimited: true, exhausted: false, remaining: null, used: result.agreement?.changeCost ?? null };
  }
  if (!isFiniteNumber(proposal.maxChangeCost)) {
    return { status: "invalid", errors: [`maxChangeCost must be from 0 through ${MAX_CHANGE_COST * MAX_CLAUSES}, or omitted.`] };
  }
  if (!result.agreement) {
    return { status: "unavailable", unlimited: false, exhausted: false, remaining: null, used: null, budget: proposal.maxChangeCost };
  }
  const remaining = proposal.maxChangeCost - result.agreement.changeCost;
  return {
    status: "ok",
    unlimited: false,
    exhausted: remaining <= EPSILON,
    remaining,
    used: result.agreement.changeCost,
    budget: proposal.maxChangeCost,
  };
}

/**
 * One-line Markdown of leftover change-budget for clipboard handoff.
 * Honest when the budget is exhausted. Not a legal appropriation.
 * Distinct from recommended-package copy and the group-support table.
 */
export function formatRemainingChangeBudgetMarkdown(proposal, result = findSmallestAgreement(proposal)) {
  const listed = remainingChangeBudget(proposal, result);
  if (listed.status === "invalid") return listed;
  const disclaimer = "This leftover is a draft accounting line, not a legal appropriation.";
  if (listed.status === "unavailable") {
    return { status: "unavailable", text: `No recommended package is available, so leftover change-budget cannot be copied. ${disclaimer}\n` };
  }
  if (listed.unlimited) {
    return { status: "ok", text: `No change-budget is set, so leftover change-budget is unlimited. ${disclaimer}\n` };
  }
  if (listed.exhausted) {
    return { status: "ok", text: `Remaining change-budget is exhausted (${listed.remaining.toFixed(1)} leftover). ${disclaimer}\n` };
  }
  return { status: "ok", text: `Remaining change-budget: ${listed.remaining.toFixed(1)}. ${disclaimer}\n` };
}

/**
 * One-line Markdown of the approval threshold for clipboard handoff.
 * A threshold is a number you entered, not a legal quorum.
 * Distinct from remaining change-budget copy and recommended-package copy.
 */
export function formatApprovalThresholdMarkdown(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  const p = canonicalProposal(proposal);
  return {
    status: "ok",
    text: `Approval threshold: ${formatPercent(p.threshold)}. This is a number you entered, not a legal quorum.\n`,
  };
}

/**
 * One-line Markdown of the recommended package option count for clipboard handoff.
 * Count only. It is a decision aid, not a recorded vote.
 * Distinct from recommended-package copy and remaining change-budget copy.
 */
export function formatRecommendedPackageOptionCountMarkdown(proposal, result = findSmallestAgreement(proposal)) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || result.status === "invalid") {
    return { status: "invalid", errors: result?.errors ?? ["No result was available."] };
  }
  const disclaimer = "This is a decision aid, not a recorded vote.";
  if (result.status === "too_large") {
    return { status: "unavailable", text: `The search is over the safety bound, so the recommended package option count cannot be copied. ${disclaimer}\n` };
  }
  if (!result.agreement || !Array.isArray(result.agreement.options)) {
    return { status: "unavailable", text: `No recommended package is available, so the option count cannot be copied. ${disclaimer}\n` };
  }
  return {
    status: "ok",
    count: result.agreement.options.length,
    text: `Recommended package option count: ${result.agreement.options.length}. ${disclaimer}\n`,
  };
}

/**
 * Compact formula-safe CSV of recommended versus original option labels and cost delta.
 * Unavailable when there is no recommended package.
 */
export function formatRecommendedChangeCostCsv(proposal, result) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!result || typeof result !== "object" || Array.isArray(result) || !result.agreement || !Array.isArray(result.agreement.options)) {
    return { status: "unavailable", text: "No recommended package is available, so there is no change-cost table to copy.\n" };
  }
  if (result.agreement.options.length !== proposal.clauses.length) {
    return { status: "invalid", errors: ["Select exactly one option for every clause."] };
  }
  const p = canonicalProposal(proposal);
  const originals = getOriginalOptions(p);
  const rows = [["clause", "original_option", "recommended_option", "cost_delta"]];
  for (let index = 0; index < p.clauses.length; index += 1) {
    const original = originals[index];
    const recommended = result.agreement.options[index];
    rows.push([
      p.clauses[index].title,
      original.label,
      recommended.label,
      recommended.changeCost - original.changeCost,
    ]);
  }
  return { status: "ok", csv: serializeCsv(rows) };
}

function namedFileError(code, message, extra = {}) {
  return { code, message, ...extra };
}

function parseJsonObject(text, side) {
  try {
    const raw = JSON.parse(String(text ?? "").replace(/^\uFEFF/u, ""));
    if (!isPlainObject(raw)) return { status: "invalid", errors: [namedFileError("invalid_json", `The ${side} file must be a JSON object.`, { side })] };
    return { status: "ok", value: raw };
  } catch {
    return { status: "invalid", errors: [namedFileError("invalid_json", `The ${side} file is not valid JSON.`, { side })] };
  }
}

/** Accept a canonical proposal or a version-1 workspace wrapper. */
export function proposalFromWorkshopDocument(raw) {
  if (!isPlainObject(raw)) return { status: "invalid", errors: [namedFileError("invalid_json", "Workshop JSON must be an object.")] };
  let proposal = raw;
  if (Object.hasOwn(raw, "format")) {
    if (raw.format !== "smallest-agreement-workspace") {
      return { status: "invalid", errors: [namedFileError("invalid_format", "Unsupported workshop file format.")] };
    }
    if (raw.version !== 1 || !isPlainObject(raw.proposal)) {
      return { status: "invalid", errors: [namedFileError("invalid_format", "Workspace JSON must be version 1 with a proposal object.")] };
    }
    proposal = raw.proposal;
  }
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedFileError("invalid_proposal", validation.errors[0])] };
  return { status: "ok", proposal: canonicalProposal(proposal) };
}

/**
 * Compare two workshop JSON files by group and clause identifiers.
 * Missing identifiers are listed. Support scores are not invented as zeros
 * for groups or options that exist on only one side.
 */
export function compareWorkshopFiles(leftText, rightText) {
  const leftJson = parseJsonObject(leftText, "first");
  if (leftJson.status !== "ok") return leftJson;
  const rightJson = parseJsonObject(rightText, "second");
  if (rightJson.status !== "ok") return rightJson;
  const left = proposalFromWorkshopDocument(leftJson.value);
  if (left.status !== "ok") {
    return { status: "invalid", errors: left.errors.map((error) => ({ ...error, side: "left" })) };
  }
  const right = proposalFromWorkshopDocument(rightJson.value);
  if (right.status !== "ok") {
    return { status: "invalid", errors: right.errors.map((error) => ({ ...error, side: "right" })) };
  }
  const leftGroups = new Map(left.proposal.groups.map((group) => [group.id, group]));
  const rightGroups = new Map(right.proposal.groups.map((group) => [group.id, group]));
  const onlyLeftGroups = [...leftGroups.keys()].filter((id) => !rightGroups.has(id)).map((id) => ({ id, name: leftGroups.get(id).name }));
  const onlyRightGroups = [...rightGroups.keys()].filter((id) => !leftGroups.has(id)).map((id) => ({ id, name: rightGroups.get(id).name }));
  const sharedGroupIds = [...leftGroups.keys()].filter((id) => rightGroups.has(id));
  const groupChanges = [];
  for (const id of sharedGroupIds) {
    const a = leftGroups.get(id);
    const b = rightGroups.get(id);
    if (a.name !== b.name) groupChanges.push({ id, field: "name", left: a.name, right: b.name });
    if (a.weight !== b.weight) groupChanges.push({ id, field: "weight", left: a.weight, right: b.weight });
    if (a.minSupport !== b.minSupport) groupChanges.push({ id, field: "minSupport", left: a.minSupport, right: b.minSupport });
    if ((a.veto === true) !== (b.veto === true)) groupChanges.push({ id, field: "veto", left: a.veto === true, right: b.veto === true });
  }
  const leftClauses = new Map(left.proposal.clauses.map((clause) => [clause.id, clause]));
  const rightClauses = new Map(right.proposal.clauses.map((clause) => [clause.id, clause]));
  const onlyLeftClauses = [...leftClauses.keys()].filter((id) => !rightClauses.has(id)).map((id) => ({ id, title: leftClauses.get(id).title }));
  const onlyRightClauses = [...rightClauses.keys()].filter((id) => !leftClauses.has(id)).map((id) => ({ id, title: rightClauses.get(id).title }));
  const sharedClauseIds = [...leftClauses.keys()].filter((id) => rightClauses.has(id));
  const clauseChanges = [];
  for (const id of sharedClauseIds) {
    const a = leftClauses.get(id);
    const b = rightClauses.get(id);
    if (a.title !== b.title) clauseChanges.push({ id, field: "title", left: a.title, right: b.title });
    if (a.note !== b.note) clauseChanges.push({ id, field: "note", left: a.note, right: b.note });
    if (a.lockedOptionId !== b.lockedOptionId) clauseChanges.push({ id, field: "lockedOptionId", left: a.lockedOptionId, right: b.lockedOptionId });
    const leftOptions = new Map(a.options.map((option) => [option.id, option]));
    const rightOptions = new Map(b.options.map((option) => [option.id, option]));
    for (const optionId of leftOptions.keys()) {
      if (!rightOptions.has(optionId)) clauseChanges.push({ id, field: "option", optionId, left: optionId, right: undefined });
    }
    for (const optionId of rightOptions.keys()) {
      if (!leftOptions.has(optionId)) clauseChanges.push({ id, field: "option", optionId, left: undefined, right: optionId });
    }
    for (const optionId of leftOptions.keys()) {
      if (!rightOptions.has(optionId)) continue;
      const leftOption = leftOptions.get(optionId);
      const rightOption = rightOptions.get(optionId);
      if (leftOption.label !== rightOption.label) clauseChanges.push({ id, field: "option.label", optionId, left: leftOption.label, right: rightOption.label });
      if (leftOption.original !== rightOption.original) clauseChanges.push({ id, field: "option.original", optionId, left: leftOption.original, right: rightOption.original });
      if (leftOption.changeCost !== rightOption.changeCost) clauseChanges.push({ id, field: "option.changeCost", optionId, left: leftOption.changeCost, right: rightOption.changeCost });
      for (const groupId of sharedGroupIds) {
        const leftScore = leftOption.support[groupId];
        const rightScore = rightOption.support[groupId];
        if (leftScore !== rightScore) clauseChanges.push({ id, field: "option.support", optionId, groupId, left: leftScore, right: rightScore });
      }
    }
  }
  const leftOrder = left.proposal.clauses.map((clause) => clause.id).join(",");
  const rightOrder = right.proposal.clauses.map((clause) => clause.id).join(",");
  const aligned = onlyLeftGroups.length === 0 && onlyRightGroups.length === 0 && onlyLeftClauses.length === 0 && onlyRightClauses.length === 0;
  return {
    status: "ok",
    leftTitle: left.proposal.title,
    rightTitle: right.proposal.title,
    aligned,
    groups: { onlyLeft: onlyLeftGroups, onlyRight: onlyRightGroups, shared: sharedGroupIds, fieldChanges: groupChanges },
    clauses: { onlyLeft: onlyLeftClauses, onlyRight: onlyRightClauses, shared: sharedClauseIds, fieldChanges: clauseChanges },
    clauseOrderChanged: leftOrder !== rightOrder,
  };
}

const WORKSPACE_DOCUMENT_KEYS = new Set([
  "format",
  "version",
  "clauseDensity",
  "vetoGroupsOnly",
  "lockedClausesOnly",
  "changedClausesOnly",
  "belowFloorGroupsOnly",
  "overBudgetClausesOnly",
  "hideGroupsAtFloor",
  "hideGroupsWithoutFloors",
  "noCheaperRemainingClausesOnly",
  "hideUnlockedClauses",
  "hideLockedClauses",
  "hideGroupsMeetingThreshold",
  "hideGroupsBelowThreshold",
  "hideVetoGroups",
  "hideNonVetoGroups",
  "proposal",
]);
const WORKSPACE_PREF_KEYS = new Set([
  "clauseDensity",
  "vetoGroupsOnly",
  "lockedClausesOnly",
  "changedClausesOnly",
  "belowFloorGroupsOnly",
  "overBudgetClausesOnly",
  "hideGroupsAtFloor",
  "hideGroupsWithoutFloors",
  "noCheaperRemainingClausesOnly",
  "hideUnlockedClauses",
  "hideLockedClauses",
  "hideGroupsMeetingThreshold",
  "hideGroupsBelowThreshold",
  "hideVetoGroups",
  "hideNonVetoGroups",
]);

function readWorkspaceBoolean(raw, key) {
  if (!Object.hasOwn(raw, key)) return { value: false };
  if (raw[key] !== true && raw[key] !== false) {
    return { error: namedFileError("invalid_filter", `${key} must be a boolean.`) };
  }
  return { value: raw[key] };
}

/**
 * Workspace JSON carries the canonical proposal plus display prefs.
 * Older proposal-only files remain valid and do not change prefs.
 * Filter flags are display-only. The solver ignores them.
 * Unknown wrapper keys are rejected.
 */
export function formatWorkspaceJson(proposal, prefs = {}) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedFileError("invalid_proposal", validation.errors[0])] };
  if (!isPlainObject(prefs)) {
    return { status: "invalid", errors: [namedFileError("invalid_filter", "Workspace prefs must be an object.")] };
  }
  for (const key of Object.keys(prefs)) {
    if (!WORKSPACE_PREF_KEYS.has(key)) {
      return { status: "invalid", errors: [namedFileError("unknown_key", `Unknown workspace key: ${key}.`)] };
    }
  }
  const clauseDensity = Object.hasOwn(prefs, "clauseDensity") ? prefs.clauseDensity : "comfortable";
  if (clauseDensity !== "compact" && clauseDensity !== "comfortable") {
    return { status: "invalid", errors: [namedFileError("invalid_density", "clauseDensity must be compact or comfortable.")] };
  }
  const vetoGroupsOnly = readWorkspaceBoolean(prefs, "vetoGroupsOnly");
  if (vetoGroupsOnly.error) return { status: "invalid", errors: [vetoGroupsOnly.error] };
  const lockedClausesOnly = readWorkspaceBoolean(prefs, "lockedClausesOnly");
  if (lockedClausesOnly.error) return { status: "invalid", errors: [lockedClausesOnly.error] };
  const changedClausesOnly = readWorkspaceBoolean(prefs, "changedClausesOnly");
  if (changedClausesOnly.error) return { status: "invalid", errors: [changedClausesOnly.error] };
  const belowFloorGroupsOnly = readWorkspaceBoolean(prefs, "belowFloorGroupsOnly");
  if (belowFloorGroupsOnly.error) return { status: "invalid", errors: [belowFloorGroupsOnly.error] };
  const overBudgetClausesOnly = readWorkspaceBoolean(prefs, "overBudgetClausesOnly");
  if (overBudgetClausesOnly.error) return { status: "invalid", errors: [overBudgetClausesOnly.error] };
  const hideGroupsAtFloor = readWorkspaceBoolean(prefs, "hideGroupsAtFloor");
  if (hideGroupsAtFloor.error) return { status: "invalid", errors: [hideGroupsAtFloor.error] };
  const hideGroupsWithoutFloors = readWorkspaceBoolean(prefs, "hideGroupsWithoutFloors");
  if (hideGroupsWithoutFloors.error) return { status: "invalid", errors: [hideGroupsWithoutFloors.error] };
  const noCheaperRemainingClausesOnly = readWorkspaceBoolean(prefs, "noCheaperRemainingClausesOnly");
  if (noCheaperRemainingClausesOnly.error) return { status: "invalid", errors: [noCheaperRemainingClausesOnly.error] };
  const hideUnlockedClauses = readWorkspaceBoolean(prefs, "hideUnlockedClauses");
  if (hideUnlockedClauses.error) return { status: "invalid", errors: [hideUnlockedClauses.error] };
  const hideLockedClauses = readWorkspaceBoolean(prefs, "hideLockedClauses");
  if (hideLockedClauses.error) return { status: "invalid", errors: [hideLockedClauses.error] };
  const hideGroupsMeetingThreshold = readWorkspaceBoolean(prefs, "hideGroupsMeetingThreshold");
  if (hideGroupsMeetingThreshold.error) return { status: "invalid", errors: [hideGroupsMeetingThreshold.error] };
  const hideGroupsBelowThreshold = readWorkspaceBoolean(prefs, "hideGroupsBelowThreshold");
  if (hideGroupsBelowThreshold.error) return { status: "invalid", errors: [hideGroupsBelowThreshold.error] };
  const hideVetoGroups = readWorkspaceBoolean(prefs, "hideVetoGroups");
  if (hideVetoGroups.error) return { status: "invalid", errors: [hideVetoGroups.error] };
  const hideNonVetoGroups = readWorkspaceBoolean(prefs, "hideNonVetoGroups");
  if (hideNonVetoGroups.error) return { status: "invalid", errors: [hideNonVetoGroups.error] };
  return {
    status: "ok",
    clauseDensity,
    vetoGroupsOnly: vetoGroupsOnly.value,
    lockedClausesOnly: lockedClausesOnly.value,
    changedClausesOnly: changedClausesOnly.value,
    belowFloorGroupsOnly: belowFloorGroupsOnly.value,
    overBudgetClausesOnly: overBudgetClausesOnly.value,
    hideGroupsAtFloor: hideGroupsAtFloor.value,
    hideGroupsWithoutFloors: hideGroupsWithoutFloors.value,
    noCheaperRemainingClausesOnly: noCheaperRemainingClausesOnly.value,
    hideUnlockedClauses: hideUnlockedClauses.value,
    hideLockedClauses: hideLockedClauses.value,
    hideGroupsMeetingThreshold: hideGroupsMeetingThreshold.value,
    hideGroupsBelowThreshold: hideGroupsBelowThreshold.value,
    hideVetoGroups: hideVetoGroups.value,
    hideNonVetoGroups: hideNonVetoGroups.value,
    json: `${JSON.stringify({
      format: "smallest-agreement-workspace",
      version: 1,
      clauseDensity,
      vetoGroupsOnly: vetoGroupsOnly.value,
      lockedClausesOnly: lockedClausesOnly.value,
      changedClausesOnly: changedClausesOnly.value,
      belowFloorGroupsOnly: belowFloorGroupsOnly.value,
      overBudgetClausesOnly: overBudgetClausesOnly.value,
      hideGroupsAtFloor: hideGroupsAtFloor.value,
      hideGroupsWithoutFloors: hideGroupsWithoutFloors.value,
      noCheaperRemainingClausesOnly: noCheaperRemainingClausesOnly.value,
      hideUnlockedClauses: hideUnlockedClauses.value,
      hideLockedClauses: hideLockedClauses.value,
      hideGroupsMeetingThreshold: hideGroupsMeetingThreshold.value,
      hideGroupsBelowThreshold: hideGroupsBelowThreshold.value,
      hideVetoGroups: hideVetoGroups.value,
      hideNonVetoGroups: hideNonVetoGroups.value,
      proposal: canonicalProposal(proposal),
    }, null, 2)}\n`,
  };
}

export function parseWorkspaceJson(text) {
  const parsed = parseJsonObject(text, "workspace");
  if (parsed.status !== "ok") return parsed;
  const raw = parsed.value;
  if (!Object.hasOwn(raw, "format")) {
    const proposal = proposalFromWorkshopDocument(raw);
    if (proposal.status !== "ok") return proposal;
    return {
      status: "ok",
      kind: "proposal",
      proposal: proposal.proposal,
      clauseDensity: null,
      vetoGroupsOnly: null,
      lockedClausesOnly: null,
      changedClausesOnly: null,
      belowFloorGroupsOnly: null,
      overBudgetClausesOnly: null,
      hideGroupsAtFloor: null,
      hideGroupsWithoutFloors: null,
      noCheaperRemainingClausesOnly: null,
      hideUnlockedClauses: null,
      hideLockedClauses: null,
      hideGroupsMeetingThreshold: null,
      hideGroupsBelowThreshold: null,
      hideVetoGroups: null,
      hideNonVetoGroups: null,
    };
  }
  for (const key of Object.keys(raw)) {
    if (!WORKSPACE_DOCUMENT_KEYS.has(key)) {
      return { status: "invalid", errors: [namedFileError("unknown_key", `Unknown workspace key: ${key}.`)] };
    }
  }
  const proposal = proposalFromWorkshopDocument(raw);
  if (proposal.status !== "ok") return proposal;
  let clauseDensity = "comfortable";
  if (Object.hasOwn(raw, "clauseDensity")) {
    if (raw.clauseDensity !== "compact" && raw.clauseDensity !== "comfortable") {
      return { status: "invalid", errors: [namedFileError("invalid_density", "clauseDensity must be compact or comfortable.")] };
    }
    clauseDensity = raw.clauseDensity;
  }
  const vetoGroupsOnly = readWorkspaceBoolean(raw, "vetoGroupsOnly");
  if (vetoGroupsOnly.error) return { status: "invalid", errors: [vetoGroupsOnly.error] };
  const lockedClausesOnly = readWorkspaceBoolean(raw, "lockedClausesOnly");
  if (lockedClausesOnly.error) return { status: "invalid", errors: [lockedClausesOnly.error] };
  const changedClausesOnly = readWorkspaceBoolean(raw, "changedClausesOnly");
  if (changedClausesOnly.error) return { status: "invalid", errors: [changedClausesOnly.error] };
  const belowFloorGroupsOnly = readWorkspaceBoolean(raw, "belowFloorGroupsOnly");
  if (belowFloorGroupsOnly.error) return { status: "invalid", errors: [belowFloorGroupsOnly.error] };
  const overBudgetClausesOnly = readWorkspaceBoolean(raw, "overBudgetClausesOnly");
  if (overBudgetClausesOnly.error) return { status: "invalid", errors: [overBudgetClausesOnly.error] };
  const hideGroupsAtFloor = readWorkspaceBoolean(raw, "hideGroupsAtFloor");
  if (hideGroupsAtFloor.error) return { status: "invalid", errors: [hideGroupsAtFloor.error] };
  const hideGroupsWithoutFloors = readWorkspaceBoolean(raw, "hideGroupsWithoutFloors");
  if (hideGroupsWithoutFloors.error) return { status: "invalid", errors: [hideGroupsWithoutFloors.error] };
  const noCheaperRemainingClausesOnly = readWorkspaceBoolean(raw, "noCheaperRemainingClausesOnly");
  if (noCheaperRemainingClausesOnly.error) return { status: "invalid", errors: [noCheaperRemainingClausesOnly.error] };
  const hideUnlockedClauses = readWorkspaceBoolean(raw, "hideUnlockedClauses");
  if (hideUnlockedClauses.error) return { status: "invalid", errors: [hideUnlockedClauses.error] };
  const hideLockedClauses = readWorkspaceBoolean(raw, "hideLockedClauses");
  if (hideLockedClauses.error) return { status: "invalid", errors: [hideLockedClauses.error] };
  const hideGroupsMeetingThreshold = readWorkspaceBoolean(raw, "hideGroupsMeetingThreshold");
  if (hideGroupsMeetingThreshold.error) return { status: "invalid", errors: [hideGroupsMeetingThreshold.error] };
  const hideGroupsBelowThreshold = readWorkspaceBoolean(raw, "hideGroupsBelowThreshold");
  if (hideGroupsBelowThreshold.error) return { status: "invalid", errors: [hideGroupsBelowThreshold.error] };
  const hideVetoGroups = readWorkspaceBoolean(raw, "hideVetoGroups");
  if (hideVetoGroups.error) return { status: "invalid", errors: [hideVetoGroups.error] };
  const hideNonVetoGroups = readWorkspaceBoolean(raw, "hideNonVetoGroups");
  if (hideNonVetoGroups.error) return { status: "invalid", errors: [hideNonVetoGroups.error] };
  return {
    status: "ok",
    kind: "workspace",
    proposal: proposal.proposal,
    clauseDensity,
    vetoGroupsOnly: vetoGroupsOnly.value,
    lockedClausesOnly: lockedClausesOnly.value,
    changedClausesOnly: changedClausesOnly.value,
    belowFloorGroupsOnly: belowFloorGroupsOnly.value,
    overBudgetClausesOnly: overBudgetClausesOnly.value,
    hideGroupsAtFloor: hideGroupsAtFloor.value,
    hideGroupsWithoutFloors: hideGroupsWithoutFloors.value,
    noCheaperRemainingClausesOnly: noCheaperRemainingClausesOnly.value,
    hideUnlockedClauses: hideUnlockedClauses.value,
    hideLockedClauses: hideLockedClauses.value,
    hideGroupsMeetingThreshold: hideGroupsMeetingThreshold.value,
    hideGroupsBelowThreshold: hideGroupsBelowThreshold.value,
    hideVetoGroups: hideVetoGroups.value,
    hideNonVetoGroups: hideNonVetoGroups.value,
  };
}

/**
 * Export the current clause locks as a version-1 document.
 * Clauses without a lock are omitted. Re-import replaces every lock.
 */
export function formatLocksJson(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedFileError("invalid_proposal", validation.errors[0])] };
  const locks = proposal.clauses
    .filter((clause) => Object.hasOwn(clause, "lockedOptionId"))
    .map((clause) => ({ clauseId: clause.id, optionId: clause.lockedOptionId }));
  return {
    status: "ok",
    locks,
    json: `${JSON.stringify({
      format: "smallest-agreement-locks",
      version: 1,
      locks,
    }, null, 2)}\n`,
  };
}

/**
 * Replace every clause lock from a version-1 locks document.
 * Unknown clause or option ids fail closed. The input proposal is not mutated.
 */
export function parseLocksJson(text, proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedFileError("invalid_proposal", validation.errors[0])] };
  const parsed = parseJsonObject(text, "locks");
  if (parsed.status !== "ok") return parsed;
  const raw = parsed.value;
  if (raw.format !== "smallest-agreement-locks" || raw.version !== 1) {
    return { status: "invalid", errors: [namedFileError("invalid_format", "Locks JSON must declare format smallest-agreement-locks version 1.")] };
  }
  if (!Array.isArray(raw.locks)) {
    return { status: "invalid", errors: [namedFileError("invalid_format", "Locks JSON must include a locks array.")] };
  }
  const next = canonicalProposal(proposal);
  for (const clause of next.clauses) delete clause.lockedOptionId;
  const seen = new Set();
  for (const [index, row] of raw.locks.entries()) {
    if (!isPlainObject(row) || typeof row.clauseId !== "string" || typeof row.optionId !== "string") {
      return { status: "invalid", errors: [namedFileError("invalid_lock", `locks[${index}] must have clauseId and optionId strings.`)] };
    }
    if (seen.has(row.clauseId)) {
      return { status: "invalid", errors: [namedFileError("duplicate_clause", `Clause ${row.clauseId} is locked more than once.`)] };
    }
    seen.add(row.clauseId);
    const clause = next.clauses.find((item) => item.id === row.clauseId);
    if (!clause) {
      return { status: "invalid", errors: [namedFileError("unknown_clause", `Unknown clause ${row.clauseId}.`, { clauseId: row.clauseId })] };
    }
    if (!clause.options.some((option) => option.id === row.optionId)) {
      return { status: "invalid", errors: [namedFileError("unknown_option", `Unknown option ${row.optionId} for clause ${row.clauseId}.`, { clauseId: row.clauseId, optionId: row.optionId })] };
    }
    clause.lockedOptionId = row.optionId;
  }
  return { status: "ok", proposal: next, applied: raw.locks.length };
}

/**
 * Clear one group's support scores to blank on a copy of the proposal.
 * The copy is invalid until those cells are filled. Does not mutate the input.
 */
export function resetGroupSupport(proposal, groupId) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (typeof groupId !== "string" || !proposal.groups.some((group) => group.id === groupId)) {
    return { status: "invalid", errors: ["Unknown group."] };
  }
  const next = canonicalProposal(proposal);
  let cleared = 0;
  for (const clause of next.clauses) {
    for (const option of clause.options) {
      option.support[groupId] = null;
      cleared += 1;
    }
  }
  return { status: "ok", proposal: next, cleared, groupId };
}

function parseCsvCost(raw, path) {
  const neutralized = neutralizeCsvCell(raw).trim();
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (!neutralized || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(neutralized)) {
    return { error: namedCsvError("invalid_cost", `${path} must be a number from 0 through ${MAX_CHANGE_COST}.`, { path }) };
  }
  const changeCost = Number(neutralized);
  if (!Number.isFinite(changeCost) || changeCost < 0 || changeCost > MAX_CHANGE_COST) {
    return { error: namedCsvError("invalid_cost", `${path} must be a number from 0 through ${MAX_CHANGE_COST}.`, { path, value: neutralized }) };
  }
  return { changeCost };
}

function parseCsvFlag(raw, path, code, message) {
  const neutralized = neutralizeCsvCell(raw).trim().toLowerCase();
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (neutralized === "" || neutralized === "no" || neutralized === "false" || neutralized === "0") return { value: false };
  if (neutralized === "yes" || neutralized === "true" || neutralized === "1") return { value: true };
  return { error: namedCsvError(code, message, { path, value: neutralized }) };
}

function parseCsvIdentifier(raw, path) {
  const neutralized = neutralizeCsvCell(raw).trim();
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  if (!ID_PATTERN.test(neutralized) || RESERVED_IDS.has(neutralized)) {
    return { error: namedCsvError("invalid_id", `${path} must be 1 to 64 safe identifier characters.`, { path, value: neutralized }) };
  }
  return { id: neutralized };
}

function parseCsvLabel(raw, path, code, maxLength) {
  const neutralized = neutralizeCsvCell(raw);
  if (FORMULA_CELL.test(neutralized)) {
    return { error: namedCsvError("formula_cell", `${path} looks like a spreadsheet formula and was not imported.`, { path, value: neutralized }) };
  }
  const text = neutralized.trim();
  if (!text || text.length > maxLength) {
    return { error: namedCsvError(code, `${path} must be a non-empty string no longer than ${maxLength} characters.`, { path }) };
  }
  return { text };
}

/**
 * Export clause titles, option labels, original flags, costs, optional notes, and locks.
 * Support scores are omitted; import copies matching scores or fills 50.
 */
export function formatClauseOptionsCsv(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", validation.errors[0])] };
  const p = canonicalProposal(proposal);
  const rows = [["clause_id", "option_id", "clause_title", "option_label", "original", "change_cost", "note", "locked"]];
  for (const clause of p.clauses) {
    for (const option of clause.options) {
      rows.push([
        clause.id,
        option.id,
        clause.title,
        option.label,
        option.original ? "yes" : "no",
        option.changeCost,
        clause.note ?? "",
        clause.lockedOptionId === option.id ? "yes" : "no",
      ]);
    }
  }
  return { status: "ok", csv: serializeCsv(rows) };
}

/**
 * Replace clauses from a CSV of clause_id, option_id, clause_title, option_label,
 * original, and change_cost. Optional note and locked columns are accepted.
 * Unknown columns are rejected. Groups stay. Matching clause and option ids keep
 * their support scores; new options receive 50 for every group.
 * A first line that contains tabs is treated as TSV and converted to CSV before
 * the same validation. Does not mutate the supplied proposal.
 */
export function parseClauseOptionsCsv(csvText, proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", validation.errors[0])] };
  const parsed = parseCsvRecords(tableTextToCsv(csvText));
  if (parsed.status !== "ok") return parsed;
  const [header, ...body] = parsed.records;
  if (!header || header.length < 6) {
    return { status: "invalid", errors: [namedCsvError("missing_header", "CSV needs a header row with clause_id, option_id, clause_title, option_label, original, and change_cost.")] };
  }
  const columns = header.map((name) => neutralizeCsvCell(name).trim());
  if (columns.some((column) => FORMULA_CELL.test(column))) {
    return { status: "invalid", errors: [namedCsvError("formula_cell", "Header cells must not look like spreadsheet formulas.")] };
  }
  const errors = [];
  const seenHeaders = new Set();
  for (const column of columns) {
    if (seenHeaders.has(column)) errors.push(namedCsvError("duplicate_column", `Column ${column} is repeated.`, { column }));
    seenHeaders.add(column);
  }
  if (columns[0] !== "clause_id") errors.push(namedCsvError("missing_clause_id_column", "The first column must be clause_id."));
  if (columns[1] !== "option_id") errors.push(namedCsvError("missing_option_id_column", "The second column must be option_id."));
  const allowed = new Set(["clause_id", "option_id", "clause_title", "option_label", "original", "change_cost", "note", "locked"]);
  const indexOf = (name) => columns.indexOf(name);
  for (const column of columns) {
    if (!allowed.has(column)) errors.push(namedCsvError("unknown_column", `Unknown column: ${column}.`, { column }));
  }
  for (const required of ["clause_title", "option_label", "original", "change_cost"]) {
    if (!seenHeaders.has(required)) errors.push(namedCsvError("missing_column", `Missing column: ${required}.`, { column: required }));
  }
  if (body.length === 0) errors.push(namedCsvError("empty_csv", "CSV has a header but no option rows."));
  const titleIndex = indexOf("clause_title");
  const labelIndex = indexOf("option_label");
  const originalIndex = indexOf("original");
  const costIndex = indexOf("change_cost");
  const noteIndex = indexOf("note");
  const lockedIndex = indexOf("locked");
  const clauseOrder = [];
  const clauseMap = new Map();
  const seenPairs = new Set();
  body.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== columns.length) {
      errors.push(namedCsvError("truncated_row", `Row ${rowNumber} has ${record.length} cells, expected ${columns.length}.`, { row: rowNumber }));
      return;
    }
    const parsedClauseId = parseCsvIdentifier(record[0], `row ${rowNumber} clause_id`);
    if (parsedClauseId.error) {
      errors.push(parsedClauseId.error);
      return;
    }
    const parsedOptionId = parseCsvIdentifier(record[1], `row ${rowNumber} option_id`);
    if (parsedOptionId.error) {
      errors.push(parsedOptionId.error);
      return;
    }
    const pair = `${parsedClauseId.id}\0${parsedOptionId.id}`;
    if (seenPairs.has(pair)) {
      errors.push(namedCsvError("duplicate_row", `Row ${rowNumber} repeats clause ${parsedClauseId.id} option ${parsedOptionId.id}.`, { row: rowNumber, clauseId: parsedClauseId.id, optionId: parsedOptionId.id }));
      return;
    }
    seenPairs.add(pair);
    if (titleIndex < 0 || labelIndex < 0 || originalIndex < 0 || costIndex < 0) return;
    const parsedTitle = parseCsvLabel(record[titleIndex], `row ${rowNumber} clause_title`, "invalid_title", 120);
    if (parsedTitle.error) {
      errors.push(parsedTitle.error);
      return;
    }
    const parsedLabel = parseCsvLabel(record[labelIndex], `row ${rowNumber} option_label`, "invalid_label", 240);
    if (parsedLabel.error) {
      errors.push(parsedLabel.error);
      return;
    }
    const parsedOriginal = parseCsvFlag(record[originalIndex], `row ${rowNumber} original`, "invalid_original", `${`row ${rowNumber} original`} must be yes, no, true, false, 1, 0, or blank.`);
    if (parsedOriginal.error) {
      errors.push(parsedOriginal.error);
      return;
    }
    const parsedCost = parseCsvCost(record[costIndex], `row ${rowNumber} change_cost`);
    if (parsedCost.error) {
      errors.push(parsedCost.error);
      return;
    }
    if (parsedOriginal.value === true && parsedCost.changeCost !== 0) {
      errors.push(namedCsvError("invalid_cost", `Row ${rowNumber} original option must have zero change cost.`, { row: rowNumber }));
      return;
    }
    let note;
    if (noteIndex >= 0) {
      const noteRaw = neutralizeCsvCell(record[noteIndex]);
      if (FORMULA_CELL.test(noteRaw)) {
        errors.push(namedCsvError("formula_cell", `Row ${rowNumber} note looks like a spreadsheet formula.`, { row: rowNumber }));
        return;
      }
      if (noteRaw !== "") {
        if (noteRaw.length < 1 || noteRaw.length > 240) {
          errors.push(namedCsvError("invalid_note", `Row ${rowNumber} note must be 1 to 240 characters, or blank.`, { row: rowNumber }));
          return;
        }
        note = noteRaw;
      }
    }
    let locked = false;
    if (lockedIndex >= 0) {
      const parsedLock = parseCsvFlag(record[lockedIndex], `row ${rowNumber} locked`, "invalid_lock", `Row ${rowNumber} locked must be yes, no, true, false, 1, 0, or blank.`);
      if (parsedLock.error) {
        errors.push(parsedLock.error);
        return;
      }
      locked = parsedLock.value;
    }
    let clause = clauseMap.get(parsedClauseId.id);
    if (!clause) {
      if (clauseOrder.length >= MAX_CLAUSES) {
        errors.push(namedCsvError("too_many_clauses", `Between 1 and ${MAX_CLAUSES} clauses are required.`));
        return;
      }
      clause = { id: parsedClauseId.id, title: parsedTitle.text, options: [], note, lockedOptionId: undefined };
      clauseMap.set(parsedClauseId.id, clause);
      clauseOrder.push(clause);
    } else {
      if (clause.title !== parsedTitle.text) {
        errors.push(namedCsvError("inconsistent_title", `Row ${rowNumber} clause_title does not match earlier rows for ${parsedClauseId.id}.`, { row: rowNumber, clauseId: parsedClauseId.id }));
        return;
      }
      if (note !== undefined && clause.note !== undefined && clause.note !== note) {
        errors.push(namedCsvError("inconsistent_note", `Row ${rowNumber} note does not match earlier rows for ${parsedClauseId.id}.`, { row: rowNumber, clauseId: parsedClauseId.id }));
        return;
      }
      if (note !== undefined && clause.note === undefined) clause.note = note;
    }
    if (clause.options.some((option) => option.id === parsedOptionId.id)) {
      errors.push(namedCsvError("duplicate_row", `Row ${rowNumber} repeats option ${parsedOptionId.id} in clause ${parsedClauseId.id}.`, { row: rowNumber }));
      return;
    }
    if (clause.options.length >= MAX_OPTIONS_PER_CLAUSE) {
      errors.push(namedCsvError("too_many_options", `Clause ${parsedClauseId.id} needs 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`, { clauseId: parsedClauseId.id }));
      return;
    }
    if (locked) {
      if (clause.lockedOptionId !== undefined) {
        errors.push(namedCsvError("duplicate_lock", `Row ${rowNumber} adds a second lock on clause ${parsedClauseId.id}.`, { row: rowNumber, clauseId: parsedClauseId.id }));
        return;
      }
      clause.lockedOptionId = parsedOptionId.id;
    }
    const previousClause = proposal.clauses.find((item) => item.id === parsedClauseId.id);
    const previousOption = previousClause?.options.find((item) => item.id === parsedOptionId.id);
    const support = previousOption
      ? Object.fromEntries(proposal.groups.map((group) => [group.id, previousOption.support[group.id]]))
      : Object.fromEntries(proposal.groups.map((group) => [group.id, 50]));
    clause.options.push({
      id: parsedOptionId.id,
      label: parsedLabel.text,
      original: parsedOriginal.value,
      changeCost: parsedCost.changeCost,
      support,
    });
  });
  if (!errors.length) {
    if (clauseOrder.length < 1) errors.push(namedCsvError("empty_csv", "CSV has a header but no option rows."));
    for (const clause of clauseOrder) {
      if (clause.options.length < 3) {
        errors.push(namedCsvError("too_few_options", `Clause ${clause.id} needs 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`, { clauseId: clause.id }));
      }
      if (clause.options.length > MAX_OPTIONS_PER_CLAUSE) {
        errors.push(namedCsvError("too_many_options", `Clause ${clause.id} needs 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`, { clauseId: clause.id }));
      }
      const originals = clause.options.filter((option) => option.original === true);
      if (originals.length === 0) errors.push(namedCsvError("missing_original", `Clause ${clause.id} must have exactly one original option.`, { clauseId: clause.id }));
      if (originals.length > 1) errors.push(namedCsvError("extra_original", `Clause ${clause.id} must have exactly one original option.`, { clauseId: clause.id }));
    }
  }
  if (errors.length) return { status: "invalid", errors };
  const next = canonicalProposal(proposal);
  next.clauses = clauseOrder.map((clause) => ({
    id: clause.id,
    title: clause.title,
    ...(clause.lockedOptionId !== undefined ? { lockedOptionId: clause.lockedOptionId } : {}),
    ...(clause.note ? { note: clause.note } : {}),
    options: clause.options.map((option) => ({
      id: option.id,
      label: option.label,
      original: option.original === true,
      changeCost: option.changeCost,
      support: option.support,
    })),
  }));
  const imported = validateProposal(next);
  if (!imported.valid) return { status: "invalid", errors: [namedCsvError("invalid_proposal", imported.errors[0])] };
  return { status: "ok", proposal: canonicalProposal(next), importedClauses: next.clauses.length, importedOptions: next.clauses.reduce((sum, clause) => sum + clause.options.length, 0) };
}

export const AGREEMENT_REVIEW_TOOLS=Object.freeze([
 {id:'margin',title:'Approval margin'},
 {id:'floors',title:'Group floor and veto slack'},
 {id:'dominance',title:'Option support and cost dominance'},
 {id:'substitutions',title:'Single-clause substitutions'},
 {id:'rollback',title:'Rollback contribution'},
 {id:'thresholds',title:'Threshold scenarios'},
 {id:'budgets',title:'Budget scenarios'},
 {id:'locks',title:'Single-lock opportunity cost'},
 {id:'uncertainty',title:'Targeted support uncertainty'},
// SA_REVIEW_TOOLS
]);
export function analyzeAgreementReview(rawProposal,tool){
 const proposal=canonicalProposal(rawProposal);const selectedTool=AGREEMENT_REVIEW_TOOLS.find(entry=>entry.id===tool);if(!selectedTool)throw new TypeError('Unknown agreement review.');
 const solved=findSmallestAgreement(proposal);const selected=solved.agreement??selectionSummary(proposal,getOriginalOptions(proposal));
 const context=solved.agreement?'Recommended package':'Original package ('+solved.status+')';
 const report=(columns,rows,note)=>({tool,title:selectedTool.title,currency:'declared cost units',columns,rows,note:note+' Context: '+context+'.'});
 switch(tool){
 case 'margin':{

 return report(['Package','Approval %','Threshold %','Margin points','Change cost','Other constraints'],[[context,selected.approval,proposal.threshold,selected.approval-proposal.threshold,selected.changeCost,selected.constraints.met?'Met':'Not met']],'A positive aggregate margin alone does not pass floors, vetoes, locks or budget. Support scores and weights are declared inputs, not measured votes.');

 }
 case 'floors':{

 return report(['Group','Package support %','Floor %','Floor slack points','Veto requirement %','Veto slack points'],proposal.groups.map((g,i)=>{const actual=selected.byGroup[i].approval,required=g.veto?Math.max(proposal.threshold,g.minSupport??0):null;return[g.name,actual,g.minSupport??null,g.minSupport===undefined?null:actual-g.minSupport,required,required===null?null:actual-required];}),'Blank means that constraint is not declared. Veto requirements use the greater of the aggregate threshold and any group floor. These rows use the same fixed package as the review context.');

 }
 case 'dominance':{

 const rows=[];for(const clause of proposal.clauses){for(const option of clause.options){const allowed=o=>!clause.lockedOptionId||clause.lockedOptionId===o.id;const dominates=allowed(option)?clause.options.filter(other=>other.id!==option.id&&allowed(other)&&other.changeCost<=option.changeCost&&Number(!other.original)<=Number(!option.original)&&proposal.groups.every(g=>other.support[g.id]>=option.support[g.id])&&(other.changeCost<option.changeCost||Number(!other.original)<Number(!option.original)||proposal.groups.some(g=>other.support[g.id]>option.support[g.id]))):[];rows.push([clause.title,option.label,option.changeCost,allowed(option)?dominates.map(o=>o.label).join('; ')||'None on these measures':'Excluded by current lock']);}}
 return report(['Clause','Option','Change cost','Dominating allowed alternatives'],rows,'Comparison is within one clause across every declared group score, change cost and whether the option changes the original. Current locks are respected. This does not infer semantic substitutability or delete options.');

 }
 case 'substitutions':{

 const rows=[];proposal.clauses.forEach((clause,index)=>{for(const option of clause.options){if(option.id===selected.options[index].id)continue;const options=[...selected.options];options[index]=option;const tested=selectionSummary(proposal,options);rows.push([clause.title,option.label,tested.approval,tested.approval-selected.approval,tested.changeCost,tested.approval+EPSILON>=proposal.threshold&&tested.constraints.met?'Pass':'Does not pass']);}});
 return report(['Changed clause','Alternative','Approval %','Approval change points','Package cost','All tests'],rows,'One clause changes at a time, all other selected options stay fixed. Lock, budget, floor and veto failures remain failures. At most 460 alternatives; this local neighborhood is not a complete package search.');

 }
 case 'rollback':{

 const rows=[];proposal.clauses.forEach((clause,index)=>{const original=clause.options.find(o=>o.original);if(original.id===selected.options[index].id)return;const options=[...selected.options];options[index]=original;const tested=selectionSummary(proposal,options);rows.push([clause.title,selected.options[index].label,selected.approval-tested.approval,selected.changeCost-tested.changeCost,tested.approval,tested.approval+EPSILON>=proposal.threshold&&tested.constraints.met?'Still passes':'Does not pass']);});
 return report(['Rolled-back clause','Selected change','Approval lost points','Cost removed','Approval after rollback %','All tests after rollback'],rows,'Each row separately restores one original option. This is a fixed-package accounting exercise, not proof that a clause causes real approval. No rows means the context package has no changes.');

 }
 case 'thresholds':{

 const levels=[...new Set([-10,-5,0,5,10].map(delta=>Math.max(0,Math.min(100,proposal.threshold+delta))))];
 const rows=levels.map(threshold=>{const r=findSmallestAgreement({...proposal,threshold},{maxCombinations:10000});return[threshold,r.status,r.agreement?.changeCost??null,r.agreement?.approval??null,r.agreement?.options.map(o=>o.id).join(', ')??'Unavailable'];});
 return report(['Threshold %','Search status','Least passing cost','Approval %','Option IDs in clause order'],rows,'Up to five thresholds within 0 to 100. Veto requirements change with the threshold. Every counterfactual search is capped at 10,000 combinations; too_large is unavailable, not infeasible. Other inputs stay fixed.');

 }
 case 'budgets':{

 const maximum=proposal.clauses.reduce((sum,c)=>sum+Math.max(...c.options.map(o=>o.changeCost)),0);const reference=proposal.maxChangeCost??selected.changeCost;const levels=[...new Set([0,reference/2,reference,Math.min(maximum,reference*1.5),maximum])].sort((a,b)=>a-b);
 const rows=levels.map(maxChangeCost=>{const r=findSmallestAgreement({...proposal,maxChangeCost},{maxCombinations:10000});return[maxChangeCost,r.status,r.agreement?.changeCost??null,r.agreement?.approval??null,r.agreement?.options.map(o=>o.id).join(', ')??'Unavailable'];});
 return report(['Tested maximum cost','Search status','Least passing cost','Approval %','Option IDs in clause order'],rows,'At most five discrete budgets around the current budget or selected cost, plus the maximum sum of clause costs. This is not a continuous frontier. Each search is capped at 10,000 combinations; too_large means unavailable.');

 }
 case 'locks':{

 const locked=proposal.clauses.filter(c=>c.lockedOptionId);const perSearch=Math.max(1,Math.floor(50000/Math.max(1,locked.length)));
 const rows=locked.map(clause=>{const changed={...proposal,clauses:proposal.clauses.map(c=>{const copy={...c};if(c.id===clause.id)delete copy.lockedOptionId;return copy;})};const r=findSmallestAgreement(changed,{maxCombinations:perSearch});return[clause.title,clause.lockedOptionId,r.status,r.agreement?.changeCost??null,solved.agreement&&r.agreement?solved.agreement.changeCost-r.agreement.changeCost:null,r.agreement?.options.map(o=>o.id).join(', ')??'Unavailable'];});
 return report(['Unlocked clause','Original lock ID','Search status','Cost with one lock removed','Cost saved vs recommendation','New option IDs'],rows,'One lock is removed per row without changing the current proposal. Across rows at most 50,000 candidate combinations are allowed. A too_large result is unavailable and is not evidence that the lock is necessary.');

 }
 case 'uncertainty':{

 const rows=[];for(const group of proposal.groups)for(const drop of [5,10,20]){const options=selected.options.map(o=>({...o,support:{...o.support,[group.id]:Math.max(0,o.support[group.id]-drop)}}));const tested=selectionSummary(proposal,options);rows.push([group.name,drop,tested.byGroup.find(g=>g.id===group.id).approval,tested.approval,tested.approval-proposal.threshold,tested.approval+EPSILON>=proposal.threshold&&tested.constraints.met?'Pass':'Does not pass']);}
 return report(['Stressed group','Score reduction points','Group support after clamp %','Aggregate approval %','Margin points','All tests'],rows,'Reduce the selected option scores for one group by 5, 10 or 20 points, clamped at zero. Other scores and the package stay fixed; no search or probability is implied. At most 72 cases.');

 }
// SA_REVIEW_CASES
 default:throw new TypeError('Unavailable agreement review.');
 }
}

export function createAgreementReviewPacket(rawProposal, tool) {
  const scenario = canonicalProposal(rawProposal);
  const packet = { format: 'agreement-review', version: 1, tool, scenario, inputJSON: JSON.stringify(scenario), review: analyzeAgreementReview(scenario, tool) };
  if (new TextEncoder().encode(JSON.stringify(packet)).length > 1048576) throw new TypeError('Review packet exceeds 1 MiB. Choose a narrower review.');
  return packet;
}

export function replayAgreementReviewPacket(candidate) {
  const fields = ['format', 'version', 'tool', 'scenario', 'inputJSON', 'review'];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || Object.keys(candidate).length !== fields.length || !fields.every((field) => Object.hasOwn(candidate, field)) || candidate.format !== 'agreement-review' || candidate.version !== 1) throw new TypeError('Unsupported review packet.');
  const current = createAgreementReviewPacket(candidate.scenario, candidate.tool);
  if (candidate.inputJSON !== current.inputJSON) throw new TypeError('Review input snapshot changed. Run a new review.');
  const supplied = candidate.review, expected = current.review;
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied) || Object.keys(supplied).length !== Object.keys(expected).length || !Object.keys(expected).every((field) => Object.hasOwn(supplied, field))) throw new TypeError('Review result fields changed.');
  for (const field of ['tool', 'title', 'currency', 'note']) if (supplied[field] !== expected[field]) throw new TypeError('Review result does not match the input snapshot.');
  if (!Array.isArray(supplied.columns) || supplied.columns.length !== expected.columns.length || expected.columns.some((value, index) => !Object.hasOwn(supplied.columns, index) || supplied.columns[index] !== value) || !Array.isArray(supplied.rows) || supplied.rows.length !== expected.rows.length || expected.rows.some((row, index) => !Object.hasOwn(supplied.rows, index) || !Array.isArray(supplied.rows[index]) || supplied.rows[index].length !== row.length || row.some((value, column) => !Object.hasOwn(supplied.rows[index], column) || supplied.rows[index][column] !== value))) throw new TypeError('Review result does not match the input snapshot.');
  return current;
}
