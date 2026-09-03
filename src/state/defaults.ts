import type { Annotations } from '../engine/worksheets';
import type { CaseFacts } from '../engine/types';

export interface Matter {
  id: string;
  name: string;
  when: string;
  detail: string;
  tags: string[];
  /** Screen this matter opens onto. */
  opens: 'worksheet' | 'search';
}

export const EDITION_LABEL = 'Guidelines Manual, Nov. 2024';

/**
 * The worked example the app opens on: wire fraud under §2B1.1, $1.2M loss,
 * 12 victims, sophisticated means, one 90-day prior.
 */
export const DEFAULT_FACTS: CaseFacts = {
  statMax: 20,
  loss: 1_200_000,
  victims: 12,
  hardship: 'none',
  socs: ['soph'],
  role: 'none',
  obstruction: false,
  acceptance: 3,
  chMode: 'guided',
  statusPoints: false,
  priors: [{ desc: 'Theft by deception, Ohio C.P.', meta: '2019 · 90 days jail', pts: 2 }],
};

export const DEFAULT_ANNOTATIONS: Annotations = {
  contested: { A2b: true },
  notes: { A2b: "Loss per gov't spreadsheet; restitution figure disputed" },
};

export const MATTERS: Matter[] = [
  {
    id: 'ellery',
    name: 'United States v. Ellery',
    when: '2d ago',
    detail: '1 count · 18 U.S.C. § 1343 · plea negotiation',
    tags: ['§2B1.1', '3 scenarios'],
    opens: 'worksheet',
  },
  {
    id: 'okonjo',
    name: 'United States v. Okonjo',
    when: 'Aug 19',
    detail: '2 counts · § 922(g)(1), § 924(a)(8) · sentencing 10/14',
    tags: ['§2K2.1', 'ACCA flagged'],
    opens: 'search',
  },
];

export const SEARCH_QUERY = '18 U.S.C. § 1343';

export interface StatuteResult {
  title: string;
  guideline: string;
  sub: string;
}

export const SEARCH_RESULTS: StatuteResult[] = [
  {
    title: 'Wire fraud',
    guideline: '§2B1.1',
    sub: 'Fraud and deceit · theft · property destroyed by fraud',
  },
  {
    title: 'Wire fraud affecting a financial institution',
    guideline: '§2B1.1',
    sub: '30-year statutory maximum · base offense level 7',
  },
  {
    title: 'Bank fraud',
    guideline: '§2B1.1',
    sub: '18 U.S.C. § 1344 · adjacent count often charged together',
  },
];
