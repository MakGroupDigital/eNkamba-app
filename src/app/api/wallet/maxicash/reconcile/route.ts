import { NextRequest, NextResponse } from 'next/server';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import {
  assertMaxiCashConfig,
  extractMaxiCashStatus,
  getMaxiCashConfig,
  getMaxiCashErrorMessage,
  hasFailedMaxiCashStatus,
  hasSuccessfulMaxiCashStatus,
  isImmediateMaxiCashFailure,
} from '@/lib/maxicash';

export const dynamic = 'force-dynamic';

const MAX_CHECKS_PER_RUN = 6;
const MIN_AGE_SECONDS = 10;
const MIN_RECHECK_SECONDS = 20;
const FAIL_AFTER_SECONDS = 15 * 60;

function getFirebaseApp() {
  const config = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const existingApp = getApps().find((candidate) => candidate.name === 'wallet-maxicash-reconcile');
  if (existingApp) return existingApp;

  return getApps().length > 0 ? getApp() : initializeApp(config, 'wallet-maxicash-reconcile');
}

async function checkPaymentStatusByReference(reference: string, transactionId?: string | null) {
  const config = getMaxiCashConfig();
  assertMaxiCashConfig(config);

  const payload = {
    MerchantID: config.merchantId,
    MerchantPassword: config.merchantPassword,
    Reference: reference,
    TransactionID: transactionId || '',
  };

  const postResponse = await fetch(config.checkPaymentStatusByReferenceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const postPayload = await postResponse.json().catch(() => null);
  if (postResponse.ok && postPayload) return postPayload;

  const url = new URL(config.checkPaymentStatusByReferenceUrl);
  url.searchParams.set('MerchantID', config.merchantId);
  url.searchParams.set('MerchantPassword', config.merchantPassword);
  url.searchParams.set('Reference', reference);
  if (transactionId) url.searchParams.set('TransactionID', transactionId);

  const getResponse = await fetch(url.toString(), { method: 'GET' });
  const getPayload = await getResponse.json().catch(() => null);
  if (!getResponse.ok) {
    return postPayload || getPayload || { ResponseStatus: 'Failed', ResponseError: `Status check failed (${getResponse.status})` };
  }

  return getPayload;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const db = getFirestore(getFirebaseApp());
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return NextResponse.json({ success: true, checked: 0, updated: 0, failed: 0 });
    }

    const transactionsRef = collection(userRef, 'transactions');
    const txSnapshot = await getDocs(query(transactionsRef, orderBy('timestamp', 'desc'), limit(150)));

    let checked = 0;
    let updated = 0;
    let failed = 0;

    const nowMs = Date.now();
    let checksUsed = 0;

    for (const txDoc of txSnapshot.docs) {
      if (checksUsed >= MAX_CHECKS_PER_RUN) break;

      const txData = txDoc.data() as any;
      const reference = txData?.maxicash?.reference;
      const providerTransactionId = txData?.maxicash?.providerTransactionId || txData?.maxicash?.lastPayload?.TransactionID || '';
      // Backward compatible: older tx may not have `paymentMethod === 'enkambapay'` but still have MaxiCash fields.
      const isMaxiCashDeposit =
        txData.type === 'deposit' &&
        (txData.paymentMethod === 'enkambapay' || txData.provider === 'MaxiCash' || Boolean(txData?.maxicash));
      const canReconcile = txData.status === 'pending' || txData.status === 'failed';

      if (!isMaxiCashDeposit || !canReconcile || !reference) continue;

      const txTimestamp =
        txData?.timestamp?.toMillis?.() ??
        (txData?.createdAt ? new Date(txData.createdAt).getTime() : 0);
      const ageSeconds = txTimestamp ? (nowMs - txTimestamp) / 1000 : 0;
      if (ageSeconds > 0 && ageSeconds < MIN_AGE_SECONDS) continue;

      const lastCheckIso = txData?.maxicash?.lastStatusCheckAt || txData?.maxicash?.lastStatusCheckAt;
      const lastCheckMs = lastCheckIso ? new Date(String(lastCheckIso)).getTime() : 0;
      if (lastCheckMs && (nowMs - lastCheckMs) / 1000 < MIN_RECHECK_SECONDS) continue;

      checked += 1;
      checksUsed += 1;
      const statusPayload = await checkPaymentStatusByReference(reference, providerTransactionId);
      const status = extractMaxiCashStatus(statusPayload);
      const providerTransactionIdFromStatus = statusPayload?.TransactionID || providerTransactionId || null;
      const updateData = {
        'maxicash.statusCheckPayload': statusPayload,
        'maxicash.statusCheckStatus': status || null,
        'maxicash.lastStatusCheckAt': new Date().toISOString(),
        'maxicash.providerTransactionId': providerTransactionIdFromStatus,
        updatedAt: new Date().toISOString(),
      };

      if (hasSuccessfulMaxiCashStatus(statusPayload, status)) {
        const result = await runTransaction(db, async (firestoreTx) => {
          const [freshUserSnap, freshTxSnap] = await Promise.all([
            firestoreTx.get(userRef),
            firestoreTx.get(txDoc.ref),
          ]);
          const freshTxData = freshTxSnap.data() as any;

          if (freshTxData?.status === 'completed') {
            return { alreadyCompleted: true };
          }

          const amountToCredit = Number(freshTxData?.amount || txData.amount || 0);
          const currentBalance = Number(freshUserSnap.data()?.walletBalance || 0);
          const newBalance = currentBalance + amountToCredit;

          firestoreTx.update(userRef, {
            walletBalance: newBalance,
            lastTransactionTime: new Date(),
          });

          firestoreTx.update(txDoc.ref, {
            ...updateData,
            status: 'completed',
            newBalance,
            description: `Dépôt eNkambaPay confirmé via ${freshTxData?.maxicash?.partnerLabel || txData?.maxicash?.partnerLabel || 'MaxiCash'}`,
            completedAt: new Date().toISOString(),
            creditedAt: new Date().toISOString(),
          });

          return { alreadyCompleted: false };
        });

        if (!result.alreadyCompleted) updated += 1;
        continue;
      }

      if (hasFailedMaxiCashStatus(statusPayload, status)) {
        // MaxiCash sometimes reports intermediate / inconsistent failure states during operator confirmation.
        // We only mark failed immediately for auth/config errors. Otherwise we keep pending for a while.
        if (isImmediateMaxiCashFailure(statusPayload, status)) {
          await updateDoc(txDoc.ref, {
            ...updateData,
            status: 'failed',
            description: `Échec eNkambaPay: ${getMaxiCashErrorMessage(statusPayload, 'Paiement refusé')}`,
            failedAt: new Date().toISOString(),
          });
          failed += 1;
          continue;
        }

        const isOldEnoughToFail = ageSeconds > 0 && ageSeconds >= FAIL_AFTER_SECONDS;
        if (!isOldEnoughToFail) {
          await updateDoc(txDoc.ref, {
            ...updateData,
            status: 'pending',
            description: txData?.description || 'Dépôt eNkambaPay en attente de confirmation',
          });
          continue;
        }

        await updateDoc(txDoc.ref, {
          ...updateData,
          status: 'failed',
          description: `Échec eNkambaPay: ${getMaxiCashErrorMessage(statusPayload, 'Paiement refusé')}`,
          failedAt: new Date().toISOString(),
        });
        failed += 1;
      } else {
        await updateDoc(txDoc.ref, updateData);
      }
    }

    return NextResponse.json({ success: true, checked, updated, failed });
  } catch (error: any) {
    console.error('Erreur reconciliation MaxiCash:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la reconciliation MaxiCash' },
      { status: 500 }
    );
  }
}
