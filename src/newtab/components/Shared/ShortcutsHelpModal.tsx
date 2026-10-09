import { useId } from 'react';
import { Modal } from './Modal';

type ShortcutsHelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: '/', description: 'Search bookmarks' },
  { keys: 'Ctrl/Cmd + K', description: 'Open command palette' },
  { keys: 'p', description: 'Create a new page' },
  { keys: 'i', description: 'Open settings' },
  { keys: 's', description: 'Toggle sidebar (Sidebar layout)' },
  { keys: 'x', description: 'Toggle privacy blur' },
  { keys: 'z', description: 'Toggle Zen mode' },
  { keys: '?', description: 'Show this shortcuts list' },
  { keys: 'Ctrl/Cmd + Shift + Y', description: 'Quick Save the current tab' },
  { keys: 'Esc', description: 'Close the open modal or menu' },
  { keys: 'Right-click', description: 'Actions for a board or bookmark' },
  { keys: 'Shift + F10', description: 'Same actions, from the keyboard' },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-md overflow-hidden rounded-2xl">
      <div className="px-5 py-4 ui-divider-b">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Keyboard shortcuts</h3>
      </div>
      <ul className="px-5 py-4 space-y-2">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{shortcut.description}</span>
            <kbd className="rounded-md border px-2 py-1 text-xs font-mono [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}>
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
      <div className="flex justify-end px-5 py-4 ui-divider-t">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
