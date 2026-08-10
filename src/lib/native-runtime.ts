'use client';

declare global {
  interface Window {
    eNkambaNativeGoogle?: {
      isAvailable?: () => boolean;
      signIn?: (requestId: string) => void;
    };
    eNkambaNativePush?: {
      isAvailable?: () => boolean;
      getToken?: (requestId: string) => void;
    };
    eNkambaNativeContacts?: {
      isAvailable?: () => boolean;
      getContacts?: (requestId: string) => void;
    };
    eNkambaNativeLaunch?: {
      getPendingCallAccess?: () => string;
      clearPendingCallAccess?: () => void;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export function isEnkambaNativeRuntime() {
  if (typeof window === 'undefined') return false;

  return Boolean(
    window.eNkambaNativeGoogle?.signIn ||
      window.eNkambaNativePush?.isAvailable?.() ||
      window.eNkambaNativeContacts?.isAvailable?.() ||
      window.eNkambaNativeLaunch?.getPendingCallAccess ||
      window.Capacitor?.isNativePlatform?.()
  );
}
