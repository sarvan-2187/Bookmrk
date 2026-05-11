import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../../shared/types';
import { cn } from '../../shared/utils';
import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { BookmarkSettingsModal } from './BookmarkSettingsModal';

interface BookmarkTileProps {
  bookmark: Bookmark;
  boardId: string;
  pageId: string;
  isOverlay?: boolean;
}

export function BookmarkTile({ bookmark, boardId, pageId, isOverlay }: BookmarkTileProps) {
  const { deleteBookmark } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: 'Bookmark', bookmark, boardId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBookmark(pageId, boardId, bookmark.id);
  };


  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
  };

  const handleOpen = () => {
    window.open(bookmark.url, '_blank');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleOpen}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-grab active:cursor-grabbing cursor-pointer",
        isDark ? "hover:bg-white/5 border border-transparent hover:border-white/5" : "hover:bg-zinc-100 border border-transparent hover:border-zinc-200",
        isDragging && "opacity-30",
        isOverlay && (isDark ? "bg-zinc-900/80 backdrop-blur-md ring-1 ring-white/20 shadow-2xl rotate-2 opacity-100" : "bg-white/95 backdrop-blur-md ring-1 ring-zinc-300 shadow-2xl rotate-2 opacity-100")
      )}
      {...attributes}
      {...listeners}
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transition-colors ${isDark ? 'bg-white/5 border border-white/5 group-hover:border-white/10' : 'bg-zinc-100 border border-zinc-200 group-hover:border-zinc-300'}`}>
        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-4 h-4 object-contain filter brightness-110" />
        ) : (
          <div className={`w-4 h-4 rounded-sm ${isDark ? 'bg-zinc-700/50' : 'bg-zinc-400/60'}`} />
        )}
      </div>
      
      <div className="flex-1 min-w-0 pr-8">
        <h4 className={`text-[13px] font-medium truncate transition-colors ${isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-zinc-950'}`}>{bookmark.title}</h4>
        {!!(bookmark.description || bookmark.note) && (
          <p className={`text-[10px] truncate mt-0.5 font-medium tracking-wide transition-colors ${isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-700'}`}>
            {bookmark.description || bookmark.note}
          </p>
        )}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
          className={`p-1.5 focus:outline-none rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-zinc-100 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Bookmark settings"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          className={`p-1.5 focus:outline-none rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Open link"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(e);
          }}
          className={`p-1.5 focus:outline-none rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'}`}
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
