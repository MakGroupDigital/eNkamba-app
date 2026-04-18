import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === 'test-user-firebase');
  if (existing) return existing;

  const config = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return initializeApp(config, 'test-user-firebase');
}

/**
 * GET /api/test/firebase-user
 * Teste l'accès Firestore avec le SDK client (sans authentification admin)
 */
export async function GET() {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    // Test d'écriture simple
    const testRef = await addDoc(collection(db, 'test'), {
      test: true,
      timestamp: new Date(),
      message: 'Test Firebase Client SDK'
    });

    console.log('✅ Test d\'écriture réussi avec SDK client');

    // Nettoyage
    await deleteDoc(testRef);
    console.log('✅ Nettoyage effectué');

    return NextResponse.json({
      success: true,
      message: 'Firebase Client SDK fonctionne correctement',
      testId: testRef.id
    });

  } catch (error) {
    console.error('❌ Erreur Firebase Client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur Firebase Client SDK',
      details: (error as any)?.message,
    }, { status: 500 });
  }
}