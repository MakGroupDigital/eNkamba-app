const NATIVE_CALL_ACCESS_KEY = 'enkamba-native-call-access';
const CALL_ROUTE_PATTERN = /^\/dashboard\/miyiki-chat\/(?:audio)?call\//;

type NativeCallAccess = {
  target: string;
  expiresAt: number;
};

declare global {
  interface Window {
    eNkambaNativeLaunch?: {
      getPendingCallAccess?: () => string;
      clearPendingCallAccess?: () => void;
    };
  }
}

export function isCallRoute(pathname?: string | null) {
  return Boolean(pathname && CALL_ROUTE_PATTERN.test(pathname));
}

function parseAccess(raw?: string | null): NativeCallAccess | null {
  if (!raw) return null;

  try {
    const data = raw ? (JSON.parse(raw) as NativeCallAccess) : null;
    if (!data || data.expiresAt < Date.now() || !isCallRoute(data.target)) return null;
    return data;
  } catch {
    return null;
  }
}

function getAcceptedCallAccessFromLocation(): NativeCallAccess | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const callId = url.searchParams.get('callId');
    const wasAcceptedNatively = url.searchParams.get('nativeAccepted') === '1';
    const hasNativeBridge = Boolean(window.eNkambaNativeLaunch?.getPendingCallAccess);

    if (!hasNativeBridge || !wasAcceptedNatively || !callId || !isCallRoute(url.pathname)) {
      return null;
    }

    return {
      target: `${url.pathname}${url.search}`,
      // The URL is only used during the transition to the call screen.
      expiresAt: Date.now() + 120_000,
    };
  } catch {
    return null;
  }
}

export function getNativeCallAccess(): NativeCallAccess | null {
  if (typeof window === 'undefined') return null;

  // When Android opens the exact call URL, this check is available before any
  // asynchronous bridge or application state has finished restoring.
  const fromLocation = getAcceptedCallAccessFromLocation();
  if (fromLocation) {
    window.sessionStorage.setItem(NATIVE_CALL_ACCESS_KEY, JSON.stringify(fromLocation));
    return fromLocation;
  }

  const fromSession = parseAccess(window.sessionStorage.getItem(NATIVE_CALL_ACCESS_KEY));
  if (fromSession) return fromSession;

  const fromBridge = parseAccess(window.eNkambaNativeLaunch?.getPendingCallAccess?.());
  if (fromBridge) {
    window.sessionStorage.setItem(NATIVE_CALL_ACCESS_KEY, JSON.stringify(fromBridge));
    return fromBridge;
  }

  return null;
}

export function hasNativeCallAccess(pathname?: string | null) {
  const access = getNativeCallAccess();
  if (!access) return false;
  return !pathname || isCallRoute(pathname) || access.target !== '';
}

export function getNativeAcceptedCallId(): string | null {
  const access = getNativeCallAccess();
  if (!access?.target) return null;

  try {
    const url = new URL(access.target, 'https://www.enkamba.io');
    if (url.searchParams.get('nativeAccepted') !== '1') return null;
    return url.searchParams.get('callId');
  } catch {
    return null;
  }
}

export function clearNativeCallAccess() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(NATIVE_CALL_ACCESS_KEY);
  window.eNkambaNativeLaunch?.clearPendingCallAccess?.();
}
