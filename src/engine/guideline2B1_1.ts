import { money } from './format';
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
 * Levels added under §2B1.1(b)(2). Subsection (b)(2)(A) is a single 2-level
 * increase reached by any one of three alternatives — 10 or more victims,
 * mass-marketing, or substantial financial hardship to one or more victims —
 * so mass-marketing is scored here rather than as a separate characteristic.
 * (B) and (C) escalate on hardship alone. Only the highest prong counts.
 */
export function victimAdjustment(
  facts: Pick<CaseFacts, 'hardship' | 'victims' | 'socs'>,
): number {
  if (facts.hardship === '25') return 6;
  if (facts.hardship === '5') return 4;
  if (facts.hardship === '1' || Number(facts.victims) >= 10) return 2;
  return facts.socs.includes('mass') ? 2 : 0;
}

/** Which alternative under §2B1.1(b)(2)(A) the 2-level increase rests on. */
export function victimProng(facts: Pick<CaseFacts, 'hardship' | 'victims' | 'socs'>): string {
  if (facts.hardship === '25') return 'substantial financial hardship to 25 or more victims';
  if (facts.hardship === '5') return 'substantial financial hardship to 5 or more victims';
  if (facts.hardship === '1') return 'substantial financial hardship to one or more victims';
  if (Number(facts.victims) >= 10) return facts.victims + ' victims · 10 or more';
  if (facts.socs.includes('mass')) return 'committed through mass-marketing';
  return facts.victims + ' victims · fewer than 10, no hardship finding';
}

/**
 * Two levels apiece for the characteristics scored outside §2B1.1(b)(2):
 * sophisticated means under (b)(10)(C) and charitable or governmental
 * misrepresentation under (b)(9)(A). Mass-marketing is not scored here — it is
 * an alternative under (b)(2)(A) and would otherwise be counted twice.
 */
export function socAdjustment(socs: readonly SocKey[]): number {
  const scored: SocKey[] = ['soph', 'charity'];
  return scored.filter((key) => socs.includes(key)).length * 2;
}

/** The subsection letter §2B1.1(b)(1) gives a loss adjustment, (A) through (P). */
export function lossSubsection(adjustment: number): string {
  return String.fromCharCode(65 + adjustment / 2);
}

/** The loss threshold a §2B1.1(b)(1) adjustment rests on, as the line reads it. */
export function lossExcerpt(adjustment: number): string {
  const row = LOSS_TABLE.find(([, levels]) => levels === adjustment);
  return row ? 'more than ' + money(row[0]) : money(6_500) + ' or less';
}

/** The subsection §2B1.1(b)(2) gives a victim or hardship adjustment. */
export function victimCite(adjustment: number): string {
  if (adjustment === 6) return '§2B1.1(b)(2)(C)';
  if (adjustment === 4) return '§2B1.1(b)(2)(B)';
  if (adjustment === 2) return '§2B1.1(b)(2)(A)';
  return '§2B1.1(b)(2)';
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

/**
 * How the specific offense characteristics read on Worksheet A line 2(d).
 * Mass-marketing is absent by design: it is reported on line 2(c) with the
 * rest of §2B1.1(b)(2).
 */
export function socLabels(socs: readonly SocKey[]): string[] {
  const labels: Array<[SocKey, string]> = [
    ['soph', 'sophisticated means, +2'],
    ['charity', 'charitable misrepresentation, +2'],
  ];
  return labels.filter(([key]) => socs.includes(key)).map(([, label]) => label);
}

/** The subsections Worksheet A line 2(d) rests on, for the characteristics found. */
export function socCite(socs: readonly SocKey[]): string {
  const cites: Array<[SocKey, string]> = [
    ['charity', '§2B1.1(b)(9)(A)'],
    ['soph', '§2B1.1(b)(10)(C)'],
  ];
  const found = cites.filter(([key]) => socs.includes(key)).map(([, cite]) => cite);
  return found.length ? found.join(' · ') : '§2B1.1(b)';
}
