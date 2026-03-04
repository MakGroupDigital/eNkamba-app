import { useState, useEffect, useCallback } from 'react';

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

  const getAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const address = await getAddress(latitude, longitude);
    
    setLocation({
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now(),
      address,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err.message);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setIsTracking(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Position initiale
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Suivi en temps réel
    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [isActive, updateLocation, handleError]);

  return { location, error, isTracking };
}
