# Verification checklist

**Read this before relying on any output in a real case.**

The guidelines data in this repository was encoded from the author's knowledge of
the 2025 Guidelines Manual. It was **not** machine-extracted from an authoritative
source and **has not been checked against the published manual**. Amendments after
the encoding date (2026-09-03) are not reflected.

Every item below is a table or rule the calculation depends on. Each lives in an
isolated module, so a correction is a one-line edit — no logic changes.

## Partial verification pass, 2026-09-03

The published manual could not be reached from the build environment (ussc.gov is
blocked by the network egress policy — confirmed via HTTP client, curl, and a real
browser). What follows was checked against secondary sources via web search. Search
is good enough to settle a discrete rule or a single number; it is **not** good
enough to verify a 258-cell table or the text of a guideline, so most of the
checklist below is untouched.

### Confirmed

| Item | Result |
| --- | --- |
| § 4A1.1(e) status point | Correct. One point, and only where the defendant already has 7 or more points under (a)–(d), per Amendment 821. |
| § 922(g) statutory maximum | Correct at 15 years under 18 U.S.C. § 924(a)(8), raised from 10 by the Bipartisan Safer Communities Act (June 2022). The offense-date caveat in the data is warranted. |
| Methamphetamine conversion ratios | Correct. A court document puts 90 g of methamphetamine (actual) at 1,818 kg converted — approximately 20 kg per gram, ten times the mixture ratio. |
| Cocaine base ratio | Correct at 3,571 g converted per gram (Amendment 748). |
| § 2B1.1(b)(1) loss table shape | Correct: 16 tiers running 0 to 30 levels. **Individual bracket amounts remain unverified.** |
| Sentencing Table, level 26 / Category I | 63–78 months, matching the encoded cell. One cell of 258. |

### Corrected

| Item | Defect |
| --- | --- |
| § 4C1.1 criteria | Encoded as **ten** criteria with the aggravating-role and continuing-criminal-enterprise conditions combined in (a)(10). The 2024 amendment split them into (a)(10) and (a)(11), so there are **eleven**. The outcome was already correct — both conditions were required — but the citation and the count were wrong. Fixed. |

### Open risk: the 2025 amendment cycle

This is the most serious gap and it is not resolved.

The amendments effective **November 1, 2025** — the edition this build claims to
encode — included a "simplification" package that reportedly touched:

- the § 1B1.1 three-step application process and the use of **departures**
- **mitigating-role adjustments in drug cases** (§ 2D1.1(a)(5))
- **specific offense characteristics in robbery and extortion** (§ 2B3.1)
- **firearm enhancements** (§ 2K2.1)
- **criminal history calculations** (Chapter 4)
- **supervised release** (§ 5D1.2)

Four of those are encoded here, and two — § 2B3.1 and § 2K2.1 — are priority
docket guidelines. The encoding was done from knowledge of the guidelines'
structure and may reflect the **pre-amendment** form in these areas. Nothing in
this build should be relied on for a robbery, carjacking, firearm, or
mitigating-role drug calculation until § 2B3.1, § 2K2.1, § 2D1.1(a)(5), and
Chapter 4 are read against the 2025 manual directly.

Resolving this needs the manual itself. Search summaries are too coarse to
reconstruct amended guideline text, and reconstructing it from memory is exactly
the failure mode this document exists to guard against.

## How confidence is marked

| Marking | Meaning |
| --- | --- |
| `verified` | Encoded deliberately, with attention. Still unchecked against the manual. |
| `unverified` | Encoded for breadth. The UI shows a "confirm against the manual" prompt. |

`verified` means *encoded with care*, not *checked*. Nothing in this build has
been checked.

---

## Chapter 5 — `src/engine/data/sentencing-table.ts`

- [ ] **Sentencing Table**, all 43 × 6 cells (Ch. 5, Pt. A). The test suite checks
      that the table is monotonic in both directions and that no minimum exceeds
      its maximum, which catches most transposition errors — but not a whole row
      shifted consistently. Spot-check at least levels 1, 12, 26, 30, 37, and 43.
- [ ] **Zone boundaries.** Derived from the range minimum: A at 0, B at 1–9,
      C at 10–12, D at 13+. Confirm this matches Ch. 5, Pt. A.
- [ ] **Criminal history categories** from points: 0–1 → I, 2–3 → II, 4–6 → III,
      7–9 → IV, 10–12 → V, 13+ → VI.

## Chapter 2 tables — `src/engine/data/tables.ts`

- [ ] **§ 2B1.1(b)(1) loss table**, all 16 brackets. Thresholds are *exclusive*
      — "more than $6,500" — which the code implements and the tests assert.
- [ ] **§ 2T4.1 tax table**, all 14 brackets. Thresholds are inclusive floors.
- [ ] **§ 5E1.2(c)(3) fine table**, all 16 rows.
- [ ] **§ 3D1.4 unit table**: 1 unit → +0, 1½ → +1, 2 → +2, 2½–3 → +3, 3½–5 → +4,
      more than 5 → +5.
- [ ] **§ 4B1.1(b) career offender table** by statutory maximum: life → 37,
      25y → 34, 20y → 32, 15y → 29, 10y → 24, 5y → 17, otherwise 12.
- [ ] **18 U.S.C. § 3559(a) offense classes** by statutory maximum.
- [ ] **§ 5D1.2(a) supervised release** ranges by offense class.

## Drugs — `src/engine/data/drugs.ts`

- [ ] **Drug Conversion Table ratios**, every substance. Heroin anchors at
      1 g → 1 kg converted. The methamphetamine actual/mixture ratio differs by a
      factor of ten and is the single most consequential entry in the file.
- [ ] **Cocaine base ratio** (3,571 g converted per gram).
- [ ] **Pharmaceutical ratios** — oxycodone, hydrocodone, hydromorphone,
      oxymorphone. These drive per-pill calculations.
- [ ] **Marihuana plants** at 100 g converted per plant.
- [ ] **§ 2D1.1(c) Drug Quantity Table**, all 17 rows of converted drug weight.

## Chapter 3 — `src/engine/chapter3.ts`

- [ ] § 3A1.1 hate crime (+3), vulnerable victim (+2), many vulnerable victims (+2).
- [ ] § 3A1.2 official victim (+3), assaultive conduct (+6).
- [ ] § 3A1.3 restraint (+2).
- [ ] § 3A1.4 terrorism (+12, floor of 32, Category VI).
- [ ] § 3B1.1 role: (a) +4, (b) +3, (c) +2.
- [ ] § 3B1.2 role: minimal −4, intermediate −3, minor −2.
- [ ] § 3B1.3 abuse of trust (+2); § 3C1.1 obstruction (+2).
- [ ] § 3E1.1: −2, plus −1 at level 16 or greater on government motion.
- [ ] § 2X1.1(b)(1) inchoate reduction (−3) and its exceptions.

## Chapter 4 — `src/engine/chapter4.ts`

- [ ] **§ 4A1.1 point values**: (a) 3 points above 13 months, (b) 2 points at
      60 days or more, (c) 1 point capped at 4, (d) 1 point per violent offense
      absorbed by the single-sentence rule capped at 3.
- [ ] **§ 4A1.1(e) status point after Amendment 821** — 1 point, and only where
      the defendant already has 7 or more points. Confirm this is still the rule.
- [ ] **§ 4A1.2(e) time limits**: 15 years for sentences above 13 months
      (including where incarceration fell in the period), 10 years otherwise.
- [ ] **§ 4A1.2(d) juvenile** scoring and the 5-year window.
- [ ] **§ 4A1.2(a)(2) single sentence** rule and the intervening-arrest exception,
      which the app does **not** model — it relies on your grouping of priors.
- [ ] **§ 4B1.4 ACCA**: offense level floor of 33 (34 with the in-connection
      finding) and Criminal History Category floor of IV (VI in that case).
- [x] **§ 4C1.1 criteria — corrected.** Originally encoded as ten criteria with
      the aggravating-role and continuing-criminal-enterprise conditions combined.
      The 2024 amendment split them into separate subsections (a)(10) and (a)(11),
      so the manual has **eleven**. Corrected 2026-09-03. The outcome was already
      right (both conditions were required); the citation and count were not.

## Chapter 5 and statutes — `src/engine/chapter5.ts`, `data/statutes.ts`

- [ ] **§ 5G1.1(a)–(c)** clamping in both directions.
- [ ] **§ 5G1.2(d)** stacking to reach total punishment.
- [ ] **18 U.S.C. § 3553(f) safety valve criteria**, as amended by the First Step
      Act, and the companion § 2D1.1(b)(18) reduction.
- [ ] **21 U.S.C. § 841(b) penalty tiers**, including the § 851 enhanced tiers
      (15-year and 25-year minimums) and supervised release minimums.
- [ ] **18 U.S.C. § 924(c) terms**: 5 / 7 / 10 years by conduct, 30 years for a
      machinegun or silencer, 25 years second-or-subsequent.
- [ ] **18 U.S.C. § 922(g) maximum** — 15 years under § 924(a)(8) after the
      Bipartisan Safer Communities Act. Confirm the maximum applicable to the
      offense date, since it was 10 years before 2022.
- [ ] **Every other statutory penalty** in `data/statutes.ts`.
- [ ] **18 U.S.C. § 3624(b) good conduct time** — the app uses 54 days per year
      of the sentence imposed. First Step Act earned time credits are modeled as
      a flat further reduction and are a rough estimate only.

## Appendix A — `src/engine/data/statutes.ts`

- [ ] Every statute-to-guideline mapping. Entries marked `verified` cover the
      high-volume docket; entries marked `unverified` were encoded for breadth
      and are more likely to be wrong or incomplete.
- [ ] Statutes with **multiple** Appendix A guidelines (§ 666, § 1951, § 371)
      — the app takes the first as the default, which may not be the right one.

## Grouping — `src/engine/grouping.ts`, `data/guidelines.ts`

- [ ] The set of guidelines listed as grouping by quantity under **§ 3D1.2(d)**
      (`QUANTITY_GROUPED_SECTIONS`). This determines which counts aggregate.
- [ ] The app proposes grouping and aggregates quantity across counts under the
      same guideline. It cannot see whether counts share a victim or a
      transaction, so **§ 3D1.2(a)–(c) grouping is yours to make.**

## Chapter 2 subsection numbering

Subsection numbering within Chapter 2 has shifted across amendment cycles. Every
characteristic marked `unverified` in `data/guidelines.ts` has numbering that was
not confirmed — the substance may be right while the citation is stale. These are
concentrated in § 2B1.1(b)(7), (b)(10), (b)(16) and in § 2L1.2(b).

---

## What the app deliberately does not decide

- Whether a prior is a crime of violence, controlled substance offense, or ACCA
  predicate — a categorical question turning on elements.
- Whether ACCA predicates were committed on occasions different from one another.
- Whether counts share a victim or transaction for § 3D1.2(a)–(c).
- Whether relevant conduct under § 1B1.3 includes a given quantity.
- Whether intended loss is properly included in "loss" in your circuit.
- Whether a Puerto Rico conviction qualifies as a predicate under the Penal Code
  in force at the time.
