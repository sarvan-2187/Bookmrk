import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Save, Trash2 } from 'lucide-react';

type PageSettingsModalProps = {
  isOpen: boolean;
  pageName: string;
  onClose: () => void;
  onSaveName: (nextName: string) => void;
  visibleCount?: number;
  onSaveVisibleCount?: (count: number) => void;
  onDeletePage: () => void;
};
export function PageSettingsModal({ isOpen, pageName, onClose, onSaveName, visibleCount = 6, onSaveVisibleCount, onDeletePage }: PageSettingsModalProps) {
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [name, setName] = useState(pageName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visible, setVisible] = useState<number>(visibleCount);

  useEffect(() => {
    if (!isOpen) return;

    setName(pageName);
    setConfirmDelete(false);
    setVisible(visibleCount);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, pageName]);

  const trimmedName = name.trim();
  const canSaveName = trimmedName.length > 0 && trimmedName !== pageName;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Page Settings</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Manage {pageName}.</p>
        </div>

        <div className="px-5 py-5">
          <section className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit page name</h4>
              <span className={`text-xs ${trimmedName.length === 0 ? (isDark ? 'text-rose-300' : 'text-rose-600') : 'text-zinc-500'}`}>
                {trimmedName.length}/80
              </span>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 80))}
              placeholder="Page name"
              className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-1 ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400'}`}
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!canSaveName}
                onClick={() => onSaveName(trimmedName)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${canSaveName ? isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-300/50 text-zinc-500 cursor-not-allowed'}`}
              >
                <Save className="h-4 w-4" />
                <span>Save Name</span>
              </button>
            </div>
          </section>

          <section className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Bookmarks per board</h4>
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{visible}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={visible}
                onChange={(e) => setVisible(Math.max(1, Math.min(100, Number(e.target.value || 0))))}
                className={`w-28 rounded-md border px-3 py-2 outline-none ${isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : 'border-zinc-300 bg-white text-zinc-900'}`}
              />
              <div className="flex-1 text-sm text-zinc-500">Show this many bookmarks per board on the page; the rest will be hidden under a "Show more" button.</div>
              <button
                type="button"
                disabled={!onSaveVisibleCount}
                onClick={() => onSaveVisibleCount && onSaveVisibleCount(visible)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${onSaveVisibleCount ? isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'bg-zinc-300/50 text-zinc-500 cursor-not-allowed'}`}
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </section>

          <section className={`rounded-xl border p-4 ${isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-4 w-4 ${isDark ? 'text-rose-300' : 'text-rose-600'}`} />
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>Danger zone</h4>
                <p className={`mt-1 text-xs ${isDark ? 'text-rose-200/80' : 'text-rose-700/80'}`}>
                  Deleting this page removes all boards and bookmarks inside it. This cannot be undone.
                </p>
                <label className={`mt-3 flex items-center gap-2 text-xs ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(event) => setConfirmDelete(event.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  I understand and want to delete this page
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={!confirmDelete}
                onClick={onDeletePage}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${confirmDelete ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-300/40 text-rose-500 cursor-not-allowed'}`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Page</span>
              </button>
            </div>
          </section>
        </div>

        <div className={`flex justify-end border-t px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-100'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
