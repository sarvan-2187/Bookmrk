import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Search } from 'lucide-react';
import { BookmrkData } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { getModalBackgroundStyle } from '../../shared/utils';

type SearchResult = {
  pageId: string;
  pageName: string;
  boardId: string;
  boardName: string;
  bookmarkId: string;
  title: string;
  url: string;
  favicon?: string;
};

type SearchModalProps = {
  isOpen: boolean;
  data: BookmrkData | null;
  onClose: () => void;
};

function buildResults(data: BookmrkData | null, query: string): SearchResult[] {
  if (!data || !query.trim()) return [];

  const normalizedQuery = query.trim().toLowerCase();

  return data.pages.flatMap((page) =>
    page.boards.flatMap((board) =>
      board.bookmarks
        .filter((bookmark) => {
          const haystack = [
            bookmark.title,
            bookmark.url,
            bookmark.note || '',
            ...(bookmark.tags || []),
            board.name,
            page.name,
          ]
            .join(' ')
            .toLowerCase();

          return haystack.includes(normalizedQuery);
        })
        .map((bookmark) => ({
          pageId: page.id,
          pageName: page.name,
          boardId: board.id,
          boardName: board.name,
          bookmarkId: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          favicon: bookmark.favicon,
        }))
    )
  );
}

export function SearchModal({ isOpen, data, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgIsImage = data?.background?.type === 'image';
  const setActivePage = useStore((state) => state.setActivePage);
  const openInNewTab = data?.settings?.openLinksInNewTab ?? false;

  const results = useMemo(() => buildResults(data, query), [data, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
      return;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault();
        const result = results[activeIndex];
        setActivePage(result.pageId);
        window.open(result.url, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, isOpen, onClose, results, setActivePage]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={bgIsImage ? { backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)' } : { backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center gap-3 border-b px-5 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <Search className={`h-5 w-5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bookmarks, URLs, tags, boards..."
            className={`w-full bg-transparent outline-none ${isDark ? 'text-zinc-50 placeholder:text-zinc-400' : 'text-zinc-900 placeholder:text-zinc-500'}`}
          />
          <span className={`rounded-md border px-2 py-1 text-[11px] uppercase tracking-wider ${isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300' : 'border-zinc-300 bg-zinc-100 text-zinc-700'}`}>
            /
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className={`px-4 py-10 text-center text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {query.trim() ? 'No bookmarks matched your search.' : 'Type to search all bookmarks across every board.'}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={result.bookmarkId}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      setActivePage(result.pageId);
                      window.open(result.url, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? isDark ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-300 bg-zinc-100'
                        : isDark ? 'border-transparent bg-transparent hover:border-zinc-700 hover:bg-zinc-900/60' : 'border-transparent bg-transparent hover:border-zinc-200 hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${isDark ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-zinc-100'}`}>
                      {result.favicon ? (
                        <img src={result.favicon} alt="" className="h-4 w-4 object-contain" />
                      ) : (
                        <div className={`h-4 w-4 rounded-sm ${isDark ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`truncate text-sm font-medium ${isDark ? 'text-zinc-50' : 'text-zinc-900'}`}>{result.title}</h4>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-zinc-300 text-zinc-700'}`}>
                          {result.pageName}
                        </span>
                      </div>
                      <p className={`truncate text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{result.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</p>
                      <p className={`mt-1 truncate text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Board: {result.boardName}</p>
                    </div>

                    <ExternalLink className={`h-4 w-4 shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}