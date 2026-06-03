import { useEffect, useRef, useState } from 'react';
import { EyeOff, PanelLeft, Plus, Search, Move, Settings, Palette, Check, BookmarkPlus } from 'lucide-react';
import { useStore } from '../store/useStore';

type ToolbarProps = {
  onOpenSearch: () => void;
  onAddPage?: () => void;
  layoutMode?: 'discord' | 'simple' | 'neobrutalist' | 'neumorphism';
};

export function Toolbar({ onOpenSearch, onAddPage, layoutMode = 'discord' }: ToolbarProps) {
  const { toggleSidebar, toggleBlurMode, toggleDragMode, data, activePageId, setActivePage, openQuickSave, openSettingsModal, dragMode, addToast, updateSettings, importChromeBookmarks } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isNeoBrutalistMode = layoutMode === 'neobrutalist';
  const isNeumorphismMode = layoutMode === 'neumorphism';
  const isNeumorphismDark = isNeumorphismMode && isDark;
  const isCompactNavMode = layoutMode !== 'discord';
  const isChromeImportBlocked = Boolean(data?.chromeBookmarksImported || data?.pages.some((page) => page.boards.some((board) => board.name === 'Imported Bookmarks')));
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  const activePage = data?.pages.find((page) => page.id === activePageId);
  const themeMode = data?.settings?.themeMode ?? 'discord';

  const blockIfDragMode = () => {
    if (!dragMode) return false;
    addToast('Turn off Drag Mode to use this action', 'info');
    return true;
  };

  const handleChromeImport = () => {
    if (isChromeImportBlocked) {
      addToast('Chrome bookmarks already imported', 'info');
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getTree((tree) => {
        if (!tree || tree.length === 0) return;

        try {
          const summary = importChromeBookmarks(tree);
          const message = `Imported ${summary.bookmarksCreated} bookmarks${summary.boardsCreated > 0 ? ', created board' : ''}${summary.pagesCreated > 0 ? ', created page' : ''}.`;
          addToast(message, 'success');
        } catch {
          addToast('Failed to import Chrome bookmarks', 'error');
        }
      });
    } else {
      addToast('Chrome Bookmarks API is not available in this environment', 'error');
    }
  };

  useEffect(() => {
    if (!themeMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setThemeMenuOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [themeMenuOpen]);

  const handleThemeSelect = (nextTheme: 'discord' | 'simple' | 'neobrutalist' | 'neumorphism') => {
    updateSettings({ themeMode: nextTheme });
    setThemeMenuOpen(false);
  };

  return (
    <header className={`h-14 border-b flex items-center px-4 justify-between shrink-0 z-20 ${isNeoBrutalistMode ? 'border-black bg-white shadow-[4px_4px_0_#000]' : isNeumorphismMode ? `${isNeumorphismDark ? 'border-transparent bg-[#1b1f27] text-zinc-100' : 'border-transparent bg-[#e8ecf3] text-slate-800'} shadow-[8px_8px_18px_rgba(163,177,198,0.55),-8px_-8px_18px_rgba(255,255,255,0.95)]` : isCompactNavMode ? (isDark ? 'border-white/5 bg-zinc-950/10' : 'border-zinc-200 bg-white/60 backdrop-blur-sm') : isDark ? 'border-white/5 bg-zinc-950/20 backdrop-blur-sm' : 'border-zinc-200 bg-white/70 backdrop-blur-sm shadow-[0_8px_24px_rgba(0,0,0,0.04)]'}`}>
      <div className={`flex min-w-0 items-center gap-2 ${isCompactNavMode ? 'flex-1 overflow-x-auto pr-4' : 'gap-4'}`}>
        {!isCompactNavMode && (
          <button
            onClick={toggleSidebar}
            className={`shrink-0 p-1.5 rounded-md transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
            title="Toggle Sidebar (S)"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {isCompactNavMode && data?.pages?.length ? (
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1">
            {data.pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePage(page.id)}
                className={`shrink-0 inline-flex h-10 min-w-28 items-center justify-center rounded-xl border-2 px-4 text-sm font-medium transition-colors ${
                  page.id === activePageId
                    ? isNeoBrutalistMode
                      ? 'border-black bg-black text-white shadow-[4px_4px_0_#000]'
                      : isNeumorphismMode
                        ? `${isNeumorphismDark ? 'border-transparent bg-[#1b1f27] text-zinc-100' : 'border-transparent bg-[#e8ecf3] text-slate-800'} ${isNeumorphismDark ? 'shadow-[inset_5px_5px_10px_rgba(0,0,0,0.75),inset_-5px_-5px_10px_rgba(0,0,0,0.35)]' : 'shadow-[inset_5px_5px_10px_rgba(163,177,198,0.55),inset_-5px_-5px_10px_rgba(255,255,255,0.95)]'}`
                      : 'border-transparent bg-emerald-500 text-zinc-950'
                    : isNeoBrutalistMode
                      ? 'border-black bg-white text-black shadow-[4px_4px_0_#000] hover:bg-zinc-100'
                      : isNeumorphismMode
                        ? `${isNeumorphismDark ? 'border-transparent bg-[#1b1f27] text-zinc-100' : 'border-transparent bg-[#e8ecf3] text-slate-700'} ${isNeumorphismDark ? 'shadow-[6px_6px_12px_rgba(0,0,0,0.75),-6px_-6px_12px_rgba(0,0,0,0.35)] hover:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.75),inset_-5px_-5px_10px_rgba(0,0,0,0.35)]' : 'shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.95)] hover:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.55),inset_-5px_-5px_10px_rgba(255,255,255,0.95)]'}`
                      : isDark ? 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10' : 'border border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                title={page.name}
              >
                <span className="max-w-36 truncate">{page.name}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={onAddPage}
              className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-semibold transition-colors ${isNeoBrutalistMode ? 'border-black bg-white text-black shadow-[4px_4px_0_#000] hover:bg-zinc-100' : isNeumorphismMode ? `${isNeumorphismDark ? 'border-transparent bg-[#1b1f27] text-zinc-100' : 'border-transparent bg-[#e8ecf3] text-slate-700'} ${isNeumorphismDark ? 'shadow-[6px_6px_12px_rgba(0,0,0,0.75),-6px_-6px_12px_rgba(0,0,0,0.35)] hover:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.75),inset_-5px_-5px_10px_rgba(0,0,0,0.35)]' : 'shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.95)] hover:shadow-[inset_5px_5px_10px_rgba(163,177,198,0.55),inset_-5px_-5px_10px_rgba(255,255,255,0.95)]'}` : isDark ? 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'}`}
              title="Add page"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          activePage && <h2 className={`font-semibold text-lg ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{activePage.name}</h2>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isCompactNavMode && (
          <button
            onClick={() => { if (!blockIfDragMode()) handleChromeImport(); }}
            disabled={isChromeImportBlocked || dragMode}
            title={isChromeImportBlocked ? 'Chrome bookmarks are already imported' : 'Import bookmarks from Chrome'}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-2 px-3 ${(isChromeImportBlocked || dragMode) ? 'opacity-45 cursor-not-allowed' : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isNeumorphismMode ? `${isNeumorphismDark ? 'border border-transparent bg-[#1b1f27] text-zinc-100' : 'border border-transparent bg-[#e8ecf3] text-slate-700'} ${isNeumorphismDark ? 'shadow-[5px_5px_10px_rgba(0,0,0,0.75),-5px_-5px_10px_rgba(0,0,0,0.35)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.75),inset_-4px_-4px_8px_rgba(0,0,0,0.35)]' : 'shadow-[5px_5px_10px_rgba(163,177,198,0.45),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.95)]'}` : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span className="text-xs font-medium">Import Chrome</span>
          </button>
        )}
        <button
          onClick={() => { if (!blockIfDragMode()) openQuickSave(); }}
          disabled={dragMode}
          className={`p-1.5 rounded-md transition-colors ${dragMode ? 'opacity-50 cursor-not-allowed' : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isNeumorphismMode ? `${isNeumorphismDark ? 'border border-transparent bg-[#1b1f27] text-zinc-100' : 'border border-transparent bg-[#e8ecf3] text-slate-700'} ${isNeumorphismDark ? 'shadow-[5px_5px_10px_rgba(0,0,0,0.75),-5px_-5px_10px_rgba(0,0,0,0.35)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.75),inset_-4px_-4px_8px_rgba(0,0,0,0.35)]' : 'shadow-[5px_5px_10px_rgba(163,177,198,0.45),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.95)]'}` : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Quick Save"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={toggleDragMode}
          className={`p-1.5 rounded-md transition-colors ${dragMode ? (isNeoBrutalistMode ? 'border-2 border-black bg-black text-white shadow-[3px_3px_0_#000]' : 'bg-zinc-800 text-zinc-100') : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title={dragMode ? 'Drag mode on' : 'Drag mode off'}
        >
          <Move className="w-5 h-5" />
        </button>
        <button
          onClick={() => { if (!blockIfDragMode()) toggleBlurMode(); }}
          disabled={dragMode}
          className={`p-1.5 rounded-md transition-colors ${dragMode ? 'opacity-50 cursor-not-allowed' : isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isNeumorphismMode ? `${isNeumorphismDark ? 'border border-transparent bg-[#1b1f27] text-zinc-100' : 'border border-transparent bg-[#e8ecf3] text-slate-700'} ${isNeumorphismDark ? 'shadow-[5px_5px_10px_rgba(0,0,0,0.75),-5px_-5px_10px_rgba(0,0,0,0.35)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.75),inset_-4px_-4px_8px_rgba(0,0,0,0.35)]' : 'shadow-[5px_5px_10px_rgba(163,177,198,0.45),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.95)]'}` : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Toggle Blur Mode"
        >
          <EyeOff className="w-5 h-5" />
        </button>
        <button
          onClick={openSettingsModal}
          className={`p-1.5 rounded-md transition-colors ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setThemeMenuOpen((current) => !current)}
            className={`p-1.5 rounded-md transition-colors ${themeMenuOpen ? (isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900') : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
            title="Theme layout"
            aria-haspopup="menu"
            aria-expanded={themeMenuOpen}
          >
            <Palette className="w-5 h-5" />
          </button>

          {themeMenuOpen && (
            <div
              role="menu"
              className={`absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border shadow-xl ${isNeoBrutalistMode ? 'border-2 border-black bg-white' : isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'}`}
            >
              <button
                type="button"
                role="menuitemradio"
                aria-checked={themeMode === 'discord'}
                onClick={() => handleThemeSelect('discord')}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${themeMode === 'discord' ? (isNeoBrutalistMode ? 'bg-black text-white' : isDark ? 'bg-zinc-800/70 text-zinc-100' : 'bg-zinc-100 text-zinc-900') : isNeoBrutalistMode ? 'text-black hover:bg-zinc-100' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-50'}`}
              >
                <span>
                  <span className="block text-sm font-medium">Discord</span>
                  <span className={`block text-xs leading-5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Current dense shell
                  </span>
                </span>
                {themeMode === 'discord' && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </button>

              <button
                type="button"
                role="menuitemradio"
                aria-checked={themeMode === 'simple'}
                onClick={() => handleThemeSelect('simple')}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${themeMode === 'simple' ? (isNeoBrutalistMode ? 'bg-black text-white' : isDark ? 'bg-zinc-800/70 text-zinc-100' : 'bg-zinc-100 text-zinc-900') : isNeoBrutalistMode ? 'text-black hover:bg-zinc-100' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-50'}`}
              >
                <span>
                  <span className="block text-sm font-medium">Simple Mode</span>
                  <span className={`block text-xs leading-5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Cleaner top-tab layout
                  </span>
                </span>
                {themeMode === 'simple' && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </button>

              <button
                type="button"
                role="menuitemradio"
                aria-checked={themeMode === 'neobrutalist'}
                onClick={() => handleThemeSelect('neobrutalist')}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${themeMode === 'neobrutalist' ? 'bg-black text-white' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-50'}`}
              >
                <span>
                  <span className="block text-sm font-medium">NeoBrutalist</span>
                  <span className={`block text-xs leading-5 ${themeMode === 'neobrutalist' ? 'text-white/70' : 'text-zinc-500'}`}>
                    White and black high-contrast shell
                  </span>
                </span>
                {themeMode === 'neobrutalist' && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </button>

              <button
                type="button"
                role="menuitemradio"
                aria-checked={themeMode === 'neumorphism'}
                onClick={() => handleThemeSelect('neumorphism')}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${themeMode === 'neumorphism' ? 'bg-[#e8ecf3] text-slate-800' : isNeumorphismMode ? 'text-slate-700 hover:bg-[#e8ecf3]' : isDark ? 'text-zinc-300 hover:bg-zinc-900/60' : 'text-zinc-700 hover:bg-zinc-50'}`}
              >
                <span>
                  <span className="block text-sm font-medium">Neumorphism</span>
                  <span className={`block text-xs leading-5 ${themeMode === 'neumorphism' ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Soft pressed-in panels and buttons
                  </span>
                </span>
                {themeMode === 'neumorphism' && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </button>
            </div>
          )}
        </div>

        <button
          className={`p-1.5 rounded-md transition-colors flex items-center gap-2 px-3 ${isNeoBrutalistMode ? 'border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[3px_3px_0_#000]' : isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          title="Search (Ctrl+K)"
          onClick={() => { if (!blockIfDragMode()) onOpenSearch(); }}
          disabled={dragMode}
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-mono opacity-50 block md:hidden lg:block">/</span>
        </button>
      </div>
    </header>
  );
}
