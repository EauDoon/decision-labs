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
 * Copy a participant group, including weight, optional floor, veto, and every option's support score.
 * The copy receives a unique id. The solver still treats it as a separate supplied group.
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
  const copy = {
    id: copyId,
    name: source.name.length + 7 > 80 ? `${source.name.slice(0, 73)} (copy)` : `${source.name} (copy)`,
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
