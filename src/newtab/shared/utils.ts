import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookmrkData, NavStyle, Settings } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function isNeoBrutalistTheme(data: BookmrkData | undefined): boolean {
  return data?.settings?.themeMode === 'neobrutalist';
}

export function isNeumorphismTheme(data: BookmrkData | undefined): boolean {
  return data?.settings?.themeMode === 'neumorphism';
}

export function getModalBackgroundStyle(data: BookmrkData | undefined, isDark: boolean): { backgroundColor: string; backdropFilter?: string } {
  // If background is an image, use glassmorphism
  if (data?.background?.type === 'image') {
    if (isNeoBrutalistTheme(data)) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      };
    }

    return {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)'
    };
  }

  // If background is a color, use that color
  if (data?.background?.type === 'color' && data?.background?.value) {
    return {
      backgroundColor: data.background.value
    };
  }

  if (isNeoBrutalistTheme(data)) {
    return {
      backgroundColor: '#ffffff'
    };
  }

  // Default: use theme color
  return {
    backgroundColor: isDark ? '#000000' : '#FFFFFF'
  };
}

// Resolves a user's colorMode preference ('system' | 'light' | 'dark') against
// the OS media query. 'system' is the only branch that needs the listener;
// 'light'/'dark' are pinned regardless of OS setting.
export function resolveIsDark(colorMode: 'system' | 'light' | 'dark' | undefined, prefersDarkOS: boolean): boolean {
  if (colorMode === 'light') return false;
  if (colorMode === 'dark') return true;
  return prefersDarkOS;
}

// Nav style is the user's own setting, but older saved data predates it — so an
// unset value falls back to the layout that theme used to imply. That keeps
// existing installs looking identical until the user opts into a layout.
export function resolveNavStyle(settings: Settings | undefined): NavStyle {
  if (settings?.navStyle) return settings.navStyle;
  return settings?.themeMode === 'discord' || settings?.themeMode === undefined ? 'sidebar' : 'tabs';
}
