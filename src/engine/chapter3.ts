import type { Chapter3Selections, CountResult, Flag, Step } from './types';
import { clampOffenseLevel } from './data/sentencing-table';

/** Result of applying per-count Chapter 3 adjustments. */
export interface Chapter3Result {
  level: number;
  steps: Step[];
  flags: Flag[];
  /** § 3A1.4 forces Criminal History Category VI. */
  terrorismApplied: boolean;
  /** § 3B1.2 adjustment applied — feeds back into the § 2D1.1(a)(5) cap. */
  mitigatingRoleApplied: boolean;
}

const AGGRAVATING_ROLE = {
  a: { levels: 4, label: 'Organizer or leader of five or more participants, or otherwise extensive', citation: '§ 3B1.1(a)' },
  b: { levels: 3, label: 'Manager or supervisor of five or more participants, or otherwise extensive', citation: '§ 3B1.1(b)' },
  c: { levels: 2, label: 'Organizer, leader, manager, or supervisor in any other criminal activity', citation: '§ 3B1.1(c)' },
} as const;

const MITIGATING_ROLE = {
  minimal: { levels: -4, label: 'Minimal participant', citation: '§ 3B1.2(a)' },
  intermediate: { levels: -3, label: 'Between minimal and minor participant', citation: '§ 3B1.2' },
  minor: { levels: -2, label: 'Minor participant', citation: '§ 3B1.2(b)' },
} as const;

export function applyChapter3(
  startingLevel: number,
  sel: Chapter3Selections,
): Chapter3Result {
  const steps: Step[] = [];
  const flags: Flag[] = [];
  let level = startingLevel;
  let terrorismApplied = false;
  let mitigatingRoleApplied = false;

  const add = (label: string, citation: string, levels: number, detail?: string) => {
    steps.push({ kind: 'chapter3', label, citation, levels, detail });
    level += levels;
  };

  // --- Part A: victim-related adjustments ----------------------------------
  if (sel.hateCrime) {
    add('Hate crime motivation', '§ 3A1.1(a)', 3);
    flags.push({
      severity: 'info',
      code: 'hate-crime-2h11',
      message:
        'The § 3A1.1(a) adjustment does not apply where an adjustment under § 2H1.1(b)(1) applies.',
      citation: '§ 3A1.1, special instruction',
    });
  }

  if (sel.vulnerableVictim) {
    add('Vulnerable victim', '§ 3A1.1(b)(1)', 2);
    if (sel.vulnerableVictimMany) add('Large number of vulnerable victims', '§ 3A1.1(b)(2)', 2);
  }

  // § 3A1.2 says "apply the greatest"; the three routes are mutually exclusive.
  if (sel.officialVictim === 'standard') {
    add('Official victim', '§ 3A1.2(a)', 3);
  } else if (sel.officialVictim === 'chapterTwoPartA') {
    add(
      'Official victim, where the applicable Chapter Two guideline is from Part A',
      '§ 3A1.2(b)',
      6,
    );
  } else if (sel.officialVictim === 'assaultive') {
    add(
      'Assaulted a law enforcement officer or prison official, creating a substantial risk of serious bodily injury',
      '§ 3A1.2(c)',
      6,
    );
  }

  // § 3A1.5 serious human rights offense.
  if (sel.humanRights === 'genocide1091c') {
    add('Convicted of an offense under 18 U.S.C. § 1091(c)', '§ 3A1.5(a)', 2);
  } else if (sel.humanRights === 'other') {
    add('Convicted of a serious human rights offense', '§ 3A1.5(b)', 4);
    if (sel.humanRightsDeathResulted && level < 37) {
      steps.push({
        kind: 'chapter3',
        label: 'Offense level floored at 37 — death resulted',
        citation: '§ 3A1.5(b)',
        levels: 37 - level,
      });
      level = 37;
    }
  }

  if (sel.restraintOfVictim) add('Victim physically restrained', '§ 3A1.3', 2);

  if (sel.terrorism) {
    terrorismApplied = true;
    add(
      'Felony that involved or was intended to promote a federal crime of terrorism',
      '§ 3A1.4(a)',
      12,
    );
    if (level < 32) {
      steps.push({
        kind: 'chapter3',
        label: 'Offense level floored at 32',
        citation: '§ 3A1.4(a)',
        levels: 32 - level,
      });
      level = 32;
    }
    flags.push({
      severity: 'warning',
      code: 'terrorism-chc',
      message:
        'The § 3A1.4 adjustment also sets the Criminal History Category at VI regardless of the computed points.',
      citation: '§ 3A1.4(b)',
    });
  }

  // --- Part B: role in the offense -----------------------------------------
  if (sel.aggravatingRole && sel.aggravatingRole !== 'none') {
    const role = AGGRAVATING_ROLE[sel.aggravatingRole];
    add(role.label, role.citation, role.levels);
  }

  if (sel.mitigatingRole && sel.mitigatingRole !== 'none') {
    const role = MITIGATING_ROLE[sel.mitigatingRole];
    mitigatingRoleApplied = true;
    add(role.label, role.citation, role.levels);
    if (sel.aggravatingRole && sel.aggravatingRole !== 'none') {
      flags.push({
        severity: 'warning',
        code: 'role-conflict',
        message:
          'Both an aggravating and a mitigating role adjustment are applied to the same count. These are mutually exclusive.',
        citation: '§ 3B1.1, § 3B1.2',
      });
    }
  }

  if (sel.abuseOfTrust) add('Abuse of a position of trust or use of a special skill', '§ 3B1.3', 2);

  // --- Part C: obstruction --------------------------------------------------
  if (sel.obstruction) add('Obstructing or impeding the administration of justice', '§ 3C1.1', 2);

  // --- § 2X1.1 inchoate reduction ------------------------------------------
  if (sel.inchoateReduction) {
    if (sel.substantiallyCompleted) {
      steps.push({
        kind: 'chapter3',
        label: 'Inchoate offense reduction',
        citation: '§ 2X1.1(b)(1)',
        levels: 0,
        suppressed: true,
        detail:
          'Not applied — the substantive offense was substantially completed, or the defendant was about to complete all acts but for interruption.',
      });
    } else {
      add(
        'Attempt, conspiracy, or solicitation — substantive offense not substantially completed',
        '§ 2X1.1(b)(1)',
        -3,
      );
      flags.push({
        severity: 'info',
        code: 'inchoate-reduction',
        message:
          'The § 2X1.1 reduction does not apply where the guideline for the substantive offense expressly covers a conspiracy or attempt — as § 2D1.1 does for 21 U.S.C. § 846.',
        citation: '§ 2X1.1(c)(1)',
      });
    }
  }

  return {
    level: clampOffenseLevel(level),
    steps,
    flags,
    terrorismApplied,
    mitigatingRoleApplied,
  };
}

/**
 * § 3E1.1 acceptance of responsibility. Applied once to the combined offense
 * level, not per count.
 */
export function applyAcceptance(
  combinedLevel: number,
  acceptance: { granted: boolean; thirdPointMoved?: boolean } | undefined,
  obstructionApplied: boolean,
): { level: number; steps: Step[]; flags: Flag[] } {
  const steps: Step[] = [];
  const flags: Flag[] = [];

  if (!acceptance?.granted) return { level: combinedLevel, steps, flags };

  let level = combinedLevel - 2;
  steps.push({
    kind: 'acceptance',
    label: 'Acceptance of responsibility',
    citation: '§ 3E1.1(a)',
    levels: -2,
  });

  if (combinedLevel >= 16 && acceptance.thirdPointMoved) {
    level -= 1;
    steps.push({
      kind: 'acceptance',
      label: 'Timely notification of intent to plead — third point on government motion',
      citation: '§ 3E1.1(b)',
      levels: -1,
    });
  } else if (combinedLevel >= 16 && !acceptance.thirdPointMoved) {
    steps.push({
      kind: 'acceptance',
      label: 'Third acceptance point',
      citation: '§ 3E1.1(b)',
      levels: 0,
      suppressed: true,
      detail: 'Available at offense level 16 or greater, but requires a government motion.',
    });
  } else if (combinedLevel < 16 && acceptance.thirdPointMoved) {
    steps.push({
      kind: 'acceptance',
      label: 'Third acceptance point',
      citation: '§ 3E1.1(b)',
      levels: 0,
      suppressed: true,
      detail: `Not available — the offense level before acceptance is ${combinedLevel}, below the threshold of 16.`,
    });
  }

  if (obstructionApplied) {
    flags.push({
      severity: 'warning',
      code: 'acceptance-with-obstruction',
      message:
        'Acceptance of responsibility is applied alongside an obstruction enhancement. Conduct resulting in a § 3C1.1 enhancement ordinarily indicates that the defendant has not accepted responsibility; both apply only in an extraordinary case.',
      citation: '§ 3E1.1 cmt. n.4',
    });
  }

  return { level: clampOffenseLevel(level), steps, flags };
}
