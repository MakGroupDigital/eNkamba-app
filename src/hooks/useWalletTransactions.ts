import { useState, useCallback, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'transfer'
    | 'payment'
    | 'transfer_sent'
    | 'transfer_received'
    | 'money_request_sent'
    | 'money_request_received'
    | 'payment_link'
    | 'contact_payment';
  amount: number;
  paymentMethod?: string;
  withdrawalMethod?: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  previousBalance: number;
  newBalance: number;
  timestamp: any;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  amount?: number;
  transactionId?: string;
  read: boolean;
  timestamp: any;
  createdAt: string;
}

export function useWalletTransactions() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const parseApiResponse = useCallback(async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(rawText);
      } catch {
        throw new Error('Réponse JSON invalide du serveur');
      }
    }

    if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
      throw new Error('Le serveur a renvoyé une page HTML au lieu d’une réponse API. Vérifiez la route /api et la configuration de production WonyaPay.');
    }

    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error(rawText || 'Réponse invalide du serveur');
    }
  }, []);

  const syncBalanceFromFirestore = useCallback(async (fallbackBalance?: number) => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setBalance(userDoc.data()?.walletBalance || 0);
        return;
      }
    } catch (err) {
      console.debug('Sync balance skipped:', err);
    }

    if (typeof fallbackBalance === 'number') {
      setBalance(fallbackBalance);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const syncPendingWonyaDeposits = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/wallet/wonyapay/reconcile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: currentUser.uid }),
        });
        
        // Ne pas logger les erreurs si l'API retourne un succès avec skip
        if (response.ok) {
          const data = await response.json();
          if (data.skipped) {
            // Configuration WonyaPay non disponible, c'est normal
            return;
          }
        }
      } catch (err) {
        // Ignorer silencieusement les erreurs de réconciliation
        // pour ne pas perturber l'expérience utilisateur
        console.debug('Sync WonyaPay skipped:', err);
      }
    };

    // Sync immédiat au chargement
    syncPendingWonyaDeposits();
    
    // Sync toutes les 30 secondes pour les transactions récentes
    const intervalId = window.setInterval(syncPendingWonyaDeposits, 30000);

    return () => window.clearInterval(intervalId);
  }, [currentUser]);

  // Charger et écouter le solde depuis Firestore directement (évite CORS)
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    // Charger le solde initial
    const loadBalance = async () => {
      try {
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBalance(userData?.walletBalance || 0);
        } else {
          // Si le document n'existe pas, créer avec solde 0
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            walletBalance: 0,
            createdAt: serverTimestamp(),
          });
          setBalance(0);
        }
      } catch (err) {
        console.error('Erreur chargement solde:', err);
        setBalance(0);
      }
    };

    loadBalance();

    // Écouter les changements de solde en temps réel
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBalance(data?.walletBalance || 0);
      }
    }, (err) => {
      console.error('Erreur listener solde:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Écouter les transactions en temps réel
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({
          id: doc.id,
          ...doc.data(),
        } as Transaction);
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });
      setNotifications(notifs);
    }, (err) => {
      console.error('Erreur notifications:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Ajouter des fonds
  const addFunds = useCallback(
    async (
      amount: number,
      paymentMethod: 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto' | 'wonyapay',
      details: any
    ) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      const previousBalance = balance;
      const optimisticId = `optimistic-deposit-${Date.now()}`;
      const optimisticNewBalance = paymentMethod === 'wonyapay' ? previousBalance : previousBalance + amount;

      setIsLoading(true);
      setError(null);
      setBalance(optimisticNewBalance);
      setTransactions((prev) => [
        {
          id: optimisticId,
          type: 'deposit',
          amount,
          paymentMethod,
          status: 'pending',
          description:
            paymentMethod === 'wonyapay'
              ? 'Depot WonyaPay initie, en attente de confirmation'
              : 'Ajout de fonds en cours...',
          previousBalance,
          newBalance: optimisticNewBalance,
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
        } as Transaction,
        ...prev,
      ].slice(0, 20));

      try {
        // Obtenir le token d'authentification
        const token = await currentUser.getIdToken();

        const shouldFallbackToLite = (res: Response, payload: any) => {
          // Breakglass fallback: quand Firebase Admin est KO (lecture user), on retente via la route lite.
          // On se base sur le "stage" (mode dev) et/ou le message d'erreur (prod).
          const stage = typeof payload?.stage === 'string' ? payload.stage : '';
          const msg = String(payload?.error || payload?.message || '');
          return (
            res.status >= 500 &&
            (
              stage === 'firestore_get_user' ||
              stage === 'firebase_admin_init' ||
              /firebase/i.test(msg) ||
              /lecture utilisateur/i.test(msg)
            )
          );
        };

        const requestBody = {
          userId: currentUser.uid,
          amount,
          paymentMethod,
          phoneNumber: details.phoneNumber,
          cardDetails: details.cardDetails,
          cryptoDetails: details.cryptoDetails,
          wonyaDetails: details.wonyaDetails,
        };

        // Utiliser Firestore SDK côté serveur (route lite) pour éviter les soucis Firebase Admin en dev.
        // On garde le token envoyé (utile si on renforce la sécurité plus tard).
        const primaryEndpoint = '/api/wallet/add-funds-lite';
        const secondaryEndpoint = '/api/wallet/add-funds';

        let response = await fetch(primaryEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        let data = await parseApiResponse(response);

        // Compat: si la route lite échoue (ex: indispo), on tente l’ancienne route.
        if (!response.ok) {
          const fallbackResponse = await fetch(secondaryEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });

          const fallbackData = await parseApiResponse(fallbackResponse);

          // Si l’ancienne route échoue à cause de Firebase Admin, on repasse sur lite (breakglass)
          if (!fallbackResponse.ok && shouldFallbackToLite(fallbackResponse, fallbackData)) {
            response = await fetch(primaryEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(requestBody),
            });
            data = await parseApiResponse(response);
          } else {
            response = fallbackResponse;
            data = fallbackData;
          }
        }

        if (!response.ok) {
          const errorData = data;
          throw new Error(errorData.error || 'Erreur lors de l\'ajout de fonds');
        }
        setBalance(data.newBalance);
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === optimisticId
              ? {
                  ...tx,
                  status: data.transactionStatus === 'pending' ? 'pending' : 'completed',
                  description:
                    data.transactionStatus === 'pending'
                      ? data.message || 'Ajout de fonds en attente de confirmation'
                      : 'Ajout de fonds confirmé',
                  newBalance: data.newBalance,
                }
              : tx
          )
        );

        await syncBalanceFromFirestore(data.newBalance);

        return {
          success: true,
          transactionId: data.transactionId,
          newBalance: data.newBalance,
          transactionStatus: data.transactionStatus,
          message: data.message,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de l\'ajout de fonds';
        setError(errorMessage);
        setBalance(previousBalance);
        setTransactions((prev) => prev.filter((tx) => tx.id !== optimisticId));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [balance, currentUser, parseApiResponse, syncBalanceFromFirestore]
  );

  // Retirer des fonds
  const withdrawFunds = useCallback(
    async (amount: number, withdrawalMethod: 'mobile_money' | 'agent' | 'card' | 'bank', details: any) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');
      if (amount > balance) throw new Error('Solde insuffisant');

      const previousBalance = balance;
      const optimisticId = `optimistic-withdraw-${Date.now()}`;
      const usesWonyaPay = withdrawalMethod === 'mobile_money';
      const optimisticNewBalance = usesWonyaPay ? previousBalance : Math.max(0, previousBalance - amount);

      setIsLoading(true);
      setError(null);
      setBalance(optimisticNewBalance);
      setTransactions((prev) => [
        {
          id: optimisticId,
          type: 'withdrawal',
          amount,
          withdrawalMethod,
          status: 'pending',
          description: usesWonyaPay
            ? 'Retrait WonyaPay initié, en attente de confirmation'
            : 'Retrait en cours...',
          previousBalance,
          newBalance: optimisticNewBalance,
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
        } as Transaction,
        ...prev,
      ].slice(0, 20));

      try {
        // Obtenir le token d'authentification
        const token = await currentUser.getIdToken();

        // Appeler l'API route Next.js
        const response = await fetch('/api/wallet/withdraw-funds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            amount,
            withdrawalMethod,
            phoneNumber: details.phoneNumber,
            currency: details.currency,
            agentIdentifier: details.agentIdentifier,
            cardNumber: details.cardNumber,
            cardHolder: details.cardHolder,
            bankName: details.bankName,
            accountNumber: details.accountNumber,
            accountHolder: details.accountHolder,
          }),
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
          const errorData = data;
          throw new Error(errorData.error || 'Erreur lors du retrait');
        }
        const transactionStatus = data.transactionStatus || data.status || 'pending';
        setBalance(data.newBalance);
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === optimisticId
              ? {
                  ...tx,
                  status: transactionStatus === 'pending' ? 'pending' : 'completed',
                  description:
                    transactionStatus === 'pending'
                      ? data.message || 'Retrait en attente de confirmation'
                      : data.message || 'Retrait confirmé',
                  newBalance: data.newBalance,
                }
              : tx
          )
        );

        await syncBalanceFromFirestore(data.newBalance);

        return {
          success: true,
          transactionId: data.transactionId,
          newBalance: data.newBalance,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du retrait';
        setError(errorMessage);
        setBalance(previousBalance);
        setTransactions((prev) => prev.filter((tx) => tx.id !== optimisticId));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [balance, currentUser, parseApiResponse, syncBalanceFromFirestore]
  );

  return {
    balance,
    transactions,
    notifications,
    isLoading,
    error,
    addFunds,
    withdrawFunds,
  };
}
