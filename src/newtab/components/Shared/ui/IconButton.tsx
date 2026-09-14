import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../../shared/utils';

type IconButtonProps = ComponentPropsWithRef<'button'> & {
  /** Required: these buttons are icon-only, so this is their only accessible name. */
  'aria-label': string;
};

/** Icon-only button. `aria-label` is required by the type — an icon button
 *  without one is invisible to screen readers, so it shouldn't compile. */
export function IconButton({ className, type = 'button', ...props }: IconButtonProps) {
  return <button type={type} className={cn('ui-icon-btn', className)} {...props} />;
}
