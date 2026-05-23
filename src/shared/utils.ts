import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookmrkData } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function isNeoBrutalistTheme(data: BookmrkData | undefined): boolean {
  return data?.settings?.themeMode === 'neobrutalist';
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
  if (data?.background?.type === 'color' && data?.background?.color) {
    return {
      backgroundColor: data.background.color
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
