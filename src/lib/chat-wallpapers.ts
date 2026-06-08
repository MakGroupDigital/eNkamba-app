export type ChatWallpaper = {
  id: string;
  label: string;
  previewClass: string;
  backgroundImage: string;
};

export const DEFAULT_CHAT_WALLPAPER_ID = 'fondchat';

export const CHAT_WALLPAPERS: ChatWallpaper[] = [
  {
    id: 'fondchat',
    label: 'eNkamba',
    previewClass: 'bg-[url("/fondchat.jpeg")] bg-cover bg-center',
    backgroundImage: "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url('/fondchat.jpeg')",
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
  return CHAT_WALLPAPERS.find((wallpaper) => wallpaper.id === wallpaperId) || CHAT_WALLPAPERS[0];
}
