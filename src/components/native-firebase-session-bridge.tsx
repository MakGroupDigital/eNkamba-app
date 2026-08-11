'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isEnkambaNativeRuntime } from '@/lib/native-runtime';

type NativeFirebaseAuthResult = {
  success: boolean;
  error?: string;
};

declare global {
  interface Window {
    eNkambaNativeFirebase?: {
      isAvailable?: () => boolean;
      signInWithCustomToken?: (requestId: string, token: string) => void;
      signOut?: () => void;
    };
    __eNkambaNativeFirebaseAuthResolve?: (
      requestId: string,
      payload: NativeFirebaseAuthResult
    ) => void;
  }
}

const pendingResolvers = new Map<string, (payload: NativeFirebaseAuthResult) => void>();

function syncTokenWithAndroid(customToken: string) {
  const bridge = window.eNkambaNativeFirebase;
  if (!bridge?.signInWithCustomToken) {
    return Promise.resolve({ success: false, error: 'Pont Android indisponible.' });
  }

  const requestId = `enkamba-native-auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise<NativeFirebaseAuthResult>((resolve) => {
    const timeout = window.setTimeout(() => {
      pendingResolvers.delete(requestId);
      resolve({ success: false, error: 'Synchronisation Android expiree.' });
    }, 30_000);

    pendingResolvers.set(requestId, (payload) => {
      window.clearTimeout(timeout);
      pendingResolvers.delete(requestId);
      resolve(payload);
    });
    bridge.signInWithCustomToken?.(requestId, customToken);
  });
}

if (typeof window !== 'undefined') {
  window.__eNkambaNativeFirebaseAuthResolve = (requestId, payload) => {
    pendingResolvers.get(requestId)?.(payload);
  };
}

/**
 * Maintient une session Firebase Android parallèle à la session WebView.
 * Elle permet à l'activité d'appel native de lire/ecrire le signalement
 * Firestore, y compris lors d'un appel entrant avec l'application fermee.
 */
export function NativeFirebaseSessionBridge() {
  const { user } = useAuth();
  const syncedSessionRef = useRef<string>('');

  useEffect(() => {
    if (!user) {
      syncedSessionRef.current = '';
      window.eNkambaNativeFirebase?.signOut?.();
      return;
    }

    if (!isEnkambaNativeRuntime() || !window.eNkambaNativeFirebase?.signInWithCustomToken) return;

    let cancelled = false;
    const sessionKey = `${user.uid}:${user.metadata.lastSignInTime || ''}`;
    if (syncedSessionRef.current === sessionKey) return;

    void (async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/mobile-auth/tauri-custom-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.customToken || cancelled) {
          throw new Error(payload?.error || 'Jeton Android indisponible.');
        }

        const nativeResult = await syncTokenWithAndroid(String(payload.customToken));
        if (nativeResult.success && !cancelled) {
          syncedSessionRef.current = sessionKey;
        } else if (nativeResult.error) {
          console.warn('Session Firebase Android non synchronisee:', nativeResult.error);
        }
      } catch (error) {
        console.warn('Synchronisation Firebase Android impossible:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
