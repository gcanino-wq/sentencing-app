import { guideline2B1_1 } from './guideline2B1_1';
import type { Guideline, GuidelineId } from './guideline';

/**
 * Every Chapter 2 guideline the app knows about. Entries without a `compute`
 * are ones Appendix A can reach but the engine cannot yet calculate: the
 * statute search and the result screen report that rather than pretending to
 * a number.
 */
export const GUIDELINES: Record<GuidelineId, Guideline> = {
  '2B1.1': guideline2B1_1,
  '2K2.1': {
    id: '2K2.1',
    cite: '§2K2.1',
    title: 'Unlawful Receipt, Possession, or Transportation of Firearms or Ammunition; Prohibited Transactions Involving Firearms or Ammunition',
  },
  '2D1.1': {
    id: '2D1.1',
    cite: '§2D1.1',
    title: 'Unlawful Manufacturing, Importing, Exporting, or Trafficking (Including Possession with Intent to Commit These Offenses); Attempt or Conspiracy',
  },
  '2D2.1': {
    id: '2D2.1',
    cite: '§2D2.1',
    title: 'Unlawful Possession; Attempt or Conspiracy',
  },
};

/** True when the engine can produce an offense level for this guideline. */
export function isImplemented(id: GuidelineId): boolean {
  return typeof GUIDELINES[id].compute === 'function';
}

/** The guideline a case is scored under, defaulting to the one implemented. */
export function guidelineFor(id: GuidelineId = '2B1.1'): Guideline {
  return GUIDELINES[id] ?? GUIDELINES['2B1.1'];
}
