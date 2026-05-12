import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle } from '../../shared/utils';

type AddBookmarkModalProps = {
  isOpen: boolean;
  boardName: string;
  onClose: () => void;
  onSave: (url: string, title: string) => void;
};

export function AddBookmarkModal({ isOpen, boardName, onClose, onSave }: AddBookmarkModalProps) {
  const { data } = useStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTitle('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    onSave(url.trim(), title.trim());
    onClose();
    setUrl('');
    setTitle('');
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4" 
      style={bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Add Bookmark</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Save a new bookmark into {boardName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example Website"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}
            >
              Save Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}