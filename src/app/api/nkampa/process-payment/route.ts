import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin - only on server side
let db: any;
let auth: any;
let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;

  try {
    const firebaseAdminConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate config - skip if not properly configured
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
      console.warn('Firebase Admin SDK credentials are not properly configured');
      return;
    }

    const apps = getApps();
    if (!apps.length) {
      initializeApp({
        credential: cert(firebaseAdminConfig as any),
      });
    }

    db = getFirestore();
    auth = getAuth();
    initialized = true;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    if (!db || !auth) {
      return NextResponse.json(
        { error: 'Service non disponible - Firebase Admin SDK non configuré' },
        { status: 503 }
      );
    }

    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { orderId, buyerId, sellerId, amount, currency } = await request.json();

    // Vérifier que l'utilisateur est l'acheteur
    if (decodedToken.uid !== buyerId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier le solde de l'acheteur
    const buyerRef = db.collection('users').doc(buyerId);
    const buyerSnap = await buyerRef.get();
    const buyerData = buyerSnap.data();
    const buyerBalance = buyerData?.walletBalance || 0;

    if (buyerBalance < amount) {
      return NextResponse.json(
        { error: 'Solde insuffisant' },
        { status: 400 }
      );
    }

    // Créer la transaction
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Déduire du portefeuille de l'acheteur
    await buyerRef.update({
      walletBalance: FieldValue.increment(-amount),
    });

    // Ajouter à la transaction de l'acheteur
    await db.collection('users').doc(buyerId).collection('transactions').add({
      type: 'payment',
      amount,
      currency,
      status: 'completed',
      description: `Achat produit - Commande ${orderId}`,
      previousBalance: buyerBalance,
      newBalance: buyerBalance - amount,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      orderId,
      sellerId,
    });

    // Ajouter une notification à l'acheteur
    await db.collection('users').doc(buyerId).collection('notifications').add({
      type: 'payment',
      title: 'Paiement effectué',
      message: `Paiement de ${amount} ${currency} effectué avec succès`,
      amount,
      transactionId,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    // Créditer le portefeuille du vendeur
    const sellerRef = db.collection('users').doc(sellerId);
    const sellerSnap = await sellerRef.get();
    const sellerData = sellerSnap.data();
    const sellerBalance = sellerData?.walletBalance || 0;

    await sellerRef.update({
      walletBalance: FieldValue.increment(amount),
    });

    // Ajouter à la transaction du vendeur
    await db.collection('users').doc(sellerId).collection('transactions').add({
      type: 'payment',
      amount,
      currency,
      status: 'completed',
      description: `Vente produit - Commande ${orderId}`,
      previousBalance: sellerBalance,
      newBalance: sellerBalance + amount,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
      orderId,
      buyerId,
    });

    // Ajouter une notification au vendeur
    await db.collection('users').doc(sellerId).collection('notifications').add({
      type: 'payment',
      title: 'Paiement reçu',
      message: `Vous avez reçu ${amount} ${currency} pour une vente`,
      amount,
      transactionId,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      transactionId,
      orderId,
      amount,
      currency,
    });
  } catch (error: any) {
    console.error('Erreur traitement paiement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
