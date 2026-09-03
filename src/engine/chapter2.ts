import type { CountInput, CountResult, Flag, SelectedSoc, Step } from './types';
import { getGuideline, NON_GROUPING_SECTIONS, type GuidelineDef, type SocOption } from './data/guidelines';
import { STATUTE_BY_ID } from './data/statutes';
import { drugQuantityLevel, totalConvertedKg } from './data/drugs';
import { lossIncrease, resolveLoss, taxLossLevel } from './data/tables';
import { clampOffenseLevel } from './data/sentencing-table';

/** Facts about the case as a whole that change how a single count is computed. */
export interface Chapter2Context {
  /** True when any count carries a § 924(c) or § 1028A mandatory consecutive term. */
  hasConsecutiveWeaponCount: boolean;
  /** True when every safety-valve criterion is satisfied. */
  safetyValveSatisfied: boolean;
  /** True when the defendant receives a § 3B1.2 mitigating role adjustment on this count. */
  mitigatingRole: boolean;
  /** True specifically for the § 3B1.2(a) minimal-participant 4-level reduction. */
  mitigatingRoleMinimal: boolean;
}

/** Resolve which guideline a count is calculated under. */
export function guidelineForCount(count: CountInput): {
  guideline: GuidelineDef;
  source: 'override' | 'appendix-a' | 'none';
  statuteConfidence?: 'verified' | 'unverified';
} {
  if (count.guidelineOverride) {
    return { guideline: getGuideline(count.guidelineOverride), source: 'override' };
  }
  const statute = count.statuteId ? STATUTE_BY_ID.get(count.statuteId) : undefined;
  const section = statute?.guidelines[0];
  if (statute && section) {
    return {
      guideline: getGuideline(section),
      source: 'appendix-a',
      statuteConfidence: statute.confidence,
    };
  }
  return { guideline: getGuideline('unknown'), source: 'none' };
}

/**
 * Within an exclusive group only the highest-value characteristic applies. The
 * guidelines say this in prose ("if more than one applies, use the greatest");
 * enforcing it here keeps a user from stacking mutually exclusive boxes.
 */
function resolveSocs(
  guideline: GuidelineDef,
  selected: readonly SelectedSoc[],
): { applied: SocOption[]; suppressed: { soc: SocOption; reason: string }[] } {
  const byId = new Map(guideline.socs.map((s) => [s.id, s]));
  const chosen = selected
    .map((s) => byId.get(s.id))
    .filter((s): s is SocOption => s !== undefined);

  const applied: SocOption[] = [];
  const suppressed: { soc: SocOption; reason: string }[] = [];
  const bestInGroup = new Map<string, SocOption>();

  for (const soc of chosen) {
    if (!soc.exclusiveGroup) {
      applied.push(soc);
      continue;
    }
    const current = bestInGroup.get(soc.exclusiveGroup);
    if (!current || soc.levels > current.levels) {
      if (current) {
        suppressed.push({
          soc: current,
          reason: `Superseded by ${soc.citation}; only the greatest characteristic in this set applies.`,
        });
      }
      bestInGroup.set(soc.exclusiveGroup, soc);
    } else {
      suppressed.push({
        soc,
        reason: `Superseded by ${current.citation}; only the greatest characteristic in this set applies.`,
      });
    }
  }
  applied.push(...bestInGroup.values());
  return { applied, suppressed };
}

/** SOCs barred by § 2K2.4 cmt. n.4 when a § 924(c) count is present. */
const WEAPON_SOC_IDS = new Set([
  'weapon', // § 2D1.1(b)(1)
  'firearm-discharged',
  'firearm-specific-threat',
  'firearm-brandished',
  'weapon-otherwise-used',
  'weapon-brandished',
  'threat-of-death',
  'another-felony', // § 2K2.1(b)(7)(B)
]);

export function computeCount(count: CountInput, ctx: Chapter2Context): CountResult {
  const steps: Step[] = [];
  const flags: Flag[] = [];
  const { guideline, source, statuteConfidence } = guidelineForCount(count);

  if (source === 'none') {
    flags.push({
      severity: 'warning',
      code: 'no-guideline',
      message:
        'No statute selected and no guideline override. Enter a statute of conviction, or set the guideline directly.',
    });
  }
  if (statuteConfidence === 'unverified') {
    flags.push({
      severity: 'caution',
      code: 'unverified-appendix-a',
      message: `This statute's Appendix A mapping to § ${guideline.section} was not hand-verified in this build. Confirm against Appendix A.`,
    });
  }
  if (!guideline.structured && source !== 'none') {
    flags.push({
      severity: 'caution',
      code: 'generic-guideline',
      message: `§ ${guideline.section} is not encoded in this build. Enter the base offense level and each characteristic from the manual.`,
    });
  }

  // --- § 924(c) and § 1028A: the guideline sentence is the statutory term ----
  if (NON_GROUPING_SECTIONS.has(guideline.section) || count.consecutiveMandatory) {
    const mandatory = count.consecutiveMandatory;
    steps.push({
      kind: 'base',
      label: mandatory
        ? `Guideline sentence is the statutory term — ${mandatory.label}`
        : 'Guideline sentence is the statutory term',
      citation: guideline.section === '2B1.6' ? '§ 2B1.6' : '§ 2K2.4(b)',
      levels: 0,
      detail: mandatory
        ? `${mandatory.months} months, consecutive (${mandatory.citation})`
        : 'Select the applicable statutory term.',
    });
    if (!mandatory) {
      flags.push({
        severity: 'warning',
        code: 'no-consecutive-term',
        message:
          'No statutory term selected for this count. The consecutive sentence is not included in the total.',
      });
    }
    return {
      countId: count.id,
      guideline: guideline.section,
      guidelineTitle: guideline.title,
      confidence: guideline.confidence,
      steps,
      adjustedOffenseLevel: 0,
      flags,
      excludedFromGrouping: true,
    };
  }

  // --- Base offense level --------------------------------------------------
  let level = 0;
  const baseSocId = count.socs.find((s) => s.id.startsWith('base:'))?.id.slice(5);
  const baseOption = guideline.baseOptions.find((b) => b.id === baseSocId);

  if (guideline.quantityDriver === 'drug' && (!baseOption || baseOption.id === 'quantity')) {
    const convertedKg = totalConvertedKg(count.drugs ?? []);
    level = drugQuantityLevel(convertedKg);
    steps.push({
      kind: 'base',
      label: `Drug Quantity Table — ${convertedKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg converted drug weight`,
      citation: '§ 2D1.1(c)',
      levels: level,
    });
    if (!count.drugs?.length) {
      flags.push({
        severity: 'warning',
        code: 'no-drug-quantity',
        message:
          'No drug quantity entered. The base offense level defaults to the bottom of the Drug Quantity Table.',
        citation: '§ 2D1.1(c)(17)',
      });
    }
    if (ctx.mitigatingRole) {
      // § 2D1.1(a)(5): level 32 drops 2, level 34 drops 3, anything above 34
      // drops to 32. Below 32 the subsection does nothing.
      let reduced = level;
      let rationale = '';
      if (level === 32) {
        reduced = 30;
        rationale = 'Level 32 with a mitigating role decreases by 2.';
      } else if (level === 34) {
        reduced = 31;
        rationale = 'Level 34 with a mitigating role decreases by 3.';
      } else if (level > 34) {
        reduced = 32;
        rationale = 'Above level 34 with a mitigating role decreases to level 32.';
      }
      if (reduced !== level) {
        steps.push({
          kind: 'cap',
          label: 'Mitigating role reduction to the base offense level',
          citation: '§ 2D1.1(a)(5)',
          levels: reduced - level,
          detail: rationale,
        });
        level = reduced;
      }
      // The second sentence of (a)(5): a minimal participant lands at 30.
      if (level > 30 && ctx.mitigatingRoleMinimal) {
        steps.push({
          kind: 'cap',
          label: 'Minimal participant — base offense level decreased to 30',
          citation: '§ 2D1.1(a)(5)',
          levels: 30 - level,
          detail: 'The result exceeded level 30 and the defendant receives the § 3B1.2(a) 4-level reduction.',
        });
        level = 30;
      }
    }
  } else if (guideline.quantityDriver === 'tax') {
    const taxLoss = count.loss?.actualLoss ?? 0;
    level = taxLossLevel(taxLoss);
    steps.push({
      kind: 'base',
      label: `Tax Table — tax loss of $${taxLoss.toLocaleString()}`,
      citation: '§ 2T4.1',
      levels: level,
    });
    if (taxLoss === 0) {
      flags.push({
        severity: 'warning',
        code: 'no-tax-loss',
        message: 'No tax loss entered. The base offense level defaults to the bottom of the Tax Table.',
      });
    }
  } else if (baseOption) {
    level = baseOption.level;
    steps.push({
      kind: 'base',
      label: baseOption.label,
      citation: baseOption.citation,
      levels: level,
      detail: baseOption.note,
    });
  } else if (count.manualBaseLevel !== undefined) {
    level = count.manualBaseLevel;
    steps.push({
      kind: 'base',
      label: 'Base offense level (entered manually)',
      citation: `§ ${guideline.section}(a)`,
      levels: level,
    });
  } else if (guideline.defaultBaseLevel !== undefined) {
    level = guideline.defaultBaseLevel;
    steps.push({
      kind: 'base',
      label: 'Base offense level (default)',
      citation: `§ ${guideline.section}(a)`,
      levels: level,
    });
    flags.push({
      severity: 'caution',
      code: 'default-base-level',
      message: `No base offense level selected; using the default of ${level}. Confirm which subsection of § ${guideline.section}(a) applies.`,
    });
  } else {
    flags.push({
      severity: 'warning',
      code: 'no-base-level',
      message: 'No base offense level entered for this count.',
    });
  }

  // --- Quantity-driven specific offense characteristic ---------------------
  if (guideline.quantityDriver === 'loss' || guideline.quantityDriver === 'benefit') {
    const isBenefit = guideline.quantityDriver === 'benefit';
    const loss = resolveLoss(count.loss);
    const amount = isBenefit ? Math.max(count.benefitValue ?? 0, loss.amount) : loss.amount;
    const ownTable = guideline.ownLossTable;
    const increase = ownTable
      ? (ownTable.find((row) => amount > row.moreThan)?.increase ?? 0)
      : lossIncrease(amount);
    const citation = ownTable
      ? (guideline.ownLossCitation ?? `§ ${guideline.section}(b)`)
      : isBenefit
        ? '§ 2C1.1(b)(2)'
        : '§ 2B1.1(b)(1)';

    if (amount > 0) {
      const basisNote = isBenefit
        ? 'Greatest of the payment value, the benefit received, or the loss to the government.'
        : loss.basis === 'gain'
          ? 'Gain used as a proxy — loss not reasonably determinable. § 2B1.1 cmt. n.3(B).'
          : `Greater of actual and intended loss (${loss.basis}).${
              loss.creditsApplied > 0
                ? ` $${loss.creditsApplied.toLocaleString()} in credits subtracted from $${loss.gross.toLocaleString()}.`
                : ''
            }`;
      steps.push({
        kind: 'soc',
        label: `Loss of $${amount.toLocaleString()}`,
        citation,
        levels: increase,
        detail: basisNote,
      });
      level += increase;

      if (loss.basis === 'intended') {
        flags.push({
          severity: 'caution',
          code: 'intended-loss',
          message:
            'Intended loss exceeds actual loss and is driving the increase. Whether intended loss is properly part of "loss" rests on the application notes and is contested.',
          citation: '§ 2B1.1 cmt. n.3(A)',
        });
      }
      if (loss.basis === 'gain') {
        flags.push({
          severity: 'caution',
          code: 'gain-proxy',
          message:
            'Gain is a fallback used only where loss cannot reasonably be determined — not an alternative measure of loss.',
          citation: '§ 2B1.1 cmt. n.3(B)',
        });
      }
    } else {
      flags.push({
        severity: 'warning',
        code: 'no-loss',
        message: `No ${isBenefit ? 'benefit value' : 'loss'} entered. No increase applied under ${citation}.`,
      });
    }
  }

  // --- Victims (§ 2B1.1(b)(2)) --------------------------------------------
  if (guideline.section === '2B1.1' && count.victimCount !== undefined && count.victimCount > 0) {
    flags.push({
      severity: 'info',
      code: 'victim-count',
      message: `${count.victimCount} victim(s) recorded. Select the applicable § 2B1.1(b)(2) tier — the tiers turn on substantial financial hardship, not victim count alone, above the 10-victim threshold.`,
      citation: '§ 2B1.1(b)(2)',
    });
  }

  // --- Specific offense characteristics ------------------------------------
  const baseLevelForCaps = level;
  const { applied, suppressed } = resolveSocs(guideline, count.socs);
  let floor = 0;

  for (const soc of applied) {
    // § 2K2.4 cmt. n.4 — no weapon enhancement on a count grouped with a § 924(c).
    if (ctx.hasConsecutiveWeaponCount && WEAPON_SOC_IDS.has(soc.id)) {
      steps.push({
        kind: 'soc',
        label: soc.label,
        citation: soc.citation,
        levels: 0,
        suppressed: true,
        detail:
          'Not applied. A § 924(c) count is present, and § 2K2.4 cmt. n.4 bars a weapon enhancement on the underlying offense.',
      });
      flags.push({
        severity: 'warning',
        code: 'k24-double-counting',
        message: `${soc.citation} was suppressed: with a § 924(c) count in the case, applying a weapon enhancement to the underlying count is impermissible double counting.`,
        citation: '§ 2K2.4 cmt. n.4',
      });
      continue;
    }

    // § 2K2.1(b)(2) reduces to level 6 rather than applying a delta.
    if (soc.id === 'sporting') {
      steps.push({
        kind: 'cap',
        label: soc.label,
        citation: soc.citation,
        levels: 6 - level,
        detail: 'Offense level reduced to 6.',
      });
      level = 6;
      continue;
    }

    steps.push({
      kind: 'soc',
      label: soc.label,
      citation: soc.citation,
      levels: soc.levels,
      detail: soc.note,
    });
    level += soc.levels;
    if (soc.minimumLevel !== undefined) floor = Math.max(floor, soc.minimumLevel);

    if (soc.confidence === 'unverified') {
      flags.push({
        severity: 'caution',
        code: 'unverified-soc',
        message: `${soc.citation} — subsection numbering not hand-verified in this build. Confirm against the manual.`,
        citation: soc.citation,
      });
    }
  }

  for (const { soc, reason } of suppressed) {
    steps.push({
      kind: 'soc',
      label: soc.label,
      citation: soc.citation,
      levels: 0,
      suppressed: true,
      detail: reason,
    });
  }

  // --- Free-form characteristics on unstructured guidelines ---------------
  for (const custom of count.socs) {
    if (custom.customLevels === undefined) continue;
    steps.push({
      kind: 'soc',
      label: custom.customLabel ?? 'Specific offense characteristic',
      citation: custom.customCitation ?? `§ ${guideline.section}(b)`,
      levels: custom.customLevels,
      detail: 'Entered manually.',
    });
    level += custom.customLevels;
  }

  // --- Safety valve reduction (§ 2D1.1(b)(18)) -----------------------------
  const alreadyHasSafetyValve = applied.some((s) => s.id === 'safety-valve-reduction');
  if (guideline.section === '2D1.1' && ctx.safetyValveSatisfied && !alreadyHasSafetyValve) {
    steps.push({
      kind: 'soc',
      label: 'Safety-valve reduction — all § 5C1.2(a)(1)–(5) criteria satisfied',
      citation: '§ 2D1.1(b)(18)',
      levels: -2,
    });
    level -= 2;
  }

  // --- Cumulative caps ------------------------------------------------------
  // Some guidelines limit the combined effect of a named set of characteristics.
  // § 2B3.1 caps the weapon and injury increases at 11 levels between them;
  // § 2K2.1 caps the level reached after (b)(1)-(b)(5) at 29.
  const appliedIds = new Set(applied.map((soc) => soc.id));

  for (const cap of guideline.socGroupCaps ?? []) {
    const inGroup = applied.filter((soc) => cap.socIds.includes(soc.id));
    const total = inGroup.reduce((sum, soc) => sum + soc.levels, 0);
    if (total > cap.maxLevels) {
      const excess = total - cap.maxLevels;
      steps.push({
        kind: 'cap',
        label: cap.label,
        citation: cap.citation,
        levels: -excess,
        detail: `${inGroup.map((s) => s.citation).join(' and ')} total ${total} levels, reduced to the ${cap.maxLevels}-level limit.`,
      });
      level -= excess;
      flags.push({
        severity: 'info',
        code: 'soc-group-cap',
        message: `${cap.label}: the combined increase was ${total} levels and is limited to ${cap.maxLevels}.`,
        citation: cap.citation,
      });
    }
  }

  for (const cap of guideline.subtotalCaps ?? []) {
    if (cap.unlessSocIds.some((id) => appliedIds.has(id))) {
      steps.push({
        kind: 'cap',
        label: cap.label,
        citation: cap.citation,
        levels: 0,
        suppressed: true,
        detail: `Not applied — ${cap.unlessSocIds.filter((id) => appliedIds.has(id)).join(', ')} lifts the cap.`,
      });
      continue;
    }
    const subtotal =
      applied
        .filter((soc) => cap.afterSocIds.includes(soc.id))
        .reduce((sum, soc) => sum + soc.levels, 0) + baseLevelForCaps;
    if (subtotal > cap.maxLevel) {
      const excess = subtotal - cap.maxLevel;
      steps.push({
        kind: 'cap',
        label: cap.label,
        citation: cap.citation,
        levels: -excess,
        detail: `The level after those characteristics was ${subtotal}, above the limit of ${cap.maxLevel}.`,
      });
      level -= excess;
    }
  }

  // --- Floors from characteristics -----------------------------------------
  if (floor > 0 && level < floor) {
    steps.push({
      kind: 'cap',
      label: `Offense level floored at ${floor} by an applied characteristic`,
      citation: `§ ${guideline.section}(b)`,
      levels: floor - level,
    });
    level = floor;
  }

  return {
    countId: count.id,
    guideline: guideline.section,
    guidelineTitle: guideline.title,
    confidence: guideline.confidence,
    steps,
    adjustedOffenseLevel: clampOffenseLevel(level),
    flags,
    excludedFromGrouping: false,
  };
}
