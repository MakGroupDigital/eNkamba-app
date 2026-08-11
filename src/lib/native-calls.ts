'use client';

type NativeCallResult = {
  success: boolean;
  error?: string;
};

declare global {
  interface Window {
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
    __eNkambaNativeCallResolve?: (requestId: string, payload: NativeCallResult) => void;
  }
}

const resolvers = new Map<string, (payload: NativeCallResult) => void>();

function requestNativeCall(
  run: (requestId: string) => void
): Promise<NativeCallResult> {
  const requestId = `enkamba-native-call-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      resolvers.delete(requestId);
      resolve({ success: false, error: "Le lancement de l'appel natif a expire." });
    }, 12_000);
    resolvers.set(requestId, (payload) => {
      window.clearTimeout(timeout);
      resolvers.delete(requestId);
      resolve(payload);
    });
    run(requestId);
  });
}

if (typeof window !== 'undefined') {
  window.__eNkambaNativeCallResolve = (requestId, payload) => {
    resolvers.get(requestId)?.(payload);
  };
}

export async function startNativeChatCall(
  conversationId: string,
  recipientUid: string,
  callType: 'audio' | 'video'
): Promise<NativeCallResult> {
  if (typeof window === 'undefined' || !window.eNkambaNativeCalls?.startCall) {
    return { success: false, error: 'Appel Android natif indisponible.' };
  }
  return requestNativeCall((requestId) => {
    window.eNkambaNativeCalls?.startCall?.(requestId, conversationId, recipientUid, callType);
  });
}

export async function answerNativeChatCall(
  callId: string,
  callType: 'audio' | 'video'
): Promise<NativeCallResult> {
  if (typeof window === 'undefined' || !window.eNkambaNativeCalls?.answerIncomingCall) {
    return { success: false, error: 'Appel Android natif indisponible.' };
  }
  return requestNativeCall((requestId) => {
    window.eNkambaNativeCalls?.answerIncomingCall?.(requestId, callId, callType);
  });
}

export function hasNativeCallEngine() {
  return typeof window !== 'undefined' && Boolean(window.eNkambaNativeCalls?.startCall);
}
