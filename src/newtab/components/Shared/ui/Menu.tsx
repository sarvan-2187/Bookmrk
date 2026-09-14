import { useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../../../shared/utils';
import { IconButton } from './IconButton';

const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

type MenuProps = {
  /** Accessible name + tooltip for the trigger button. */
  label: string;
  icon: ReactNode;
  align?: 'left' | 'right';
  /** Menu contents. `close` lets an item dismiss the menu after acting. */
  children: (close: () => void) => ReactNode;
  className?: string;
};

/**
 * Icon-triggered popup menu: closes on outside pointerdown and on Escape,
 * returns focus to the trigger, and moves focus between items with the arrow
 * keys. Generalized from the theme-palette menu that was inline in Toolbar.
 */
export function Menu({ label, icon, align = 'right', children, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    // Focus the first item so the menu is immediately keyboard-drivable.
    popupRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = Array.from(popupRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []);
      if (items.length === 0) return;

      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + delta + items.length) % items.length;
      items[nextIndex].focus();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <IconButton
        ref={triggerRef}
        onClick={() => setOpen((current) => !current)}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {icon}
      </IconButton>

      {open && (
        <div
          ref={popupRef}
          role="menu"
          aria-label={label}
          className={cn('ui-menu absolute top-full mt-2 w-56 z-30', align === 'right' ? 'right-0' : 'left-0', className)}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

type MenuItemProps = Omit<ComponentPropsWithRef<'button'>, 'role'> & {
  icon?: ReactNode;
  trailing?: ReactNode;
  /** Present => the item renders as a radio item reflecting its checked state. */
  checked?: boolean;
};

export function MenuItem({ icon, trailing, checked, children, className, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      className={cn('ui-menu-item', className)}
      {...props}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {trailing}
    </button>
  );
}
