'use client';

import { useId, useState, type ReactNode } from 'react';
import type { Flag } from '@/engine/types';
import { guidelineUrl } from '@/engine/data/edition';

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

export function Section({
  title,
  citation,
  children,
  defaultOpen = true,
  aside,
}: {
  title: string;
  citation?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  aside?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-line rounded bg-raised print-block">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-left flex-1 no-print"
        >
          <span className="text-faint w-3 shrink-0" aria-hidden>
            {open ? '−' : '+'}
          </span>
          <h2 className="font-semibold text-[13px] tracking-tight">{title}</h2>
          {citation ? <Cite section={citation} /> : null}
        </button>
        <h2 className="hidden print-only font-semibold">{title}</h2>
        {aside}
      </div>
      {open ? <div className="p-3 space-y-3">{children}</div> : null}
    </section>
  );
}

export function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-2xs font-semibold uppercase tracking-wider text-faint">{children}</h3>
  );
}

/** A guideline citation that links out to the official text. */
export function Cite({ section, className = '' }: { section: string; className?: string }) {
  const isGuideline = /^§\s*\d/.test(section);
  if (!isGuideline) {
    return <span className={`font-mono text-2xs text-faint ${className}`}>{section}</span>;
  }
  return (
    <a
      href={guidelineUrl(section)}
      target="_blank"
      rel="noreferrer noopener"
      className={`font-mono text-2xs text-faint hover:text-accent hover:underline ${className}`}
      title="Open the official text on ussc.gov"
    >
      {section}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? 'col-span-2' : ''}`}>
      <span className="block text-2xs font-medium text-muted mb-0.5">{label}</span>
      {children}
      {hint ? <span className="block text-2xs text-faint mt-0.5 leading-snug">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'bg-raised border border-line rounded px-2 py-1 text-[13px] tabular-nums ' +
  'focus:border-accent disabled:opacity-50';

/**
 * Tailwind resolves conflicting utilities by stylesheet order, not by the order
 * they appear in the attribute — so a base `w-full` silently beats a caller's
 * `w-20`. Only add the default width when the caller has not set one.
 */
function inputClass(extra?: string): string {
  const setsWidth = extra ? /(^|\s)(w-|min-w-|max-w-|flex-|basis-)/.test(extra) : false;
  return `${setsWidth ? '' : 'w-full '}${inputBase} ${extra ?? ''}`;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass(props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClass(props.className)} />;
}

/** Currency input that formats with separators and accepts pasted "$1,234.00". */
export function MoneyInput({
  value,
  onChange,
  ...rest
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [text, setText] = useState(value === undefined ? '' : value.toLocaleString('en-US'));

  return (
    <input
      {...rest}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const digits = raw.replace(/[^0-9.]/g, '');
        if (digits === '') {
          onChange(undefined);
          return;
        }
        const parsed = Number.parseFloat(digits);
        onChange(Number.isNaN(parsed) ? undefined : Math.round(parsed));
      }}
      onBlur={() => {
        setText(value === undefined ? '' : value.toLocaleString('en-US'));
      }}
      className={inputClass(`text-right ${rest.className ?? ''}`)}
      placeholder="$0"
    />
  );
}

export function Check({
  checked,
  onChange,
  label,
  citation,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  citation?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex gap-2 items-start">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] shrink-0 accent-[rgb(var(--accent))]"
      />
      <label htmlFor={id} className="text-[13px] leading-snug flex-1 min-w-0">
        <span className={disabled ? 'text-faint' : ''}>{label}</span>
        {citation ? <Cite section={citation} className="ml-1.5" /> : null}
        {hint ? <span className="block text-2xs text-faint leading-snug mt-0.5">{hint}</span> : null}
      </label>
    </div>
  );
}

export function Button({
  children,
  variant = 'default',
  ...rest
}: { variant?: 'default' | 'quiet' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    default: 'border-line bg-raised hover:border-accent hover:text-accent',
    quiet: 'border-transparent text-muted hover:text-ink hover:border-line',
    danger: 'border-transparent text-faint hover:text-warn',
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`border rounded px-2 py-1 text-2xs font-medium transition-colors ${styles} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

const FLAG_STYLES = {
  warning: { bar: 'bg-warn', text: 'text-warn', label: 'Warning' },
  caution: { bar: 'bg-caution', text: 'text-caution', label: 'Caution' },
  info: { bar: 'bg-faint', text: 'text-muted', label: 'Note' },
} as const;

export function FlagList({ flags, dense }: { flags: readonly Flag[]; dense?: boolean }) {
  if (flags.length === 0) return null;
  const order = { warning: 0, caution: 1, info: 2 } as const;
  const sorted = [...flags].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <ul className={`space-y-1.5 ${dense ? 'text-2xs' : 'text-[12px]'}`}>
      {sorted.map((flag, i) => {
        const style = FLAG_STYLES[flag.severity];
        return (
          <li key={`${flag.code}-${i}`} className="flex gap-2">
            <span className={`w-0.5 shrink-0 rounded ${style.bar}`} aria-hidden />
            <span className="leading-snug">
              <span className={`font-semibold ${style.text}`}>{style.label}. </span>
              <span className="text-muted">{flag.message}</span>
              {flag.citation ? <Cite section={flag.citation} className="ml-1" /> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
