import { useState, useCallback, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';

export interface MoneyRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
  respondedAt?: any;
  expiresAt?: any;
}

export function useMoneyRequests() {
  const [receivedRequests, setReceivedRequests] = useState<MoneyRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<MoneyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  // Écouter les demandes reçues en temps réel
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'moneyRequests'),
      where('toUserId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: MoneyRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        } as MoneyRequest);
      });
      setReceivedRequests(requests);
    }, (err) => {
      console.error('Erreur demandes reçues:', err);
      setError(err.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Écouter les demandes envoyées en temps réel
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'moneyRequests'),
      where('fromUserId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: MoneyRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        } as MoneyRequest);
      });
      setSentRequests(requests);
    }, (err) => {
      console.error('Erreur demandes envoyées:', err);
      setError(err.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Accepter une demande
  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const acceptFn = httpsCallable(functions, 'acceptMoneyRequest');
        const result = await acceptFn({
          requestId,
          userId: currentUser.uid,
        });

        return {
          success: true,
          message: 'Demande acceptée',
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de l\'acceptation';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  // Refuser une demande
  const rejectRequest = useCallback(
    async (requestId: string, reason?: string) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const rejectFn = httpsCallable(functions, 'rejectMoneyRequest');
        const result = await rejectFn({
          requestId,
          userId: currentUser.uid,
          reason,
        });

        return {
          success: true,
          message: 'Demande refusée',
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du refus';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  return {
    receivedRequests,
    sentRequests,
    isLoading,
    error,
    acceptRequest,
    rejectRequest,
  };
}
