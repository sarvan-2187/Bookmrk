import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../../shared/types';
import { cn } from '../../shared/utils';
import { GripVertical, Pencil, Trash2, ExternalLink, Copy } from 'lucide-react';
import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { BookmarkSettingsModal } from './BookmarkSettingsModal';
import { MenuItem } from '../Shared/ui/Menu';
import { ContextMenu, useContextMenu } from '../Shared/ui/ContextMenu';

interface BookmarkTileProps {
  bookmark: Bookmark;
  boardId: string;
  pageId: string;
  isOverlay?: boolean;
}

export function BookmarkTile({ bookmark, boardId, pageId, isOverlay }: BookmarkTileProps) {
  const { deleteBookmark, addToast, data, blurMode } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const contextMenu = useContextMenu();

  const settings = data?.settings;
  const compactMode = settings?.compactMode ?? false;
  const showDescriptions = (settings?.showBookmarkDescriptions ?? true) && !compactMode;
  const openInNewTab = settings?.openLinksInNewTab ?? false;

  // Truncate bookmark title to 25 chars, if exceeded show 25 chars + "..."
  const truncatedTitle = bookmark.title.length > 25 ? bookmark.title.substring(0, 25) + '...' : bookmark.title;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: 'Bookmark', bookmark, boardId },
  });

  const elRef = useRef<HTMLDivElement | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBlurActive = blurMode && !isRevealed;
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
      style={{ ...style, borderColor: isRevealed ? 'transparent' : 'var(--border)' }}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
          return;
        }
        contextMenu.openFromKeyboard(e);
      }}
      onContextMenu={contextMenu.open}
      role="button"
      tabIndex={0}
      aria-label={`Open ${bookmark.title}`}
      aria-haspopup="menu"
      className={cn(
        'group/tile relative flex items-center rounded-xl transition-all duration-200 border border-transparent cursor-pointer hover:opacity-90 [border-width:var(--border-width)]',
        compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5',
        !isRevealed && 'hover:bg-[var(--surface-hover)]',
        isDragging && 'opacity-30',
        isOverlay && 'shadow-2xl rotate-2 opacity-100'
      )}
    >
      <div className={`flex flex-1 items-center gap-3 min-w-0 ${contentBlurClass}`}>
        {/* The favicon slot doubles as the drag handle: the grip cross-fades in
            over it on hover, so the handle costs no extra width and the row
            never shifts. The click is deliberately left to bubble, so clicking
            the favicon still opens the bookmark — dnd-kit suppresses the click
            that follows an actual drag. */}
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="group/handle relative shrink-0 rounded-lg flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing [border-width:var(--border-width)]"
          style={{ width: compactMode ? 24 : 32, height: compactMode ? 24 : 32, backgroundColor: isBlurActive ? 'transparent' : 'var(--surface-muted)', borderColor: isBlurActive ? 'transparent' : 'var(--border)' }}
          aria-label={`${bookmark.title} — drag to reorder`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-4 h-4 object-contain transition-opacity group-hover/tile:opacity-0" />
          ) : (
            <div className="w-4 h-4 rounded-sm transition-opacity group-hover/tile:opacity-0" style={{ backgroundColor: 'var(--text-muted)', opacity: 0.4 }} />
          )}
          <GripVertical
            className={`absolute inset-0 m-auto opacity-0 transition-opacity group-hover/tile:opacity-100 group-focus-visible/handle:opacity-100 ${compactMode ? 'h-3 w-3' : 'h-3.5 w-3.5'}`}
            style={{ color: 'var(--text-muted)' }}
          />
        </button>

        <div className="min-w-0 flex-1">
          <h4 className={`font-medium truncate ${compactMode ? 'text-[11px]' : 'text-[13px]'} transition-colors duration-300 ease-out`} style={{ color: 'var(--text)' }} title={bookmark.title}>{truncatedTitle}</h4>
          {showDescriptions && !!(bookmark.description || bookmark.note) && (
            <p className={`truncate mt-0.5 font-medium tracking-wide ${compactMode ? 'text-[9px]' : 'text-[10px]'}`} style={{ color: 'var(--text-muted)' }}>
              {bookmark.description || bookmark.note}
            </p>
          )}
          {!compactMode && bookmark.tags && bookmark.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {bookmark.tags.map((tag) => (
                <span key={tag} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none" style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions live in the right-click menu now — the row used to carry two
          hover buttons each, which is a lot of noise across a full board. */}
      <ContextMenu position={contextMenu.position} onClose={contextMenu.close} label={`${bookmark.title} actions`}>
        {(close) => (
          <>
            <MenuItem icon={<ExternalLink className="h-4 w-4 shrink-0" />} onClick={() => { window.open(bookmark.url, '_blank', 'noopener,noreferrer'); close(); }}>
              Open in new tab
            </MenuItem>
            <MenuItem
              icon={<Copy className="h-4 w-4 shrink-0" />}
              onClick={() => {
                navigator.clipboard?.writeText(bookmark.url)
                  .then(() => addToast('Link copied', 'success'))
                  .catch(() => addToast('Could not copy link', 'error'));
                close();
              }}
            >
              Copy link
            </MenuItem>
            <MenuItem icon={<Pencil className="h-4 w-4 shrink-0" />} onClick={() => { setIsSettingsOpen(true); close(); }}>
              Edit bookmark
            </MenuItem>
            <div className="ui-menu-separator" role="separator" />
            <MenuItem
              icon={<Trash2 className="h-4 w-4 shrink-0" />}
              style={{ color: 'var(--danger)' }}
              onClick={() => { deleteBookmark(pageId, boardId, bookmark.id); close(); }}
            >
              Delete bookmark
            </MenuItem>
          </>
        )}
      </ContextMenu>

      <BookmarkSettingsModal
        isOpen={isSettingsOpen}
        bookmark={bookmark}
        pageId={pageId}
        boardId={boardId}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
