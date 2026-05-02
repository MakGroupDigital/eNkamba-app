import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getFirestore, runTransaction } from 'firebase/firestore';
import { extractMaxiCashStatus, isFailedMaxiCashStatus, isSuccessfulMaxiCashStatus } from '@/lib/maxicash';

function getFirebaseApp() {
  const existing = getApps().find((app) => app.name === 'wallet-maxicash-notify');
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
    'wallet-maxicash-notify'
  );
}

async function parsePayload(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  if (request.method === 'GET') return query;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return { ...query, ...(await request.json()) };
    }
    const formData = await request.formData();
    return { ...query, ...Object.fromEntries(formData.entries()) };
  } catch {
    return query;
  }
}

async function handleNotification(request: NextRequest) {
  const payload = await parsePayload(request);
  const userId = String(payload.userId || '');
  const transactionId = String(payload.transactionId || '');
  const explicitStatus = String(payload.status || '');
  const status = extractMaxiCashStatus(payload, explicitStatus);

  if (!userId || !transactionId) {
    return NextResponse.json({ error: 'Paramètres eNkambaPay manquants.' }, { status: 400 });
  }

  const app = getFirebaseApp();
  const db = getFirestore(app);
  const userRef = doc(db, 'users', userId);
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);

  const result = await runTransaction(db, async (tx) => {
    const [userSnap, txSnap] = await Promise.all([tx.get(userRef), tx.get(transactionRef)]);
    if (!txSnap.exists()) throw new Error('Transaction eNkambaPay introuvable.');

    const transaction = txSnap.data() as any;
    const currentBalance = Number(userSnap.data()?.walletBalance || 0);
    const amount = Number(transaction.amount || 0);
    const updateData = {
      'maxicash.lastPayload': payload,
      'maxicash.lastStatus': status || null,
      updatedAt: new Date().toISOString(),
    };

    if (isSuccessfulMaxiCashStatus(status)) {
      if (transaction.status === 'completed') {
        return { transactionStatus: 'completed', newBalance: Number(transaction.newBalance || currentBalance) };
      }

      const newBalance = currentBalance + amount;
      tx.update(userRef, { walletBalance: newBalance, lastTransactionTime: new Date() });
      tx.update(transactionRef, {
        ...updateData,
        status: 'completed',
        newBalance,
        completedAt: new Date().toISOString(),
        description: 'Dépôt eNkambaPay confirmé',
      });
      return { transactionStatus: 'completed', newBalance };
    }

    if (isFailedMaxiCashStatus(status)) {
      tx.update(transactionRef, {
        ...updateData,
        status: 'failed',
        failedAt: new Date().toISOString(),
        description: 'Dépôt eNkambaPay refusé ou annulé',
      });
      return { transactionStatus: 'failed', newBalance: currentBalance };
    }

    tx.update(transactionRef, updateData);
    return { transactionStatus: transaction.status || 'pending', newBalance: currentBalance };
  });

  return NextResponse.json({ success: true, ...result });
}

export async function GET(request: NextRequest) {
  return handleNotification(request);
}

export async function POST(request: NextRequest) {
  return handleNotification(request);
}
