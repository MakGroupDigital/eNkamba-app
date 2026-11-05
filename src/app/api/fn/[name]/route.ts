import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { SERVER_CALLABLES } from '@/lib/server/callable-registry';

export const runtime = 'nodejs';

/**
 * Exécute une fonction « callable » de Kenz côté serveur Next.js, avec le même code que functions/src.
 * Remplace les Cloud Functions tant qu'elles sont indisponibles (facturation du projet Firebase désactivée).
 * Corps : { data } — Réponse : { result } ou { error: { status, message } } (même format que le protocole callable).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const callable = SERVER_CALLABLES[name];
  if (!callable) {
    return NextResponse.json({ error: { status: 'NOT_FOUND', message: 'Fonction inconnue.' } }, { status: 404 });
  }

  const header = request.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  let auth: { uid: string; token: Record<string, any> } | null = null;
  if (idToken) {
    try {
      getAdminFirestore(); // initialise l'app Admin par défaut utilisée par le code des fonctions
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      auth = { uid: decoded.uid, token: decoded };
    } catch {
      return NextResponse.json({ error: { status: 'UNAUTHENTICATED', message: 'Session invalide ou expirée. Reconnectez-vous.' } }, { status: 401 });
    }
  }

  let data: unknown = null;
  try {
    const body = await request.json();
    data = body?.data ?? null;
  } catch {
    data = null;
  }

  try {
    getAdminFirestore();
    const result = await callable.run(data, { auth, rawRequest: request });
    return NextResponse.json({ result: result ?? null });
  } catch (error: any) {
    if (error?.httpStatus) {
      return NextResponse.json({ error: { status: String(error.code).toUpperCase().replace(/-/g, '_'), message: error.message, details: error.details } }, { status: error.httpStatus });
    }
    console.error(`[api/fn/${name}]`, error);
    return NextResponse.json({ error: { status: 'INTERNAL', message: 'Opération impossible pour le moment. Aucun montant n’a été débité.' } }, { status: 500 });
  }
}
