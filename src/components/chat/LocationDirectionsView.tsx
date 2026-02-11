'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Navigation, RotateCcw, Clock, MapPin, AlertCircle } from 'lucide-react';

interface LocationDirectionsViewProps {
  senderLatitude: number;
  senderLongitude: number;
  senderName: string;
  senderPhoto?: string;
  receiverLatitude: number;
  receiverLongitude: number;
  receiverName: string;
  receiverPhoto?: string;
  onBack: () => void;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export function LocationDirectionsView({
  senderLatitude,
  senderLongitude,
  senderName,
  senderPhoto,
  receiverLatitude,
  receiverLongitude,
  receiverName,
  receiverPhoto,
  onBack,
}: LocationDirectionsViewProps) {
  const [route, setRoute] = useState<any>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        setError(null);

        // Utiliser OSRM (Open Source Routing Machine) - API gratuite
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${senderLongitude},${senderLatitude};${receiverLongitude},${receiverLatitude}?overview=full&steps=true&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error('Impossible de calculer l\'itinéraire');
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const mainRoute = data.routes[0];
          setRoute(mainRoute);

          // Extraire les étapes
          const routeSteps: RouteStep[] = [];
          mainRoute.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              routeSteps.push({
                instruction: step.maneuver?.instruction || 'Continuer',
                distance: step.distance,
                duration: step.duration,
              });
            });
          });

          setSteps(routeSteps);
          setTotalDistance(mainRoute.distance / 1000); // Convertir en km
          setTotalDuration(mainRoute.duration / 60); // Convertir en minutes
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du calcul de l\'itinéraire');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [senderLatitude, senderLongitude, receiverLatitude, receiverLongitude]);

  const routeCoordinates = route?.geometry?.coordinates?.map((coord: [number, number]) => [
    coord[1],
    coord[0],
  ]) || [];

  const centerLat = (senderLatitude + receiverLatitude) / 2;
  const centerLon = (senderLongitude + receiverLongitude) / 2;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-gradient-to-r from-primary via-primary to-green-800 px-4 py-3 shadow-lg">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={onBack}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="font-headline text-lg font-bold text-white">Itinéraire</h1>
          {!loading && !error && (
            <p className="text-xs text-white/70">
              {totalDistance.toFixed(1)} km • {Math.round(totalDuration)} min
            </p>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Calcul de l\'itinéraire...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 max-w-sm mx-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Erreur</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(centerLon - 0.02).toFixed(6)},${(centerLat - 0.02).toFixed(6)},${(centerLon + 0.02).toFixed(6)},${(centerLat + 0.02).toFixed(6)}&layer=mapnik&marker=${senderLatitude},${senderLongitude}`}
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* Steps Panel */}
      {!loading && !error && (
        <div className="max-h-48 overflow-y-auto bg-white border-t border-gray-200">
          <div className="p-4 space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 bg-gradient-to-br from-primary/10 to-green-50 border-primary/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="font-semibold text-sm text-gray-900">
                      {totalDistance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-primary/10 to-green-50 border-primary/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-gray-600">Durée</p>
                    <p className="font-semibold text-sm text-gray-900">
                      {Math.round(totalDuration)} min
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Étapes</p>
              {steps.slice(0, 5).map((step, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">{step.instruction}</p>
                    <p className="text-xs text-gray-600">
                      {(step.distance / 1000).toFixed(2)} km
                    </p>
                  </div>
                </div>
              ))}
              {steps.length > 5 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  +{steps.length - 5} étapes supplémentaires
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {!loading && !error && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            variant="outline"
            className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4" />
            Recalculer
          </Button>
        </div>
      )}
    </div>
  );
}
