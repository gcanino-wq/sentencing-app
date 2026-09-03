import type { CriminalHistoryCategory, MonthRange, Zone } from '../types';

/**
 * Sentencing Table — U.S.S.G. Ch. 5, Pt. A.
 *
 * Rows are offense levels 1-43; columns are Criminal History Categories I-VI.
 * A `null` maximum means life. Level 43 is life in every column.
 *
 * VERIFY: encoded from memory. Confirm every cell against Ch. 5, Pt. A before
 * relying on output. A single transposed cell is a silent, plausible-looking error.
 */
const T = (min: number, max: number | null): MonthRange => ({ min, max });
const LIFE = T(360, null);
const LIFE_ONLY = T(0, null);

export const SENTENCING_TABLE: readonly (readonly MonthRange[])[] = [
  /*  1 */ [T(0, 6), T(0, 6), T(0, 6), T(0, 6), T(0, 6), T(0, 6)],
  /*  2 */ [T(0, 6), T(0, 6), T(0, 6), T(0, 6), T(0, 6), T(1, 7)],
  /*  3 */ [T(0, 6), T(0, 6), T(0, 6), T(0, 6), T(2, 8), T(3, 9)],
  /*  4 */ [T(0, 6), T(0, 6), T(0, 6), T(2, 8), T(4, 10), T(6, 12)],
  /*  5 */ [T(0, 6), T(0, 6), T(1, 7), T(4, 10), T(6, 12), T(9, 15)],
  /*  6 */ [T(0, 6), T(1, 7), T(2, 8), T(6, 12), T(9, 15), T(12, 18)],
  /*  7 */ [T(0, 6), T(2, 8), T(4, 10), T(8, 14), T(12, 18), T(15, 21)],
  /*  8 */ [T(0, 6), T(4, 10), T(6, 12), T(10, 16), T(15, 21), T(18, 24)],
  /*  9 */ [T(4, 10), T(6, 12), T(8, 14), T(12, 18), T(18, 24), T(21, 27)],
  /* 10 */ [T(6, 12), T(8, 14), T(10, 16), T(15, 21), T(21, 27), T(24, 30)],
  /* 11 */ [T(8, 14), T(10, 16), T(12, 18), T(18, 24), T(24, 30), T(27, 33)],
  /* 12 */ [T(10, 16), T(12, 18), T(15, 21), T(21, 27), T(27, 33), T(30, 37)],
  /* 13 */ [T(12, 18), T(15, 21), T(18, 24), T(24, 30), T(30, 37), T(33, 41)],
  /* 14 */ [T(15, 21), T(18, 24), T(21, 27), T(27, 33), T(33, 41), T(37, 46)],
  /* 15 */ [T(18, 24), T(21, 27), T(24, 30), T(30, 37), T(37, 46), T(41, 51)],
  /* 16 */ [T(21, 27), T(24, 30), T(27, 33), T(33, 41), T(41, 51), T(46, 57)],
  /* 17 */ [T(24, 30), T(27, 33), T(30, 37), T(37, 46), T(46, 57), T(51, 63)],
  /* 18 */ [T(27, 33), T(30, 37), T(33, 41), T(41, 51), T(51, 63), T(57, 71)],
  /* 19 */ [T(30, 37), T(33, 41), T(37, 46), T(46, 57), T(57, 71), T(63, 78)],
  /* 20 */ [T(33, 41), T(37, 46), T(41, 51), T(51, 63), T(63, 78), T(70, 87)],
  /* 21 */ [T(37, 46), T(41, 51), T(46, 57), T(57, 71), T(70, 87), T(77, 96)],
  /* 22 */ [T(41, 51), T(46, 57), T(51, 63), T(63, 78), T(77, 96), T(84, 105)],
  /* 23 */ [T(46, 57), T(51, 63), T(57, 71), T(70, 87), T(84, 105), T(92, 115)],
  /* 24 */ [T(51, 63), T(57, 71), T(63, 78), T(77, 96), T(92, 115), T(100, 125)],
  /* 25 */ [T(57, 71), T(63, 78), T(70, 87), T(84, 105), T(100, 125), T(110, 137)],
  /* 26 */ [T(63, 78), T(70, 87), T(78, 97), T(92, 115), T(110, 137), T(120, 150)],
  /* 27 */ [T(70, 87), T(78, 97), T(87, 108), T(100, 125), T(120, 150), T(130, 162)],
  /* 28 */ [T(78, 97), T(87, 108), T(97, 121), T(110, 137), T(130, 162), T(140, 175)],
  /* 29 */ [T(87, 108), T(97, 121), T(108, 135), T(121, 151), T(140, 175), T(151, 188)],
  /* 30 */ [T(97, 121), T(108, 135), T(121, 151), T(135, 168), T(151, 188), T(168, 210)],
  /* 31 */ [T(108, 135), T(121, 151), T(135, 168), T(151, 188), T(168, 210), T(188, 235)],
  /* 32 */ [T(121, 151), T(135, 168), T(151, 188), T(168, 210), T(188, 235), T(210, 262)],
  /* 33 */ [T(135, 168), T(151, 188), T(168, 210), T(188, 235), T(210, 262), T(235, 293)],
  /* 34 */ [T(151, 188), T(168, 210), T(188, 235), T(210, 262), T(235, 293), T(262, 327)],
  /* 35 */ [T(168, 210), T(188, 235), T(210, 262), T(235, 293), T(262, 327), T(292, 365)],
  /* 36 */ [T(188, 235), T(210, 262), T(235, 293), T(262, 327), T(292, 365), T(324, 405)],
  /* 37 */ [T(210, 262), T(235, 293), T(262, 327), T(292, 365), T(324, 405), LIFE],
  /* 38 */ [T(235, 293), T(262, 327), T(292, 365), T(324, 405), LIFE, LIFE],
  /* 39 */ [T(262, 327), T(292, 365), T(324, 405), LIFE, LIFE, LIFE],
  /* 40 */ [T(292, 365), T(324, 405), LIFE, LIFE, LIFE, LIFE],
  /* 41 */ [T(324, 405), LIFE, LIFE, LIFE, LIFE, LIFE],
  /* 42 */ [LIFE, LIFE, LIFE, LIFE, LIFE, LIFE],
  /* 43 */ [LIFE_ONLY, LIFE_ONLY, LIFE_ONLY, LIFE_ONLY, LIFE_ONLY, LIFE_ONLY],
];

export const MIN_OFFENSE_LEVEL = 1;
export const MAX_OFFENSE_LEVEL = 43;

/** Ch. 5, Pt. A, cmt. n.2: levels above 43 are treated as 43; below 1, as 1. */
export function clampOffenseLevel(level: number): number {
  return Math.min(MAX_OFFENSE_LEVEL, Math.max(MIN_OFFENSE_LEVEL, Math.round(level)));
}

export function lookupRange(
  offenseLevel: number,
  category: CriminalHistoryCategory,
): MonthRange {
  const row = SENTENCING_TABLE[clampOffenseLevel(offenseLevel) - 1];
  if (!row) throw new Error(`No sentencing table row for level ${offenseLevel}`);
  const cell = row[category - 1];
  if (!cell) throw new Error(`No sentencing table cell for category ${category}`);
  return cell;
}

/**
 * Zone placement, derived from the range minimum rather than hand-encoded per
 * cell — that is the structure of Ch. 5, Pt. A and it cannot drift out of sync
 * with the table above.
 */
export function zoneForRange(range: MonthRange): Zone {
  if (range.min === 0) return 'A';
  if (range.min <= 9) return 'B';
  if (range.min <= 12) return 'C';
  return 'D';
}

/** § 4A1.1 total points to Criminal History Category. */
export function categoryForPoints(points: number): CriminalHistoryCategory {
  if (points <= 1) return 1;
  if (points <= 3) return 2;
  if (points <= 6) return 3;
  if (points <= 9) return 4;
  if (points <= 12) return 5;
  return 6;
}

export function formatRange(range: MonthRange): string {
  if (range.max === null) return range.min === 0 ? 'Life' : `${range.min} months – Life`;
  if (range.min === range.max) return `${range.min} months`;
  return `${range.min}–${range.max} months`;
}
