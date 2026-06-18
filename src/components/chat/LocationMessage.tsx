'use client';

import { useState } from 'react';
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
    <Card className="w-full max-w-[240px] overflow-hidden rounded-2xl border-primary/15 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-primary px-2.5 py-1.5 text-white">
        <MapPin className="h-3.5 w-3.5" />
        <div className="flex-1">
          <p className="text-[11px] font-black">Localisation</p>
          {senderName && <p className="text-[10px] opacity-90">par {senderName}</p>}
        </div>
      </div>

      <div className="space-y-1.5 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Avatar className="h-5 w-5 border border-primary/30">
              <AvatarImage src={senderPhoto} />
              <AvatarFallback className="bg-primary text-[10px] text-white">
                {senderName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-gray-800">{senderName || 'Expéditeur'}</p>
              <p className="text-[9px] text-gray-600">Départ</p>
            </div>
          </div>

          {receiverName && (
            <>
              <div className="text-[10px] text-gray-400">→</div>
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-5 w-5 border border-primary/30">
                  <AvatarImage src={receiverPhoto} />
                  <AvatarFallback className="bg-primary text-[10px] text-white">
                    {receiverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold text-gray-800">{receiverName}</p>
                  <p className="text-[9px] text-gray-600">Arrivée</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded bg-white px-1.5 py-1 font-mono text-[9px] text-gray-800">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={handleCopyCoordinates}
            >
              {copied ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        {address && (
          <div className="rounded-xl border border-primary/15 bg-white p-1.5">
            <p className="line-clamp-2 text-[11px] text-gray-700">{address}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-primary text-[11px] text-primary hover:bg-primary/10"
            onClick={handleOpenMap}
          >
            <MapPin className="h-3 w-3" />
            Carte
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1 bg-primary text-[11px] text-white hover:bg-primary/90"
            onClick={handleGetDirections}
            disabled={!receiverLatitude || !receiverLongitude}
          >
            <Navigation className="h-3 w-3" />
            Itinéraire
          </Button>
        </div>

        {timestamp && (
          <p className="text-center text-[9px] text-gray-500">
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
