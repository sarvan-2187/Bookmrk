export type Bookmark = {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  customLabel?: string;
  tags?: string[];
  description?: string;
  note?: string;
  addedAt: number;
};

export type Board = {
  id: string;
  name: string;
  order: number;
  columnIndex?: number;
  accentColor?: string;
  bookmarks: Bookmark[];
};

export type Page = {
  id: string;
  name: string;
  order: number;
  boards: Board[];
  // How many bookmarks to show per board by default on this page (rest hidden behind "Show more")
  visibleBookmarksPerBoard?: number;
};

export type ThemeMode = 'discord' | 'simple' | 'neobrutalist' | 'neumorphism';
export type FontFamily = 'plus-jakarta-sans' | 'satoshi' | 'google-sans' | 'electrolize' | 'dm-mono' | 'jetbrains-mono' | 'comic-sans' | 'space-grotesk';
// 'system' follows prefers-color-scheme; 'light'/'dark' pin it explicitly.
export type ColorMode = 'system' | 'light' | 'dark';
// How pages are navigated. Deliberately independent of themeMode: a theme may
// only change how the app looks, never which controls exist or where they are.
export type NavStyle = 'sidebar' | 'tabs';

export type Settings = {
  // Behavior Settings
  openLinksInNewTab?: boolean;
  showBookmarkDescriptions?: boolean;
  // Appearance Settings
  compactMode?: boolean;
  themeMode?: ThemeMode;
  fontFamily?: FontFamily;
  colorMode?: ColorMode;
  // Unset => derived from themeMode for backward compatibility (see
  // resolveNavStyle). Once the user picks one it sticks across theme changes.
  navStyle?: NavStyle;
  // Hides boards/sidebar/toolbar and shows only pinned bookmarks.
  zenMode?: boolean;
};

export const MAX_PINS = 20;

// A single text prompt, rendered once by App via InputModal. Anything that
// needs a name from the user (new page, new board, rename) raises one of these
// instead of owning its own modal state — which also lets the command palette
// trigger those flows without prop drilling.
export type PromptConfig = {
  title: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  onSave: (value: string) => void;
};

// A single staged delete, kept just long enough for the user to undo it.
export type PendingDelete = {
  kind: 'bookmark' | 'board' | 'page';
  label: string;
  // Restores this exact item back into `data` (a deep-cloned snapshot taken
  // at delete time, so undo is a pure "put it back" with no recomputation).
  restore: (data: BookmrkData) => BookmrkData;
};

export type BookmrkData = {
  version: number;
  pages: Page[];
  chromeBookmarksImported?: boolean;
  background?: {
    type: 'color' | 'image';
    // for 'color' value is a color string like '#012345'; for 'image' value is a URL or data URL
    value: string;
  } | null;
  settings?: Settings;
  // Bookmark ids shown in Zen mode, in pin order (max MAX_PINS). Ids whose
  // bookmark no longer exists are skipped at render time.
  pinnedBookmarkIds?: string[];
};
