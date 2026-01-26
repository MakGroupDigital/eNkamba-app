'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export type PaymentMethod = 'qrcode' | 'card' | 'account' | 'email' | 'phone' | 'bluetooth' | 'wifi';
export type PaymentContext = 'wallet' | 'nkampa' | 'ugavi' | 'makutano' | 'miyiki' | 'bills' | 'services';

export interface PaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  recipientIdentifier?: string;
  recipientId?: string;
  qrCodeData?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ReceiveData {
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedPaymentConfig {
  context: PaymentContext;
}

export function useUnifiedPayment(config: UnifiedPaymentConfig) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useWalletTransactions();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Valide un paiement avant traitement
   */
  const validatePayment = (amount: number, recipientId?: string): boolean => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non authentifié',
      });
      return false;
    }

    if (!amount || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Montant invalide',
      });
      return false;
    }

    if (amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Veuillez ajouter des fonds.`,
      });
      return false;
    }

    if (recipientId && recipientId === user.uid) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous ne pouvez pas payer vous-même',
      });
      return false;
    }

    return true;
  };

  /**
   * Recherche un utilisateur par identifiant
   */
  const searchRecipient = async (
    query: string,
    method: PaymentMethod
  ): Promise<any | null> => {
    if (!query.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer une valeur',
      });
      return null;
    }

    // Vérifier que ce n'est pas l'utilisateur lui-même
    if (query.trim() === user?.email || query.trim() === user?.phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous ne pouvez pas payer vous-même',
      });
      return null;
    }

    try {
      const searchFn = httpsCallable(functions, 'searchUserByIdentifier');
      const result = await searchFn({
        searchMethod: method,
        searchQuery: query.trim(),
        currentUserId: user?.uid,
      });

      const data = result.data as any;

      if (data.success && data.user) {
        if (data.user.uid === user?.uid) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Vous ne pouvez pas payer vous-même',
          });
          return null;
        }
        return data.user;
      } else {
        toast({
          variant: 'destructive',
          title: 'Non trouvé',
          description: 'Destinataire non trouvé',
        });
        return null;
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la recherche',
      });
      return null;
    }
  };

  /**
   * Traite un paiement unifié
   */
  const processPayment = async (data: PaymentData): Promise<boolean> => {
    if (!validatePayment(data.amount, data.recipientId)) {
      return false;
    }

    setIsProcessing(true);
    try {
      const processPaymentFn = httpsCallable(functions, 'processUnifiedPayment');
      const result = await processPaymentFn({
        payerId: user?.uid,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        context: config.context,
        recipientId: data.recipientId,
        recipientIdentifier:
          data.paymentMethod !== 'bluetooth' && data.paymentMethod !== 'wifi'
            ? data.recipientIdentifier
            : undefined,
        qrCodeData: data.paymentMethod === 'qrcode' ? data.qrCodeData : undefined,
        description: data.description,
        metadata: data.metadata,
      });

      const resultData = result.data as any;

      if (resultData.success) {
        toast({
          title: 'Succès',
          description: `Paiement de ${data.amount.toLocaleString('fr-FR')} CDF effectué avec succès`,
          className: 'bg-green-600 text-white border-none',
        });

        // Le solde sera mis à jour automatiquement via le listener Firestore
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du paiement',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Traite une réception unifiée
   */
  const processReceive = async (data: ReceiveData): Promise<boolean> => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non authentifié',
      });
      return false;
    }

    try {
      // Générer un code unique pour la réception
      const receiveCode = `${user.uid}-${Date.now()}`;

      toast({
        title: 'Code généré',
        description: `Code de réception: ${receiveCode}`,
        className: 'bg-green-600 text-white border-none',
      });

      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération du code',
      });
      return false;
    }
  };

  return {
    isProcessing,
    balance,
    validatePayment,
    searchRecipient,
    processPayment,
    processReceive,
  };
}
