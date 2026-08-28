import { NextRequest, NextResponse } from 'next/server';
import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Utiliser l'app existante ou en créer une nouvelle
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  // Si getApp() échoue, initialiser une nouvelle app
  app = initializeApp(firebaseConfig);
}

const ESIM_PRICE = 1000; // CDF

/**
 * POST /api/esim/purchase
 * Achète un eSIM-Kenz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber } = body;

    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId et phoneNumber requis' },
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
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentBalance = userData?.walletBalance || 0;

    // Vérifier le solde
    if (currentBalance < ESIM_PRICE) {
      return NextResponse.json(
        { error: 'Solde insuffisant pour acheter un eSIM' },
        { status: 400 }
      );
    }

    // Créer l'eSIM
    const esimId = `ESIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const esimData = {
      id: esimId,
      userId,
      phoneNumber,
      status: 'active',
      activatedAt: now.toISOString(),
      balance: 0,
      callsReceived: 0,
      smsReceived: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Sauvegarder l'eSIM
    const esimRef = doc(collection(db, 'esims'), esimId);
    await setDoc(esimRef, esimData);

    // Créer la transaction
    const transactionData = {
      id: transactionId,
      type: 'esim_purchase',
      amount: ESIM_PRICE,
      status: 'completed',
      previousBalance: currentBalance,
      newBalance: currentBalance - ESIM_PRICE,
      description: `Achat eSIM-Kenz: ${phoneNumber}`,
      timestamp: now,
      createdAt: now.toISOString(),
      esimId,
      phoneNumber,
    };

    const transactionRef = doc(collection(userRef, 'transactions'), transactionId);
    await setDoc(transactionRef, transactionData);

    // Débiter le portefeuille
    await updateDoc(userRef, {
      walletBalance: increment(-ESIM_PRICE),
      lastTransactionTime: now,
    });

    return NextResponse.json({
      success: true,
      esim: esimData,
      transactionId,
      newBalance: currentBalance - ESIM_PRICE,
      message: 'eSIM activé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur achat eSIM:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'achat de l\'eSIM' },
      { status: 500 }
    );
  }
}
