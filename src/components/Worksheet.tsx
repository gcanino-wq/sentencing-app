'use client';

import type { CaseInput, CaseResult } from '@/engine/types';
import { EDITION } from '@/engine/data/edition';
import { formatRange } from '@/engine/data/sentencing-table';
import { DISTRICT_BY_ID } from '@/engine/data/districts';
import { CATEGORY_NUMERALS, formatMoney, formatMonths } from '@/lib/case';
import { Cite } from './ui';
import { StepList } from './Results';

/**
 * The printable worksheet. Deliberately anonymous: no defendant name, case
 * number, or caption. Hand-label a printout before attaching it to anything.
 */
export function Worksheet({ input, result }: { input: CaseInput; result: CaseResult }) {
  const district = DISTRICT_BY_ID.get(input.districtId);
  const countById = new Map(input.counts.map((c) => [c.id, c]));

  return (
    <div className="hidden print-only text-[10.5pt] leading-snug">
      <header className="border-b border-line pb-2 mb-3">
        <h1 className="text-[13pt] font-semibold">Guideline Calculation Worksheet</h1>
        <p className="text-muted">
          {EDITION.name} · {district?.name ?? 'District not specified'} ({district?.circuit} Circuit)
          {input.offenseDate ? ` · Offense date ${input.offenseDate}` : ''}
        </p>
      </header>

      {/* Worksheet A — offense level per count */}
      <section className="mb-4 print-block">
        <h2 className="font-semibold mb-1">A. Offense level by count</h2>
        {result.counts.map((count) => {
          const input = countById.get(count.countId);
          return (
            <div key={count.countId} className="mb-3 print-block">
              <h3 className="font-medium">
                {input?.label ?? count.countId} — § {count.guideline}, {count.guidelineTitle}
              </h3>
              <StepList steps={count.steps} showZero />
              <p className="mt-1 font-medium tabular-nums">
                {count.excludedFromGrouping
                  ? 'Mandatory consecutive term — no offense level computed'
                  : `Adjusted offense level: ${count.adjustedOffenseLevel}`}
              </p>
            </div>
          );
        })}
      </section>

      {/* Worksheet B — grouping */}
      <section className="mb-4 print-block">
        <h2 className="font-semibold mb-1">
          B. Multiple counts <Cite section="§ 3D1.1–3D1.5" />
        </h2>
        {result.groups.map((group) => (
          <div key={group.group.id} className="mb-1.5">
            <div className="tabular-nums">
              <span className="font-medium">Level {group.offenseLevel}</span>
              <span className="text-muted">
                {' '}
                — {group.group.countIds.map((id) => countById.get(id)?.label ?? id).join(', ')} ·{' '}
                {group.units} unit{group.units === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-2xs text-muted leading-snug">
              {group.group.rationale} <Cite section={group.group.citation} />
            </p>
          </div>
        ))}
        <StepList steps={result.groupingSteps} />
        <p className="mt-1 font-medium tabular-nums">
          Combined offense level: {result.combinedOffenseLevel}
        </p>
      </section>

      {/* Worksheet C — criminal history */}
      <section className="mb-4 print-block">
        <h2 className="font-semibold mb-1">
          C. Criminal history <Cite section="Ch. 4, Pt. A" />
        </h2>
        <StepList steps={result.criminalHistory.steps} showZero />
        <p className="mt-1 font-medium tabular-nums">
          {result.criminalHistory.points} points · Criminal History Category{' '}
          {CATEGORY_NUMERALS[result.criminalHistory.category - 1]}
          {result.criminalHistory.categoryOverriddenBy
            ? ` (set by ${result.criminalHistory.categoryOverriddenBy})`
            : ''}
        </p>
      </section>

      {/* Worksheet D — the sentence */}
      <section className="mb-4 print-block">
        <h2 className="font-semibold mb-1">D. Determining the sentence</h2>
        <StepList steps={result.finalSteps} showZero />
        <table className="w-full mt-2 tabular-nums">
          <tbody className="[&_th]:text-left [&_th]:font-normal [&_th]:text-muted [&_th]:pr-3 [&_td]:font-medium">
            <tr>
              <th scope="row">Total offense level</th>
              <td>{result.totalOffenseLevel}</td>
            </tr>
            <tr>
              <th scope="row">Criminal History Category</th>
              <td>{CATEGORY_NUMERALS[result.criminalHistory.category - 1]}</td>
            </tr>
            <tr>
              <th scope="row">Sentencing Table range</th>
              <td>{formatRange(result.tableRange)}</td>
            </tr>
            <tr>
              <th scope="row">Advisory guideline range</th>
              <td>{formatRange(result.guidelineRange)}</td>
            </tr>
            {result.statutory.minMonths > 0 ? (
              <tr>
                <th scope="row">Mandatory minimum</th>
                <td>{formatMonths(result.statutory.minMonths)}</td>
              </tr>
            ) : null}
            <tr>
              <th scope="row">Statutory maximum</th>
              <td>
                {result.statutory.maxMonths === null
                  ? 'Life'
                  : formatMonths(result.statutory.maxMonths)}
              </td>
            </tr>
            {result.statutory.consecutiveCounts.map((c) => (
              <tr key={c.countId}>
                <th scope="row">Consecutive — {c.label}</th>
                <td>
                  {c.months} months ({c.citation})
                </td>
              </tr>
            ))}
            {result.statutory.consecutiveCounts.length > 0 ? (
              <tr>
                <th scope="row">Total exposure</th>
                <td>{formatRange(result.aggregate.totalRange)}</td>
              </tr>
            ) : null}
            <tr>
              <th scope="row">Zone</th>
              <td>{result.chapter5.zone}</td>
            </tr>
            <tr>
              <th scope="row">Supervised release</th>
              <td>
                {result.chapter5.supervisedRelease.max === null
                  ? `${result.chapter5.supervisedRelease.min / 12} years to life`
                  : `${result.chapter5.supervisedRelease.min / 12}–${result.chapter5.supervisedRelease.max / 12} years`}
              </td>
            </tr>
            <tr>
              <th scope="row">Fine range</th>
              <td>
                {formatMoney(result.chapter5.fine.min)}–{formatMoney(result.chapter5.fine.max)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-1 text-2xs text-muted">{result.chapter5.probationNote}</p>
      </section>

      {/* Departures and variances */}
      {result.ladder.length > 1 ? (
        <section className="mb-4 print-block">
          <h2 className="font-semibold mb-1">E. Departures and variances</h2>
          <ul className="space-y-0.5">
            {result.ladder.map((rung, i) => (
              <li key={i} className="flex justify-between gap-3 tabular-nums">
                <span>
                  {rung.label}
                  {rung.citation ? <Cite section={rung.citation} className="ml-1" /> : null}
                </span>
                <span className="font-medium shrink-0">{formatRange(rung.range)}</span>
              </li>
            ))}
          </ul>
          {input.variance?.entries.length ? (
            <div className="mt-2">
              <h3 className="font-medium">18 U.S.C. § 3553(a) factors</h3>
              <dl className="mt-1 space-y-1">
                {input.variance.entries
                  .filter((e) => e.argument.trim())
                  .map((entry, i) => (
                    <div key={i}>
                      <dt className="text-muted">{entry.factor}</dt>
                      <dd className="whitespace-pre-wrap">{entry.argument}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Warnings */}
      {result.flags.length > 0 ? (
        <section className="mb-4 print-block">
          <h2 className="font-semibold mb-1">Warnings and open questions</h2>
          <ul className="space-y-1">
            {result.flags.map((flag, i) => (
              <li key={i}>
                <span className="font-medium">
                  {flag.severity === 'warning' ? 'Warning' : flag.severity === 'caution' ? 'Caution' : 'Note'}.
                </span>{' '}
                {flag.message}
                {flag.citation ? <Cite section={flag.citation} className="ml-1" /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="border-t border-line pt-2 mt-4 text-2xs text-muted">
        <p>
          Estimation aid prepared by counsel. The guidelines are advisory; the court and the Probation
          Office make the actual determination. Figures derived from data encoded on{' '}
          {EDITION.encodedOn} that has not been verified against the published Guidelines Manual.
          Verify every figure before use.
        </p>
        <p className="mt-1">This worksheet is anonymous by design. Label it by hand.</p>
      </footer>
    </div>
  );
}
