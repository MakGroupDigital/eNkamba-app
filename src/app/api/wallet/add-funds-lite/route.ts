import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import {
  generateRefTransa,
  getWonyaPayConfig,
  isCompletedWonyaStatus,
  normalizePhoneNumber,
} from '@/lib/wonyapay';

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === 'wallet-add-funds-lite');
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

  return initializeApp(config, 'wallet-add-funds-lite');
}

/**
 * Fallback route when Firebase Admin SDK is not available.
 * Note: this is less strict security-wise; keep it for dev / breakglass.
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  
  try {
    const body = await request.json();
    const { userId, amount, paymentMethod, phoneNumber, cardDetails, wonyaDetails } = body;

    if (!userId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Paramètres manquants: userId, amount, paymentMethod requis' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à 0' }, { status: 400 });
    }

    // Utilisation du SDK client Firebase (temporaire)
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    
    let userDoc;
    try {
      userDoc = await getDoc(userRef);
    } catch (error) {
      console.error('Erreur lecture userDoc add-funds-lite:', error);
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

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

    if (paymentMethod === 'wonyapay') {
      const config = getWonyaPayConfig();
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber || '');
      const currency = wonyaDetails?.currency === 'USD' ? 'USD' : 'CDF';
      const motif = wonyaDetails?.motif?.trim() || 'Depot portefeuille Kenz';

      if (!config.token || !config.refPartenaire) {
        return NextResponse.json(
          { error: 'Configuration WonyaPay manquante. Vérifiez WONYAPAY_TOKEN et WONYAPAY_REF_PARTENAIRE.' },
          { status: 500 }
        );
      }

      if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
        return NextResponse.json(
          { error: 'Le numéro WonyaPay doit contenir 10 chiffres au format local (ex: 0997654321).' },
          { status: 400 }
        );
      }

      // Créer tout de suite une transaction pending pour l'UI (attente), puis on la met à jour après WonyaPay.
      await setDoc(transactionRef, {
        id: transactionId,
        type: 'deposit',
        amount: 0, // sera recalculé/écrit après conversion (USD -> CDF) si nécessaire
        originalAmount: amount,
        originalCurrency: currency,
        paymentMethod,
        status: 'pending',
        previousBalance: currentBalance,
        newBalance: currentBalance,
        description: 'Dépôt Mobile Money initié, en attente de confirmation',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        phoneNumber: normalizedPhoneNumber,
        provider: 'WonyaPay',
      });

      let amountInCDF = amount;
      let exchangeRate = 1;
      if (currency === 'USD') {
        try {
          const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          if (rateResponse.ok) {
            const rateData = await rateResponse.json();
            exchangeRate = rateData.rates?.CDF || 2800;
            amountInCDF = Math.round(amount * exchangeRate);
          } else {
            exchangeRate = 2800;
            amountInCDF = Math.round(amount * exchangeRate);
          }
        } catch {
          exchangeRate = 2800;
          amountInCDF = Math.round(amount * exchangeRate);
        }
      }

      let wonyaResult: any = null;
      let wonyaResponse: Response | null = null;
      let attempt = 0;
      let refTransa = '';
      do {
        attempt += 1;
        refTransa = generateRefTransa();
        const wonyaPayload = {
          RefPartenaire: config.refPartenaire,
          RefTransa: refTransa,
          Montant: amount,
          Devise: currency,
          Action: 'C2B',
          MobileMoney: normalizedPhoneNumber,
          Motif: motif,
        };

        wonyaResponse = await fetch(`${config.baseUrl}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          },
          body: JSON.stringify(wonyaPayload),
        });

        try {
          wonyaResult = await wonyaResponse.json();
        } catch {
          wonyaResult = null;
        }

        if (!wonyaResponse.ok && wonyaResponse.status === 409 && attempt < 3) continue;
        break;
      } while (attempt < 3);

      if (!wonyaResponse || !wonyaResponse.ok) {
        const providerMessage =
          wonyaResult?.message || wonyaResult?.error || `Erreur WonyaPay (${wonyaResponse?.status ?? '??'})`;
        try {
          await updateDoc(transactionRef, {
            status: 'failed',
            amount: amountInCDF,
            description: `Échec: ${providerMessage}`,
            failedAt: new Date().toISOString(),
            wonyaPay: {
              ...(currency === 'USD' ? { exchangeRate } : {}),
              currency,
              motif,
              providerStatus: 'failed',
              rawResponse: wonyaResult,
            },
          });
        } catch {
          // best-effort
        }
        return NextResponse.json({ error: providerMessage }, { status: wonyaResponse?.status || 500 });
      }

      const providerStatus =
        wonyaResult?.StatutWonya ||
        wonyaResult?.data?.StatutWonya ||
        wonyaResult?.status ||
        wonyaResult?.data?.status ||
        'pending';

      const completed = isCompletedWonyaStatus(providerStatus);
      const walletBalanceAfterPayment = completed ? currentBalance + amountInCDF : currentBalance;

      const wonyaPayData: any = {
        refTransa,
        refPartenaire: config.refPartenaire,
        currency,
        motif,
        network: wonyaResult?.data?.network || null,
        providerTransactionId: wonyaResult?.data?.transactionId || null,
        providerStatus,
        rawResponse: wonyaResult,
      };
      if (currency === 'USD') {
        wonyaPayData.exchangeRate = exchangeRate;
      }

      // Mise à jour de la transaction + crédit du solde (si confirmé) via une transaction Firestore
      // pour éviter les soucis de concurrence / doubles crédits.
      if (completed) {
        const committed = await runTransaction(db, async (tx) => {
          const [freshUser, freshTx] = await Promise.all([tx.get(userRef), tx.get(transactionRef)]);
          const alreadyCompleted = freshTx.exists() && (freshTx.data() as any)?.status === 'completed';
          if (alreadyCompleted) {
            return (freshUser.data() as any)?.walletBalance || currentBalance;
          }

          const baseBalance = (freshUser.data() as any)?.walletBalance || 0;
          const newBalance = baseBalance + amountInCDF;

          tx.update(userRef, {
            walletBalance: newBalance,
            lastTransactionTime: new Date(),
          });

          tx.update(transactionRef, {
            amount: amountInCDF,
            status: 'completed',
            newBalance,
            description:
              currency === 'USD'
                ? `Dépôt Mobile Money confirmé (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF)`
                : 'Dépôt Mobile Money confirmé',
            wonyaPay: wonyaPayData,
          });

          return newBalance;
        });

        const responseData: any = {
          success: true,
          transactionId,
          newBalance: committed,
          amount: amountInCDF,
          originalAmount: amount,
          originalCurrency: currency,
          message: wonyaResult?.message || 'Paiement confirmé',
          transactionStatus: 'completed',
          providerReference: refTransa,
        };
        if (currency === 'USD') responseData.exchangeRate = exchangeRate;
        return NextResponse.json(responseData);
      }

      // Si pending: on met à jour la transaction, le crédit sera fait par /api/wallet/wonyapay/reconcile.
      await updateDoc(transactionRef, {
        amount: amountInCDF,
        status: 'pending',
        newBalance: currentBalance,
        description:
          currency === 'USD'
            ? `Dépôt Mobile Money initié (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF), en attente`
            : 'Dépôt Mobile Money initié, en attente de confirmation',
        wonyaPay: wonyaPayData,
      });

      const responseData: any = {
        success: true,
        transactionId,
        newBalance: walletBalanceAfterPayment,
        amount: amountInCDF,
        originalAmount: amount,
        originalCurrency: currency,
        message: wonyaResult?.message || 'Transaction WonyaPay initiée',
        transactionStatus: 'pending',
        providerReference: refTransa,
      };
      if (currency === 'USD') {
        responseData.exchangeRate = exchangeRate;
      }
      return NextResponse.json(responseData);
    }

    const newBalance = currentBalance + amount;
    
    const transactionData: any = {
      id: transactionId,
      type: 'deposit',
      amount,
      paymentMethod,
      status: 'completed',
      previousBalance: currentBalance,
      newBalance,
      description: 'Dépôt enregistré avec succès',
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
    };

    // Ajouter les champs optionnels seulement s'ils existent
    if (paymentMethod === 'mobile_money' && phoneNumber) {
      transactionData.phoneNumber = phoneNumber;
    }
    if (cardDetails?.cardNumber) {
      transactionData.cardLast4 = cardDetails.cardNumber.slice(-4);
    }
    if (cardDetails?.cardholderName) {
      transactionData.cardHolder = cardDetails.cardholderName;
    }

    await setDoc(transactionRef, transactionData);

    await updateDoc(userRef, { 
      walletBalance: newBalance, 
      lastTransactionTime: new Date() 
    });
    return NextResponse.json({
      success: true,
      transactionId,
      newBalance,
      amount,
      message: 'Dépôt enregistré avec succès',
      transactionStatus: 'completed',
    });
  } catch (error: any) {
    console.error('Erreur add-funds-lite:', error);
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 });
  }
}
