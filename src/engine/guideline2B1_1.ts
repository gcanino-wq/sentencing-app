import type { CaseFacts, RoleFinding, SocKey } from './types';

/**
 * §2B1.1(b)(1) loss table, highest threshold first. Each entry is
 * [more than this many dollars, add this many levels].
 */
export const LOSS_TABLE: ReadonlyArray<readonly [number, number]> = [
  [550_000_000, 30],
  [250_000_000, 28],
  [150_000_000, 26],
  [65_000_000, 24],
  [25_000_000, 22],
  [9_500_000, 20],
  [3_500_000, 18],
  [1_500_000, 16],
  [550_000, 14],
  [250_000, 12],
  [150_000, 10],
  [95_000, 8],
  [40_000, 6],
  [15_000, 4],
  [6_500, 2],
];

/** Base offense level under §2B1.1(a): 7 at a 20-year statutory maximum, else 6. */
export function baseLevel(statMax: number): number {
  return statMax >= 20 ? 7 : 6;
}

/** Levels added for loss under §2B1.1(b)(1). */
export function lossAdjustment(loss: number): number {
  const row = LOSS_TABLE.find(([threshold]) => loss > threshold);
  return row ? row[1] : 0;
}

/**
 * Levels added under §2B1.1(b)(2) for victim count or substantial financial
 * hardship. Only the highest applicable prong counts.
 */
export function victimAdjustment(facts: Pick<CaseFacts, 'hardship' | 'victims'>): number {
  if (facts.hardship === '25') return 6;
  if (facts.hardship === '5') return 4;
  if (facts.hardship === '1' || Number(facts.victims) >= 10) return 2;
  return 0;
}

/** Two levels apiece for each specific offense characteristic found. */
export function socAdjustment(socs: readonly SocKey[]): number {
  const scored: SocKey[] = ['soph', 'mass', 'charity'];
  return scored.filter((key) => socs.includes(key)).length * 2;
}

/** Chapter 3, Part B role adjustment. */
export function roleAdjustment(role: RoleFinding): number {
  const table: Record<RoleFinding, number> = {
    org: 4,
    mgr: 3,
    sup: 2,
    minor: -2,
    minimal: -4,
    none: 0,
  };
  return table[role] ?? 0;
}

/** How the specific offense characteristics read on Worksheet A line 2(d). */
export function socLabels(socs: readonly SocKey[]): string[] {
  const labels: Array<[SocKey, string]> = [
    ['soph', 'sophisticated means, +2'],
    ['mass', 'mass-marketing, +2'],
    ['charity', 'charitable misrepresentation, +2'],
  ];
  return labels.filter(([key]) => socs.includes(key)).map(([, label]) => label);
}
