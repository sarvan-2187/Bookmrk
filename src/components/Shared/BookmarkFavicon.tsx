import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../shared/utils';

type BookmarkFaviconProps = {
  favicon?: string;
  title: string;
  url: string;
  isDark: boolean;
  isNeoBrutalistMode?: boolean;
  className?: string;
  imageClassName?: string;
};

function getFallbackLetter(title: string, url: string): string {
  const source = title.trim() || (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  const letter = source.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getBackgroundColor(seed: string, isDark: boolean): string {
  const darkPalette = ['#1d4ed8', '#0f766e', '#7c3aed', '#b91c1c', '#c2410c', '#065f46', '#4338ca', '#a21caf'];
  const lightPalette = ['#bfdbfe', '#a7f3d0', '#ddd6fe', '#fecaca', '#fed7aa', '#99f6e4', '#c7d2fe', '#fbcfe8'];
  const palette = isDark ? darkPalette : lightPalette;
  return palette[hashString(seed) % palette.length];
}

export function BookmarkFavicon({
  favicon,
  title,
  url,
  isDark,
  isNeoBrutalistMode = false,
  className,
  imageClassName,
}: BookmarkFaviconProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [favicon]);

  const fallbackLetter = useMemo(() => getFallbackLetter(title, url), [title, url]);
  const backgroundColor = useMemo(() => getBackgroundColor(title || url, isDark), [isDark, title, url]);

  if (favicon?.trim() && !imageError) {
    return (
      <img
        src={favicon}
        alt=""
        className={cn('h-4 w-4 object-contain', imageClassName)}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold uppercase leading-none',
        isNeoBrutalistMode ? 'border-2 border-black bg-white text-black' : 'border border-transparent',
        className
      )}
      style={isNeoBrutalistMode ? undefined : { backgroundColor, color: isDark ? '#ffffff' : '#111827' }}
      aria-hidden="true"
    >
      {fallbackLetter}
    </span>
  );
}
