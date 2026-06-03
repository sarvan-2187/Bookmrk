import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, Upload, Trash2 } from 'lucide-react';
import { Bookmark } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle, isNeoBrutalistTheme } from '../../shared/utils';
import { BookmarkFavicon } from '../Shared/BookmarkFavicon';

type BookmarkSettingsModalProps = {
  isOpen: boolean;
  bookmark: Bookmark;
  pageId: string;
  boardId: string;
  onClose: () => void;
  onDelete?: () => void;
};

function getChromeFaviconUrl(bookmarkUrl: string): string {
  try {
    const resolvedUrl = new URL(bookmarkUrl.startsWith('http') ? bookmarkUrl : `https://${bookmarkUrl}`);
    return `https://www.google.com/s2/favicons?domain=${resolvedUrl.hostname}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${bookmarkUrl}&sz=64`;
  }
}

export function BookmarkSettingsModal({ isOpen, bookmark, pageId, boardId, onClose, onDelete }: BookmarkSettingsModalProps) {
  const { updateBookmark, addToast, data } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [description, setDescription] = useState(bookmark.description ?? bookmark.note ?? '');
  const [faviconUrl, setFaviconUrl] = useState(bookmark.favicon ?? getChromeFaviconUrl(bookmark.url));
  const [faviconLabel, setFaviconLabel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setDescription(bookmark.description ?? bookmark.note ?? '');
      setFaviconUrl(bookmark.favicon ?? getChromeFaviconUrl(bookmark.url));
      setFaviconLabel(null);
      setConfirmDelete(false);
    }
  }, [isOpen, bookmark]);

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
  const trimmedFaviconUrl = faviconUrl.trim();
  const resolvedFaviconUrl = trimmedFaviconUrl || getChromeFaviconUrl(trimmedUrl || bookmark.url);
  const initialFaviconUrl = bookmark.favicon ?? getChromeFaviconUrl(bookmark.url);
  const canSave = trimmedTitle.length > 0 && trimmedUrl.length > 0 && (trimmedTitle !== bookmark.title || trimmedUrl !== bookmark.url || trimmedDescription !== (bookmark.description ?? bookmark.note ?? '') || resolvedFaviconUrl !== initialFaviconUrl);

  const titleTone = useMemo(() => {
    if (trimmedTitle.length === 0) return isDark ? 'text-rose-300' : 'text-rose-600';
    return isDark ? 'text-zinc-500' : 'text-zinc-500';
  }, [isDark, trimmedTitle.length]);

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file for the favicon', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFaviconUrl(reader.result);
        setFaviconLabel(file.name);
      }
    };
    reader.onerror = () => {
      addToast('Failed to read the selected favicon image', 'error');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto p-4 md:items-center"
      style={isNeoBrutalistMode ? { backgroundColor: 'rgba(255, 255, 255, 0.88)' } : bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ${isNeoBrutalistMode ? 'border-2 border-black shadow-[8px_8px_0_#000]' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isNeoBrutalistMode ? '#ffffff' : isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${isNeoBrutalistMode ? 'border-black' : isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Bookmark Settings</h3>
          <p className={`mt-1 text-sm ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Edit the bookmark details.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit name</h4>
              <span className={`text-xs ${titleTone}`}>{trimmedTitle.length}/120</span>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 120))}
              placeholder="Bookmark title"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

          <section className="space-y-3">
            <h4 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Add description</h4>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 500))}
              placeholder="Optional description"
              rows={4}
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 resize-none ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

          <section className="space-y-3">
            <h4 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit URL</h4>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className={`text-sm font-semibold ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Favicon</h4>
              {faviconLabel ? (
                <span className={`max-w-48 truncate text-xs ${isNeoBrutalistMode ? 'text-black/70' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{faviconLabel}</span>
              ) : (
                <span className={`text-xs ${isNeoBrutalistMode ? 'text-black/60' : isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Optional</span>
              )}
            </div>

            <div className={`flex items-center gap-3 rounded-xl border p-3 ${isNeoBrutalistMode ? 'border-2 border-black bg-white shadow-[2px_2px_0_#000]' : isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ${isNeoBrutalistMode ? 'border-2 border-black bg-white' : isDark ? 'border border-zinc-800 bg-zinc-900' : 'border border-zinc-300 bg-white'}`}>
                <BookmarkFavicon
                  favicon={faviconUrl}
                  title={bookmark.title}
                  url={trimmedUrl || bookmark.url}
                  isDark={isDark}
                  isNeoBrutalistMode={isNeoBrutalistMode}
                  imageClassName="h-6 w-6 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-sm ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Edit the favicon URL directly or upload a custom image.
                </p>
                <p className={`mt-1 text-xs ${isNeoBrutalistMode ? 'text-black/60' : isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  The Chrome favicon URL is used by default.
                </p>

                <div className="mt-3 space-y-2">
                  <input
                    value={faviconUrl}
                    onChange={(event) => setFaviconUrl(event.target.value)}
                    placeholder={getChromeFaviconUrl(trimmedUrl || bookmark.url)}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black placeholder:text-black/40 shadow-[2px_2px_0_#000] focus:border-black focus:ring-black' : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
                  />
                  <p className={`text-[11px] ${isNeoBrutalistMode ? 'text-black/60' : isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Paste any image URL, data URL, or the Chrome favicon URL here.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800'}`}>
                    <Upload className="h-4 w-4" />
                    <span>Upload favicon</span>
                    <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setFaviconUrl(getChromeFaviconUrl(trimmedUrl || bookmark.url));
                      setFaviconLabel(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-100'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className={`flex justify-end gap-3 border-t px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-100'}`}
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              try {
                updateBookmark(pageId, boardId, bookmark.id, trimmedTitle, trimmedUrl, trimmedDescription, resolvedFaviconUrl === initialFaviconUrl ? undefined : resolvedFaviconUrl);
                addToast('Bookmark updated', 'success');
                onClose();
              } catch (err) {
                console.error('Failed to update bookmark', err);
                addToast('Failed to update bookmark', 'error');
              }
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${canSave ? isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[2px_2px_0_#000] hover:bg-zinc-900' : isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-300/50 text-zinc-500 cursor-not-allowed'}`}
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