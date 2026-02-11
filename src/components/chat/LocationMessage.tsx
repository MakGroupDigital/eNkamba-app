'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocationMapView } from './LocationMapView';
import { LocationDirectionsView } from './LocationDirectionsView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address?: string;
  senderName?: string;
  senderPhoto?: string;
  receiverName?: string;
  receiverPhoto?: string;
  receiverLatitude?: number;
  receiverLongitude?: number;
  timestamp?: Date;
}

export function LocationMessage({
  latitude,
  longitude,
  address,
  senderName,
  senderPhoto,
  receiverName,
  receiverPhoto,
  receiverLatitude,
  receiverLongitude,
  timestamp,
}: LocationMessageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

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
    setShowMap(true);
  };

  const handleGetDirections = () => {
    if (receiverLatitude && receiverLongitude) {
      setShowDirections(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Localisation du destinataire non disponible',
      });
    }
  };

  if (showMap) {
    return (
      <LocationMapView
        senderLatitude={latitude}
        senderLongitude={longitude}
        senderName={senderName || 'Utilisateur'}
        senderPhoto={senderPhoto}
        receiverLatitude={receiverLatitude}
        receiverLongitude={receiverLongitude}
        receiverName={receiverName}
        receiverPhoto={receiverPhoto}
        onBack={() => setShowMap(false)}
        onGetDirections={() => {
          setShowMap(false);
          setShowDirections(true);
        }}
      />
    );
  }

  if (showDirections && receiverLatitude && receiverLongitude) {
    return (
      <LocationDirectionsView
        senderLatitude={latitude}
        senderLongitude={longitude}
        senderName={senderName || 'Utilisateur'}
        senderPhoto={senderPhoto}
        receiverLatitude={receiverLatitude}
        receiverLongitude={receiverLongitude}
        receiverName={receiverName || 'Destinataire'}
        receiverPhoto={receiverPhoto}
        onBack={() => setShowDirections(false)}
      />
    );
  }

  return (
    <Card className="w-full max-w-sm overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-primary/30">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-primary via-primary to-green-700 text-white p-3 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Localisation partagée</p>
          {senderName && <p className="text-xs opacity-90">par {senderName}</p>}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-3">
        {/* Profils */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Avatar className="h-8 w-8 border-2 border-primary">
              <AvatarImage src={senderPhoto} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {senderName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{senderName}</p>
              <p className="text-xs text-gray-600">Expéditeur</p>
            </div>
          </div>

          {receiverName && (
            <>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarImage src={receiverPhoto} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {receiverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{receiverName}</p>
                  <p className="text-xs text-gray-600">Destinataire</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coordonnées */}
        <div className="bg-white rounded-lg p-3 space-y-2 border border-primary/20">
          <p className="text-xs text-gray-600 font-semibold">Coordonnées GPS</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 font-mono text-gray-800">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10"
              onClick={handleCopyCoordinates}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Adresse si disponible */}
        {address && (
          <div className="bg-white rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-gray-600 font-semibold mb-1">Adresse</p>
            <p className="text-sm text-gray-800">{address}</p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-primary text-primary hover:bg-primary/10"
            onClick={handleOpenMap}
          >
            <MapPin className="h-4 w-4" />
            Voir la carte
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-green-700 hover:from-primary/90 hover:to-green-700/90 text-white"
            onClick={handleGetDirections}
            disabled={!receiverLatitude || !receiverLongitude}
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
