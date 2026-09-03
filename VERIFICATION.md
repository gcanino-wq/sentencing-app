# Verification checklist

**Read this before relying on any output in a real case.**

The guidelines data in this repository was encoded from the author's knowledge of
the 2025 Guidelines Manual. It was **not** machine-extracted from an authoritative
source and **has not been checked against the published manual**. Amendments after
the encoding date (2026-09-03) are not reflected.

Every item below is a table or rule the calculation depends on. Each lives in an
isolated module, so a correction is a one-line edit — no logic changes.

## Verification against the 2025 Manual, 2026-09-03

The 2025 Guidelines Manual was supplied directly and checked against the encoded
data. This section records what was compared, what matched, and what was wrong.

### Verified — no discrepancy

| Item | How it was checked |
| --- | --- |
| **Sentencing Table, all 258 cells** | Parsed from the manual's own table markup and diffed cell by cell. 222 cells compared directly; the remaining 36 sit in three rows where two offense levels are merged in the source, and were recovered by enumerating every valid split and eliminating all but one using the already-verified rows above and below. Zero discrepancies. |
| § 4A1.1(a)–(e) point values | Read directly. Includes the (e) status point requiring 7 or more points under (a)–(d). |
| § 4C1.1 — eleven criteria | Read directly. Confirms the correction below. |
| § 2B3.1(a) base level, (b)(1), (b)(2)(A)–(F), (b)(3)(A)–(C), (b)(4), (b)(5), (b)(6) | Read directly. |
| § 2K2.1(a)(1)–(a)(8) base levels and (b)(1) firearm-count table | Read directly. |
| § 922(g) statutory maximum of 15 years | 18 U.S.C. § 924(a)(8), via secondary sources. |
| Methamphetamine actual/mixture and cocaine base conversion ratios | Secondary sources, including a court document putting 90 g of methamphetamine (actual) at ~1,818 kg converted. |

### Corrected

| Guideline | Defect | Consequence |
| --- | --- | --- |
| **§ 2B3.1(b)(7)** | The loss table was **missing entirely**. § 2B3.1 has its own table, distinct from § 2B1.1(b)(1), running +1 above $20,000 to +7 above $9,500,000. | Robbery and carjacking losses produced no increase at all. |
| **§ 2B3.1 cmt. n.4** | The **11-level cap** on the combined weapon and injury adjustments was not implemented. | Over-calculation in exactly the cases where both apply — an armed robbery causing injury. |
| **§ 2B3.1(b)(3)(D), (E)** | The two intermediate degrees of injury (+3 and +5) were missing. | No way to score an injury between the enumerated degrees. |
| **§ 2B3.1(b)(2)(B)** | Labelled "firearm otherwise used." The current text turns on a **specific** threat of harm or physical contact with a victim. | Right level, misleading label. |
| **§ 2K2.1(b)(7)(B)** | "Used or possessed a firearm in connection with another felony offense" was cited as **(b)(6)(B)**. In the current manual (b)(6) is firearms trafficking. | Wrong citation on a provision used constantly, in a worksheet meant to be checkable. |
| **§ 2K2.1(b)(5)** | **Machinegun conversion devices** were missing — +2 for four or more or any transfer, +4 for 30 or more. | A switch case could not be scored. |
| **§ 2K2.1(b)(5) cap** | The **level-29 cap** on the cumulative result of (b)(1)–(b)(5) was not implemented, nor the exception where (b)(3)(A) applies. | Over-calculation in large-quantity firearm cases. |
| **§ 2K2.1(a)(8), (b)(3), (b)(6)(A)–(C), (b)(7)(A), (b)(9), (b)(10)** | All missing. | Destructive devices, trafficking tiers, transport out of the country, the group-of-five increase and the coercion reduction could not be applied. |
| **§ 4C1.1** | Encoded as **ten** criteria with the aggravating-role and continuing-criminal-enterprise conditions combined. The manual has **eleven**. Criteria (7) and (9) were also narrower than the text. | Outcome was already right; the citation and count were wrong. |

Each correction is covered by a test asserting the manual's numbers, so a
regression fails the suite rather than reaching a worksheet.

### Still unverified

The pass above covered the Sentencing Table, Chapter 4's scoring rules, and the
two Chapter 2 guidelines flagged as highest-risk. **Not yet checked against the
manual:**

- § 2B1.1(b)(1) loss table brackets, § 2T4.1, § 5E1.2 fine table, § 3D1.4 units,
  § 4B1.1(b) career offender table, § 5D1.2 supervised release
- The § 2D1.1(c) Drug Quantity Table and the full Drug Conversion Tables
- § 2D1.1(a)(5) mitigating-role cap, which the 2025 amendments also touched
- § 2C1.1, § 2S1.1, § 2T1.1, § 2L1.2 characteristics and their numbering
- Chapter 3 adjustment values, and § 5G1.1 / § 5G1.2 text
- Appendix A statute-to-guideline mappings
- § 3A1.5 (Serious Human Rights Offense), which § 4C1.1(a)(9) references and
  which this build does not encode at all

The lesson from what was found: the errors clustered exactly where predicted —
in the guidelines the November 2025 amendments restructured. The remaining
unverified items in that same category, particularly § 2D1.1(a)(5), should be
treated as suspect until checked.

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
