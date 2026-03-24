import { NextRequest, NextResponse } from 'next/server';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * GET /api/esim/call-logs
 * Récupère l'historique des appels d'un eSIM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const esimId = searchParams.get('esimId');

    if (!esimId) {
      return NextResponse.json(
        { error: 'esimId requis' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const db = getFirestore(app);
    const callsRef = collection(db, 'esim_calls');
    const q = query(
      callsRef,
      where('esimId', '==', esimId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const calls: any[] = [];

    snapshot.forEach((doc) => {
      calls.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      success: true,
      calls,
      count: calls.length,
    });
  } catch (error: any) {
    console.error('Erreur logs appels:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des appels' },
      { status: 500 }
    );
  }
}
