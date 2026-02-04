import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface Transaction {
  id: string;
  type: 'transfer_sent' | 'transfer_received' | 'deposit' | 'withdrawal' | 'payment_link' | 'contact_payment' | 'money_request_sent' | 'money_request_received';
  amount: number;
  amountInCDF?: number;
  currency?: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  timestamp: any;
  createdAt: string;
  recipientId?: string;
  recipientName?: string;
  recipientCurrency?: string;
  senderId?: string;
  senderName?: string;
  senderCurrency?: string;
  amountSentInSenderCurrency?: number;
  amountReceivedInRecipientCurrency?: number;
  exchangeRate?: number;
  transferMethod?: string;
  previousBalance?: number;
  newBalance?: number;
  paymentLinkId?: string;
  paymentCode?: string;
  moneyRequestId?: string;
}

export function useAllTransactions() {
  const currentUser = auth.currentUser;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Écouter les transactions en temps réel depuis Firestore
      const q = query(
        collection(doc(collection(db, 'users'), currentUser.uid), 'transactions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const txs: Transaction[] = [];
          snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            txs.push({
              id: docSnapshot.id,
              ...data,
            } as Transaction);
          });
          setTransactions(txs);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Erreur écoute transactions:', err);
          setError('Erreur lors du chargement des transactions');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Erreur setup transactions:', err);
      setError(err.message || 'Erreur lors de la récupération des transactions');
      setLoading(false);
    }
  }, [currentUser?.uid]);

  return { transactions, loading, error };
}
