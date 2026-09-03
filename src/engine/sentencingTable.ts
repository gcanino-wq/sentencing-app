/**
 * Chapter 5, Part A — Sentencing Table.
 *
 * MINS[offenseLevel] holds the minimum of the range, in months, for each of the
 * six criminal history categories. The maximum is not stored: the table is
 * constructed so that each range's top is the greater of (min + 6) months and
 * 125% of the minimum, capped at 360 months / life.
 */
export const MINS: Record<number, readonly number[]> = {
  1: [0, 0, 0, 0, 0, 0],
  2: [0, 0, 0, 0, 0, 1],
  3: [0, 0, 0, 0, 2, 3],
  4: [0, 0, 0, 2, 4, 6],
  5: [0, 0, 1, 4, 6, 9],
  6: [0, 1, 2, 6, 9, 12],
  7: [0, 2, 4, 8, 12, 15],
  8: [0, 4, 6, 10, 15, 18],
  9: [4, 6, 8, 12, 18, 21],
  10: [6, 8, 10, 15, 21, 24],
  11: [8, 10, 12, 18, 24, 27],
  12: [10, 12, 15, 21, 27, 30],
  13: [12, 15, 18, 24, 30, 33],
  14: [15, 18, 21, 27, 33, 37],
  15: [18, 21, 24, 30, 37, 41],
  16: [21, 24, 27, 33, 41, 46],
  17: [24, 27, 30, 37, 46, 51],
  18: [27, 30, 33, 41, 51, 57],
  19: [30, 33, 37, 46, 57, 63],
  20: [33, 37, 41, 51, 63, 70],
  21: [37, 41, 46, 57, 70, 78],
  22: [41, 46, 51, 63, 78, 84],
  23: [46, 51, 57, 70, 84, 92],
  24: [51, 57, 63, 77, 92, 100],
  25: [57, 63, 70, 84, 100, 110],
  26: [63, 70, 78, 92, 110, 120],
  27: [70, 78, 87, 100, 120, 130],
  28: [78, 87, 97, 110, 130, 140],
  29: [87, 97, 108, 121, 140, 151],
  30: [97, 108, 121, 135, 151, 168],
  31: [108, 121, 135, 151, 168, 188],
  32: [121, 135, 151, 168, 188, 210],
  33: [135, 151, 168, 188, 210, 235],
  34: [151, 168, 188, 210, 235, 262],
  35: [168, 188, 210, 235, 262, 292],
  36: [188, 210, 235, 262, 292, 324],
  37: [210, 235, 262, 292, 324, 360],
  38: [235, 262, 292, 324, 360, 360],
  39: [262, 292, 324, 360, 360, 360],
  40: [292, 324, 360, 360, 360, 360],
  41: [324, 360, 360, 360, 360, 360],
  42: [360, 360, 360, 360, 360, 360],
};

/** Lowest and highest offense levels the table above covers. */
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 42;

export const CATS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
export type CriminalHistoryCategory = (typeof CATS)[number];

export type Zone = 'A' | 'B' | 'C' | 'D';

export interface GuidelineRange {
  /** Bottom of the range, in months. */
  min: number;
  /** Top of the range, in months. 360 stands in for life. */
  max: number;
  /** How the range prints, e.g. "63–78" or "360–life". */
  text: string;
}

/**
 * Looks a range up on the sentencing table. `level` is clamped to the table's
 * bounds and `categoryIndex` is a 0-based index into CATS.
 */
export function rangeFor(level: number, categoryIndex: number): GuidelineRange {
  const clamped = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
  const min = MINS[clamped][categoryIndex];
  const max = Math.max(min + 6, Math.floor(min * 1.25));
  return { min, max, text: min >= 360 ? '360–life' : min + '–' + max };
}

/** Sentencing zone under §5C1.1, derived from the top of the range. */
export function zoneFor(range: GuidelineRange): Zone {
  if (range.max <= 6) return 'A';
  if (range.max <= 15) return 'B';
  if (range.max <= 18) return 'C';
  return 'D';
}

/** What the zone means for probation and split sentences, under §5C1.1. */
export function zoneCopy(zone: Zone): string {
  return {
    A: 'Probation is available without a condition of confinement. Any sentence within the range may be non-custodial.',
    B: 'Probation is available only with a condition of intermittent confinement, community confinement, or home detention.',
    C: 'At least half the minimum must be served in prison; the remainder may be community confinement or home detention.',
    D: 'Imprisonment is required. Probation is not authorized and no portion may be served in community confinement.',
  }[zone];
}
