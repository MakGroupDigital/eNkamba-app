import { NextRequest, NextResponse } from 'next/server';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getWonyaPayConfig, isCompletedWonyaStatus } from '@/lib/wonyapay';

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
app = getApps().find((candidate) => candidate.name === 'wallet-wonyapay-reconcile')
  || (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'wallet-wonyapay-reconcile'));

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

    const config = getWonyaPayConfig();
    if (!config.token) {
      return NextResponse.json({ success: true, updated: 0, checked: 0, skipped: true });
    }

    const db = getFirestore(app);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ success: true, updated: 0, checked: 0 });
    }

    const transactionsRef = collection(userRef, 'transactions');
    const pendingQuery = query(
      transactionsRef,
      where('paymentMethod', '==', 'wonyapay'),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    let checked = 0;
    let updated = 0;

    for (const txDoc of pendingSnapshot.docs) {
      const txData = txDoc.data() as any;
      const refTransa = txData?.wonyPay?.refTransa;

      if (!refTransa) continue;
      checked += 1;

      const statusResponse = await fetch(`${config.baseUrl}/transactionStatus/status/${encodeURIComponent(refTransa)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      });

      let statusPayload: any = null;
      try {
        statusPayload = await statusResponse.json();
      } catch {
        statusPayload = null;
      }

      if (!statusResponse.ok) {
        continue;
      }

      const providerStatus =
        statusPayload?.data?.status ||
        statusPayload?.status ||
        txData?.wonyPay?.providerStatus ||
        'pending';

      if (!isCompletedWonyaStatus(providerStatus)) {
        continue;
      }

      await updateDoc(txDoc.ref, {
        status: 'completed',
        description: 'Depot WonyaPay confirme',
        'wonyPay.providerStatus': providerStatus,
        'wonyPay.statusResponse': statusPayload,
        creditedAt: new Date().toISOString(),
      });

      await updateDoc(userRef, {
        walletBalance: increment(txData.amount || 0),
        lastTransactionTime: new Date(),
      });

      const refreshedUserDoc = await getDoc(userRef);
      const refreshedBalance = refreshedUserDoc.data()?.walletBalance || 0;
      await updateDoc(txDoc.ref, {
        newBalance: refreshedBalance,
      });

      updated += 1;
    }

    return NextResponse.json({
      success: true,
      checked,
      updated,
    });
  } catch (error: any) {
    console.error('Erreur reconciliation WonyaPay:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la reconciliation WonyaPay' },
      { status: 500 }
    );
  }
}
