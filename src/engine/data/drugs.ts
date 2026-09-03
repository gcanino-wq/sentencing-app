import type { DrugEntry, DrugUnit } from '../types';

/**
 * Drug Conversion Tables — U.S.S.G. § 2D1.1, cmt. n.8(D).
 *
 * `gramsConvertedPerGram` is how many grams of converted drug weight one gram of
 * the substance produces. Heroin is the anchor at 1 g -> 1 kg converted.
 *
 * VERIFY: encoded from memory. The ratios below drive the entire drug
 * calculation; confirm each against cmt. n.8(D) before use.
 */
export interface Substance {
  id: string;
  name: string;
  /** Grams of converted drug weight per gram of this substance. */
  gramsConvertedPerGram: number;
  /**
   * True where the guideline works from the weight of the pure controlled
   * substance rather than the mixture — the distinction that most often
   * produces a wrong drug level.
   */
  actualWeight?: boolean;
  /** Shown next to the input to make the mixture/actual choice explicit. */
  note?: string;
  group: 'opioid' | 'stimulant' | 'cannabis' | 'hallucinogen' | 'pharmaceutical' | 'other';
}

const KG = 1000;

export const SUBSTANCES: readonly Substance[] = [
  { id: 'heroin', name: 'Heroin', gramsConvertedPerGram: 1 * KG, group: 'opioid' },
  {
    id: 'fentanyl',
    name: 'Fentanyl (N-phenyl-N-propanamide)',
    gramsConvertedPerGram: 2.5 * KG,
    group: 'opioid',
  },
  {
    id: 'fentanyl-analogue',
    name: 'Fentanyl analogue',
    gramsConvertedPerGram: 10 * KG,
    group: 'opioid',
  },
  { id: 'cocaine', name: 'Cocaine', gramsConvertedPerGram: 200, group: 'stimulant' },
  {
    id: 'cocaine-base',
    name: 'Cocaine base ("crack")',
    gramsConvertedPerGram: 3571,
    note: 'Distinct from cocaine powder. The disparity is a common § 3553(a) argument.',
    group: 'stimulant',
  },
  {
    id: 'meth-mixture',
    name: 'Methamphetamine (mixture)',
    gramsConvertedPerGram: 2 * KG,
    note: 'Total weight of the mixture or substance containing methamphetamine.',
    group: 'stimulant',
  },
  {
    id: 'meth-actual',
    name: 'Methamphetamine (actual)',
    gramsConvertedPerGram: 20 * KG,
    actualWeight: true,
    note: 'Weight of the pure methamphetamine. Ten times the mixture ratio — confirm which the lab reported.',
    group: 'stimulant',
  },
  {
    id: 'meth-ice',
    name: '"Ice" (≥ 80% pure methamphetamine)',
    gramsConvertedPerGram: 20 * KG,
    actualWeight: true,
    note: 'Treated as methamphetamine (actual).',
    group: 'stimulant',
  },
  {
    id: 'amphetamine-mixture',
    name: 'Amphetamine (mixture)',
    gramsConvertedPerGram: 2 * KG,
    group: 'stimulant',
  },
  {
    id: 'amphetamine-actual',
    name: 'Amphetamine (actual)',
    gramsConvertedPerGram: 20 * KG,
    actualWeight: true,
    group: 'stimulant',
  },
  { id: 'marihuana', name: 'Marihuana', gramsConvertedPerGram: 1, group: 'cannabis' },
  { id: 'hashish', name: 'Hashish', gramsConvertedPerGram: 5, group: 'cannabis' },
  { id: 'hashish-oil', name: 'Hashish oil', gramsConvertedPerGram: 50, group: 'cannabis' },
  {
    id: 'marihuana-plants',
    name: 'Marihuana plants (per plant)',
    gramsConvertedPerGram: 100,
    note: 'Each plant counts as 100 g of converted drug weight regardless of yield.',
    group: 'cannabis',
  },
  { id: 'pcp-mixture', name: 'PCP (mixture)', gramsConvertedPerGram: 1 * KG, group: 'hallucinogen' },
  {
    id: 'pcp-actual',
    name: 'PCP (actual)',
    gramsConvertedPerGram: 10 * KG,
    actualWeight: true,
    group: 'hallucinogen',
  },
  { id: 'lsd', name: 'LSD', gramsConvertedPerGram: 100 * KG, group: 'hallucinogen' },
  { id: 'mdma', name: 'MDMA / Ecstasy', gramsConvertedPerGram: 500, group: 'hallucinogen' },
  {
    id: 'oxycodone',
    name: 'Oxycodone (actual)',
    gramsConvertedPerGram: 6700,
    actualWeight: true,
    note: 'Weight of the oxycodone itself, not the pill. Enter pills with a mg strength.',
    group: 'pharmaceutical',
  },
  {
    id: 'hydrocodone',
    name: 'Hydrocodone (actual)',
    gramsConvertedPerGram: 6700,
    actualWeight: true,
    note: 'Weight of the hydrocodone itself, not the pill.',
    group: 'pharmaceutical',
  },
  {
    id: 'hydromorphone',
    name: 'Hydromorphone (actual)',
    gramsConvertedPerGram: 2670,
    actualWeight: true,
    group: 'pharmaceutical',
  },
  { id: 'oxymorphone', name: 'Oxymorphone (actual)', gramsConvertedPerGram: 5 * KG, actualWeight: true, group: 'pharmaceutical' },
  { id: 'methadone', name: 'Methadone', gramsConvertedPerGram: 500, group: 'pharmaceutical' },
  { id: 'morphine', name: 'Morphine', gramsConvertedPerGram: 500, group: 'pharmaceutical' },
  { id: 'alprazolam', name: 'Alprazolam', gramsConvertedPerGram: 1.25, group: 'pharmaceutical' },
  { id: 'ketamine', name: 'Ketamine', gramsConvertedPerGram: 1, group: 'other' },
];

export const SUBSTANCE_BY_ID = new Map(SUBSTANCES.map((s) => [s.id, s]));

/** Grams per input unit. `pills` and `units` need an explicit mg strength. */
const UNIT_TO_GRAMS: Record<Exclude<DrugUnit, 'pills' | 'units' | 'plants'>, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

/** Convert one entry to grams of the substance itself. */
export function entryToGrams(entry: DrugEntry): number {
  if (entry.unit === 'plants') {
    // Plants are counted per-plant, not by weight; grams are meaningless here.
    return entry.quantity;
  }
  if (entry.unit === 'pills' || entry.unit === 'units') {
    const mg = entry.mgPerUnit ?? 0;
    return (entry.quantity * mg) / 1000;
  }
  return entry.quantity * UNIT_TO_GRAMS[entry.unit];
}

/** Converted drug weight for one entry, in kilograms. */
export function entryToConvertedKg(entry: DrugEntry): number {
  const substance = SUBSTANCE_BY_ID.get(entry.substanceId);
  if (!substance) return 0;
  if (entry.unit === 'plants') {
    // 1 plant = 100 g converted; the ratio is already per-plant for this id.
    return (entry.quantity * 100) / 1000;
  }
  return (entryToGrams(entry) * substance.gramsConvertedPerGram) / 1000;
}

export function totalConvertedKg(entries: readonly DrugEntry[]): number {
  return entries.reduce((sum, e) => sum + entryToConvertedKg(e), 0);
}

/**
 * Drug Quantity Table — § 2D1.1(c), keyed on converted drug weight.
 *
 * Each row is the inclusive floor in kilograms of converted drug weight.
 * VERIFY against § 2D1.1(c).
 */
export const DRUG_QUANTITY_TABLE: readonly { minConvertedKg: number; level: number }[] = [
  { minConvertedKg: 90_000, level: 38 },
  { minConvertedKg: 30_000, level: 36 },
  { minConvertedKg: 10_000, level: 34 },
  { minConvertedKg: 3_000, level: 32 },
  { minConvertedKg: 1_000, level: 30 },
  { minConvertedKg: 700, level: 28 },
  { minConvertedKg: 400, level: 26 },
  { minConvertedKg: 100, level: 24 },
  { minConvertedKg: 80, level: 22 },
  { minConvertedKg: 60, level: 20 },
  { minConvertedKg: 40, level: 18 },
  { minConvertedKg: 20, level: 16 },
  { minConvertedKg: 10, level: 14 },
  { minConvertedKg: 5, level: 12 },
  { minConvertedKg: 2.5, level: 10 },
  { minConvertedKg: 1, level: 8 },
  { minConvertedKg: 0, level: 6 },
];

export function drugQuantityLevel(convertedKg: number): number {
  for (const row of DRUG_QUANTITY_TABLE) {
    if (convertedKg >= row.minConvertedKg) return row.level;
  }
  return 6;
}

/** The next threshold up, so the UI can show how close a quantity is to a bracket. */
export function nextDrugThreshold(convertedKg: number): { level: number; atKg: number } | null {
  const higher = [...DRUG_QUANTITY_TABLE]
    .reverse()
    .find((row) => row.minConvertedKg > convertedKg);
  return higher ? { level: higher.level, atKg: higher.minConvertedKg } : null;
}
