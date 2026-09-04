import type { CountGroup, CountInput, CountResult, Flag, GroupResult, Step } from './types';
import { getGuideline } from './data/guidelines';
import { unitIncrease } from './data/tables';
import { clampOffenseLevel } from './data/sentencing-table';

/**
 * Propose groupings under § 3D1.2.
 *
 * The app proposes; the user overrides. Grouping under § 3D1.2(a)–(c) turns on
 * whether counts share a victim and a transaction — facts the app cannot see —
 * so those counts are proposed as separate groups with the reason stated, and
 * the user merges them where the facts warrant.
 */
export function proposeGroups(
  counts: readonly CountInput[],
  results: readonly CountResult[],
): CountGroup[] {
  const groupable = results.filter((r) => !r.excludedFromGrouping);
  const groups: CountGroup[] = [];
  const byQuantityGuideline = new Map<string, string[]>();

  for (const result of groupable) {
    const guideline = getGuideline(result.guideline);
    if (guideline.groupsByQuantity) {
      const bucket = byQuantityGuideline.get(result.guideline) ?? [];
      bucket.push(result.countId);
      byQuantityGuideline.set(result.guideline, bucket);
    } else {
      const count = counts.find((c) => c.id === result.countId);
      groups.push({
        id: `group-${result.countId}`,
        countIds: [result.countId],
        rationale:
          `§ ${result.guideline} counts are not aggregated by quantity under § 3D1.2(d). ` +
          `${count?.label ?? 'This count'} is proposed as its own group — merge it with another count ` +
          'only if they involve the same victim and the same act or transaction.',
        citation: '§ 3D1.2(a)–(b)',
      });
    }
  }

  for (const [section, countIds] of byQuantityGuideline) {
    groups.push({
      id: `group-${section}`,
      countIds,
      rationale:
        countIds.length > 1
          ? `Counts under § ${section} are grouped because the offense level is determined largely by the total amount of harm or loss, which is aggregated across the counts.`
          : `Single count under § ${section}.`,
      citation: '§ 3D1.2(d)',
    });
  }

  return groups;
}

/**
 * § 3D1.3 — the offense level for each group.
 *
 * For groups formed under (a)–(c), the level is the highest of the counts in the
 * group. For (d) groups the caller supplies a level computed on the aggregated
 * quantity, which is why `aggregatedLevels` is a parameter rather than derived here.
 */
export function computeGroupLevels(
  groups: readonly CountGroup[],
  results: readonly CountResult[],
  aggregatedLevels: ReadonlyMap<string, number>,
): { groupResults: GroupResult[]; steps: Step[]; flags: Flag[] } {
  const byId = new Map(results.map((r) => [r.countId, r]));
  const flags: Flag[] = [];
  const steps: Step[] = [];

  const levelled = groups.map((group) => {
    const members = group.countIds
      .map((id) => byId.get(id))
      .filter((r): r is CountResult => r !== undefined);

    const aggregated = aggregatedLevels.get(group.id);
    const highest = members.reduce<CountResult | undefined>(
      (best, r) => (!best || r.adjustedOffenseLevel > best.adjustedOffenseLevel ? r : best),
      undefined,
    );

    const level = aggregated ?? highest?.adjustedOffenseLevel ?? 0;
    return {
      group,
      offenseLevel: level,
      drivingCountId: highest?.countId ?? group.countIds[0] ?? '',
      units: 0,
    } satisfies GroupResult;
  });

  if (levelled.length === 0) {
    return { groupResults: [], steps, flags };
  }

  // --- § 3D1.4 units --------------------------------------------------------
  const highestGroup = levelled.reduce((best, g) =>
    g.offenseLevel > best.offenseLevel ? g : best,
  );
  const top = highestGroup.offenseLevel;

  let units = 0;
  for (const g of levelled) {
    const delta = top - g.offenseLevel;
    if (delta <= 4) {
      g.units = 1;
    } else if (delta <= 8) {
      g.units = 0.5;
    } else {
      g.units = 0;
    }
    units += g.units;
  }

  const increase = unitIncrease(units);
  steps.push({
    kind: 'grouping',
    label: `Highest group offense level: ${top}`,
    citation: '§ 3D1.4',
    levels: top,
    detail:
      levelled.length === 1
        ? 'Single group — no multiple-count adjustment.'
        : `${levelled.length} groups producing ${units} unit${units === 1 ? '' : 's'}.`,
  });

  if (levelled.length > 1) {
    steps.push({
      kind: 'grouping',
      label: `${units} unit${units === 1 ? '' : 's'} under § 3D1.4`,
      citation: '§ 3D1.4',
      levels: increase,
      detail:
        'One unit for the highest group and each group within 4 levels of it; half a unit for groups 5–8 levels below; groups 9 or more levels below are disregarded.',
    });

    const disregarded = levelled.filter((g) => g.units === 0);
    if (disregarded.length > 0) {
      flags.push({
        severity: 'info',
        code: 'groups-disregarded',
        message: `${disregarded.length} group(s) are 9 or more levels below the highest group and are disregarded in the unit count.`,
        citation: '§ 3D1.4(c)',
      });
    }
  }

  return {
    groupResults: levelled,
    steps,
    flags,
  };
}

/** The combined offense level: highest group level plus the § 3D1.4 unit increase. */
export function combinedOffenseLevel(groupResults: readonly GroupResult[]): number {
  if (groupResults.length === 0) return 0;
  const top = Math.max(...groupResults.map((g) => g.offenseLevel));
  const units = groupResults.reduce((sum, g) => sum + g.units, 0);
  return clampOffenseLevel(top + unitIncrease(units));
}
