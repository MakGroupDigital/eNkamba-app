import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useCapacitorGoogleAuth() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Vérifier si on est dans une app native
    setIsNative(Capacitor.isNativePlatform());

    // Initialiser Google Auth pour Capacitor
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
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
