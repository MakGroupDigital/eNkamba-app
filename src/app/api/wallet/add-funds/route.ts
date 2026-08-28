import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminConfig } from '@/lib/decode-secrets';
import {
  getWonyaPayConfig,
  processWonyaPayTransaction,
  generateRefTransa,
  normalizePhoneNumber,
  type WonyaPayRequest
} from '@/lib/wonyapay';

// TEMPORAIRE : Imports pour SDK client
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection 
} from 'firebase/firestore';

function getFirebaseAdminApp() {
  const existing = getApps().find((app) => app.name === 'wallet-add-funds');
  if (existing) return existing;

  const config = getFirebaseAdminConfig();
  if (!config.projectId || !config.clientEmail || !config.privateKey) {
    throw new Error(
      'Firebase Admin SDK non configuré (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL(_ENCODED) + FIREBASE_PRIVATE_KEY(_ENCODED))'
    );
  }

  return initializeApp(
    {
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      } as any),
    },
    'wallet-add-funds'
  );
}

// TEMPORAIRE : Fonction pour SDK client
function getFirebaseApp() {
  const existing = getClientApps().find((app) => app.name === 'wallet-add-funds-client');
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

  return initializeClientApp(config, 'wallet-add-funds-client');
}

/**
 * POST /api/wallet/add-funds
 * Ajoute des fonds au portefeuille via WonyaPay (simplifié selon la documentation officielle)
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, phoneNumber, currency = 'CDF', motif } = body;

    // Validation des paramètres
    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, paymentMethod requis' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0' }, { status: 400 });
    }

    // Vérification de l'authentification - TEMPORAIREMENT DÉSACTIVÉE
    // TODO: Réactiver une fois le service account Firebase corrigé
    /*
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    // Initialisation Firebase Admin
    let adminApp;
    try {
      adminApp = getFirebaseAdminApp();
    } catch (error) {
      console.error('Erreur initialisation Firebase:', error);
      return NextResponse.json(
        {
          error: 'Initialisation Firebase impossible',
          ...(isDev && (error as any)?.message ? { details: (error as any).message } : {}),
        },
        { status: 500 }
      );
    }

    // Vérification du token Firebase
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      if (decoded.uid !== userId) {
        return NextResponse.json({ error: 'Token invalide pour cet utilisateur' }, { status: 403 });
      }
    } catch (error) {
      console.error('Erreur verification token:', error);
      return NextResponse.json(
        {
          error: 'Non authentifié',
          ...(isDev && (error as any)?.message ? { details: (error as any).message } : {}),
        },
        { status: 401 }
      );
    }

    const db = getFirestore(adminApp);
    */

    // SOLUTION TEMPORAIRE : Utiliser SDK client au lieu d'Admin
    console.log('⚠️ ATTENTION: Authentification Firebase Admin désactivée temporairement');
    
    const app = getFirebaseApp();
    const db = getClientFirestore(app);
    const userRef = doc(db, 'users', userId);

    // Récupération du solde actuel
    let userDoc;
    try {
      userDoc = await getDoc(userRef);
    } catch (error) {
      console.error('Erreur lecture utilisateur:', error);
      return NextResponse.json(
        {
          error: 'Erreur Firebase (lecture utilisateur)',
          ...(isDev ? { details: (error as any)?.message } : {}),
        },
        { status: 500 }
      );
    }

    let currentBalance = 0;
    if (userDoc.exists()) {
      const data = userDoc.data();
      currentBalance = (data?.walletBalance as number) || 0;
    } else {
      await setDoc(userRef, {
        uid: userId,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
      });
    }

    // Traitement selon la méthode de paiement
    if (paymentMethod === 'wonyapay') {
      try {
        // Configuration WonyaPay
        const wonyaConfig = getWonyaPayConfig();
        
        if (!phoneNumber) {
          return NextResponse.json(
            { error: 'Numéro de téléphone requis pour WonyaPay' },
            { status: 400 }
          );
        }

        // Validation et normalisation du numéro
        let normalizedPhone;
        try {
          normalizedPhone = normalizePhoneNumber(phoneNumber);
        } catch (error) {
          return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
          );
        }

        // Génération de la référence de transaction
        const refTransa = generateRefTransa();
        
        // Préparation de la requête WonyaPay
        const wonyaRequest: WonyaPayRequest = {
          RefPartenaire: wonyaConfig.refPartenaire,
          RefTransa: refTransa,
          Montant: amount,
          Devise: currency as 'CDF' | 'USD',
          Action: 'C2B', // Collection (client vers business)
          MobileMoney: normalizedPhone,
          Motif: motif || 'Dépôt portefeuille Kenz'
        };

        // Exécution de la transaction WonyaPay
        const wonyaResponse = await processWonyaPayTransaction(wonyaRequest, wonyaConfig);

        // Création de l'enregistrement de transaction
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

        // Détermination du statut de la transaction
        const isCompleted = wonyaResponse.data?.status === 'completed' || wonyaResponse.data?.status === 'succes';
        const newBalance = isCompleted ? currentBalance + amount : currentBalance;

        const transactionData = {
          id: transactionId,
          type: 'deposit',
          amount,
          currency,
          paymentMethod: 'wonyapay',
          status: isCompleted ? 'completed' : 'pending',
          previousBalance: currentBalance,
          newBalance,
          description: isCompleted 
            ? `Dépôt WonyaPay confirmé (${amount} ${currency})`
            : `Dépôt WonyaPay initié (${amount} ${currency}), en attente de confirmation`,
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          phoneNumber: normalizedPhone,
          provider: 'WonyaPay',
          wonyaPay: {
            refTransa,
            refPartenaire: wonyaConfig.refPartenaire,
            currency,
            motif: wonyaRequest.Motif,
            network: wonyaResponse.data?.network,
            providerTransactionId: wonyaResponse.data?.transactionId,
            providerStatus: wonyaResponse.data?.status,
            rawResponse: wonyaResponse,
          },
        };

        // Sauvegarde de la transaction
        await setDoc(transactionRef, transactionData);

        // Mise à jour du solde si la transaction est complétée
        if (isCompleted) {
          await updateDoc(userRef, {
            walletBalance: newBalance,
            lastTransactionTime: new Date(),
          });
        }

        return NextResponse.json({
          success: true,
          transactionId,
          newBalance,
          amount,
          currency,
          message: wonyaResponse.message || 'Transaction WonyaPay initiée avec succès',
          transactionStatus: isCompleted ? 'completed' : 'pending',
          providerReference: refTransa,
          wonyaPayData: wonyaResponse.data,
        });

      } catch (error) {
        console.error('Erreur WonyaPay:', error);
        return NextResponse.json(
          {
            error: (error as Error).message || 'Erreur lors du traitement WonyaPay',
            ...(isDev ? { details: (error as any)?.stack } : {}),
          },
          { status: 500 }
        );
      }
    }

    // Autres méthodes de paiement (simulation)
    const newBalance = currentBalance + amount;
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

    const transactionData = {
      id: transactionId,
      type: 'deposit',
      amount,
      currency: 'CDF',
      paymentMethod,
      status: 'completed',
      previousBalance: currentBalance,
      newBalance,
      description: `Ajout de fonds via ${paymentMethod}`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      ...(phoneNumber && { phoneNumber }),
    };

    await setDoc(transactionRef, transactionData);
    await updateDoc(userRef, {
      walletBalance: newBalance,
      lastTransactionTime: new Date(),
    });

    return NextResponse.json({
      success: true,
      transactionId,
      newBalance,
      amount,
      currency: 'CDF',
      message: 'Dépôt enregistré avec succès',
      transactionStatus: 'completed',
    });

  } catch (error: any) {
    console.error('Erreur lors du dépôt:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur lors du dépôt',
        ...(isDev ? { details: error.stack } : {}),
      },
      { status: 500 }
    );
  }
}
