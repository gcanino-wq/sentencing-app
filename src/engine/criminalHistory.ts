import type { CaseFacts } from './types';

/**
 * Total criminal history points. In guided mode the priors are summed and
 * §4A1.1(e) adds a status point only once the subtotal reaches 7; in direct
 * mode the practitioner's own figure is taken as given.
 */
export function criminalHistoryPoints(facts: CaseFacts): number {
  if (facts.chMode === 'direct') return Number(facts.directPoints || 0);
  let points = facts.priors.reduce((total, prior) => total + prior.pts, 0);
  if (facts.statusPoints && points >= 7) points += 1;
  return points;
}

/** 0-based index into CATS for a point total, per Chapter 5, Part A. */
export function categoryIndex(points: number): number {
  if (points <= 1) return 0;
  if (points <= 3) return 1;
  if (points <= 6) return 2;
  if (points <= 9) return 3;
  if (points <= 12) return 4;
  return 5;
}
