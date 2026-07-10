'use client';

import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Search, Settings2, SmilePlus, SlidersHorizontal, Sparkles, Sticker, X } from 'lucide-react';
import { ENKAMBA_KEYBOARD_ITEMS, ENKAMBA_KEYBOARD_TOTAL, type EnkambaKeyboardCategory, type EnkambaKeyboardItem } from '@/lib/enkamba-keyboard';
import { Button } from '@/components/ui/button';

type EnkambaSmartKeyboardProps = {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  onSendItem: (item: EnkambaKeyboardItem) => void;
};

const categoryLabels: Record<EnkambaKeyboardCategory, string> = {
  stickers: 'Stickers',
  icons: 'Icônes',
  enbimoji: 'eNbimoji',
};

const categoryIcons = {
  stickers: Sticker,
  icons: Sparkles,
  enbimoji: SmilePlus,
};

export function EnkambaSmartKeyboard({
  open,
  disabled,
  onClose,
  onInsertText,
  onSendItem,
}: EnkambaSmartKeyboardProps) {
  const [activeCategory, setActiveCategory] = useState<EnkambaKeyboardCategory>('stickers');
  const [query, setQuery] = useState('');
  const [compact, setCompact] = useState(true);
  const [sendDirectly, setSendDirectly] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const storedCompact = window.localStorage.getItem('enkamba-smart-keyboard-compact');
    const storedDirect = window.localStorage.getItem('enkamba-smart-keyboard-direct');
    if (storedCompact) setCompact(storedCompact === 'true');
    if (storedDirect) setSendDirectly(storedDirect === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('enkamba-smart-keyboard-compact', String(compact));
  }, [compact]);

  useEffect(() => {
    window.localStorage.setItem('enkamba-smart-keyboard-direct', String(sendDirectly));
  }, [sendDirectly]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ENKAMBA_KEYBOARD_ITEMS.filter((item) => {
      const sameCategory = item.category === activeCategory;
      if (!sameCategory) return false;
      if (!normalizedQuery) return true;
      return `${item.label} ${item.text}`.toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, query]);

  if (!open) return null;

  const handlePick = (item: EnkambaKeyboardItem) => {
    if (disabled) return;

    if (item.category === 'enbimoji' || (!sendDirectly && item.category !== 'stickers')) {
      onInsertText(`${item.symbol} ${item.label}`);
      return;
    }

    if (sendDirectly) {
      onSendItem(item);
      return;
    }

    onInsertText(`${item.symbol} ${item.text}`);
  };

  return (
    <div className="rounded-[1.25rem] border border-primary/10 bg-background/98 p-2.5 shadow-xl shadow-primary/10 backdrop-blur-xl sm:p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white shadow-sm">
            <Keyboard className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-foreground">Clavier eNkamba</p>
            <p className="truncate text-[10px] font-semibold text-muted-foreground">
              {ENKAMBA_KEYBOARD_TOTAL}+ stickers, icônes et eNbimoji
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setShowSettings((value) => !value)}
            aria-label="Réglages clavier eNkamba"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={onClose} aria-label="Fermer le clavier eNkamba">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/20 p-2 text-xs">
          <button
            type="button"
            onClick={() => setCompact((value) => !value)}
            className="flex items-center justify-between rounded-lg bg-background px-3 py-2 font-bold text-foreground"
          >
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-3.5 w-3.5" /> Compact</span>
            <span className="text-primary">{compact ? 'Oui' : 'Non'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSendDirectly((value) => !value)}
            className="flex items-center justify-between rounded-lg bg-background px-3 py-2 font-bold text-foreground"
          >
            <span>Envoi direct</span>
            <span className="text-primary">{sendDirectly ? 'Oui' : 'Non'}</span>
          </button>
        </div>
      )}

      <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-muted/30 p-1">
        {(Object.keys(categoryLabels) as EnkambaKeyboardCategory[]).map((category) => {
          const Icon = categoryIcons[category];
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[10px] font-black transition ${
                active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-background'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {categoryLabels[category]}
            </button>
          );
        })}
      </div>

      <label className="mb-2 flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher dans le clavier eNkamba"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className={`grid overflow-y-auto pr-1 ${compact ? 'max-h-[160px] grid-cols-4 gap-y-3' : 'max-h-[220px] grid-cols-4 gap-y-4'}`}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => handlePick(item)}
            className="group min-w-0 rounded-xl px-1 py-1 text-center transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={`mx-auto block leading-none ${compact ? 'text-2xl' : 'text-4xl'}`}>
              {item.symbol}
            </span>
            <span className="mt-1 block truncate text-center text-[9px] font-bold leading-tight text-foreground">
              {item.label}
            </span>
            <span className="mt-0.5 line-clamp-1 block text-center text-[8.5px] font-medium leading-tight text-muted-foreground">
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
