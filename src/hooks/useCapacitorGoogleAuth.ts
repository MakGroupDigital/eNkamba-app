import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type NativeGoogleResult = {
  success: boolean;
  idToken?: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  error?: string;
};

declare global {
  interface Window {
    eNkambaNativeGoogle?: {
      isAvailable?: () => boolean;
      signIn?: (requestId: string) => void;
    };
    __eNkambaNativeGoogleAuthResolve?: (requestId: string, payload: NativeGoogleResult) => void;
  }
}

export function useCapacitorGoogleAuth() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const isTauriAndroid = typeof window !== 'undefined' && Boolean(window.eNkambaNativeGoogle?.signIn);
    const isCapacitorNative = Capacitor.isNativePlatform();

    setIsNative(isTauriAndroid || isCapacitorNative);

    // Initialiser Google Auth pour Capacitor
    if (!isTauriAndroid && isCapacitorNative) {
      GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  const signInWithTauriAndroidGoogle = async () => {
    if (!window.eNkambaNativeGoogle?.signIn) {
      throw new Error("L'authentification Google native Android n'est pas disponible.");
    }

    const requestId = `enkamba-google-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nativePayload = await new Promise<NativeGoogleResult>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        delete pendingResolvers[requestId];
        reject(new Error('Connexion Google native expirée.'));
      }, 90000);

      pendingResolvers[requestId] = (payload) => {
        window.clearTimeout(timeout);
        resolve(payload);
      };

      window.eNkambaNativeGoogle?.signIn?.(requestId);
    });

    if (!nativePayload.success || !nativePayload.idToken) {
      throw new Error(nativePayload.error || 'Connexion Google native impossible.');
    }

    const credential = GoogleAuthProvider.credential(nativePayload.idToken);
    return signInWithCredential(auth, credential);
  };

  const signInWithGoogle = async () => {
    try {
      if (typeof window !== 'undefined' && window.eNkambaNativeGoogle?.signIn) {
        const result = await signInWithTauriAndroidGoogle();
        return result;
      }

      if (isNative) {
        // Authentification native avec Capacitor
        const googleUser = await GoogleAuth.signIn();
        
        // Créer les credentials Firebase
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        
        // Se connecter à Firebase avec les credentials
        const result = await signInWithCredential(auth, credential);
        
        return result;
      } else {
        // Authentification web classique (popup)
        const { signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        return result;
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw error;
    }
  };

  return {
    isNative,
    signInWithGoogle,
  };
}

const pendingResolvers: Record<string, (payload: NativeGoogleResult) => void> = {};

if (typeof window !== 'undefined') {
  window.__eNkambaNativeGoogleAuthResolve = (requestId, payload) => {
    pendingResolvers[requestId]?.(payload);
    delete pendingResolvers[requestId];
  };
}
