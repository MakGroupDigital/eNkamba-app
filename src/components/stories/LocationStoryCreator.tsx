'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, X, Check, Loader2 } from 'lucide-react';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface LocationStoryCreatorProps {
  onComplete: (location: { latitude: number; longitude: number; address?: string }) => void;
  onCancel: () => void;
}

export function LocationStoryCreator({ onComplete, onCancel }: LocationStoryCreatorProps) {
  const [isActive, setIsActive] = useState(true);
  const { location, error, isTracking } = useLocationTracking(isActive);

  const handleConfirm = () => {
    if (location) {
      onComplete({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });
    }
  };

  if (error) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex flex-col items-center justify-center p-8">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"
        >
          <X size={24} />
        </button>

        <div className="text-center text-white">
          <MapPin size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Erreur de localisation</h3>
          <p className="mb-6">{error}</p>
          <Button onClick={onCancel} className="rounded-full bg-white text-blue-600">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex flex-col items-center justify-center p-8">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"
        >
          <X size={24} />
        </button>

        <div className="text-center text-white">
          <Loader2 size={64} className="mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold mb-2">Localisation en cours...</h3>
          <p>Veuillez autoriser l'accès à votre position</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
      >
        <X size={24} />
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[location.latitude, location.longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Ma position</p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Location Info Overlay */}
        <div className="absolute bottom-24 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <MapPin size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">Position actuelle</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Précision: {location.accuracy.toFixed(0)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
        <Button
          onClick={handleConfirm}
          size="lg"
          className="w-full h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold"
        >
          <Check size={24} className="mr-2" />
          Partager ma position
        </Button>
        <p className="text-center text-white/70 text-xs mt-3">
          Votre position sera mise à jour en temps réel pendant la durée choisie
        </p>
      </div>
    </div>
  );
}
