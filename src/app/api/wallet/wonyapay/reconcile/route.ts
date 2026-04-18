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
  serverTimestamp,
} from 'firebase/firestore';
import { getWonyaPayConfig, isCompletedWonyaStatus, isFailedWonyaStatus } from '@/lib/wonyapay';

function getFirebaseApp() {
  try {
    const config = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!config.projectId || !config.apiKey) {
      throw new Error('Variables Firebase manquantes');
    }

    const existingApp = getApps().find((candidate) => candidate.name === 'wallet-wonyapay-reconcile');
    if (existingApp) return existingApp;
    
    return getApps().length > 0 ? getApp() : initializeApp(config, 'wallet-wonyapay-reconcile');
  } catch (error) {
    console.error('Erreur initialisation Firebase wonyapay reconcile:', error);
    throw new Error('Initialisation Firebase impossible pour wonyapay reconcile');
  }
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

    // Vérifier la configuration WonyaPay avec gestion d'erreur
    let config;
    try {
      config = getWonyaPayConfig();
      if (!config.token || !config.baseUrl) {
        console.log('Configuration WonyaPay incomplète, skip reconciliation');
        return NextResponse.json({ success: true, updated: 0, checked: 0, skipped: true });
      }
    } catch (error) {
      console.error('Erreur configuration WonyaPay:', error);
      return NextResponse.json({ success: true, updated: 0, checked: 0, skipped: true });
    }

    const db = getFirestore(getFirebaseApp());
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ success: true, updated: 0, checked: 0 });
    }

    const transactionsRef = collection(userRef, 'transactions');
    
    // Récupérer les transactions en attente (dépôts et retraits)
    const pendingDepositQuery = query(
      transactionsRef,
      where('paymentMethod', '==', 'wonyapay'),
      where('status', '==', 'pending')
    );
    const pendingWithdrawalQuery = query(
      transactionsRef,
      where('withdrawalMethod', '==', 'mobile_money'),
      where('status', '==', 'pending')
    );
    
    const [depositSnapshot, withdrawalSnapshot] = await Promise.all([
      getDocs(pendingDepositQuery),
      getDocs(pendingWithdrawalQuery)
    ]);
    
    const pendingSnapshot = {
      docs: [...depositSnapshot.docs, ...withdrawalSnapshot.docs]
    };

    let checked = 0;
    let updated = 0;
    let failed = 0;

    const now = Date.now();

    for (const txDoc of pendingSnapshot.docs) {
      const txData = txDoc.data() as any;
      const refTransa = txData?.wonyaPay?.refTransa;

      if (!refTransa) continue;

      // Vérifier si la transaction a eu le temps de remonter côté opérateur (évite de spammer trop tôt)
      const txTimestamp =
        txData?.timestamp?.toMillis?.() ??
        (txData?.createdAt ? new Date(txData.createdAt).getTime() : 0);
      const ageInMinutes = (now - txTimestamp) / (1000 * 60);

      // Ne vérifier que les transactions de plus de ~15s
      if (ageInMinutes < 0.25) {
        continue;
      }

      checked += 1;

      try {
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
          // Si l'API retourne une erreur après 5 minutes, marquer comme échouée
          if (ageInMinutes >= 5) {
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: `Échec: Impossible de vérifier le statut (${statusResponse.status})`,
              'wonyaPay.providerStatus': 'failed',
              'wonyaPay.errorResponse': statusPayload,
              failedAt: new Date().toISOString(),
            });
            failed += 1;
          }
          continue;
        }

        // Structure réelle de l'API WonyaPay selon la documentation
        const statutWonya =
          statusPayload?.StatutWonya ||
          statusPayload?.data?.StatutWonya ||
          statusPayload?.status ||
          statusPayload?.data?.status ||
          '';
        const statutTransa =
          statusPayload?.StatutTransa ||
          statusPayload?.data?.StatutTransa ||
          statusPayload?.transactionStatus ||
          statusPayload?.data?.transactionStatus ||
          '';
        const refTransaResponse = statusPayload?.RefTransa || statusPayload?.data?.RefTransa || null;
        const dateTransa = statusPayload?.DateTransa || statusPayload?.data?.DateTransa || null;
        const action = statusPayload?.Action || statusPayload?.data?.Action || txData?.wonyaPay?.action || 'C2B';
        const motif = statusPayload?.Motif || statusPayload?.data?.Motif || '';
        
        const isDeposit = txData.type === 'deposit' || txData.paymentMethod === 'wonyapay';
        const isWithdrawal = txData.type === 'withdrawal' && txData.withdrawalMethod === 'mobile_money';

        // Transaction réussie selon la doc WonyaPay
        // C2B succès: StatutWonya = "Succes"
        // B2C succès: StatutWonya = "Reçu"
        if (isCompletedWonyaStatus(statutWonya)) {
          if (isDeposit) {
            // Pour les dépôts: créditer le portefeuille
            const amountToCredit = txData.amount || 0;

            await updateDoc(txDoc.ref, {
              status: 'completed',
              description: txData.originalCurrency === 'USD' 
                ? `Dépôt Mobile Money confirmé (${txData.originalAmount} USD → ${amountToCredit.toLocaleString('fr-FR')} CDF)`
                : 'Dépôt Mobile Money confirmé',
              'wonyaPay.providerStatus': statutWonya,
              'wonyaPay.statutTransa': statutTransa,
              'wonyaPay.refTransaResponse': refTransaResponse,
              'wonyaPay.dateTransa': dateTransa,
              'wonyaPay.statusResponse': statusPayload,
              creditedAt: new Date().toISOString(),
            });

            await updateDoc(userRef, {
              walletBalance: increment(amountToCredit),
              lastTransactionTime: new Date(),
            });

            const refreshedUserDoc = await getDoc(userRef);
            const refreshedBalance = refreshedUserDoc.data()?.walletBalance || 0;
            await updateDoc(txDoc.ref, {
              newBalance: refreshedBalance,
            });
          } else if (isWithdrawal) {
            // Pour les retraits: juste confirmer (le débit a déjà été fait)
            await updateDoc(txDoc.ref, {
              status: 'completed',
              description: txData.originalCurrency === 'USD' 
                ? `Retrait Mobile Money confirmé (${txData.originalAmount} USD, débit ${txData.amount.toLocaleString('fr-FR')} CDF)`
                : 'Retrait Mobile Money confirmé',
              'wonyaPay.providerStatus': statutWonya,
              'wonyaPay.statutTransa': statutTransa,
              'wonyaPay.refTransaResponse': refTransaResponse,
              'wonyaPay.dateTransa': dateTransa,
              'wonyaPay.statusResponse': statusPayload,
              completedAt: new Date().toISOString(),
            });
          }

          updated += 1;
        }
        // Transaction échouée selon la doc WonyaPay
        // StatutWonya = "Echec"
        else if (
          isFailedWonyaStatus(statutWonya) ||
          ['echec', 'échec', 'failed', 'error'].includes((statutTransa || '').toLowerCase())
        ) {
          const failureReason = motif || 'Transaction échouée par l\'opérateur mobile';
          
          // Pour les retraits échoués: rembourser le portefeuille
          if (isWithdrawal) {
            const amountToRefund = txData.amount || 0;
            
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: `Échec retrait: ${failureReason} (montant remboursé)`,
              'wonyaPay.providerStatus': statutWonya,
              'wonyaPay.statutTransa': statutTransa,
              'wonyaPay.refTransaResponse': refTransaResponse,
              'wonyaPay.statusResponse': statusPayload,
              'wonyaPay.failureReason': failureReason,
              failedAt: new Date().toISOString(),
              refunded: true,
            });
            
            // Rembourser le montant débité
            await updateDoc(userRef, {
              walletBalance: increment(amountToRefund),
              lastTransactionTime: new Date(),
            });
          } else {
            // Pour les dépôts échoués: juste marquer comme échoué
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: `Échec: ${failureReason}`,
              'wonyaPay.providerStatus': statutWonya,
              'wonyaPay.statutTransa': statutTransa,
              'wonyaPay.refTransaResponse': refTransaResponse,
              'wonyaPay.statusResponse': statusPayload,
              'wonyaPay.failureReason': failureReason,
              failedAt: new Date().toISOString(),
            });
          }

          failed += 1;
        }
        // Transaction expirée (plus de 10 minutes en attente sans statut clair)
        else if (
          ['pending', 'processing', 'en_attente', 'awaiting'].includes((statutWonya || '').toLowerCase()) ||
          ['pending', 'processing', 'en_attente', 'awaiting'].includes((statutTransa || '').toLowerCase())
        ) {
          await updateDoc(txDoc.ref, {
            'wonyaPay.providerStatus': statutWonya || 'pending',
            'wonyaPay.statutTransa': statutTransa || 'pending',
            'wonyaPay.refTransaResponse': refTransaResponse,
            'wonyaPay.statusResponse': statusPayload,
            lastStatusCheckAt: new Date().toISOString(),
          });
        }
        else if (ageInMinutes >= 10 && !refTransaResponse) {
          // Pour les retraits expirés: rembourser le portefeuille
          if (isWithdrawal) {
            const amountToRefund = txData.amount || 0;
            
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: 'Échec: Transaction expirée (délai dépassé, montant remboursé)',
              'wonyaPay.providerStatus': 'expired',
              'wonyaPay.statutTransa': 'Echec',
              'wonyaPay.statusResponse': statusPayload,
              expiredAt: new Date().toISOString(),
              refunded: true,
            });
            
            // Rembourser le montant débité
            await updateDoc(userRef, {
              walletBalance: increment(amountToRefund),
              lastTransactionTime: new Date(),
            });
          } else {
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: 'Échec: Transaction expirée (délai dépassé)',
              'wonyaPay.providerStatus': 'expired',
              'wonyaPay.statutTransa': 'Echec',
              'wonyaPay.statusResponse': statusPayload,
              expiredAt: new Date().toISOString(),
            });
          }

          failed += 1;
        }
      } catch (error: any) {
        console.error(`Erreur vérification transaction ${refTransa}:`, error);
        
        // Si erreur après 5 minutes, marquer comme échouée
        if (ageInMinutes >= 5) {
          const isWithdrawal = txData.type === 'withdrawal' && txData.withdrawalMethod === 'mobile_money';
          
          // Pour les retraits en erreur: rembourser le portefeuille
          if (isWithdrawal) {
            const amountToRefund = txData.amount || 0;
            
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: `Échec: ${error.message || 'Erreur de vérification'} (montant remboursé)`,
              'wonyaPay.providerStatus': 'error',
              'wonyaPay.error': error.message,
              failedAt: new Date().toISOString(),
              refunded: true,
            });
            
            // Rembourser le montant débité
            await updateDoc(userRef, {
              walletBalance: increment(amountToRefund),
              lastTransactionTime: new Date(),
            });
          } else {
            await updateDoc(txDoc.ref, {
              status: 'failed',
              description: `Échec: ${error.message || 'Erreur de vérification'}`,
              'wonyaPay.providerStatus': 'error',
              'wonyaPay.error': error.message,
              failedAt: new Date().toISOString(),
            });
          }
          
          failed += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      updated,
      failed,
    });
  } catch (error: any) {
    console.error('Erreur reconciliation WonyaPay:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la reconciliation WonyaPay' },
      { status: 500 }
    );
  }
}
