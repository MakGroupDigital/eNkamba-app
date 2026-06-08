'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DASHBOARD_LOCATION_EVENT,
  DEFAULT_DASHBOARD_LOCATION,
  type DashboardLocation,
  getDashboardLocationOrDefault,
  readDashboardLocation,
  writeDashboardLocation,
} from '@/lib/dashboard-location';

export function useDashboardLocation() {
  const [location, setLocation] = useState<DashboardLocation>(DEFAULT_DASHBOARD_LOCATION);
  const [hasStoredLocation, setHasStoredLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  const syncLocation = useCallback(() => {
    const storedLocation = readDashboardLocation();
    setHasStoredLocation(Boolean(storedLocation));
    setLocation(storedLocation || DEFAULT_DASHBOARD_LOCATION);
  }, []);

  useEffect(() => {
    syncLocation();

    const handleLocationChange = (event: Event) => {
      const customEvent = event as CustomEvent<DashboardLocation>;
      if (customEvent.detail) {
        setLocation(customEvent.detail);
        setHasStoredLocation(true);
        return;
      }

      syncLocation();
    };

    window.addEventListener(DASHBOARD_LOCATION_EVENT, handleLocationChange);
    window.addEventListener('storage', syncLocation);

    return () => {
      window.removeEventListener(DASHBOARD_LOCATION_EVENT, handleLocationChange);
      window.removeEventListener('storage', syncLocation);
    };
  }, [syncLocation]);

  const detectLocation = useCallback(() => {
    if (isLocating) return;

    if (!('geolocation' in navigator)) {
      setError('Localisation non disponible sur cet appareil');
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const response = await fetch(`/api/geo/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || 'Impossible de lire votre position');
          }

          writeDashboardLocation({
            ...data,
            latitude,
            longitude,
            accuracy,
            source: 'device',
            updatedAt: Date.now(),
          });
        } catch {
          writeDashboardLocation({
            label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
            accuracy,
            source: 'device',
            updatedAt: Date.now(),
          });
        } finally {
          setIsLocating(false);
        }
      },
      (positionError) => {
        const message = positionError.code === positionError.PERMISSION_DENIED
          ? 'Acces a la position refuse'
          : 'Impossible de recuperer votre position';
        setError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000 * 60 * 5,
      }
    );
  }, [isLocating]);

  return useMemo(
    () => ({
      location,
      hasStoredLocation,
      isLocating,
      error,
      detectLocation,
      locationOrDefault: getDashboardLocationOrDefault(),
    }),
    [detectLocation, error, hasStoredLocation, isLocating, location]
  );
}
