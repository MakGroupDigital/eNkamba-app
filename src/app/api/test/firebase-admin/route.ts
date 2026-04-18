import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminConfig } from '@/lib/decode-secrets';

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === 'test-firebase-admin');
  if (existing) return existing;

  const config = getFirebaseAdminConfig();
  if (!config.projectId || !config.clientEmail || !config.privateKey) {
    throw new Error('Firebase Admin SDK non configuré');
  }

  return initializeApp(
    {
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      } as any),
    },
    'test-firebase-admin'
  );
}

/**
 * GET /api/test/firebase-admin
 * Teste l'authentification Firebase Admin SDK
 */
export async function GET() {
  try {
    // Test d'initialisation
    const adminApp = getFirebaseAdminApp();
    console.log('✅ Firebase Admin App initialisé:', adminApp.name);

    // Test d'accès à Firestore
    const db = getFirestore(adminApp);
    console.log('✅ Firestore instance obtenue');

    // Test de lecture simple (collection qui existe probablement)
    try {
      const testCollection = db.collection('test');
      const snapshot = await testCollection.limit(1).get();
      console.log('✅ Test de lecture Firestore réussi, docs:', snapshot.size);
    } catch (firestoreError) {
      console.error('❌ Erreur lecture Firestore:', firestoreError);
      return NextResponse.json({
        success: false,
        error: 'Erreur d\'accès Firestore',
        details: (firestoreError as any)?.message,
        code: (firestoreError as any)?.code,
      }, { status: 500 });
    }

    // Test de création d'un document temporaire
    try {
      const testRef = db.collection('test').doc('firebase-admin-test');
      await testRef.set({
        test: true,
        timestamp: new Date(),
        message: 'Test Firebase Admin SDK'
      });
      console.log('✅ Test d\'écriture Firestore réussi');

      // Nettoyage
      await testRef.delete();
      console.log('✅ Nettoyage effectué');
    } catch (writeError) {
      console.error('❌ Erreur écriture Firestore:', writeError);
      return NextResponse.json({
        success: false,
        error: 'Erreur d\'écriture Firestore',
        details: (writeError as any)?.message,
        code: (writeError as any)?.code,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK fonctionne correctement',
      config: {
        projectId: getFirebaseAdminConfig().projectId,
        clientEmail: getFirebaseAdminConfig().clientEmail,
      }
    });

  } catch (error) {
    console.error('❌ Erreur Firebase Admin:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur Firebase Admin SDK',
      details: (error as any)?.message,
    }, { status: 500 });
  }
}