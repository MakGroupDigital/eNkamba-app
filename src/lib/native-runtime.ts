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
    eNkambaNativeFirebase?: {
      isAvailable?: () => boolean;
      signInWithCustomToken?: (requestId: string, token: string) => void;
      signOut?: () => void;
    };
    eNkambaNativeCalls?: {
      isAvailable?: () => boolean;
      startCall?: (
        requestId: string,
        conversationId: string,
        recipientUid: string,
        callType: 'audio' | 'video'
      ) => void;
      answerIncomingCall?: (requestId: string, callId: string, callType: 'audio' | 'video') => void;
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
      window.eNkambaNativeFirebase?.isAvailable?.() ||
      window.eNkambaNativeCalls?.isAvailable?.() ||
      window.Capacitor?.isNativePlatform?.()
  );
}
