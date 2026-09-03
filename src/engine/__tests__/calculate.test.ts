import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { CATS } from '../sentencingTable';
import { DEFAULT_FACTS } from '../../state/defaults';
import type { CaseFacts } from '../types';

const facts = (patch: Partial<CaseFacts> = {}): CaseFacts => ({ ...DEFAULT_FACTS, ...patch });

describe('calculate', () => {
  it('runs the preloaded worked example end to end', () => {
    const c = calculate(facts());
    // 7 base + 14 loss + 2 victims + 2 sophisticated means = 25 adjusted,
    // less 3 for acceptance = 22, with 2 criminal history points -> Category II.
    expect(c.base).toBe(7);
    expect(c.loss).toBe(14);
    expect(c.vic).toBe(2);
    expect(c.soc).toBe(2);
    expect(c.adjusted).toBe(25);
    expect(c.acc).toBe(-3);
    expect(c.total).toBe(22);
    expect(c.pts).toBe(2);
    expect(CATS[c.ci]).toBe('II');
    expect(c.range.text).toBe('46–57');
    expect(c.zone).toBe('D');
  });

  it('moves the range when the loss drops below a threshold', () => {
    const lower = calculate(facts({ loss: 600_000 }));
    expect(lower.loss).toBe(14);
    expect(lower.range.text).toBe('46–57');

    const lowest = calculate(facts({ loss: 500_000 }));
    expect(lowest.loss).toBe(12);
    expect(lowest.total).toBe(20);
    expect(lowest.range.text).toBe('37–46');
  });

  it('drops the acceptance reduction on request without touching the rest', () => {
    const base = calculate(facts());
    const trial = calculate(facts(), { noAcceptance: true });
    expect(trial.acc).toBe(0);
    expect(trial.adjusted).toBe(base.adjusted);
    expect(trial.total).toBe(base.adjusted);
    expect(trial.range.text).toBe('63–78');
  });

  it('floors the total offense level at 1', () => {
    const c = calculate(facts({ statMax: 10, loss: 0, victims: 0, socs: [], role: 'minimal', acceptance: 3 }));
    expect(c.adjusted).toBe(2);
    expect(c.total).toBe(1);
  });

  it('carries obstruction and role into the adjusted level', () => {
    const c = calculate(facts({ role: 'org', obstruction: true }));
    expect(c.role).toBe(4);
    expect(c.obs).toBe(2);
    expect(c.adjusted).toBe(31);
  });
});
