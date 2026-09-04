import type { CaseInput } from '@/engine/types';

/**
 * Encode a calculation into the URL hash.
 *
 * The encoded payload contains everything the user typed. It is deliberately
 * gated behind an explicit confirmation in the UI: a shared link travels through
 * browser history, mail servers, and logs, and case facts do not belong there.
 */
export function encodeCase(input: CaseInput): string {
  const json = JSON.stringify(input);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCase(encoded: string): CaseInput | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as CaseInput;
    if (!Array.isArray(candidate.counts)) return null;
    return candidate;
  } catch {
    return null;
  }
}
