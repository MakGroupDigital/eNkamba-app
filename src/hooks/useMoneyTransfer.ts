import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export type TransferMethod = 'email' | 'phone' | 'card' | 'account' | 'bluetooth' | 'wifi';

export interface TransferData {
  amount: number;
  senderCurrency: string;
  transferMethod: TransferMethod;
  recipientIdentifier?: string;
  recipientId?: string;
  description?: string;
}

export function useMoneyTransfer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, refreshTransactions } = useWalletTransactions();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMoney = async (data: TransferData): Promise<boolean> => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Utilisateur non authentifié',
      });
      return false;
    }

    if (!data.amount || data.amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Montant invalide',
      });
      return false;
    }

    if (data.amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Veuillez ajouter des fonds.`,
      });
      return false;
    }

    setIsProcessing(true);
    try {
      const sendMoneyFn = httpsCallable(functions, 'sendMoney');
      const result = await sendMoneyFn({
        senderId: user.uid,
        amount: data.amount,
        senderCurrency: data.senderCurrency || 'CDF',
        transferMethod: data.transferMethod,
        recipientIdentifier:
          data.transferMethod !== 'bluetooth' && data.transferMethod !== 'wifi'
            ? data.recipientIdentifier
            : undefined,
        recipientId: data.recipientId,
        description: data.description,
      });

      const resultData = result.data as any;

      if (resultData.success) {
        toast({
          title: 'Succès',
          description: `Envoi de ${data.amount.toLocaleString('fr-FR')} ${data.senderCurrency} effectué avec succès`,
          className: 'bg-green-600 text-white border-none',
        });

        // Rafraîchir les transactions
        await refreshTransactions();
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erreur envoi argent:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'envoi',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    balance,
    sendMoney,
  };
}
