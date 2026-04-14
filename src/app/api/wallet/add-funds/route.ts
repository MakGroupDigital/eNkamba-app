import { NextRequest, NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminConfig } from '@/lib/decode-secrets';
import {
  generateWonyaRefTransa,
  getWonyaPayConfig,
  isCompletedWonyaStatus,
  normalizeWonyaPhoneNumber,
} from '@/lib/wonyapay';

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

/**
 * POST /api/wallet/add-funds
 * Ajoute des fonds au portefeuille de l'utilisateur.
 */
export async function POST(request: NextRequest) {
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

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    let adminApp;
    try {
      adminApp = getFirebaseAdminApp();
    } catch (error) {
      console.error('Erreur initialisation Firebase add-funds:', error);
      return NextResponse.json(
        { error: 'Initialisation Firebase impossible pour add-funds' },
        { status: 500 }
      );
    }

    try {
      const decoded = await getAuth(adminApp).verifyIdToken(token);
      if (decoded.uid !== userId) {
        return NextResponse.json({ error: 'Token invalide pour cet utilisateur' }, { status: 403 });
      }
    } catch (error) {
      console.error('Erreur verification token add-funds:', error);
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = getFirestore(adminApp);
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    let currentBalance = 0;
    if (userDoc.exists) {
      const data = userDoc.data();
      currentBalance = (data?.walletBalance as number) || 0;
    } else {
      await userRef.set({
        uid: userId,
        walletBalance: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = userRef.collection('transactions').doc(transactionId);

    if (paymentMethod === 'wonyapay') {
      const config = getWonyaPayConfig();
      const normalizedPhoneNumber = normalizeWonyaPhoneNumber(phoneNumber || '');
      const currency = wonyaDetails?.currency === 'USD' ? 'USD' : 'CDF';
      const motif = wonyaDetails?.motif?.trim() || 'Depot portefeuille eNkamba';

      if (!config.token || !config.refPartenaire) {
        return NextResponse.json(
          {
            error:
              'Configuration WonyaPay manquante. Vérifiez WONYAPAY_TOKEN et WONYAPAY_REF_PARTENAIRE.',
          },
          { status: 500 }
        );
      }

      if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
        return NextResponse.json(
          { error: 'Le numéro WonyaPay doit contenir 10 chiffres au format local (ex: 0997654321).' },
          { status: 400 }
        );
      }

      // Si la devise est USD, convertir en CDF pour le crédit du portefeuille
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
        } catch (error) {
          console.error('Erreur récupération taux de change:', error);
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
        refTransa = generateWonyaRefTransa();
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

        if (!wonyaResponse.ok && wonyaResponse.status === 409 && attempt < 3) {
          continue;
        }

        break;
      } while (attempt < 3);

      if (!wonyaResponse || !wonyaResponse.ok) {
        const providerMessage =
          wonyaResult?.message ||
          wonyaResult?.error ||
          `Erreur WonyaPay (${wonyaResponse?.status ?? '??'})`;

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

      const transactionData: any = {
        id: transactionId,
        type: 'deposit',
        amount: amountInCDF,
        originalAmount: amount,
        originalCurrency: currency,
        paymentMethod,
        status: completed ? 'completed' : 'pending',
        previousBalance: currentBalance,
        newBalance: walletBalanceAfterPayment,
        description: completed
          ? currency === 'USD'
            ? `Depot WonyaPay confirme (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF)`
            : 'Depot WonyaPay confirme'
          : currency === 'USD'
            ? `Depot WonyaPay initie (${amount} USD → ${amountInCDF.toLocaleString('fr-FR')} CDF), en attente`
            : 'Depot WonyaPay initie, en attente de confirmation',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        phoneNumber: normalizedPhoneNumber,
        provider: 'WonyaPay',
        wonyaPay: wonyaPayData,
      };

      await transactionRef.set(transactionData);

      if (completed) {
        await userRef.set(
          {
            walletBalance: walletBalanceAfterPayment,
            lastTransactionTime: new Date(),
          },
          { merge: true }
        );
      }

      const responseData: any = {
        success: true,
        transactionId,
        newBalance: walletBalanceAfterPayment,
        amount: amountInCDF,
        originalAmount: amount,
        originalCurrency: currency,
        message: wonyaResult?.message || 'Transaction WonyaPay initiée',
        transactionStatus: completed ? 'completed' : 'pending',
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

    if (paymentMethod === 'mobile_money' && phoneNumber) {
      transactionData.phoneNumber = phoneNumber;
    } else if (paymentMethod !== 'mobile_money' && cardDetails) {
      transactionData.cardLast4 = cardDetails.cardNumber?.slice(-4) || '';
      transactionData.cardHolder = cardDetails.cardholderName || '';
    }

    await transactionRef.set(transactionData);
    await userRef.set(
      {
        walletBalance: newBalance,
        lastTransactionTime: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      transactionId,
      newBalance,
      amount,
      message: 'Dépôt enregistré avec succès',
      transactionStatus: 'completed',
    });
  } catch (error: any) {
    console.error('Erreur lors du dépôt:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du dépôt' }, { status: 500 });
  }
}

