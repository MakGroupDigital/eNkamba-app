import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  type: 'transfer_sent' | 'transfer_received' | 'deposit' | 'withdrawal' | 'payment_link' | 'contact_payment' | 'money_request_sent' | 'money_request_received';
  amount: number;
  amountInCDF: number;
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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const getTransactionHistoryFn = httpsCallable(functions, 'getTransactionHistory');
        const result = await getTransactionHistoryFn({
          userId: user.uid,
          limit: 100,
        });

        const data = result.data as any;
        if (data.success && data.transactions) {
          // Trier par date décroissante
          const sorted = data.transactions.sort((a: Transaction, b: Transaction) => {
            const dateA = a.timestamp?.toDate?.() || new Date(a.createdAt);
            const dateB = b.timestamp?.toDate?.() || new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          setTransactions(sorted);
        }
        setError(null);
      } catch (err: any) {
        console.error('Erreur récupération transactions:', err);
        setError(err.message || 'Erreur lors de la récupération des transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.uid]);

  return { transactions, loading, error };
}
