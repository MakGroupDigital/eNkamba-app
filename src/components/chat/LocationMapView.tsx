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
          <h1 className="font-headline text-lg font-bold text-white">Localisation</h1>
          <p className="text-xs text-white/70">
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

      {/* Actions Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-green-700 hover:from-primary/90 hover:to-green-700/90 text-white"
            onClick={onGetDirections}
          >
            <Navigation className="h-4 w-4" />
            Itinéraire
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 bg-gradient-to-br from-primary/10 to-green-50 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={senderPhoto} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {senderName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{senderName}</p>
                <p className="text-xs text-gray-600">Expéditeur</p>
              </div>
            </div>
          </Card>

          {receiverName && (
            <Card className="p-3 bg-gradient-to-br from-primary/10 to-green-50 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={receiverPhoto} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {receiverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{receiverName}</p>
                  <p className="text-xs text-gray-600">Destinataire</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
