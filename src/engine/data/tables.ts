import type { LossInput, OffenseClass } from '../types';

/**
 * Loss Table — U.S.S.G. § 2B1.1(b)(1).
 * Thresholds are exclusive floors: the increase applies to loss *more than* the
 * stated amount. VERIFY against § 2B1.1(b)(1).
 */
export const LOSS_TABLE: readonly { moreThan: number; increase: number }[] = [
  { moreThan: 550_000_000, increase: 30 },
  { moreThan: 250_000_000, increase: 28 },
  { moreThan: 150_000_000, increase: 26 },
  { moreThan: 65_000_000, increase: 24 },
  { moreThan: 25_000_000, increase: 22 },
  { moreThan: 9_500_000, increase: 20 },
  { moreThan: 3_500_000, increase: 18 },
  { moreThan: 1_500_000, increase: 16 },
  { moreThan: 550_000, increase: 14 },
  { moreThan: 250_000, increase: 12 },
  { moreThan: 150_000, increase: 10 },
  { moreThan: 95_000, increase: 8 },
  { moreThan: 40_000, increase: 6 },
  { moreThan: 15_000, increase: 4 },
  { moreThan: 6_500, increase: 2 },
  { moreThan: -1, increase: 0 },
];

export function lossIncrease(amount: number): number {
  for (const row of LOSS_TABLE) {
    if (amount > row.moreThan) return row.increase;
  }
  return 0;
}

export function nextLossThreshold(amount: number): { increase: number; atAmount: number } | null {
  const higher = [...LOSS_TABLE].reverse().find((row) => row.moreThan >= amount);
  return higher && higher.moreThan >= 0
    ? { increase: higher.increase, atAmount: higher.moreThan }
    : null;
}

/**
 * Resolve the loss figure the guideline actually uses.
 *
 * § 2B1.1 cmt. n.3(A): loss is the greater of actual or intended loss.
 * cmt. n.3(B): gain is a fallback only where loss cannot reasonably be determined.
 * cmt. n.3(E): credits are subtracted from loss, not from gain.
 */
export function resolveLoss(input: LossInput | undefined): {
  amount: number;
  basis: 'actual' | 'intended' | 'gain' | 'none';
  creditsApplied: number;
  gross: number;
} {
  if (!input) return { amount: 0, basis: 'none', creditsApplied: 0, gross: 0 };
  const actual = input.actualLoss ?? 0;
  const intended = input.intendedLoss ?? 0;
  const credits = (input.credits ?? []).reduce((sum, c) => sum + (c.amount || 0), 0);

  if (actual === 0 && intended === 0) {
    const gain = input.gain ?? 0;
    if (gain > 0) return { amount: gain, basis: 'gain', creditsApplied: 0, gross: gain };
    return { amount: 0, basis: 'none', creditsApplied: 0, gross: 0 };
  }

  const gross = Math.max(actual, intended);
  const basis = intended > actual ? 'intended' : 'actual';
  return { amount: Math.max(0, gross - credits), basis, creditsApplied: credits, gross };
}

/**
 * Tax Loss Table — § 2T4.1. Each row is the inclusive floor.
 * VERIFY against § 2T4.1.
 */
export const TAX_LOSS_TABLE: readonly { atLeast: number; level: number }[] = [
  { atLeast: 150_000_000, level: 32 },
  { atLeast: 65_000_000, level: 30 },
  { atLeast: 25_000_000, level: 28 },
  { atLeast: 9_500_000, level: 26 },
  { atLeast: 3_500_000, level: 24 },
  { atLeast: 1_500_000, level: 22 },
  { atLeast: 550_000, level: 20 },
  { atLeast: 250_000, level: 18 },
  { atLeast: 100_000, level: 16 },
  { atLeast: 40_000, level: 14 },
  { atLeast: 15_000, level: 12 },
  { atLeast: 6_500, level: 10 },
  { atLeast: 2_500, level: 8 },
  { atLeast: 0, level: 6 },
];

export function taxLossLevel(amount: number): number {
  for (const row of TAX_LOSS_TABLE) {
    if (amount >= row.atLeast) return row.level;
  }
  return 6;
}

/**
 * Fine Table — § 5E1.2(c)(3). VERIFY against § 5E1.2(c)(3).
 * 18 U.S.C. § 3571 alternatives often exceed these figures.
 */
export const FINE_TABLE: readonly { maxLevel: number; min: number; max: number }[] = [
  { maxLevel: 3, min: 200, max: 9_500 },
  { maxLevel: 5, min: 500, max: 9_500 },
  { maxLevel: 7, min: 1_000, max: 9_500 },
  { maxLevel: 9, min: 2_000, max: 20_000 },
  { maxLevel: 11, min: 4_000, max: 40_000 },
  { maxLevel: 13, min: 5_500, max: 55_000 },
  { maxLevel: 15, min: 7_500, max: 75_000 },
  { maxLevel: 17, min: 10_000, max: 95_000 },
  { maxLevel: 19, min: 10_000, max: 100_000 },
  { maxLevel: 22, min: 15_000, max: 150_000 },
  { maxLevel: 25, min: 20_000, max: 200_000 },
  { maxLevel: 28, min: 25_000, max: 250_000 },
  { maxLevel: 31, min: 30_000, max: 300_000 },
  { maxLevel: 34, min: 35_000, max: 350_000 },
  { maxLevel: 37, min: 40_000, max: 400_000 },
  { maxLevel: 43, min: 50_000, max: 500_000 },
];

export function fineRange(offenseLevel: number): { min: number; max: number } {
  const row = FINE_TABLE.find((r) => offenseLevel <= r.maxLevel) ?? FINE_TABLE[FINE_TABLE.length - 1]!;
  return { min: row.min, max: row.max };
}

/**
 * § 3D1.4 unit table. Units are counted as: 1 for the highest group and each
 * group within 4 levels of it, 1/2 for groups 5-8 levels less serious, and 0 for
 * groups 9 or more levels less serious.
 */
export function unitIncrease(units: number): number {
  if (units <= 1) return 0;
  if (units <= 1.5) return 1;
  if (units <= 2) return 2;
  if (units <= 3) return 3;
  if (units <= 5) return 4;
  return 5;
}

/**
 * Career Offender table — § 4B1.1(b), keyed on the statutory maximum for the
 * instant offense of conviction. `null` months means life.
 * VERIFY against § 4B1.1(b).
 */
export function careerOffenderLevel(statutoryMaxMonths: number | null): number {
  if (statutoryMaxMonths === null) return 37; // life
  const years = statutoryMaxMonths / 12;
  if (years >= 25) return 34;
  if (years >= 20) return 32;
  if (years >= 15) return 29;
  if (years >= 10) return 24;
  if (years >= 5) return 17;
  return 12;
}

/** Offense classification — 18 U.S.C. § 3559(a). `null` max means life. */
export function offenseClass(statutoryMaxMonths: number | null): OffenseClass {
  if (statutoryMaxMonths === null) return 'A';
  const years = statutoryMaxMonths / 12;
  if (years >= 25) return 'B';
  if (years >= 10) return 'C';
  if (years >= 5) return 'D';
  if (years >= 1) return 'E';
  if (statutoryMaxMonths > 6) return 'misdA';
  if (statutoryMaxMonths > 1) return 'misdB';
  return 'misdC';
}

/**
 * Supervised release term — § 5D1.2(a). A statutory minimum (common in drug
 * cases under 21 U.S.C. § 841(b)) overrides the bottom of this range.
 */
export function supervisedReleaseRange(cls: OffenseClass): {
  min: number;
  max: number | null;
  citation: string;
} {
  switch (cls) {
    case 'A':
    case 'B':
      return { min: 24, max: 60, citation: '§ 5D1.2(a)(1)' };
    case 'C':
    case 'D':
      return { min: 12, max: 36, citation: '§ 5D1.2(a)(2)' };
    default:
      return { min: 0, max: 12, citation: '§ 5D1.2(a)(3)' };
  }
}
