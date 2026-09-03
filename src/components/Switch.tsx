interface SwitchProps {
  on: boolean;
  /** Renders the contested amber rather than the accent blue. */
  warn?: boolean;
  label: string;
}

/** A labelled on/off control. The caller owns the click target around it. */
export function Switch({ on, warn = false, label }: SwitchProps) {
  return (
    <span
      className={['switch', on ? 'on' : '', warn ? 'warn' : ''].filter(Boolean).join(' ')}
      role="switch"
      aria-checked={on}
      aria-label={label}
    />
  );
}
