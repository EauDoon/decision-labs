import {
  createAgreementReviewPacket,
  replayAgreementReviewPacket,
  AGREEMENT_REVIEW_TOOLS,
  analyzeAgreementReview,
  MAX_CLAUSES,
  MAX_COMBINATIONS,
  MAX_GROUPS,
  MAX_OPTIONS_PER_CLAUSE,
  canonicalProposal,
  clauseContributions,
  comparePinnedPackages,
  explorePackageGaps,
  evaluatePackage,
  lockPackage,
  clearAllLocks,
  toggleClauseLock,
  vetoBlockingGroups,
  previewRenormalizedWeights,
  applyRenormalizedWeights,
  duplicateParticipantGroup,
  duplicateClauseOption,
  moveClause,
  sortPackageGapRows,
  formatSupportMatrixCsv,
  parseSupportMatrixCsv,
  parseParticipantGroupsCsv,
  formatParticipantGroupsCsv,
  parseClauseOptionsCsv,
  formatClauseOptionsCsv,
  previewLockedOption,
  leaveOneGroupOut,
  formatDiscussionWorksheet,
  formatDiscussionWorksheetCsv,
  formatRecommendedPackageMarkdown,
  formatOriginalVersusRecommendedMarkdown,
  formatVetoBlockersMarkdown,
  formatPinnedPackagesMarkdown,
  formatCurrentLocksMarkdown,
  formatCurrentLockCountMarkdown,
  formatRecommendedChangeCostCsv,
  changedClauseIds,
  groupsBelowSupportRequirement,
  groupsMeetingDeclaredSupportFloor,
  overBudgetClauseIds,
  clausesWithoutCheaperRemainingOption,
  formatGroupSupportMarkdown,
  formatRemainingChangeBudgetMarkdown,
  formatApprovalThresholdMarkdown,
  formatRecommendedPackageOptionCountMarkdown,
  compareWorkshopFiles,
  formatWorkspaceJson,
  parseWorkspaceJson,
  formatLocksJson,
  parseLocksJson,
  resetGroupSupport,
  groupContributions,
  stressPackage,
  compareScenarioInputs,
  formatEvidenceCsv,
  findSmallestAgreement,
  formatPercent,
  formatDecisionBrief,
  validateProposal,
} from "./model.js";

const STORAGE_KEY = "smallest-agreement:proposal:v1";
const LIBRARY_KEY = "smallest-agreement:scenarios:v1";
const COACH_KEY = "smallest-agreement:coach:v1";
const WORKSPACE_KEY = "smallest-agreement:workspace:v1";
const MAX_SCENARIOS = 20;
let libraryBlocked = false;
let libraryRaw = null;
let hasUnsavedEdits = false;
const HASH_PREFIX = "#agreement=";
let idNumber = 100;
let initialLoadMessage = "Loaded local draft.";
let importSequence = 0;

const presets = {
  "protected-access": {
    title: "Protected Access: shared workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [
      { id: "regular", name: "Regular participants", weight: 9 },
      { id: "new", name: "New participants", weight: 1, minSupport: 60 },
    ],
    clauses: [
      { id: "booking", title: "Workshop booking", options: [
        { id: "booking-original", original: true, label: "Retain recurring reservations", changeCost: 0, support: { regular: 90, new: 10 } },
        { id: "booking-notice", original: false, label: "Publish cancellations each week", changeCost: 1, support: { regular: 95, new: 30 } },
        { id: "booking-open", original: false, label: "Reserve an open booking window", changeCost: 3, support: { regular: 80, new: 90 } },
      ] },
      { id: "training", title: "Safety training", lockedOptionId: "training-original", options: [
        { id: "training-original", original: true, label: "Keep supervised induction", changeCost: 0, support: { regular: 80, new: 50 } },
        { id: "training-weekly", original: false, label: "Add weekly induction sessions", changeCost: 2, support: { regular: 85, new: 90 } },
        { id: "training-pairs", original: false, label: "Offer paired induction appointments", changeCost: 4, support: { regular: 80, new: 95 } },
      ] },
    ],
  },
  neighbourhood: {
    title: "Neighbourhood Plan: the shared green",
    threshold: 68,
    groups: [
      { id: "residents", name: "Residents", weight: 3 },
      { id: "shopkeepers", name: "Shopkeepers", weight: 2 },
      { id: "stewards", name: "Park stewards", weight: 2 },
    ],
    clauses: [
      {
        id: "hours", title: "Park access hours", options: [
          { id: "hours-original", original: true, label: "Close at 20:00 every day", changeCost: 0, support: { residents: 78, shopkeepers: 55, stewards: 88 } },
          { id: "hours-seasonal", original: false, label: "Use seasonal closing times", changeCost: 2, support: { residents: 86, shopkeepers: 74, stewards: 73 } },
          { id: "hours-pilot", original: false, label: "Trial a 21:00 Friday close for three months", changeCost: 3, support: { residents: 84, shopkeepers: 83, stewards: 60 } },
        ],
      },
      {
        id: "market", title: "Weekend market use", options: [
          { id: "market-original", original: true, label: "No regular market use", changeCost: 0, support: { residents: 60, shopkeepers: 52, stewards: 91 } },
          { id: "market-monthly", original: false, label: "Permit one monthly market with clean-up bond", changeCost: 2, support: { residents: 74, shopkeepers: 89, stewards: 72 } },
          { id: "market-seasonal", original: false, label: "Permit a summer market series", changeCost: 5, support: { residents: 68, shopkeepers: 93, stewards: 48 } },
        ],
      },
      {
        id: "path", title: "Path lighting", options: [
          { id: "path-original", original: true, label: "Replace failed lamps as needed", changeCost: 0, support: { residents: 58, shopkeepers: 63, stewards: 80 } },
          { id: "path-warm", original: false, label: "Install warm low-level path lighting", changeCost: 3, support: { residents: 85, shopkeepers: 76, stewards: 67 } },
          { id: "path-motion", original: false, label: "Install motion-activated lighting", changeCost: 4, support: { residents: 78, shopkeepers: 71, stewards: 75 } },
        ],
      },
    ],
  },
  "open-source": {
    title: "Open Source Policy: contributor access",
    threshold: 72,
    groups: [
      { id: "maintainers", name: "Maintainers", weight: 3 },
      { id: "contributors", name: "Contributors", weight: 3 },
      { id: "users", name: "Downstream users", weight: 2 },
    ],
    clauses: [
      {
        id: "review", title: "Pull request review", options: [
          { id: "review-original", original: true, label: "Two maintainer approvals for every merge", changeCost: 0, support: { maintainers: 88, contributors: 48, users: 75 } },
          { id: "review-risk", original: false, label: "One approval for documented low-risk changes", changeCost: 2, support: { maintainers: 73, contributors: 80, users: 78 } },
          { id: "review-rotation", original: false, label: "Weekly rotating review pair", changeCost: 4, support: { maintainers: 69, contributors: 85, users: 72 } },
        ],
      },
      {
        id: "release", title: "Release cadence", options: [
          { id: "release-original", original: true, label: "Quarterly feature releases", changeCost: 0, support: { maintainers: 81, contributors: 51, users: 69 } },
          { id: "release-monthly", original: false, label: "Monthly release train with a freeze week", changeCost: 3, support: { maintainers: 70, contributors: 79, users: 85 } },
          { id: "release-patch", original: false, label: "Keep quarterly features and publish monthly patches", changeCost: 1, support: { maintainers: 80, contributors: 68, users: 82 } },
        ],
      },
      {
        id: "conduct", title: "Contributor conduct process", options: [
          { id: "conduct-original", original: true, label: "Maintainer-led private review", changeCost: 0, support: { maintainers: 74, contributors: 57, users: 72 } },
          { id: "conduct-panel", original: false, label: "Standing three-person review panel", changeCost: 3, support: { maintainers: 68, contributors: 83, users: 77 } },
          { id: "conduct-adviser", original: false, label: "External adviser for escalated cases", changeCost: 5, support: { maintainers: 60, contributors: 86, users: 80 } },
        ],
      },
    ],
  },
  "association-budget": {
    title: "Association Budget: repair and reserve plan",
    threshold: 70,
    groups: [
      { id: "owners", name: "Owners", weight: 4 },
      { id: "tenants", name: "Tenants", weight: 2 },
      { id: "board", name: "Board", weight: 2 },
    ],
    clauses: [
      {
        id: "reserve", title: "Reserve contribution", options: [
          { id: "reserve-original", original: true, label: "Raise annual reserve contribution by 8%", changeCost: 0, support: { owners: 57, tenants: 72, board: 91 } },
          { id: "reserve-staged", original: false, label: "Raise 4% now and review after six months", changeCost: 2, support: { owners: 77, tenants: 76, board: 75 } },
          { id: "reserve-loan", original: false, label: "Fund reserves with a five-year loan", changeCost: 5, support: { owners: 61, tenants: 81, board: 54 } },
        ],
      },
      {
        id: "roof", title: "Roof repair timing", options: [
          { id: "roof-original", original: true, label: "Complete all repairs this financial year", changeCost: 0, support: { owners: 63, tenants: 71, board: 87 } },
          { id: "roof-priority", original: false, label: "Repair critical sections now and inspect the rest", changeCost: 2, support: { owners: 82, tenants: 78, board: 74 } },
          { id: "roof-defer", original: false, label: "Defer repairs for one year", changeCost: 4, support: { owners: 70, tenants: 52, board: 39 } },
        ],
      },
      {
        id: "amenity", title: "Amenity refresh", options: [
          { id: "amenity-original", original: true, label: "Refresh lobby and courtyard this year", changeCost: 0, support: { owners: 55, tenants: 69, board: 77 } },
          { id: "amenity-courtyard", original: false, label: "Refresh courtyard only after roof milestones", changeCost: 2, support: { owners: 76, tenants: 75, board: 71 } },
          { id: "amenity-pause", original: false, label: "Pause amenity works for one year", changeCost: 1, support: { owners: 72, tenants: 49, board: 68 } },
        ],
      },
    ],
  },
  "workplace-hybrid": {
    title: "Workplace Hybrid: office presence policy",
    threshold: 70,
    groups: [
      { id: "onsite", name: "On-site staff", weight: 3 },
      { id: "remote", name: "Remote staff", weight: 3 },
      { id: "managers", name: "Managers", weight: 2 },
    ],
    clauses: [
      {
        id: "presence", title: "Weekly office presence", options: [
          { id: "presence-original", original: true, label: "Require three office days each week", changeCost: 0, support: { onsite: 82, remote: 38, managers: 88 } },
          { id: "presence-overlap", original: false, label: "Require two overlapping team days", changeCost: 2, support: { onsite: 78, remote: 74, managers: 80 } },
          { id: "presence-choice", original: false, label: "Let teams choose presence within a published window", changeCost: 3, support: { onsite: 70, remote: 88, managers: 62 } },
        ],
      },
      {
        id: "hours", title: "Core collaboration hours", options: [
          { id: "hours-original", original: true, label: "Keep 10:00 to 16:00 overlap every weekday", changeCost: 0, support: { onsite: 76, remote: 44, managers: 84 } },
          { id: "hours-four", original: false, label: "Use a four-hour overlap window", changeCost: 1, support: { onsite: 72, remote: 80, managers: 74 } },
          { id: "hours-async", original: false, label: "Drop fixed hours and rely on written updates", changeCost: 4, support: { onsite: 48, remote: 90, managers: 40 } },
        ],
      },
      {
        id: "desks", title: "Desk assignment", options: [
          { id: "desks-original", original: true, label: "Keep assigned desks for every role", changeCost: 0, support: { onsite: 80, remote: 42, managers: 70 } },
          { id: "desks-bookable", original: false, label: "Move to bookable desks with neighbourhood zones", changeCost: 2, support: { onsite: 64, remote: 82, managers: 68 } },
          { id: "desks-hybrid", original: false, label: "Keep assigned desks for on-site roles and bookable desks for others", changeCost: 3, support: { onsite: 74, remote: 76, managers: 72 } },
        ],
      },
    ],
  },
  "club-constitution": {
    title: "Club Constitution: membership meetings",
    threshold: 66,
    groups: [
      { id: "members", name: "Members", weight: 5 },
      { id: "officers", name: "Officers", weight: 2, veto: true },
      { id: "staff", name: "Club staff", weight: 1 },
    ],
    clauses: [
      {
        id: "quorum", title: "Meeting quorum", options: [
          { id: "quorum-original", original: true, label: "Keep a 40% membership quorum", changeCost: 0, support: { members: 55, officers: 88, staff: 70 } },
          { id: "quorum-one-third", original: false, label: "Lower quorum to one third of members", changeCost: 2, support: { members: 82, officers: 64, staff: 74 } },
          { id: "quorum-present", original: false, label: "Count only members present in the room", changeCost: 3, support: { members: 48, officers: 71, staff: 80 } },
        ],
      },
      {
        id: "proxy", title: "Proxy votes", options: [
          { id: "proxy-original", original: true, label: "Allow unlimited written proxies", changeCost: 0, support: { members: 62, officers: 40, staff: 55 } },
          { id: "proxy-capped", original: false, label: "Cap each member at two proxies", changeCost: 1, support: { members: 78, officers: 82, staff: 70 } },
          { id: "proxy-none", original: false, label: "End proxy voting and require attendance", changeCost: 4, support: { members: 35, officers: 90, staff: 68 } },
        ],
      },
      {
        id: "guests", title: "Guest speakers at general meetings", options: [
          { id: "guests-original", original: true, label: "Officers may invite speakers without notice", changeCost: 0, support: { members: 44, officers: 86, staff: 60 } },
          { id: "guests-notice", original: false, label: "Publish speaker names seven days in advance", changeCost: 2, support: { members: 84, officers: 72, staff: 78 } },
          { id: "guests-vote", original: false, label: "Require a members vote before each invitation", changeCost: 3, support: { members: 80, officers: 38, staff: 52 } },
        ],
      },
    ],
  },
  "library-quiet-hours": {
    title: "Library Quiet Hours: shared reading rooms",
    threshold: 70,
    groups: [
      { id: "readers", name: "Readers", weight: 4 },
      { id: "families", name: "Families", weight: 2 },
      { id: "staff", name: "Library staff", weight: 2, veto: true },
    ],
    clauses: [
      {
        id: "evening", title: "Evening hours", options: [
          { id: "evening-original", original: true, label: "Close reading rooms at 18:00", changeCost: 0, support: { readers: 48, families: 72, staff: 82 } },
          { id: "evening-extended", original: false, label: "Keep two quiet rooms open until 20:00", changeCost: 2, support: { readers: 86, families: 64, staff: 70 } },
          { id: "evening-late", original: false, label: "Staff a late desk until 21:00 on weekdays", changeCost: 4, support: { readers: 80, families: 50, staff: 42 } },
        ],
      },
      {
        id: "children", title: "Children's area sound rules", options: [
          { id: "children-original", original: true, label: "Keep the children's area open to the main floor", changeCost: 0, support: { readers: 40, families: 88, staff: 60 } },
          { id: "children-doors", original: false, label: "Add doors and a posted quiet-hour sign", changeCost: 2, support: { readers: 84, families: 70, staff: 74 } },
          { id: "children-split", original: false, label: "Split story time into a separate room", changeCost: 3, support: { readers: 78, families: 76, staff: 68 } },
        ],
      },
      {
        id: "events", title: "After-hours events", options: [
          { id: "events-original", original: true, label: "Allow evening events in the reading rooms", changeCost: 0, support: { readers: 36, families: 70, staff: 55 } },
          { id: "events-hall", original: false, label: "Move evening events to the community hall", changeCost: 2, support: { readers: 82, families: 74, staff: 78 } },
          { id: "events-none", original: false, label: "End after-hours events on weeknights", changeCost: 3, support: { readers: 74, families: 42, staff: 80 } },
        ],
      },
    ],
  },
  "sports-fixture-night": {
    title: "Sports Fixture Night: match end-time, floodlights, and parking",
    threshold: 70,
    groups: [
      { id: "members", name: "Members", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "rangers", name: "Council rangers", weight: 2 },
    ],
    clauses: [
      {
        id: "endtime", title: "Match end-time", options: [
          { id: "endtime-original", original: true, label: "Kick off at 19:30 and finish by 21:15", changeCost: 0, support: { members: 82, neighbours: 38, rangers: 64 } },
          { id: "endtime-early", original: false, label: "Kick off at 18:30 and finish by 20:15", changeCost: 2, support: { members: 58, neighbours: 84, rangers: 78 } },
          { id: "endtime-weekend", original: false, label: "Move the fixture to Saturday afternoon", changeCost: 4, support: { members: 46, neighbours: 90, rangers: 72 } },
        ],
      },
      {
        id: "floodlights", title: "Floodlights", options: [
          { id: "floodlights-original", original: true, label: "Keep floodlights on until 22:00", changeCost: 0, support: { members: 88, neighbours: 28, rangers: 52 } },
          { id: "floodlights-curfew", original: false, label: "Switch floodlights off at 21:00", changeCost: 2, support: { members: 70, neighbours: 76, rangers: 80 } },
          { id: "floodlights-baffles", original: false, label: "Keep 22:00 with baffled lamps and a cut-off", changeCost: 3, support: { members: 80, neighbours: 68, rangers: 74 } },
        ],
      },
      {
        id: "parking", title: "Match-night parking", options: [
          { id: "parking-original", original: true, label: "Allow unmanaged street parking", changeCost: 0, support: { members: 74, neighbours: 32, rangers: 40 } },
          { id: "parking-stewards", original: false, label: "Steward the club car park until 21:30", changeCost: 2, support: { members: 84, neighbours: 72, rangers: 82 } },
          { id: "parking-shuttle", original: false, label: "Use off-site overflow and a shuttle", changeCost: 4, support: { members: 62, neighbours: 86, rangers: 70 } },
        ],
      },
    ],
  },
  "market-stall-hours": {
    title: "Market stall hours: open hours, packing, and neighbour noise",
    threshold: 70,
    groups: [
      { id: "stallholders", name: "Stallholders", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "officers", name: "Market officers", weight: 2 },
    ],
    clauses: [
      {
        id: "openhours", title: "Stall open hours", options: [
          { id: "openhours-original", original: true, label: "Close stalls at 16:00", changeCost: 0, support: { stallholders: 42, neighbours: 86, officers: 70 } },
          { id: "openhours-eighteen", original: false, label: "Stay open until 18:00 on market days", changeCost: 2, support: { stallholders: 88, neighbours: 58, officers: 72 } },
          { id: "openhours-friday", original: false, label: "Open until 19:00 on Fridays only", changeCost: 3, support: { stallholders: 80, neighbours: 64, officers: 68 } },
        ],
      },
      {
        id: "packing", title: "Packing and pack-down", options: [
          { id: "packing-original", original: true, label: "Pack down in the street after close", changeCost: 0, support: { stallholders: 78, neighbours: 34, officers: 48 } },
          { id: "packing-yard", original: false, label: "Pack in the yard before 17:30", changeCost: 2, support: { stallholders: 70, neighbours: 76, officers: 82 } },
          { id: "packing-bay", original: false, label: "Use a shared packing bay with a steward", changeCost: 3, support: { stallholders: 74, neighbours: 80, officers: 86 } },
        ],
      },
      {
        id: "noise", title: "Neighbour noise", options: [
          { id: "noise-original", original: true, label: "No posted quiet hours", changeCost: 0, support: { stallholders: 82, neighbours: 28, officers: 50 } },
          { id: "noise-posted", original: false, label: "Post quiet hours after 18:00", changeCost: 2, support: { stallholders: 72, neighbours: 78, officers: 76 } },
          { id: "noise-generators", original: false, label: "Switch generators off by 17:00 and pack by hand", changeCost: 4, support: { stallholders: 54, neighbours: 88, officers: 70 } },
        ],
      },
    ],
  },
  "shared-bike-shed": {
    title: "Shared bike shed: access hours, lighting, and lock-up",
    threshold: 70,
    groups: [
      { id: "cyclists", name: "Bike users", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "managers", name: "Building managers", weight: 2 },
    ],
    clauses: [
      {
        id: "access", title: "Access hours", options: [
          { id: "access-original", original: true, label: "Keep the shed locked from 20:00 to 07:00", changeCost: 0, support: { cyclists: 42, neighbours: 86, managers: 74 } },
          { id: "access-late", original: false, label: "Allow fob access until 22:00", changeCost: 2, support: { cyclists: 86, neighbours: 62, managers: 70 } },
          { id: "access-24", original: false, label: "Allow 24-hour fob access with a log", changeCost: 4, support: { cyclists: 90, neighbours: 40, managers: 48 } },
        ],
      },
      {
        id: "lighting", title: "Shed lighting", options: [
          { id: "lighting-original", original: true, label: "Keep the existing sensor light", changeCost: 0, support: { cyclists: 48, neighbours: 80, managers: 72 } },
          { id: "lighting-warm", original: false, label: "Add warm low-glare lighting on a timer", changeCost: 2, support: { cyclists: 82, neighbours: 74, managers: 76 } },
          { id: "lighting-motion", original: false, label: "Install shielded motion lights facing the alley", changeCost: 3, support: { cyclists: 78, neighbours: 70, managers: 68 } },
        ],
      },
      {
        id: "lockup", title: "Lock-up", options: [
          { id: "lockup-original", original: true, label: "Keep the shared padlock and a paper key list", changeCost: 0, support: { cyclists: 36, neighbours: 58, managers: 64 } },
          { id: "lockup-fob", original: false, label: "Issue personal fobs and retire the padlock", changeCost: 2, support: { cyclists: 84, neighbours: 76, managers: 80 } },
          { id: "lockup-camera", original: false, label: "Add a lock-up camera covering the door only", changeCost: 4, support: { cyclists: 70, neighbours: 52, managers: 78 } },
        ],
      },
    ],
  },
  "street-stall-lighting": {
    title: "Street stall lighting: lighting hours, glare, and pack-down",
    threshold: 70,
    maxChangeCost: 8,
    groups: [
      { id: "stallholders", name: "Stallholders", weight: 4 },
      { id: "residents", name: "Nearby residents", weight: 3, veto: true },
      { id: "officers", name: "Council officers", weight: 2 },
    ],
    clauses: [
      {
        id: "lighting", title: "Lighting hours", options: [
          { id: "lighting-original", original: true, label: "Keep stall lamps on until midnight", changeCost: 0, support: { stallholders: 88, residents: 30, officers: 42 } },
          { id: "lighting-curfew", original: false, label: "Switch stall lamps off at 21:00", changeCost: 2, support: { stallholders: 54, residents: 86, officers: 78 } },
          { id: "lighting-timer", original: false, label: "Timer lamps until last pack-down", changeCost: 3, support: { stallholders: 76, residents: 72, officers: 74 } },
        ],
      },
      {
        id: "glare", title: "Glare", options: [
          { id: "glare-original", original: true, label: "Keep unshielded floodlights over the stalls", changeCost: 0, support: { stallholders: 82, residents: 22, officers: 46 } },
          { id: "glare-shielded", original: false, label: "Fit shielded downward lamps on each stall", changeCost: 2, support: { stallholders: 74, residents: 80, officers: 82 } },
          { id: "glare-string", original: false, label: "Use warm low-glare string lights along the street", changeCost: 3, support: { stallholders: 70, residents: 76, officers: 70 } },
        ],
      },
      {
        id: "packdown", title: "Pack-down lighting", options: [
          { id: "packdown-original", original: true, label: "Pack down under the floodlights", changeCost: 0, support: { stallholders: 84, residents: 28, officers: 40 } },
          { id: "packdown-headlamps", original: false, label: "Pack down with headlamps only", changeCost: 2, support: { stallholders: 48, residents: 84, officers: 72 } },
          { id: "packdown-bay", original: false, label: "Pack in a lit loading bay off the street", changeCost: 3, support: { stallholders: 78, residents: 76, officers: 84 } },
        ],
      },
    ],
  },
  "hall-hire-hours": {
    title: "Hall hire hours: close time, PA volume, and clean-up",
    threshold: 70,
    maxChangeCost: 8,
    groups: [
      { id: "hirers", name: "Hirers", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "committee", name: "Hall committee", weight: 2 },
    ],
    clauses: [
      {
        id: "closetime", title: "Close time", options: [
          { id: "closetime-original", original: true, label: "End hires at 22:00", changeCost: 0, support: { hirers: 40, neighbours: 86, committee: 72 } },
          { id: "closetime-23", original: false, label: "Allow hires until 23:00 with a steward", changeCost: 2, support: { hirers: 86, neighbours: 64, committee: 74 } },
          { id: "closetime-midnight", original: false, label: "Allow midnight close on Fridays only", changeCost: 4, support: { hirers: 90, neighbours: 42, committee: 50 } },
        ],
      },
      {
        id: "pvolume", title: "PA volume", options: [
          { id: "pvolume-original", original: true, label: "No posted PA volume cap", changeCost: 0, support: { hirers: 84, neighbours: 28, committee: 48 } },
          { id: "pvolume-cap", original: false, label: "Cap PA at 90 dB and face speakers inward", changeCost: 2, support: { hirers: 70, neighbours: 82, committee: 80 } },
          { id: "pvolume-off", original: false, label: "Switch the PA off at 21:00", changeCost: 3, support: { hirers: 46, neighbours: 88, committee: 68 } },
        ],
      },
      {
        id: "cleanup", title: "Clean-up", options: [
          { id: "cleanup-original", original: true, label: "Hirers leave by 22:15 without a clean-up check", changeCost: 0, support: { hirers: 80, neighbours: 34, committee: 40 } },
          { id: "cleanup-check", original: false, label: "Require a 30-minute clean-up with a committee check", changeCost: 2, support: { hirers: 68, neighbours: 78, committee: 84 } },
          { id: "cleanup-deposit", original: false, label: "Take a clean-up deposit and inspect next morning", changeCost: 3, support: { hirers: 62, neighbours: 74, committee: 76 } },
        ],
      },
    ],
  },
  "community-garden-watering": {
    title: "Community garden watering: watering hours, hose noise, and lock-up",
    threshold: 70,
    maxChangeCost: 8,
    groups: [
      { id: "plot-holders", name: "Plot-holders", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "committee", name: "Garden committee", weight: 2 },
    ],
    clauses: [
      {
        id: "watering", title: "Watering hours", options: [
          { id: "watering-original", original: true, label: "Lock the standpipe from 20:00 to 07:00", changeCost: 0, support: { "plot-holders": 42, neighbours: 86, committee: 74 } },
          { id: "watering-evening", original: false, label: "Allow watering until 21:00 with a posted rota", changeCost: 2, support: { "plot-holders": 86, neighbours: 64, committee: 72 } },
          { id: "watering-dawn", original: false, label: "Allow dawn watering from 06:00 with a shared timer", changeCost: 3, support: { "plot-holders": 80, neighbours: 70, committee: 76 } },
        ],
      },
      {
        id: "hose", title: "Hose noise", options: [
          { id: "hose-original", original: true, label: "No posted hose quiet hours", changeCost: 0, support: { "plot-holders": 84, neighbours: 28, committee: 48 } },
          { id: "hose-quiet", original: false, label: "Ban hose use after 20:00 and use watering cans after that", changeCost: 2, support: { "plot-holders": 70, neighbours: 82, committee: 80 } },
          { id: "hose-drip", original: false, label: "Switch to drip lines and retire the shared hose", changeCost: 4, support: { "plot-holders": 48, neighbours: 88, committee: 68 } },
        ],
      },
      {
        id: "lockup", title: "Garden lock-up", options: [
          { id: "lockup-original", original: true, label: "Keep the shared padlock and a paper key list", changeCost: 0, support: { "plot-holders": 40, neighbours: 58, committee: 64 } },
          { id: "lockup-fob", original: false, label: "Issue plot fobs and retire the padlock", changeCost: 2, support: { "plot-holders": 84, neighbours: 76, committee: 80 } },
          { id: "lockup-timer", original: false, label: "Add a timed lock on the standpipe cupboard", changeCost: 3, support: { "plot-holders": 72, neighbours: 70, committee: 74 } },
        ],
      },
    ],
  },
  "shared-laundry-hours": {
    title: "Shared laundry hours: wash hours, dryer noise, and lock-up",
    threshold: 70,
    maxChangeCost: 8,
    groups: [
      { id: "tenants", name: "Tenants", weight: 4 },
      { id: "neighbours", name: "Neighbours", weight: 3, veto: true },
      { id: "managers", name: "Building managers", weight: 2 },
    ],
    clauses: [
      {
        id: "wash", title: "Wash hours", options: [
          { id: "wash-original", original: true, label: "Keep the laundry room locked from 21:00 to 07:00", changeCost: 0, support: { tenants: 38, neighbours: 88, managers: 76 } },
          { id: "wash-late", original: false, label: "Allow washing until 22:00 with a posted rota", changeCost: 2, support: { tenants: 86, neighbours: 62, managers: 72 } },
          { id: "wash-dawn", original: false, label: "Allow dawn washing from 06:00 with a shared booking card", changeCost: 3, support: { tenants: 78, neighbours: 70, managers: 74 } },
        ],
      },
      {
        id: "dryer", title: "Dryer noise", options: [
          { id: "dryer-original", original: true, label: "No posted dryer quiet hours", changeCost: 0, support: { tenants: 84, neighbours: 26, managers: 46 } },
          { id: "dryer-quiet", original: false, label: "Switch dryers off at 20:00 and finish loads by air-dry", changeCost: 2, support: { tenants: 68, neighbours: 84, managers: 78 } },
          { id: "dryer-cover", original: false, label: "Fit a noise cover on each dryer and keep evening hours", changeCost: 4, support: { tenants: 80, neighbours: 72, managers: 70 } },
        ],
      },
      {
        id: "laundry-lockup", title: "Laundry lock-up", options: [
          { id: "laundry-lockup-original", original: true, label: "Leave the laundry door on a shared key hook", changeCost: 0, support: { tenants: 36, neighbours: 56, managers: 62 } },
          { id: "laundry-lockup-fob", original: false, label: "Issue tenant fobs for the laundry door", changeCost: 2, support: { tenants: 86, neighbours: 74, managers: 82 } },
          { id: "laundry-lockup-timer", original: false, label: "Add a timed lock on the laundry door", changeCost: 3, support: { tenants: 74, neighbours: 70, managers: 76 } },
        ],
      },
    ],
  },
};

let agreementReviewPacket = null;
let agreementReviewSequence = 0;
const state = { proposal: loadInitialProposal(), saveMessage: initialLoadMessage };
let scenarios = loadScenarios();
let manualSelection = Object.create(null);
let lockPreview = null;
let clauseFilter = "";
let clauseDensity = "comfortable";
let vetoGroupsOnly = false;
let lockedClausesOnly = false;
let hideUnlockedClauses = false;
let hideLockedClauses = false;
let changedClausesOnly = false;
let belowFloorGroupsOnly = false;
let hideGroupsAtFloor = false;
let hideGroupsWithoutFloors = false;
let overBudgetClausesOnly = false;
let noCheaperRemainingClausesOnly = false;
let printRedacted = false;
let nearMissSort = "approval_gap";
let weightPreview = null;
let weightPreviewKey = "";
let cachedResultKey;
let cachedResult;
const savedResults = new WeakMap();
const undoStack = [];
const redoStack = [];
let historySnapshot = JSON.stringify(state.proposal);
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function groupDisplayName(group) {
  if (!printRedacted) return group.name;
  const index = state.proposal.groups.findIndex((row) => row.id === group.id);
  return `Group ${index >= 0 ? index + 1 : state.proposal.groups.length + 1}`;
}

function renderPrintKicker() {
  const kicker = $(".facilitator-pack-kicker");
  if (!kicker) return;
  kicker.textContent = printRedacted
    ? "Facilitator pack with redacted group names. Groups appear as Group 1, Group 2, and so on. Recommended package option labels, a one-line remaining change-budget, the numeric approval threshold on the worksheet, and a one-line lock count stay on the worksheet. The saved draft is unchanged. The workshop tour is hidden. This leftover is a draft accounting line, not a legal appropriation. The threshold is a number you entered, not a legal quorum. Locks are draft choices, not a legal hold. This is a decision aid, not a recorded vote."
    : "Facilitator pack. The workshop tour is hidden. Original, solver, and pin columns stay visible, along with facilitator notes, veto highlights, recommended package option labels, a one-line remaining change-budget, the numeric approval threshold on the worksheet, and a one-line lock count on the worksheet. This leftover is a draft accounting line, not a legal appropriation. The threshold is a number you entered, not a legal quorum. Locks are draft choices, not a legal hold. This is a decision aid, not a recorded vote.";
}

function renderCopyFallbacks(result) {
  const packageBox = $("#package-markdown-fallback");
  if (packageBox) {
    const packaged = formatRecommendedPackageMarkdown(state.proposal, result ?? currentResult());
    packageBox.value = packaged.status === "ok" ? packaged.text : packaged.status === "unavailable" ? packaged.text : "";
  }
  const optionCountBox = $("#option-count-fallback");
  if (optionCountBox) {
    const counted = formatRecommendedPackageOptionCountMarkdown(state.proposal, result ?? currentResult());
    optionCountBox.value = counted.status === "ok" || counted.status === "unavailable" ? counted.text : "";
  }
  const locksBox = $("#locks-markdown-fallback");
  if (locksBox) {
    const listed = formatCurrentLocksMarkdown(state.proposal);
    locksBox.value = listed.status === "ok" ? listed.text : "";
  }
  const lockCountBox = $("#lock-count-fallback");
  if (lockCountBox) {
    const counted = formatCurrentLockCountMarkdown(state.proposal);
    lockCountBox.value = counted.status === "ok" ? counted.text : "";
  }
  const costBox = $("#change-cost-csv-fallback");
  if (costBox) {
    const exported = formatRecommendedChangeCostCsv(state.proposal, result ?? currentResult());
    costBox.value = exported.status === "ok" ? exported.csv : exported.status === "unavailable" ? exported.text : "";
  }
  const supportBox = $("#group-support-fallback");
  if (supportBox) {
    const listed = formatGroupSupportMarkdown(state.proposal, inspectedPackage(result ?? currentResult()));
    supportBox.value = listed.status === "ok" ? listed.text : listed.status === "unavailable" ? listed.text : "";
  }
  const remainingBox = $("#remaining-budget-fallback");
  if (remainingBox) {
    const remaining = formatRemainingChangeBudgetMarkdown(state.proposal, result ?? currentResult());
    remainingBox.value = remaining.status === "ok" || remaining.status === "unavailable" ? remaining.text : "";
  }
  const thresholdBox = $("#approval-threshold-fallback");
  if (thresholdBox) {
    const threshold = formatApprovalThresholdMarkdown(state.proposal);
    thresholdBox.value = threshold.status === "ok" ? threshold.text : "";
  }
  const versusBox = $("#original-versus-recommended-fallback");
  if (versusBox) {
    const versus = formatOriginalVersusRecommendedMarkdown(state.proposal, result ?? currentResult());
    versusBox.value = versus.status === "ok" || versus.status === "unavailable" ? versus.text : "";
  }
}

function firstProposalError(proposal) {
  return validateProposal(proposal).errors[0];
}

function loadWorkspacePrefs() {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.clauseDensity === "compact" || parsed?.clauseDensity === "comfortable") clauseDensity = parsed.clauseDensity;
    vetoGroupsOnly = parsed?.vetoGroupsOnly === true;
    lockedClausesOnly = parsed?.lockedClausesOnly === true;
    hideUnlockedClauses = parsed?.hideUnlockedClauses === true;
    hideLockedClauses = parsed?.hideLockedClauses === true;
    changedClausesOnly = parsed?.changedClausesOnly === true;
    belowFloorGroupsOnly = parsed?.belowFloorGroupsOnly === true;
    overBudgetClausesOnly = parsed?.overBudgetClausesOnly === true;
    hideGroupsAtFloor = parsed?.hideGroupsAtFloor === true;
    hideGroupsWithoutFloors = parsed?.hideGroupsWithoutFloors === true;
    noCheaperRemainingClausesOnly = parsed?.noCheaperRemainingClausesOnly === true;
  } catch {
    /* storage may be unavailable or invalid */
  }
}

function persistWorkspacePrefs() {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ clauseDensity, vetoGroupsOnly, lockedClausesOnly, hideUnlockedClauses, hideLockedClauses, changedClausesOnly, belowFloorGroupsOnly, overBudgetClausesOnly, hideGroupsAtFloor, hideGroupsWithoutFloors, noCheaperRemainingClausesOnly }));
  } catch {
    /* storage may be unavailable */
  }
}

function applyClauseDensity() {
  const editor = $("#clauses-editor");
  if (editor) {
    editor.classList.toggle("clause-density-compact", clauseDensity === "compact");
    editor.classList.toggle("clause-density-comfortable", clauseDensity === "comfortable");
  }
  const select = $("#clause-density");
  if (select) select.value = clauseDensity;
}

function parseProposalJson(text) {
  let proposal;
  try {
    proposal = JSON.parse(text);
  } catch (error) {
    return { cause: error instanceof SyntaxError ? "the text is not valid JSON." : "it could not be parsed." };
  }
  const cause = firstProposalError(proposal);
  return cause ? { cause } : { proposal: canonicalProposal(proposal) };
}

function makeId(prefix) {
  const used = new Set([
    ...state.proposal.groups.map((group) => group.id),
    ...state.proposal.clauses.flatMap((clause) => [clause.id, ...clause.options.map((option) => option.id)]),
  ]);
  do { idNumber += 1; } while (used.has(`${prefix}-${idNumber}`));
  return `${prefix}-${idNumber}`;
}

function defaultSupport(groups, value = 50) {
  return Object.fromEntries(groups.map((group) => [group.id, value]));
}

function loadInitialProposal() {
  const shared = parseHash();
  if (shared) return shared;
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    initialLoadMessage = "Browser storage is unavailable. Started from the Neighbourhood Plan preset.";
    return clone(presets.neighbourhood);
  }
  if (raw == null || raw === "") return clone(presets.neighbourhood);
  const parsed = parseProposalJson(raw);
  if (parsed.cause) {
    initialLoadMessage = `Local draft ignored: ${parsed.cause}`;
    return clone(presets.neighbourhood);
  }
  initialLoadMessage = "Loaded local draft.";
  return parsed.proposal;
}

function parseHash() {
  if (!location.hash.startsWith(HASH_PREFIX)) return null;
  if (location.hash.length > 60_000) {
    initialLoadMessage = "Share link ignored: it is larger than 60 KB.";
    return null;
  }
  let encoded;
  try {
    encoded = decodeURIComponent(location.hash.slice(HASH_PREFIX.length))
      .replaceAll("-", "+")
      .replaceAll("_", "/");
  } catch {
    initialLoadMessage = "Share link ignored: the URL encoding is invalid.";
    return null;
  }
  const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");
  let binary;
  try {
    binary = atob(padded);
  } catch {
    initialLoadMessage = "Share link ignored: it is not valid base64.";
    return null;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    initialLoadMessage = "Share link ignored: it is not valid UTF-8.";
    return null;
  }
  const parsed = parseProposalJson(text);
  if (parsed.cause) {
    initialLoadMessage = `Share link ignored: ${parsed.cause}`;
    return null;
  }
  initialLoadMessage = "Loaded proposal from the share link.";
  return parsed.proposal;
}

function encodeHash(proposal) {
  const bytes = new TextEncoder().encode(JSON.stringify(proposal));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  return `${HASH_PREFIX}${encoded}`;
}

function updateHistoryButtons() {
  $("#undo-button").disabled = undoStack.length === 0;
  $("#redo-button").disabled = redoStack.length === 0;
}

function save(recordHistory = true) {
  clearAgreementReview();
  hasUnsavedEdits = true;
  const snapshot = JSON.stringify(state.proposal);
  if (recordHistory && snapshot !== historySnapshot) {
    undoStack.push(historySnapshot);
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
  }
  historySnapshot = snapshot;
  updateHistoryButtons();
  importSequence += 1;
  const error = firstProposalError(state.proposal);
  if (error) {
    state.saveMessage = `Invalid edits are not saved: ${error}`;
    return;
  }
  if (location.hash.startsWith(HASH_PREFIX)) history.replaceState(null, "", `${location.pathname}${location.search}`);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canonicalProposal(state.proposal)));
    hasUnsavedEdits = false;
    state.saveMessage = "Saved in this browser.";
  } catch {
    state.saveMessage = "Browser storage is unavailable. Export to keep this draft.";
  }
}

function currentResult() {
  const key = JSON.stringify(state.proposal);
  if (key !== cachedResultKey) {
    cachedResult = findSmallestAgreement(state.proposal, { maxCombinations: MAX_COMBINATIONS, alternativesLimit: 5 });
    cachedResultKey = key;
  }
  return cachedResult;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMargin(value) {
  const rounded = Number(value.toFixed(1));
  return [rounded > 0 ? "+" : "", rounded.toFixed(1), " points"].join("");
}

function render() {
  clearAgreementReview();
  const proposal = state.proposal;
  $("[data-action=\"add-group\"]").disabled = proposal.groups.length >= MAX_GROUPS;
  $("[data-action=\"add-clause\"]").disabled = proposal.clauses.length >= MAX_CLAUSES;
  $("#clear-locks").disabled = !proposal.clauses.some((clause) => clause.lockedOptionId !== undefined);
  $("#proposal-title").value = proposal.title;
  $("#threshold").value = proposal.threshold;
  $("#threshold-number").value = Number.isFinite(proposal.threshold) ? proposal.threshold : "";
  $("#threshold-output").textContent = `${proposal.threshold}%`;
  $("#max-change-cost").value = proposal.maxChangeCost ?? "";
  $("#proposal-heading").textContent = proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  updateHistoryButtons();
  renderScenarios();
  const result = currentResult();
  const vetoBlocks = blockingVetoIds(result);
  renderGroups(vetoBlocks);
  renderWeightPreview();
  $("#clause-filter").value = clauseFilter;
  renderClauses();
  applyClauseDensity();
  renderBallot(vetoBlocks);
  renderResults(result, vetoBlocks);
  renderCopyFallbacks(result);
  renderPrintKicker();
}

function inspectedPackage(result) {
  return result.agreement?.options ?? result.baseline?.options ?? null;
}

function blockingVetoIds(result) {
  const options = inspectedPackage(result);
  if (!options) return new Set();
  const blocking = vetoBlockingGroups(state.proposal, options);
  if (blocking.status !== "ok") return new Set();
  return new Set(blocking.groups.map((group) => group.id));
}

function renderGroups(vetoBlocks = new Set()) {
  const checkbox = $("#veto-groups-only");
  if (checkbox) checkbox.checked = vetoGroupsOnly;
  const belowCheckbox = $("#below-floor-groups-only");
  if (belowCheckbox) belowCheckbox.checked = belowFloorGroupsOnly;
  const hideAtFloorCheckbox = $("#hide-groups-at-floor");
  if (hideAtFloorCheckbox) hideAtFloorCheckbox.checked = hideGroupsAtFloor;
  const hideWithoutFloorsCheckbox = $("#hide-groups-without-floors");
  if (hideWithoutFloorsCheckbox) hideWithoutFloorsCheckbox.checked = hideGroupsWithoutFloors;
  const inspected = inspectedPackage(currentResult());
  const below = inspected
    ? groupsBelowSupportRequirement(state.proposal, inspected)
    : { status: "ok", groups: [] };
  const belowIds = new Set(below.status === "ok" ? below.groups.map((group) => group.id) : []);
  const meeting = inspected
    ? groupsMeetingDeclaredSupportFloor(state.proposal, inspected)
    : { status: "ok", groups: [] };
  const meetingIds = new Set(meeting.status === "ok" ? meeting.groups.map((group) => group.id) : []);
  const visible = state.proposal.groups.filter((group) => {
    if (vetoGroupsOnly && group.veto !== true) return false;
    if (belowFloorGroupsOnly && !belowIds.has(group.id)) return false;
    if (hideGroupsAtFloor && meetingIds.has(group.id)) return false;
    if (hideGroupsWithoutFloors && !Object.hasOwn(group, "minSupport")) return false;
    return true;
  });
  const status = $("#veto-groups-status");
  const groupFiltersOn = vetoGroupsOnly || belowFloorGroupsOnly || hideGroupsAtFloor || hideGroupsWithoutFloors;
  if (!visible.length) {
    const message = hideGroupsWithoutFloors && hideGroupsAtFloor && !vetoGroupsOnly && !belowFloorGroupsOnly
      ? "No groups remain after hiding groups that currently meet their support floor or have no support floor. Hidden groups still count in the model."
      : hideGroupsWithoutFloors && !vetoGroupsOnly && !belowFloorGroupsOnly && !hideGroupsAtFloor
      ? "No groups remain after hiding groups that have no support floor. Hidden groups still count in the model."
      : hideGroupsAtFloor && !vetoGroupsOnly && !belowFloorGroupsOnly
      ? "No groups remain after hiding groups that currently meet their support floor. Hidden groups still count in the model."
      : belowFloorGroupsOnly && vetoGroupsOnly
      ? "No groups match the veto and below-floor filters. Hidden groups still count in the model."
      : belowFloorGroupsOnly
        ? "No groups are below their support floor or the approval threshold on the inspected package. Hidden groups still count in the model."
        : vetoGroupsOnly
          ? "No veto groups match this filter. Clear it to see every group. Hidden groups still count in the model."
          : "Add a participant group to begin.";
    if (status) status.textContent = groupFiltersOn ? message : "";
    $("#groups-editor").innerHTML = `<p class="empty-state">${message}</p>`;
  } else {
    if (status) status.textContent = groupFiltersOn ? `Showing ${visible.length} of ${state.proposal.groups.length} groups. Hidden groups still count in the model.` : "";
    $("#groups-editor").innerHTML = visible.map((group) => `
    <div class="group-row${vetoBlocks.has(group.id) ? " veto-blocking" : ""}"${vetoBlocks.has(group.id) ? ` data-veto-block="${escapeHtml(group.id)}"` : ""}${belowIds.has(group.id) ? ` data-below-floor="${escapeHtml(group.id)}"` : ""}${vetoBlocks.has(group.id) || belowIds.has(group.id) ? " tabindex=\"-1\"" : ""}>
      <label><span class="visually-hidden">Group name</span><input data-field="group-name" data-group-id="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="80" aria-label="Group name"></label>
      <label><span class="visually-hidden">Weight</span><input data-field="group-weight" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="1000000" step="any" required value="${group.weight}" aria-label="${escapeHtml(group.name)} weight"></label>
      <button class="text-button" type="button" data-action="duplicate-group" data-group-id="${escapeHtml(group.id)}" ${state.proposal.groups.length >= MAX_GROUPS ? "disabled" : ""}>Duplicate group</button>
      <button class="text-button" type="button" data-action="reset-group-support" data-group-id="${escapeHtml(group.id)}">Reset support to blank</button>
      <button class="text-button danger" type="button" data-action="remove-group" data-group-id="${escapeHtml(group.id)}" ${state.proposal.groups.length <= 1 ? "disabled" : ""}>Remove</button>
      <label class="group-floor">Minimum support (%)<input data-field="group-floor" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="any" value="${group.minSupport ?? ""}" placeholder="No floor" aria-label="${escapeHtml(group.name)} minimum support" aria-describedby="floor-note"></label>
      <label class="group-veto"><input data-field="group-veto" data-group-id="${escapeHtml(group.id)}" type="checkbox" ${group.veto === true ? "checked" : ""} aria-describedby="veto-note" aria-label="${escapeHtml(group.name)} veto"> Veto group (average support must meet the threshold)</label>
      ${vetoBlocks.has(group.id) ? '<p class="veto-blocking-note">Veto not met on the inspected package. This is a numerical constraint, not a legal right.</p>' : ""}
    </div>`).join("");
  }
  const total = state.proposal.groups.reduce((sum, group) => sum + (Number.isFinite(group.weight) && group.weight > 0 ? group.weight : 0), 0);
  if (!(total > 0)) {
    $("#weight-shares").innerHTML = '<p class="field-note">Weight shares need positive finite weights.</p>';
    return;
  }
  $("#weight-shares").innerHTML = `<p class="field-note">Each share is that group's weight divided by the total (${total}). Shares are mixing weights in the approval formula, not voting rights.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight</th><th scope="col">Share of total</th></tr></thead><tbody>${state.proposal.groups.map((group) => `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${group.weight}</td><td>${Number.isFinite(group.weight) && group.weight > 0 ? `${((group.weight / total) * 100).toFixed(1)}%` : "Invalid"}</td></tr>`).join("")}</tbody></table></div>`;
}

function currentWeightKey() {
  return JSON.stringify(state.proposal.groups.map((group) => [group.id, group.weight]));
}

function renderWeightPreview() {
  const target = $("#weight-renorm");
  if (!target) return;
  if (weightPreview && weightPreviewKey !== currentWeightKey()) {
    weightPreview = null;
    weightPreviewKey = "";
  }
  if (!weightPreview) {
    target.innerHTML = '<p class="field-note">Renormalize divides each weight by the current total so the weights sum to 1. Preview first. Apply is an ordinary undoable edit. Mixing weights are not voting rights.</p><button class="text-button" type="button" data-action="preview-renorm">Preview renormalize weights</button>';
    return;
  }
  if (weightPreview.status !== "ok") {
    target.innerHTML = `<p class="field-note">${escapeHtml(weightPreview.errors[0])}</p><button class="text-button" type="button" data-action="preview-renorm">Preview renormalize weights</button>`;
    return;
  }
  target.innerHTML = `<p class="field-note">Current total ${weightPreview.total}. After apply, weights sum to 1. Mixing weights are not voting rights.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Current weight</th><th scope="col">Weight after apply</th></tr></thead><tbody>${weightPreview.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.name)}</th><td>${row.current}</td><td>${row.next}</td></tr>`).join("")}</tbody></table></div><div class="scenario-actions"><button class="button button-brick" type="button" data-action="apply-renorm">Apply renormalized weights</button> <button class="text-button" type="button" data-action="dismiss-renorm">Dismiss preview</button></div>`;
}

function clauseMatchesFilter(clause, query) {
  if (query === "") return true;
  if (clause.title.toLowerCase().includes(query)) return true;
  return clause.options.some((option) => option.label.toLowerCase().includes(query));
}

function renderClauses() {
  const { groups } = state.proposal;
  const query = clauseFilter.trim().toLowerCase();
  const checkbox = $("#locked-clauses-only");
  if (checkbox) checkbox.checked = lockedClausesOnly;
  const hideUnlockedCheckbox = $("#hide-unlocked-clauses");
  if (hideUnlockedCheckbox) hideUnlockedCheckbox.checked = hideUnlockedClauses;
  const hideLockedCheckbox = $("#hide-locked-clauses");
  if (hideLockedCheckbox) hideLockedCheckbox.checked = hideLockedClauses;
  const changedCheckbox = $("#changed-clauses-only");
  if (changedCheckbox) changedCheckbox.checked = changedClausesOnly;
  const overBudgetCheckbox = $("#over-budget-clauses-only");
  if (overBudgetCheckbox) overBudgetCheckbox.checked = overBudgetClausesOnly;
  const noCheaperCheckbox = $("#no-cheaper-remaining-clauses-only");
  if (noCheaperCheckbox) noCheaperCheckbox.checked = noCheaperRemainingClausesOnly;
  const changed = changedClauseIds(state.proposal, currentResult());
  const changedIds = new Set(changed.status === "ok" ? changed.clauseIds : []);
  const overBudget = overBudgetClauseIds(state.proposal, currentResult());
  const overBudgetIds = new Set(overBudget.status === "ok" ? overBudget.clauseIds : []);
  const noCheaper = clausesWithoutCheaperRemainingOption(state.proposal, currentResult());
  const noCheaperIds = new Set(noCheaper.status === "ok" ? noCheaper.clauseIds : []);
  const recommendedIds = new Set((currentResult().agreement?.options ?? []).map((option) => option.id));
  const visible = state.proposal.clauses.filter((clause) => {
    if (lockedClausesOnly && clause.lockedOptionId === undefined) return false;
    if (hideUnlockedClauses && clause.lockedOptionId === undefined) return false;
    if (hideLockedClauses && clause.lockedOptionId !== undefined) return false;
    if (changedClausesOnly && !changedIds.has(clause.id)) return false;
    if (overBudgetClausesOnly && !overBudgetIds.has(clause.id)) return false;
    if (noCheaperRemainingClausesOnly && !noCheaperIds.has(clause.id)) return false;
    return clauseMatchesFilter(clause, query);
  });
  const status = $("#clause-filter-status");
  const clauseFiltersIdle = query === "" && !lockedClausesOnly && !hideUnlockedClauses && !hideLockedClauses && !changedClausesOnly && !overBudgetClausesOnly && !noCheaperRemainingClausesOnly;
  if (!visible.length) {
    const message = noCheaperRemainingClausesOnly && query === "" && !lockedClausesOnly && !changedClausesOnly && !overBudgetClausesOnly
      ? "No clauses lack a remaining cheaper option than the recommendation. Hidden cards still count in the model."
      : overBudgetClausesOnly && query === "" && !lockedClausesOnly && !changedClausesOnly
      ? "No clauses have a cheapest remaining change that exceeds the remaining budget. Hidden cards still count in the model."
      : changedClausesOnly && query === "" && !lockedClausesOnly
      ? "No clauses differ between the original and recommended packages. Hidden cards still count in the model."
      : hideUnlockedClauses && query === ""
        ? "No clauses remain after hiding unlocked clauses. Hidden cards still count in the model."
      : hideLockedClauses && query === ""
        ? "No clauses remain after hiding locked clauses. Hidden cards still count in the model."
      : lockedClausesOnly && query === ""
        ? "No locked clauses match this filter. Clear it to see every clause. Hidden cards still count in the model."
        : "No clauses match this filter. Clear the search to see every clause. Hidden cards still count in the model.";
    if (status) status.textContent = message;
    $("#clauses-editor").innerHTML = `<p class="empty-state">${message}</p>`;
    return;
  }
  if (status) status.textContent = clauseFiltersIdle ? "" : `Showing ${visible.length} of ${state.proposal.clauses.length} clauses. Hidden cards still count in the model.`;
  $("#clauses-editor").innerHTML = visible.map((clause, clauseIndex) => `
    <article class="clause-card" data-clause-id="${escapeHtml(clause.id)}" aria-label="${escapeHtml(clause.title)}">
      <div class="clause-top">
        <label><span class="visually-hidden">Clause title</span><input class="clause-title-input" data-field="clause-title" data-clause-id="${escapeHtml(clause.id)}" value="${escapeHtml(clause.title)}" maxlength="120" aria-label="Clause ${clauseIndex + 1} title"></label>
        <div class="clause-tools">
          <button class="text-button" type="button" data-action="move-clause" data-direction="up" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses[0].id === clause.id ? "disabled" : ""}>Move up</button>
          <button class="text-button" type="button" data-action="move-clause" data-direction="down" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.at(-1).id === clause.id ? "disabled" : ""}>Move down</button>
          <button class="text-button" type="button" data-action="duplicate-clause" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.length >= MAX_CLAUSES ? "disabled" : ""}>Duplicate clause</button>
          <button class="text-button danger" type="button" data-action="remove-clause" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.length <= 1 ? "disabled" : ""}>Remove clause</button>
        </div>
      </div>
      <p class="clause-annotation">Cost is an explicit human estimate of disruption, scope expansion, or process burden. It is not a measure of merit.</p>
      <label class="clause-lock">Lock clause to an option
        <select data-field="clause-lock" data-clause-id="${escapeHtml(clause.id)}" aria-label="${escapeHtml(clause.title)} locked option">
          <option value="">No lock, search all options</option>
          ${clause.options.map((option) => `<option value="${escapeHtml(option.id)}" ${clause.lockedOptionId === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
      <label class="clause-note">Facilitator note (optional)
        <input data-field="clause-note" data-clause-id="${escapeHtml(clause.id)}" type="text" maxlength="240" value="${escapeHtml(clause.note ?? "")}" placeholder="Not used by the solver" aria-label="${escapeHtml(clause.title)} facilitator note">
      </label>
      <div class="options-table-wrap"><table class="options-table">
        <thead><tr><th scope="col">Option</th><th scope="col">Change cost</th>${groups.map((group) => `<th scope="col">${escapeHtml(group.name)}<br>support</th>`).join("")}<th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
        <tbody>${clause.options.map((option) => `
          <tr>
            <td><input class="option-label-input" data-field="option-label" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}"${recommendedIds.has(option.id) ? ` data-recommended-option="${escapeHtml(option.id)}"` : ""} value="${escapeHtml(option.label)}" maxlength="240" aria-label="${escapeHtml(clause.title)}, ${escapeHtml(option.label)} label"><br>${option.original ? '<span class="original-marker">Original option</span>' : ""}${recommendedIds.has(option.id) ? '<span class="original-marker">Recommended option</span>' : ""}</td>
            <td>${option.original ? '<span class="original-marker">0</span>' : `<input data-field="option-cost" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" type="number" min="0" max="1000000000" step="any" required value="${option.changeCost}" aria-label="${escapeHtml(option.label)} change cost">`}</td>
            ${groups.map((group) => `<td><input data-field="option-support" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="any" required value="${Number.isFinite(option.support[group.id]) ? option.support[group.id] : ""}" aria-label="${escapeHtml(option.label)}, ${escapeHtml(group.name)} support"></td>`).join("")}
            <td><div class="option-tools">${option.original ? "" : `<button class="text-button" type="button" data-action="try-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">Try this option</button>`}<button class="text-button" type="button" data-action="toggle-clause-lock" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">${clause.lockedOptionId === option.id ? "Unlock option" : "Lock this option"}</button><button class="text-button" type="button" data-action="duplicate-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" ${clause.options.length >= MAX_OPTIONS_PER_CLAUSE ? "disabled" : ""}>Duplicate option</button>${option.original ? "" : `<button class="text-button danger" type="button" data-action="remove-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" ${clause.options.length <= 3 || clause.lockedOptionId === option.id ? "disabled" : ""}>Remove</button>`}${clause.lockedOptionId === option.id ? '<span class="original-marker">Locked</span>' : ""}</div></td>
          </tr>`).join("")}</tbody>
      </table></div>
      <button class="text-button add-alternative" type="button" data-action="add-option" data-clause-id="${escapeHtml(clause.id)}" ${clause.options.length >= MAX_OPTIONS_PER_CLAUSE ? "disabled" : ""}>Add alternative</button>
    </article>`).join("");
}

function renderBallot(vetoBlocks = blockingVetoIds(currentResult())) {
  const proposal = state.proposal;
  const result = currentResult();
  const recommendedIds = new Set((result.agreement?.options ?? []).map((option) => option.id));
  const blocking = proposal.groups.filter((group) => vetoBlocks.has(group.id));
  const vetoNote = blocking.length
    ? `<p class="veto-blocking-note">Veto not met on the inspected package for: ${blocking.map((group) => escapeHtml(groupDisplayName(group))).join(", ")}. This is a numerical constraint, not a legal right.</p>`
    : "";
  const recommendedNote = recommendedIds.size
    ? "<p>Recommended package option labels are marked on each clause. This is a decision aid, not a recorded vote.</p>"
    : "<p>No recommended package is available to mark. This is a decision aid, not a recorded vote.</p>";
  const remaining = formatRemainingChangeBudgetMarkdown(proposal, result);
  const remainingLine = remaining.status === "ok" || remaining.status === "unavailable"
    ? `<p>${escapeHtml(remaining.text.trim())}</p>`
    : "";
  const threshold = formatApprovalThresholdMarkdown(proposal);
  const thresholdLine = threshold.status === "ok"
    ? `<p>${escapeHtml(threshold.text.trim())}</p>`
    : "";
  const lockCount = formatCurrentLockCountMarkdown(proposal);
  const lockCountLine = lockCount.status === "ok"
    ? `<p>${escapeHtml(lockCount.text.trim())}</p>`
    : "";
  const groupList = proposal.groups.map((group) => escapeHtml(groupDisplayName(group))).join(", ");
  $("#ballot-body").innerHTML = `<p><strong>${escapeHtml(proposal.title || "Untitled proposal")}</strong>. Threshold ${Number.isFinite(proposal.threshold) ? `${proposal.threshold}%` : "invalid"}.</p><p>Participant groups: ${groupList}.</p>${recommendedNote}${remainingLine}${thresholdLine}${lockCountLine}${vetoNote}${proposal.clauses.map((clause) => {
    const recommended = clause.options.find((option) => recommendedIds.has(option.id));
    const recommendedLine = recommended ? `<p>Recommended: ${escapeHtml(recommended.label)}</p>` : "";
    return `<section class="ballot-clause"><h3>${escapeHtml(clause.title)}</h3>${clause.note ? `<p>Facilitator note: ${escapeHtml(clause.note)}</p>` : ""}${recommendedLine}<ul>${clause.options.map((option) => `<li><span class="ballot-box" aria-hidden="true"></span>${escapeHtml(option.label)}${option.original ? " (original)" : ""}${recommendedIds.has(option.id) ? " (recommended)" : ""}${option.changeCost ? ` · cost ${option.changeCost}` : ""}</li>`).join("")}</ul></section>`;
  }).join("")}`;
}

function renderResults(result, vetoBlocks = blockingVetoIds(result)) {
  const { proposal } = state;
  renderAlternatives(result);
  renderManualPackage(result);
  renderStressTest(result);
  renderScenarioComparison(result);
  const alert = $("#result-alert");
  const meta = $("#search-meta");
  $("#export-button").disabled = result.status === "invalid";
  $("#export-workspace-button").disabled = result.status === "invalid";
  $("#csv-button").disabled = result.status === "invalid";
  $("#matrix-export-button").disabled = result.status === "invalid";
  $("#groups-export-button").disabled = result.status === "invalid";
  $("#clauses-export-button").disabled = result.status === "invalid";
  $("#worksheet-button").disabled = result.status === "invalid";
  $("#worksheet-csv-button").disabled = result.status === "invalid";
  $("#copy-package-button").disabled = result.status === "invalid";
  $("#copy-option-count-button").disabled = result.status === "invalid";
  $("#copy-original-versus-recommended-button").disabled = result.status === "invalid";
  $("#copy-group-support-button").disabled = result.status === "invalid" || result.status === "too_large";
  $("#copy-remaining-budget-button").disabled = result.status === "invalid";
  $("#copy-approval-threshold-button").disabled = result.status === "invalid";
  $("#copy-packages-table-button").disabled = result.status === "invalid";
  $("#copy-locks-button").disabled = result.status === "invalid";
  $("#copy-lock-count-button").disabled = result.status === "invalid";
  $("#copy-change-cost-button").disabled = result.status === "invalid" || !result.agreement;
  $("#copy-veto-button").disabled = result.status === "invalid" || result.status === "too_large";
  $("#share-button").disabled = result.status === "invalid";
  $("#constraint-checks").textContent = "Constraints have not been evaluated.";
  if (result.status === "too_large") {
    alert.textContent = `Search paused: more than ${MAX_COMBINATIONS.toLocaleString()} combinations. Reduce alternatives or clauses to evaluate every combination.`;
    meta.textContent = `More than ${MAX_COMBINATIONS.toLocaleString()} combinations`;
    $("#result-summary").innerHTML = emptyResults();
    $("#changed-clauses").innerHTML = '<p class="empty-state">No recommendation was evaluated.</p>';
    $("#support-shifts").innerHTML = "";
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near misses are unavailable when the full search is over the safety bound.</p>';
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution is unavailable when the full search is over the safety bound.</p>';
    $("#lock-preview").innerHTML = '<p class="empty-state">Option previews are unavailable when the full search is over the safety bound.</p>';
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out is unavailable when the full search is over the safety bound.</p>';
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution is unavailable when the full search is over the safety bound.</p>';
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison is unavailable when the full search is over the safety bound.</p>';
    drawCoalition(null, null);
    $("#coalition-table").innerHTML = '<p class="empty-state">No coalition values were evaluated.</p>';
    return;
  }
  if (result.status === "invalid") {
    alert.textContent = `Fix the proposal before searching: ${result.errors[0]}`;
    meta.textContent = "Waiting for valid inputs";
    $("#result-summary").innerHTML = emptyResults();
    $("#changed-clauses").innerHTML = '<p class="empty-state">No recommendation was evaluated.</p>';
    $("#support-shifts").innerHTML = "";
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near misses are unavailable for invalid inputs.</p>';
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution is unavailable for invalid inputs.</p>';
    $("#lock-preview").innerHTML = '<p class="empty-state">Option previews are unavailable for invalid inputs.</p>';
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out is unavailable for invalid inputs.</p>';
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution is unavailable for invalid inputs.</p>';
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison is unavailable for invalid inputs.</p>';
    drawCoalition(null, null);
    $("#coalition-table").innerHTML = '<p class="empty-state">No coalition values were evaluated.</p>';
    return;
  }
  meta.textContent = `${result.checkedCombinations.toLocaleString()} checked, ${result.possibleCombinations.toLocaleString()} lock-permitted combinations`;
  const agreement = result.agreement;
  const current = result.baseline;
  if (result.status === "already_passing") alert.textContent = "The original proposal crosses the threshold and meets every constraint. No clause change is recommended.";
  else if (result.status === "infeasible") alert.textContent = "No permitted combination meets both the threshold and every configured constraint. Review the constraint checks and near misses.";
  else alert.textContent = "A lowest-cost passing combination was found. It meets every configured constraint.";

  const closestMiss = result.nearMisses[0];
  const closestGap = closestMiss ? proposal.threshold - closestMiss.approval : null;
  const leftover = proposal.maxChangeCost === undefined || !agreement ? null : proposal.maxChangeCost - agreement.changeCost;
  const leftoverLabel = leftover === null
    ? (proposal.maxChangeCost === undefined ? "No budget" : "No recommendation")
    : leftover.toFixed(1);
  const leftoverClass = leftover === null ? "" : leftover + 1e-9 >= 0 ? "positive" : "negative";
  const leftoverMetric = `<div class="metric" id="budget-remaining" tabindex="-1"><span class="metric-label">Budget remaining</span><strong class="${leftoverClass}">${leftoverLabel}</strong></div>`;
  $("#result-summary").innerHTML = agreement ? `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Recommended approval</span><strong>${formatPercent(agreement.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Threshold margin</span><strong class="positive">${formatMargin(agreement.approval - proposal.threshold)}</strong></div>
    <div class="metric cost"><span class="metric-label">Total change cost</span><strong>${agreement.changeCost.toFixed(1)}</strong></div>
    ${leftoverMetric}` : `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric cost"><span class="metric-label">Threshold</span><strong>${proposal.threshold}%</strong></div>
    <div class="metric cost"><span class="metric-label">Closest gap</span><strong>${closestGap === null ? "Not found" : closestGap.toFixed(1) + " points"}</strong></div>
    <div class="metric cost"><span class="metric-label">Best result</span><strong>Not found</strong></div>
    ${leftoverMetric}`;
  renderChanges(agreement, current);
  renderConstraints(result, vetoBlocks);
  renderNearMissExplorer(result);
  renderClauseContribution(result);
  renderLockPreview();
  renderLeaveOneOut(result);
  renderGroupContribution(result);
  renderSideBySide(result);
  drawCoalition(current, agreement);
  renderCoalitionTable(current, agreement, vetoBlocks);
}

function renderScenarioComparison(result) {
  const selected = $("#comparison-select").value;
  const row = selected === "" ? null : scenarios[Number(selected)];
  if (!row || result.status === "invalid") {
    $("#scenario-comparison").textContent = result.status === "invalid" ? "Fix the draft before comparing snapshots." : "Save a snapshot, then select it here to compare with the working draft.";
    return;
  }
  if (!savedResults.has(row.proposal)) savedResults.set(row.proposal, findSmallestAgreement(row.proposal));
  const previous = savedResults.get(row.proposal);
  const changes = compareScenarioInputs(row.proposal, state.proposal);
  const metric = (label, get) => '<tr><th scope="row">' + label + '</th><td>' + get(row.proposal, previous) + '</td><td>' + get(state.proposal, result) + '</td></tr>';
  const value = (input) => input === undefined ? 'Not set / absent' : escapeHtml(input);
  $("#scenario-comparison").innerHTML = '<p>Comparing <strong>' + escapeHtml(row.name) + '</strong> with the working draft. Changes to groups, weights, or clauses change what approval measures; review the assumptions before interpreting differences.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Metric</th><th scope="col">Saved snapshot</th><th scope="col">Working draft</th></tr></thead><tbody>' +
    metric('Search status', (_, evaluated) => escapeHtml(evaluated.status.replaceAll('_', ' '))) +
    metric('Threshold', (proposal) => formatPercent(proposal.threshold)) +
    metric('Recommended approval', (_, evaluated) => evaluated.agreement ? formatPercent(evaluated.agreement.approval) : 'No recommendation') +
    metric('Change cost', (_, evaluated) => evaluated.agreement ? evaluated.agreement.changeCost.toFixed(1) : 'No recommendation') +
    metric('Changed clauses', (_, evaluated) => evaluated.agreement ? evaluated.agreement.changedClauseCount : 'No recommendation') +
    '</tbody></table></div><details><summary>' + changes.length + ' changed input fields</summary>' + (changes.length ? '<ul>' + changes.slice(0, 100).map((change) => '<li><strong>' + escapeHtml(change.field) + '</strong>: ' + value(change.before) + ' → ' + value(change.after) + '</li>').join('') + '</ul>' + (changes.length > 100 ? '<p>Showing the first 100 changes. Export each scenario as JSON for the complete inputs.</p>' : '') : '<p>The saved and working assumptions match.</p>') + '</details>';
}
let compareLeftText = "";
let compareRightText = "";

function listItems(items) {
  return items.length ? `<ul>${items.join("")}</ul>` : "<p>None.</p>";
}

function renderFileComparison(result) {
  const target = $("#file-comparison");
  if (!target) return;
  if (!result) {
    target.innerHTML = '<p class="empty-state">Choose two workshop JSON files to compare groups and clauses by identifier.</p>';
    return;
  }
  if (result.status !== "ok") {
    const first = result.errors[0];
    target.innerHTML = `<p>Compare failed (${escapeHtml(first.code)}): ${escapeHtml(first.message)}</p>`;
    return;
  }
  const groupItems = [
    ...result.groups.onlyLeft.map((row) => `<li>Group ${escapeHtml(row.id)} (${escapeHtml(row.name)}) is only in the first file.</li>`),
    ...result.groups.onlyRight.map((row) => `<li>Group ${escapeHtml(row.id)} (${escapeHtml(row.name)}) is only in the second file.</li>`),
    ...result.groups.fieldChanges.map((row) => `<li>Group ${escapeHtml(row.id)} ${escapeHtml(row.field)}: ${escapeHtml(row.left)} vs ${escapeHtml(row.right)}.</li>`),
  ];
  const clauseItems = [
    ...result.clauses.onlyLeft.map((row) => `<li>Clause ${escapeHtml(row.id)} (${escapeHtml(row.title)}) is only in the first file.</li>`),
    ...result.clauses.onlyRight.map((row) => `<li>Clause ${escapeHtml(row.id)} (${escapeHtml(row.title)}) is only in the second file.</li>`),
    ...result.clauses.fieldChanges.map((row) => {
      const option = row.optionId ? ` option ${escapeHtml(row.optionId)}` : "";
      const group = row.groupId ? ` group ${escapeHtml(row.groupId)}` : "";
      const left = row.left === undefined ? "absent" : String(row.left);
      const right = row.right === undefined ? "absent" : String(row.right);
      return `<li>Clause ${escapeHtml(row.id)}${option}${group} ${escapeHtml(row.field)}: ${escapeHtml(left)} vs ${escapeHtml(right)}.</li>`;
    }),
  ];
  const aligned = result.aligned
    ? "Both files declare the same group and clause identifiers, so field differences can be read directly."
    : "The files do not share the same group and clause identifiers. Missing ids are listed rather than filled with zeros.";
  const order = result.clauseOrderChanged ? " Clause order differs, which can change the model's tie breaker." : "";
  target.innerHTML = `<p>Comparing <strong>${escapeHtml(result.leftTitle)}</strong> with <strong>${escapeHtml(result.rightTitle)}</strong>. ${aligned}${order}</p><h4>Groups</h4>${listItems(groupItems)}<h4>Clauses</h4>${listItems(clauseItems)}`;
}

async function readCompareFile(file, label) {
  if (!file) return { text: "", error: `Choose the ${label} workshop JSON file.` };
  if (file.size > 250_000) return { text: "", error: `${label} file must be 250 KB or smaller.` };
  try {
    return { text: await file.text() };
  } catch {
    return { text: "", error: `The ${label} file could not be read.` };
  }
}

$("#compare-files-button").addEventListener("click", async () => {
  const leftFile = $("#compare-file-left")?.files?.[0];
  const rightFile = $("#compare-file-right")?.files?.[0];
  const left = compareLeftText || (await readCompareFile(leftFile, "first"));
  const right = compareRightText || (await readCompareFile(rightFile, "second"));
  if (left.error) return notifyDraft(left.error);
  if (right.error) return notifyDraft(right.error);
  const compared = compareWorkshopFiles(left.text ?? left, right.text ?? right);
  renderFileComparison(compared);
  if (compared.status !== "ok") notifyDraft(`Compare failed (${compared.errors[0].code}): ${compared.errors[0].message}`);
  else notifyDraft("Compared the two workshop JSON files. Missing group and clause ids are listed rather than filled with zeros.");
});
$("#compare-file-left").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    compareLeftText = "";
    return;
  }
  const read = await readCompareFile(file, "first");
  if (read.error) {
    compareLeftText = "";
    return notifyDraft(read.error);
  }
  compareLeftText = read.text;
});
$("#compare-file-right").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    compareRightText = "";
    return;
  }
  const read = await readCompareFile(file, "second");
  if (read.error) {
    compareRightText = "";
    return notifyDraft(read.error);
  }
  compareRightText = read.text;
});
$("#comparison-select").addEventListener("change", () => renderScenarioComparison(currentResult()));

function renderStressTest(result) {
  const input = $("#support-drop");
  const slider = $("#support-drop-range");
  const drop = input.value === "" ? NaN : Number(input.value);
  if (Number.isFinite(drop)) {
    slider.value = Math.min(100, Math.max(0, drop));
    $("#support-drop-output").textContent = `${drop} points`;
  } else {
    $("#support-drop-output").textContent = "Invalid drop";
  }
  if (!result.agreement) {
    $("#stress-result").textContent = "A passing recommendation is needed before testing its resilience.";
    return;
  }
  const stressed = stressPackage(state.proposal, result.agreement.options.map((option) => option.id), drop);
  if (stressed.status === "invalid") {
    $("#stress-result").textContent = stressed.errors[0];
    return;
  }
  const summary = stressed.summary;
  const original = stressed.original;
  $("#stress-result").innerHTML = `<div class="result-summary"><div class="metric"><span class="metric-label">Entered approval</span><strong>${formatPercent(original.approval)}</strong></div><div class="metric"><span class="metric-label">Downside approval</span><strong>${formatPercent(summary.approval)}</strong></div><div class="metric"><span class="metric-label">Downside margin</span><strong class="${summary.approval + 1e-9 >= state.proposal.threshold ? "positive" : "negative"}">${formatMargin(summary.approval - state.proposal.threshold)}</strong></div><div class="metric cost"><span class="metric-label">Drop applied</span><strong>${drop} points</strong></div></div><p><strong>${stressed.status === "passing" ? "The same recommendation still passes this downside scenario." : "The recommendation fails this downside scenario."}</strong> Every score was reduced by ${drop} points and stopped at zero. This is not a probability of consent.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Entered support</th><th scope="col">Downside support</th><th scope="col">Floor</th></tr></thead><tbody>${summary.byGroup.map((group, index) => {
    const floor = summary.constraints.floors.find((row) => row.id === group.id);
    return `<tr><th scope="row">${escapeHtml(groupDisplayName(group))}</th><td>${formatPercent(original.byGroup[index].approval)}</td><td>${formatPercent(group.approval)}</td><td>${floor ? `${floor.minimum}%: ${floor.met ? "met" : "not met"}` : "None"}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
$("#support-drop").addEventListener("input", () => renderStressTest(currentResult()));
$("#support-drop-range").addEventListener("input", (event) => {
  $("#support-drop").value = event.target.value;
  renderStressTest(currentResult());
});

function renderManualPackage(result) {
  const valid = result.status !== "invalid";
  $("#use-recommendation").disabled = !result.agreement;
  if (!valid) {
    $("#manual-options").innerHTML = "";
    $("#manual-result").textContent = "Fix the draft before comparing a custom package.";
    return;
  }
  for (const clause of state.proposal.clauses) {
    if (!clause.options.some((option) => option.id === manualSelection[clause.id])) manualSelection[clause.id] = clause.options.find((option) => option.original).id;
  }
  $("#manual-options").innerHTML = state.proposal.clauses.map((clause) => '<label>' + escapeHtml(clause.title) + '<select data-field="manual-option" data-clause-id="' + escapeHtml(clause.id) + '">' + clause.options.map((option) => '<option value="' + escapeHtml(option.id) + '" ' + (manualSelection[clause.id] === option.id ? 'selected' : '') + '>' + escapeHtml(option.label) + '</option>').join('') + '</select></label>').join('');
  const evaluated = evaluatePackage(state.proposal, state.proposal.clauses.map((clause) => manualSelection[clause.id]));
  const summary = evaluated.summary;
  const failures = [];
  if (summary.approval + 1e-9 < state.proposal.threshold) failures.push('Below the overall threshold');
  if (summary.constraints.budget && !summary.constraints.budget.met) failures.push('Over the cost budget');
  for (const floor of summary.constraints.floors) if (!floor.met) failures.push(escapeHtml(groupDisplayName(floor)) + ' below its support floor');
  for (const veto of summary.constraints.vetoes ?? []) if (!veto.met) failures.push(escapeHtml(groupDisplayName(veto)) + ' below its veto threshold');
  for (const lock of summary.constraints.locks) if (!lock.met) failures.push(escapeHtml(lock.clauseTitle) + ' does not use its locked option');
  $("#manual-result").innerHTML = '<p><strong>' + (evaluated.status === 'passing' ? 'Passes all configured requirements.' : 'Does not pass: ' + failures.join('; ') + '.') + '</strong></p><p>Approval ' + formatPercent(summary.approval) + '. Change cost ' + summary.changeCost.toFixed(1) + '. ' + summary.changedClauseCount + ' changed clauses.' + (result.agreement ? ' Cost difference from the recommendation: ' + (summary.changeCost - result.agreement.changeCost).toFixed(1) + '.' : '') + '</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Custom support</th><th scope="col">Change from original</th></tr></thead><tbody>' + summary.groupDeltas.map((group) => '<tr><th scope="row">' + escapeHtml(groupDisplayName(group)) + '</th><td>' + formatPercent(group.after) + '</td><td>' + formatMargin(group.delta) + '</td></tr>').join('') + '</tbody></table></div>';
}

$("#use-recommendation").addEventListener("click", () => {
  const result = currentResult();
  if (!result.agreement) return;
  manualSelection = Object.fromEntries(state.proposal.clauses.map((clause, index) => [clause.id, result.agreement.options[index].id]));
  renderManualPackage(result);
  renderSideBySide(result);
});

function renderAlternatives(result) {
  const candidates = result.alternatives ?? [];
  if (!candidates.length) {
    $("#passing-alternatives").innerHTML = '<p class="empty-state">No passing packages available to compare. Review the inputs and constraints.</p>';
    return;
  }
  const rows = candidates.map((candidate, index) => {
    const packageLines = candidate.options.map((option, i) => {
      const clause = state.proposal.clauses[i];
      return `${escapeHtml(clause.title)}: ${escapeHtml(option.label)} <button class="text-button" type="button" data-action="try-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">Try this option</button>`;
    }).join("<br>");
    return `<tr><th scope="row">${index + 1}. ${packageLines}</th><td>${candidate.changeCost.toFixed(1)}</td><td>${formatPercent(candidate.approval)}</td><td>${formatPercent(Math.min(...candidate.byGroup.map((group) => group.approval)))}</td><td>${candidate.supportersLost.map((group) => escapeHtml(groupDisplayName(group))).join(", ") || "None"}</td></tr>`;
  }).join("");
  $("#passing-alternatives").innerHTML = `<p>${result.passingCombinations} passing combinations. Showing the first ${candidates.length} by lowest cost, fewest changes, higher approval, then option IDs. These are ranked choices, not a fairness ranking. Try this option locks one choice and re-solves the rest.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Rank and package</th><th scope="col">Cost</th><th scope="col">Approval</th><th scope="col">Lowest group support</th><th scope="col">Groups losing support</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderLockPreview() {
  const target = $("#lock-preview");
  if (!lockPreview) {
    target.innerHTML = '<p class="empty-state">Choose Try this option on an alternative to preview a lock. The draft does not change until you apply it.</p>';
    return;
  }
  if (lockPreview.status !== "preview") {
    target.innerHTML = `<p>Preview failed: ${escapeHtml(lockPreview.errors?.[0] ?? "the option could not be locked.")}</p>`;
    return;
  }
  const previewResult = lockPreview.result;
  const agreement = previewResult.agreement;
  const packageText = agreement
    ? agreement.options.map((option, index) => `${escapeHtml(lockPreview.proposal.clauses[index].title)}: ${escapeHtml(option.label)}`).join("; ")
    : "No passing package was found with this lock.";
  const statusText = previewResult.status === "found" || previewResult.status === "already_passing"
    ? `Preview status: ${previewResult.status.replaceAll("_", " ")}. Approval ${formatPercent(agreement.approval)}. Cost ${agreement.changeCost.toFixed(1)}.`
    : `Preview status: ${previewResult.status.replaceAll("_", " ")}.`;
  target.innerHTML = `<p>Lock <strong>${escapeHtml(lockPreview.clauseTitle)}</strong> to <strong>${escapeHtml(lockPreview.optionLabel)}</strong> and keep every other current lock.</p><p>${statusText}</p><p>${packageText}</p><p>This is a preview of the solver under that lock. It is not a decision.</p><div class="scenario-actions"><button class="button button-brick" type="button" data-action="apply-lock-preview">Apply lock</button> <button class="button button-secondary" type="button" data-action="dismiss-lock-preview">Dismiss preview</button></div>`;
}

function renderLeaveOneOut(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out needs a valid package to inspect.</p>';
    return;
  }
  const table = leaveOneGroupOut(state.proposal, packageOptions);
  if (table.status !== "ok") {
    $("#leave-one-out").innerHTML = `<p class="empty-state">${escapeHtml(table.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#leave-one-out").innerHTML = `<p>Inspecting the ${source}. Full weighted approval ${formatPercent(table.fullApproval)}.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Omitted group</th><th scope="col">Weight</th><th scope="col">Approval without the group</th><th scope="col">Change from full approval</th></tr></thead><tbody>${table.rows.map((row) => `<tr><th scope="row">${escapeHtml(groupDisplayName(row))}</th><td>${row.weight}</td><td>${row.approval == null ? "Not defined with one group" : formatPercent(row.approval)}</td><td class="${row.delta > 0.0001 ? "positive" : row.delta < -0.0001 ? "negative" : ""}">${row.delta == null ? "Not defined" : formatMargin(row.delta)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderGroupContribution(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution needs a valid package to inspect.</p>';
    return;
  }
  const analysis = groupContributions(state.proposal, packageOptions);
  if (analysis.status !== "ok") {
    $("#group-contribution").innerHTML = `<p class="empty-state">${escapeHtml(analysis.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#group-contribution").innerHTML = `<p>Inspecting the ${source}. Overall approval ${formatPercent(analysis.overallApproval)}. Original ${formatPercent(analysis.originalApproval)}. Method: weight share times group average. Pulls sum to the change in overall approval.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight share</th><th scope="col">Selected support</th><th scope="col">Original support</th><th scope="col">Contribution</th><th scope="col">Pull on overall approval</th></tr></thead><tbody>${analysis.rows.map((row) => `<tr><th scope="row">${escapeHtml(groupDisplayName(row))}</th><td>${(row.share * 100).toFixed(1)}%</td><td>${formatPercent(row.selectedApproval)}</td><td>${formatPercent(row.originalApproval)}</td><td>${formatPercent(row.contribution)}</td><td class="${row.overallPull > 0.0001 ? "positive" : row.overallPull < -0.0001 ? "negative" : ""}">${formatMargin(row.overallPull)}</td></tr>`).join("")}</tbody></table></div>`;
}

function customOptionIds() {
  return state.proposal.clauses.map((clause) => {
    if (clause.options.some((option) => option.id === manualSelection[clause.id])) return manualSelection[clause.id];
    return clause.options.find((option) => option.original)?.id;
  });
}

function choiceCell(choice, note = "") {
  if (!choice) return "Not set";
  return `${escapeHtml(choice.label)}<br><small>Cost ${choice.changeCost.toFixed(1)}${note}</small>`;
}

function renderSideBySide(result) {
  const current = result.baseline;
  if (!current) {
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison needs a valid original package.</p>';
    return;
  }
  const recommendedIds = result.agreement ? result.agreement.options.map((option) => option.id) : null;
  const comparison = comparePinnedPackages(state.proposal, recommendedIds, customOptionIds());
  if (comparison.status !== "ok") {
    $("#side-by-side").innerHTML = `<p class="empty-state">${escapeHtml(comparison.errors[0])}</p>`;
    return;
  }
  const clauseRows = comparison.clauses.map((row) => {
    const changed = row.recommended && row.recommended.optionId !== row.original.optionId;
    const customNote = row.custom && row.custom.optionId !== row.original.optionId ? " (custom)" : "";
    const note = state.proposal.clauses.find((clause) => clause.id === row.clauseId)?.note;
    const title = `${escapeHtml(row.clauseTitle)}${note ? `<br><small>Facilitator note: ${escapeHtml(note)}</small>` : ""}`;
    return `<tr><th scope="row">${title}</th><td>${choiceCell(row.original)}</td><td>${row.recommended ? choiceCell(row.recommended, changed ? " (changed)" : "") : "No recommendation"}</td><td>${choiceCell(row.custom, customNote)}</td></tr>`;
  }).join("");
  const groupRows = comparison.groups.map((group) => `<tr><th scope="row">${escapeHtml(groupDisplayName(group))}</th><td>${formatPercent(group.original)}</td><td>${group.recommended == null ? "No recommendation" : formatPercent(group.recommended)}</td><td>${formatPercent(group.custom)}</td></tr>`).join("");
  const recommendedLock = recommendedIds ? `<p>${lockPackageButton(recommendedIds, "Lock recommended package")} Applying locks is one draft edit, so undo restores the previous locks. Locked search still reports a deliberation aid, not a decision.</p>` : "";
  $("#side-by-side").innerHTML = `<p>Original overall approval ${formatPercent(comparison.originalApproval)}. Recommended ${comparison.recommendedApproval == null ? "not found" : formatPercent(comparison.recommendedApproval)}. Custom ${formatPercent(comparison.customApproval)}. Original cost ${comparison.originalCost.toFixed(1)}. Recommended cost ${comparison.recommendedCost == null ? "not found" : comparison.recommendedCost.toFixed(1)}. Custom cost ${comparison.customCost.toFixed(1)}.</p>${recommendedLock}<div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Clause</th><th scope="col">Current original</th><th scope="col">Solver recommendation</th><th scope="col">Custom package</th></tr></thead><tbody>${clauseRows}</tbody></table></div><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Current approval</th><th scope="col">Recommended approval</th><th scope="col">Custom approval</th></tr></thead><tbody>${groupRows}</tbody></table></div>`;
  const table = formatPinnedPackagesMarkdown(state.proposal, recommendedIds, customOptionIds());
  const fallback = $("#package-table-fallback");
  if (fallback) fallback.value = table.status === "ok" ? table.text : "";
}

function renderConstraints(result, vetoBlocks = new Set()) {
  const checks = result.agreement?.constraints ?? result.baseline.constraints;
  const rows = [];
  const mark = (met) => met ? "Met" : "Not met";
  if (checks.budget) rows.push(`<tr><th scope="row">Total change cost</th><td>At most ${checks.budget.maximum}</td><td>${checks.budget.actual}</td><td>${mark(checks.budget.met)}</td></tr>`);
  for (const floor of checks.floors) rows.push(`<tr><th scope="row">${escapeHtml(groupDisplayName(floor))} support</th><td>At least ${floor.minimum}%</td><td>${formatPercent(floor.actual)}</td><td>${mark(floor.met)}</td></tr>`);
  for (const veto of checks.vetoes ?? []) rows.push(`<tr class="${vetoBlocks.has(veto.id) ? "veto-blocking" : ""}"><th scope="row">${escapeHtml(groupDisplayName(veto))} veto</th><td>At least ${veto.required}%</td><td>${formatPercent(veto.actual)}</td><td>${mark(veto.met)}</td></tr>`);
  for (const lock of checks.locks) rows.push(`<tr><th scope="row">${escapeHtml(lock.clauseTitle)}</th><td>${escapeHtml(lock.label)}</td><td>Locked option</td><td>${mark(lock.met)}</td></tr>`);
  const inspected = result.agreement ? "Recommended combination" : "Original proposal, no recommendation found";
  const counts = result.checkedCombinations === 1 && result.status === "already_passing" ? "The original proposal meets every requirement with zero changes. No further enumeration is needed." : `${result.eligibleCombinations.toLocaleString()} combinations meet all constraints. ${result.rejected.anyConstraint.toLocaleString()} rejected: ${result.rejected.budget.toLocaleString()} over budget, ${result.rejected.floors.toLocaleString()} below a group floor, and ${result.rejected.vetoes.toLocaleString()} below a veto. These counts can overlap. Locks exclude other options before enumeration.`;
  const blockingNote = vetoBlocks.size
    ? `<p class="veto-blocking-note">Highlighted veto rows failed on the inspected package. That is a numerical constraint, not a legal right or a legitimacy claim.</p>`
    : "";
  $("#constraint-checks").innerHTML = `<p>${counts}</p>${blockingNote}${rows.length ? `<p>${inspected}</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Constraint</th><th scope="col">Required</th><th scope="col">Actual</th><th scope="col">Status</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : '<p>No group floors, vetoes, budget, or clause locks set.</p>'}`;
}

function emptyResults() {
  return '<div class="metric"><span class="metric-label">Current approval</span><strong>Not evaluated</strong></div><div class="metric"><span class="metric-label">Recommended approval</span><strong>Not evaluated</strong></div><div class="metric cost"><span class="metric-label">Total change cost</span><strong>Not evaluated</strong></div><div class="metric" id="budget-remaining" tabindex="-1"><span class="metric-label">Budget remaining</span><strong>Not evaluated</strong></div>';
}

function renderChanges(agreement, current) {
  const changes = $("#changed-clauses");
  const shifts = $("#support-shifts");
  if (!agreement) {
    changes.innerHTML = '<p class="empty-state">No passing combination was found.</p>';
    shifts.innerHTML = "";
    return;
  }
  changes.innerHTML = agreement.changes.length ? agreement.changes.map((change) => `<div class="change-item"><strong>${escapeHtml(change.clauseTitle)}</strong><span>${escapeHtml(change.from)} to ${escapeHtml(change.to)}. Cost ${change.changeCost.toFixed(1)}.</span></div>`).join("") : '<p class="empty-state">Keep every original option.</p>';
  const deltas = agreement.groupDeltas.filter((group) => Math.abs(group.delta) > 0.0001);
  shifts.innerHTML = deltas.length ? deltas.map((group) => `<div class="shift-item"><strong>${escapeHtml(groupDisplayName(group))}</strong> <span class="${group.delta > 0 ? "positive" : "negative"}">${group.delta > 0 ? "+" : ""}${group.delta.toFixed(1)} points</span><br><span>${formatPercent(group.before)} to ${formatPercent(group.after)}</span></div>`).join("") : '<p class="empty-state">No group support changes.</p>';
}

function lockPackageButton(optionIds, label) {
  if (!Array.isArray(optionIds) || !optionIds.length) return "";
  return ` <button class="text-button" type="button" data-action="lock-package" data-option-ids="${escapeHtml(optionIds.join("|"))}">${escapeHtml(label)}</button>`;
}

function packageGapRow(row, kind) {
  const gap = row.approvalGap;
  const approvalNote = row.meetsThreshold
    ? `Over the threshold by ${(-gap).toFixed(1)} points.`
    : `Short of the threshold by ${gap.toFixed(1)} points.`;
  const costNote = row.costVsRecommended == null
    ? `Cost ${row.changeCost.toFixed(1)}.`
    : row.costVsRecommended === 0
      ? `Same cost as the recommendation (${row.changeCost.toFixed(1)}).`
      : row.costVsRecommended < 0
        ? `Costs ${(-row.costVsRecommended).toFixed(1)} less than the recommendation (cost ${row.changeCost.toFixed(1)}).`
        : `Costs ${row.costVsRecommended.toFixed(1)} more than the recommendation (cost ${row.changeCost.toFixed(1)}).`;
  return `<div class="miss-item"><span class="miss-score">${formatPercent(row.approval)}</span><span>${escapeHtml(row.labels)}<br><small>${escapeHtml(kind)} ${approvalNote} ${costNote}</small>${lockPackageButton(row.optionIds, "Lock this package")}</span></div>`;
}

function orderedGapRows(rows) {
  const sorted = sortPackageGapRows(rows, nearMissSort);
  return sorted.status === "ok" ? sorted.rows : rows;
}

function renderNearMissExplorer(result) {
  const gaps = explorePackageGaps(state.proposal, result);
  if (gaps.status !== "ok") {
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near-miss comparison is unavailable for this search result.</p>';
    return;
  }
  const cheaperMisses = orderedGapRows(gaps.cheaperMisses);
  const closestMisses = orderedGapRows(gaps.closestMisses);
  const parts = [];
  if (cheaperMisses.length) {
    parts.push("<h4>Cheaper packages that miss the threshold</h4>");
    parts.push("<p>These combinations cost less than the recommended package and remain below the threshold. They are not adoptable under the current rules.</p>");
    parts.push(cheaperMisses.map((row) => packageGapRow(row, "Cheaper miss.")).join(""));
  } else {
    parts.push('<p class="empty-state">No cheaper constraint-compliant package in the near-miss list falls below the threshold.</p>');
  }
  if (closestMisses.length) {
    parts.push("<h4>Closest misses</h4>");
    parts.push("<p>Ranked by the selected sort among constraint-compliant combinations that miss the threshold. Sorting changes display order only; the solver still keeps the closest misses.</p>");
    parts.push(closestMisses.map((row) => packageGapRow(row, "Closest miss.")).join(""));
  }
  if (gaps.nextOverThreshold.length) {
    parts.push("<h4>Next packages over the threshold</h4>");
    parts.push("<p>These passing combinations come after the lowest-cost recommendation. Extra cost buys a different package, not a fairer one.</p>");
    parts.push(gaps.nextOverThreshold.map((row) => packageGapRow(row, "Next passing package.")).join(""));
  } else {
    parts.push('<p class="empty-state">No later passing package is available to compare.</p>');
  }
  $("#near-misses-list").innerHTML = parts.join("");
}

function contributionBarSvg(rows) {
  const width = 420;
  const rowHeight = 32;
  const height = Math.max(rowHeight * rows.length + 8, 40);
  const mid = 285;
  const maxAbs = Math.max(5, ...rows.map((row) => Math.abs(row.overallPull)));
  const scale = 120 / maxAbs;
  const bars = rows.map((row, index) => {
    const y = 10 + index * rowHeight;
    const pull = row.overallPull;
    const barWidth = Math.abs(pull) * scale;
    const x = pull >= 0 ? mid : mid - barWidth;
    const fill = Math.abs(pull) < 1e-9 ? "#9c907d" : pull > 0 ? "#286842" : "#a64431";
    return `<text x="8" y="${y + 12}" fill="#19352d" font-size="11">${escapeHtml(row.clauseTitle.slice(0, 24))}</text><rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(barWidth, 1).toFixed(1)}" height="14" fill="${fill}"></rect>`;
  }).join("");
  return `<svg class="contribution-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Clause contribution to overall approval versus the original options">${bars}<line x1="${mid}" y1="0" x2="${mid}" y2="${height}" stroke="#9c907d" stroke-width="1"></line></svg>`;
}

function renderClauseContribution(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution needs a valid package to inspect.</p>';
    return;
  }
  const analysis = clauseContributions(state.proposal, packageOptions);
  if (analysis.status !== "ok") {
    $("#clause-contribution").innerHTML = `<p class="empty-state">${escapeHtml(analysis.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#clause-contribution").innerHTML = `<p>Inspecting the ${source}. Overall approval ${formatPercent(analysis.overallApproval)}. Original ${formatPercent(analysis.originalApproval)}. Green bars raise overall approval versus the original options; brick bars lower it. The zero line is no change from the original wording.</p>${contributionBarSvg(analysis.rows)}<div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Clause</th><th scope="col">Selected option</th><th scope="col">Clause support</th><th scope="col">Original support</th><th scope="col">Pull on overall approval</th></tr></thead><tbody>${analysis.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.clauseTitle)}</th><td>${escapeHtml(row.optionLabel)}</td><td>${formatPercent(row.selectedSupport)}</td><td>${formatPercent(row.originalSupport)}</td><td class="${row.overallPull > 0.0001 ? "positive" : row.overallPull < -0.0001 ? "negative" : ""}">${formatMargin(row.overallPull)}</td></tr>`).join("")}</tbody></table></div>`;
}

function drawCoalition(current, agreement) {
  const canvas = $("#coalition-canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = Math.max(280, Math.floor(canvas.clientWidth));
  const rows = current?.byGroup ?? [];
  const height = Math.max(190, 24 + rows.length * 34);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffdf7";
  context.fillRect(0, 0, width, height);
  if (!current) return;

  const labelWidth = Math.min(130, width * .34);
  const barStart = labelWidth + 8;
  const barWidth = Math.max(55, width - barStart - 35);
  const rowHeight = Math.max(30, Math.min(42, (height - 16) / rows.length));
  context.font = "12px Georgia";
  context.textBaseline = "middle";
  rows.forEach((group, index) => {
    const y = 12 + index * rowHeight;
    context.fillStyle = "#19352d";
    context.fillText(groupDisplayName(group).slice(0, 18), 8, y + 10);
    context.fillStyle = "#e8dfd0";
    context.fillRect(barStart, y, barWidth, 8);
    context.fillStyle = "#3778a6";
    context.fillRect(barStart, y, barWidth * (group.approval / 100), 8);
    if (agreement) {
      const next = agreement.byGroup[index].approval;
      context.fillStyle = "#a64431";
      context.fillRect(barStart, y + 11, barWidth * (next / 100), 8);
      context.fillStyle = "#466054";
      context.fillText(`${group.approval.toFixed(0)} / ${next.toFixed(0)}`, barStart + barWidth + 5, y + 10);
    } else {
      context.fillStyle = "#466054";
      context.fillText(`${group.approval.toFixed(0)}`, barStart + barWidth + 5, y + 5);
    }
  });
}

function renderCoalitionTable(current, agreement, vetoBlocks = new Set()) {
  if (!current) return;
  $("#coalition-table").innerHTML = `<table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight</th><th scope="col">Current</th><th scope="col">Recommended</th></tr></thead><tbody>${current.byGroup.map((group, index) => `<tr class="${vetoBlocks.has(group.id) ? "veto-blocking" : ""}"><th scope="row">${escapeHtml(groupDisplayName(group))}</th><td>${group.weight}</td><td>${formatPercent(group.approval)}</td><td>${agreement ? formatPercent(agreement.byGroup[index].approval) : "Not found"}</td></tr>`).join("")}</tbody></table>`;
}

function groupById(id) { return state.proposal.groups.find((group) => group.id === id); }
function clauseById(id) { return state.proposal.clauses.find((clause) => clause.id === id); }
function optionById(clause, id) { return clause?.options.find((option) => option.id === id); }

function changeAndRender(mutator) {
  const active = document.activeElement;
  const context = active?.dataset;
  mutator();
  save();
  render();
  if (!context?.action) return;
  let selector;
  if (context.action === "add-group") selector = '[data-field="group-name"][data-group-id="' + state.proposal.groups.at(-1).id + '"]';
  if (context.action === "add-clause") selector = '[data-field="clause-title"][data-clause-id="' + state.proposal.clauses.at(-1).id + '"]';
  if (context.action === "add-option" || context.action === "duplicate-option") selector = '[data-field="option-label"][data-clause-id="' + context.clauseId + '"][data-option-id="' + clauseById(context.clauseId).options.at(-1).id + '"]';
  if (context.action === "remove-group") selector = '[data-action="add-group"]';
  if (context.action === "duplicate-group") {
    const sourceIndex = state.proposal.groups.findIndex((group) => group.id === context.groupId);
    const copy = state.proposal.groups[sourceIndex + 1];
    if (copy) selector = '[data-field="group-name"][data-group-id="' + copy.id + '"]';
  }
  if (context.action === "remove-clause") selector = '[data-action="add-clause"]';
  if (context.action === "duplicate-clause") {
    const sourceIndex = state.proposal.clauses.findIndex((clause) => clause.id === context.clauseId);
    const copy = state.proposal.clauses[sourceIndex + 1];
    if (copy) selector = '[data-field="clause-title"][data-clause-id="' + copy.id + '"]';
  }
  if (context.action === "move-clause") selector = '[data-field="clause-title"][data-clause-id="' + context.clauseId + '"]';
  if (context.action === "remove-option") selector = '[data-action="add-option"][data-clause-id="' + context.clauseId + '"]';
  if (selector) $(selector)?.focus();
}

document.addEventListener("input", (event) => {
  const target = event.target;
  const field = target.dataset.field;
  if (!field) return;
  if (field === "clause-lock" || field === "manual-option" || field === "group-veto") return;
  if (field === "group-floor") {
    const group = groupById(target.dataset.groupId);
    if (target.value === "" && !target.validity.badInput) delete group.minSupport;
    else group.minSupport = target.valueAsNumber;
  }
  if (field === "group-name") groupById(target.dataset.groupId).name = target.value;
  if (field === "group-weight") groupById(target.dataset.groupId).weight = target.valueAsNumber;
  if (field === "clause-title") clauseById(target.dataset.clauseId).title = target.value;
  if (field === "clause-note") {
    const clause = clauseById(target.dataset.clauseId);
    if (target.value === "") delete clause.note;
    else clause.note = target.value;
  }
  if (field === "option-label") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).label = target.value;
  if (field === "option-label") {
    const select = [...document.querySelectorAll('[data-field="clause-lock"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId);
    const choice = [...select.options].find((element) => element.value === target.dataset.optionId);
    choice.textContent = target.value || "Untitled option";
  }
  if (field === "option-cost") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).changeCost = target.valueAsNumber;
  if (field === "option-support") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).support[target.dataset.groupId] = target.valueAsNumber;
  target.setAttribute?.("aria-invalid", String(!target.validity.valid));
  save();
  $("#proposal-heading").textContent = state.proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderBallot();
  renderResults(currentResult());
});

$("#clause-filter").addEventListener("input", (event) => {
  clauseFilter = event.target.value;
  renderClauses();
  applyClauseDensity();
});
$("#locked-clauses-only").addEventListener("change", (event) => {
  lockedClausesOnly = event.target.checked === true;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
});
function setHideUnlockedClauses(next) {
  hideUnlockedClauses = next === true;
  const checkbox = $("#hide-unlocked-clauses");
  if (checkbox) checkbox.checked = hideUnlockedClauses;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
}
$("#hide-unlocked-clauses").addEventListener("change", (event) => {
  setHideUnlockedClauses(event.target.checked === true);
});
function setHideLockedClauses(next) {
  hideLockedClauses = next === true;
  const checkbox = $("#hide-locked-clauses");
  if (checkbox) checkbox.checked = hideLockedClauses;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
}
$("#hide-locked-clauses").addEventListener("change", (event) => {
  setHideLockedClauses(event.target.checked === true);
});
$("#changed-clauses-only").addEventListener("change", (event) => {
  changedClausesOnly = event.target.checked === true;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
});
$("#over-budget-clauses-only").addEventListener("change", (event) => {
  overBudgetClausesOnly = event.target.checked === true;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
});
$("#no-cheaper-remaining-clauses-only").addEventListener("change", (event) => {
  noCheaperRemainingClausesOnly = event.target.checked === true;
  persistWorkspacePrefs();
  renderClauses();
  applyClauseDensity();
});
$("#clause-density").addEventListener("change", (event) => {
  clauseDensity = event.target.value === "compact" ? "compact" : "comfortable";
  persistWorkspacePrefs();
  applyClauseDensity();
});
function setVetoGroupsOnly(next) {
  vetoGroupsOnly = next === true;
  const checkbox = $("#veto-groups-only");
  if (checkbox) checkbox.checked = vetoGroupsOnly;
  persistWorkspacePrefs();
  renderGroups(blockingVetoIds(currentResult()));
}

function setBelowFloorGroupsOnly(next) {
  belowFloorGroupsOnly = next === true;
  const checkbox = $("#below-floor-groups-only");
  if (checkbox) checkbox.checked = belowFloorGroupsOnly;
  persistWorkspacePrefs();
  renderGroups(blockingVetoIds(currentResult()));
}

function setHideGroupsAtFloor(next) {
  hideGroupsAtFloor = next === true;
  const checkbox = $("#hide-groups-at-floor");
  if (checkbox) checkbox.checked = hideGroupsAtFloor;
  persistWorkspacePrefs();
  renderGroups(blockingVetoIds(currentResult()));
}

function setHideGroupsWithoutFloors(next) {
  hideGroupsWithoutFloors = next === true;
  const checkbox = $("#hide-groups-without-floors");
  if (checkbox) checkbox.checked = hideGroupsWithoutFloors;
  persistWorkspacePrefs();
  renderGroups(blockingVetoIds(currentResult()));
}

$("#veto-groups-only").addEventListener("change", (event) => {
  setVetoGroupsOnly(event.target.checked === true);
});
$("#below-floor-groups-only").addEventListener("change", (event) => {
  setBelowFloorGroupsOnly(event.target.checked === true);
});
$("#hide-groups-at-floor").addEventListener("change", (event) => {
  setHideGroupsAtFloor(event.target.checked === true);
});
$("#hide-groups-without-floors").addEventListener("change", (event) => {
  setHideGroupsWithoutFloors(event.target.checked === true);
});
$("#near-miss-sort").addEventListener("change", (event) => {
  nearMissSort = event.target.value === "change_cost" ? "change_cost" : "approval_gap";
  renderNearMissExplorer(currentResult());
});

$("#proposal-title").addEventListener("input", (event) => {
  state.proposal.title = event.target.value;
  save();
  $("#proposal-heading").textContent = state.proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#threshold").addEventListener("input", (event) => {
  state.proposal.threshold = Math.min(100, Math.max(0, number(event.target.value)));
  save();
  $("#threshold-output").textContent = `${state.proposal.threshold}%`;
  $("#threshold-number").value = state.proposal.threshold;
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#threshold-number").addEventListener("input", (event) => {
  state.proposal.threshold = event.target.valueAsNumber;
  save();
  $("#threshold").value = Number.isFinite(state.proposal.threshold) ? state.proposal.threshold : 0;
  $("#threshold-output").textContent = Number.isFinite(state.proposal.threshold) ? state.proposal.threshold + '%' : 'Invalid';
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#max-change-cost").addEventListener("input", (event) => {
  const target = event.target;
  if (target.value === "" && !target.validity.badInput) delete state.proposal.maxChangeCost;
  else state.proposal.maxChangeCost = target.valueAsNumber;
  save();
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.field === "group-veto") {
    const group = groupById(target.dataset.groupId);
    if (target.checked) group.veto = true;
    else delete group.veto;
    save();
    $("#autosave-status").textContent = state.saveMessage;
    renderResults(currentResult());
    return;
  }
  if (target.dataset.field === "manual-option") {
    manualSelection[target.dataset.clauseId] = target.value;
    const result = currentResult();
    renderManualPackage(result);
    renderSideBySide(result);
    [...document.querySelectorAll('[data-field="manual-option"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId)?.focus();
    return;
  }
  if (target.dataset.field !== "clause-lock") return;
  changeAndRender(() => {
    const clause = clauseById(target.dataset.clauseId);
    if (target.value === "") delete clause.lockedOptionId;
    else clause.lockedOptionId = target.value;
  });
  const restored = [...document.querySelectorAll('[data-field="clause-lock"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId);
  restored?.focus();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === "try-option") {
    lockPreview = previewLockedOption(state.proposal, button.dataset.clauseId, button.dataset.optionId, { maxCombinations: MAX_COMBINATIONS, alternativesLimit: 5 });
    renderLockPreview();
    $("#lock-preview-heading").focus?.();
    return;
  }
  if (action === "lock-package") {
    const optionIds = typeof button.dataset.optionIds === "string" && button.dataset.optionIds
      ? button.dataset.optionIds.split("|")
      : [];
    const locked = lockPackage(state.proposal, optionIds);
    if (locked.status !== "ok") {
      notifyDraft(`Could not lock that package: ${locked.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = locked.proposal; });
    notifyDraft("Locked every clause to that package. Undo restores the previous draft.");
    return;
  }
  if (action === "clear-locks") {
    const cleared = clearAllLocks(state.proposal);
    if (cleared.status !== "ok") {
      notifyDraft(`Could not clear locks: ${cleared.errors[0]}`);
      return;
    }
    if (cleared.cleared === 0) {
      notifyDraft("No clause locks were set.");
      return;
    }
    changeAndRender(() => { state.proposal = cleared.proposal; });
    notifyDraft("Cleared every clause lock. Undo restores the previous draft.");
    return;
  }
  if (action === "toggle-clause-lock") {
    const toggled = toggleClauseLock(state.proposal, button.dataset.clauseId, button.dataset.optionId);
    if (toggled.status !== "ok") {
      notifyDraft(`Could not toggle that lock: ${toggled.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = toggled.proposal; });
    notifyDraft(toggled.locked
      ? "Locked that clause to the selected option. Undo restores the previous draft."
      : "Unlocked that clause. Undo restores the previous draft.");
    return;
  }
  if (action === "preview-renorm") {
    weightPreview = previewRenormalizedWeights(state.proposal);
    weightPreviewKey = currentWeightKey();
    renderWeightPreview();
    if (weightPreview.status !== "ok") notifyDraft(`Could not preview renormalized weights: ${weightPreview.errors[0]}`);
    return;
  }
  if (action === "dismiss-renorm") {
    weightPreview = null;
    weightPreviewKey = "";
    renderWeightPreview();
    return;
  }
  if (action === "apply-renorm") {
    const applied = applyRenormalizedWeights(state.proposal);
    if (applied.status !== "ok") {
      notifyDraft(`Could not renormalize weights: ${applied.errors[0]}`);
      weightPreview = applied;
      renderWeightPreview();
      return;
    }
    weightPreview = null;
    weightPreviewKey = "";
    changeAndRender(() => { state.proposal = applied.proposal; });
    notifyDraft("Renormalized group weights so they sum to 1. Undo restores the previous draft.");
    return;
  }
  if (action === "dismiss-lock-preview") {
    lockPreview = null;
    renderLockPreview();
    return;
  }
  if (action === "apply-lock-preview") {
    if (!lockPreview || lockPreview.status !== "preview") return;
    const clauseId = lockPreview.clauseId;
    const optionId = lockPreview.optionId;
    lockPreview = null;
    changeAndRender(() => {
      const clause = clauseById(clauseId);
      if (clause) clause.lockedOptionId = optionId;
    });
    notifyDraft("Locked " + clauseById(clauseId).title + ". Undo restores the previous draft.");
    return;
  }
  if (action === "add-group") changeAndRender(() => {
    const group = { id: makeId("group"), name: "New group", weight: 1 };
    state.proposal.groups.push(group);
    state.proposal.clauses.forEach((clause) => clause.options.forEach((option) => { option.support[group.id] = 50; }));
  });
  if (action === "remove-group") changeAndRender(() => {
    const id = button.dataset.groupId;
    state.proposal.groups = state.proposal.groups.filter((group) => group.id !== id);
    state.proposal.clauses.forEach((clause) => clause.options.forEach((option) => { delete option.support[id]; }));
  });
  if (action === "duplicate-group") changeAndRender(() => {
    const duplicated = duplicateParticipantGroup(state.proposal, button.dataset.groupId);
    if (duplicated.status === "ok") state.proposal = duplicated.proposal;
  });
  if (action === "reset-group-support") {
    const group = groupById(button.dataset.groupId);
    const reset = resetGroupSupport(state.proposal, button.dataset.groupId);
    if (reset.status !== "ok") {
      notifyDraft(`Could not reset support: ${reset.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = reset.proposal; });
    notifyDraft(`Cleared ${group.name} support scores to blank. Fill every cell. Undo restores the previous scores.`);
    return;
  }
  if (action === "add-clause") changeAndRender(() => {
    const support = defaultSupport(state.proposal.groups);
    state.proposal.clauses.push({ id: makeId("clause"), title: "New clause", options: [
      { id: makeId("original"), original: true, label: "Keep the current wording", changeCost: 0, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a first structured alternative", changeCost: 1, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a second structured alternative", changeCost: 2, support: { ...support } },
    ] });
  });
  if (action === "remove-clause") changeAndRender(() => { state.proposal.clauses = state.proposal.clauses.filter((clause) => clause.id !== button.dataset.clauseId); });
  if (action === "move-clause") {
    const moved = moveClause(state.proposal, button.dataset.clauseId, button.dataset.direction);
    if (moved.status !== "ok") {
      notifyDraft(`Could not move that clause: ${moved.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = moved.proposal; });
    return;
  }
  if (action === "duplicate-clause") changeAndRender(() => {
    if (state.proposal.clauses.length >= MAX_CLAUSES) return;
    const source = clauseById(button.dataset.clauseId);
    if (!source) return;
    const copy = {
      id: makeId("clause"),
      title: source.title.length + 7 > 120 ? `${source.title.slice(0, 113)} (copy)` : `${source.title} (copy)`,
      ...(source.note ? { note: source.note } : {}),
      options: source.options.map((option) => ({
        id: makeId(option.original ? "original" : "alternative"),
        label: option.label,
        original: option.original === true,
        changeCost: option.changeCost,
        support: { ...option.support },
      })),
    };
    if (source.lockedOptionId) {
      const lockedIndex = source.options.findIndex((option) => option.id === source.lockedOptionId);
      if (lockedIndex >= 0) copy.lockedOptionId = copy.options[lockedIndex].id;
    }
    const sourceIndex = state.proposal.clauses.findIndex((clause) => clause.id === source.id);
    state.proposal.clauses.splice(sourceIndex + 1, 0, copy);
  });
  if (action === "add-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    clause.options.push({ id: makeId("alternative"), original: false, label: "New alternative", changeCost: 1, support: { ...defaultSupport(state.proposal.groups) } });
  });
  if (action === "duplicate-option") {
    const duplicated = duplicateClauseOption(state.proposal, button.dataset.clauseId, button.dataset.optionId);
    if (duplicated.status !== "ok") {
      notifyDraft(`Could not duplicate that option: ${duplicated.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = duplicated.proposal; });
    return;
  }
  if (action === "remove-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    if (clause.lockedOptionId === button.dataset.optionId) return;
    clause.options = clause.options.filter((option) => option.id !== button.dataset.optionId);
  });
});

function loadScenarios() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    libraryRaw = raw;
    if (raw === null) return [];
    if (raw.length > 5_000_000) throw new Error("Library exceeds its storage bound.");
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length > MAX_SCENARIOS) throw new Error("Invalid library.");
    return rows.map((row) => {
      if (!row || typeof row.name !== "string" || !row.name.trim() || row.name.length > 120) throw new Error("Invalid scenario name.");
      return { name: row.name, proposal: canonicalProposal(row.proposal) };
    });
  } catch {
    libraryBlocked = true;
    return [];
  }
}

function notifyDraft(message) {
  state.saveMessage = message;
  $("#autosave-status").textContent = message;
}

function renderScenarios() {
  const select = $("#scenario-select");
  const selected = select.value;
  select.innerHTML = '<option value="">Choose a saved scenario</option>' + scenarios.map((row, index) => '<option value="' + index + '">' + escapeHtml(row.name) + '</option>').join("");
  if (selected !== "" && scenarios[Number(selected)]) select.value = selected;
  const comparison = $("#comparison-select");
  const previousComparison = comparison.value;
  comparison.innerHTML = '<option value="">Choose a snapshot to compare</option>' + scenarios.map((row, index) => '<option value="' + index + '">' + escapeHtml(row.name) + '</option>').join("");
  if (previousComparison !== "" && scenarios[Number(previousComparison)]) comparison.value = previousComparison;
  $("#scenario-count").textContent = libraryBlocked ? "Scenario storage is unavailable or invalid. Existing stored bytes are preserved. Export JSON to keep your work." : scenarios.length + " of " + MAX_SCENARIOS + " snapshots saved in this browser. Loading can be undone.";
  $("#save-scenario").disabled = libraryBlocked || scenarios.length >= MAX_SCENARIOS;
  $("#load-scenario").disabled = !scenarios.length;
  $("#delete-scenario").disabled = !scenarios.length;
}

function persistScenarios(next) {
  try {
    if (localStorage.getItem(LIBRARY_KEY) !== libraryRaw) {
      notifyDraft("The scenario library changed in another tab. Export this draft, then reload before saving a snapshot.");
      return false;
    }
    const serialized = JSON.stringify(next);
    localStorage.setItem(LIBRARY_KEY, serialized);
    libraryRaw = serialized;
    scenarios = next;
    renderScenarios();
    return true;
  } catch {
    notifyDraft("Scenario could not be saved. Export JSON to keep this draft.");
    return false;
  }
}

$("#save-scenario").addEventListener("click", () => {
  if (libraryBlocked || scenarios.length >= MAX_SCENARIOS) return;
  const cause = firstProposalError(state.proposal);
  if (cause) return notifyDraft("Fix the draft before saving a scenario: " + cause);
  const name = $("#scenario-name").value.trim() || state.proposal.title;
  if (name.length > 120) return notifyDraft("Scenario names must be 120 characters or fewer.");
  if (persistScenarios([...scenarios, { name, proposal: canonicalProposal(state.proposal) }])) {
    $("#scenario-select").value = String(scenarios.length - 1);
    notifyDraft("Scenario saved as an independent snapshot: " + name);
  }
});
$("#load-scenario").addEventListener("click", () => {
  const value = $("#scenario-select").value;
  const row = value === "" ? null : scenarios[Number(value)];
  if (!row) return notifyDraft("Choose a saved scenario first.");
  changeAndRender(() => { state.proposal = clone(row.proposal); });
  notifyDraft("Loaded scenario: " + row.name + ". Undo restores the previous draft.");
});
$("#delete-scenario").addEventListener("click", () => {
  const value = $("#scenario-select").value;
  const row = value === "" ? null : scenarios[Number(value)];
  if (!row) return notifyDraft("Choose a saved scenario first.");
  if (!window.confirm("Delete saved scenario: " + row.name + "? The current draft is retained.")) return;
  if (persistScenarios(scenarios.filter((_, index) => index !== Number(value)))) notifyDraft("Saved scenario deleted. The current draft is retained.");
});

function restoreHistory(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(state.proposal));
  state.proposal = JSON.parse(from.pop());
  save(false);
  render();
}
$("#undo-button").addEventListener("click", () => restoreHistory(undoStack, redoStack));
$("#redo-button").addEventListener("click", () => restoreHistory(redoStack, undoStack));

$("#load-preset").addEventListener("click", () => {
  changeAndRender(() => { state.proposal = clone(presets[$("#preset-select").value]); state.saveMessage = "Preset loaded and saved locally."; });
});
function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$("#export-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) {
    $("#autosave-status").textContent = "Correct invalid inputs before exporting JSON.";
    return;
  }
  downloadText("smallest-agreement.json", JSON.stringify(canonicalProposal(state.proposal), null, 2), "application/json");
});
$("#export-workspace-button").addEventListener("click", () => {
  const exported = formatWorkspaceJson(state.proposal, { clauseDensity, vetoGroupsOnly, lockedClausesOnly, hideUnlockedClauses, hideLockedClauses, changedClausesOnly, belowFloorGroupsOnly, overBudgetClausesOnly, hideGroupsAtFloor, hideGroupsWithoutFloors, noCheaperRemainingClausesOnly });
  if (exported.status !== "ok") return notifyDraft("Fix the draft before exporting workspace JSON.");
  downloadText("smallest-agreement-workspace.json", exported.json, "application/json");
  notifyDraft("Workspace JSON downloaded with the current draft, clause card density, and display filters. The solver ignores those filters.");
});
$("#export-locks-button").addEventListener("click", () => {
  const exported = formatLocksJson(state.proposal);
  if (exported.status !== "ok") return notifyDraft("Fix the draft before exporting locks JSON.");
  downloadText("smallest-agreement-locks.json", exported.json, "application/json");
  notifyDraft(exported.locks.length
    ? `Locks JSON downloaded with ${exported.locks.length} locked clause${exported.locks.length === 1 ? "" : "s"}. Import replaces every lock.`
    : "Locks JSON downloaded with no locked clauses. Importing it clears every lock.");
});
$("#import-locks-button").addEventListener("click", () => $("#locks-import-file").click());
$("#locks-import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return notifyDraft("Locks JSON import failed: files must be 250 KB or smaller.");
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    return notifyDraft("Locks JSON import failed: the file could not be read.");
  }
  if (sequence !== importSequence) return;
  const parsed = parseLocksJson(text, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Locks JSON import failed (${first.code}): ${first.message}`);
  }
  changeAndRender(() => { state.proposal = parsed.proposal; });
  notifyDraft(`Imported ${parsed.applied} clause lock${parsed.applied === 1 ? "" : "s"}. Every previous lock was replaced. Undo restores the previous draft.`);
});
function printFacilitatorPack(redacted) {
  printRedacted = redacted === true;
  render();
  window.print();
}
$("#print-button").addEventListener("click", () => printFacilitatorPack(false));
$("#print-redacted-button").addEventListener("click", () => printFacilitatorPack(true));
window.addEventListener("afterprint", () => {
  if (!printRedacted) return;
  printRedacted = false;
  render();
});
$("#worksheet-button").addEventListener("click", () => {
  const worksheet = formatDiscussionWorksheet(state.proposal);
  if (worksheet.status !== "ok") return notifyDraft("Fix the draft before exporting the discussion worksheet.");
  downloadText("smallest-agreement-worksheet.txt", worksheet.text, "text/plain");
  notifyDraft("Discussion worksheet downloaded. It is a conversation aid, not a recorded vote.");
});
$("#worksheet-csv-button").addEventListener("click", () => {
  const worksheet = formatDiscussionWorksheetCsv(state.proposal);
  if (worksheet.status !== "ok") return notifyDraft("Fix the draft before exporting the discussion worksheet CSV.");
  downloadText("smallest-agreement-worksheet.csv", "\uFEFF" + worksheet.csv, "text/csv;charset=utf-8");
  notifyDraft("Discussion worksheet CSV downloaded. Groups, weights, options, and notes are text. It is a conversation aid, not a recorded vote.");
});
window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedEdits) return;
  event.preventDefault();
  event.returnValue = "";
});

$("#csv-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) return notifyDraft("Fix the draft before exporting CSV.");
  downloadText("smallest-agreement-evidence.csv", "\uFEFF" + formatEvidenceCsv(state.proposal, currentResult()), "text/csv;charset=utf-8");
  notifyDraft("CSV downloaded with every option, group, constraint, support score, and recommendation marker.");
});
$("#matrix-export-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) return notifyDraft("Fix the draft before exporting the support matrix.");
  downloadText("smallest-agreement-support.csv", "\uFEFF" + formatSupportMatrixCsv(state.proposal), "text/csv;charset=utf-8");
  notifyDraft("Support matrix CSV downloaded. Import it to replace group scores without changing labels or costs.");
});
$("#matrix-import-button").addEventListener("click", () => $("#matrix-import-file").click());
$("#matrix-import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return notifyDraft("Support CSV import failed: files must be 250 KB or smaller.");
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    return notifyDraft("Support CSV import failed: the file could not be read.");
  }
  if (sequence !== importSequence) return;
  const parsed = parseSupportMatrixCsv(text, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Support CSV import failed (${first.code}): ${first.message}`);
  }
  state.proposal = parsed.proposal;
  state.saveMessage = `Imported ${parsed.updatedCells} support scores from CSV.`;
  save();
  render();
});
$("#groups-export-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) return notifyDraft("Fix the draft before exporting the groups CSV.");
  downloadText("smallest-agreement-groups.csv", "\uFEFF" + formatParticipantGroupsCsv(state.proposal), "text/csv;charset=utf-8");
  notifyDraft("Groups CSV downloaded. Import it to replace participant groups, weights, optional floors and vetoes, and support scores.");
});
$("#groups-import-button").addEventListener("click", () => $("#groups-import-file").click());
$("#groups-import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return notifyDraft("Groups CSV import failed: files must be 250 KB or smaller.");
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    return notifyDraft("Groups CSV import failed: the file could not be read.");
  }
  if (sequence !== importSequence) return;
  const parsed = parseParticipantGroupsCsv(text, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Groups CSV import failed (${first.code}): ${first.message}`);
  }
  changeAndRender(() => { state.proposal = parsed.proposal; });
  notifyDraft(`Imported ${parsed.importedGroups} participant groups from CSV. Undo restores the previous draft.`);
});
$("#clauses-export-button").addEventListener("click", () => {
  const exported = formatClauseOptionsCsv(state.proposal);
  if (exported.status !== "ok") return notifyDraft("Fix the draft before exporting the clauses CSV.");
  downloadText("smallest-agreement-clauses.csv", "\uFEFF" + exported.csv, "text/csv;charset=utf-8");
  notifyDraft("Clauses CSV downloaded. Import it to replace clause titles, option labels, costs, original flags, notes, and locks. Matching scores are kept.");
});
$("#clauses-import-button").addEventListener("click", () => $("#clauses-import-file").click());
$("#clauses-import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return notifyDraft("Clauses CSV import failed: files must be 250 KB or smaller.");
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    return notifyDraft("Clauses CSV import failed: the file could not be read.");
  }
  if (sequence !== importSequence) return;
  const parsed = parseClauseOptionsCsv(text, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Clauses CSV import failed (${first.code}): ${first.message}`);
  }
  changeAndRender(() => { state.proposal = parsed.proposal; });
  notifyDraft(`Imported ${parsed.importedClauses} clauses (${parsed.importedOptions} options) from CSV. Undo restores the previous draft.`);
});
$("#clause-paste-button").addEventListener("click", () => {
  const pasted = $("#clause-paste")?.value ?? "";
  const parsed = parseClauseOptionsCsv(pasted, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Pasted clauses failed (${first.code}): ${first.message}`);
  }
  changeAndRender(() => { state.proposal = parsed.proposal; });
  notifyDraft(`Imported ${parsed.importedClauses} clauses (${parsed.importedOptions} options) from the pasted table. Undo restores the previous draft.`);
});
$("#brief-button").addEventListener("click", () => {
  downloadText("smallest-agreement-brief.md", formatDecisionBrief(state.proposal, currentResult()), "text/markdown");
  state.saveMessage = "Decision brief downloaded.";
  $("#autosave-status").textContent = state.saveMessage;
});
$("#copy-package-button").addEventListener("click", async () => {
  const packaged = formatRecommendedPackageMarkdown(state.proposal, currentResult());
  if (packaged.status === "invalid") return notifyDraft("Fix the draft before copying the recommended package.");
  if (packaged.status !== "ok") return notifyDraft(packaged.text.trim());
  const fallback = $("#package-markdown-fallback");
  if (fallback) fallback.value = packaged.text;
  try {
    await navigator.clipboard.writeText(packaged.text);
    notifyDraft("Recommended package copied as Markdown. It is a decision aid, not a recorded vote.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the recommended package from the Markdown box. It is not a recorded vote.");
  }
});
async function copyRecommendedOptionCount() {
  const listed = formatRecommendedPackageOptionCountMarkdown(state.proposal, currentResult());
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying the recommended package option count.");
  const fallback = $("#option-count-fallback");
  if (fallback) fallback.value = listed.text;
  notifyDraft("Recommended package option count copied as Markdown. It is a decision aid, not a recorded vote.");
  try {
    await navigator.clipboard.writeText(listed.text);
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the recommended package option count from the Markdown box. It is not a recorded vote.");
  }
}
$("#copy-option-count-button").addEventListener("click", copyRecommendedOptionCount);
async function copyOriginalVersusRecommended() {
  const listed = formatOriginalVersusRecommendedMarkdown(state.proposal, currentResult());
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying original versus recommended labels and costs.");
  const fallback = $("#original-versus-recommended-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Original versus recommended labels and costs copied as Markdown. It is a decision aid, not a recorded vote.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy original versus recommended labels and costs from the Markdown box. It is not a recorded vote.");
  }
}
$("#copy-original-versus-recommended-button").addEventListener("click", copyOriginalVersusRecommended);
$("#copy-group-support-button").addEventListener("click", async () => {
  const listed = formatGroupSupportMarkdown(state.proposal, inspectedPackage(currentResult()));
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying the group support table.");
  if (listed.status !== "ok") return notifyDraft(listed.text.trim());
  const fallback = $("#group-support-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Group support copied as Markdown. Mixing weights are not a legal right.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the group support table from the Markdown box. Mixing weights are not a legal right.");
  }
});
async function copyRemainingBudget() {
  const listed = formatRemainingChangeBudgetMarkdown(state.proposal, currentResult());
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying remaining change-budget.");
  const fallback = $("#remaining-budget-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Remaining change-budget copied as Markdown. It is a draft accounting line, not a legal appropriation.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy remaining change-budget from the Markdown box. It is not a legal appropriation.");
  }
}
$("#copy-remaining-budget-button").addEventListener("click", copyRemainingBudget);
async function copyApprovalThreshold() {
  const listed = formatApprovalThresholdMarkdown(state.proposal);
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying the approval threshold.");
  const fallback = $("#approval-threshold-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Approval threshold copied as Markdown. It is a number you entered, not a legal quorum.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the approval threshold from the Markdown box. It is a number you entered, not a legal quorum.");
  }
}
$("#copy-approval-threshold-button").addEventListener("click", copyApprovalThreshold);
$("#copy-packages-table-button").addEventListener("click", async () => {
  const result = currentResult();
  if (result.status === "invalid") return notifyDraft("Fix the draft before copying the package table.");
  const recommendedIds = result.agreement ? result.agreement.options.map((option) => option.id) : null;
  const packaged = formatPinnedPackagesMarkdown(state.proposal, recommendedIds, customOptionIds());
  if (packaged.status !== "ok") return notifyDraft(packaged.errors?.[0] ?? "Could not build the package table.");
  const fallback = $("#package-table-fallback");
  if (fallback) fallback.value = packaged.text;
  try {
    await navigator.clipboard.writeText(packaged.text);
    notifyDraft("Package table copied as Markdown. It is a decision aid, not a recorded vote.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the package table from the Markdown box. It is not a recorded vote.");
  }
});
$("#copy-veto-button").addEventListener("click", async () => {
  const options = inspectedPackage(currentResult());
  const listed = formatVetoBlockersMarkdown(state.proposal, options);
  if (listed.status === "invalid") return notifyDraft("Fix the draft before copying the veto constraint list.");
  if (listed.status !== "ok") return notifyDraft(listed.text.trim());
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Veto constraint list copied as Markdown. It is a numerical constraint list, not a legitimacy claim.");
  } catch {
    notifyDraft("Could not copy to the clipboard. Export the brief instead.");
  }
});
$("#copy-locks-button").addEventListener("click", async () => {
  const listed = formatCurrentLocksMarkdown(state.proposal);
  if (listed.status !== "ok") return notifyDraft("Fix the draft before copying the current locks.");
  const fallback = $("#locks-markdown-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Current locks copied as Markdown. It is a draft choice list, not a legal hold.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the current locks from the Markdown box. It is not a legal hold.");
  }
});
async function copyLockCount() {
  const listed = formatCurrentLockCountMarkdown(state.proposal);
  if (listed.status !== "ok") return notifyDraft("Fix the draft before copying the current lock count.");
  const fallback = $("#lock-count-fallback");
  if (fallback) fallback.value = listed.text;
  try {
    await navigator.clipboard.writeText(listed.text);
    notifyDraft("Current lock count copied as Markdown. Locks are draft choices, not a legal hold.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the current lock count from the Markdown box. Locks are draft choices, not a legal hold.");
  }
}
$("#copy-lock-count-button").addEventListener("click", copyLockCount);
$("#copy-change-cost-button").addEventListener("click", async () => {
  const exported = formatRecommendedChangeCostCsv(state.proposal, currentResult());
  if (exported.status === "invalid") return notifyDraft("Fix the draft before copying the change-cost table.");
  if (exported.status !== "ok") return notifyDraft(exported.text.trim());
  const fallback = $("#change-cost-csv-fallback");
  if (fallback) fallback.value = exported.csv;
  try {
    await navigator.clipboard.writeText(exported.csv);
    notifyDraft("Recommended versus original change-cost table copied as CSV.");
  } catch {
    fallback?.focus?.();
    notifyDraft("Clipboard is blocked. Copy the change-cost table from the CSV box.");
  }
});
$("#groups-paste-button").addEventListener("click", () => {
  const pasted = $("#groups-paste")?.value ?? "";
  const parsed = parseParticipantGroupsCsv(pasted, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Pasted groups failed (${first.code}): ${first.message}`);
  }
  changeAndRender(() => { state.proposal = parsed.proposal; });
  notifyDraft(`Imported ${parsed.importedGroups} participant groups from the pasted table. Undo restores the previous draft.`);
});
$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) {
    state.saveMessage = "Import failed: files must be 250 KB or smaller.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    state.saveMessage = "Import failed: the file could not be read.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  if (sequence !== importSequence) return;
  const workspace = parseWorkspaceJson(text);
  if (workspace.status === "ok") {
    state.proposal = workspace.proposal;
    if (workspace.kind === "workspace") {
      if (workspace.clauseDensity === "compact" || workspace.clauseDensity === "comfortable") clauseDensity = workspace.clauseDensity;
      vetoGroupsOnly = workspace.vetoGroupsOnly === true;
      lockedClausesOnly = workspace.lockedClausesOnly === true;
      hideUnlockedClauses = workspace.hideUnlockedClauses === true;
      hideLockedClauses = workspace.hideLockedClauses === true;
      changedClausesOnly = workspace.changedClausesOnly === true;
      belowFloorGroupsOnly = workspace.belowFloorGroupsOnly === true;
      overBudgetClausesOnly = workspace.overBudgetClausesOnly === true;
      hideGroupsAtFloor = workspace.hideGroupsAtFloor === true;
      hideGroupsWithoutFloors = workspace.hideGroupsWithoutFloors === true;
      noCheaperRemainingClausesOnly = workspace.noCheaperRemainingClausesOnly === true;
      persistWorkspacePrefs();
    } else if (workspace.clauseDensity === "compact" || workspace.clauseDensity === "comfortable") {
      clauseDensity = workspace.clauseDensity;
      persistWorkspacePrefs();
    }
    save();
    state.saveMessage = workspace.kind === "workspace"
      ? "Imported workspace and saved locally."
      : "Imported and saved locally.";
    render();
    return;
  }
  if (workspace.errors?.[0]?.code === "invalid_density" || workspace.errors?.[0]?.code === "invalid_format" || workspace.errors?.[0]?.code === "invalid_filter" || workspace.errors?.[0]?.code === "unknown_key") {
    state.saveMessage = `Import failed (${workspace.errors[0].code}): ${workspace.errors[0].message}`;
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  const parsed = parseProposalJson(text);
  if (parsed.cause) {
    state.saveMessage = `Import failed: ${parsed.cause}`;
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  state.proposal = parsed.proposal;
  save();
  state.saveMessage = "Imported and saved locally.";
  render();
});
$("#share-button").addEventListener("click", async () => {
  if (!validateProposal(state.proposal).valid) {
    $("#autosave-status").textContent = "Correct invalid inputs before sharing.";
    return;
  }
  if (location.protocol === "file:") {
    state.saveMessage = "Share links are not portable from a local file. Export JSON to share this draft.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  const encoded = encodeHash(state.proposal);
  if (encoded.length > 60_000) {
    state.saveMessage = "This draft is too large for a share link. Export JSON instead.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  location.hash = encoded;
  const link = location.href;
  try { await navigator.clipboard.writeText(link); state.saveMessage = "Share link copied. It contains this draft in the URL."; }
  catch { state.saveMessage = "Share link is now in the address bar. Copy it to share this draft."; }
  $("#autosave-status").textContent = state.saveMessage;
});
$("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Reset this local draft to the Neighbourhood Plan preset?")) return;
  state.proposal = clone(presets.neighbourhood);
  location.hash = "";
  state.saveMessage = "Draft reset and saved locally.";
  save();
  render();
});
window.addEventListener("resize", () => {
  const result = currentResult();
  if (result.baseline) drawCoalition(result.baseline, result.agreement);
});

const coachSteps = [
  { title: "Set the approval threshold", copy: "The solver looks for the lowest-cost package that reaches this number and every constraint. The threshold is a working rule you chose, not a recorded vote.", highlight: "#threshold-setup" },
  { title: "Lock clauses that are not open", copy: "A lock keeps that option in every searched combination. Unlock an option before removing it. Locks shrink the search; they do not grant authority.", highlight: "#clauses-heading" },
  { title: "Optionally cap total change cost", copy: "Leave the budget blank for no limit. Zero is a real limit that only allows zero-cost changes.", highlight: "#max-change-cost" },
  { title: "Review the recommendation", copy: "Search runs as you edit. Read the constraint checks, near misses, and contribution table before taking the package to a human discussion.", highlight: "#results-heading" },
];
let coachIndex = 0;
let coachOpen = false;

function setCoachHighlight(selector) {
  for (const id of ["#threshold-setup", "#clauses-heading", "#max-change-cost", "#results-heading"]) {
    const node = $(id);
    if (!node || !node.classList) continue;
    node.classList.toggle("coach-highlight", selector === id);
  }
}

function dismissCoach() {
  coachOpen = false;
  const overlay = $("#coach-overlay");
  if (overlay) overlay.hidden = true;
  setCoachHighlight("");
  try { localStorage.setItem(COACH_KEY, "dismissed"); } catch { /* storage may be unavailable */ }
}

function showCoachStep() {
  const step = coachSteps[coachIndex];
  $("#coach-title").textContent = step.title;
  $("#coach-copy").textContent = step.copy;
  $("#coach-step").textContent = `Step ${coachIndex + 1} of ${coachSteps.length}`;
  $("#coach-next").textContent = coachIndex === coachSteps.length - 1 ? "Done" : "Next";
  setCoachHighlight(step.highlight);
  const overlay = $("#coach-overlay");
  overlay.hidden = false;
  coachOpen = true;
  $("#coach-skip")?.focus?.();
}

function startCoachIfNeeded() {
  const overlay = $("#coach-overlay");
  if (overlay) overlay.hidden = true;
  if (initialLoadMessage === "Loaded proposal from the share link.") return;
  try {
    if (localStorage.getItem(COACH_KEY) === "dismissed") return;
  } catch {
    return;
  }
  coachIndex = 0;
  showCoachStep();
}

$("#coach-skip").addEventListener("click", dismissCoach);
$("#coach-again").addEventListener("click", () => {
  coachIndex = 0;
  showCoachStep();
});
$("#coach-next").addEventListener("click", () => {
  if (coachIndex >= coachSteps.length - 1) dismissCoach();
  else {
    coachIndex += 1;
    showCoachStep();
  }
});

let shortcutOpen = false;
function typingInField(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}
function setShortcutOpen(open) {
  shortcutOpen = open;
  const overlay = $("#shortcut-overlay");
  if (overlay) overlay.hidden = !open;
  if (open) $("#shortcut-close")?.focus?.();
}
function jumpToLocks() {
  const firstLocked = state.proposal.clauses.find((clause) => clause.lockedOptionId !== undefined);
  if (!firstLocked) {
    $("#clear-locks")?.focus?.();
    notifyDraft("No clause is locked. Use the lock control on a clause card to pin an option.");
    return;
  }
  const query = clauseFilter.trim().toLowerCase();
  let needsRender = false;
  if (!clauseMatchesFilter(firstLocked, query)) {
    clauseFilter = "";
    const filter = $("#clause-filter");
    if (filter) filter.value = "";
    needsRender = true;
  }
  if (hideLockedClauses) {
    hideLockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) {
    renderClauses();
    applyClauseDensity();
  }
  const selector = `[data-field="clause-lock"][data-clause-id="${firstLocked.id}"]`;
  const target = $(selector);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#clear-locks")?.focus?.();
}

function jumpToLockedClauseCard() {
  const firstLocked = state.proposal.clauses.find((clause) => clause.lockedOptionId !== undefined);
  if (!firstLocked) {
    $("#clauses-heading")?.focus?.();
    return;
  }
  const query = clauseFilter.trim().toLowerCase();
  const changed = changedClauseIds(state.proposal, currentResult());
  const changedIds = new Set(changed.status === "ok" ? changed.clauseIds : []);
  const overBudget = overBudgetClauseIds(state.proposal, currentResult());
  const overBudgetIds = new Set(overBudget.status === "ok" ? overBudget.clauseIds : []);
  const noCheaper = clausesWithoutCheaperRemainingOption(state.proposal, currentResult());
  const noCheaperIds = new Set(noCheaper.status === "ok" ? noCheaper.clauseIds : []);
  let needsRender = false;
  if (!clauseMatchesFilter(firstLocked, query)) {
    clauseFilter = "";
    const filter = $("#clause-filter");
    if (filter) filter.value = "";
    needsRender = true;
  }
  if (hideLockedClauses) {
    hideLockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (changedClausesOnly && !changedIds.has(firstLocked.id)) {
    changedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (overBudgetClausesOnly && !overBudgetIds.has(firstLocked.id)) {
    overBudgetClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (noCheaperRemainingClausesOnly && !noCheaperIds.has(firstLocked.id)) {
    noCheaperRemainingClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) {
    renderClauses();
    applyClauseDensity();
  }
  const target = $(`[data-field="clause-title"][data-clause-id="${firstLocked.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#clauses-heading")?.focus?.();
}
function jumpToGroups() {
  const inspected = inspectedPackage(currentResult());
  const below = inspected
    ? groupsBelowSupportRequirement(state.proposal, inspected)
    : { status: "ok", groups: [] };
  const belowIds = new Set(below.status === "ok" ? below.groups.map((group) => group.id) : []);
  const meeting = inspected
    ? groupsMeetingDeclaredSupportFloor(state.proposal, inspected)
    : { status: "ok", groups: [] };
  const meetingIds = new Set(meeting.status === "ok" ? meeting.groups.map((group) => group.id) : []);
  const visible = state.proposal.groups.filter((group) => {
    if (vetoGroupsOnly && group.veto !== true) return false;
    if (belowFloorGroupsOnly && !belowIds.has(group.id)) return false;
    if (hideGroupsAtFloor && meetingIds.has(group.id)) return false;
    if (hideGroupsWithoutFloors && !Object.hasOwn(group, "minSupport")) return false;
    return true;
  });
  if (visible.length) {
    const first = visible[0];
    const target = $(`[data-field="group-name"][data-group-id="${first.id}"]`);
    if (target?.focus) {
      target.focus();
      return;
    }
  }
  $("#groups-heading")?.focus?.();
}

function jumpToUnlocked() {
  const firstUnlocked = state.proposal.clauses.find((clause) => clause.lockedOptionId === undefined);
  if (!firstUnlocked) {
    $("#clear-locks")?.focus?.();
    notifyDraft("Every clause is locked. Use the lock controls to unlock an option.");
    return;
  }
  const query = clauseFilter.trim().toLowerCase();
  const changed = changedClauseIds(state.proposal, currentResult());
  const changedIds = new Set(changed.status === "ok" ? changed.clauseIds : []);
  const overBudget = overBudgetClauseIds(state.proposal, currentResult());
  const overBudgetIds = new Set(overBudget.status === "ok" ? overBudget.clauseIds : []);
  const noCheaper = clausesWithoutCheaperRemainingOption(state.proposal, currentResult());
  const noCheaperIds = new Set(noCheaper.status === "ok" ? noCheaper.clauseIds : []);
  let needsRender = false;
  if (!clauseMatchesFilter(firstUnlocked, query)) {
    clauseFilter = "";
    const filter = $("#clause-filter");
    if (filter) filter.value = "";
    needsRender = true;
  }
  if (lockedClausesOnly) {
    lockedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (hideUnlockedClauses) {
    hideUnlockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (changedClausesOnly && !changedIds.has(firstUnlocked.id)) {
    changedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (overBudgetClausesOnly && !overBudgetIds.has(firstUnlocked.id)) {
    overBudgetClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (noCheaperRemainingClausesOnly && !noCheaperIds.has(firstUnlocked.id)) {
    noCheaperRemainingClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) {
    renderClauses();
    applyClauseDensity();
  }
  const target = $(`[data-field="clause-title"][data-clause-id="${firstUnlocked.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#clear-locks")?.focus?.();
}

function jumpToVetoBlockers() {
  const blocking = blockingVetoIds(currentResult());
  const first = state.proposal.groups.find((group) => blocking.has(group.id));
  if (first) {
    const target = $(`[data-veto-block="${first.id}"]`);
    if (target?.focus) {
      target.focus();
      return;
    }
  }
  $("#constraint-checks")?.focus?.();
  notifyDraft("No veto-blocker highlight is on screen. Review the veto list in Constraint checks. A veto is a numerical constraint, not a legal right.");
}

function jumpToWeights() {
  const preview = $('[data-action="preview-renorm"]') || $('[data-action="apply-renorm"]');
  if (preview?.focus) {
    preview.focus();
    return;
  }
  $("#weight-renorm")?.focus?.();
}

function firstGroupBelowSupportFloor() {
  const inspected = inspectedPackage(currentResult());
  if (!inspected) return null;
  const below = groupsBelowSupportRequirement(state.proposal, inspected);
  if (below.status !== "ok" || !below.groups.length) return null;
  return state.proposal.groups.find((group) => group.id === below.groups[0].id) ?? null;
}

function jumpToBelowFloor() {
  const first = firstGroupBelowSupportFloor();
  if (!first) {
    $("#groups-heading")?.focus?.();
    return;
  }
  let needsRender = false;
  if (vetoGroupsOnly && first.veto !== true) {
    vetoGroupsOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (hideGroupsAtFloor) {
    const inspected = inspectedPackage(currentResult());
    const meeting = inspected
      ? groupsMeetingDeclaredSupportFloor(state.proposal, inspected)
      : { status: "ok", groups: [] };
    const meetingIds = new Set(meeting.status === "ok" ? meeting.groups.map((group) => group.id) : []);
    if (meetingIds.has(first.id)) {
      hideGroupsAtFloor = false;
      persistWorkspacePrefs();
      needsRender = true;
    }
  }
  if (hideGroupsWithoutFloors && !Object.hasOwn(first, "minSupport")) {
    hideGroupsWithoutFloors = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) renderGroups(blockingVetoIds(currentResult()));
  const target = $(`[data-field="group-name"][data-group-id="${first.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#groups-heading")?.focus?.();
}

function jumpToVetoGroup() {
  const first = state.proposal.groups.find((group) => group.veto === true);
  if (!first) {
    $("#groups-heading")?.focus?.();
    return;
  }
  let needsRender = false;
  if (belowFloorGroupsOnly) {
    const inspected = inspectedPackage(currentResult());
    const below = inspected
      ? groupsBelowSupportRequirement(state.proposal, inspected)
      : { status: "ok", groups: [] };
    const belowIds = new Set(below.status === "ok" ? below.groups.map((group) => group.id) : []);
    if (!belowIds.has(first.id)) {
      belowFloorGroupsOnly = false;
      persistWorkspacePrefs();
      needsRender = true;
    }
  }
  if (hideGroupsAtFloor) {
    const inspected = inspectedPackage(currentResult());
    const meeting = inspected
      ? groupsMeetingDeclaredSupportFloor(state.proposal, inspected)
      : { status: "ok", groups: [] };
    const meetingIds = new Set(meeting.status === "ok" ? meeting.groups.map((group) => group.id) : []);
    if (meetingIds.has(first.id)) {
      hideGroupsAtFloor = false;
      persistWorkspacePrefs();
      needsRender = true;
    }
  }
  if (hideGroupsWithoutFloors && !Object.hasOwn(first, "minSupport")) {
    hideGroupsWithoutFloors = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) renderGroups(blockingVetoIds(currentResult()));
  const target = $(`[data-field="group-name"][data-group-id="${first.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#groups-heading")?.focus?.();
}

function jumpToChangedClause() {
  const result = currentResult();
  const changed = changedClauseIds(state.proposal, result);
  const changedIds = changed.status === "ok" ? changed.clauseIds : [];
  const firstId = changedIds[0];
  if (!firstId) {
    $("#clauses-heading")?.focus?.();
    return;
  }
  const first = state.proposal.clauses.find((clause) => clause.id === firstId);
  if (!first) {
    $("#clauses-heading")?.focus?.();
    return;
  }
  const query = clauseFilter.trim().toLowerCase();
  const overBudget = overBudgetClauseIds(state.proposal, result);
  const overBudgetIds = new Set(overBudget.status === "ok" ? overBudget.clauseIds : []);
  const noCheaper = clausesWithoutCheaperRemainingOption(state.proposal, result);
  const noCheaperIds = new Set(noCheaper.status === "ok" ? noCheaper.clauseIds : []);
  let needsRender = false;
  if (!clauseMatchesFilter(first, query)) {
    clauseFilter = "";
    const filter = $("#clause-filter");
    if (filter) filter.value = "";
    needsRender = true;
  }
  if (lockedClausesOnly && first.lockedOptionId === undefined) {
    lockedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (hideUnlockedClauses && first.lockedOptionId === undefined) {
    hideUnlockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (hideLockedClauses && first.lockedOptionId !== undefined) {
    hideLockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (overBudgetClausesOnly && !overBudgetIds.has(first.id)) {
    overBudgetClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (noCheaperRemainingClausesOnly && !noCheaperIds.has(first.id)) {
    noCheaperRemainingClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) {
    renderClauses();
    applyClauseDensity();
  }
  const target = $(`[data-field="clause-title"][data-clause-id="${first.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#clauses-heading")?.focus?.();
}

function jumpToMethod() {
  $("#method-heading")?.focus?.();
}

function jumpToNumericThreshold() {
  const field = $("#threshold-number");
  if (field?.focus) {
    field.focus();
    return;
  }
  jumpToMethod();
}

function jumpToLockCountCopy() {
  const control = $("#copy-lock-count-button");
  if (control?.focus) {
    control.focus();
    return;
  }
  $("#locks-heading")?.focus?.();
}

function jumpToPrintPack() {
  const control = $("#print-button");
  if (control?.focus) {
    control.focus();
    return;
  }
  $("#print-heading")?.focus?.();
}

function jumpToRecommendedOption() {
  const result = currentResult();
  const recommended = result.agreement?.options;
  const first = recommended?.[0];
  if (!first) {
    $("#clauses-heading")?.focus?.();
    return;
  }
  const clause = state.proposal.clauses[0];
  const query = clauseFilter.trim().toLowerCase();
  const changed = changedClauseIds(state.proposal, result);
  const changedIds = new Set(changed.status === "ok" ? changed.clauseIds : []);
  const overBudget = overBudgetClauseIds(state.proposal, result);
  const overBudgetIds = new Set(overBudget.status === "ok" ? overBudget.clauseIds : []);
  const noCheaper = clausesWithoutCheaperRemainingOption(state.proposal, result);
  const noCheaperIds = new Set(noCheaper.status === "ok" ? noCheaper.clauseIds : []);
  let needsRender = false;
  if (clause && !clauseMatchesFilter(clause, query)) {
    clauseFilter = "";
    const filter = $("#clause-filter");
    if (filter) filter.value = "";
    needsRender = true;
  }
  if (clause && lockedClausesOnly && clause.lockedOptionId === undefined) {
    lockedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (clause && hideUnlockedClauses && clause.lockedOptionId === undefined) {
    hideUnlockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (clause && hideLockedClauses && clause.lockedOptionId !== undefined) {
    hideLockedClauses = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (clause && changedClausesOnly && !changedIds.has(clause.id)) {
    changedClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (clause && overBudgetClausesOnly && !overBudgetIds.has(clause.id)) {
    overBudgetClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (clause && noCheaperRemainingClausesOnly && !noCheaperIds.has(clause.id)) {
    noCheaperRemainingClausesOnly = false;
    persistWorkspacePrefs();
    needsRender = true;
  }
  if (needsRender) {
    renderClauses();
    applyClauseDensity();
  }
  const target = $(`[data-recommended-option="${first.id}"]`);
  if (target?.focus) {
    target.focus();
    return;
  }
  $("#clauses-heading")?.focus?.();
}

function findAgreement() {
  $("#results-heading")?.focus?.();
  notifyDraft("Search already runs as you edit. Review the recommendation below.");
}
$("#find-agreement").addEventListener("click", findAgreement);
$("#shortcut-help-button").addEventListener("click", () => setShortcutOpen(true));
$("#shortcut-close").addEventListener("click", () => setShortcutOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (coachOpen) {
      event.preventDefault();
      dismissCoach();
      return;
    }
    if (shortcutOpen) {
      event.preventDefault();
      setShortcutOpen(false);
    }
    return;
  }
  if (typingInField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "?") {
    event.preventDefault();
    setShortcutOpen(true);
    return;
  }
  if (shortcutOpen) return;
  if (event.key === "u" || event.key === "U") {
    event.preventDefault();
    if (!$("#undo-button").disabled) $("#undo-button").click();
  } else if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    if (!$("#redo-button").disabled) $("#redo-button").click();
  } else if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    $("#export-button").click();
  } else if (event.key === "s" || event.key === "S") {
    event.preventDefault();
    findAgreement();
  } else if (event.key === "f" || event.key === "F" || event.key === "/") {
    event.preventDefault();
    $("#clause-filter")?.focus?.();
  } else if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    $("#add-group")?.focus?.();
  } else if (event.key === "l" || event.key === "L") {
    event.preventDefault();
    jumpToLocks();
  } else if (event.key === "v" || event.key === "V") {
    event.preventDefault();
    setVetoGroupsOnly(!vetoGroupsOnly);
  } else if (event.key === "b" || event.key === "B") {
    event.preventDefault();
    jumpToVetoBlockers();
  } else if (event.key === "g" || event.key === "G") {
    event.preventDefault();
    jumpToGroups();
  } else if (event.key === "c" || event.key === "C") {
    event.preventDefault();
    $("#max-change-cost")?.focus?.();
  } else if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    printFacilitatorPack(false);
  } else if (event.key === "k" || event.key === "K") {
    event.preventDefault();
    jumpToUnlocked();
  } else if (event.key === "t" || event.key === "T") {
    event.preventDefault();
    $("#threshold-number")?.focus?.();
  } else if (event.key === "a" || event.key === "A") {
    event.preventDefault();
    $("#add-clause")?.focus?.();
  } else if (event.key === "w" || event.key === "W") {
    event.preventDefault();
    jumpToWeights();
  } else if (event.key === "m" || event.key === "M") {
    event.preventDefault();
    $("#budget-remaining")?.focus?.();
  } else if (event.key === "d" || event.key === "D") {
    event.preventDefault();
    jumpToBelowFloor();
  } else if (event.key === "o" || event.key === "O") {
    event.preventDefault();
    jumpToRecommendedOption();
  } else if (event.key === "j" || event.key === "J") {
    event.preventDefault();
    copyRemainingBudget();
  } else if (event.key === "x" || event.key === "X") {
    event.preventDefault();
    $("#export-button")?.focus?.();
  } else if (event.key === "h" || event.key === "H") {
    event.preventDefault();
    jumpToMethod();
  } else if (event.key === "i" || event.key === "I") {
    event.preventDefault();
    copyOriginalVersusRecommended();
  } else if (event.key === "q" || event.key === "Q") {
    event.preventDefault();
    jumpToChangedClause();
  } else if (event.key === "y" || event.key === "Y") {
    event.preventDefault();
    jumpToVetoGroup();
  } else if (event.key === "z" || event.key === "Z") {
    event.preventDefault();
    jumpToNumericThreshold();
  } else if (event.key === "," && !event.shiftKey) {
    event.preventDefault();
    copyRecommendedOptionCount();
  } else if (event.key === "." && !event.shiftKey) {
    event.preventDefault();
    jumpToLockedClauseCard();
  } else if (event.key === ";") {
    event.preventDefault();
    copyLockCount();
  } else if (event.key === "[") {
    event.preventDefault();
    jumpToLockCountCopy();
  } else if (event.key === "]") {
    event.preventDefault();
    jumpToPrintPack();
  }
});

clauseDensity = "comfortable";
loadWorkspacePrefs();
render();
startCoachIfNeeded();

function clearAgreementReview() {
 agreementReviewPacket=null;agreementReviewSequence++;
 const exportButton=document.querySelector('#agreement-review-export');if(exportButton)exportButton.disabled=true;
 const origin=document.querySelector('#agreement-review-origin');if(origin)origin.textContent='';
 const output=document.querySelector('#agreement-review-output');
 if(output) output.textContent='Run a review for the current valid inputs. Results clear when the case changes.';
}
function showAgreementReview(review) {
 const output=document.querySelector('#agreement-review-output');output.replaceChildren();
 const title=document.createElement('h2');title.textContent=review.title;const note=document.createElement('p');note.textContent=review.note;output.append(title,note);
 const scroll=document.createElement('div');scroll.className='review-scroll';scroll.tabIndex=0;
 const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent='Declared-input review. Monetary values use '+review.currency+'. Blank cells mean unavailable or unbounded as explained above.';table.append(caption);
 const head=document.createElement('thead');const headings=document.createElement('tr');for(const label of review.columns){const th=document.createElement('th');th.scope='col';th.textContent=label;headings.append(th);}head.append(headings);table.append(head);
 const body=document.createElement('tbody');for(const values of review.rows){const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=value===null?'':typeof value==='number'?new Intl.NumberFormat('en-US',{maximumSignificantDigits:10}).format(value):value;row.append(cell);}body.append(row);}table.append(body);scroll.append(table);output.append(scroll);
}
function initializeAgreementReview(){
 const select=document.querySelector('#agreement-review-tool');if(!select)return;
 for(const tool of AGREEMENT_REVIEW_TOOLS){const option=document.createElement('option');option.value=tool.id;option.textContent=tool.title;select.append(option);}
 select.value='margin';select.addEventListener('change',clearAgreementReview);
 document.querySelector('#agreement-review-run').addEventListener('click',()=>{clearAgreementReview();try{agreementReviewPacket=createAgreementReviewPacket(state.proposal,select.value);showAgreementReview(agreementReviewPacket.review);document.querySelector('#agreement-review-export').disabled=false;document.querySelector('#agreement-review-origin').textContent='Current case: '+(state.proposal.title);}catch(error){clearAgreementReview();document.querySelector('#agreement-review-output').textContent='Review unavailable. '+(error.errors?.join(' ')||error.message);}});
}
initializeAgreementReview();

function initializeAgreementReviewPacket(){
 const button=document.querySelector('#agreement-review-export');if(!button)return;
 button.addEventListener('click',()=>{if(agreementReviewPacket)downloadText('agreement-review.json',JSON.stringify(agreementReviewPacket),'application/json');});
 document.querySelector('#agreement-review-import').addEventListener('click',()=>document.querySelector('#agreement-review-file').click());
 document.querySelector('#agreement-review-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;clearAgreementReview();const sequence=agreementReviewSequence;
  try{
   if(file.size>1048576)throw new Error('Review packet exceeds 1 MiB.');
   const text=await file.text();if(sequence!==agreementReviewSequence)return;
   const packet=replayAgreementReviewPacket(JSON.parse(text));agreementReviewPacket=packet;
   document.querySelector('#agreement-review-tool').value=packet.tool;showAgreementReview(packet.review);button.disabled=false;
   document.querySelector('#agreement-review-origin').textContent='Inspected saved case: '+(packet.scenario.title)+'. Current case and autosave unchanged.';
  }catch(error){if(sequence!==agreementReviewSequence)return;clearAgreementReview();document.querySelector('#agreement-review-output').textContent='Review rejected: '+(error.errors?.join(' ')||error.message);}
 });
}
initializeAgreementReviewPacket();
