import { BookmrkData } from '../shared/types';

const STORAGE_KEY = 'bookmrk_data';
const UI_STATE_KEY = 'bookmrk_ui_state';

type BookmrkUiState = {
  blurMode?: boolean;
};

export const isExtensionEnvironment = () => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
};

export class StorageAdapter {
  static async load(): Promise<BookmrkData | null> {
    if (isExtensionEnvironment()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          resolve(result[STORAGE_KEY] || null);
        });
      });
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
  }

  static async save(data: BookmrkData): Promise<void> {
    if (isExtensionEnvironment()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return Promise.resolve();
    }
  }

  static async loadUIState(): Promise<BookmrkUiState | null> {
    if (isExtensionEnvironment()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([UI_STATE_KEY], (result) => {
          resolve(result[UI_STATE_KEY] || null);
        });
      });
    }

    const data = localStorage.getItem(UI_STATE_KEY);
    return data ? JSON.parse(data) : null;
  }

  static async saveUIState(state: BookmrkUiState): Promise<void> {
    if (isExtensionEnvironment()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [UI_STATE_KEY]: state }, () => {
          resolve();
        });
      });
    }

    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
    return Promise.resolve();
  }

  static exportJSON(data: BookmrkData) {
    // Export everything except background settings.
    const { background, ...exportData } = data;
    
    // Add settings metadata for documentation
    const enrichedData = {
      ...exportData,
      _settingsMetadata: {
        appearance: {
          compactMode: {
            enabled: data.settings?.compactMode ?? false,
            label: 'Compact mode',
            description: 'Reduce spacing to show more bookmarks',
            details: 'Compact mode hides descriptions and reduces size to accommodate more bookmarks per board.'
          },
          themeMode: {
            enabled: data.settings?.themeMode ?? 'discord',
            label: 'Theme mode',
            description: 'Switch between Discord, Simple Mode, NeoBrutalist, and Neumorphism layouts',
            details: 'Discord keeps the current denser shell, Simple Mode uses a lighter top-tab layout, NeoBrutalist uses a white-and-black high-contrast shell, and Neumorphism uses a soft pressed-in surface style.'
          }
        },
        behavior: {
          openLinksInNewTab: {
            enabled: data.settings?.openLinksInNewTab ?? false,
            label: 'Open links in new tab',
            description: 'Open bookmarks in a new browser tab'
          },
          showBookmarkDescriptions: {
            enabled: data.settings?.showBookmarkDescriptions ?? true,
            label: 'Show bookmark descriptions',
            description: 'Display saved descriptions below bookmark titles'
          }
        }
      }
    };
    
    const jsonStr = JSON.stringify(enrichedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmrk_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async importJSON(file: File): Promise<BookmrkData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as BookmrkData;
          if (data && typeof data.version === 'number' && Array.isArray(data.pages)) {
            resolve(data);
          } else {
            reject(new Error('Invalid Bookmrk JSON format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
