import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

type Position = { x: number; y: number };

/**
 * Right-click (and Shift+F10 / context-menu key) menu for a card.
 *
 * Lets boards and bookmarks drop their always-present "⋯" and hover buttons —
 * the actions move here, so the cards themselves are just content. Rendered in
 * a portal at the pointer, flipped back inside the viewport near the edges.
 */
export function useContextMenu() {
  const [position, setPosition] = useState<Position | null>(null);

  const open = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPosition({ x: event.clientX, y: event.clientY });
  };

  /** Keyboard equivalent: Shift+F10 or the dedicated context-menu key. */
  const openFromKeyboard = (event: React.KeyboardEvent) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return {
    position,
    open,
    openFromKeyboard,
    close: () => setPosition(null),
    triggerProps: { onContextMenu: open, onKeyDown: openFromKeyboard },
  };
}

type ContextMenuProps = {
  position: Position | null;
  onClose: () => void;
  label: string;
  children: (close: () => void) => ReactNode;
};

export function ContextMenu({ position, onClose, label, children }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!position) return;

    const menu = ref.current;
    if (menu) {
      // Flip back inside the viewport when opened near an edge.
      const rect = menu.getBoundingClientRect();
      const overflowX = position.x + rect.width - window.innerWidth + 8;
      const overflowY = position.y + rect.height - window.innerHeight + 8;
      if (overflowX > 0) menu.style.left = `${Math.max(8, position.x - rect.width)}px`;
      if (overflowY > 0) menu.style.top = `${Math.max(8, position.y - rect.height)}px`;
      menu.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []);
      if (items.length === 0) return;

      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      items[(currentIndex + delta + items.length) % items.length].focus();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', onClose);
    };
  }, [position, onClose]);

  if (!position) return null;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className="ui-menu fixed z-70 w-56"
      style={{ left: position.x, top: position.y }}
      // React bubbles portal events through the component tree, so without
      // this a menu click (or Enter on an item) also hits the card's own
      // open handler. Only Enter/Space are stopped: the window listener above
      // still needs Escape and the arrow keys.
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); }}
    >
      {children(onClose)}
    </div>,
    document.body
  );
}
