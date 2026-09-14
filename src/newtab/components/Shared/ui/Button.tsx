import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../../shared/utils';

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

/** Themed button. Colors/hover/disabled live in styles/components.css so they
 *  follow the active theme's tokens instead of being restyled per call site. */
export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('ui-btn', `ui-btn-${variant}`, `ui-btn-${size}`, className)}
      {...props}
    />
  );
}
