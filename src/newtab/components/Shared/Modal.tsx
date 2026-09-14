import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { cn, getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name for the dialog — visually rendered by the caller as the title, but also wired to aria-labelledby. */
  titleId: string;
  children: ReactNode;
  className?: string;
  /** Skip the click-outside-to-close backdrop handler (rare: nested confirm dialogs). */
  disableBackdropClose?: boolean;
};

// Shared modal shell: portal to document.body, themed backdrop, Escape to
// close, focus trapped inside while open, and focus restored to whatever
// triggered the modal on close. Every modal in the app composes this instead
// of re-implementing backdrop/focus handling per component.
export function Modal({ isOpen, onClose, titleId, children, className, disableBackdropClose }: ModalProps) {
  const { data } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const isNeoBrutalistMode = isNeoBrutalistTheme(data ?? undefined);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialogRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Glassmorphism only when the user set a background image (data-driven, so it
  // still needs a condition); otherwise the theme's own --overlay tint, with no
  // per-theme branching in the component.
  const backdropStyle = bgIsImage && !isNeoBrutalistMode
    ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' }
    : { backgroundColor: 'var(--overlay)' };

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={backdropStyle}
      onMouseDown={(event) => {
        if (!disableBackdropClose && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('ui-surface', className ?? 'w-full max-w-md rounded-2xl overflow-hidden')}
        style={{
          backgroundColor: getModalBackgroundStyle(data ?? undefined, isDark).backgroundColor,
          color: 'var(--text)',
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
