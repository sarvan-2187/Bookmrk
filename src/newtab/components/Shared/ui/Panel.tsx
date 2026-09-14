import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../../shared/utils';

type PanelProps = ComponentPropsWithRef<'div'> & {
  /** `danger` uses the theme's danger surface/border rather than a hardcoded rose. */
  tone?: 'raised' | 'muted' | 'danger';
};

/** Bordered token surface — modal sections, danger zones, cards. */
export function Panel({ tone = 'raised', className, ...props }: PanelProps) {
  const toneClass = tone === 'raised' ? 'ui-panel' : tone === 'muted' ? 'ui-panel-muted' : 'ui-panel-danger';
  return <div className={cn(toneClass, className)} {...props} />;
}
