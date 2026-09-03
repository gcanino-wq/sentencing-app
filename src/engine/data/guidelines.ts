import type { Confidence } from '../types';

/**
 * Chapter 2 guideline definitions.
 *
 * Tier 1 guidelines (`structured: true`) carry real base-offense-level options
 * and specific offense characteristics. Every other guideline falls back to a
 * generic definition where the user supplies the base level and cites their own
 * adjustments, so no offense is uncomputable.
 *
 * Each SOC carries its own `confidence`. Subsection *numbering* in Chapter 2 has
 * shifted repeatedly across amendment cycles; where the numbering here is not
 * certain the entry is marked `unverified` and the UI says so. VERIFY before use.
 */

export interface BaseLevelOption {
  id: string;
  label: string;
  level: number;
  citation: string;
  confidence: Confidence;
  note?: string;
}

export interface SocOption {
  id: string;
  label: string;
  levels: number;
  citation: string;
  confidence: Confidence;
  /** Only one SOC per exclusive group may apply — the highest is taken. */
  exclusiveGroup?: string;
  /** Applying this SOC floors the offense level at this value. */
  minimumLevel?: number;
  note?: string;
}

export type QuantityDriver = 'drug' | 'loss' | 'tax' | 'benefit' | 'none';

/** Caps the SUM of a named set of characteristics, e.g. § 2B3.1's 11-level limit. */
export interface SocGroupCap {
  socIds: string[];
  maxLevels: number;
  citation: string;
  label: string;
}

/**
 * Caps the offense level reached after a named set of characteristics, e.g.
 * § 2K2.1's level-29 limit on (b)(1)-(b)(5). `unlessSocIds` names the
 * characteristics whose application lifts the cap.
 */
export interface SubtotalCap {
  afterSocIds: string[];
  maxLevel: number;
  unlessSocIds: string[];
  citation: string;
  label: string;
}

export interface GuidelineDef {
  section: string;
  title: string;
  structured: boolean;
  confidence: Confidence;
  /** One-line description of what the guideline does, shown with the citation. */
  summary: string;
  baseOptions: BaseLevelOption[];
  /** Base level when no option is chosen and the guideline has a single base. */
  defaultBaseLevel?: number;
  socs: SocOption[];
  quantityDriver: QuantityDriver;
  /**
   * Whether counts under this guideline group under § 3D1.2(d), which aggregates
   * quantity across counts. Drives the grouping proposal.
   */
  groupsByQuantity: boolean;
  /** Second loss table used by a guideline that has its own, e.g. § 2B3.1(b)(7). */
  ownLossTable?: readonly { moreThan: number; increase: number }[];
  ownLossCitation?: string;
  socGroupCaps?: SocGroupCap[];
  subtotalCaps?: SubtotalCap[];
  note?: string;
}

const V: Confidence = 'verified';
const U: Confidence = 'unverified';

// ---------------------------------------------------------------------------
// § 2B1.1 — Theft, fraud, property offenses
// ---------------------------------------------------------------------------

const G_2B1_1: GuidelineDef = {
  section: '2B1.1',
  title: 'Larceny, Embezzlement, Theft, Fraud, and Property Destruction',
  structured: true,
  confidence: V,
  summary:
    'Base level driven by the statutory maximum, then a loss-table increase and characteristics for victims, sophistication, and the means used.',
  quantityDriver: 'loss',
  groupsByQuantity: true,
  baseOptions: [
    {
      id: 'a1',
      label: 'Statutory maximum of 20 years or more',
      level: 7,
      citation: '§ 2B1.1(a)(1)',
      confidence: V,
    },
    { id: 'a2', label: 'Otherwise', level: 6, citation: '§ 2B1.1(a)(2)', confidence: V },
  ],
  defaultBaseLevel: 6,
  socs: [
    {
      id: 'victims-2',
      label: '10 or more victims, or substantial financial hardship to 1 or more victims',
      levels: 2,
      citation: '§ 2B1.1(b)(2)(A)',
      confidence: V,
      exclusiveGroup: 'victims',
    },
    {
      id: 'victims-mass-marketing',
      label: 'Committed through mass-marketing',
      levels: 2,
      citation: '§ 2B1.1(b)(2)(A)(ii)',
      confidence: U,
      exclusiveGroup: 'victims',
    },
    {
      id: 'victims-4',
      label: 'Substantial financial hardship to 5 or more victims',
      levels: 4,
      citation: '§ 2B1.1(b)(2)(B)',
      confidence: V,
      exclusiveGroup: 'victims',
    },
    {
      id: 'victims-6',
      label: 'Substantial financial hardship to 25 or more victims',
      levels: 6,
      citation: '§ 2B1.1(b)(2)(C)',
      confidence: V,
      exclusiveGroup: 'victims',
    },
    {
      id: 'theft-from-person',
      label: 'Theft from the person of another',
      levels: 2,
      citation: '§ 2B1.1(b)(3)',
      confidence: V,
    },
    {
      id: 'stolen-property-business',
      label: 'In the business of receiving and selling stolen property',
      levels: 2,
      citation: '§ 2B1.1(b)(4)',
      confidence: V,
    },
    {
      id: 'health-care-1m',
      label: 'Federal health care offense — loss over $1,000,000',
      levels: 2,
      citation: '§ 2B1.1(b)(7)(A)',
      confidence: U,
      exclusiveGroup: 'healthcare',
    },
    {
      id: 'health-care-7m',
      label: 'Federal health care offense — loss over $7,000,000',
      levels: 3,
      citation: '§ 2B1.1(b)(7)(B)',
      confidence: U,
      exclusiveGroup: 'healthcare',
    },
    {
      id: 'health-care-20m',
      label: 'Federal health care offense — loss over $20,000,000',
      levels: 4,
      citation: '§ 2B1.1(b)(7)(C)',
      confidence: U,
      exclusiveGroup: 'healthcare',
    },
    {
      id: 'sophisticated-means',
      label: 'Sophisticated means',
      levels: 2,
      citation: '§ 2B1.1(b)(10)(C)',
      confidence: V,
      minimumLevel: 12,
      exclusiveGroup: 'b10',
    },
    {
      id: 'relocated-scheme',
      label: 'Relocated the scheme to another jurisdiction to evade law enforcement',
      levels: 2,
      citation: '§ 2B1.1(b)(10)(A)',
      confidence: U,
      minimumLevel: 12,
      exclusiveGroup: 'b10',
    },
    {
      id: 'outside-us',
      label: 'Substantial part of the scheme committed from outside the United States',
      levels: 2,
      citation: '§ 2B1.1(b)(10)(B)',
      confidence: U,
      minimumLevel: 12,
      exclusiveGroup: 'b10',
    },
    {
      id: 'device-making',
      label: 'Device-making equipment, unauthorized access device, or means of identification',
      levels: 2,
      citation: '§ 2B1.1(b)(11)',
      confidence: V,
      minimumLevel: 12,
    },
    {
      id: 'gross-receipts',
      label: 'Derived more than $1,000,000 in gross receipts from financial institutions',
      levels: 2,
      citation: '§ 2B1.1(b)(16)(A)',
      confidence: U,
    },
    {
      id: 'jeopardized-institution',
      label: 'Substantially jeopardized the safety and soundness of a financial institution',
      levels: 4,
      citation: '§ 2B1.1(b)(16)(B)',
      confidence: U,
      minimumLevel: 24,
    },
  ],
};

// ---------------------------------------------------------------------------
// § 2B3.1 — Robbery and carjacking
// ---------------------------------------------------------------------------

const G_2B3_1: GuidelineDef = {
  section: '2B3.1',
  title: 'Robbery',
  structured: true,
  confidence: V,
  summary:
    'Base level 20, then characteristics for the weapon, injury, restraint, carjacking, and loss. The weapon and injury increases are capped at 11 levels combined.',
  quantityDriver: 'loss',
  groupsByQuantity: false,
  // § 2B3.1(b)(7) has its own loss table, distinct from § 2B1.1(b)(1).
  ownLossTable: [
    { moreThan: 9_500_000, increase: 7 },
    { moreThan: 5_000_000, increase: 6 },
    { moreThan: 3_000_000, increase: 5 },
    { moreThan: 1_500_000, increase: 4 },
    { moreThan: 500_000, increase: 3 },
    { moreThan: 95_000, increase: 2 },
    { moreThan: 20_000, increase: 1 },
    { moreThan: -1, increase: 0 },
  ],
  ownLossCitation: '§ 2B3.1(b)(7)',
  baseOptions: [{ id: 'a', label: 'Robbery', level: 20, citation: '§ 2B3.1(a)', confidence: V }],
  defaultBaseLevel: 20,
  socGroupCaps: [
    {
      socIds: [
        'firearm-discharged', 'firearm-specific-threat', 'firearm-brandished',
        'weapon-otherwise-used', 'weapon-brandished', 'threat-of-death',
        'bodily-injury', 'injury-between-a-b', 'serious-bodily-injury',
        'injury-between-b-c', 'permanent-injury',
      ],
      maxLevels: 11,
      citation: '§ 2B3.1(b)(3); § 2B3.1 cmt. n.4',
      label: 'Combined weapon and injury adjustments capped at 11 levels',
    },
  ],
  socs: [
    {
      id: 'financial-institution',
      label: 'Property of a financial institution or post office taken, or an object of the offense',
      levels: 2,
      citation: '§ 2B3.1(b)(1)',
      confidence: V,
    },
    {
      id: 'firearm-discharged',
      label: 'Firearm discharged',
      levels: 7,
      citation: '§ 2B3.1(b)(2)(A)',
      confidence: V,
      exclusiveGroup: 'weapon',
    },
    {
      id: 'firearm-specific-threat',
      label:
        'Firearm used to convey a specific threat of harm, or to make physical contact with a victim',
      levels: 6,
      citation: '§ 2B3.1(b)(2)(B)',
      confidence: V,
      exclusiveGroup: 'weapon',
      note: 'A specific rather than general threat — pointing the firearm at a particular victim, directing a victim\u2019s movement with it, or a pistol whip.',
    },
    {
      id: 'firearm-brandished',
      label: 'Firearm brandished or possessed',
      levels: 5,
      citation: '§ 2B3.1(b)(2)(C)',
      confidence: V,
      exclusiveGroup: 'weapon',
    },
    {
      id: 'weapon-otherwise-used',
      label: 'Dangerous weapon otherwise used',
      levels: 4,
      citation: '§ 2B3.1(b)(2)(D)',
      confidence: V,
      exclusiveGroup: 'weapon',
    },
    {
      id: 'weapon-brandished',
      label: 'Dangerous weapon brandished or possessed',
      levels: 3,
      citation: '§ 2B3.1(b)(2)(E)',
      confidence: V,
      exclusiveGroup: 'weapon',
      note: 'Includes an object that closely resembles a weapon, or one used to create that impression. § 2B3.1 cmt. n.2.',
    },
    {
      id: 'threat-of-death',
      label: 'Threat of death made',
      levels: 2,
      citation: '§ 2B3.1(b)(2)(F)',
      confidence: V,
      exclusiveGroup: 'weapon',
    },
    {
      id: 'bodily-injury',
      label: 'Bodily injury',
      levels: 2,
      citation: '§ 2B3.1(b)(3)(A)',
      confidence: V,
      exclusiveGroup: 'injury',
    },
    {
      id: 'injury-between-a-b',
      label: 'Injury between bodily and serious bodily injury',
      levels: 3,
      citation: '§ 2B3.1(b)(3)(D)',
      confidence: V,
      exclusiveGroup: 'injury',
    },
    {
      id: 'serious-bodily-injury',
      label: 'Serious bodily injury',
      levels: 4,
      citation: '§ 2B3.1(b)(3)(B)',
      confidence: V,
      exclusiveGroup: 'injury',
    },
    {
      id: 'injury-between-b-c',
      label: 'Injury between serious and permanent or life-threatening',
      levels: 5,
      citation: '§ 2B3.1(b)(3)(E)',
      confidence: V,
      exclusiveGroup: 'injury',
    },
    {
      id: 'permanent-injury',
      label: 'Permanent or life-threatening bodily injury',
      levels: 6,
      citation: '§ 2B3.1(b)(3)(C)',
      confidence: V,
      exclusiveGroup: 'injury',
    },
    {
      id: 'abducted',
      label: 'Person abducted to facilitate commission of the offense or escape',
      levels: 4,
      citation: '§ 2B3.1(b)(4)(A)',
      confidence: V,
      exclusiveGroup: 'restraint',
    },
    {
      id: 'physically-restrained',
      label: 'Freedom of movement restricted by physical contact or confinement',
      levels: 2,
      citation: '§ 2B3.1(b)(4)(B)',
      confidence: V,
      exclusiveGroup: 'restraint',
    },
    {
      id: 'carjacking',
      label: 'Offense involved carjacking',
      levels: 2,
      citation: '§ 2B3.1(b)(5)',
      confidence: V,
    },
    {
      id: 'firearm-taken',
      label: 'Firearm, destructive device, or controlled substance taken, or an object of the offense',
      levels: 1,
      citation: '§ 2B3.1(b)(6)',
      confidence: V,
    },
  ],
  note: 'Robbery counts are excluded from § 3D1.2(d) aggregation. Separate victims mean separate groups. "Loss" here means the value of the property taken, damaged, or destroyed. § 2B3.1 cmt. n.3.',
};

// ---------------------------------------------------------------------------
// § 2C1.1 — Bribery and public corruption
// ---------------------------------------------------------------------------

const G_2C1_1: GuidelineDef = {
  section: '2C1.1',
  title: 'Offering, Giving, Soliciting, or Receiving a Bribe; Extortion Under Color of Right',
  structured: true,
  confidence: V,
  summary:
    'Base level 14 for a public official, then an increase from the § 2B1.1 loss table for the greatest of the payment value, the benefit received, or the loss to the government.',
  quantityDriver: 'benefit',
  groupsByQuantity: true,
  baseOptions: [
    {
      id: 'official',
      label: 'Defendant was a public official',
      level: 14,
      citation: '§ 2C1.1(a)(1)',
      confidence: V,
    },
    { id: 'other', label: 'Otherwise', level: 12, citation: '§ 2C1.1(a)(2)', confidence: V },
  ],
  defaultBaseLevel: 12,
  socs: [
    {
      id: 'more-than-one-bribe',
      label: 'More than one bribe or extortion',
      levels: 2,
      citation: '§ 2C1.1(b)(1)',
      confidence: V,
    },
    {
      id: 'high-level-official',
      label: 'Elected official, or official in a high-level or sensitive position',
      levels: 4,
      citation: '§ 2C1.1(b)(3)',
      confidence: V,
      minimumLevel: 18,
    },
  ],
  note: 'The § 2C1.1(b)(2) increase uses the § 2B1.1(b)(1) table applied to the greatest of the payment value, the benefit received or to be received, or the loss to the government.',
};

// ---------------------------------------------------------------------------
// § 2D1.1 — Drug trafficking
// ---------------------------------------------------------------------------

const G_2D1_1: GuidelineDef = {
  section: '2D1.1',
  title: 'Unlawful Manufacturing, Importing, Exporting, or Trafficking',
  structured: true,
  confidence: V,
  summary:
    'Base level from the Drug Quantity Table on total converted drug weight, then characteristics for weapons, violence, premises, and the safety-valve reduction.',
  quantityDriver: 'drug',
  groupsByQuantity: true,
  baseOptions: [
    {
      id: 'quantity',
      label: 'Drug Quantity Table (normal case)',
      level: 0,
      citation: '§ 2D1.1(a)(5)',
      confidence: V,
      note: 'Level is computed from the converted drug weight entered below.',
    },
    {
      id: 'death-sbi-prior',
      label: 'Death or serious bodily injury resulted, with a qualifying prior',
      level: 43,
      citation: '§ 2D1.1(a)(1)',
      confidence: V,
    },
    {
      id: 'death-sbi',
      label: 'Death or serious bodily injury resulted',
      level: 38,
      citation: '§ 2D1.1(a)(2)',
      confidence: V,
    },
  ],
  socs: [
    {
      id: 'weapon',
      label: 'Dangerous weapon (including a firearm) possessed',
      levels: 2,
      citation: '§ 2D1.1(b)(1)',
      confidence: V,
      note: 'In tension with the safety valve, and barred where a § 924(c) count is present.',
    },
    {
      id: 'violence',
      label: 'Used violence, made a credible threat of violence, or directed its use',
      levels: 2,
      citation: '§ 2D1.1(b)(2)',
      confidence: V,
    },
    {
      id: 'aircraft-vessel',
      label: 'Aircraft other than a regularly scheduled carrier, or a submersible vessel',
      levels: 2,
      citation: '§ 2D1.1(b)(3)',
      confidence: U,
    },
    {
      id: 'premises',
      label: 'Maintained a premises for manufacturing or distributing a controlled substance',
      levels: 2,
      citation: '§ 2D1.1(b)(12)',
      confidence: V,
    },
    {
      id: 'bodily-injury',
      label: 'Bodily injury resulted from the use of the substance',
      levels: 2,
      citation: '§ 2D1.1(b)(13)',
      confidence: U,
    },
    {
      id: 'safety-valve-reduction',
      label: 'Meets the § 5C1.2(a)(1)–(5) criteria (safety-valve reduction)',
      levels: -2,
      citation: '§ 2D1.1(b)(18)',
      confidence: V,
      note: 'Applied automatically when the safety-valve criteria are all satisfied.',
    },
  ],
  note: 'Under § 2D1.1(a)(5) a defendant who receives a § 3B1.2 mitigating role adjustment has a base offense level capped at 32.',
};

// ---------------------------------------------------------------------------
// § 2K2.1 — Firearms
// ---------------------------------------------------------------------------

const G_2K2_1: GuidelineDef = {
  section: '2K2.1',
  title:
    'Unlawful Receipt, Possession, or Transportation of Firearms or Ammunition; Prohibited Transactions',
  structured: true,
  confidence: V,
  summary:
    'Base level driven by prior crime-of-violence or controlled-substance convictions and the type of firearm, then characteristics for quantity, destructive devices, stolen firearms, machinegun conversion devices, trafficking, and use in connection with another felony.',
  quantityDriver: 'none',
  groupsByQuantity: true,
  baseOptions: [
    {
      id: 'a1',
      label:
        'Large-capacity semiautomatic or § 5845(a) firearm, and two prior felony convictions for a crime of violence or controlled substance offense',
      level: 26,
      citation: '§ 2K2.1(a)(1)',
      confidence: V,
    },
    {
      id: 'a2',
      label: 'Two prior felony convictions for a crime of violence or controlled substance offense',
      level: 24,
      citation: '§ 2K2.1(a)(2)',
      confidence: V,
    },
    {
      id: 'a3',
      label:
        'Large-capacity semiautomatic or § 5845(a) firearm, and one prior felony conviction for a crime of violence or controlled substance offense',
      level: 22,
      citation: '§ 2K2.1(a)(3)',
      confidence: V,
    },
    {
      id: 'a4',
      label: 'One prior felony conviction for a crime of violence or controlled substance offense',
      level: 20,
      citation: '§ 2K2.1(a)(4)(A)',
      confidence: V,
    },
    {
      id: 'a4b',
      label:
        'Large-capacity semiautomatic or § 5845(a) firearm, and the defendant was a prohibited person, or convicted under § 922(d), § 932, or § 933, or under § 922(a)(6) / § 924(a)(1)(A) with knowledge of transfer to a prohibited person',
      level: 20,
      citation: '§ 2K2.1(a)(4)(B)',
      confidence: V,
    },
    {
      id: 'a5',
      label: 'Offense involved a firearm described in 26 U.S.C. § 5845(a)',
      level: 18,
      citation: '§ 2K2.1(a)(5)',
      confidence: V,
    },
    {
      id: 'a6',
      label:
        'Prohibited person at the time of the offense, or convicted under § 922(d), § 932, or § 933, or under § 922(a)(6) / § 924(a)(1)(A) with knowledge of transfer to a prohibited person',
      level: 14,
      citation: '§ 2K2.1(a)(6)',
      confidence: V,
    },
    { id: 'a7', label: 'Otherwise', level: 12, citation: '§ 2K2.1(a)(7)', confidence: V },
    {
      id: 'a8',
      label: 'Convicted under 18 U.S.C. § 922(c), (e), (f), (m), (s), (t), or (x)(1), or § 1715',
      level: 6,
      citation: '§ 2K2.1(a)(8)',
      confidence: V,
    },
  ],
  defaultBaseLevel: 14,
  subtotalCaps: [
    {
      afterSocIds: [
        'firearms-3-7', 'firearms-8-24', 'firearms-25-99', 'firearms-100-199', 'firearms-200',
        'sporting', 'destructive-device-rocket', 'destructive-device-other',
        'stolen', 'altered-serial', 'mcd-4-or-transfer', 'mcd-30',
      ],
      maxLevel: 29,
      unlessSocIds: ['destructive-device-rocket'],
      citation: '§ 2K2.1(b)(5)',
      label: 'Cumulative level from (b)(1)–(b)(5) capped at 29',
    },
  ],
  socs: [
    {
      id: 'firearms-3-7',
      label: '3–7 firearms',
      levels: 2,
      citation: '§ 2K2.1(b)(1)(A)',
      confidence: V,
      exclusiveGroup: 'count',
    },
    {
      id: 'firearms-8-24',
      label: '8–24 firearms',
      levels: 4,
      citation: '§ 2K2.1(b)(1)(B)',
      confidence: V,
      exclusiveGroup: 'count',
    },
    {
      id: 'firearms-25-99',
      label: '25–99 firearms',
      levels: 6,
      citation: '§ 2K2.1(b)(1)(C)',
      confidence: V,
      exclusiveGroup: 'count',
    },
    {
      id: 'firearms-100-199',
      label: '100–199 firearms',
      levels: 8,
      citation: '§ 2K2.1(b)(1)(D)',
      confidence: V,
      exclusiveGroup: 'count',
    },
    {
      id: 'firearms-200',
      label: '200 or more firearms',
      levels: 10,
      citation: '§ 2K2.1(b)(1)(E)',
      confidence: V,
      exclusiveGroup: 'count',
    },
    {
      id: 'sporting',
      label: 'All firearms and ammunition possessed solely for lawful sporting purposes or collection',
      levels: 0,
      citation: '§ 2K2.1(b)(2)',
      confidence: V,
      note: 'Reduces the offense level to 6. Unavailable where (a)(1)–(a)(5) set the base level.',
    },
    {
      id: 'destructive-device-rocket',
      label: 'Destructive device that is a portable rocket, a missile, or a launching device',
      levels: 15,
      citation: '§ 2K2.1(b)(3)(A)',
      confidence: V,
      exclusiveGroup: 'destructive',
      note: 'Applying this lifts the level-29 cumulative cap.',
    },
    {
      id: 'destructive-device-other',
      label: 'Any other destructive device',
      levels: 2,
      citation: '§ 2K2.1(b)(3)(B)',
      confidence: V,
      exclusiveGroup: 'destructive',
    },
    {
      id: 'stolen',
      label: 'Firearm was stolen',
      levels: 2,
      citation: '§ 2K2.1(b)(4)(A)',
      confidence: V,
      exclusiveGroup: 'stolen',
    },
    {
      id: 'altered-serial',
      label: 'Serial number modified so as to be illegible, or firearm knowingly unmarked',
      levels: 4,
      citation: '§ 2K2.1(b)(4)(B)',
      confidence: V,
      exclusiveGroup: 'stolen',
    },
    {
      id: 'mcd-4-or-transfer',
      label: 'Possessed four or more machinegun conversion devices, or transferred or sold any',
      levels: 2,
      citation: '§ 2K2.1(b)(5)(A)',
      confidence: V,
      exclusiveGroup: 'mcd',
      note: 'A part or combination of parts designed solely for converting a weapon into a machinegun — a "switch."',
    },
    {
      id: 'mcd-30',
      label: 'Possessed 30 or more machinegun conversion devices',
      levels: 4,
      citation: '§ 2K2.1(b)(5)(B)',
      confidence: V,
      exclusiveGroup: 'mcd',
    },
    {
      id: 'trafficking-933',
      label: 'Convicted under 18 U.S.C. § 933(a)(2) or (a)(3)',
      levels: 2,
      citation: '§ 2K2.1(b)(6)(A)',
      confidence: V,
      exclusiveGroup: 'trafficking',
    },
    {
      id: 'trafficking-prohibited-person',
      label: 'Trafficked a firearm or ammunition to a prohibited person, or for unlawful use',
      levels: 2,
      citation: '§ 2K2.1(b)(6)(B)',
      confidence: V,
      exclusiveGroup: 'trafficking',
    },
    {
      id: 'trafficking-two-or-more',
      label: 'Trafficked two or more firearms to a person with a qualifying prior or under a criminal justice sentence',
      levels: 5,
      citation: '§ 2K2.1(b)(6)(C)',
      confidence: V,
      exclusiveGroup: 'trafficking',
    },
    {
      id: 'out-of-country',
      label: 'Firearm or ammunition possessed while leaving, or intended to be transported out of, the United States',
      levels: 4,
      citation: '§ 2K2.1(b)(7)(A)',
      confidence: V,
      minimumLevel: 18,
      exclusiveGroup: 'b7',
    },
    {
      id: 'another-felony',
      label: 'Used or possessed any firearm or ammunition in connection with another felony offense',
      levels: 4,
      citation: '§ 2K2.1(b)(7)(B)',
      confidence: V,
      minimumLevel: 18,
      exclusiveGroup: 'b7',
      note: 'Also triggers the § 2K2.1(c)(1) cross reference where the other offense produces a higher level.',
    },
    {
      id: 'group-of-five',
      label: 'Committed in connection with participation in a group of five or more with criminal purposes',
      levels: 2,
      citation: '§ 2K2.1(b)(9)',
      confidence: V,
      note: 'Requires a § 2K2.1(b)(6) enhancement.',
    },
    {
      id: 'coerced-or-vulnerable',
      label: 'Motivated by an intimate or familial relationship, threats, or fear, or unusually vulnerable to inducement',
      levels: -2,
      citation: '§ 2K2.1(b)(10)',
      confidence: V,
      note: 'Requires a § 2K2.1(b)(6) enhancement and no more than one criminal history point.',
    },
  ],
};

// ---------------------------------------------------------------------------
// § 2K2.4 and § 2B1.6 — guideline sentence is the statutory term
// ---------------------------------------------------------------------------

const G_2K2_4: GuidelineDef = {
  section: '2K2.4',
  title: 'Use of a Firearm During or in Relation to Certain Crimes',
  structured: true,
  confidence: V,
  summary:
    'The guideline sentence is the minimum term of imprisonment required by statute, imposed consecutively. No offense level is computed.',
  quantityDriver: 'none',
  groupsByQuantity: false,
  baseOptions: [],
  socs: [],
  note: '§ 2K2.4 cmt. n.4 bars applying a weapon enhancement to any count grouped with the § 924(c) conviction.',
};

const G_2B1_6: GuidelineDef = {
  section: '2B1.6',
  title: 'Aggravated Identity Theft',
  structured: true,
  confidence: V,
  summary:
    'The guideline sentence is the term of imprisonment required by 18 U.S.C. § 1028A, imposed consecutively.',
  quantityDriver: 'none',
  groupsByQuantity: false,
  baseOptions: [],
  socs: [],
  note: '§ 2B1.6 cmt. n.2 bars a related enhancement on the underlying offense.',
};

// ---------------------------------------------------------------------------
// § 2L1.2, § 2S1.1, § 2T1.1
// ---------------------------------------------------------------------------

const G_2L1_2: GuidelineDef = {
  section: '2L1.2',
  title: 'Unlawfully Entering or Remaining in the United States',
  structured: true,
  confidence: V,
  summary:
    'Base level 8, with increases keyed to the sentences imposed for convictions before and after the first order of removal.',
  quantityDriver: 'none',
  groupsByQuantity: false,
  baseOptions: [{ id: 'a', label: 'Base offense level', level: 8, citation: '§ 2L1.2(a)', confidence: V }],
  defaultBaseLevel: 8,
  socs: [
    {
      id: 'prior-illegal-reentry',
      label: 'Prior conviction for illegal reentry',
      levels: 4,
      citation: '§ 2L1.2(b)(1)',
      confidence: U,
    },
    {
      id: 'before-removal-felony-2y',
      label: 'Before first order of removal — felony, sentence of 2 years or more',
      levels: 8,
      citation: '§ 2L1.2(b)(2)(B)',
      confidence: U,
      exclusiveGroup: 'before',
    },
    {
      id: 'before-removal-felony-5y',
      label: 'Before first order of removal — felony, sentence of 5 years or more',
      levels: 10,
      citation: '§ 2L1.2(b)(2)(A)',
      confidence: U,
      exclusiveGroup: 'before',
    },
    {
      id: 'after-removal-felony-2y',
      label: 'After first order of removal — felony, sentence of 2 years or more',
      levels: 8,
      citation: '§ 2L1.2(b)(3)(B)',
      confidence: U,
      exclusiveGroup: 'after',
    },
    {
      id: 'after-removal-felony-5y',
      label: 'After first order of removal — felony, sentence of 5 years or more',
      levels: 10,
      citation: '§ 2L1.2(b)(3)(A)',
      confidence: U,
      exclusiveGroup: 'after',
    },
  ],
  note: 'The 2016 restructure keyed these increases to sentence length rather than the categorical nature of the prior. Confirm the applicable tier.',
};

const G_2S1_1: GuidelineDef = {
  section: '2S1.1',
  title: 'Laundering of Monetary Instruments',
  structured: true,
  confidence: V,
  summary:
    'Base level is the underlying offense level where the defendant committed the underlying offense; otherwise 8 plus the § 2B1.1 table increase for the laundered funds.',
  quantityDriver: 'loss',
  groupsByQuantity: true,
  baseOptions: [
    {
      id: 'a2',
      label: 'Level 8 plus the § 2B1.1(b)(1) increase for the value of the laundered funds',
      level: 8,
      citation: '§ 2S1.1(a)(2)',
      confidence: V,
    },
    {
      id: 'a1',
      label: 'Offense level for the underlying offense (defendant committed it)',
      level: 0,
      citation: '§ 2S1.1(a)(1)',
      confidence: V,
      note: 'Enter the underlying offense level as the manual base level.',
    },
  ],
  defaultBaseLevel: 8,
  socs: [
    {
      id: 'knew-drug-proceeds',
      label: 'Knew or believed the funds were proceeds of drug trafficking or other listed offenses',
      levels: 6,
      citation: '§ 2S1.1(b)(1)',
      confidence: V,
    },
    {
      id: 'convicted-1956',
      label: 'Convicted under 18 U.S.C. § 1956',
      levels: 2,
      citation: '§ 2S1.1(b)(2)(B)',
      confidence: V,
      exclusiveGroup: 'statute',
    },
    {
      id: 'convicted-1957',
      label: 'Convicted under 18 U.S.C. § 1957',
      levels: 1,
      citation: '§ 2S1.1(b)(2)(A)',
      confidence: V,
      exclusiveGroup: 'statute',
    },
    {
      id: 'sophisticated-laundering',
      label: 'Sophisticated laundering',
      levels: 2,
      citation: '§ 2S1.1(b)(3)',
      confidence: V,
      note: 'Applies only where § 2S1.1(b)(2)(B) applies.',
    },
  ],
};

const G_2T1_1: GuidelineDef = {
  section: '2T1.1',
  title: 'Tax Evasion; Fraudulent or False Returns',
  structured: true,
  confidence: V,
  summary: 'Base level comes from the § 2T4.1 Tax Table applied to the tax loss.',
  quantityDriver: 'tax',
  groupsByQuantity: true,
  baseOptions: [],
  socs: [
    {
      id: 'criminal-income',
      label: 'Failure to report criminally derived income exceeding $10,000',
      levels: 2,
      citation: '§ 2T1.1(b)(1)',
      confidence: V,
    },
    {
      id: 'sophisticated-means',
      label: 'Sophisticated means',
      levels: 2,
      citation: '§ 2T1.1(b)(2)',
      confidence: V,
      minimumLevel: 12,
    },
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const STRUCTURED_GUIDELINES: readonly GuidelineDef[] = [
  G_2B1_1,
  G_2B3_1,
  G_2C1_1,
  G_2D1_1,
  G_2K2_1,
  G_2K2_4,
  G_2B1_6,
  G_2L1_2,
  G_2S1_1,
  G_2T1_1,
];

const GUIDELINE_MAP = new Map(STRUCTURED_GUIDELINES.map((g) => [g.section, g]));

/** Guidelines that aggregate quantity across counts under § 3D1.2(d). VERIFY. */
const QUANTITY_GROUPED_SECTIONS = new Set([
  '2B1.1',
  '2B1.5',
  '2B5.1',
  '2B5.3',
  '2C1.1',
  '2C1.2',
  '2D1.1',
  '2D1.2',
  '2D1.5',
  '2E4.1',
  '2F1.1',
  '2K2.1',
  '2S1.1',
  '2S1.3',
  '2T1.1',
  '2T1.4',
  '2T1.6',
]);

/** Guidelines whose counts never group and always run consecutively. */
export const NON_GROUPING_SECTIONS = new Set(['2K2.4', '2B1.6']);

/**
 * Generic definition for any guideline not encoded in Tier 1. The user supplies
 * the base offense level and cites their own adjustments, so nothing is
 * uncomputable — but the app does no offense-specific work.
 */
export function genericGuideline(section: string): GuidelineDef {
  return {
    section,
    title: `§ ${section}`,
    structured: false,
    confidence: 'unverified',
    summary:
      'Not encoded in this build. Enter the base offense level and each specific offense characteristic from the manual, citing the subsection.',
    quantityDriver: 'none',
    groupsByQuantity: QUANTITY_GROUPED_SECTIONS.has(section),
    baseOptions: [],
    socs: [],
  };
}

export function getGuideline(section: string): GuidelineDef {
  return GUIDELINE_MAP.get(section) ?? genericGuideline(section);
}
