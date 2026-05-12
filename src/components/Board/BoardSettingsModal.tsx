import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Rocket, Save, Trash2 } from 'lucide-react';
import { Board } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle } from '../../shared/utils';

type BoardSettingsModalProps = {
  isOpen: boolean;
  board: Board;
  onClose: () => void;
  onSaveName: (nextName: string) => void;
  onDeleteBoard: () => void;
  onSummonBoard: () => void;
};

export function BoardSettingsModal({
  isOpen,
  board,
  onClose,
  onSaveName,
  onDeleteBoard,
  onSummonBoard,
}: BoardSettingsModalProps) {
  const { data } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const [name, setName] = useState(board.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(board.name);
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

  const trimmedName = name.trim();
  const canSaveName = trimmedName.length > 0 && trimmedName !== board.name;
  const summonCount = board.bookmarks.length;

  const nameCountTone = useMemo(() => {
    if (trimmedName.length === 0) return isDark ? 'text-rose-300' : 'text-rose-600';
    if (trimmedName.length > 25) return isDark ? 'text-amber-300' : 'text-amber-700';
    return isDark ? 'text-zinc-500' : 'text-zinc-500';
  }, [isDark, trimmedName.length]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Board Settings</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Manage {board.name} and run bulk actions.</p>
        </div>

        <div className="px-5 py-5 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Edit board name</h4>
              <span className={`text-xs ${nameCountTone}`}>{trimmedName.length}/25</span>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 25))}
              placeholder="Board name"
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

          <section className={`rounded-xl border p-4 ${isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Summon board</h4>
                <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Open all bookmarks from this board in new tabs ({summonCount}).
                </p>
              </div>
              <button
                type="button"
                onClick={onSummonBoard}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isDark ? 'bg-sky-200 text-sky-900 hover:bg-sky-100' : 'bg-sky-700 text-white hover:bg-sky-600'}`}
              >
                <Rocket className="h-4 w-4" />
                <span>Summon</span>
              </button>
            </div>
          </section>

          <section className={`rounded-xl border p-4 ${isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-4 w-4 ${isDark ? 'text-rose-300' : 'text-rose-600'}`} />
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>Danger zone</h4>
                <p className={`mt-1 text-xs ${isDark ? 'text-rose-200/80' : 'text-rose-700/80'}`}>
                  Deleting a board removes all bookmarks inside it. This cannot be undone.
                </p>
                <label className={`mt-3 flex items-center gap-2 text-xs ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(event) => setConfirmDelete(event.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  I understand and want to delete this board
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={!confirmDelete}
                onClick={onDeleteBoard}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${confirmDelete ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-rose-300/40 text-rose-500 cursor-not-allowed'}`}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Board</span>
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
