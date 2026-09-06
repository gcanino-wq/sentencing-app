# Verification

A record of what in this app has been checked against the Guidelines Manual,
what was corrected, and what is still unverified. The app currently targets the
**Guidelines Manual, Nov. 2024** (`EDITION_LABEL` in `src/state/defaults.ts`).

## Status of this pass

Primary sources could not be reached. All outbound HTTPS from the working
environment is refused by the egress proxy, `ussc.gov` included, so nothing
below was checked against the published text of the Manual. Everything marked
verified was established from the repository itself — internal consistency,
arithmetic, and the app's own citations — which is enough to find contradictions
but cannot confirm that a correctly-self-consistent number matches the Manual.

Anything marked **unverified** needs a human with the Manual in front of them.

## Corrected in this pass

| What | Where | Basis |
| --- | --- | --- |
| Sentencing table, level 21 / Cat. VI and level 22 / Cat. V read 78 months; both now read 77 | `sentencingTable.ts` | Columns IV, V and VI climb one shared run of minimums (63, 70, 77, 84, 92, 100, 110), each reaching it earlier than the last, and diverge only above 110. Every cell in that run agreed across the three columns except these two. Category IV already read 77. Pinned by tests. |
| Mass-marketing counted twice — once under §2B1.1(b)(2)(A)(ii) and again as a free-standing characteristic | `guideline2B1_1.ts` | §2B1.1(b)(2)(A) is one 2-level increase reached by any of three alternatives. The app's own wizard already cited mass-marketing to (b)(2)(A)(ii) while `socAdjustment` added a second 2 levels. A case with 10+ victims and mass-marketing came out 2 levels high. |
| Worksheet C did not foot: the §4A1.1(e) status point was added to the total but the status line always printed `+0` | `criminalHistory.ts`, `calculate.ts`, `worksheets.ts` | The point total and the line that reports it disagreed. Criminal history is now returned broken out as priors / status / total. |
| Every prior sentence was cited to §4A1.1(b) regardless of its points | `criminalHistory.ts`, `worksheets.ts` | A 3-point prior is scored under (a) and a 1-point prior under (c). Cite now follows the points. |
| Worksheet A lines 1, 2(b), 2(c) and 2(d) hardcoded the demo facts into their citations and excerpts | `worksheets.ts`, `guideline2B1_1.ts` | Line 2(b) cited §2B1.1(b)(1)(H) and read "more than $550,000" at any loss; line 1 cited (a)(1) even at a base of 6; line 2(c) read "10 or more" even with 3 victims. All four now derive from the facts. |
| Zero-point offender line printed `−2` in the value column of a criminal-history sheet whose total excluded it | `worksheets.ts` | §4C1.1 is a 2-level offense-level reduction, not a criminal history point, and is not applied at all (see below). Line now reads `eligible`. |

## Verified against the repository

- §2B1.1(b)(1) loss table — 16 tiers, strictly-greater-than thresholds, $6,500 through $550,000,000, 0 to +30. Internally consistent; **not** checked against the Manual.
- §2B1.1(a) base offense level: 7 at a 20-year statutory maximum, else 6.
- §4A1.1(e) status point: added only when the subtotal under (a)–(d) is already 7 or more. This is the post-Amendment 821 form.
- Criminal history category boundaries: 0–1 / 2–3 / 4–6 / 7–9 / 10–12 / 13+.
- Sentencing table range construction: top of range = greater of (min + 6) and 125% of min. Reproduces every published maximum the tests assert; 360 prints as `360–life`.
- §5C1.1 zone boundaries from the top of the range: A ≤ 6, B ≤ 15, C ≤ 18, D above.

## Unverified — needs the Manual

- **Every number above.** Self-consistency is not authority.
- The §2B1.1(b)(9) floor (offense level raised to 10) and the §2B1.1(b)(10) floor (raised to 12) are **not implemented**. They do not bind on the default facts but will on a small-loss case.
- Whether the Nov. 2024 figures this app encodes survived the Nov. 1, 2025 amendments unchanged.

## Not implemented — nothing here to verify

§2K2.1, §2D1.1 and §2D2.1 are now named in the guideline registry
(`src/engine/guidelines.ts`) and carry their official titles, but none of them
has a `compute`. Asking the engine to score a case under one raises rather than
returning a number, so an unimplemented guideline cannot silently produce an
offense level. The authoritative tables they need — §2K2.1(a) base levels,
§2K2.1(b) characteristics including the (b)(5) machinegun-conversion-device
tiers added effective Nov. 1 2025, and the §2D1.1(c) Drug Quantity Table —
have not been entered, because the Manual was not reachable.

- **§2B3.1 (robbery)** — absent entirely, not even registered.
- **§2K2.1 (firearms)** — registered, does not compute.
- **§2D1.1 (drug trafficking)** — registered, does not compute; there is no drug quantity table.
- **§2D2.1 (simple possession)** — registered, does not compute.
- §3D1.4 unit math for multiple counts (Worksheet B is scaffolding).
- §4B1.1 career offender and §4B1.4 ACCA (flags on Worksheet D, not override math).
- §4C1.1 zero-point reduction (reported as eligible, never applied to the total).
- Worksheet D lines 7 and 9 (supervised release, restitution) are fixed strings.

The Nov. 1, 2025 amendments to §2B3.1, §2K2.1 and §2D1.1 therefore have nothing
in this codebase to apply to. Implementing those guidelines is new work, not
verification, and must start from the Manual rather than from this app or from
recollection: a wrong drug quantity threshold or firearm base level moves a
sentence by years, and no amount of internal consistency will catch it.
