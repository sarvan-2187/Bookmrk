import { useMemo } from 'react';
import { ExternalLink, PinOff, Search, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Bookmark, MAX_PINS } from '../../shared/types';
import { cn } from '../../shared/utils';
import { BookmarkFavicon } from '../Shared/BookmarkFavicon';
import { IconButton } from '../Shared/ui/IconButton';
import { MenuItem } from '../Shared/ui/Menu';
import { ContextMenu, useContextMenu } from '../Shared/ui/ContextMenu';

type ZenViewProps = {
  isDark: boolean;
  onOpenSearch: () => void;
};

/**
 * Zen mode: no sidebar, no boards, no toolbar — just the (up to 20) pinned
 * bookmarks as a centered grid. Pins are bookmark ids, so they're resolved
 * against every page here and silently skipped if the bookmark is gone.
 */
export function ZenView({ isDark, onOpenSearch }: ZenViewProps) {
  const { data, updateSettings } = useStore();

  const pinned = useMemo(() => {
    const byId = new Map<string, Bookmark>();
    data?.pages.forEach((page) => page.boards.forEach((board) => board.bookmarks.forEach((bm) => byId.set(bm.id, bm))));
    return (data?.pinnedBookmarkIds ?? []).flatMap((id) => byId.get(id) ?? []).slice(0, MAX_PINS);
  }, [data?.pages, data?.pinnedBookmarkIds]);

  const exitZen = () => updateSettings({ zenMode: false });

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <IconButton onClick={onOpenSearch} title="Search (/)" aria-label="Search bookmarks">
          <Search className="h-5 w-5" />
        </IconButton>
        <IconButton onClick={exitZen} title="Exit Zen mode (Z)" aria-label="Exit Zen mode">
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-16 no-scrollbar">
        {pinned.length === 0 ? (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">Nothing pinned yet. Right-click any bookmark and choose <span style={{ color: 'var(--text)' }}>Pin to Zen</span>.</p>
            <button
              type="button"
              onClick={exitZen}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              Exit Zen
            </button>
          </div>
        ) : (
          <ul className="grid max-w-3xl grid-cols-[repeat(auto-fill,6.5rem)] justify-center gap-x-4 gap-y-6 w-full">
            {pinned.map((bookmark) => (
              <li key={bookmark.id}>
                <ZenTile bookmark={bookmark} isDark={isDark} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ZenTile({ bookmark, isDark }: { bookmark: Bookmark; isDark: boolean }) {
  const { data, blurMode, togglePin } = useStore();
  const contextMenu = useContextMenu();
  const openInNewTab = data?.settings?.openLinksInNewTab ?? false;
  const isNeoBrutalist = data?.settings?.themeMode === 'neobrutalist';

  return (
    <>
      <button
        type="button"
        onClick={() => window.open(bookmark.url, openInNewTab ? '_blank' : '_self')}
        onContextMenu={contextMenu.open}
        onKeyDown={contextMenu.openFromKeyboard}
        aria-label={`Open ${bookmark.title}`}
        aria-haspopup="menu"
        title={bookmark.title}
        className={cn(
          'group flex w-full flex-col items-center gap-2 rounded-2xl p-2 transition-all duration-200 hover:bg-[var(--surface-hover)]',
          blurMode && 'blur-sm opacity-70 hover:blur-none hover:opacity-100 focus-visible:blur-none focus-visible:opacity-100'
        )}
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform group-hover:-translate-y-0.5 [border-width:var(--border-width)]"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-raised)' }}
        >
          <BookmarkFavicon
            favicon={bookmark.favicon}
            title={bookmark.title}
            url={bookmark.url}
            isDark={isDark}
            isNeoBrutalistMode={isNeoBrutalist}
            className="h-7 w-7 text-sm"
            imageClassName="h-7 w-7"
          />
        </span>
        <span className="w-full truncate text-center text-xs font-medium" style={{ color: 'var(--text)' }}>
          {bookmark.customLabel || bookmark.title}
        </span>
      </button>

      <ContextMenu position={contextMenu.position} onClose={contextMenu.close} label={`${bookmark.title} actions`}>
        {(close) => (
          <>
            <MenuItem icon={<ExternalLink className="h-4 w-4 shrink-0" />} onClick={() => { window.open(bookmark.url, '_blank', 'noopener,noreferrer'); close(); }}>
              Open in new tab
            </MenuItem>
            <MenuItem icon={<PinOff className="h-4 w-4 shrink-0" />} onClick={() => { togglePin(bookmark.id); close(); }}>
              Unpin
            </MenuItem>
          </>
        )}
      </ContextMenu>
    </>
  );
}
