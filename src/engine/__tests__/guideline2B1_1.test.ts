import { describe, expect, it } from 'vitest';
import {
  baseLevel,
  lossAdjustment,
  roleAdjustment,
  lossSubsection,
  socAdjustment,
  socCite,
  socLabels,
  victimAdjustment,
  victimProng,
} from '../guideline2B1_1';

describe('§2B1.1', () => {
  it('sets the base level off the statutory maximum', () => {
    expect(baseLevel(20)).toBe(7);
    expect(baseLevel(30)).toBe(7);
    expect(baseLevel(10)).toBe(6);
  });

  it('applies the loss table on a strictly-more-than basis', () => {
    expect(lossAdjustment(6_500)).toBe(0);
    expect(lossAdjustment(6_501)).toBe(2);
    expect(lossAdjustment(550_000)).toBe(12);
    expect(lossAdjustment(550_001)).toBe(14);
    expect(lossAdjustment(1_200_000)).toBe(14);
    expect(lossAdjustment(1_500_001)).toBe(16);
    expect(lossAdjustment(600_000_000)).toBe(30);
  });

  it('takes only the highest victim or hardship prong', () => {
    expect(victimAdjustment({ hardship: 'none', victims: 3, socs: [] })).toBe(0);
    expect(victimAdjustment({ hardship: 'none', victims: 12, socs: [] })).toBe(2);
    expect(victimAdjustment({ hardship: '1', victims: 1, socs: [] })).toBe(2);
    expect(victimAdjustment({ hardship: '5', victims: 1, socs: [] })).toBe(4);
    expect(victimAdjustment({ hardship: '25', victims: 1, socs: [] })).toBe(6);
  });

  it('reaches (b)(2)(A) through mass-marketing without counting it twice', () => {
    // (b)(2)(A) is one 2-level increase reached by any of three alternatives,
    // so mass-marketing on its own gets there and adds nothing on top of a
    // victim count or hardship finding that already did.
    expect(victimAdjustment({ hardship: 'none', victims: 3, socs: ['mass'] })).toBe(2);
    expect(victimAdjustment({ hardship: 'none', victims: 12, socs: ['mass'] })).toBe(2);
    expect(victimAdjustment({ hardship: '25', victims: 30, socs: ['mass'] })).toBe(6);
    expect(socAdjustment(['mass'])).toBe(0);
    expect(victimProng({ hardship: 'none', victims: 3, socs: ['mass'] })).toContain('mass-marketing');
  });

  it('adds two levels per specific offense characteristic outside (b)(2)', () => {
    expect(socAdjustment([])).toBe(0);
    expect(socAdjustment(['soph'])).toBe(2);
    expect(socAdjustment(['soph', 'mass', 'charity'])).toBe(4);
    expect(socLabels(['soph', 'charity'])).toEqual([
      'sophisticated means, +2',
      'charitable misrepresentation, +2',
    ]);
    expect(socCite(['soph'])).toBe('§2B1.1(b)(10)(C)');
    expect(socCite(['charity'])).toBe('§2B1.1(b)(9)(A)');
  });

  it('names the loss subsection the adjustment comes from', () => {
    expect(lossSubsection(0)).toBe('A');
    expect(lossSubsection(2)).toBe('B');
    expect(lossSubsection(14)).toBe('H');
    expect(lossSubsection(16)).toBe('I');
    expect(lossSubsection(30)).toBe('P');
  });

  it('scores role in the offense in both directions', () => {
    expect(roleAdjustment('org')).toBe(4);
    expect(roleAdjustment('mgr')).toBe(3);
    expect(roleAdjustment('sup')).toBe(2);
    expect(roleAdjustment('none')).toBe(0);
    expect(roleAdjustment('minor')).toBe(-2);
    expect(roleAdjustment('minimal')).toBe(-4);
  });
});
