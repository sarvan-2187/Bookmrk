import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../../shared/types';
import { cn } from '../../shared/utils';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { BookmarkSettingsModal } from './BookmarkSettingsModal';
import { isNeoBrutalistTheme } from '../../shared/utils';

interface BookmarkTileProps {
  bookmark: Bookmark;
  boardId: string;
  pageId: string;
  isOverlay?: boolean;
}

export function BookmarkTile({ bookmark, boardId, pageId, isOverlay }: BookmarkTileProps) {
  const { deleteBookmark, dragMode, addToast, data, blurMode } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const settings = data?.settings;
  const compactMode = settings?.compactMode ?? false;
  const showDescriptions = (settings?.showBookmarkDescriptions ?? true) && !compactMode;
  const openInNewTab = settings?.openLinksInNewTab ?? false;
  const isNeoBrutalistMode = isNeoBrutalistTheme(data);
  const themeMode = data?.settings?.themeMode ?? 'discord';
  const isNeumorphismMode = themeMode === 'neumorphism';
  
  // Truncate bookmark title to 25 chars, if exceeded show 25 chars + "..."
  const truncatedTitle = bookmark.title.length > 25 ? bookmark.title.substring(0, 25) + '...' : bookmark.title;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: 'Bookmark', bookmark, boardId },
    disabled: !dragMode
  });

  const elRef = useRef<HTMLDivElement | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBlurActive = blurMode && !isRevealed;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (blurMode && !elRef.current?.matches(':hover, :focus-within')) {
      addToast('Disable Blur to interact with bookmarks', 'info');
      return;
    }
    if (dragMode) {
      addToast('Turn off Drag Mode to delete bookmarks', 'info');
      return;
    }
    deleteBookmark(pageId, boardId, bookmark.id);
  };


  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (blurMode && !elRef.current?.matches(':hover, :focus-within')) {
      addToast('Disable Blur to interact with bookmarks', 'info');
      return;
    }
    if (dragMode) {
      addToast('Turn off Drag Mode to edit bookmarks', 'info');
      return;
    }
    setIsSettingsOpen(true);
  };

  const isCardInteractive = () => !blurMode || elRef.current?.matches(':hover, :focus-within') === true;

  const handleOpen = () => {
    if (blurMode && !isCardInteractive()) {
      addToast('Disable Blur to open bookmarks', 'info');
      return;
    }

    window.open(bookmark.url, openInNewTab ? '_blank' : '_self');
  };
  const contentBlurClass = isBlurActive
    ? 'blur-sm opacity-70 scale-[0.99] transition-all duration-300 ease-out'
    : 'opacity-100 scale-100 transition-all duration-300 ease-out';

  return (
    <div
      ref={(el) => { setNodeRef(el); elRef.current = el; }}
      onPointerEnter={() => blurMode && setIsRevealed(true)}
      onPointerLeave={() => setIsRevealed(false)}
      onFocusCapture={() => blurMode && setIsRevealed(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsRevealed(false);
        }
      }}
      style={style}
      onClick={!dragMode ? handleOpen : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer hover:scale-100 group-hover:scale-100",
        compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5',
        dragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        // when revealed under blur, don't apply hover highlight styles — show it as-is
        isRevealed ? 'bg-transparent border border-transparent' : (isNeumorphismMode ? 'neo-inner' : isDark ? "hover:bg-white/5 border border-transparent hover:border-white/5" : "hover:bg-zinc-100 border border-transparent hover:border-zinc-200"),
        isDragging && "opacity-30",
        isOverlay && (isDark ? "bg-zinc-900/80 backdrop-blur-md ring-1 ring-white/20 shadow-2xl rotate-2 opacity-100" : "bg-white/95 backdrop-blur-md ring-1 ring-zinc-300 shadow-2xl rotate-2 opacity-100")
      )}
      {...attributes}
      {...(dragMode ? listeners : {})}
    >
      <div className={`flex flex-1 items-center gap-3 min-w-0 pr-8 ${contentBlurClass}`}>
        <div className={`shrink-0 ${compactMode ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg flex items-center justify-center overflow-hidden transition-colors ${isBlurActive ? 'bg-transparent border border-transparent' : (isDark ? `bg-white/5 border border-white/5 ${'group-hover:border-white/10'}` : `bg-zinc-100 border border-zinc-200 group-hover:border-zinc-300`)}`}>
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-4 h-4 object-contain filter brightness-110" />
          ) : (
            <div className={`w-4 h-4 rounded-sm ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-400/60'}`} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={`font-medium truncate ${compactMode ? 'text-[11px]' : 'text-[13px]'} ${isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-200' : 'text-zinc-800'} transition-colors duration-300 ease-out ${isBlurActive ? '' : (isNeoBrutalistMode ? 'group-hover:text-black' : isDark ? 'group-hover:text-white' : 'group-hover:text-zinc-950')}`} title={bookmark.title}>{truncatedTitle}</h4>
          {showDescriptions && !!(bookmark.description || bookmark.note) && (
            <p className={`truncate mt-0.5 font-medium tracking-wide ${compactMode ? 'text-[9px]' : 'text-[10px]'} ${isNeoBrutalistMode ? 'text-black/80' : isDark ? 'text-zinc-500' : 'text-zinc-500'} transition-colors duration-300 ease-out ${isBlurActive ? '' : (isNeoBrutalistMode ? 'group-hover:text-black' : isDark ? 'group-hover:text-zinc-400' : 'group-hover:text-zinc-700')}`}>
              {bookmark.description || bookmark.note}
            </p>
          )}
        </div>
      </div>

      <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all transform", isBlurActive ? 'opacity-0 translate-x-2' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0')}>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
          className={cn('p-1.5 focus:outline-none rounded-lg transition-all', isBlurActive ? (isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-500' : 'text-zinc-500') : (isNeoBrutalistMode ? 'text-black hover:text-black hover:bg-black/10' : isDark ? 'text-zinc-500 hover:text-zinc-100 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'))}
          title="Bookmark settings"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(e);
          }}
          className={cn('p-1.5 focus:outline-none rounded-lg transition-all', isBlurActive ? (isNeoBrutalistMode ? 'text-black' : isDark ? 'text-zinc-500' : 'text-zinc-500') : (isNeoBrutalistMode ? 'text-black hover:text-black hover:bg-black/10' : isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'))}
          title="Delete bookmark"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <BookmarkSettingsModal
        isOpen={isSettingsOpen}
        bookmark={bookmark}
        pageId={pageId}
        boardId={boardId}
        onClose={() => setIsSettingsOpen(false)}
        onDelete={() => {
          deleteBookmark(pageId, boardId, bookmark.id);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
