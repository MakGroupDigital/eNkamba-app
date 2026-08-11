import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Relie la session Firebase deja ouverte dans la WebView a Firebase Auth
 * Android. Le jeton personnalise est a usage unique et n'est jamais stocke
 * par l'interface Web.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Session utilisateur requise.' }, { status: 401 });
  }

  const idToken = authorization.slice('Bearer '.length).trim();
  if (!idToken) {
    return NextResponse.json({ error: 'Jeton utilisateur manquant.' }, { status: 401 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const customToken = await adminAuth.createCustomToken(decoded.uid, {
      nativeClient: 'android',
    });

    return NextResponse.json({ customToken, uid: decoded.uid });
  } catch (error) {
    console.error('Erreur synchronisation Firebase Android:', error);
    return NextResponse.json(
      { error: 'Impossible de synchroniser la session Android.' },
      { status: 401 }
    );
  }
}
