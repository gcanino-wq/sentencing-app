import type { Confidence } from '../types';

/**
 * Statutory Index (Appendix A) entries plus the statutory penalties for each.
 *
 * TIERING: entries marked `verified` were encoded deliberately and cover the
 * high-volume federal docket. Entries marked `unverified` provide breadth; the
 * UI shows a "confirm against Appendix A" prompt for them. Neither tier has been
 * checked against the published manual — see VERIFICATION.md.
 */

export interface PenaltyTier {
  /** Number of qualifying priors in a filed 21 U.S.C. § 851 information. */
  priors: 1 | 2;
  minMonths: number;
  maxMonths: number | null;
  supervisedReleaseMinMonths?: number;
  citation: string;
}

export interface Penalty {
  minMonths: number;
  /** `null` means life. */
  maxMonths: number | null;
  supervisedReleaseMinMonths?: number;
  /** Enhanced penalties on a filed § 851 information. */
  enhancedTiers?: PenaltyTier[];
  note?: string;
}

export interface StatuteEntry {
  id: string;
  citation: string;
  title: string;
  /** Guidelines from Appendix A. First is the default; others are alternatives. */
  guidelines: string[];
  confidence: Confidence;
  penalty?: Penalty;
  /**
   * Counts that never group and run consecutively — § 924(c) and § 1028A.
   * `months` is the default term; the UI lets the user pick the applicable one.
   */
  consecutiveMandatory?: { months: number; label: string; citation: string };
  /** Drives the § 3D1.2(d) grouping proposal. */
  groupingClass?: 'drug' | 'fraud' | 'tax' | 'firearm' | 'violence' | 'immigration' | 'other';
  /** Shown inline where the statute has a trap worth naming. */
  note?: string;
}

const V: Confidence = 'verified';
const U: Confidence = 'unverified';

// ---------------------------------------------------------------------------
// Controlled substances — 21 U.S.C.
// ---------------------------------------------------------------------------

const DRUG_STATUTES: StatuteEntry[] = [
  {
    id: '21:841(b)(1)(A)',
    citation: '21 U.S.C. § 841(b)(1)(A)',
    title: 'Distribution / possession with intent — highest quantity tier',
    guidelines: ['2D1.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: {
      minMonths: 120,
      maxMonths: null,
      supervisedReleaseMinMonths: 60,
      enhancedTiers: [
        {
          priors: 1,
          minMonths: 180,
          maxMonths: null,
          supervisedReleaseMinMonths: 120,
          citation: '21 U.S.C. § 841(b)(1)(A) (one prior serious drug or violent felony)',
        },
        {
          priors: 2,
          minMonths: 300,
          maxMonths: null,
          supervisedReleaseMinMonths: 120,
          citation: '21 U.S.C. § 841(b)(1)(A) (two or more priors)',
        },
      ],
    },
    note: 'Enhanced tiers require a filed § 851 information. First Step Act narrowed the predicates to "serious drug felony" and "serious violent felony."',
  },
  {
    id: '21:841(b)(1)(B)',
    citation: '21 U.S.C. § 841(b)(1)(B)',
    title: 'Distribution / possession with intent — middle quantity tier',
    guidelines: ['2D1.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: {
      minMonths: 60,
      maxMonths: 480,
      supervisedReleaseMinMonths: 48,
      enhancedTiers: [
        {
          priors: 1,
          minMonths: 120,
          maxMonths: null,
          supervisedReleaseMinMonths: 96,
          citation: '21 U.S.C. § 841(b)(1)(B) (one prior serious drug or violent felony)',
        },
      ],
    },
  },
  {
    id: '21:841(b)(1)(C)',
    citation: '21 U.S.C. § 841(b)(1)(C)',
    title: 'Distribution / possession with intent — no threshold quantity',
    guidelines: ['2D1.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: {
      minMonths: 0,
      maxMonths: 240,
      supervisedReleaseMinMonths: 36,
      enhancedTiers: [
        {
          priors: 1,
          minMonths: 0,
          maxMonths: 360,
          supervisedReleaseMinMonths: 72,
          citation: '21 U.S.C. § 841(b)(1)(C) (one prior serious drug felony)',
        },
      ],
    },
  },
  {
    id: '21:841(b)(1)(D)',
    citation: '21 U.S.C. § 841(b)(1)(D)',
    title: 'Distribution / possession with intent — marihuana under 50 kg',
    guidelines: ['2D1.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: { minMonths: 0, maxMonths: 60, supervisedReleaseMinMonths: 24 },
  },
  {
    id: '21:846',
    citation: '21 U.S.C. § 846',
    title: 'Attempt and conspiracy — controlled substances',
    guidelines: ['2D1.1', '2X1.1'],
    confidence: V,
    groupingClass: 'drug',
    note: 'Penalties are those of the object offense. Select the applicable § 841(b) tier for statutory exposure.',
  },
  {
    id: '21:952',
    citation: '21 U.S.C. § 952',
    title: 'Importation of controlled substances',
    guidelines: ['2D1.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: { minMonths: 0, maxMonths: 240, supervisedReleaseMinMonths: 36 },
    note: 'Penalties track 21 U.S.C. § 960 by quantity tier — select the tier that matches.',
  },
  {
    id: '21:963',
    citation: '21 U.S.C. § 963',
    title: 'Attempt and conspiracy — import/export',
    guidelines: ['2D1.1', '2X1.1'],
    confidence: V,
    groupingClass: 'drug',
  },
  {
    id: '21:860',
    citation: '21 U.S.C. § 860',
    title: 'Distribution near schools and playgrounds',
    guidelines: ['2D1.2'],
    confidence: V,
    groupingClass: 'drug',
  },
  {
    id: '21:856',
    citation: '21 U.S.C. § 856',
    title: 'Maintaining a drug-involved premises',
    guidelines: ['2D1.8'],
    confidence: V,
    groupingClass: 'drug',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '21:844',
    citation: '21 U.S.C. § 844',
    title: 'Simple possession',
    guidelines: ['2D2.1'],
    confidence: V,
    groupingClass: 'drug',
    penalty: { minMonths: 0, maxMonths: 12 },
  },
  {
    id: '21:848',
    citation: '21 U.S.C. § 848',
    title: 'Continuing criminal enterprise',
    guidelines: ['2D1.5'],
    confidence: U,
    groupingClass: 'drug',
    penalty: { minMonths: 240, maxMonths: null },
  },
];

// ---------------------------------------------------------------------------
// Firearms — 18 U.S.C.
// ---------------------------------------------------------------------------

const FIREARM_STATUTES: StatuteEntry[] = [
  {
    id: '18:922(g)',
    citation: '18 U.S.C. § 922(g)',
    title: 'Prohibited person in possession of a firearm',
    guidelines: ['2K2.1'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: {
      minMonths: 0,
      maxMonths: 180,
      note: 'Maximum raised from 10 to 15 years by the Bipartisan Safer Communities Act (2022), 18 U.S.C. § 924(a)(8). Confirm the applicable maximum for the offense date.',
    },
    note: 'If the defendant has three qualifying ACCA predicates, 18 U.S.C. § 924(e) imposes a 15-year minimum and a maximum of life.',
  },
  {
    id: '18:922(a)(6)',
    citation: '18 U.S.C. § 922(a)(6)',
    title: 'False statement in acquisition of a firearm',
    guidelines: ['2K2.1'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 0, maxMonths: 180 },
  },
  {
    id: '18:922(o)',
    citation: '18 U.S.C. § 922(o)',
    title: 'Possession of a machinegun',
    guidelines: ['2K2.1'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:933',
    citation: '18 U.S.C. § 933',
    title: 'Trafficking in firearms',
    guidelines: ['2K2.1'],
    confidence: U,
    groupingClass: 'firearm',
    penalty: { minMonths: 0, maxMonths: 180 },
  },
  {
    id: '18:924(c)',
    citation: '18 U.S.C. § 924(c)',
    title: 'Firearm used or carried during a crime of violence or drug trafficking crime',
    guidelines: ['2K2.4'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 60, maxMonths: null },
    consecutiveMandatory: {
      months: 60,
      label: 'Possession in furtherance / use or carry',
      citation: '18 U.S.C. § 924(c)(1)(A)(i)',
    },
    note: 'Guideline sentence is the statutory minimum, run consecutively. § 2K2.4 cmt. n.4 bars a weapon enhancement on the underlying count.',
  },
  {
    id: '18:929(a)',
    citation: '18 U.S.C. § 929(a)',
    title: 'Use of a firearm with armor-piercing ammunition during a crime of violence',
    guidelines: ['2K2.4'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 60, maxMonths: null },
    consecutiveMandatory: {
      months: 60,
      label: 'Armor-piercing ammunition',
      citation: '18 U.S.C. § 929(a)',
    },
    note: '§ 2K2.4(b) makes the guideline sentence the minimum term required by statute, imposed consecutively.',
  },
  {
    id: '18:844(h)',
    citation: '18 U.S.C. § 844(h)',
    title: 'Use of fire or an explosive to commit a federal felony',
    guidelines: ['2K2.4'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 120, maxMonths: 120 },
    consecutiveMandatory: {
      months: 120,
      label: 'Use of fire or an explosive to commit a felony',
      citation: '18 U.S.C. § 844(h)(1)',
    },
    note: '§ 2K2.4(a) makes the guideline sentence the term required by statute. A second or subsequent conviction carries 20 years.',
  },
  {
    id: '18:924(e)',
    citation: '18 U.S.C. § 924(e)',
    title: 'Armed Career Criminal Act',
    guidelines: ['4B1.4'],
    confidence: V,
    groupingClass: 'firearm',
    penalty: { minMonths: 180, maxMonths: null },
    note: 'Requires three prior convictions for a violent felony or serious drug offense committed on occasions different from one another.',
  },
];

/** § 924(c) mandatory consecutive terms, selectable per count. */
export const SECTION_924C_TERMS = [
  { id: 'possess', months: 60, label: 'Possession in furtherance / use or carry', citation: '18 U.S.C. § 924(c)(1)(A)(i)' },
  { id: 'brandish', months: 84, label: 'Brandished', citation: '18 U.S.C. § 924(c)(1)(A)(ii)' },
  { id: 'discharge', months: 120, label: 'Discharged', citation: '18 U.S.C. § 924(c)(1)(A)(iii)' },
  { id: 'sbr', months: 120, label: 'Short-barreled rifle / shotgun / semiautomatic assault weapon', citation: '18 U.S.C. § 924(c)(1)(B)(i)' },
  { id: 'machinegun', months: 360, label: 'Machinegun, destructive device, or silencer', citation: '18 U.S.C. § 924(c)(1)(B)(ii)' },
  { id: 'second', months: 300, label: 'Second or subsequent conviction', citation: '18 U.S.C. § 924(c)(1)(C)' },
] as const;

// ---------------------------------------------------------------------------
// Violent offenses — 18 U.S.C.
// ---------------------------------------------------------------------------

const VIOLENCE_STATUTES: StatuteEntry[] = [
  {
    id: '18:2119',
    citation: '18 U.S.C. § 2119',
    title: 'Carjacking',
    guidelines: ['2B3.1'],
    confidence: V,
    groupingClass: 'violence',
    penalty: {
      minMonths: 0,
      maxMonths: 180,
      note: 'Maximum rises to 25 years on serious bodily injury, § 2119(2), and to life on death, § 2119(3).',
    },
    note: 'Counts with different victims do not group under § 3D1.2. Typically paired with a § 924(c) count.',
  },
  {
    id: '18:1951',
    citation: '18 U.S.C. § 1951',
    title: 'Hobbs Act robbery and extortion',
    guidelines: ['2B3.1', '2B3.2', '2C1.1'],
    confidence: V,
    groupingClass: 'violence',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '18:2113',
    citation: '18 U.S.C. § 2113',
    title: 'Bank robbery',
    guidelines: ['2B3.1'],
    confidence: V,
    groupingClass: 'violence',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '18:1201',
    citation: '18 U.S.C. § 1201',
    title: 'Kidnapping',
    guidelines: ['2A4.1'],
    confidence: V,
    groupingClass: 'violence',
    penalty: { minMonths: 0, maxMonths: null },
  },
  {
    id: '18:1111',
    citation: '18 U.S.C. § 1111',
    title: 'Murder',
    guidelines: ['2A1.1', '2A1.2'],
    confidence: V,
    groupingClass: 'violence',
    penalty: { minMonths: 0, maxMonths: null },
  },
  {
    id: '18:1959',
    citation: '18 U.S.C. § 1959',
    title: 'Violent crimes in aid of racketeering',
    guidelines: ['2E1.3'],
    confidence: U,
    groupingClass: 'violence',
  },
  {
    id: '18:1962',
    citation: '18 U.S.C. § 1962',
    title: 'RICO',
    guidelines: ['2E1.1'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
];

// ---------------------------------------------------------------------------
// Fraud, theft, and corruption
// ---------------------------------------------------------------------------

const FRAUD_STATUTES: StatuteEntry[] = [
  {
    id: '18:1341',
    citation: '18 U.S.C. § 1341',
    title: 'Mail fraud',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: {
      minMonths: 0,
      maxMonths: 240,
      note: 'Maximum is 30 years where the offense affects a financial institution or relates to federal disaster relief.',
    },
  },
  {
    id: '18:1343',
    citation: '18 U.S.C. § 1343',
    title: 'Wire fraud',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: {
      minMonths: 0,
      maxMonths: 240,
      note: 'Maximum is 30 years where the offense affects a financial institution or relates to federal disaster relief.',
    },
  },
  {
    id: '18:1344',
    citation: '18 U.S.C. § 1344',
    title: 'Bank fraud',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 360 },
  },
  {
    id: '18:1347',
    citation: '18 U.S.C. § 1347',
    title: 'Health care fraud',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:1349',
    citation: '18 U.S.C. § 1349',
    title: 'Attempt and conspiracy — fraud offenses',
    guidelines: ['2X1.1', '2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    note: 'Appendix A maps § 1349 to § 2X1.1 alone, which directs to the guideline for the object offense. Penalties are also those of the object offense.',
  },
  {
    id: '18:641',
    citation: '18 U.S.C. § 641',
    title: 'Theft of public money or property',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: {
      minMonths: 0,
      maxMonths: 120,
      note: 'Maximum is one year where the value does not exceed $1,000.',
    },
  },
  {
    id: '18:666',
    citation: '18 U.S.C. § 666',
    title: 'Theft or bribery concerning programs receiving federal funds',
    guidelines: ['2B1.1', '2C1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
    note: 'Appendix A maps § 666 to § 2B1.1 for theft and § 2C1.1 for bribery — select based on the conduct.',
  },
  {
    id: '18:201(b)',
    citation: '18 U.S.C. § 201(b)',
    title: 'Bribery of a public official',
    guidelines: ['2C1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 180 },
  },
  {
    id: '18:201(c)',
    citation: '18 U.S.C. § 201(c)',
    title: 'Illegal gratuity',
    guidelines: ['2C1.2'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 24 },
  },
  {
    id: '18:1028A',
    citation: '18 U.S.C. § 1028A',
    title: 'Aggravated identity theft',
    guidelines: ['2B1.6'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 24, maxMonths: 24 },
    consecutiveMandatory: {
      months: 24,
      label: 'Aggravated identity theft',
      citation: '18 U.S.C. § 1028A(a)(1)',
    },
    note: 'Two years mandatory consecutive. § 2B1.6 makes the guideline sentence the statutory term, and cmt. n.2 bars a related enhancement on the underlying count.',
  },
  {
    id: '18:1028',
    citation: '18 U.S.C. § 1028',
    title: 'Fraud with identification documents',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 180 },
  },
  {
    id: '18:1956',
    citation: '18 U.S.C. § 1956',
    title: 'Laundering of monetary instruments',
    guidelines: ['2S1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '18:1957',
    citation: '18 U.S.C. § 1957',
    title: 'Monetary transactions in criminally derived property',
    guidelines: ['2S1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:1512',
    citation: '18 U.S.C. § 1512',
    title: 'Tampering with a witness, victim, or informant',
    guidelines: ['2J1.2'],
    confidence: V,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '18:1001',
    citation: '18 U.S.C. § 1001',
    title: 'False statements',
    guidelines: ['2B1.1'],
    confidence: V,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
];

// ---------------------------------------------------------------------------
// Immigration and tax
// ---------------------------------------------------------------------------

const OTHER_STATUTES: StatuteEntry[] = [
  {
    id: '8:1326',
    citation: '8 U.S.C. § 1326',
    title: 'Reentry of a removed alien',
    guidelines: ['2L1.2'],
    confidence: V,
    groupingClass: 'immigration',
    penalty: {
      minMonths: 0,
      maxMonths: 24,
      note: 'Maximum is 10 years under § 1326(b)(1) and 20 years under § 1326(b)(2), depending on the prior removal predicate.',
    },
  },
  {
    id: '8:1324',
    citation: '8 U.S.C. § 1324',
    title: 'Bringing in and harboring aliens',
    guidelines: ['2L1.1'],
    confidence: V,
    groupingClass: 'immigration',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '26:7201',
    citation: '26 U.S.C. § 7201',
    title: 'Attempt to evade or defeat tax',
    guidelines: ['2T1.1'],
    confidence: V,
    groupingClass: 'tax',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
  {
    id: '26:7206(1)',
    citation: '26 U.S.C. § 7206(1), (3), (4), (5)',
    title: 'Fraud and false statements — tax',
    guidelines: ['2T1.1', '2S1.3'],
    confidence: V,
    groupingClass: 'tax',
    penalty: { minMonths: 0, maxMonths: 36 },
  },
  {
    id: '26:7206(2)',
    citation: '26 U.S.C. § 7206(2)',
    title: 'Aiding or assisting a false return',
    guidelines: ['2T1.4', '2S1.3'],
    confidence: V,
    groupingClass: 'tax',
    penalty: { minMonths: 0, maxMonths: 36 },
    note: 'Appendix A maps § 7206(2) to § 2T1.4, distinct from the other subsections.',
  },
  {
    id: '31:5324',
    citation: '31 U.S.C. § 5324',
    title: 'Structuring transactions to evade reporting requirements',
    guidelines: ['2S1.3'],
    confidence: U,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
  {
    id: '18:371',
    citation: '18 U.S.C. § 371',
    title: 'Conspiracy to commit offense or to defraud the United States',
    guidelines: ['2X1.1', '2C1.1', '2K2.1', '2A1.5'],
    confidence: V,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 60 },
    note: 'Appendix A gives conditional mappings: § 2C1.1 for a conspiracy to defraud by interference with governmental functions, § 2K2.1 for a conspiracy to violate 18 U.S.C. § 924(c), and § 2A1.5. Otherwise § 2X1.1 directs to the guideline for the object offense.',
  },
  {
    id: '18:2251',
    citation: '18 U.S.C. § 2251',
    title: 'Sexual exploitation of children',
    guidelines: ['2G2.1'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 180, maxMonths: 360 },
  },
  {
    id: '18:2252',
    citation: '18 U.S.C. § 2252',
    title: 'Material involving the sexual exploitation of minors',
    guidelines: ['2G2.2'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 60, maxMonths: 240 },
  },
  {
    id: '18:111',
    citation: '18 U.S.C. § 111',
    title: 'Assaulting a federal officer',
    guidelines: ['2A2.2', '2A2.4'],
    confidence: U,
    groupingClass: 'violence',
    penalty: { minMonths: 0, maxMonths: 96 },
  },
  {
    id: '18:751',
    citation: '18 U.S.C. § 751',
    title: 'Escape from custody',
    guidelines: ['2P1.1'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
  {
    id: '18:1621',
    citation: '18 U.S.C. § 1621',
    title: 'Perjury',
    guidelines: ['2J1.3'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
  {
    id: '18:1503',
    citation: '18 U.S.C. § 1503',
    title: 'Obstruction of justice',
    guidelines: ['2J1.2'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:1425',
    citation: '18 U.S.C. § 1425',
    title: 'Procurement of citizenship unlawfully',
    guidelines: ['2L2.1', '2L2.2'],
    confidence: U,
    groupingClass: 'immigration',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:2320',
    citation: '18 U.S.C. § 2320',
    title: 'Trafficking in counterfeit goods',
    guidelines: ['2B5.3'],
    confidence: U,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:1030',
    citation: '18 U.S.C. § 1030',
    title: 'Fraud and related activity — computers',
    guidelines: ['2B1.1'],
    confidence: U,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:472',
    citation: '18 U.S.C. § 472',
    title: 'Uttering counterfeit obligations',
    guidelines: ['2B5.1'],
    confidence: U,
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 240 },
  },
  {
    id: '18:513',
    citation: '18 U.S.C. § 513',
    title: 'Counterfeit securities',
    guidelines: ['2B5.1', '2B1.1'],
    confidence: U,
    note: 'Appendix A may map this to § 2B1.1. The index is laid out in two columns and the pairing for this entry could not be resolved with confidence — confirm before relying on it.',
    groupingClass: 'fraud',
    penalty: { minMonths: 0, maxMonths: 120 },
  },
  {
    id: '18:844',
    citation: '18 U.S.C. § 844',
    title: 'Arson and explosives offenses',
    guidelines: ['2K1.4'],
    confidence: U,
    groupingClass: 'violence',
    penalty: { minMonths: 60, maxMonths: 240 },
  },
  {
    id: '18:2422',
    citation: '18 U.S.C. § 2422',
    title: 'Coercion and enticement',
    guidelines: ['2G1.3'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 120, maxMonths: null },
  },
  {
    id: '18:1955',
    citation: '18 U.S.C. § 1955',
    title: 'Illegal gambling business',
    guidelines: ['2E3.1'],
    confidence: U,
    groupingClass: 'other',
    penalty: { minMonths: 0, maxMonths: 60 },
  },
];

export const STATUTES: readonly StatuteEntry[] = [
  ...DRUG_STATUTES,
  ...FIREARM_STATUTES,
  ...VIOLENCE_STATUTES,
  ...FRAUD_STATUTES,
  ...OTHER_STATUTES,
];

export const STATUTE_BY_ID = new Map(STATUTES.map((s) => [s.id, s]));

export function findStatutes(query: string): StatuteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STATUTES.filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.citation.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q),
  );
}
