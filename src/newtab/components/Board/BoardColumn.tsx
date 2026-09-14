import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board } from '../../shared/types';
import { BookmarkTile } from '../Bookmark/BookmarkTile';
import { Plus, Pencil, Rocket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../shared/utils';
import { promptRenameBoard, summonBoard } from '../../shared/actions';
import { AddBookmarkModal } from '../Bookmark/AddBookmarkModal';
import { IconButton } from '../Shared/ui/IconButton';
import { MenuItem } from '../Shared/ui/Menu';
import { ContextMenu, useContextMenu } from '../Shared/ui/ContextMenu';

interface BoardColumnProps {
  board: Board;
  pageId: string;
  isOverlay?: boolean;
}

export function BoardColumn({ board, pageId, isOverlay }: BoardColumnProps) {
  const { addBookmark, deleteBoard } = useStore();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const contextMenu = useContextMenu();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ ...style, backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-raised)', borderRadius: 'var(--radius)', backdropFilter: 'var(--surface-blur)' }}
        className={cn(
          'group/board w-full flex flex-col overflow-hidden border transition-all duration-200 [border-width:var(--border-width)]',
          isDragging && 'opacity-30',
          isOverlay && 'ring-2 shadow-2xl rotate-1'
        )}
        onContextMenu={contextMenu.open}
      >
        {/* The header itself is the drag handle: it has no click action of its
            own, so dragging it is unambiguous and needs no grip icon reserving
            a gutter — which is what left the title indented 44px while the
            controls opposite it sat at 20px. dnd-kit's `attributes` supply
            role/tabIndex, so this stays keyboard-draggable. */}
        <div
          ref={setActivatorNodeRef}
          className="px-5 py-2.5 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
          aria-label={`${board.name} — drag to reorder`}
          {...attributes}
          {...listeners}
        >
          <div className="flex min-w-0 items-center gap-2">
            {board.accentColor && (
              <div className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: board.accentColor }} />
            )}
            <h3 className="truncate font-bold text-base tracking-tight" style={{ color: 'var(--text)' }} title={board.name}>{truncatedName}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border [border-width:var(--border-width)]" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
              {board.bookmarks.length}
            </span>
            <IconButton
              // The header above is a drag activator, so this must swallow the
              // pointerdown or clicking "+" would start dragging the board.
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsAddBookmarkOpen(true)}
              title="Add bookmark"
              aria-label={`Add bookmark to ${board.name}`}
            >
              <Plus className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        <div className="px-2 pb-2 pt-0.5 space-y-1 min-h-25">
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
                className="w-full text-sm mt-2 py-2 rounded-md hover:opacity-90"
                style={{ color: 'var(--text)', backgroundColor: 'var(--surface-muted)' }}
              >
                {expanded ? 'Show less' : `Show ${board.bookmarks.length - visibleCount} more`}
              </button>
            </div>
          )}

          {board.bookmarks.length === 0 && (
            <div className="h-24 rounded-xl flex items-center justify-center text-xs font-medium" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted)' }}>
              Drop bookmarks here
            </div>
          )}
        </div>
      </div>

      <ContextMenu position={contextMenu.position} onClose={contextMenu.close} label={`${board.name} actions`}>
        {(close) => (
          <>
            <MenuItem icon={<Plus className="h-4 w-4 shrink-0" />} onClick={() => { setIsAddBookmarkOpen(true); close(); }}>
              Add bookmark
            </MenuItem>
            <MenuItem icon={<Pencil className="h-4 w-4 shrink-0" />} onClick={() => { promptRenameBoard(pageId, board.id); close(); }}>
              Rename board
            </MenuItem>
            <MenuItem
              icon={<Rocket className="h-4 w-4 shrink-0" />}
              disabled={board.bookmarks.length === 0}
              onClick={() => { summonBoard(pageId, board.id); close(); }}
            >
              Open all ({board.bookmarks.length})
            </MenuItem>
            <div className="ui-menu-separator" role="separator" />
            <MenuItem
              icon={<Trash2 className="h-4 w-4 shrink-0" />}
              style={{ color: 'var(--danger)' }}
              // deleteBoard() raises its own toast with an Undo action, which is
              // why this no longer needs a confirmation checkbox.
              onClick={() => { deleteBoard(pageId, board.id); close(); }}
            >
              Delete board
            </MenuItem>
          </>
        )}
      </ContextMenu>

      <AddBookmarkModal
        isOpen={isAddBookmarkOpen}
        boardName={board.name}
        onClose={() => setIsAddBookmarkOpen(false)}
        onSave={async (url, title) => {
          await addBookmark(pageId, board.id, url, title);
        }}
      />
    </>
  );
}
