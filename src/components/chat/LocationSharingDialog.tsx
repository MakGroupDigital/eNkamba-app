'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDashboardLocationOrDefault } from '@/lib/dashboard-location';

interface LocationSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
}

export function LocationSharingDialog({ open, onOpenChange, onShareLocation }: LocationSharingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const storedLocation = getDashboardLocationOrDefault();
      const location = {
        latitude: storedLocation.latitude,
        longitude: storedLocation.longitude,
        address: storedLocation.label,
      };

      setCurrentLocation(location);
      return location;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération de la position');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleShareLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      onShareLocation(location);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager ma position</DialogTitle>
          <DialogDescription>
            Partagez votre position actuelle avec vos contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentLocation && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Position actuelle</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {currentLocation.latitude.toFixed(6)}, Lon: {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleShareLocation}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Localisation en cours...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Partager ma position
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Annuler
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Votre position sera partagée uniquement avec les contacts sélectionnés
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
