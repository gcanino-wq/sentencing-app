/**
 * Core types for the federal sentencing calculation engine.
 *
 * The engine is a pure library: it takes a `CaseInput` and returns a
 * `CaseResult` with no I/O, no randomness, and no dependency on the DOM.
 * Every level movement it produces carries the citation that produced it.
 */

// ---------------------------------------------------------------------------
// Provenance and honesty primitives
// ---------------------------------------------------------------------------

/**
 * How much confidence the encoded data carries. Surfaced in the UI so a user
 * can tell a hand-verified entry from a broad-coverage one.
 */
export type Confidence = 'verified' | 'unverified';

export type FlagSeverity = 'info' | 'caution' | 'warning';

/** A note attached to a calculation: a warning, an open legal question, an assumption. */
export interface Flag {
  severity: FlagSeverity;
  /** Stable identifier so the UI can dedupe and test can assert. */
  code: string;
  message: string;
  citation?: string;
}

/**
 * One movement in the calculation. The result view renders these in order as an
 * audit trail, so `citation` is required — a step that cannot cite itself is a bug.
 */
export interface Step {
  kind:
    | 'base'
    | 'soc'
    | 'crossref'
    | 'chapter3'
    | 'grouping'
    | 'chapter4'
    | 'cap'
    | 'acceptance';
  label: string;
  citation: string;
  /** Level delta. For `kind: 'base'` this is the absolute base offense level. */
  levels: number;
  detail?: string;
  /** Set when the step was considered and deliberately not applied. */
  suppressed?: boolean;
}

// ---------------------------------------------------------------------------
// Chapter 5 primitives
// ---------------------------------------------------------------------------

export type CriminalHistoryCategory = 1 | 2 | 3 | 4 | 5 | 6;
export type Zone = 'A' | 'B' | 'C' | 'D';

/**
 * A custody range in months. `max: null` means life. `min` is always a number
 * because no guideline range has an unbounded floor.
 */
export interface MonthRange {
  min: number;
  max: number | null;
}

// ---------------------------------------------------------------------------
// Offense classification (18 U.S.C. § 3559)
// ---------------------------------------------------------------------------

export type OffenseClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'misdA' | 'misdB' | 'misdC';

// ---------------------------------------------------------------------------
// Chapter 2 inputs
// ---------------------------------------------------------------------------

export type DrugUnit = 'g' | 'kg' | 'mg' | 'lb' | 'oz' | 'pills' | 'plants' | 'units';

export interface DrugEntry {
  /** Key into the drug conversion table. */
  substanceId: string;
  quantity: number;
  unit: DrugUnit;
  /** For `unit: 'pills'` — milligrams of active ingredient per pill. */
  mgPerUnit?: number;
}

/** § 2B1.1 / § 2C1.1 loss inputs. Amounts in whole dollars. */
export interface LossInput {
  actualLoss?: number;
  intendedLoss?: number;
  /** Used only when loss is not reasonably determinable. § 2B1.1 cmt. n.3(B). */
  gain?: number;
  /** § 2B1.1 cmt. n.3(E) credits — money returned, collateral, services rendered. */
  credits?: { label: string; amount: number }[];
}

/**
 * A specific offense characteristic the user has turned on. Structured guidelines
 * supply these from their own definitions; unstructured ones accept free-form
 * entries the user cites themselves.
 */
export interface SelectedSoc {
  id: string;
  /** Present for free-form entries on unstructured guidelines. */
  customLevels?: number;
  customLabel?: string;
  customCitation?: string;
}

export interface Chapter3Selections {
  /** § 3A1.1(a) hate crime motivation (+3). */
  hateCrime?: boolean;
  /** § 3A1.1(b)(1) vulnerable victim (+2), (b)(2) large number of vulnerable victims (+2 more). */
  vulnerableVictim?: boolean;
  vulnerableVictimMany?: boolean;
  /** § 3A1.2 official victim (+3, or +6 under (c)). */
  officialVictim?: 'none' | 'standard' | 'assaultive';
  /** § 3A1.3 restraint of victim (+2). */
  restraintOfVictim?: boolean;
  /** § 3A1.4 terrorism (+12, floor of level 32, forces CHC VI). */
  terrorism?: boolean;
  /** § 3B1.1 aggravating role. */
  aggravatingRole?: 'none' | 'a' | 'b' | 'c';
  /** § 3B1.2 mitigating role. */
  mitigatingRole?: 'none' | 'minimal' | 'intermediate' | 'minor';
  /** § 3B1.3 abuse of position of trust or special skill (+2). */
  abuseOfTrust?: boolean;
  /** § 3C1.1 obstruction (+2). */
  obstruction?: boolean;
  /** § 2X1.1(b) inchoate reduction (-3) — lives here for per-count application. */
  inchoateReduction?: boolean;
  /** Set when the substantive offense was substantially completed, defeating the reduction. */
  substantiallyCompleted?: boolean;
}

export interface CountInput {
  id: string;
  label?: string;
  /** Statute of conviction, normalized (e.g. "21:841(a)(1)"). */
  statuteId?: string;
  /** Explicit guideline override, used when Appendix A has no entry or the user disagrees. */
  guidelineOverride?: string;
  /** Statutory penalty overrides where the default table is wrong for these facts. */
  statutoryMaxMonths?: number | null;
  statutoryMinMonths?: number;
  /** Free-form base offense level for unstructured guidelines. */
  manualBaseLevel?: number;
  socs: SelectedSoc[];
  drugs?: DrugEntry[];
  loss?: LossInput;
  /** § 2C1.1 value of the benefit, where it exceeds payment value and government loss. */
  benefitValue?: number;
  chapter3: Chapter3Selections;
  /** § 924(c) and § 1028A counts: mandatory, consecutive, excluded from grouping. */
  consecutiveMandatory?: {
    months: number;
    citation: string;
    label: string;
  };
  /** Number of victims, for § 2B1.1(b)(2). */
  victimCount?: number;
  substantialHardship?: boolean;
  /** 21 U.S.C. § 851 information filed, raising the drug statutory penalties. */
  section851Priors?: 0 | 1 | 2;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Chapter 4 inputs
// ---------------------------------------------------------------------------

export type PuertoRicoPenalCode = '1974' | '2004' | '2012';

export interface PriorConviction {
  id: string;
  description: string;
  statute?: string;
  /** ISO date. */
  offenseDate?: string;
  sentenceDate?: string;
  /** Custodial sentence imposed, in months. 0 for non-custodial. */
  sentenceImposedMonths: number;
  /** ISO date of release from any incarceration on this sentence. */
  releaseDate?: string;
  /** Committed before the defendant turned 18. */
  juvenile?: boolean;
  /** Consolidated with another prior for sentencing — § 4A1.2(a)(2) single sentence. */
  singleSentenceWith?: string;
  /** Predicate flags. Each is a legal conclusion the user makes, not one the app derives. */
  crimeOfViolence?: boolean;
  controlledSubstanceOffense?: boolean;
  accaViolentFelony?: boolean;
  accaSeriousDrugOffense?: boolean;
  /** Puerto Rico conviction, with the Penal Code in force at the time. */
  puertoRico?: { penalCode: PuertoRicoPenalCode };
  excludeFromScoring?: boolean;
  excludeReason?: string;
}

export interface CriminalHistoryInput {
  priors: PriorConviction[];
  /** § 4A1.1(e) — committed the instant offense while under any criminal justice sentence. */
  underCriminalJusticeSentence?: boolean;
  /** Override the computed category (e.g. the user has Probation's number). */
  categoryOverride?: CriminalHistoryCategory;
  careerOffender?: {
    claimed: boolean;
    /** § 4B1.1(a)(1) — at least 18 at the time of the instant offense. */
    ageAtLeast18?: boolean;
    /** § 4B1.1(a)(2) — instant offense is a felony crime of violence or controlled substance offense. */
    instantOffenseQualifies?: boolean;
  };
  acca?: {
    claimed: boolean;
  };
  zeroPointOffender?: Partial<Record<ZeroPointCriterion, boolean>>;
}

export type ZeroPointCriterion =
  | 'noCriminalHistoryPoints'
  | 'noTerrorismAdjustment'
  | 'noViolenceOrThreats'
  | 'noDeathOrSeriousInjury'
  | 'notSexOffense'
  | 'noSubstantialFinancialHardship'
  | 'noFirearmInConnection'
  | 'notCivilRightsOffense'
  | 'noHateCrimeOrVulnerableVictim'
  | 'noAggravatingRoleOrCCE';

// ---------------------------------------------------------------------------
// Chapter 3D grouping
// ---------------------------------------------------------------------------

export interface CountGroup {
  id: string;
  countIds: string[];
  /** Why these counts were grouped, for the audit trail. */
  rationale: string;
  citation: string;
}

// ---------------------------------------------------------------------------
// Departures, variances, plea
// ---------------------------------------------------------------------------

export interface Departure {
  id: string;
  kind: 'levels' | 'percent' | 'months';
  citation: string;
  label: string;
  /** Levels off, percent off the bottom of the range, or months off. */
  amount: number;
  notes?: string;
}

export interface VarianceEntry {
  factor: string;
  argument: string;
}

export interface PleaAgreement {
  /** The stipulated total offense level from the agreement. */
  stipulatedOffenseLevel?: number;
  stipulatedCategory?: CriminalHistoryCategory;
  /** Rule 11(c)(1)(C) agreed sentence in months. */
  agreedSentenceMonths?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// The case
// ---------------------------------------------------------------------------

export interface CaseInput {
  /** ISO date the instant offense was committed — drives § 1B1.11 and § 4A1.2 time limits. */
  offenseDate?: string;
  districtId: string;
  counts: CountInput[];
  /** User-supplied groupings. When absent the engine proposes them. */
  groups?: CountGroup[];
  criminalHistory: CriminalHistoryInput;
  /** § 3E1.1 acceptance of responsibility. */
  acceptance?: {
    granted: boolean;
    /** § 3E1.1(b) third point, available on government motion at level 16 or greater. */
    thirdPointMoved?: boolean;
  };
  /** § 5C1.2 / 18 U.S.C. § 3553(f) safety valve criteria. */
  safetyValve?: Partial<Record<SafetyValveCriterion, boolean>>;
  departures?: Departure[];
  variance?: {
    entries: VarianceEntry[];
    targetMonths?: number;
  };
  plea?: PleaAgreement;
  /** Estimate time to serve under 18 U.S.C. § 3624(b) and the First Step Act. */
  bopCredits?: {
    firstStepActEligible?: boolean;
  };
}

export type SafetyValveCriterion =
  | 'noMoreThan4CriminalHistoryPoints'
  | 'noPrior3PointOffense'
  | 'noPrior2PointViolentOffense'
  | 'noViolenceOrFirearm'
  | 'noDeathOrSeriousBodilyInjury'
  | 'notOrganizerOrCCE'
  | 'truthfulDisclosure';

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface CountResult {
  countId: string;
  guideline: string;
  guidelineTitle: string;
  confidence: Confidence;
  steps: Step[];
  /** Level after Chapter 2 and per-count Chapter 3 adjustments. */
  adjustedOffenseLevel: number;
  flags: Flag[];
  /** True for § 924(c) / § 1028A counts, which do not group. */
  excludedFromGrouping: boolean;
}

export interface GroupResult {
  group: CountGroup;
  offenseLevel: number;
  /** § 3D1.3 — which count set the group's level. */
  drivingCountId: string;
  units: number;
}

export interface CriminalHistoryResult {
  points: number;
  category: CriminalHistoryCategory;
  steps: Step[];
  flags: Flag[];
  careerOffenderApplies: boolean;
  accaApplies: boolean;
  zeroPointApplies: boolean;
  /** Set when § 4B1.1 or § 3A1.4 overrode the computed category. */
  categoryOverriddenBy?: string;
}

export interface StatutoryResult {
  /** Highest statutory maximum across grouped counts, in months. null = life. */
  maxMonths: number | null;
  /** Highest mandatory minimum across grouped counts. */
  minMonths: number;
  /** Sum of all statutory maxima, for § 5G1.2(d) stacking. */
  aggregateMaxMonths: number | null;
  consecutiveCounts: {
    countId: string;
    label: string;
    months: number;
    citation: string;
  }[];
  consecutiveTotalMonths: number;
  flags: Flag[];
}

export interface Chapter5Result {
  supervisedRelease: { min: number; max: number | null; citation: string; note?: string };
  fine: { min: number; max: number; citation: string };
  probationAvailable: boolean;
  probationNote: string;
  zone: Zone;
  zoneNote: string;
}

export interface SentenceLadderRung {
  label: string;
  citation?: string;
  range: MonthRange;
  detail?: string;
}

export interface CaseResult {
  edition: string;
  computedAt: string;

  counts: CountResult[];
  groups: GroupResult[];
  groupingProposed: boolean;

  /** § 3D1.4 combined offense level, before acceptance. */
  combinedOffenseLevel: number;
  groupingSteps: Step[];

  /** After acceptance and any Chapter 4 floors or overrides. */
  totalOffenseLevel: number;
  finalSteps: Step[];

  criminalHistory: CriminalHistoryResult;

  /** Straight off the Sentencing Table, before any statutory adjustment. */
  tableRange: MonthRange;
  /** After § 5G1.1 clamping and § 5G1.2(d) stacking. */
  guidelineRange: MonthRange;

  statutory: StatutoryResult;
  chapter5: Chapter5Result;

  /** Advisory range → departures → variance, as an arithmetic ladder. */
  ladder: SentenceLadderRung[];

  /** Grouped-counts range, consecutive terms, and aggregate — shown separately. */
  aggregate: {
    groupedCountsRange: MonthRange;
    consecutiveMonths: number;
    totalRange: MonthRange;
  };

  bopEstimate?: {
    goodTimeMonths: number;
    firstStepActMonths: number;
    estimatedServeRange: MonthRange;
    note: string;
  };

  plea?: {
    stipulatedRange: MonthRange;
    stipulatedLevel: number;
    stipulatedCategory: CriminalHistoryCategory;
    gapMonths: { min: number; max: number | null };
  };

  flags: Flag[];
}
