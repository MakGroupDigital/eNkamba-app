import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDashboardLocationOrDefault } from '@/lib/dashboard-location';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export function useLocationSharing() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir la localisation actuelle de l'utilisateur
  const getCurrentLocation = useCallback(
    async (): Promise<LocationData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const location = getDashboardLocationOrDefault();
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.label,
          accuracy: location.accuracy,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Erreur de localisation',
          description: errorMessage,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    getCurrentLocation,
    isLoading,
    error,
  };
}
