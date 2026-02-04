import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Initialiser Firebase avec la config publique
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.log('Firebase already initialized');
}

/**
 * POST /api/wallet/add-funds
 * Ajoute des fonds au portefeuille de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, phoneNumber, cardDetails } = body;

    // Valider les paramètres requis
    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, paymentMethod requis' },
        { status: 400 }
      );
    }

    // Valider le montant
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const db = getFirestore(app);
      
      // Vérifier le token en obtenant les infos utilisateur depuis Firestore
      // (Si l'utilisateur ne peut pas lire son propre document, le token est invalide)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Obtenir le solde actuel
      let currentBalance = 0;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        currentBalance = userData?.walletBalance || 0;
      } else {
        // Créer le document utilisateur s'il n'existe pas
        await setDoc(userRef, {
          uid: userId,
          walletBalance: 0,
          createdAt: new Date().toISOString(),
        });
      }

      const newBalance = currentBalance + amount;
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer la transaction
      const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

      const transactionData: any = {
        id: transactionId,
        type: 'deposit',
        amount,
        paymentMethod,
        status: 'completed',
        previousBalance: currentBalance,
        newBalance,
        description: `Ajout de fonds via ${
          paymentMethod === 'mobile_money'
            ? 'Mobile Money'
            : paymentMethod === 'credit_card'
            ? 'Carte de crédit'
            : 'Carte de débit'
        }`,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

      // Ajouter les détails spécifiques
      if (paymentMethod === 'mobile_money' && phoneNumber) {
        transactionData.phoneNumber = phoneNumber;
      } else if (paymentMethod !== 'mobile_money' && cardDetails) {
        transactionData.cardLast4 = cardDetails.cardNumber?.slice(-4) || '';
        transactionData.cardHolder = cardDetails.cardholderName || '';
      }

      // Sauvegarder la transaction
      await setDoc(transactionRef, transactionData);

      // Mettre à jour le solde du portefeuille
      await updateDoc(userRef, {
        walletBalance: newBalance,
        lastTransactionTime: new Date(),
      });

      return NextResponse.json({
        success: true,
        transactionId,
        newBalance,
        amount,
        message: 'Dépôt enregistré avec succès',
      });
    } catch (error: any) {
      console.error('Erreur dépôt:', error);
      
      return NextResponse.json(
        { error: error.message || 'Erreur lors du dépôt' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du dépôt:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors du dépôt',
      },
      { status: 500 }
    );
  }
}
