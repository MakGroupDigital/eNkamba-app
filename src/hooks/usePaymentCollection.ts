import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';

export interface PaymentLink {
  id: string;
  code: string;
  amount?: number;
  description?: string;
  status: 'active' | 'used' | 'expired';
  createdAt: any;
  expiresAt: any;
}

export function usePaymentCollection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  // Créer un lien de paiement
  const createPaymentLink = useCallback(
    async (amount?: number, description?: string, method: 'link' | 'qr' | 'phone' | 'code' | 'nfc' = 'link') => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const createLinkFn = httpsCallable(functions, 'createPaymentLink');
        const result = await createLinkFn({
          userId: currentUser.uid,
          amount: amount || undefined,
          description: description || undefined,
          method,
        });

        const data = result.data as any;

        return {
          success: true,
          linkId: data.linkId,
          code: data.code,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de la création du lien';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  // Traiter un paiement via lien
  const processPaymentLink = useCallback(
    async (linkId: string, code: string, amount: number) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const processFn = httpsCallable(functions, 'processPaymentLink');
        const result = await processFn({
          linkId,
          code,
          payerId: currentUser.uid,
          amount,
        });

        const data = result.data as any;

        return {
          success: true,
          transactionId: data.transactionId,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors du paiement';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  // Obtenir les détails d'un lien
  const getPaymentLinkDetails = useCallback(
    async (linkId: string, code: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const getDetailsFn = httpsCallable(functions, 'getPaymentLinkDetails');
        const result = await getDetailsFn({
          linkId,
          code,
        });

        const data = result.data as any;

        return {
          success: true,
          link: data.link,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de la récupération';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Créer un code de paiement par contact
  const createContactPaymentCode = useCallback(
    async (amount?: number) => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const createCodeFn = httpsCallable(functions, 'createContactPaymentCode');
        const result = await createCodeFn({
          userId: currentUser.uid,
          amount: amount || undefined,
        });

        const data = result.data as any;

        return {
          success: true,
          code: data.code,
          codeId: data.codeId,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de la création du code';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  // Obtenir les statistiques
  const getCollectionStats = useCallback(
    async () => {
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      setIsLoading(true);
      setError(null);

      try {
        const getStatsFn = httpsCallable(functions, 'getCollectionStats');
        const result = await getStatsFn({
          userId: currentUser.uid,
        });

        const data = result.data as any;

        return {
          success: true,
          stats: data.stats,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Erreur lors de la récupération';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  return {
    isLoading,
    error,
    createPaymentLink,
    processPaymentLink,
    getPaymentLinkDetails,
    createContactPaymentCode,
    getCollectionStats,
  };
}
