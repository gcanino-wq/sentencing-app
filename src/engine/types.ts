import type { GuidelineId } from './guideline';

/** How the criminal history score is arrived at. */
export type CriminalHistoryMode = 'guided' | 'direct';

/** Specific offense characteristics the wizard offers as judgment calls. */
export type SocKey = 'soph' | 'mass' | 'charity';

/** §2B1.1(b)(2) victim-count and financial-hardship findings. */
export type HardshipFinding = 'none' | '1' | '5' | '25';

/** Chapter 3, Part B role in the offense. */
export type RoleFinding = 'none' | 'org' | 'mgr' | 'sup' | 'minor' | 'minimal';

export interface PriorSentence {
  desc: string;
  meta: string;
  pts: number;
}

/** Every fact the calculation reads. */
export interface CaseFacts {
  /** The Chapter 2 guideline the count is scored under. Defaults to §2B1.1. */
  guideline?: GuidelineId;
  /** Statutory maximum for the count of conviction, in years. */
  statMax: number;
  /** Loss under §2B1.1(b)(1), in dollars. */
  loss: number;
  victims: number;
  hardship: HardshipFinding;
  socs: SocKey[];
  role: RoleFinding;
  obstruction: boolean;
  /** Levels off under §3E1.1: 3, 2 or 0. */
  acceptance: number;
  chMode: CriminalHistoryMode;
  /** Criminal history points, when chMode is 'direct'. */
  directPoints?: number;
  /** §4A1.1(e) — offense committed under a criminal justice sentence. */
  statusPoints: boolean;
  priors: PriorSentence[];
}
