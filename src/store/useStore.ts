import { create } from 'zustand';
import { Board, Bookmark, BookmrkData, Page, Settings } from '../shared/types';
import { StorageAdapter } from '../storage/local';
import { generateId } from '../shared/utils';

interface AppState {
  data: BookmrkData | null;
  isLoading: boolean;
  activeSidebar: boolean;
  activePageId: string | null;
  blurMode: boolean;
  // Temporary unblur preview state
  tempUnblurBookmarkId?: string | null;
  tempUnblurRect?: { left: number; top: number; width: number; height: number } | null;
  quickSaveOpen: boolean;
  dragMode: boolean;
  toasts: { id: string; message: string; type?: 'info' | 'success' | 'error' }[];
  settingsModalOpen: boolean;
  backgroundModalOpen: boolean;
  // Actions
  initialize: () => Promise<void>;
  setActivePage: (pageId: string) => void;
  toggleBlurMode: () => void;
  setBlurMode: (on: boolean) => void;
  toggleSidebar: () => void;
  toggleDragMode: () => void;
  openQuickSave: () => void;
  closeQuickSave: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  // Background customization
  setBackground: (bg: { type: 'color' | 'image'; value: string } | null) => void;
  clearBackground: () => void;
  setBackgroundModalOpen: (open: boolean) => void;
  // Settings management
  updateSettings: (settings: Partial<Settings>) => void;
  // Toasts
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;

  // Mutations
  addPage: (name: string) => void;
  updatePage: (id: string, name: string) => void;
  deletePage: (id: string) => void;

  addBoard: (pageId: string, name: string) => void;
  addBoardAt: (pageId: string, name: string, columnIndex: number) => void;
  updateBoard: (pageId: string, boardId: string, name: string, accentColor?: string) => void;
  deleteBoard: (pageId: string, boardId: string) => void;
  moveBoardToColumn: (pageId: string, boardId: string, columnIndex: number, insertIndex?: number) => void;

  addBookmark: (pageId: string, boardId: string, url: string, title: string, description?: string) => void;
  updateBookmark: (pageId: string, boardId: string, bookmarkId: string, title: string, url: string, description?: string) => void;
  deleteBookmark: (pageId: string, boardId: string, bookmarkId: string) => void;
  moveBookmark: (
    sourcePageId: string, sourceBoardId: string,
    destPageId: string, destBoardId: string,
    bookmarkId: string, newIndex: number
  ) => void;

  exportData: () => void;
  importData: (file: File) => Promise<void>;
  importChromeBookmarks: (tree: chrome.bookmarks.BookmarkTreeNode[]) => {
    pagesCreated: number;
    boardsCreated: number;
    bookmarksCreated: number;
    skipped: number;
  };
  setPageVisibleBookmarks: (pageId: string, count: number) => void;
  // Temporary unblur preview actions
  showTemporaryUnblur: (bookmarkId: string, rect: { left: number; top: number; width: number; height: number }) => void;
  clearTemporaryUnblur: () => void;
}

const DEFAULT_DATA: BookmrkData = {
  version: 1,
  chromeBookmarksImported: false,
  pages: [
    {
      id: generateId(),
      name: 'Home',
      order: 0,
      boards: [
        {
          id: generateId(),
          name: 'To Read',
          order: 0,
          columnIndex: 0,
          bookmarks: []
        },
        {
          id: generateId(),
          name: 'Reference',
          order: 1,
          columnIndex: 1,
          bookmarks: []
        }
      ],
      visibleBookmarksPerBoard: 6
    }
  ],
  settings: {
    openLinksInNewTab: false,
    showBookmarkDescriptions: true,
    compactMode: false,
    themeMode: 'discord'
  }
};

function cloneData(source: BookmrkData): BookmrkData {
  return {
    version: source.version,
    chromeBookmarksImported: source.chromeBookmarksImported ?? false,
    background: source.background ?? null,
    settings: source.settings ? { ...source.settings } : undefined,
    pages: source.pages.map((page) => ({
      ...page,
      boards: page.boards.map((board) => ({
        ...board,
        bookmarks: board.bookmarks.map((bookmark) => ({
          ...bookmark,
          tags: bookmark.tags ? [...bookmark.tags] : undefined,
        })),
      })),
    })),
  };
}

function sanitizeTitle(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizeChromeUrl(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).toString();
  } catch {
    return url;
  }
}

const BOARD_COLUMN_COUNT = 4;

function rebuildBoardsFromColumns(columns: Board[][]): Board[] {
  return columns.flatMap((columnBoards, columnIndex) =>
    columnBoards.map((board, order) => ({
      ...board,
      columnIndex,
      order,
    }))
  );
}

function normalizeBoardColumns(boards: Board[]): Board[] {
  const columns = Array.from({ length: BOARD_COLUMN_COUNT }, () => [] as Board[]);
  const hasColumnIndices = boards.some((board) => typeof board.columnIndex === 'number');

  if (!hasColumnIndices) {
    boards.forEach((board, index) => {
      const columnIndex = index % BOARD_COLUMN_COUNT;
      const order = Math.floor(index / BOARD_COLUMN_COUNT);
      columns[columnIndex].push({ ...board, columnIndex, order });
    });
    return rebuildBoardsFromColumns(columns);
  }

  boards.forEach((board, index) => {
    const columnIndex = Math.max(0, Math.min(BOARD_COLUMN_COUNT - 1, board.columnIndex ?? (index % BOARD_COLUMN_COUNT)));
    columns[columnIndex].push({ ...board, columnIndex, order: board.order ?? 0 });
  });

  return rebuildBoardsFromColumns(
    columns.map((columnBoards) =>
      columnBoards
        .slice()
        .sort((left, right) => left.order - right.order)
    )
  );
}

let storageSyncAttached = false;

export const useStore = create<AppState>((set, get) => ({
  data: null,
  isLoading: true,
  activeSidebar: true,
  activePageId: null,
  blurMode: false,
  tempUnblurBookmarkId: null,
  tempUnblurRect: null,
  quickSaveOpen: false,
  dragMode: false,
  toasts: [],
  settingsModalOpen: false,
  // UI state


  initialize: async () => {
    try {
      const data = await StorageAdapter.load();
      if (data) {
        const normalizedData = {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            boards: normalizeBoardColumns(page.boards),
          })),
        };
        set({ data: normalizedData, isLoading: false, activePageId: normalizedData.pages[0]?.id || null });
        StorageAdapter.save(normalizedData);
      } else {
        await StorageAdapter.save(DEFAULT_DATA);
        set({ data: DEFAULT_DATA, isLoading: false, activePageId: DEFAULT_DATA.pages[0].id });
      }

      if (!storageSyncAttached && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        storageSyncAttached = true;
        chrome.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== 'local' || !changes.bookmrk_data) return;

          StorageAdapter.load()
            .then((latestData) => {
              if (!latestData) return;

              const currentActivePageId = get().activePageId;
              const nextActivePageId = latestData.pages.some((page) => page.id === currentActivePageId)
                ? currentActivePageId
                : latestData.pages[0]?.id || null;

              const normalizedLatestData = {
                ...latestData,
                pages: latestData.pages.map((page) => ({
                  ...page,
                  boards: normalizeBoardColumns(page.boards),
                })),
              };

              set({
                data: normalizedLatestData,
                isLoading: false,
                activePageId: nextActivePageId
              });
            })
            .catch((error) => {
              console.error('Failed to sync storage changes', error);
            });
        });
      }
    } catch (error) {
      console.error('Failed to load storage', error);
      set({ data: DEFAULT_DATA, isLoading: false, activePageId: DEFAULT_DATA.pages[0].id });
    }
  },

  setActivePage: (pageId) => set({ activePageId: pageId }),

  toggleBlurMode: () => set((state) => ({ blurMode: !state.blurMode })),
  setBlurMode: (on: boolean) => set({ blurMode: on }),
  toggleSidebar: () => set((state) => ({ activeSidebar: !state.activeSidebar })),
  toggleDragMode: () => set((state) => ({ dragMode: !state.dragMode })),
  openQuickSave: () => set({ quickSaveOpen: true }),
  closeQuickSave: () => set({ quickSaveOpen: false }),
  openSettingsModal: () => set({ settingsModalOpen: true }),
  closeSettingsModal: () => set({ settingsModalOpen: false }),

  setBackground: (bg) => {
    const { data } = get();
    if (!data) return;
    const newData = { ...data, background: bg };
    set({ data: newData });
    StorageAdapter.save(newData);
  },
  clearBackground: () => {
    const { data } = get();
    if (!data) return;
    const newData = { ...data, background: null };
    set({ data: newData });
    StorageAdapter.save(newData);
  },
  updateSettings: (settings) => {
    const { data } = get();
    if (!data) return;
    const newData = {
      ...data,
      settings: {
        ...data.settings,
        ...settings
      }
    };
    set({ data: newData });
    StorageAdapter.save(newData);
  },
  addToast: (message, type = 'info') => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // auto remove after 4s
    setTimeout(() => {
      const exists = get().toasts.find(t => t.id === id);
      if (exists) get().removeToast(id);
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  // Background modal control
  backgroundModalOpen: false,
  setBackgroundModalOpen: (open: boolean) => set({ backgroundModalOpen: open }),

  // Temporary unblur preview implementation
  showTemporaryUnblur: (bookmarkId, rect) => {
    // Persist the unblur state until explicitly cleared (e.g., on mouse leave)
    set({ tempUnblurBookmarkId: bookmarkId, tempUnblurRect: rect });
  },

  clearTemporaryUnblur: () => {
    try {
      const existing = (window as any).__bookmrk_temp_unblur_timer;
      if (existing) {
        clearTimeout(existing);
        (window as any).__bookmrk_temp_unblur_timer = null;
      }
    } catch (e) {
      // ignore
    }
    set({ tempUnblurBookmarkId: null, tempUnblurRect: null });
  },

  addPage: (name) => {
    const { data } = get();
    if (!data) return;

    const newPage: Page = {
      id: generateId(),
      name,
      order: data.pages.length,
      boards: [],
      visibleBookmarksPerBoard: 6
    };

    const newData = { ...data, pages: [...data.pages, newPage] };
    set({ data: newData });
    StorageAdapter.save(newData);
  },

  updatePage: (id, name) => {
    const { data } = get();
    if (!data) return;

    const newData = {
      ...data,
      pages: data.pages.map(p => p.id === id ? { ...p, name } : p)
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  deletePage: (id) => {
    const { data, activePageId } = get();
    if (!data) return;

    const newData = {
      ...data,
      pages: data.pages.filter(p => p.id !== id)
    };

    let nextActiveId = activePageId;
    if (activePageId === id) {
      nextActiveId = newData.pages.length > 0 ? newData.pages[0].id : null;
    }

    set({ data: newData, activePageId: nextActiveId });
    StorageAdapter.save(newData);
  },

  addBoard: (pageId, name) => {
    get().addBoardAt(pageId, name, 0);
  },

  addBoardAt: (pageId, name, columnIndex) => {
    const { data } = get();
    if (!data) return;

    const pageIndex = data.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const page = { ...data.pages[pageIndex], boards: normalizeBoardColumns(data.pages[pageIndex].boards) };
    const targetColumn = Math.max(0, Math.min(BOARD_COLUMN_COUNT - 1, columnIndex));
    const columns = Array.from({ length: BOARD_COLUMN_COUNT }, () => [] as Board[]);
    page.boards.forEach((board) => {
      columns[Math.max(0, Math.min(BOARD_COLUMN_COUNT - 1, board.columnIndex ?? 0))].push(board);
    });

    const newBoard: Board = {
      id: generateId(),
      name,
      order: columns[targetColumn].length,
      columnIndex: targetColumn,
      bookmarks: []
    };

    columns[targetColumn].push(newBoard);
    page.boards = rebuildBoardsFromColumns(columns.map((columnBoards) => columnBoards.slice().sort((left, right) => left.order - right.order)));

    const newData = { ...data, pages: [...data.pages] };
    newData.pages[pageIndex] = page;

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  updateBoard: (pageId, boardId, name, accentColor) => {
    const { data } = get();
    if (!data) return;

    const newData = {
      ...data,
      pages: data.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          boards: p.boards.map(b =>
            b.id === boardId ? { ...b, name, accentColor: accentColor !== undefined ? accentColor : b.accentColor } : b
          )
        };
      })
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  deleteBoard: (pageId, boardId) => {
    const { data } = get();
    if (!data) return;

    // Determine if the board being deleted is the special Imported Bookmarks board
    const page = data.pages.find(p => p.id === pageId);
    const boardToDelete = page?.boards.find(b => b.id === boardId);

    const newData = {
      ...data,
      pages: data.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          boards: normalizeBoardColumns(p.boards.filter(b => b.id !== boardId))
        };
      })
    };

    // If the removed board was the imported bookmarks board, clear the chrome import flag
    if (boardToDelete && boardToDelete.name === 'Imported') {
      newData.chromeBookmarksImported = false;
    }

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  moveBoardToColumn: (pageId, boardId, columnIndex, insertIndex) => {
    const { data } = get();
    if (!data) return;

    const newData = { ...data, pages: [...data.pages] };
    const pageIndex = newData.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const page = { ...newData.pages[pageIndex], boards: normalizeBoardColumns(newData.pages[pageIndex].boards) };
    const columns = Array.from({ length: BOARD_COLUMN_COUNT }, () => [] as Board[]);
    let movedBoard: Board | undefined;

    page.boards.forEach((board) => {
      const targetColumn = Math.max(0, Math.min(BOARD_COLUMN_COUNT - 1, board.columnIndex ?? 0));
      if (board.id === boardId) {
        movedBoard = { ...board };
        return;
      }
      columns[targetColumn].push({ ...board, columnIndex: targetColumn });
    });

    if (!movedBoard) return;

    const targetColumn = Math.max(0, Math.min(BOARD_COLUMN_COUNT - 1, columnIndex));
    
    // Determine insertion position
    let finalInsertIndex = columns[targetColumn].length; // Default: append to end
    if (typeof insertIndex === 'number' && insertIndex >= 0) {
      // Clamp insertIndex to valid range [0, columnLength]
      finalInsertIndex = Math.min(insertIndex, columns[targetColumn].length);
    }
    
    movedBoard = { ...movedBoard, columnIndex: targetColumn, order: finalInsertIndex };
    columns[targetColumn].splice(finalInsertIndex, 0, movedBoard);

    page.boards = rebuildBoardsFromColumns(columns.map((columnBoards) => columnBoards.slice().sort((left, right) => left.order - right.order)));

    newData.pages[pageIndex] = page;
    set({ data: newData });
    StorageAdapter.save(newData);
  },

  addBookmark: (pageId, boardId, url, title, description) => {
    const { data } = get();
    if (!data) return;

    const newUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const favicon = `https://www.google.com/s2/favicons?domain=${newUrl.hostname}&sz=64`;

    const newBookmark: Bookmark = {
      id: generateId(),
      url: newUrl.toString(),
      title: title || newUrl.hostname,
      description: description?.trim() || undefined,
      note: description?.trim() || undefined,
      favicon,
      addedAt: Date.now()
    };

    const newData = {
      ...data,
      pages: data.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          boards: p.boards.map(b => {
            if (b.id !== boardId) return b;
            return {
              ...b,
              bookmarks: [newBookmark, ...b.bookmarks] // Add to top
            };
          })
        };
      })
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  updateBookmark: (pageId, boardId, bookmarkId, title, url, description) => {
    // implementation left simple
    const { data } = get();
    if (!data) return;

    const newUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const favicon = `https://www.google.com/s2/favicons?domain=${newUrl.hostname}&sz=64`;

    const newData = {
      ...data,
      pages: data.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          boards: p.boards.map(b => {
            if (b.id !== boardId) return b;
            return {
              ...b,
              bookmarks: b.bookmarks.map(bm => {
                if (bm.id !== bookmarkId) return bm;
                const nextDescription = description?.trim() || undefined;
                return { ...bm, title, url: newUrl.toString(), favicon, description: nextDescription, note: nextDescription };
              })
            };
          })
        };
      })
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  deleteBookmark: (pageId, boardId, bookmarkId) => {
    const { data } = get();
    if (!data) return;

    const newData = {
      ...data,
      pages: data.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          boards: p.boards.map(b => {
            if (b.id !== boardId) return b;
            return {
              ...b,
              bookmarks: b.bookmarks.filter(bm => bm.id !== bookmarkId)
            };
          })
        };
      })
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  moveBookmark: (sourcePageId, sourceBoardId, destPageId, destBoardId, bookmarkId, newIndex) => {
    const { data } = get();
    if (!data) return;

    const newData = { ...data, pages: [...data.pages] };

    const sourcePageIndex = newData.pages.findIndex(p => p.id === sourcePageId);
    const destPageIndex = newData.pages.findIndex(p => p.id === destPageId);
    if (sourcePageIndex === -1 || destPageIndex === -1) return;

    const sourcePage = { ...newData.pages[sourcePageIndex], boards: [...newData.pages[sourcePageIndex].boards] };
    const destPage = sourcePageId === destPageId ? sourcePage : { ...newData.pages[destPageIndex], boards: [...newData.pages[destPageIndex].boards] };

    const sourceBoardIndex = sourcePage.boards.findIndex(b => b.id === sourceBoardId);
    const destBoardIndex = destPage.boards.findIndex(b => b.id === destBoardId);
    if (sourceBoardIndex === -1 || destBoardIndex === -1) return;

    const sourceBoard = { ...sourcePage.boards[sourceBoardIndex], bookmarks: [...sourcePage.boards[sourceBoardIndex].bookmarks] };
    const destBoard = sourceBoardId === destBoardId ? sourceBoard : { ...destPage.boards[destBoardIndex], bookmarks: [...destPage.boards[destBoardIndex].bookmarks] };

    const bookmarkIndex = sourceBoard.bookmarks.findIndex(bm => bm.id === bookmarkId);
    if (bookmarkIndex === -1) return;

    const [movedBookmark] = sourceBoard.bookmarks.splice(bookmarkIndex, 1);

    // Safety check for newIndex bounds
    const safeIndex = Math.max(0, Math.min(newIndex, destBoard.bookmarks.length));
    destBoard.bookmarks.splice(safeIndex, 0, movedBookmark);

    sourcePage.boards[sourceBoardIndex] = sourceBoard;
    if (sourcePageId !== destPageId) {
      destPage.boards[destBoardIndex] = destBoard;
      newData.pages[destPageIndex] = destPage;
    } else if (sourceBoardId !== destBoardId) {
      sourcePage.boards[destBoardIndex] = destBoard;
    }

    newData.pages[sourcePageIndex] = sourcePage;

    set({ data: newData });
    StorageAdapter.save(newData);
  },

  exportData: () => {
    const { data } = get();
    if (data) {
      StorageAdapter.exportJSON(data);
    }
  },

  importData: async (file: File) => {
    try {
      const parsedData = await StorageAdapter.importJSON(file);
      const normalizedData: BookmrkData = {
        ...parsedData,
        chromeBookmarksImported: parsedData.chromeBookmarksImported ?? false,
        background: parsedData.background ?? null,
        pages: parsedData.pages.map((page) => ({
          ...page,
          boards: normalizeBoardColumns(page.boards),
        })),
      };
      set({ data: normalizedData, activePageId: normalizedData.pages[0]?.id || null });
      StorageAdapter.save(normalizedData);
    } catch (err) {
      console.error(err);
      alert('Failed to import data: ' + (err as Error).message);
    }
  },

  importChromeBookmarks: (tree) => {
    const currentData = get().data ? cloneData(get().data as BookmrkData) : cloneData(DEFAULT_DATA);
    const summary = {
      pagesCreated: 0,
      boardsCreated: 0,
      bookmarksCreated: 0,
      skipped: 0,
    };

    let targetPage = currentData.pages.find((page) => page.id === get().activePageId) || currentData.pages[0];
    if (!targetPage) {
      targetPage = {
        id: generateId(),
        name: 'Home',
        order: 0,
        boards: [],
      };
      currentData.pages.push(targetPage);
      summary.pagesCreated += 1;
    }

    let importedBoard = targetPage.boards.find((board) => board.name === 'Imported');
    if (!importedBoard) {
      importedBoard = {
        id: generateId(),
        name: 'Imported',
        order: targetPage.boards.length,
        columnIndex: 0,
        bookmarks: [],
      };
      targetPage.boards.push(importedBoard);
      summary.boardsCreated += 1;
    }

    const addBookmark = (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (!node.url) return;

      const normalizedUrl = normalizeChromeUrl(node.url);
      const newUrl = new URL(normalizedUrl);
      const favicon = `https://www.google.com/s2/favicons?domain=${newUrl.hostname}&sz=64`;

      importedBoard.bookmarks.push({
        id: generateId(),
        url: normalizedUrl,
        title: node.title || newUrl.hostname,
        favicon,
        addedAt: Date.now(),
      });

      summary.bookmarksCreated += 1;
    };

    const walkFolder = (page: Page, folderPath: string[], node: chrome.bookmarks.BookmarkTreeNode) => {
      if (node.url) {
        addBookmark(node);
        return;
      }

      const nextFolderPath = node.title ? [...folderPath, node.title.trim()] : folderPath;
      if (!node.children?.length) return;

      for (const child of node.children) {
        walkFolder(page, nextFolderPath, child);
      }
    };

    for (const rootNode of tree.flatMap((node) => node.children ?? [])) {
      if (rootNode.url) {
        addBookmark(rootNode);
        continue;
      }

      if (!rootNode.children?.length) continue;

      for (const child of rootNode.children) {
        walkFolder(targetPage, [], child);
      }
    }

    const nextActivePageId = currentData.pages.some((page) => page.id === get().activePageId)
      ? get().activePageId
      : targetPage.id;

    currentData.chromeBookmarksImported = true;
    currentData.pages = currentData.pages.map((page) => ({
      ...page,
      boards: normalizeBoardColumns(page.boards),
    }));

    set({ data: currentData, activePageId: nextActivePageId });
    StorageAdapter.save(currentData);

    return summary;
  }

  ,
  setPageVisibleBookmarks: (pageId, count) => {
    const { data } = get();
    if (!data) return;

    const newData = {
      ...data,
      pages: data.pages.map(p => p.id === pageId ? { ...p, visibleBookmarksPerBoard: count } : p)
    };

    set({ data: newData });
    StorageAdapter.save(newData);
  }

}));
