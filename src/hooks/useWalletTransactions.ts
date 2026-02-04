import { useState, useCallback, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
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
    async (amount: number, paymentMethod: 'mobile_money' | 'credit_card' | 'debit_card', details: any) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        // Obtenir le token d'authentification
        const token = await currentUser.getIdToken();

        // Appeler l'API route Next.js (pas de CORS côté serveur)
        const response = await fetch('/api/wallet/add-funds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            amount,
            paymentMethod,
            phoneNumber: details.phoneNumber,
            cardDetails: details.cardDetails,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'ajout de fonds');
        }

        const data = await response.json();
        setBalance(data.newBalance);

        return {
          success: true,
          transactionId: data.transactionId,
          newBalance: data.newBalance,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de l\'ajout de fonds';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  // Retirer des fonds
  const withdrawFunds = useCallback(
    async (amount: number, withdrawalMethod: 'mobile_money' | 'agent', details: any) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        // Obtenir le token d'authentification
        const token = await currentUser.getIdToken();

        // Appeler l'API route Next.js (pas de CORS côté serveur)
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
            provider: details.provider,
            providerName: details.providerName,
            agentCode: details.agentCode,
            agentLocation: details.agentLocation,
            agentId: details.agentId,
            agentName: details.agentName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du retrait');
        }

        const data = await response.json();
        setBalance(data.newBalance);

        return {
          success: true,
          transactionId: data.transactionId,
          newBalance: data.newBalance,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du retrait';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
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
