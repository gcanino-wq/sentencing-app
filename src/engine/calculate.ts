import { categoryIndex, criminalHistoryPoints } from './criminalHistory';
import {
  baseLevel,
  lossAdjustment,
  roleAdjustment,
  socAdjustment,
  victimAdjustment,
} from './guideline2B1_1';
import { rangeFor, zoneFor, type GuidelineRange, type Zone } from './sentencingTable';
import type { CaseFacts } from './types';

export interface Calculation {
  /** §2B1.1(a) base offense level. */
  base: number;
  /** §2B1.1(b)(1) loss adjustment. */
  loss: number;
  /** §2B1.1(b)(2) victim / hardship adjustment. */
  vic: number;
  /** Specific offense characteristics under §2B1.1(b). */
  soc: number;
  /** Chapter 2 subtotal: base plus every specific offense characteristic. */
  ch2: number;
  /** Chapter 3, Part B role adjustment. */
  role: number;
  /** Chapter 3, Part C obstruction adjustment. */
  obs: number;
  /** Worksheet A line 6 — adjusted offense level before acceptance. */
  adjusted: number;
  /** §3E1.1 acceptance reduction, as a negative number. */
  acc: number;
  /** Worksheet A line 9 — total offense level, floored at 1. */
  total: number;
  /** Criminal history points. */
  pts: number;
  /** 0-based criminal history category index. */
  ci: number;
  range: GuidelineRange;
  zone: Zone;
}

export interface CalculationOptions {
  /** Recompute as though acceptance of responsibility were not found. */
  noAcceptance?: boolean;
}

/** Runs the whole worksheet, from base offense level through zone. */
export function calculate(facts: CaseFacts, options: CalculationOptions = {}): Calculation {
  const base = baseLevel(facts.statMax);
  const loss = lossAdjustment(Number(facts.loss));
  const vic = victimAdjustment(facts);
  const soc = socAdjustment(facts.socs);
  const ch2 = base + loss + vic + soc;

  const role = roleAdjustment(facts.role);
  const obs = facts.obstruction ? 2 : 0;
  const adjusted = ch2 + role + obs;

  const acc = options.noAcceptance ? 0 : -Number(facts.acceptance || 0);
  const total = Math.max(1, adjusted + acc);

  const pts = criminalHistoryPoints(facts);
  const ci = categoryIndex(pts);
  const range = rangeFor(total, ci);

  return { base, loss, vic, soc, ch2, role, obs, adjusted, acc, total, pts, ci, range, zone: zoneFor(range) };
}
