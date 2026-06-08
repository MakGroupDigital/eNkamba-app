'use client';

export type DashboardLocation = {
  quartier?: string;
  ville?: string;
  region?: string;
  pays?: string;
  label: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt?: number;
  source?: 'device' | 'stored' | 'default';
};

export const DASHBOARD_LOCATION_STORAGE_KEY = 'enkamba-dashboard-location';
export const DASHBOARD_LOCATION_EVENT = 'enkamba-dashboard-location-change';

export const DEFAULT_DASHBOARD_LOCATION: DashboardLocation = {
  quartier: 'Gombe',
  ville: 'Kinshasa',
  region: 'Kinshasa',
  pays: 'RDC',
  label: 'Kinshasa, RDC',
  latitude: -4.325,
  longitude: 15.3222,
  source: 'default',
};

export function readDashboardLocation(): DashboardLocation | null {
  if (typeof window === 'undefined') return null;

  const storedLocation = window.localStorage.getItem(DASHBOARD_LOCATION_STORAGE_KEY);
  if (!storedLocation) return null;

  try {
    const parsedLocation = JSON.parse(storedLocation) as DashboardLocation;
    if (typeof parsedLocation.latitude !== 'number' || typeof parsedLocation.longitude !== 'number') {
      throw new Error('Invalid dashboard location');
    }

    return parsedLocation;
  } catch {
    window.localStorage.removeItem(DASHBOARD_LOCATION_STORAGE_KEY);
    return null;
  }
}

export function writeDashboardLocation(location: DashboardLocation) {
  if (typeof window === 'undefined') return;

  const nextLocation: DashboardLocation = {
    ...location,
    updatedAt: location.updatedAt || Date.now(),
  };

  window.localStorage.setItem(DASHBOARD_LOCATION_STORAGE_KEY, JSON.stringify(nextLocation));
  window.dispatchEvent(new CustomEvent(DASHBOARD_LOCATION_EVENT, { detail: nextLocation }));
}

export function getDashboardLocationOrDefault() {
  return readDashboardLocation() || DEFAULT_DASHBOARD_LOCATION;
}

export function toGeoPoint(location: DashboardLocation) {
  return {
    lat: location.latitude,
    lon: location.longitude,
  };
}
