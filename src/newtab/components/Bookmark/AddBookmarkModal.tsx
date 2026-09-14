import { useEffect, useId, useState, type FormEvent } from 'react';
import { Modal } from '../Shared/Modal';

type AddBookmarkModalProps = {
  isOpen: boolean;
  boardName: string;
  onClose: () => void;
  onSave: (url: string, title: string) => Promise<void> | void;
};

export function AddBookmarkModal({ isOpen, boardName, onClose, onSave }: AddBookmarkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTitle('');
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    try {
      setIsSaving(true);
      await onSave(url.trim(), title.trim());
      onClose();
      setUrl('');
      setTitle('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-md overflow-hidden rounded-2xl">
      <div className="px-5 py-4 ui-divider-b">
        <h3 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Add Bookmark</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Save a new bookmark into {boardName}</p>
        {isSaving && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Fetching description and saving bookmark...
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div>
          <label htmlFor={`${titleId}-url`} className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>URL</label>
          <input
            id={`${titleId}-url`}
            type="url"
            required
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            disabled={isSaving}
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor={`${titleId}-title`} className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Title (Optional)</label>
          <input
            id={`${titleId}-title`}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example Website"
            disabled={isSaving}
            className="ui-input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 ${isSaving ? 'cursor-wait opacity-70' : ''}`}
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {isSaving ? 'Saving...' : 'Save Bookmark'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
