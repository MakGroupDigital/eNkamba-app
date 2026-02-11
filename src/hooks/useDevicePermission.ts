import { useState, useCallback, useEffect } from 'react';
import { permissionsManager, type PermissionType } from '@/lib/permissions-manager';

interface UseDevicePermissionResult {
  isGranted: boolean;
  isDenied: boolean;
  isLoading: boolean;
  error: string | null;
  shouldPrompt: boolean;
  requestPermission: () => Promise<boolean>;
  resetPermission: () => void;
}

/**
 * Hook pour gérer les permissions d'appareil
 * Stocke les autorisations pour éviter de les redemander
 */
export function useDevicePermission(type: PermissionType): UseDevicePermissionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGranted, setIsGranted] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  // Initialiser l'état depuis le gestionnaire
  useEffect(() => {
    const state = permissionsManager.getPermissionState(type);
    if (state?.status === 'granted') {
      setIsGranted(true);
      setIsDenied(false);
    } else if (state?.status === 'denied') {
      setIsGranted(false);
      setIsDenied(true);
    }
  }, [type]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Si déjà accordée, retourner true
    if (permissionsManager.isPermissionGranted(type)) {
      setIsGranted(true);
      setIsDenied(false);
      return true;
    }

    // Si déjà refusée, retourner false
    if (permissionsManager.isPermissionDenied(type)) {
      setIsGranted(false);
      setIsDenied(true);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let granted = false;

      switch (type) {
        case 'camera':
          granted = await requestCameraPermission();
          break;
        case 'microphone':
          granted = await requestMicrophonePermission();
          break;
        case 'location':
          granted = await requestLocationPermission();
          break;
        case 'photos':
          granted = await requestPhotosPermission();
          break;
        case 'contacts':
          granted = await requestContactsPermission();
          break;
        case 'clipboard':
          granted = await requestClipboardPermission();
          break;
        default:
          throw new Error(`Permission type non supportée: ${type}`);
      }

      if (granted) {
        permissionsManager.setPermissionGranted(type);
        setIsGranted(true);
        setIsDenied(false);
      } else {
        permissionsManager.setPermissionDenied(type);
        setIsGranted(false);
        setIsDenied(true);
      }

      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la demande de permission';
      setError(errorMessage);
      console.error(`Erreur permission ${type}:`, err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  const resetPermission = useCallback(() => {
    permissionsManager.resetPermission(type);
    setIsGranted(false);
    setIsDenied(false);
    setError(null);
  }, [type]);

  return {
    isGranted,
    isDenied,
    isLoading,
    error,
    shouldPrompt: !isGranted && !isDenied,
    requestPermission,
    resetPermission,
  };
}

/**
 * Demander la permission caméra
 */
async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return false;
    }
    throw error;
  }
}

/**
 * Demander la permission microphone
 */
async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return false;
    }
    throw error;
  }
}

/**
 * Demander la permission localisation
 */
async function requestLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve(false);
        } else {
          resolve(false);
        }
      }
    );
  });
}

/**
 * Demander la permission photos (Web API limitée)
 */
async function requestPhotosPermission(): Promise<boolean> {
  try {
    // Sur web, on simule en demandant l'accès au système de fichiers
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    return new Promise((resolve) => {
      input.onchange = () => {
        resolve(input.files?.length ? true : false);
      };
      input.click();
    });
  } catch {
    return false;
  }
}

/**
 * Demander la permission contacts (Web API limitée)
 */
async function requestContactsPermission(): Promise<boolean> {
  try {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      const contacts = await (navigator as any).contacts.getProperties();
      return contacts.length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Demander la permission presse-papiers
 */
async function requestClipboardPermission(): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false;
    }
    
    // Tester l'accès au presse-papiers
    await navigator.clipboard.readText();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return false;
    }
    return false;
  }
}
