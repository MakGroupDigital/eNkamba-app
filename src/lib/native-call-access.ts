const NATIVE_CALL_ACCESS_KEY = 'enkamba-native-call-access';
const CALL_ROUTE_PATTERN = /^\/dashboard\/miyiki-chat\/(?:audio)?call\//;

type NativeCallAccess = {
  target: string;
  expiresAt: number;
};

export function isCallRoute(pathname?: string | null) {
  return Boolean(pathname && CALL_ROUTE_PATTERN.test(pathname));
}

export function hasNativeCallAccess(pathname?: string | null) {
  if (typeof window === 'undefined' || !isCallRoute(pathname)) return false;

  try {
    const raw = window.sessionStorage.getItem(NATIVE_CALL_ACCESS_KEY);
    const data = raw ? (JSON.parse(raw) as NativeCallAccess) : null;
    if (!data || data.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(NATIVE_CALL_ACCESS_KEY);
      return false;
    }
    return isCallRoute(data.target);
  } catch {
    return false;
  }
}
