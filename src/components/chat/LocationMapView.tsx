'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Navigation, RotateCcw, MapPin } from 'lucide-react';

interface LocationMapViewProps {
  senderLatitude: number;
  senderLongitude: number;
  senderName: string;
  senderPhoto?: string;
  receiverLatitude?: number;
  receiverLongitude?: number;
  receiverName?: string;
  receiverPhoto?: string;
  onBack: () => void;
  onGetDirections: () => void;
}

export function LocationMapView({
  senderLatitude,
  senderLongitude,
  senderName,
  senderPhoto,
  receiverLatitude,
  receiverLongitude,
  receiverName,
  receiverPhoto,
  onBack,
  onGetDirections,
}: LocationMapViewProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const mapRef = useRef(null);

  // Calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  useEffect(() => {
    if (receiverLatitude && receiverLongitude) {
      const dist = calculateDistance(
        senderLatitude,
        senderLongitude,
        receiverLatitude,
        receiverLongitude
      );
      setDistance(parseFloat(dist));
    }
  }, [senderLatitude, senderLongitude, receiverLatitude, receiverLongitude]);

  const centerLat = receiverLatitude
    ? (senderLatitude + receiverLatitude) / 2
    : senderLatitude;
  const centerLon = receiverLongitude
    ? (senderLongitude + receiverLongitude) / 2
    : senderLongitude;

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
          <h1 className="text-sm font-black text-white">Localisation</h1>
          <p className="text-[10px] text-white/75">
            {distance ? `Distance: ${distance} km` : 'Chargement...'}
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
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
      </div>

      <div className="sticky bottom-0 space-y-1.5 border-t border-gray-200 bg-white p-2">
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            className="h-8 flex-1 gap-1 border-primary text-[11px] text-primary hover:bg-primary/10"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </Button>
          <Button
            className="h-8 flex-1 gap-1 bg-primary text-[11px] text-white hover:bg-primary/90"
            onClick={onGetDirections}
          >
            <Navigation className="h-3 w-3" />
            Itinéraire
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Card className="border-primary/15 bg-primary/5 p-1.5">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={senderPhoto} />
                <AvatarFallback className="bg-primary text-[10px] text-white">
                  {senderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[11px] font-semibold text-gray-800">{senderName}</p>
                <p className="text-[9px] text-gray-600">Départ</p>
              </div>
            </div>
          </Card>

          {receiverName && (
            <Card className="border-primary/15 bg-primary/5 p-1.5">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={receiverPhoto} />
                  <AvatarFallback className="bg-primary text-[10px] text-white">
                    {receiverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] font-semibold text-gray-800">{receiverName}</p>
                  <p className="text-[9px] text-gray-600">Arrivée</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
