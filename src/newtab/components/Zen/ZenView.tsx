import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Bookmark as BookmarkIcon, ExternalLink, Globe, PinOff, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Bookmark, MAX_PINS } from '../../shared/types';
import { cn } from '../../shared/utils';
import { BookmarkFavicon } from '../Shared/BookmarkFavicon';
import { IconButton } from '../Shared/ui/IconButton';
import { MenuItem } from '../Shared/ui/Menu';
import { ContextMenu, useContextMenu } from '../Shared/ui/ContextMenu';
import { buildResults } from '../Search/SearchModal';

type ZenViewProps = {
  isDark: boolean;
};

/**
 * Zen mode: no sidebar, no boards, no toolbar — just a search bar and the (up
 * to 20) pinned bookmarks as a centered grid. Pins are bookmark ids, so they're
 * resolved against every page here and silently skipped if the bookmark is gone.
 */
export function ZenView({ isDark }: ZenViewProps) {
  const { data, updateSettings } = useStore();

  const pinned = useMemo(() => {
    const byId = new Map<string, Bookmark>();
    data?.pages.forEach((page) => page.boards.forEach((board) => board.bookmarks.forEach((bm) => byId.set(bm.id, bm))));
    return (data?.pinnedBookmarkIds ?? []).flatMap((id) => byId.get(id) ?? []).slice(0, MAX_PINS);
  }, [data?.pages, data?.pinnedBookmarkIds]);

  const exitZen = () => updateSettings({ zenMode: false });

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute left-6 top-4 z-10">
        <ZenClock />
      </div>
      <div className="absolute right-4 top-4 z-10">
        <IconButton
          onClick={exitZen}
          title="Exit Zen mode (Z)"
          aria-label="Exit Zen mode"
          className="rounded-full"
          // Same glass as the search bar, so it stays findable on any wallpaper.
          style={{ backgroundColor: 'var(--surface-raised)', backdropFilter: 'var(--surface-blur)', color: 'var(--text)' }}
        >
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-16 no-scrollbar">
        {/* Spacers split the free height 8:2, so search + pins sit well below
            center. More rows shrink the free space, drifting a full grid back
            toward center instead of overflowing. Tune the ratio here. */}
        <div className="grow-[8]" aria-hidden="true" />
        <ZenSearch />
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
          // flex-wrap, not an auto-fill grid: auto-fill keeps empty tracks and
          // left-packs a partial row, so short rows sat off-center.
          <ul className="flex w-full max-w-3xl flex-wrap justify-center gap-x-4 gap-y-6">
            {pinned.map((bookmark) => (
              <li key={bookmark.id} className="w-[6.5rem]">
                <ZenTile bookmark={bookmark} isDark={isDark} />
              </li>
            ))}
          </ul>
        )}
        <div className="grow-[2]" aria-hidden="true" />
      </div>
    </div>
  );
}

// A soft halo in the page colour, so text sitting straight on a wallpaper stays
// legible in both colour modes.
const TEXT_HALO = '0 1px 14px color-mix(in srgb, var(--surface) 70%, transparent)';

const formatTime = () => new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Current time in the user's locale (12/24h follows the browser). */
function ZenClock() {
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    // A string, not a Date: React skips the render when nothing changed, so
    // ticking every second costs one re-render per minute.
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className="block text-3xl font-light leading-10 tabular-nums tracking-tight select-none" style={{ color: 'var(--text)', textShadow: TEXT_HALO }}>
      {time}
    </time>
  );
}

const SEARCH_MODES = [
  { value: 'web', label: 'Browser tab search', placeholder: 'Search the web', icon: Globe },
  { value: 'bookmarks', label: 'Bookmarks Search', placeholder: 'Search your bookmarks', icon: BookmarkIcon },
] as const;

/**
 * Full-width search bar. "Browser tab search" hands the query to the
 * browser's own default engine; "Bookmarks Search" filters bookmarks inline
 * (same matcher as the search modal). The chosen mode is saved in settings.
 */
function ZenSearch() {
  const { data, updateSettings } = useStore();
  const mode = data?.settings?.zenSearchMode ?? 'web';
  const openInNewTab = data?.settings?.openLinksInNewTab ?? false;
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const showResults = mode === 'bookmarks' && query.trim() !== '';
  const results = useMemo(() => (showResults ? buildResults(data, query).slice(0, 8) : []), [showResults, data, query]);
  const activeMode = SEARCH_MODES.find((m) => m.value === mode) ?? SEARCH_MODES[0];

  const open = (url: string) => window.open(url, openInNewTab ? '_blank' : '_self');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;

    if (mode === 'bookmarks') {
      if (results[activeIndex]) open(results[activeIndex].url);
      return;
    }

    // Uses whatever engine the user picked in the browser. Firefox < 111 has
    // no search.query, so fall back to a plain Google URL there (and in dev).
    if (typeof chrome !== 'undefined' && chrome.search?.query) {
      chrome.search.query({ text, disposition: openInNewTab ? 'NEW_TAB' : 'CURRENT_TAB' });
    } else {
      open(`https://www.google.com/search?q=${encodeURIComponent(text)}`);
    }
  };

  return (
    <form role="search" onSubmit={submit} className="relative mb-12 w-full max-w-2xl">
      <div
        className="ui-field-row flex h-14 items-center gap-2 rounded-full border pl-1.5 pr-5 [border-width:var(--border-width)]"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)', backdropFilter: 'var(--surface-blur)' }}
      >
        <div className="flex shrink-0 gap-1 rounded-full p-1" style={{ backgroundColor: 'var(--surface-muted)' }} role="group" aria-label="Search mode">
          {SEARCH_MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              aria-label={label}
              title={label}
              onClick={() => { updateSettings({ zenSearchMode: value }); setActiveIndex(0); inputRef.current?.focus(); }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={mode === value ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </button>
          ))}
        </div>
        <input
          id="zen-search"
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { setQuery(''); return; }
            if (!showResults || results.length === 0) return;
            if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
          }}
          placeholder={activeMode.placeholder}
          aria-label={activeMode.placeholder}
          role={mode === 'bookmarks' ? 'combobox' : undefined}
          aria-expanded={mode === 'bookmarks' ? showResults : undefined}
          aria-controls={showResults ? listId : undefined}
          aria-activedescendant={showResults && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          className="ui-input-bare min-w-0 flex-1 px-2 text-base"
        />
      </div>

      {showResults && (
        <ul id={listId} role="listbox" aria-label="Matching bookmarks" className="ui-menu absolute inset-x-0 top-full z-30 mt-2 py-1">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No bookmarks matched.</li>
          ) : results.map((result, index) => (
            <li
              key={result.bookmarkId}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => open(result.url)}
              className="ui-menu-item cursor-pointer"
              style={index === activeIndex ? { backgroundColor: 'var(--surface-hover)', color: 'var(--text)' } : undefined}
            >
              <span className="flex-1 truncate">{result.title}</span>
              <span className="shrink-0 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{result.boardName}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
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
        <span className="w-full truncate text-center text-xs font-medium" style={{ color: 'var(--text)', textShadow: TEXT_HALO }}>
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
