'use client';

import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';

export function GlobalLocationBar() {
  const { location, hasStoredLocation, isLocating, error, detectLocation } = useDashboardLocation();
  const locationDetail = [location.quartier, location.ville, location.pays].filter(Boolean).join(' - ');

  return (
    <div className="relative z-[70] border-b border-slate-200/70 bg-white/82 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-2 px-3 text-[11px] text-slate-700 dark:text-slate-200 sm:px-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20 dark:text-primary">
          <MapPin className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-slate-950 dark:text-white" title={location.label}>
              {location.label}
            </span>
            <span className="hidden shrink-0 rounded-full bg-slate-900/5 px-2 py-0.5 font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300 sm:inline-flex">
              {hasStoredLocation ? 'Memorisee' : 'Par defaut'}
            </span>
          </div>
          {locationDetail && (
            <p className="hidden truncate text-[10px] text-slate-500 dark:text-slate-400 sm:block">
              {locationDetail}
            </p>
          )}
        </div>

        {error && (
          <span className="hidden max-w-[220px] truncate text-[10px] font-medium text-red-600 sm:inline" title={error}>
            {error}
          </span>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={detectLocation}
          disabled={isLocating}
          className="h-7 shrink-0 rounded-full bg-slate-950 px-3 text-[11px] font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {isLocating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="mr-1.5 h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{hasStoredLocation ? 'Actualiser' : 'Definir'}</span>
        </Button>
      </div>
    </div>
  );
}
