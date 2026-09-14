import { useStore } from '../store/useStore';
import { resolveNavStyle } from './utils';
import { promptNewBoard, promptNewPage, promptRenamePage, deletePageGuarded } from './actions';
import type { ColorMode, NavStyle, ThemeMode } from './types';

export type Command = {
  id: string;
  label: string;
  group: string;
  /** Extra search terms so "dark" finds "Color mode: Dark", etc. */
  keywords?: string;
  disabled?: boolean;
  run: () => void;
};

const THEMES: Array<{ value: ThemeMode; label: string }> = [
  { value: 'discord', label: 'Discord' },
  { value: 'simple', label: 'Simple' },
  { value: 'neobrutalist', label: 'NeoBrutalist' },
  { value: 'neumorphism', label: 'Neumorphism' },
];

const COLOR_MODES: Array<{ value: ColorMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NAV_STYLES: Array<{ value: NavStyle; label: string }> = [
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'tabs', label: 'Tabs' },
];

/**
 * The complete action surface of the app, in one list.
 *
 * This is deliberately exhaustive: the toolbar only shows four buttons, so
 * anything not in here would be unreachable for keyboard users. If you add a
 * feature, add it here too.
 */
export function buildCommands(ui: {
  openShortcutsHelp: () => void;
  openImportFilePicker: () => void;
}): Command[] {
  const state = useStore.getState();
  const {
    data, activePageId, setActivePage, openQuickSave, openSettingsModal, setBackgroundModalOpen,
    toggleBlurMode, toggleSidebar, updateSettings, exportData, importChromeBookmarks, addToast,
  } = state;

  const pages = data?.pages ?? [];
  const settings = data?.settings;
  const isChromeImportBlocked = Boolean(
    data?.chromeBookmarksImported || pages.some((page) => page.boards.some((board) => board.name === 'Imported'))
  );

  const commands: Command[] = [
    // ---- Capture ----
    { id: 'quick-save', group: 'Capture', label: 'Quick Save current tab', keywords: 'add bookmark new', run: openQuickSave },

    // ---- Pages ----
    { id: 'page-new', group: 'Pages', label: 'New Page', keywords: 'create add', run: promptNewPage },
    ...(activePageId
      ? [
          { id: 'page-rename', group: 'Pages', label: 'Rename current page', run: () => promptRenamePage(activePageId) },
          {
            id: 'page-delete',
            group: 'Pages',
            label: 'Delete current page',
            disabled: pages.length <= 1,
            run: () => deletePageGuarded(activePageId),
          },
        ]
      : []),
    ...pages
      .filter((page) => page.id !== activePageId)
      .map((page) => ({
        id: `page-goto-${page.id}`,
        group: 'Pages',
        label: `Go to "${page.name}"`,
        keywords: `switch open ${page.name}`,
        run: () => setActivePage(page.id),
      })),

    // ---- Boards ----
    ...(activePageId
      ? [{ id: 'board-new', group: 'Boards', label: 'New Board', keywords: 'create add column', run: () => promptNewBoard(activePageId) }]
      : []),

    // ---- Data ----
    { id: 'data-export', group: 'Data', label: 'Export JSON', keywords: 'backup save download', run: exportData },
    { id: 'data-import', group: 'Data', label: 'Import JSON', keywords: 'restore upload backup', run: ui.openImportFilePicker },
    {
      id: 'data-chrome',
      group: 'Data',
      label: isChromeImportBlocked ? 'Import Chrome (already imported)' : 'Import Chrome bookmarks',
      keywords: 'browser firefox edge',
      disabled: isChromeImportBlocked,
      run: () => {
        if (typeof chrome === 'undefined' || !chrome.bookmarks) {
          addToast('Chrome Bookmarks API is not available in this environment', 'error');
          return;
        }
        chrome.bookmarks.getTree((tree) => {
          if (!tree?.length) return;
          try {
            const summary = importChromeBookmarks(tree);
            addToast(`Imported ${summary.bookmarksCreated} bookmarks.`, 'success');
          } catch {
            addToast('Failed to import Chrome bookmarks', 'error');
          }
        });
      },
    },

    // ---- Appearance ----
    ...THEMES.map((theme) => ({
      id: `theme-${theme.value}`,
      group: 'Appearance',
      label: `Theme: ${theme.label}`,
      keywords: 'skin look style',
      disabled: (settings?.themeMode ?? 'discord') === theme.value,
      run: () => updateSettings({ themeMode: theme.value }),
    })),
    ...COLOR_MODES.map((mode) => ({
      id: `color-${mode.value}`,
      group: 'Appearance',
      label: `Color mode: ${mode.label}`,
      keywords: 'dark light theme',
      disabled: (settings?.colorMode ?? 'system') === mode.value,
      run: () => updateSettings({ colorMode: mode.value }),
    })),
    ...NAV_STYLES.map((nav) => ({
      id: `nav-${nav.value}`,
      group: 'Appearance',
      label: `Layout: ${nav.label}`,
      keywords: 'navigation sidebar tabs',
      disabled: resolveNavStyle(settings) === nav.value,
      run: () => updateSettings({ navStyle: nav.value }),
    })),
    { id: 'backgrounds', group: 'Appearance', label: 'Change background', keywords: 'wallpaper image photo', run: () => setBackgroundModalOpen(true) },
    {
      id: 'compact',
      group: 'Appearance',
      label: settings?.compactMode ? 'Turn off compact mode' : 'Turn on compact mode',
      keywords: 'density spacing',
      run: () => updateSettings({ compactMode: !settings?.compactMode, showBookmarkDescriptions: settings?.compactMode ? true : false }),
    },

    // ---- View ----
    { id: 'blur', group: 'View', label: 'Toggle privacy blur', keywords: 'hide censor private', run: toggleBlurMode },
    ...(resolveNavStyle(settings) === 'sidebar'
      ? [{ id: 'sidebar', group: 'View', label: 'Toggle sidebar', run: toggleSidebar }]
      : []),

    // ---- App ----
    { id: 'settings', group: 'App', label: 'Open Settings', keywords: 'preferences options', run: openSettingsModal },
    { id: 'help', group: 'App', label: 'Keyboard shortcuts', keywords: 'help keys cheatsheet', run: ui.openShortcutsHelp },
  ];

  return commands;
}
