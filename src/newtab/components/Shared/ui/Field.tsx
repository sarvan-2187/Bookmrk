import { useId, type ReactNode } from 'react';

type FieldProps = {
  label: string;
  /** Keeps the label as an accessible name only (sr-only), for compact layouts. */
  hideLabel?: boolean;
  /** Renders a live "12/80" counter and warns as it approaches the limit. */
  counter?: { current: number; max: number };
  hint?: ReactNode;
  /** Receives the generated id — put it on the control so the label wires up. */
  children: (id: string) => ReactNode;
};

/** Label + control wiring. Every control gets a real <label htmlFor>, so no
 *  more per-modal copies of the same markup drifting apart. */
export function Field({ label, hideLabel, counter, hint, children }: FieldProps) {
  const id = useId();
  const isEmpty = counter?.current === 0;
  const isNearLimit = counter ? counter.current > counter.max * 0.8 : false;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={hideLabel ? 'sr-only' : 'ui-label'}>
          {label}
        </label>
        {counter && (
          <span
            className="text-xs"
            style={{ color: isEmpty ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--text-muted)' }}
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children(id)}
      {hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}
