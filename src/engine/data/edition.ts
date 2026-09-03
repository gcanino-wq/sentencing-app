/**
 * Which Guidelines Manual this build encodes.
 *
 * The data in `src/engine/data` was encoded from knowledge of the 2025 Manual,
 * not machine-extracted from an authoritative source. See VERIFICATION.md.
 */
export const EDITION = {
  name: 'USSC Guidelines Manual, 2025 edition',
  effectiveDate: '2025-11-01',
  encodedOn: '2026-09-03',
  manualUrl: 'https://www.ussc.gov/guidelines',
} as const;

/** Deep link to the official text of a guideline section, e.g. "2B1.1" -> USSC page. */
export function guidelineUrl(section: string): string {
  const clean = section.replace(/^§\s*/, '').split('(')[0] ?? section;
  return `https://www.ussc.gov/guidelines/guidelines-manual/search?search=${encodeURIComponent(clean)}`;
}
