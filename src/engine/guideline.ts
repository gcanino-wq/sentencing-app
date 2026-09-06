import type { CaseFacts } from './types';

/** Identifies a Chapter 2 guideline the app knows about. */
export type GuidelineId = '2B1.1' | '2K2.1' | '2D1.1' | '2D2.1';

/**
 * One specific offense characteristic a guideline found, as it appears on
 * Worksheet A line 2. `id` is stable across recalculation so annotations and
 * the edit sheet can key off it.
 */
export interface OffenseCharacteristic {
  id: string;
  /** Official line number within Worksheet A line 2, e.g. "2(b)". */
  num: string;
  label: string;
  cite: string;
  /** Why the characteristic reads the way it does, on the facts entered. */
  excerpt: string;
  levels: number;
}

/** What a Chapter 2 guideline contributes, before Chapter 3 adjustments. */
export interface ChapterTwo {
  base: number;
  baseCite: string;
  baseExcerpt: string;
  characteristics: OffenseCharacteristic[];
  /**
   * Base plus every characteristic, after any cumulative cap the guideline
   * imposes. Set `cap` when one bound the total.
   */
  total: number;
  cap?: { levels: number; cite: string };
}

/**
 * A Chapter 2 guideline. `compute` is present only once the guideline is
 * implemented; the registry lists the rest so the statute search can report
 * honestly that a count maps here but does not yet calculate.
 */
export interface Guideline {
  id: GuidelineId;
  cite: string;
  title: string;
  compute?: (facts: CaseFacts) => ChapterTwo;
}

/** Sums a Chapter 2 result, applying a cumulative cap if the guideline has one. */
export function chapterTwoTotal(
  base: number,
  characteristics: readonly OffenseCharacteristic[],
  cap?: { levels: number; cite: string },
): Pick<ChapterTwo, 'total' | 'cap'> {
  const sum = characteristics.reduce((running, soc) => running + soc.levels, base);
  if (cap && sum > cap.levels) return { total: cap.levels, cap };
  return { total: sum };
}
