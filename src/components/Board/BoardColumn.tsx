import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board } from '../../shared/types';
import { BookmarkTile } from '../Bookmark/BookmarkTile';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../shared/utils';
import { AddBookmarkModal } from '../Bookmark/AddBookmarkModal';
import { BoardSettingsModal } from './BoardSettingsModal';

interface BoardColumnProps {
  board: Board;
  pageId: string;
  isOverlay?: boolean;
}

export function BoardColumn({ board, pageId, isOverlay }: BoardColumnProps) {
  const { addBookmark, deleteBoard, updateBoard, addToast, dragMode } = useStore();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeMode = useStore((state) => state.data?.settings?.themeMode ?? 'discord');
  const isNeoBrutalistMode = themeMode === 'neobrutalist';
  const isNeumorphismMode = themeMode === 'neumorphism';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: board.id,
    data: { type: 'Board', board, columnIndex: board.columnIndex ?? 0 }
  });

  const visibleCount = useStore((s) => s.data?.pages.find(p => p.id === pageId)?.visibleBookmarksPerBoard ?? 6);
  const [expanded, setExpanded] = useState(false);

  // Truncate board name to 25 characters
  const truncatedName = board.name.length > 25 ? board.name.substring(0, 25) + '...' : board.name;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddClick = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to add a bookmark', 'info');
      return;
    }
    setIsAddBookmarkOpen(true);
  };

  const handleOpenSettings = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to change board settings', 'info');
      return;
    }
    setIsBoardSettingsOpen(true);
  };

  const handleSaveBoardName = (nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) {
      addToast('Board name cannot be empty', 'error');
      return;
    }

    if (trimmed === board.name) {
      addToast('Board name is unchanged', 'info');
      return;
    }

    try {
      updateBoard(pageId, board.id, trimmed, board.accentColor);
      addToast(`Board renamed to "${trimmed}"`, 'success');
    } catch (error) {
      addToast('Failed to update board name', 'error');
    }
  };

  const handleDeleteBoard = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to delete this board', 'info');
      return;
    }
    try {
      deleteBoard(pageId, board.id);
      addToast(`Deleted board "${board.name}"`, 'success');
      setIsBoardSettingsOpen(false);
    } catch (error) {
      addToast('Failed to delete board', 'error');
    }
  };

  const handleSummonBoard = () => {
    if (dragMode) {
      addToast('Turn off Drag Mode to summon bookmarks', 'info');
      return;
    }
    if (board.bookmarks.length === 0) return;

    let opened = 0;
    let blocked = 0;
    let invalid = 0;

    for (const bookmark of board.bookmarks) {
      let safeUrl = bookmark.url;
      try {
        safeUrl = new URL(bookmark.url.startsWith('http') ? bookmark.url : `https://${bookmark.url}`).toString();
      } catch {
        invalid += 1;
        continue;
      }

      try {
        const win = window.open(safeUrl, '_blank', 'noopener,noreferrer');
        if (win) {
          opened += 1;
        } else {
          blocked += 1;
        }
      } catch {
        blocked += 1;
      }
    }

  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "w-full flex flex-col rounded-2xl overflow-hidden border transition-all duration-200",
          isNeoBrutalistMode
            ? 'border-2 border-black bg-white shadow-[6px_6px_0_#000]'
            : isNeumorphismMode
            ? 'neo-card'
            : isDark
            ? "backdrop-blur-xl bg-zinc-900/40 border-white/10 hover:border-white/20"
            : "backdrop-blur-xl bg-white/95 border-zinc-200 hover:border-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
          isDragging && "opacity-30",
          isOverlay && (isNeoBrutalistMode ? "ring-2 ring-black shadow-[8px_8px_0_#000] rotate-1" : isNeumorphismMode ? "ring-2 ring-white/6 shadow-2xl rotate-1" : isDark ? "ring-2 ring-white/20 shadow-2xl rotate-2" : "ring-2 ring-zinc-300 shadow-2xl rotate-2")
        )}
      >
        <div 
          className={`px-5 py-4 flex items-center justify-between cursor-grab active:cursor-grabbing ${isNeoBrutalistMode ? 'border-black bg-white' : isNeumorphismMode ? 'neo-inner' : isDark ? 'border-white/5' : 'border-zinc-200'}`}
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center gap-3">
            {board.accentColor && (
              <div className={`w-2 h-2 rounded-full ${isNeoBrutalistMode ? 'border border-black' : isDark ? 'shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'shadow-[0_0_8px_rgba(0,0,0,0.25)]'}`} style={{ backgroundColor: board.accentColor }} />
            )}
            <h3 className={`font-bold text-base tracking-tight ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-100' : 'text-zinc-900'}`} title={board.name}>{truncatedName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${isNeoBrutalistMode ? 'text-black bg-white border-2 border-black' : isDark ? 'text-zinc-500 bg-white/5' : 'text-zinc-600 bg-zinc-100 border border-zinc-200'}`}>
              {board.bookmarks.length}
            </span>
            <button 
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAddClick}
              disabled={dragMode}
              className={`p-1 rounded-md transition-colors ${dragMode ? 'opacity-50 cursor-not-allowed' : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0_#000]' : isDark ? 'text-zinc-500 hover:text-emerald-400' : 'text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
              title="Add bookmark"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleOpenSettings}
              disabled={dragMode}
              className={`p-1 rounded-md transition-colors ${dragMode ? 'opacity-50 cursor-not-allowed' : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0_#000]' : isDark ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-500 hover:text-red-600 hover:bg-rose-50'}`}
              title="Board settings"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`p-2 space-y-1 min-h-25 ${isNeoBrutalistMode ? 'bg-white' : isNeumorphismMode ? '' : ''} ${isNeumorphismMode ? 'mt-2' : ''}`}>
          <SortableContext items={board.bookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {(expanded ? board.bookmarks : board.bookmarks.slice(0, visibleCount)).map(bookmark => (
              <BookmarkTile 
                key={bookmark.id} 
                bookmark={bookmark} 
                boardId={board.id} 
                pageId={pageId} 
              />
            ))}
          </SortableContext>

          {board.bookmarks.length > visibleCount && (
            <div className="px-3">
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className={`w-full text-sm mt-2 py-2 rounded-md ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-zinc-100' : isDark ? 'text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/30' : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200'}`}
              >
                {expanded ? 'Show less' : `Show ${board.bookmarks.length - visibleCount} more`}
              </button>
            </div>
          )}
          
          {board.bookmarks.length === 0 && (
            <div className={`h-24 rounded-xl flex items-center justify-center text-xs font-medium ${isNeoBrutalistMode ? 'border-black text-black bg-white' : isNeumorphismMode ? 'neo-inner text-zinc-300' : isDark ? 'border-white/5 text-zinc-600' : 'border-zinc-300 text-zinc-500 bg-zinc-50/70'}`}>
              Drop bookmarks here
            </div>
          )}
        </div>
      </div>

      <AddBookmarkModal
        isOpen={isAddBookmarkOpen}
        boardName={board.name}
        onClose={() => setIsAddBookmarkOpen(false)}
        onSave={(url, title) => addBookmark(pageId, board.id, url, title)}
      />

      <BoardSettingsModal
        isOpen={isBoardSettingsOpen}
        board={board}
        onClose={() => setIsBoardSettingsOpen(false)}
        onSaveName={handleSaveBoardName}
        onDeleteBoard={handleDeleteBoard}
        onSummonBoard={handleSummonBoard}
      />
    </>
  );
}
