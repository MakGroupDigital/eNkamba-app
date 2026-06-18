import type { CSSProperties } from 'react';

export type ChatWallpaper = {
  id: string;
  label: string;
  previewClass: string;
  previewStyle?: CSSProperties;
  backgroundImage: string;
};

export const CUSTOM_CHAT_WALLPAPER_PREFIX = 'custom:';
export const DEFAULT_CHAT_WALLPAPER_ID = 'chatfond1';

export function createCustomChatWallpaperId(imageUrl: string) {
  return `${CUSTOM_CHAT_WALLPAPER_PREFIX}${imageUrl}`;
}

export function isCustomChatWallpaper(wallpaperId?: string | null) {
  return Boolean(wallpaperId?.startsWith(CUSTOM_CHAT_WALLPAPER_PREFIX));
}

function getCustomWallpaperUrl(wallpaperId?: string | null) {
  if (!isCustomChatWallpaper(wallpaperId)) return '';
  return String(wallpaperId).slice(CUSTOM_CHAT_WALLPAPER_PREFIX.length);
}

function imageBackground(url: string, overlayOpacity = 0.66) {
  const cssUrl = `url(${JSON.stringify(url)})`;
  return `linear-gradient(rgba(255,255,255,${overlayOpacity}), rgba(255,255,255,${overlayOpacity})), ${cssUrl}`;
}

export const CHAT_WALLPAPERS: ChatWallpaper[] = [
  {
    id: 'chatfond1',
    label: 'Chat eNkamba',
    previewClass: 'bg-[url("/chatfond1.jpeg")] bg-cover bg-center',
    backgroundImage: imageBackground('/chatfond1.jpeg', 0.66),
  },
  {
    id: 'fondchat',
    label: 'eNkamba',
    previewClass: 'bg-[url("/fondchat.jpeg")] bg-cover bg-center',
    backgroundImage: imageBackground('/fondchat.jpeg', 0.72),
  },
  {
    id: 'clean',
    label: 'Clair',
    previewClass: 'bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.22),transparent_42%),linear-gradient(135deg,#ffffff,#f8fafc)]',
    backgroundImage: 'radial-gradient(circle at top, rgba(50,187,120,0.16), transparent 42%), linear-gradient(135deg, #ffffff, #f8fafc)',
  },
  {
    id: 'soft-primary',
    label: 'Vert doux',
    previewClass: 'bg-[linear-gradient(135deg,rgba(50,187,120,0.22),rgba(255,255,255,0.95))]',
    backgroundImage: 'linear-gradient(135deg, rgba(50,187,120,0.18), rgba(255,255,255,0.94))',
  },
  {
    id: 'dark-primary',
    label: 'Vert nuit',
    previewClass: 'bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.42),transparent_45%),linear-gradient(135deg,#0b1710,#10231a)]',
    backgroundImage: 'radial-gradient(circle at top, rgba(50,187,120,0.32), transparent 45%), linear-gradient(135deg, #0b1710, #10231a)',
  },
];

export function getChatWallpaper(wallpaperId?: string | null) {
  const customUrl = getCustomWallpaperUrl(wallpaperId);
  if (customUrl) {
    return {
      id: wallpaperId || 'custom',
      label: 'Photo importée',
      previewClass: 'bg-cover bg-center',
      previewStyle: {
        backgroundImage: `url(${JSON.stringify(customUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
      backgroundImage: imageBackground(customUrl, 0.66),
    };
  }

  return CHAT_WALLPAPERS.find((wallpaper) => wallpaper.id === wallpaperId) || CHAT_WALLPAPERS[0];
}
