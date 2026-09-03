import type { CaseFacts } from './types';

export interface CriminalHistory {
  /** Points from prior sentences, under §4A1.1(a)–(d). */
  priors: number;
  /** The §4A1.1(e) status point: 1 or 0. */
  status: number;
  /** Priors plus status point. */
  total: number;
}

/**
 * Criminal history, broken out so a worksheet can show the status point on its
 * own line. In guided mode the priors are summed and §4A1.1(e) adds a status
 * point only once the subtotal under (a)–(d) reaches 7; in direct mode the
 * practitioner's own figure is taken as given and nothing is added to it.
 */
export function criminalHistory(facts: CaseFacts): CriminalHistory {
  if (facts.chMode === 'direct') {
    const priors = Number(facts.directPoints || 0);
    return { priors, status: 0, total: priors };
  }
  const priors = facts.priors.reduce((total, prior) => total + prior.pts, 0);
  const status = facts.statusPoints && priors >= 7 ? 1 : 0;
  return { priors, status, total: priors + status };
}

/** Total criminal history points. */
export function criminalHistoryPoints(facts: CaseFacts): number {
  return criminalHistory(facts).total;
}

/**
 * The subsection a prior sentence is counted under: §4A1.1(a) for a sentence of
 * imprisonment exceeding one year and one month, (b) for at least sixty days,
 * and (c) for each other prior sentence.
 */
export function priorSubsection(points: number): { cite: string; excerpt: string } {
  if (points >= 3) {
    return { cite: '§4A1.1(a)', excerpt: 'sentence of imprisonment exceeding one year and one month' };
  }
  if (points === 2) {
    return { cite: '§4A1.1(b)', excerpt: 'sentence of imprisonment of at least sixty days' };
  }
  return { cite: '§4A1.1(c)', excerpt: 'prior sentence not counted under (a) or (b)' };
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
