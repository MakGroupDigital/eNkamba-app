'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealQRScanner } from '@/hooks/useRealQRScanner';
import { Camera, RotateCw, X } from 'lucide-react';

interface QRScannerComponentProps {
  onSuccess: (data: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QRScannerComponent({
  onSuccess,
  onCancel,
  isLoading = false,
}: QRScannerComponentProps) {
  const {
    videoRef,
    canvasRef,
    isScanning,
    isLoading: scannerLoading,
    error,
    startScanning,
    stopScanning,
    toggleCamera,
  } = useRealQRScanner({
    onSuccess: (data) => {
      onSuccess(data);
      stopScanning();
    },
  });

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  return (
    <div className="space-y-4">
      {/* Scanner Video */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Canvas caché pour le traitement */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay avec guide de scan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-50" />
            </div>

            {/* Indicateur de scan */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-white font-semibold">Scan en cours...</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-12 h-12 text-white/50 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Initialisation de la caméra...</p>
            </div>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold">Erreur</p>
          <p>{error.message}</p>
        </div>
      )}

      {/* Entrée manuelle */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Ou entrez le code QR manuellement</label>
        <Input
          placeholder="Collez le code QR ici"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              onSuccess(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          disabled={isLoading || scannerLoading}
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={toggleCamera}
          disabled={!isScanning || isLoading || scannerLoading}
          className="flex-1"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Changer de caméra
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            stopScanning();
            onCancel();
          }}
          disabled={isLoading || scannerLoading}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
  );
}
