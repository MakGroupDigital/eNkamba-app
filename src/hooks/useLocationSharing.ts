import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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
        if (!navigator.geolocation) {
          throw new Error('La géolocalisation n\'est pas supportée par votre navigateur');
        }

        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude, accuracy } = position.coords;

              try {
                // Essayer de récupérer l'adresse via Nominatim (API gratuite d'OpenStreetMap)
                const address = await reverseGeocode(latitude, longitude);

                resolve({
                  latitude,
                  longitude,
                  address,
                  accuracy,
                });
              } catch (err) {
                // Si la géocodage inverse échoue, retourner juste les coordonnées
                resolve({
                  latitude,
                  longitude,
                  accuracy,
                });
              }
            },
            (err) => {
              let errorMessage = 'Erreur lors de la récupération de la localisation';

              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Permission de localisation refusée. Veuillez autoriser l\'accès à votre localisation.';
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Localisation indisponible. Vérifiez votre connexion GPS.';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Délai d\'attente dépassé pour la localisation.';
                  break;
              }

              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });
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

// Fonction pour obtenir l'adresse à partir des coordonnées (géocodage inverse)
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept-Language': 'fr',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'adresse');
    }

    const data = await response.json();
    return data.address?.road || data.address?.city || data.display_name;
  } catch (error) {
    console.error('Erreur géocodage inverse:', error);
    return undefined;
  }
}
