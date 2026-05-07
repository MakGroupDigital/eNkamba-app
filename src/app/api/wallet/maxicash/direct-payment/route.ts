import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { collection, doc, getDoc, getFirestore, runTransaction, setDoc } from 'firebase/firestore';
import {
  assertMaxiCashConfig,
  extractMaxiCashStatus,
  generateMaxiCashReference,
  getMaxiCashConfig,
  getMaxiCashErrorMessage,
  hasFailedMaxiCashStatus,
  hasSuccessfulMaxiCashStatus,
  isImmediateMaxiCashFailure,
  isPendingMaxiCashStatus,
  toMaxiCashCents,
} from '@/lib/maxicash';
import { convertUsdToCdf } from '@/lib/exchange-rate';

const MAXICASH_PAY_TYPES = {
  maxicash: 0,
  airtel: 1,
  mpesa: 2,
  orange: 3,
  // MaxiCash PaymentType enum: AfricellDRC = 52 (4 = MaxiCashCard)
  africell: 52,
} as const;

type MaxiCashPartner = keyof typeof MAXICASH_PAY_TYPES;

const PARTNER_LABELS: Record<MaxiCashPartner, string> = {
  maxicash: 'MaxiCash',
  airtel: 'Airtel Money',
  mpesa: 'M-Pesa',
  orange: 'Orange Money',
  africell: 'Africell Money',
};

export const dynamic = 'force-dynamic';

function normalizeCongolesePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('243')) return digits;
  if (digits.startsWith('0')) return `243${digits.slice(1)}`;
  return digits;
}

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === 'wallet-maxicash-direct-payment');
  if (existing) return existing;

  return initializeApp(
    {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    'wallet-maxicash-direct-payment'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.userId || '');
    const amount = Number(body.amount || 0);
    const telephone = normalizeCongolesePhone(String(body.telephone || ''));
    const email = String(body.email || '').trim();
    const partner = String(body.partner || 'airtel') as MaxiCashPartner;

    if (!userId || !amount || amount <= 0 || !telephone) {
      return NextResponse.json({ error: 'Paramètres eNkambaPay invalides.' }, { status: 400 });
    }

    if (!(partner in MAXICASH_PAY_TYPES)) {
      return NextResponse.json({ error: 'Partenaire de paiement non pris en charge.' }, { status: 400 });
    }

    const config = getMaxiCashConfig();
    assertMaxiCashConfig(config);

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.exists() ? Number(userSnap.data()?.walletBalance || 0) : 0;

    if (!userSnap.exists()) {
      await setDoc(userRef, { uid: userId, walletBalance: 0, createdAt: new Date().toISOString() });
    }

    const transactionId = `MXC-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const reference = generateMaxiCashReference(userId);
    const amountInCdf = (await convertUsdToCdf(amount)).cdfAmount;
    const amountInCents = String(toMaxiCashCents(amount));
    const payType = MAXICASH_PAY_TYPES[partner];
    const partnerLabel = PARTNER_LABELS[partner];
    const transactionRef = doc(collection(userRef, 'transactions'), transactionId);

    await setDoc(transactionRef, {
      id: transactionId,
      type: 'deposit',
      amount: amountInCdf,
      originalAmount: amount,
      originalCurrency: 'USD',
      paymentMethod: 'enkambapay',
      status: 'pending',
      previousBalance: currentBalance,
      newBalance: currentBalance,
      description: `Dépôt eNkambaPay initié via ${partnerLabel} (${amount} USD)`,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      phoneNumber: telephone,
      email: email || null,
      provider: 'MaxiCash',
      maxicash: {
        environment: config.environment,
        reference,
        integration: 'PayNowSync',
        endpoint: config.payNowSyncUrl,
        partner,
        partnerLabel,
        payType,
      },
    });

    const payload = {
      RequestData: {
        Amount: amountInCents,
        Reference: reference,
        Telephone: telephone,
      },
      MerchantID: config.merchantId,
      MerchantPassword: config.merchantPassword,
      PayType: payType,
      CurrencyCode: 'USD',
    };

    const response = await fetch(config.payNowSyncUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    const responseStatus = extractMaxiCashStatus(data, data?.ResponseStatus);
    const providerTransactionId = data?.TransactionID || null;

    if (!response.ok) {
      await runTransaction(db, async (tx) => {
        tx.update(transactionRef, {
          status: 'failed',
          failedAt: new Date().toISOString(),
          description: `Dépôt eNkambaPay refusé via ${partnerLabel}`,
          'maxicash.lastPayload': data,
          'maxicash.lastStatus': responseStatus || null,
          'maxicash.providerTransactionId': providerTransactionId,
        });
      });

      return NextResponse.json(
        { error: data?.ResponseError || 'eNkambaPay n’a pas pu initier le paiement.', providerResponse: data },
        { status: 502 }
      );
    }

    const result = await runTransaction(db, async (tx) => {
      const [freshUserSnap, freshTxSnap] = await Promise.all([tx.get(userRef), tx.get(transactionRef)]);
      const transaction = freshTxSnap.data() as any;
      const freshBalance = Number(freshUserSnap.data()?.walletBalance || 0);
      const updateData = {
        'maxicash.lastPayload': data,
        'maxicash.lastStatus': responseStatus || null,
        'maxicash.providerTransactionId': providerTransactionId,
        updatedAt: new Date().toISOString(),
      };

      if (hasSuccessfulMaxiCashStatus(data, responseStatus)) {
        if (transaction.status === 'completed') {
          return { transactionStatus: 'completed', newBalance: Number(transaction.newBalance || freshBalance) };
        }

        const newBalance = freshBalance + amountInCdf;
        tx.update(userRef, { walletBalance: newBalance, lastTransactionTime: new Date() });
        tx.update(transactionRef, {
          ...updateData,
          status: 'completed',
          newBalance,
          completedAt: new Date().toISOString(),
          description: `Dépôt eNkambaPay confirmé via ${partnerLabel}`,
        });
        return { transactionStatus: 'completed', newBalance };
      }

      if (hasFailedMaxiCashStatus(data, responseStatus) && isImmediateMaxiCashFailure(data, responseStatus)) {
        tx.update(transactionRef, {
          ...updateData,
          status: 'failed',
          failedAt: new Date().toISOString(),
          description: `Dépôt eNkambaPay refusé via ${partnerLabel}`,
        });
        return { transactionStatus: 'failed', newBalance: freshBalance };
      }

      tx.update(transactionRef, {
        ...updateData,
        status: isPendingMaxiCashStatus(responseStatus) ? 'pending' : 'pending',
        description: `Dépôt eNkambaPay en attente de confirmation via ${partnerLabel}`,
      });
      return { transactionStatus: 'pending', newBalance: freshBalance };
    });

    return NextResponse.json({
      success: result.transactionStatus !== 'failed',
      error: result.transactionStatus === 'failed'
        ? getMaxiCashErrorMessage(data, 'Paiement eNkambaPay refusé.')
        : '',
      transactionId,
      reference,
      providerTransactionId,
      partner,
      partnerLabel,
      responseStatus,
      providerResponse: data,
      ...result,
    }, { status: result.transactionStatus === 'failed' ? 502 : 200 });
  } catch (error: any) {
    console.error('Erreur paiement direct MaxiCash:', error);
    return NextResponse.json({ error: error?.message || 'Erreur eNkambaPay' }, { status: 500 });
  }
}
