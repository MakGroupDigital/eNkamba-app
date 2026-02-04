import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

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
 * POST /api/wallet/withdraw-funds
 * Retire des fonds du portefeuille de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, accountNumber, bankName } = body;

    // Valider les paramètres requis
    if (!userId || !amount || !accountNumber || !bankName) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, accountNumber, bankName requis' },
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
      
      // Vérifier l'utilisateur en lisant son document Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Obtenir le solde actuel
      let currentBalance = 0;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        currentBalance = userData?.walletBalance || 0;
      } else {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      // Vérifier le solde suffisant
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: 'Solde insuffisant pour effectuer ce retrait' },
          { status: 400 }
        );
      }

      const newBalance = currentBalance - amount;
      const transactionId = `WDR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Créer la transaction
      const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

      const transactionData: any = {
        id: transactionId,
        type: 'withdrawal',
        amount,
        accountNumber,
        bankName,
        status: 'pending',
        previousBalance: currentBalance,
        newBalance,
        description: `Retrait vers ${bankName}`,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder la transaction
      await setDoc(transactionRef, transactionData);

      // Mettre à jour le solde du portefeuille (débit immédiat)
      await updateDoc(userRef, {
        walletBalance: newBalance,
        lastTransactionTime: new Date(),
      });

      return NextResponse.json({
        success: true,
        transactionId,
        newBalance,
        amount,
        status: 'pending',
        estimatedTime: '24-48 heures',
        message: 'Retrait initié avec succès',
      });
    } catch (error: any) {
      console.error('Erreur retrait:', error);
      
      return NextResponse.json(
        { error: error.message || 'Erreur lors du retrait' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du retrait:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur lors du retrait',
      },
      { status: 500 }
    );
  }
}
