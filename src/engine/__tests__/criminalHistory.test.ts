import { describe, expect, it } from 'vitest';
import { categoryIndex, criminalHistoryPoints } from '../criminalHistory';
import { CATS } from '../sentencingTable';
import { DEFAULT_FACTS } from '../../state/defaults';
import type { CaseFacts } from '../types';

const facts = (patch: Partial<CaseFacts> = {}): CaseFacts => ({ ...DEFAULT_FACTS, ...patch });

describe('criminal history', () => {
  it('sums the priors in guided mode', () => {
    expect(criminalHistoryPoints(facts())).toBe(2);
    expect(
      criminalHistoryPoints(
        facts({ priors: [{ desc: 'a', meta: '', pts: 3 }, { desc: 'b', meta: '', pts: 1 }] }),
      ),
    ).toBe(4);
  });

  it('takes the practitioner figure in direct mode', () => {
    expect(criminalHistoryPoints(facts({ chMode: 'direct', directPoints: 9 }))).toBe(9);
    expect(criminalHistoryPoints(facts({ chMode: 'direct' }))).toBe(0);
  });

  it('adds the §4A1.1(e) status point only at 7 or more points', () => {
    const withStatus = (pts: number) =>
      criminalHistoryPoints(
        facts({ statusPoints: true, priors: [{ desc: 'p', meta: '', pts }] }),
      );
    expect(withStatus(6)).toBe(6);
    expect(withStatus(7)).toBe(8);
  });

  it('maps point totals onto the six categories', () => {
    const boundaries: Array<[number, string]> = [
      [0, 'I'], [1, 'I'], [2, 'II'], [3, 'II'], [4, 'III'], [6, 'III'],
      [7, 'IV'], [9, 'IV'], [10, 'V'], [12, 'V'], [13, 'VI'], [40, 'VI'],
    ];
    for (const [points, category] of boundaries) {
      expect(CATS[categoryIndex(points)], points + ' points').toBe(category);
    }
  });
});
