import { categoryIndex, criminalHistory } from './criminalHistory';
import type { ChapterTwo } from './guideline';
import { roleAdjustment } from './guideline2B1_1';
import { guidelineFor } from './guidelines';
import { rangeFor, zoneFor, type GuidelineRange, type Zone } from './sentencingTable';
import type { CaseFacts } from './types';

export interface Calculation {
  /** The Chapter 2 guideline this case was scored under. */
  ch2Result: ChapterTwo;
  /** Chapter 2 base offense level. */
  base: number;
  /** §2B1.1(b)(1) loss adjustment. Zero under guidelines without a loss table. */
  loss: number;
  /** §2B1.1(b)(2) victim / hardship adjustment. */
  vic: number;
  /** The remaining specific offense characteristics. */
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
  /** Criminal history points from prior sentences, §4A1.1(a)–(d). */
  priorPts: number;
  /** The §4A1.1(e) status point: 1 or 0. */
  status: number;
  /** Total criminal history points. */
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
  const guideline = guidelineFor(facts.guideline);
  if (!guideline.compute) {
    throw new Error(
      guideline.cite + ' is not implemented — the engine cannot produce an offense level for it.',
    );
  }
  const ch2Result = guideline.compute(facts);
  const base = ch2Result.base;
  const ch2 = ch2Result.total;
  const levelsFor = (id: string) =>
    ch2Result.characteristics.find((soc) => soc.id === id)?.levels ?? 0;
  const loss = levelsFor('A2b');
  const vic = levelsFor('A2c');
  const soc = ch2 - base - loss - vic;

  const role = roleAdjustment(facts.role);
  const obs = facts.obstruction ? 2 : 0;
  const adjusted = ch2 + role + obs;

  const acc = options.noAcceptance ? 0 : -Number(facts.acceptance || 0);
  const total = Math.max(1, adjusted + acc);

  const ch = criminalHistory(facts);
  const ci = categoryIndex(ch.total);
  const range = rangeFor(total, ci);

  return {
    ch2Result,
    base,
    loss,
    vic,
    soc,
    ch2,
    role,
    obs,
    adjusted,
    acc,
    total,
    priorPts: ch.priors,
    status: ch.status,
    pts: ch.total,
    ci,
    range,
    zone: zoneFor(range),
  };
}
