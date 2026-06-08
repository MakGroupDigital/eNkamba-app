import { useState, useEffect } from 'react';
import { DASHBOARD_LOCATION_EVENT, getDashboardLocationOrDefault } from '@/lib/dashboard-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export function useLocationTracking(isActive: boolean = false) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsTracking(false);
      return;
    }

    const storedLocation = getDashboardLocationOrDefault();
    setLocation({
      latitude: storedLocation.latitude,
      longitude: storedLocation.longitude,
      accuracy: storedLocation.accuracy || 0,
      timestamp: storedLocation.updatedAt || Date.now(),
      address: storedLocation.label,
    });
    setError(null);
    setIsTracking(false);
  }, [isActive]);

  useEffect(() => {
    const syncStoredLocation = () => {
      const storedLocation = getDashboardLocationOrDefault();

      setLocation({
        latitude: storedLocation.latitude,
        longitude: storedLocation.longitude,
        accuracy: storedLocation.accuracy || 0,
        timestamp: storedLocation.updatedAt || Date.now(),
        address: storedLocation.label,
      });
      setError(null);
    };

    window.addEventListener(DASHBOARD_LOCATION_EVENT, syncStoredLocation);
    window.addEventListener('storage', syncStoredLocation);

    return () => {
      window.removeEventListener(DASHBOARD_LOCATION_EVENT, syncStoredLocation);
      window.removeEventListener('storage', syncStoredLocation);
    };
  }, []);

  return { location, error, isTracking };
}
