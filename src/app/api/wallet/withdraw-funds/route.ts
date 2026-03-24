import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  generateWonyaRefTransa,
  getWonyaPayConfig,
  isCompletedWonyaStatus,
  normalizeWonyaPhoneNumber,
} from '@/lib/wonyapay';

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

// Utiliser l'app existante ou en créer une nouvelle
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * POST /api/wallet/withdraw-funds
 * Retire des fonds du portefeuille de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, withdrawalMethod, phoneNumber, currency, agentIdentifier, cardNumber, cardHolder, bankName, accountNumber, accountHolder } = body;

    // Valider les paramètres requis
    if (!userId || !amount || !withdrawalMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, withdrawalMethod requis' },
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

      const transactionId = `WDR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Traitement spécifique pour Mobile Money via WonyaPay B2C
      if (withdrawalMethod === 'mobile_money') {
        const config = getWonyaPayConfig();
        const normalizedPhoneNumber = normalizeWonyaPhoneNumber(phoneNumber || '');
        const withdrawCurrency = currency === 'USD' ? 'USD' : 'CDF';

        if (!config.token || !config.refPartenaire) {
          return NextResponse.json(
            { error: 'Configuration WonyaPay manquante. Vérifiez WONYAPAY_TOKEN et WONYAPAY_REF_PARTENAIRE.' },
            { status: 500 }
          );
        }

        if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
          return NextResponse.json(
            { error: 'Le numéro Mobile Money doit contenir 10 chiffres au format local (ex: 0997654321).' },
            { status: 400 }
          );
        }

        // Calculer le montant à envoyer selon la devise
        let amountToSend = amount;
        let amountToDebit = amount;
        let exchangeRate = 1;

        if (withdrawCurrency === 'USD') {
          try {
            // Récupérer le taux de change USD → CDF
            const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (rateResponse.ok) {
              const rateData = await rateResponse.json();
              exchangeRate = rateData.rates?.CDF || 2800;
              // L'utilisateur reçoit en USD, on débite l'équivalent CDF du portefeuille
              amountToDebit = Math.round(amountToSend * exchangeRate);
            } else {
              exchangeRate = 2800;
              amountToDebit = Math.round(amountToSend * exchangeRate);
            }
          } catch (error) {
            console.error('Erreur récupération taux de change:', error);
            exchangeRate = 2800;
            amountToDebit = Math.round(amountToSend * exchangeRate);
          }

          // Vérifier à nouveau le solde avec le montant converti
          if (currentBalance < amountToDebit) {
            return NextResponse.json(
              { error: `Solde insuffisant. Vous avez besoin de ${amountToDebit.toLocaleString('fr-FR')} CDF pour retirer ${amountToSend} USD` },
              { status: 400 }
            );
          }
        }

        const refTransa = generateWonyaRefTransa();
        const wonyaPayload = {
          RefPartenaire: config.refPartenaire,
          RefTransa: refTransa,
          Montant: amountToSend,
          Devise: withdrawCurrency,
          Action: 'B2C',
          MobileMoney: normalizedPhoneNumber,
          Motif: 'Retrait portefeuille eNkamba',
        };

        const wonyaResponse = await fetch(`${config.baseUrl}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          },
          body: JSON.stringify(wonyaPayload),
        });

        let wonyaResult: any = null;
        try {
          wonyaResult = await wonyaResponse.json();
        } catch {
          wonyaResult = null;
        }

        if (!wonyaResponse.ok) {
          const providerMessage =
            wonyaResult?.message ||
            wonyaResult?.error ||
            `Erreur WonyaPay (${wonyaResponse.status})`;

          return NextResponse.json(
            { error: providerMessage },
            { status: wonyaResponse.status }
          );
        }

        const statutWonya = wonyaResult?.StatutWonya || wonyaResult?.data?.StatutWonya || 'pending';
        const completed = isCompletedWonyaStatus(statutWonya);
        const newBalance = currentBalance - amountToDebit;

        const wonyaPayData: any = {
          refTransa,
          refPartenaire: config.refPartenaire,
          currency: withdrawCurrency,
          action: 'B2C',
          network: wonyaResult?.data?.network || null,
          providerTransactionId: wonyaResult?.data?.transactionId || null,
          providerStatus: statutWonya,
          rawResponse: wonyaResult,
        };

        // Ajouter exchangeRate seulement si USD
        if (withdrawCurrency === 'USD') {
          wonyaPayData.exchangeRate = exchangeRate;
        }

        const transactionData: any = {
          id: transactionId,
          type: 'withdrawal',
          amount: amountToDebit,
          originalAmount: amountToSend,
          originalCurrency: withdrawCurrency,
          withdrawalMethod: 'mobile_money',
          status: completed ? 'completed' : 'pending',
          previousBalance: currentBalance,
          newBalance,
          description: withdrawCurrency === 'USD'
            ? `Retrait Mobile Money (${amountToSend} USD, débit ${amountToDebit.toLocaleString('fr-FR')} CDF)`
            : 'Retrait Mobile Money',
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          phoneNumber: normalizedPhoneNumber,
          provider: 'WonyaPay',
          wonyaPay: wonyaPayData,
        };

        await setDoc(doc(collection(userRef, 'transactions'), transactionId), transactionData);

        // Débiter le portefeuille immédiatement
        await updateDoc(userRef, {
          walletBalance: newBalance,
          lastTransactionTime: new Date(),
        });

        const responseData: any = {
          success: true,
          transactionId,
          newBalance,
          amount: amountToDebit,
          originalAmount: amountToSend,
          originalCurrency: withdrawCurrency,
          message: wonyaResult?.message || 'Retrait Mobile Money initié',
          transactionStatus: completed ? 'completed' : 'pending',
          providerReference: refTransa,
        };

        // Ajouter exchangeRate seulement si USD
        if (withdrawCurrency === 'USD') {
          responseData.exchangeRate = exchangeRate;
        }

        return NextResponse.json(responseData);
      }

      // Autres méthodes de retrait (agent, carte, banque)
      const newBalance = currentBalance - amount;
      const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

      let description = 'Retrait';
      const transactionData: any = {
        id: transactionId,
        type: 'withdrawal',
        amount,
        withdrawalMethod,
        status: 'pending',
        previousBalance: currentBalance,
        newBalance,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

      if (withdrawalMethod === 'agent') {
        description = `Retrait Agent eNkamba - ${agentIdentifier}`;
        transactionData.agentIdentifier = agentIdentifier;
      } else if (withdrawalMethod === 'card') {
        description = `Retrait vers carte **** ${cardNumber?.slice(-4)}`;
        transactionData.cardLast4 = cardNumber?.slice(-4);
        transactionData.cardHolder = cardHolder;
      } else if (withdrawalMethod === 'bank') {
        description = `Retrait bancaire vers ${bankName}`;
        transactionData.bankName = bankName;
        transactionData.accountNumber = accountNumber;
        transactionData.accountHolder = accountHolder;
      }

      transactionData.description = description;

      // Sauvegarder la transaction
      await setDoc(transactionRef, transactionData);

      // Débiter le portefeuille immédiatement
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
        estimatedTime: withdrawalMethod === 'agent' ? '24 heures' : withdrawalMethod === 'card' ? '3-5 jours' : '2-3 jours',
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
