import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';

type AddBookmarkModalProps = {
  isOpen: boolean;
  boardName: string;
  onClose: () => void;
  onSave: (url: string, title: string) => Promise<void> | void;
};

export function AddBookmarkModal({ isOpen, boardName, onClose, onSave }: AddBookmarkModalProps) {
  const { data } = useStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);

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

  return createPortal(
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={isNeoBrutalistMode ? { backgroundColor: 'rgba(255, 255, 255, 0.88)' } : bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isNeoBrutalistMode ? 'border-2 border-black shadow-[8px_8px_0_#000]' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isNeoBrutalistMode ? '#ffffff' : isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b px-5 py-4 ${isNeoBrutalistMode ? 'border-black' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Add Bookmark</h3>
          <p className={`mt-1 text-sm ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Save a new bookmark into {boardName}</p>
          {isSaving && (
            <p className={`mt-2 text-xs ${isNeoBrutalistMode ? 'text-black/60' : isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Fetching description and saving bookmark...
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className={`mb-1.5 block text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              disabled={isSaving}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-medium ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example Website"
              disabled={isSaving}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isSaving ? 'cursor-wait opacity-70' : ''} ${isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}
            >
              {isSaving ? 'Saving...' : 'Save Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
