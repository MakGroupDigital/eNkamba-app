/**
 * Remplace le module « firebase-functions » quand le code de functions/src est exécuté par l'API Next.js
 * (voir src/app/api/fn/[name]/route.ts). Seule l'API utilisée par ces modules est fournie :
 * https.onCall(handler) → handler exécutable via .run(data, context), et https.HttpsError.
 */
export type CallableContext = { auth?: { uid: string; token: Record<string, any> } | null; rawRequest?: unknown };
type Handler = (data: any, context: CallableContext) => any;

const STATUS: Record<string, number> = {
  'invalid-argument': 400, 'failed-precondition': 400, 'out-of-range': 400, unauthenticated: 401,
  'permission-denied': 403, 'not-found': 404, 'already-exists': 409, aborted: 409,
  'resource-exhausted': 429, cancelled: 499, unimplemented: 501, unavailable: 503, 'deadline-exceeded': 504,
};

class HttpsError extends Error {
  code: string;
  details?: unknown;
  httpStatus: number;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.httpStatus = STATUS[code] ?? 500;
  }
}

function onCall(handler: Handler) {
  const callable = (() => {
    throw new Error('Callable exécutable uniquement via .run()');
  }) as unknown as { run: Handler };
  callable.run = (data, context) => handler(data, context);
  return callable;
}

const logger = { log: console.log, info: console.info, warn: console.warn, error: console.error, debug: console.debug };

export const https = { onCall, HttpsError };
export { logger };
export default { https, logger };
