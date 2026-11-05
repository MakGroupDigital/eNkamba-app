import type { DashboardLocation } from '@/lib/dashboard-location';

export type LocationVisibility = 'none' | 'city' | 'district';

export type PublicPostLocation = {
  visibility: Exclude<LocationVisibility, 'none'>;
  label: string;
  quartier?: string;
  ville: string;
  pays: string;
};

export const LOCATION_VISIBILITY_OPTIONS: Array<{ value: LocationVisibility; label: string; hint: string }> = [
  { value: 'none', label: 'Ne pas afficher', hint: 'Aucun lieu visible sur la publication' },
  { value: 'city', label: 'Ville', hint: 'Exemple : Kinshasa, RDC' },
  { value: 'district', label: 'Quartier', hint: 'Exemple : Gombe, Kinshasa' },
];

// ENK-064: a public post only ever carries a coarse place the author chose (never coordinates or street).
export function buildPublicPostLocation(location: DashboardLocation, visibility: LocationVisibility): PublicPostLocation | null {
  if (visibility === 'none') return null;
  const ville = location.ville || location.region || '';
  const pays = location.pays || '';
  if (!ville && !pays) return null;

  const quartier = visibility === 'district' ? location.quartier || '' : '';
  const label = (quartier ? [quartier, ville] : [ville, pays]).filter(Boolean).join(', ');
  return { visibility, label, ...(quartier ? { quartier } : {}), ville, pays };
}

// Display rule for every post, including legacy ones that stored a precise address label:
// show only what the author opted into, otherwise at most the city.
export function publicPostLocationLabel(data: any): string {
  const location = data?.location;
  if (location && typeof location === 'object') {
    if (location.visibility === 'district' && location.quartier) return [location.quartier, location.ville].filter(Boolean).join(', ');
    return [location.ville, location.pays].filter(Boolean).join(', ');
  }
  return '';
}
