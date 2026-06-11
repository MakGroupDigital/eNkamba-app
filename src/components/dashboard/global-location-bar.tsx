'use client';

import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';

export function GlobalLocationBar() {
  const { location, hasStoredLocation, isLocating, error, detectLocation } = useDashboardLocation();
  const locationDetail = [location.quartier, location.ville, location.pays].filter(Boolean).join(' - ');

  return (
    <div className="relative z-[70] border-b border-primary/30 bg-primary shadow-[0_8px_24px_rgba(50,187,120,0.22)] backdrop-blur-xl">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-2 px-3 text-[11px] text-white sm:px-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/18 text-white ring-1 ring-white/25">
          <MapPin className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-white" title={location.label}>
              {location.label}
            </span>
            <span className="hidden shrink-0 rounded-full bg-white/16 px-2 py-0.5 font-medium text-white/80 sm:inline-flex">
              {hasStoredLocation ? 'Memorisee' : 'Par defaut'}
            </span>
          </div>
          {locationDetail && (
            <p className="hidden truncate text-[10px] text-white/72 sm:block">
              {locationDetail}
            </p>
          )}
        </div>

        {error && (
          <span className="hidden max-w-[220px] truncate text-[10px] font-medium text-white sm:inline" title={error}>
            {error}
          </span>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={detectLocation}
          disabled={isLocating}
          className="h-7 shrink-0 rounded-full bg-white px-3 text-[11px] font-semibold text-primary hover:bg-white/90"
        >
          {isLocating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="mr-1.5 h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{hasStoredLocation ? 'Actualiser' : 'Definir'}</span>
        </Button>
      </div>
    </div>
  );
}
