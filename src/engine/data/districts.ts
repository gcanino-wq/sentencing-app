/**
 * Federal judicial districts and their circuits.
 *
 * The circuit drives which jurisdiction-specific cautions the app surfaces. It
 * flags open questions; it does not resolve them.
 */
export interface District {
  id: string;
  name: string;
  circuit: string;
}

export const DEFAULT_DISTRICT_ID = 'pr';

export const DISTRICTS: readonly District[] = [
  { id: 'me', name: 'District of Maine', circuit: '1st' },
  { id: 'ma', name: 'District of Massachusetts', circuit: '1st' },
  { id: 'nh', name: 'District of New Hampshire', circuit: '1st' },
  { id: 'pr', name: 'District of Puerto Rico', circuit: '1st' },
  { id: 'ri', name: 'District of Rhode Island', circuit: '1st' },
  { id: 'ct', name: 'District of Connecticut', circuit: '2d' },
  { id: 'nynd', name: 'N.D. New York', circuit: '2d' },
  { id: 'nyed', name: 'E.D. New York', circuit: '2d' },
  { id: 'nysd', name: 'S.D. New York', circuit: '2d' },
  { id: 'nywd', name: 'W.D. New York', circuit: '2d' },
  { id: 'vt', name: 'District of Vermont', circuit: '2d' },
  { id: 'de', name: 'District of Delaware', circuit: '3d' },
  { id: 'njd', name: 'District of New Jersey', circuit: '3d' },
  { id: 'paed', name: 'E.D. Pennsylvania', circuit: '3d' },
  { id: 'pamd', name: 'M.D. Pennsylvania', circuit: '3d' },
  { id: 'pawd', name: 'W.D. Pennsylvania', circuit: '3d' },
  { id: 'vi', name: 'District of the Virgin Islands', circuit: '3d' },
  { id: 'mdd', name: 'District of Maryland', circuit: '4th' },
  { id: 'nced', name: 'E.D. North Carolina', circuit: '4th' },
  { id: 'ncmd', name: 'M.D. North Carolina', circuit: '4th' },
  { id: 'ncwd', name: 'W.D. North Carolina', circuit: '4th' },
  { id: 'scd', name: 'District of South Carolina', circuit: '4th' },
  { id: 'vaed', name: 'E.D. Virginia', circuit: '4th' },
  { id: 'vawd', name: 'W.D. Virginia', circuit: '4th' },
  { id: 'wvnd', name: 'N.D. West Virginia', circuit: '4th' },
  { id: 'wvsd', name: 'S.D. West Virginia', circuit: '4th' },
  { id: 'laed', name: 'E.D. Louisiana', circuit: '5th' },
  { id: 'lamd', name: 'M.D. Louisiana', circuit: '5th' },
  { id: 'lawd', name: 'W.D. Louisiana', circuit: '5th' },
  { id: 'msnd', name: 'N.D. Mississippi', circuit: '5th' },
  { id: 'mssd', name: 'S.D. Mississippi', circuit: '5th' },
  { id: 'txnd', name: 'N.D. Texas', circuit: '5th' },
  { id: 'txed', name: 'E.D. Texas', circuit: '5th' },
  { id: 'txsd', name: 'S.D. Texas', circuit: '5th' },
  { id: 'txwd', name: 'W.D. Texas', circuit: '5th' },
  { id: 'kyed', name: 'E.D. Kentucky', circuit: '6th' },
  { id: 'kywd', name: 'W.D. Kentucky', circuit: '6th' },
  { id: 'mied', name: 'E.D. Michigan', circuit: '6th' },
  { id: 'miwd', name: 'W.D. Michigan', circuit: '6th' },
  { id: 'ohnd', name: 'N.D. Ohio', circuit: '6th' },
  { id: 'ohsd', name: 'S.D. Ohio', circuit: '6th' },
  { id: 'tned', name: 'E.D. Tennessee', circuit: '6th' },
  { id: 'tnmd', name: 'M.D. Tennessee', circuit: '6th' },
  { id: 'tnwd', name: 'W.D. Tennessee', circuit: '6th' },
  { id: 'ilnd', name: 'N.D. Illinois', circuit: '7th' },
  { id: 'ilcd', name: 'C.D. Illinois', circuit: '7th' },
  { id: 'ilsd', name: 'S.D. Illinois', circuit: '7th' },
  { id: 'innd', name: 'N.D. Indiana', circuit: '7th' },
  { id: 'insd', name: 'S.D. Indiana', circuit: '7th' },
  { id: 'wied', name: 'E.D. Wisconsin', circuit: '7th' },
  { id: 'wiwd', name: 'W.D. Wisconsin', circuit: '7th' },
  { id: 'ared', name: 'E.D. Arkansas', circuit: '8th' },
  { id: 'arwd', name: 'W.D. Arkansas', circuit: '8th' },
  { id: 'iand', name: 'N.D. Iowa', circuit: '8th' },
  { id: 'iasd', name: 'S.D. Iowa', circuit: '8th' },
  { id: 'mnd', name: 'District of Minnesota', circuit: '8th' },
  { id: 'moed', name: 'E.D. Missouri', circuit: '8th' },
  { id: 'mowd', name: 'W.D. Missouri', circuit: '8th' },
  { id: 'ned', name: 'District of Nebraska', circuit: '8th' },
  { id: 'ndd', name: 'District of North Dakota', circuit: '8th' },
  { id: 'sdd', name: 'District of South Dakota', circuit: '8th' },
  { id: 'akd', name: 'District of Alaska', circuit: '9th' },
  { id: 'azd', name: 'District of Arizona', circuit: '9th' },
  { id: 'cand', name: 'N.D. California', circuit: '9th' },
  { id: 'caed', name: 'E.D. California', circuit: '9th' },
  { id: 'cacd', name: 'C.D. California', circuit: '9th' },
  { id: 'casd', name: 'S.D. California', circuit: '9th' },
  { id: 'gud', name: 'District of Guam', circuit: '9th' },
  { id: 'hid', name: 'District of Hawaii', circuit: '9th' },
  { id: 'idd', name: 'District of Idaho', circuit: '9th' },
  { id: 'mtd', name: 'District of Montana', circuit: '9th' },
  { id: 'nvd', name: 'District of Nevada', circuit: '9th' },
  { id: 'mp', name: 'District of the Northern Mariana Islands', circuit: '9th' },
  { id: 'ord', name: 'District of Oregon', circuit: '9th' },
  { id: 'waed', name: 'E.D. Washington', circuit: '9th' },
  { id: 'wawd', name: 'W.D. Washington', circuit: '9th' },
  { id: 'cod', name: 'District of Colorado', circuit: '10th' },
  { id: 'ksd', name: 'District of Kansas', circuit: '10th' },
  { id: 'nmd', name: 'District of New Mexico', circuit: '10th' },
  { id: 'oknd', name: 'N.D. Oklahoma', circuit: '10th' },
  { id: 'oked', name: 'E.D. Oklahoma', circuit: '10th' },
  { id: 'okwd', name: 'W.D. Oklahoma', circuit: '10th' },
  { id: 'utd', name: 'District of Utah', circuit: '10th' },
  { id: 'wyd', name: 'District of Wyoming', circuit: '10th' },
  { id: 'alnd', name: 'N.D. Alabama', circuit: '11th' },
  { id: 'almd', name: 'M.D. Alabama', circuit: '11th' },
  { id: 'alsd', name: 'S.D. Alabama', circuit: '11th' },
  { id: 'flnd', name: 'N.D. Florida', circuit: '11th' },
  { id: 'flmd', name: 'M.D. Florida', circuit: '11th' },
  { id: 'flsd', name: 'S.D. Florida', circuit: '11th' },
  { id: 'gand', name: 'N.D. Georgia', circuit: '11th' },
  { id: 'gamd', name: 'M.D. Georgia', circuit: '11th' },
  { id: 'gasd', name: 'S.D. Georgia', circuit: '11th' },
  { id: 'dcd', name: 'District of Columbia', circuit: 'D.C.' },
];

export const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));

export interface JurisdictionCaution {
  code: string;
  message: string;
  citation?: string;
  /** Circuits where this caution is shown. Empty means all. */
  circuits?: string[];
  /** Districts where this caution is shown. */
  districts?: string[];
  /** Only shown when the calculation touches this concern. */
  appliesWhen: 'loss' | 'careerOffender' | 'acca' | 'fastTrack' | 'always';
}

/**
 * Jurisdiction-specific cautions. These name open questions; they do not decide
 * them. Deliberately narrow — a caution that overstates the law is worse than none.
 */
export const JURISDICTION_CAUTIONS: readonly JurisdictionCaution[] = [
  {
    code: 'loss-commentary-deference',
    appliesWhen: 'loss',
    message:
      'Whether "loss" in § 2B1.1 includes intended loss turns on the application notes rather than the guideline text. Circuits have divided on the deference owed to that commentary after Kisor v. Wilkie. Confirm your circuit\'s position before conceding intended loss.',
    citation: '§ 2B1.1 cmt. n.3(A)',
  },
  {
    code: 'career-offender-predicate',
    appliesWhen: 'careerOffender',
    message:
      'Whether a prior qualifies as a crime of violence or controlled substance offense is a categorical question decided by the elements, not the offense name or the underlying facts. This app does not decide it.',
    citation: '§ 4B1.2',
  },
  {
    code: 'acca-occasions',
    appliesWhen: 'acca',
    message:
      'ACCA requires that the three predicates were committed on occasions different from one another. After Wooden v. United States and Erlinger v. United States, that is a jury question — confirm how it was charged and found.',
    citation: '18 U.S.C. § 924(e)',
  },
  {
    code: 'pr-predicate',
    appliesWhen: 'careerOffender',
    districts: ['pr'],
    message:
      'Puerto Rico Penal Code convictions require element-by-element analysis under the code in force at the time — the 1974, 2004, and 2012 codes renumbered and redefined offenses, so the article number alone establishes nothing. This is a First Circuit research question.',
  },
  {
    code: 'pr-acca-predicate',
    appliesWhen: 'acca',
    districts: ['pr'],
    message:
      'A Puerto Rico conviction offered as an ACCA predicate needs the same element-by-element analysis under the code in force. Confirm the code year for each prior below.',
  },
  {
    code: 'fast-track',
    appliesWhen: 'fastTrack',
    message:
      'Whether a § 5K3.1 early disposition departure is available depends on whether this district operates an authorized fast-track program. Confirm with the U.S. Attorney\'s Office.',
    citation: '§ 5K3.1',
  },
];

export function circuitFor(districtId: string): string {
  return DISTRICT_BY_ID.get(districtId)?.circuit ?? '';
}

export function cautionsFor(
  districtId: string,
  concerns: readonly JurisdictionCaution['appliesWhen'][],
): JurisdictionCaution[] {
  const circuit = circuitFor(districtId);
  return JURISDICTION_CAUTIONS.filter((c) => {
    if (!concerns.includes(c.appliesWhen) && c.appliesWhen !== 'always') return false;
    if (c.districts && !c.districts.includes(districtId)) return false;
    if (c.circuits && !c.circuits.includes(circuit)) return false;
    return true;
  });
}
