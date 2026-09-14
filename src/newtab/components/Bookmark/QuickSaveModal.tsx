import { useEffect, useId, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../Shared/Modal';

export function QuickSaveModal() {
  const { data, activePageId, addBookmark, quickSaveOpen, openQuickSave, closeQuickSave } = useStore();
  const titleId = useId();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [boardId, setBoardId] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+Y or Cmd+Shift+Y
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        openQuickSave();
        const activePage = data?.pages.find(p => p.id === activePageId);
        if (activePage && activePage.boards.length > 0 && !boardId) {
          setBoardId(activePage.boards[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, activePageId, boardId, openQuickSave]);

  useEffect(() => {
    if (!quickSaveOpen) {
      setUrl('');
      setTitle('');
      return;
    }

    const activePage = data?.pages.find(p => p.id === activePageId);
    if (activePage && activePage.boards.length > 0 && !boardId) {
      setBoardId(activePage.boards[0].id);
    }
  }, [activePageId, boardId, data, quickSaveOpen]);

  if (!quickSaveOpen || !data) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !boardId) return;

    let targetPageId = activePageId;
    for (const p of data.pages) {
      if (p.boards.some(b => b.id === boardId)) {
        targetPageId = p.id;
        break;
      }
    }

    if (targetPageId) {
      void addBookmark(targetPageId, boardId, url, title);
    }

    closeQuickSave();
    setUrl('');
    setTitle('');
  };

  return (
    <Modal isOpen={quickSaveOpen} onClose={closeQuickSave} titleId={titleId} className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border [border-width:var(--border-width)]">
      <div className="px-5 py-4 ui-divider-b">
        <h3 id={titleId} className="font-medium text-lg" style={{ color: 'var(--text)' }}>Quick Save</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Save the current tab to a board</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label htmlFor={`${titleId}-url`} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>URL</label>
          <input
            id={`${titleId}-url`}
            autoFocus
            type="url"
            required
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor={`${titleId}-title`} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Title (Optional)</label>
          <input
            id={`${titleId}-title`}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Example Website"
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor={`${titleId}-board`} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Destination Board</label>
          <select
            id={`${titleId}-board`}
            value={boardId}
            onChange={e => setBoardId(e.target.value)}
            className="ui-input"
          >
            <option value="" disabled>Select a board...</option>
            {data.pages.map(p => (
              <optgroup key={p.id} label={p.name}>
                {p.boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => closeQuickSave()}
            className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Save Bookmark
          </button>
        </div>
      </form>
    </Modal>
  );
}
