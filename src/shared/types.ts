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

export type Settings = {
  // Behavior Settings
  openLinksInNewTab?: boolean;
  showBookmarkDescriptions?: boolean;
  // Appearance Settings
  compactMode?: boolean;
  themeMode?: 'discord' | 'simple' | 'neobrutalist' | 'neumorphism';
  fontFamily?: 'plus-jakarta-sans' | 'satoshi' | 'google-sans' | 'electrolize' | 'dm-mono' | 'jetbrains-mono' | 'comic-sans' | 'space-grotesk';
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
};
