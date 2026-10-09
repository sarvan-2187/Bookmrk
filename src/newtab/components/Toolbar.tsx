import { useState } from 'react';
import { EyeOff, PanelLeft, Plus, Search, Settings, Check, BookmarkPlus, HelpCircle, MoreHorizontal, Download, Upload, Image as ImageIcon, Files, Flower2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PageSettingsModal } from './Page/PageSettingsModal';
import { resolveNavStyle } from '../shared/utils';
import { promptNewPage } from '../shared/actions';
import { IconButton } from './Shared/ui/IconButton';
import { Menu, MenuItem } from './Shared/ui/Menu';

type ToolbarProps = {
  onOpenSearch: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenImportFilePicker: () => void;
};

/**
 * Four controls, deliberately: Search, Quick Save, Pages, More.
 *
 * Everything else moved into the More menu and the command palette (Ctrl+K),
 * which covers 100% of the app's actions — see shared/commands.ts. A row of
 * nine same-weight monochrome icons made nothing read as primary.
 */
export function Toolbar({ onOpenSearch, onOpenShortcutsHelp, onOpenImportFilePicker }: ToolbarProps) {
  const {
    toggleSidebar, toggleBlurMode, data, activePageId, setActivePage,
    openQuickSave, openSettingsModal, addToast, importChromeBookmarks,
    exportData, setBackgroundModalOpen, updateSettings,
  } = useStore();

  // Layout comes from the user's own setting, never from the theme.
  const navStyle = resolveNavStyle(data?.settings);
  const isTabsNav = navStyle === 'tabs';

  // Matches the board name importChromeBookmarks() actually creates (see store/useStore.ts).
  const isChromeImportBlocked = Boolean(data?.chromeBookmarksImported || data?.pages.some((page) => page.boards.some((board) => board.name === 'Imported')));
  const [settingsPageId, setSettingsPageId] = useState<string | null>(null);

  const activePage = data?.pages.find((page) => page.id === activePageId);
  const settingsPage = data?.pages.find((page) => page.id === settingsPageId) || null;

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

  return (
    <header
      className="h-14 flex items-center px-4 justify-between shrink-0 z-20 gap-4 ui-divider-b"
      style={{ backgroundColor: 'var(--surface-raised)', backdropFilter: 'var(--surface-blur)' }}
    >
      <div className={`flex min-w-0 items-center ${isTabsNav ? 'flex-1 gap-2 overflow-x-auto' : 'gap-4'}`}>
        {!isTabsNav && (
          <IconButton onClick={toggleSidebar} title="Toggle Sidebar (S)" aria-label="Toggle sidebar" className="shrink-0">
            <PanelLeft className="w-5 h-5" />
          </IconButton>
        )}

        {isTabsNav && data?.pages?.length ? (
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1">
            {/* Tabs switch pages only — per-page settings live in the Pages
                menu, so the tab doesn't shift layout on hover any more. */}
            {data.pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePage(page.id)}
                className="shrink-0 inline-flex h-10 min-w-28 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors [border-width:var(--border-width)]"
                style={page.id === activePageId
                  ? { borderColor: 'var(--border)', backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                  : { borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}
                title={page.name}
                aria-current={page.id === activePageId ? 'page' : undefined}
              >
                <span className="max-w-36 truncate">{page.name}</span>
              </button>
            ))}
          </div>
        ) : (
          activePage && <h2 className="font-semibold text-lg truncate" style={{ color: 'var(--text)' }}>{activePage.name}</h2>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Search is the most-used control, so it gets a label and its shortcut
            hint instead of looking like every other mute icon. */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-9 items-center gap-2 rounded-full border pl-3 pr-2 text-sm transition-colors hover:opacity-90 [border-width:var(--border-width)]"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}
          title="Search bookmarks (/) or run a command (Ctrl+K)">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd
            className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-mono"
            style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)' }}
          >
            /
          </kbd>
        </button>

        <IconButton onClick={openQuickSave} title="Quick Save current tab" aria-label="Quick save current tab">
          <Plus className="w-5 h-5" />
        </IconButton>

        {/* Pages: switch to any page and reach its settings from one place, in
            both layouts — replaces the per-tab hover gear and the sidebar's
            per-row menu, which were two homes for the same action. */}
        <Menu label="Pages" icon={<Files className="w-5 h-5" />}>
          {(close) => (
            <>
              {data?.pages.map((page) => (
                <div key={page.id} className="flex items-stretch">
                  <MenuItem
                    checked={page.id === activePageId}
                    onClick={() => { setActivePage(page.id); close(); }}
                    trailing={page.id === activePageId ? <Check className="h-4 w-4 shrink-0" /> : undefined}
                  >
                    {page.name}
                  </MenuItem>
                  <button
                    type="button"
                    role="menuitem"
                    className="ui-menu-item ui-menu-item-compact"
                    title={`Settings for ${page.name}`}
                    aria-label={`Open settings for ${page.name}`}
                    onClick={() => { setSettingsPageId(page.id); close(); }}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="ui-menu-separator" role="separator" />
              <MenuItem icon={<Plus className="h-4 w-4 shrink-0" />} onClick={() => { promptNewPage(); close(); }}>
                New Page
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Everything that isn't one of the three actions above. Identical in
            every theme and both layouts; all of it also in the palette. */}
        <Menu label="More actions" icon={<MoreHorizontal className="w-5 h-5" />}>
          {(close) => (
            <>
              <MenuItem
                icon={<BookmarkPlus className="h-4 w-4 shrink-0" />}
                disabled={isChromeImportBlocked}
                title={isChromeImportBlocked ? 'Chrome bookmarks are already imported' : 'Import bookmarks from your browser'}
                onClick={() => { handleChromeImport(); close(); }}
              >
                {isChromeImportBlocked ? 'Chrome Imported' : 'Import Chrome'}
              </MenuItem>
              <MenuItem icon={<Download className="h-4 w-4 shrink-0" />} onClick={() => { exportData(); close(); }}>
                Export JSON
              </MenuItem>
              <MenuItem icon={<Upload className="h-4 w-4 shrink-0" />} onClick={() => { onOpenImportFilePicker(); close(); }}>
                Import JSON
              </MenuItem>
              <MenuItem icon={<ImageIcon className="h-4 w-4 shrink-0" />} onClick={() => { setBackgroundModalOpen(true); close(); }}>
                Backgrounds
              </MenuItem>

              <div className="ui-menu-separator" role="separator" />

              <MenuItem icon={<Flower2 className="h-4 w-4 shrink-0" />} onClick={() => { updateSettings({ zenMode: true }); close(); }}>
                Enter Zen mode
              </MenuItem>
              <MenuItem icon={<EyeOff className="h-4 w-4 shrink-0" />} onClick={() => { toggleBlurMode(); close(); }}>
                Toggle privacy blur
              </MenuItem>
              <MenuItem icon={<Settings className="h-4 w-4 shrink-0" />} onClick={() => { openSettingsModal(); close(); }}>
                Settings
              </MenuItem>
              <MenuItem icon={<HelpCircle className="h-4 w-4 shrink-0" />} onClick={() => { onOpenShortcutsHelp(); close(); }}>
                Keyboard shortcuts
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      {settingsPage && (
        <PageSettingsModal
          isOpen={Boolean(settingsPage)}
          pageName={settingsPage.name}
          onClose={() => setSettingsPageId(null)}
          onSaveName={(nextName) => {
            const trimmed = nextName.trim();
            if (!trimmed || trimmed === settingsPage.name) return;
            useStore.getState().updatePage(settingsPage.id, trimmed);
            addToast(`Page renamed to "${trimmed}"`, 'success');
          }}
          visibleCount={settingsPage.visibleBookmarksPerBoard}
          onSaveVisibleCount={(count) => {
            useStore.getState().setPageVisibleBookmarks(settingsPage.id, count);
            addToast(`Set ${count} visible bookmarks per board on "${settingsPage.name}"`, 'success');
          }}
          onDeletePage={() => {
            if ((data?.pages.length ?? 0) <= 1) {
              addToast('Cannot delete the last remaining page', 'error');
              return;
            }
            useStore.getState().deletePage(settingsPage.id);
            setSettingsPageId(null);
          }}
        />
      )}
    </header>
  );
}
