import { useEffect, useId, useMemo, useState } from 'react';
import { ExternalLink, Search, Terminal } from 'lucide-react';
import { BookmrkData } from '../../shared/types';
import { useStore } from '../../store/useStore';
import { buildCommands, type Command } from '../../shared/commands';
import { Modal } from '../Shared/Modal';

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
  /** '>' opens straight into command mode (Ctrl+K); '' is plain search ('/'). */
  initialQuery?: string;
  data: BookmrkData | null;
  onClose: () => void;
  /** Opened via '?' — offered as a command so users can discover it from here too. */
  onOpenShortcutsHelp: () => void;
  /** Triggers the hidden file input that Import JSON uses. */
  onOpenImportFilePicker: () => void;
};

export function buildResults(data: BookmrkData | null, query: string): SearchResult[] {
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

function collectTags(data: BookmrkData | null): string[] {
  if (!data) return [];
  const tags = new Set<string>();
  for (const page of data.pages) {
    for (const board of page.boards) {
      for (const bookmark of board.bookmarks) {
        for (const tag of bookmark.tags ?? []) tags.add(tag);
      }
    }
  }
  return Array.from(tags).sort();
}

export function SearchModal({ isOpen, initialQuery = '', data, onClose, onOpenShortcutsHelp, onOpenImportFilePicker }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const titleId = useId();
  const setActivePage = useStore((state) => state.setActivePage);
  const openInNewTab = data?.settings?.openLinksInNewTab ?? false;

  const isCommandMode = query.startsWith('>');
  const commandQuery = isCommandMode ? query.slice(1).trim().toLowerCase() : '';

  // Rebuilt whenever the modal opens or data changes: labels and disabled
  // states depend on current settings (e.g. "Theme: Discord" is disabled when
  // Discord is already active).
  const commands: Command[] = useMemo(
    () => (isOpen ? buildCommands({ openShortcutsHelp: onOpenShortcutsHelp, openImportFilePicker: onOpenImportFilePicker }) : []),
    [isOpen, data, onOpenShortcutsHelp, onOpenImportFilePicker]
  );

  const filteredCommands = useMemo(
    () => commands.filter((command) =>
      `${command.label} ${command.keywords ?? ''} ${command.group}`.toLowerCase().includes(commandQuery)
    ),
    [commands, commandQuery]
  );

  const allTags = useMemo(() => collectTags(data), [data]);
  const results = useMemo(() => (isCommandMode ? [] : buildResults(data, query)), [data, query, isCommandMode]);
  const activeListLength = isCommandMode ? filteredCommands.length : results.length;

  useEffect(() => {
    setQuery(isOpen ? initialQuery : '');
    setActiveIndex(0);
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(activeListLength - 1, 0)));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (isCommandMode && filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].run();
          onClose();
          return;
        }
        if (!isCommandMode && results[activeIndex]) {
          const result = results[activeIndex];
          setActivePage(result.pageId);
          window.open(result.url, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
          onClose();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, isOpen, onClose, results, filteredCommands, isCommandMode, activeListLength, setActivePage, openInNewTab]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} className="w-full max-w-2xl overflow-hidden rounded-2xl">
      <h2 id={titleId} className="sr-only">Search bookmarks or run a command</h2>
      <div className="ui-field-row flex items-center gap-3 px-5 py-4 ui-divider-b">
        {isCommandMode ? <Terminal className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /> : <Search className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />}
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search bookmarks, URLs, tags, boards... (type > for commands)"
          className="ui-input-bare"
          aria-label="Search bookmarks or type > for a command"
        />
        <span className="rounded-md border px-2 py-1 text-[11px] uppercase tracking-wider [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
          {isCommandMode ? '>' : '/'}
        </span>
      </div>

      {!isCommandMode && allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 py-2 ui-divider-b">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(query.trim() === tag ? '' : tag)}
              className="rounded-full px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
              style={query.trim() === tag ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' } : { backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {isCommandMode ? (
          filteredCommands.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No matching commands.</div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => { command.run(); onClose(); }}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors [border-width:var(--border-width)]"
                  style={index === activeIndex ? { borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' } : { borderColor: 'transparent', backgroundColor: 'transparent' }}
                >
                  <Terminal className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{command.label}</span>
                </button>
              ))}
            </div>
          )
        ) : results.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
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
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors [border-width:var(--border-width)]"
                  style={isActive ? { borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' } : { borderColor: 'transparent', backgroundColor: 'transparent' }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border [border-width:var(--border-width)]" style={{ backgroundColor: 'var(--surface-muted)' }}>
                    {result.favicon ? (
                      <img src={result.favicon} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: 'var(--text-muted)', opacity: 0.4 }} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>{result.title}</h4>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider [border-width:var(--border-width)]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {result.pageName}
                      </span>
                    </div>
                    <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>{result.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</p>
                    <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>Board: {result.boardName}</p>
                  </div>

                  <ExternalLink className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
