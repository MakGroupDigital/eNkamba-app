'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// ENK-010: full-screen profile photo with zoom and a clear close action. No download link is offered.
export function PhotoViewer({ src, alt, open, onClose }: { src: string; alt: string; open: boolean; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoomed(false);
    setFailed(false);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{alt}</p>
        <button type="button" onClick={() => setZoomed((value) => !value)} disabled={failed} aria-label={zoomed ? 'Réduire' : 'Agrandir'} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40">
          {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className={cn('flex min-h-0 flex-1 items-center justify-center p-4', zoomed && 'overflow-auto')}>
        {failed ? (
          <p className="text-sm text-white/70">Photo indisponible.</p>
        ) : (
          <img
            src={src}
            alt={alt}
            onClick={(event) => { event.stopPropagation(); setZoomed((value) => !value); }}
            onError={() => setFailed(true)}
            onContextMenu={(event) => event.preventDefault()}
            draggable={false}
            className={cn('select-none rounded-2xl transition-transform duration-200', zoomed ? 'max-w-none scale-150 cursor-zoom-out' : 'max-h-full max-w-full object-contain cursor-zoom-in')}
          />
        )}
      </div>
    </div>
  );
}
