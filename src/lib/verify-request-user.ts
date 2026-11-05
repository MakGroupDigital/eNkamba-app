import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const VERIFIER_APP_NAME = 'id-token-verifier';

// Verifying a Firebase ID token only needs the project ID (Google public keys), no service account.
function getVerifierAuth() {
  const existing = getApps().find((app) => app.name === VERIFIER_APP_NAME);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const app = existing || initializeApp({ projectId }, VERIFIER_APP_NAME);
  return getAuth(app);
}

/**
 * Returns the verified uid of the caller, or a 401/403 response.
 * When `expectedUserId` is given, the token must belong to that user: nobody can act on another wallet.
 */
export async function requireRequestUser(
  request: NextRequest,
  expectedUserId?: string,
): Promise<{ uid: string } | { response: NextResponse }> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) {
    return { response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  try {
    const decoded = await getVerifierAuth().verifyIdToken(token);
    if (expectedUserId && decoded.uid !== expectedUserId) {
      return { response: NextResponse.json({ error: 'Opération non autorisée pour ce compte' }, { status: 403 }) };
    }
    return { uid: decoded.uid };
  } catch {
    return { response: NextResponse.json({ error: 'Session invalide ou expirée. Reconnectez-vous.' }, { status: 401 }) };
  }
}
