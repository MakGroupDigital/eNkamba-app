'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, RotateCcw, Clock, MapPin, AlertCircle } from 'lucide-react';

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
      <div className="sticky top-0 z-10 flex items-center gap-2.5 bg-primary px-2.5 py-1.5 shadow-sm">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/20"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-black text-white">Itinéraire</h1>
          {!loading && !error && (
            <p className="text-[10px] text-white/75">
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
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-xs text-gray-600">Calcul de l'itinéraire...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <Card className="mx-4 max-w-[280px] border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Erreur</p>
                  <p className="mt-1 text-[11px] text-red-700">{error}</p>
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
        <div className="max-h-32 overflow-y-auto border-t border-gray-200 bg-white">
          <div className="space-y-1.5 p-2">
            <div className="grid grid-cols-2 gap-1.5">
              <Card className="border-primary/15 bg-primary/5 p-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-primary" />
                  <div>
                    <p className="text-[9px] text-gray-600">Distance</p>
                    <p className="text-[11px] font-bold text-gray-900">
                      {totalDistance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="border-primary/15 bg-primary/5 p-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" />
                  <div>
                    <p className="text-[9px] text-gray-600">Durée</p>
                    <p className="text-[11px] font-bold text-gray-900">
                      {Math.round(totalDuration)} min
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase text-gray-600">Étapes</p>
              {steps.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex gap-1.5 text-[11px]">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-gray-800">{step.instruction}</p>
                    <p className="text-[9px] text-gray-600">
                      {(step.distance / 1000).toFixed(2)} km
                    </p>
                  </div>
                </div>
              ))}
              {steps.length > 3 && (
                <p className="py-0.5 text-center text-[9px] text-gray-600">
                  +{steps.length - 3} étapes supplémentaires
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {!loading && !error && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-2">
          <Button
            variant="outline"
            className="h-8 w-full gap-1 border-primary text-[11px] text-primary hover:bg-primary/10"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-3 w-3" />
            Recalculer
          </Button>
        </div>
      )}
    </div>
  );
}
