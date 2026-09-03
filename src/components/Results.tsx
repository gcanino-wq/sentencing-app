'use client';

import type { CaseResult, MonthRange, Step } from '@/engine/types';
import { SENTENCING_TABLE, formatRange, zoneForRange } from '@/engine/data/sentencing-table';
import { EDITION } from '@/engine/data/edition';
import { CATEGORY_NUMERALS, formatMoney, formatMonths } from '@/lib/case';
import { Cite, FlagList, SubHead } from './ui';

// ---------------------------------------------------------------------------
// Sentencing Table grid
// ---------------------------------------------------------------------------

const ZONE_FILL = {
  A: 'bg-[rgb(var(--ink))]/[0.03]',
  B: 'bg-[rgb(var(--ink))]/[0.06]',
  C: 'bg-[rgb(var(--ink))]/[0.10]',
  D: 'bg-transparent',
} as const;

export function SentencingTableGrid({
  level,
  category,
}: {
  level: number;
  category: number;
}) {
  // Show a window around the current level rather than all 43 rows, so the cell
  // and its neighbours stay legible without scrolling the page.
  const from = Math.max(1, Math.min(level - 6, 43 - 12));
  const to = Math.min(43, from + 12);
  const rows = SENTENCING_TABLE.slice(from - 1, to);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] tabular-nums border-collapse">
        <caption className="sr-only">
          Sentencing Table, levels {from} to {to}. Current cell: level {level}, Criminal History
          Category {CATEGORY_NUMERALS[category - 1]}.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="text-left font-medium text-faint pb-1 pr-1">
              Lvl
            </th>
            {CATEGORY_NUMERALS.map((numeral, i) => (
              <th
                key={numeral}
                scope="col"
                className={`font-medium pb-1 px-0.5 text-center ${
                  i + 1 === category ? 'text-accent' : 'text-faint'
                }`}
              >
                {numeral}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowLevel = from + i;
            const isCurrentRow = rowLevel === level;
            return (
              <tr key={rowLevel} className={isCurrentRow ? 'font-semibold' : ''}>
                <th
                  scope="row"
                  className={`text-left pr-1 font-medium ${
                    isCurrentRow ? 'text-accent' : 'text-faint'
                  }`}
                >
                  {rowLevel}
                </th>
                {row.map((cell, c) => {
                  const isCurrent = isCurrentRow && c + 1 === category;
                  const zone = zoneForRange(cell);
                  return (
                    <td
                      key={c}
                      aria-current={isCurrent ? 'true' : undefined}
                      className={`px-0.5 py-[3px] text-center border border-line/60 whitespace-nowrap ${
                        ZONE_FILL[zone]
                      } ${
                        isCurrent
                          ? 'outline outline-2 outline-accent text-accent'
                          : c + 1 === category
                            ? 'text-ink'
                            : 'text-muted'
                      }`}
                    >
                      {cell.max === null
                        ? cell.min === 0
                          ? 'life'
                          : `${cell.min}–life`
                        : `${cell.min}–${cell.max}`}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-2xs text-faint mt-1">
        Shading marks Zones A through C; Zone D is unshaded. <Cite section="Ch. 5, Pt. A" />
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step list — the audit trail
// ---------------------------------------------------------------------------

export function StepList({ steps, showZero }: { steps: readonly Step[]; showZero?: boolean }) {
  const visible = steps.filter((s) => showZero || s.levels !== 0 || s.suppressed);
  if (visible.length === 0) return null;

  return (
    <ul className="space-y-1">
      {visible.map((step, i) => (
        <li
          key={i}
          className={`flex gap-2 items-baseline text-[12px] leading-snug ${
            step.suppressed ? 'opacity-60' : ''
          }`}
        >
          <span
            className={`w-9 shrink-0 text-right tabular-nums font-medium ${
              step.suppressed ? 'text-faint line-through' : step.levels < 0 ? 'text-accent' : ''
            }`}
          >
            {step.kind === 'base' && !step.suppressed
              ? step.levels || '—'
              : step.levels > 0
                ? `+${step.levels}`
                : step.levels < 0
                  ? step.levels
                  : '—'}
          </span>
          <span className="flex-1 min-w-0">
            <span className={step.suppressed ? 'text-faint' : ''}>{step.label}</span>
            <Cite section={step.citation} className="ml-1.5" />
            {step.detail ? (
              <span className="block text-2xs text-faint leading-snug">{step.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Results rail
// ---------------------------------------------------------------------------

function RangeDisplay({ range, label }: { range: MonthRange; label: string }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-faint">{label}</div>
      <div className="text-[22px] font-semibold tabular-nums leading-tight tracking-tight">
        {formatRange(range)}
      </div>
    </div>
  );
}

export function ResultsRail({ result }: { result: CaseResult }) {
  const { criminalHistory, aggregate, statutory, chapter5 } = result;
  const hasConsecutive = statutory.consecutiveCounts.length > 0;

  return (
    <div className="space-y-3">
      <div className="border border-line rounded bg-raised p-3 space-y-3">
        <div className="flex gap-4">
          <div>
            <div className="text-2xs uppercase tracking-wider text-faint">Offense level</div>
            <div className="text-[22px] font-semibold tabular-nums leading-tight">
              {result.totalOffenseLevel}
            </div>
          </div>
          <div>
            <div className="text-2xs uppercase tracking-wider text-faint">Category</div>
            <div className="text-[22px] font-semibold tabular-nums leading-tight">
              {CATEGORY_NUMERALS[criminalHistory.category - 1]}
            </div>
            <div className="text-2xs text-faint tabular-nums">{criminalHistory.points} pts</div>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <RangeDisplay
            range={aggregate.groupedCountsRange}
            label={hasConsecutive ? 'Grouped counts' : 'Advisory guideline range'}
          />
        </div>

        {hasConsecutive ? (
          <>
            <div className="border-t border-line pt-3 space-y-1">
              <div className="text-2xs uppercase tracking-wider text-faint">
                Mandatory consecutive
              </div>
              {statutory.consecutiveCounts.map((c) => (
                <div key={c.countId} className="text-[13px] tabular-nums">
                  <span className="font-medium">{c.months} months</span>
                  <span className="text-muted"> — {c.label}</span>
                  <Cite section={c.citation} className="ml-1" />
                </div>
              ))}
            </div>
            <div className="border-t border-line pt-3">
              <RangeDisplay range={aggregate.totalRange} label="Total exposure" />
            </div>
          </>
        ) : null}

        <div className="border-t border-line pt-2 text-2xs text-muted space-y-0.5">
          <div>
            Zone {chapter5.zone} — {chapter5.probationAvailable ? 'probation authorized' : 'imprisonment required'}
          </div>
          {statutory.minMonths > 0 ? (
            <div className="text-warn">
              Mandatory minimum: {formatMonths(statutory.minMonths)}
            </div>
          ) : null}
          <div>
            Statutory maximum:{' '}
            {statutory.maxMonths === null ? 'life' : formatMonths(statutory.maxMonths)}
          </div>
        </div>
      </div>

      <div className="border border-line rounded bg-raised p-3">
        <SubHead>Sentencing Table</SubHead>
        <div className="mt-2">
          <SentencingTableGrid level={result.totalOffenseLevel} category={criminalHistory.category} />
        </div>
      </div>

      {result.plea ? (
        <div className="border border-line rounded bg-raised p-3 space-y-1">
          <SubHead>Plea agreement</SubHead>
          <div className="text-[13px] tabular-nums">
            <div>
              <span className="text-muted">Stipulated: </span>
              level {result.plea.stipulatedLevel}, Category{' '}
              {CATEGORY_NUMERALS[result.plea.stipulatedCategory - 1]} —{' '}
              <span className="font-medium">{formatRange(result.plea.stipulatedRange)}</span>
            </div>
            <div>
              <span className="text-muted">Computed: </span>
              level {result.totalOffenseLevel}, Category{' '}
              {CATEGORY_NUMERALS[criminalHistory.category - 1]} —{' '}
              <span className="font-medium">{formatRange(result.guidelineRange)}</span>
            </div>
            <div className="text-2xs text-muted pt-1">
              Gap at the bottom of the range: {result.plea.gapMonths.min} months.
            </div>
          </div>
        </div>
      ) : null}

      {result.ladder.length > 1 ? (
        <div className="border border-line rounded bg-raised p-3">
          <SubHead>Sentence ladder</SubHead>
          <ul className="mt-2 space-y-1.5">
            {result.ladder.map((rung, i) => (
              <li key={i} className="text-[12px] leading-snug">
                <div className="flex justify-between gap-2 items-baseline">
                  <span className={i === 0 ? 'text-muted' : ''}>{rung.label}</span>
                  <span className="tabular-nums font-medium shrink-0">{formatRange(rung.range)}</span>
                </div>
                {rung.citation ? <Cite section={rung.citation} /> : null}
                {rung.detail ? (
                  <span className="block text-2xs text-faint">{rung.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.bopEstimate ? (
        <div className="border border-line rounded bg-raised p-3 space-y-1">
          <SubHead>Estimated time to serve</SubHead>
          <div className="text-[15px] font-semibold tabular-nums">
            {formatRange(result.bopEstimate.estimatedServeRange)}
          </div>
          <p className="text-2xs text-faint leading-snug">{result.bopEstimate.note}</p>
        </div>
      ) : null}

      <div className="border border-line rounded bg-raised p-3 space-y-2 text-[12px]">
        <SubHead>Chapter 5</SubHead>
        <div className="space-y-1 text-muted">
          <div>
            <span className="text-ink">Supervised release: </span>
            {chapter5.supervisedRelease.max === null
              ? `${chapter5.supervisedRelease.min / 12} years to life`
              : `${chapter5.supervisedRelease.min / 12}–${chapter5.supervisedRelease.max / 12} years`}
            <Cite section={chapter5.supervisedRelease.citation} className="ml-1" />
            {chapter5.supervisedRelease.note ? (
              <span className="block text-2xs text-faint">{chapter5.supervisedRelease.note}</span>
            ) : null}
          </div>
          <div>
            <span className="text-ink">Fine range: </span>
            {formatMoney(chapter5.fine.min)}–{formatMoney(chapter5.fine.max)}
            <Cite section={chapter5.fine.citation} className="ml-1" />
          </div>
          <div className="leading-snug">{chapter5.probationNote}</div>
        </div>
      </div>

      {result.flags.length > 0 ? (
        <div className="border border-line rounded bg-raised p-3">
          <SubHead>Warnings and open questions</SubHead>
          <div className="mt-2">
            <FlagList flags={result.flags} />
          </div>
        </div>
      ) : null}

      <p className="text-2xs text-faint leading-snug">
        {EDITION.name}. Encoded {EDITION.encodedOn} and not verified against the published manual.
      </p>
    </div>
  );
}
