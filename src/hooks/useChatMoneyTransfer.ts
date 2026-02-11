import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TransferData {
  amount: number;
  recipientId: string;
  recipientName: string;
  conversationId: string;
  messageId: string;
}

export function useChatMoneyTransfer() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Envoyer de l'argent via le chat
  const sendMoney = useCallback(
    async (amount: number, recipientId: string, recipientName: string, conversationId: string) => {
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      setIsProcessing(true);
      try {
        // Appeler l'API de transfert
        const response = await fetch('/api/chat/transfer-money', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            recipientId,
            recipientName,
            conversationId,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'Utilisateur',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur lors du transfert');
        }

        const data = await response.json();
        return data;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentUser, toast]
  );

  // Accepter un transfert d'argent
  const acceptTransfer = useCallback(
    async (messageId: string, conversationId: string, amount: number, senderId: string) => {
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      setIsProcessing(true);
      try {
        const response = await fetch('/api/chat/accept-transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            conversationId,
            amount,
            senderId,
            recipientId: currentUser.uid,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur lors de l\'acceptation');
        }

        const data = await response.json();
        return data;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentUser]
  );

  // Refuser un transfert d'argent
  const rejectTransfer = useCallback(
    async (messageId: string, conversationId: string) => {
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      setIsProcessing(true);
      try {
        const response = await fetch('/api/chat/reject-transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            conversationId,
            recipientId: currentUser.uid,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur lors du refus');
        }

        const data = await response.json();
        return data;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentUser]
  );

  return {
    sendMoney,
    acceptTransfer,
    rejectTransfer,
    isProcessing,
  };
}
