import { Plus, Settings, Hash, Download, Upload, BookmarkPlus, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { InputModal } from './Shared/InputModal';
import { cn } from '../shared/utils';
import { isExtensionEnvironment } from '../storage/local';
import { PageSettingsModal } from './Page/PageSettingsModal';

export function Sidebar() {
  const { data, activePageId, setActivePage, addPage, updatePage, deletePage, exportData, importData, importChromeBookmarks: importChromeBookmarksTree, addToast, setPageVisibleBookmarks } = useStore();
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const hasImportedBookmarksBoard = Boolean(
    data?.pages.some((page) => page.boards.some((board) => board.name === 'Imported Bookmarks'))
  );
  const isChromeImportBlocked = Boolean(data?.chromeBookmarksImported || hasImportedBookmarksBoard);

  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [settingsPageId, setSettingsPageId] = useState<string | null>(null);
  const settingsPage = data?.pages.find((page) => page.id === settingsPageId) || null;
  const handleAddPage = () => setIsAddPageOpen(true);

  const onSavePage = (name: string) => {
    addPage(name);
    addToast(`Page "${name}" created`, 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importData(e.target.files[0]);
    }
  };

  const handleChromeImport = () => {
    if (isChromeImportBlocked) {
      useStore.getState().addToast('Chrome bookmarks already imported', 'info');
      return;
    }

    if (isExtensionEnvironment() && chrome.bookmarks) {
      chrome.bookmarks.getTree((tree) => {
        if (!tree || tree.length === 0) return;

        try {
          const summary = importChromeBookmarksTree(tree);
          const message = `Imported ${summary.bookmarksCreated} bookmarks${summary.boardsCreated > 0 ? ', created board' : ''}${summary.pagesCreated > 0 ? ', created page' : ''}.`;
          useStore.getState().addToast(message, 'success');
        } catch (err) {
          useStore.getState().addToast('Failed to import Chrome bookmarks', 'error');
        }
      });
    } else {
      useStore.getState().addToast('Chrome Bookmarks API is not available in this environment', 'error');
    }
  };

  // background modal is managed globally in the store
  const { setBackgroundModalOpen } = useStore();

  const handleDeletePage = () => {
    if (!settingsPage || !data) return;

    if (data.pages.length <= 1) {
      addToast('Cannot delete the last remaining page', 'error');
      return;
    }

    try {
      deletePage(settingsPage.id);
      addToast(`Deleted page "${settingsPage.name}"`, 'success');
      setSettingsPageId(null);
    } catch {
      addToast('Failed to delete page', 'error');
    }
  };

  const handleSavePageName = (nextName: string) => {
    if (!settingsPage) return;

    const trimmed = nextName.trim();
    if (!trimmed) {
      addToast('Page name cannot be empty', 'error');
      return;
    }

    if (trimmed === settingsPage.name) {
      addToast('Page name is unchanged', 'info');
      return;
    }

    try {
      updatePage(settingsPage.id, trimmed);
      addToast(`Page renamed to "${trimmed}"`, 'success');
    } catch {
      addToast('Failed to update page name', 'error');
    }
  };

  return (
    <aside className="w-64 bg-transparent flex flex-col pt-4 h-full">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          <img
            src="/icons/favicon-32x32.png"
            alt="Bookmrk logo"
            className={`h-6 w-6 rounded-md ${isDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.35)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.15)]'}`}
          />
          <h1 className={`font-sans text-sm tracking-[0.16em] ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>BOOKMRK</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {data?.pages.map((page) => (
          <div
            key={page.id}
            className={cn(
              "w-full flex items-center gap-1 rounded-md",
              activePageId === page.id ? (isDark ? 'bg-zinc-800/30' : 'bg-zinc-100/70') : ''
            )}
          >
            <button
              onClick={() => setActivePage(page.id)}
              className={cn(
                "flex-1 flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                activePageId === page.id 
                  ? isDark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-zinc-900 shadow-sm"
                  : isDark ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Hash className="w-4 h-4" />
              <span className="flex-1 text-left truncate">{page.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsPageId(page.id)}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
              title={`Settings for ${page.name}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {settingsPage && (
        <PageSettingsModal
          isOpen={Boolean(settingsPage)}
          pageName={settingsPage.name}
          onClose={() => setSettingsPageId(null)}
          onSaveName={handleSavePageName}
          visibleCount={settingsPage.visibleBookmarksPerBoard}
          onSaveVisibleCount={(count) => {
            try {
              setPageVisibleBookmarks(settingsPage.id, count);
              addToast(`Set ${count} visible bookmarks per board on "${settingsPage.name}"`, 'success');
            } catch {
              addToast('Failed to save page settings', 'error');
            }
          }}
          onDeletePage={handleDeletePage}
        />
      )}

      <div className={`px-2 py-4 border-t space-y-1 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <button 
          onClick={handleAddPage}
          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
        >
          <Plus className="w-4 h-4" />
          <span>New Page</span>
        </button>
        {/* Input modal for creating pages */}
        <InputModal
          isOpen={isAddPageOpen}
          title="New Page"
          label="Page name"
          placeholder="My Page"
          onClose={() => setIsAddPageOpen(false)}
          onSave={onSavePage}
        />
        
        <button 
          onClick={handleChromeImport}
          disabled={isChromeImportBlocked}
          title={isChromeImportBlocked ? 'Chrome bookmarks are already imported' : 'Import bookmarks from Chrome'}
          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium ${isChromeImportBlocked ? 'opacity-45 cursor-not-allowed' : ''} ${isDark ? 'text-amber-500 hover:bg-zinc-800/50 hover:text-amber-400' : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'}`}
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>{isChromeImportBlocked ? 'Chrome Imported' : 'Import Chrome'}</span>
        </button>

        <button 
          onClick={exportData}
          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
        >
          <Download className="w-4 h-4" />
          <span>Export JSON</span>
        </button>

        <label className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium cursor-pointer ${isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>
          <Upload className="w-4 h-4" />
          <span>Import JSON</span>
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>

        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button onClick={() => setBackgroundModalOpen(true)} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>
            <Settings className="w-4 h-4" />
            <span>Backgrounds</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
