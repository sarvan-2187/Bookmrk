import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';
import { Bookmark } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle } from '../../shared/utils';

type BookmarkSettingsModalProps = {
  isOpen: boolean;
  bookmark: Bookmark;
  pageId: string;
  boardId: string;
  onClose: () => void;
  onDelete?: () => void;
};

export function BookmarkSettingsModal({ isOpen, bookmark, pageId, boardId, onClose, onDelete }: BookmarkSettingsModalProps) {
  const { updateBookmark, addToast, data } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [description, setDescription] = useState(bookmark.description ?? bookmark.note ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setDescription(bookmark.description ?? bookmark.note ?? '');
      setConfirmDelete(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const trimmedTitle = title.trim();
  const trimmedUrl = url.trim();
  const trimmedDescription = description.trim();
  const canSave = trimmedTitle.length > 0 && trimmedUrl.length > 0 && (trimmedTitle !== bookmark.title || trimmedUrl !== bookmark.url || trimmedDescription !== (bookmark.description ?? bookmark.note ?? ''));

  const titleTone = useMemo(() => {
    if (trimmedTitle.length === 0) return isDark ? 'text-rose-300' : 'text-rose-600';
    return isDark ? 'text-zinc-500' : 'text-zinc-500';
  }, [isDark, trimmedTitle.length]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 md:items-center"
      style={bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Bookmark Settings</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Edit the bookmark details.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit name</h4>
              <span className={`text-xs ${titleTone}`}>{trimmedTitle.length}/120</span>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 120))}
              placeholder="Bookmark title"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

          <section className="space-y-3">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Add description</h4>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 500))}
              placeholder="Optional description"
              rows={4}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 resize-none ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

          <section className="space-y-3">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit URL</h4>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

        </div>

        <div className={`flex justify-end gap-3 border-t px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-100'}`}
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              try {
                updateBookmark(pageId, boardId, bookmark.id, trimmedTitle, trimmedUrl, trimmedDescription);
                addToast('Bookmark updated', 'success');
                onClose();
              } catch (err) {
                console.error('Failed to update bookmark', err);
                addToast('Failed to update bookmark', 'error');
              }
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${canSave ? isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-300/50 text-zinc-500 cursor-not-allowed'}`}
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}