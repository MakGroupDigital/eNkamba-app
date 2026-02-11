'use client';

import { useDevicePermission } from '@/hooks/useDevicePermission';
import { PermissionType } from '@/lib/permissions-manager';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Camera, Mic, MapPin, Image, Users, Clipboard } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface PermissionRequestProps {
  type: PermissionType;
  title: string;
  description: string;
  onGranted?: () => void;
  onDenied?: () => void;
  showStatus?: boolean;
}

const permissionIcons: Record<PermissionType, React.ReactNode> = {
  camera: <Camera className="w-5 h-5" />,
  microphone: <Mic className="w-5 h-5" />,
  location: <MapPin className="w-5 h-5" />,
  photos: <Image className="w-5 h-5" />,
  contacts: <Users className="w-5 h-5" />,
  calendar: <AlertCircle className="w-5 h-5" />,
  clipboard: <Clipboard className="w-5 h-5" />,
};

export function PermissionRequest({
  type,
  title,
  description,
  onGranted,
  onDenied,
  showStatus = true,
}: PermissionRequestProps) {
  const { isGranted, isDenied, isLoading, error, requestPermission, resetPermission } = useDevicePermission(type);

  const handleRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      onGranted?.();
    } else {
      onDenied?.();
    }
  };

  if (isGranted && showStatus) {
    return (
      <Alert className="border-green-500/30 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Permission accordée</AlertTitle>
        <AlertDescription className="text-green-700">
          {title} est autorisé. Vous ne serez pas redemandé.
        </AlertDescription>
      </Alert>
    );
  }

  if (isDenied && showStatus) {
    return (
      <Alert className="border-red-500/30 bg-red-500/10">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Permission refusée</AlertTitle>
        <AlertDescription className="text-red-700 space-y-2">
          <p>{title} a été refusé. Vous pouvez modifier cela dans les paramètres de votre appareil.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={resetPermission}
            className="mt-2"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-primary/20">
        <div className="text-primary mt-1">
          {permissionIcons[type]}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleRequest}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Demande en cours...
          </>
        ) : (
          'Autoriser'
        )}
      </Button>
    </div>
  );
}
