'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address?: string;
  senderName?: string;
  timestamp?: Date;
}

export function LocationMessage({
  latitude,
  longitude,
  address,
  senderName,
  timestamp,
}: LocationMessageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const [showDirections, setShowDirections] = useState(false);

  useEffect(() => {
    // Créer l'URL de la carte OpenStreetMap
    const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15&layers=M`;
    setMapUrl(osmUrl);
  }, [latitude, longitude]);

  const handleCopyCoordinates = () => {
    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    toast({
      title: 'Coordonnées copiées ✅',
      description: coords,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMap = () => {
    window.open(mapUrl, '_blank');
  };

  const handleGetDirections = () => {
    // Ouvrir Google Maps ou Apple Maps avec les directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  };

  const handleOpenInOSM = () => {
    window.open(mapUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Localisation partagée</p>
          {senderName && <p className="text-xs opacity-90">par {senderName}</p>}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-3">
        {/* Aperçu de la carte statique */}
        <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden border-2 border-blue-200">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(longitude - 0.01).toFixed(6)},${(latitude - 0.01).toFixed(6)},${(longitude + 0.01).toFixed(6)},${(latitude + 0.01).toFixed(6)}&layer=mapnik&marker=${latitude},${longitude}`}
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Overlay avec gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Coordonnées */}
        <div className="bg-white rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-600 font-semibold">Coordonnées GPS</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 font-mono">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={handleCopyCoordinates}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Adresse si disponible */}
        {address && (
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 font-semibold mb-1">Adresse</p>
            <p className="text-sm text-gray-800">{address}</p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-blue-300 hover:bg-blue-50"
            onClick={handleOpenMap}
          >
            <MapPin className="h-4 w-4" />
            Voir la carte
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            onClick={handleGetDirections}
          >
            <Navigation className="h-4 w-4" />
            Itinéraire
          </Button>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className="text-xs text-gray-500 text-center">
            {new Date(timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </Card>
  );
}
