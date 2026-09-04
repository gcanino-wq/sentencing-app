# Federal Sentencing Calculator — Specification

**Status:** v1 specification, derived from setup interview.
**Guidelines edition encoded:** USSC Guidelines Manual, 2025 edition (eff. Nov 1, 2025).

> This tool is an estimation aid for licensed counsel. The guidelines are advisory
> (*United States v. Booker*). The court and the Probation Office make the actual
> determination. Every result must be verified against the Guidelines Manual.

---

## 1. Purpose and posture

Calculate federal sentencing exposure from the **counts of conviction**. The user
enters statutes; the app maps them through **Appendix A (Statutory Index)** to the
applicable Chapter 2 guideline, then works through Chapters 2, 3, 4 and 5 to an
advisory range, then overlays statutory minima and maxima, then models departures
and variances.

Primary user: a federal criminal defense practitioner in the **District of Puerto
Rico (First Circuit)**. Docket weighting: drug trafficking, firearms and §924(c),
carjacking/violent offenses, fraud and public corruption.

## 2. Platform decisions

| Decision | Choice |
| --- | --- |
| Stack | Next.js + TypeScript (strict) + Tailwind |
| Tests | Vitest, over a pure calculation library |
| Package manager | npm |
| Deployment | **Static export** — no server, no API routes, all computation in-browser |
| Persistence | **Stateless.** No accounts, no database, no server storage |
| Lint/format | ESLint + Prettier |
| License | None (all rights reserved) |

Nothing the user types is transmitted anywhere. This is a deliberate constraint:
the inputs are privileged client material.

## 3. Calculation pipeline

```
Counts of conviction (statute + facts)
  └─ Appendix A ──> Chapter 2 guideline per count
        └─ Base offense level + specific offense characteristics
              └─ Chapter 3 adjustments (per count)
                    └─ §3D grouping ──> combined adjusted offense level
                          └─ Chapter 3E acceptance ──> total offense level
                                └─ Chapter 4 criminal history ──> category
                                      └─ Sentencing Table ──> advisory range
                                            └─ Chapter 5 statutory overlay
                                                  └─ Departures ──> Variances
                                                        └─ Recommended sentence
```

## 4. Scope by chapter

### Chapter 1 — Application
- §1B1.3 **relevant conduct**: every quantity input (loss, drug weight, victims)
  carries an inline relevant-conduct prompt distinguishing offense-of-conviction
  amounts from jointly undertaken activity that was reasonably foreseeable.
- §1B1.11 ex post facto: single edition encoded; the app records the offense date
  and warns when it precedes the encoded edition's effective date.

### Chapter 2 — Offense conduct

**Tier 1 — full structured SOC forms with real tables:**

| Guideline | Coverage |
| --- | --- |
| §2B1.1 | Loss table; actual vs. intended loss (greater applies); credits-against-loss worksheet; gain as fallback proxy; victims/hardship, sophisticated means, mass-marketing, (b)(10) |
| §2B3.1 | Robbery/carjacking; (b) weapon, injury, loss, abduction enhancements |
| §2C1.1 | Value of benefit — greater of payment, benefit received, or loss to government — through the §2B1.1 table; (b) enhancements; elected-official cross-reference |
| §2D1.1 | Full converted drug weight calculator across multiple substances and units; Drug Quantity Table; meth actual/ice vs. mixture; (b) characteristics incl. weapon and premises; (b)(18) safety-valve reduction |
| §2K2.1 | Felon in possession, machine guns, trafficking; (b)(6)(B) cross-reference |
| §2K2.4 | §924(c) — guideline sentence is the statutory term, consecutive |
| §2L1.2 | Illegal reentry |
| §2S1.1 | Money laundering |
| §2T1.1 | Tax loss table |

**Tier 2 — every other indexed guideline:** base offense level plus free-form
`+N, cite the subsection` adjustment rows, so no offense is uncomputable.

- §2X1.1 attempt/conspiracy/solicitation: 3-level reduction unless the substantive
  offense was substantially completed or the guideline expressly covers conspiracy.

### Chapter 3 — Adjustments
- §3A1.1–3A1.4 victim-related (hate crime, vulnerable victim, official victim,
  restraint, terrorism)
- §3B1.1 / §3B1.2 aggravating and mitigating role
- §3B1.3 abuse of position of trust / special skill
- §3C1.1 obstruction
- §3D1.1–3D1.5 grouping — **app proposes groupings with stated reasoning, user overrides.**
  §924(c) counts excluded from grouping.
- §3E1.1 acceptance, including the third point on government motion at level 16+

### Chapter 4 — Criminal history
- §4A1.1 prior-by-prior scoring with §4A1.2 time limits, consolidation, status points
  (as amended by Amendment 821)
- §4B1.1 career offender — offense level from statutory maximum, forces CHC VI
- §4B1.4 / 18 U.S.C. §924(e) ACCA — 15-year minimum and offense level floor
- §4C1.1 zero-point offender — checklist of all criteria
- **Per-prior detail:** offense description, statute, offense date, sentence date,
  sentence imposed, custody/release date, adult vs. juvenile, and predicate flags
  for crime of violence / controlled substance offense / ACCA violent felony.
- **Puerto Rico priors:** taggable as PR convictions with the Penal Code year in
  force (1974 / 2004 / 2012), since article numbers do not carry across the
  rewrites. Predicate flags on PR convictions raise a categorical-approach warning:
  qualification turns on the elements under the code then in force and is a First
  Circuit research question the app does not resolve.

### Chapter 5 — Determining the sentence
- Sentencing Table → advisory range, rendered as a **full interactive 43×6 grid**
  with zones shaded and the current cell highlighted
- §5B1.1 probation eligibility; zone placement and permitted alternatives
- §5C1.2 safety valve (18 U.S.C. §3553(f), as amended by the First Step Act)
- §5D1.2 supervised release term
- §5E1.2 fine range, with 18 U.S.C. §3571 alternatives
- §5G1.1 statutory clamping; §5G1.2(d) stacking across counts
- §5K1.1 substantial assistance; §5K3.1 early disposition; §5K2.0 enumerated grounds
- §3553(a) variance workspace, organized by factor
- **Arithmetic ladder:** advisory range → each departure → each variance → the
  number actually being requested

## 5. Statutory overlay

- Mandatory minima and statutory maxima per count
- **18 U.S.C. §924(c)** — 5/7/10-year terms by brandishing/discharge, 25-year
  second-or-subsequent, mandatory consecutive. Presented as **grouped-counts range,
  §924(c) consecutive term, and aggregate — shown separately**, mirroring the judgment.
- **21 U.S.C. §851** prior-felony informations raising drug minima and maxima
  (15-year serious drug felony, 25-year serious violent felony)
- **Good-time estimate** — 15% under 18 U.S.C. §3624(b) plus First Step Act earned
  time credits where eligible, labeled an estimate BOP is not bound by

## 6. Interaction traps the engine catches

These are the errors this docket produces most often. Each is suppressed or flagged
automatically **with a stated reason**, never silently:

1. **§2K2.4 comment n.4** — when a §924(c) count is present, weapon enhancements on
   the underlying count are barred. No §2B3.1(b)(2) on the carjacking, no
   §2D1.1(b)(1) on the drug count.
2. **§2D1.1(b)(1) vs. safety valve** — a weapon enhancement is in tension with
   §3553(f)(2); applying both needs a reason.
3. **§3E1.1 with §3C1.1** — both applied triggers the extraordinary-case warning.
4. **§2K2.1(b)(6)(B)** — firearm used in connection with another felony
   cross-references to that offense's guideline where it produces a higher level.

## 7. Edge rules enforced automatically

- Offense level ceiling of 43, floor of 1
- §5G1.1 clamping in both directions
- §5G1.2(d) consecutive stacking to reach total punishment
- §4B1.1 career offender and §3A1.4 terrorism both force CHC VI

## 8. Jurisdiction awareness

District selector (all 94 districts) deriving the circuit, **defaulting to District
of Puerto Rico / First Circuit**. Drives jurisdiction-specific cautions: the split on
intended-loss deference after *Kisor*, differing career-offender predicate law,
whether the district runs a §5K3.1 fast-track program. The app **flags** these; it
does not decide them.

## 9. Output

- **Printable worksheet** — 8.5×11, one-inch margins, page numbers, version stamp,
  estimation-aid footer. **Always anonymous**: no defendant name, case number,
  district caption or judge. Hand-label if attaching to anything.
- **Shareable URL** — encodes inputs, gated behind an explicit confirmation that the
  scenario has been stripped of identifying detail.
- No JSON export, no case storage, no accounts.

## 10. Correctness and honesty

- Calculation engine is a **pure library** with a Vitest suite over the Sentencing
  Table, grouping unit math, criminal history scoring, and every encoded Chapter 2 table.
- **Every step shows its citation.** The result view is an audit trail: each level
  adjustment names the subsection that produced it.
- **Uncertainty is surfaced, not hidden.** Unverified Appendix A entries, open legal
  questions (categorical approach, loss commentary deference) are marked as such
  rather than presented as clean answers.
- **Appendix A is tiered:** a verified core of high-volume statutes marked `verified`,
  and a broader tier marked `unverified — confirm against Appendix A` that shows a
  citation prompt in the UI.
- **Never blocks.** Incomplete input still computes, with loud inline warnings
  ("no drug quantity entered, base level assumes the minimum").
- **`VERIFICATION.md`** lists every table and threshold encoded from memory —
  sentencing table, drug quantity table, drug conversion table, loss table, fine
  table, criminal history rules — for verification against the manual before first
  real use. All data lives in isolated modules so a correction is a one-line edit.

### Known limits of the encoded data

The guidelines data in this repository was encoded from the author's knowledge of
the 2025 Manual, not machine-extracted from an authoritative source. It carries a
build date and edition stamp. **It has not been verified against the published
manual.** Amendments after the encoding date are not reflected. Verify before
relying on any output in a real case.

## 11. Interface

Dense professional tool: compact typography, tight vertical rhythm, much of the
calculation visible at once, persistent results rail. Single long form with
collapsible sections — not a stepper. Light and dark. Results update in place
without change-delta annotations.

Accessibility fundamentals: labeled inputs, logical tab order, visible focus,
semantic headings, WCAG AA contrast in both themes, results announced on change.

Applied subsections expand to a **structured summary plus the exact citation and a
link to the official USSC text** — not a from-memory transcription of guideline text.

Defaults: district pre-set to D.P.R.; nothing else pre-filled.

Plea modeling: enter the agreement's stipulated offense level alongside your own
calculation and see both ranges together.

## 12. Explicitly out of scope for v1

- Chapter 7 revocation ranges (structured for later addition)
- §3582(c)(2) retroactive amendment relief
- Restitution and forfeiture computation
- Multi-edition manuals and automatic §1B1.11 selection
- Bilingual interface
- Scenario comparison, client-facing summaries
- Case storage, accounts, JSON export

## 13. Build sequence

1. Data layer + calculation engine + tests *(correctness first, checkable early)*
2. UI over the engine, covering the four priority docket areas end to end
3. Appendix A breadth and remaining Chapter 2 guidelines
