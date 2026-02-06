'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export type TransferMethod = 'email' | 'phone' | 'card' | 'account' | 'bluetooth' | 'wifi';

export interface TransferData {
  amount: number;
  senderCurrency: string;
  transferMethod: TransferMethod;
  recipientIdentifier?: string;
  recipientId?: string;
  description?: string;
}

export function useMoneyTransferDirect() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useWalletTransactions();
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
    console.log('=== DÉBUT DU TRANSFERT ===');
    console.log('Données du transfert:', data);
    console.log('Utilisateur:', user.uid);
    console.log('Solde actuel:', balance);
    
    try {
      // Récupérer l'expéditeur
      const senderRef = doc(db, 'users', user.uid);
      const senderDoc = await getDoc(senderRef);
      
      if (!senderDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const senderData = senderDoc.data();
      const senderBalance = senderData.walletBalance || 0;

      // Vérifier le solde
      if (senderBalance < data.amount) {
        throw new Error('Solde insuffisant');
      }

      let recipientId_final = data.recipientId;
      let recipientData: any = null;

      // Trouver le destinataire
      if (data.transferMethod !== 'bluetooth' && data.transferMethod !== 'wifi' && data.recipientIdentifier) {
        let q: any = null;

        switch (data.transferMethod) {
          case 'email':
            q = query(collection(db, 'users'), where('email', '==', data.recipientIdentifier.toLowerCase()));
            break;
          case 'phone':
            q = query(collection(db, 'users'), where('phoneNumber', '==', data.recipientIdentifier));
            break;
          case 'account':
            q = query(collection(db, 'users'), where('accountNumber', '==', data.recipientIdentifier.toUpperCase()));
            break;
          case 'card':
            q = query(collection(db, 'users'), where('cardNumber', '==', data.recipientIdentifier));
            break;
          default:
            throw new Error('Méthode de transfert invalide');
        }

        if (q) {
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            throw new Error('Destinataire non trouvé');
          }
          recipientId_final = snapshot.docs[0].id;
          recipientData = snapshot.docs[0].data();
        }
      } else if (data.recipientId) {
        recipientId_final = data.recipientId;
        const recipientRef = doc(db, 'users', recipientId_final);
        const recipientDoc = await getDoc(recipientRef);
        if (recipientDoc.exists()) {
          recipientData = recipientDoc.data();
        }
      }

      if (!recipientId_final) {
        throw new Error('Destinataire non spécifié');
      }

      // Vérifier que ce n'est pas le même utilisateur
      if (recipientId_final === user.uid) {
        throw new Error('Vous ne pouvez pas envoyer de l\'argent à vous-même');
      }

      // Récupérer le destinataire
      const recipientRef = doc(db, 'users', recipientId_final);
      const recipientDoc = await getDoc(recipientRef);
      if (!recipientDoc.exists()) {
        throw new Error('Destinataire non trouvé');
      }

      recipientData = recipientDoc.data();
      const recipientBalance = recipientData.walletBalance || 0;

      // Effectuer le transfert avec logs
      console.log('Mise à jour du solde expéditeur:', senderBalance, '->', senderBalance - data.amount);
      await updateDoc(senderRef, {
        walletBalance: senderBalance - data.amount,
        lastTransactionTime: serverTimestamp(),
      });

      console.log('Mise à jour du solde destinataire:', recipientBalance, '->', recipientBalance + data.amount);
      await updateDoc(recipientRef, {
        walletBalance: recipientBalance + data.amount,
        lastTransactionTime: serverTimestamp(),
      });

      // Créer les transactions avec logs
      const senderTransactionRef = collection(db, 'users', user.uid, 'transactions');
      const senderTransactionDoc = await addDoc(senderTransactionRef, {
        type: 'transfer_sent',
        amount: data.amount,
        senderCurrency: data.senderCurrency,
        status: 'completed',
        description: data.description || `Envoi à ${recipientData?.fullName || 'Utilisateur'}`,
        previousBalance: senderBalance,
        newBalance: senderBalance - data.amount,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        recipientId: recipientId_final,
        recipientName: recipientData?.fullName || 'Utilisateur',
        transferMethod: data.transferMethod,
      });

      console.log('Transaction expéditeur créée:', senderTransactionDoc.id);

      const recipientTransactionRef = collection(db, 'users', recipientId_final, 'transactions');
      const recipientTransactionDoc = await addDoc(recipientTransactionRef, {
        type: 'transfer_received',
        amount: data.amount,
        senderCurrency: data.senderCurrency,
        status: 'completed',
        description: data.description || `Reçu de ${senderData?.fullName || 'Utilisateur'}`,
        previousBalance: recipientBalance,
        newBalance: recipientBalance + data.amount,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        senderId: user.uid,
        senderName: senderData?.fullName || 'Utilisateur',
        transferMethod: data.transferMethod,
      });

      console.log('Transaction destinataire créée:', recipientTransactionDoc.id);

      // Créer les notifications avec tous les champs nécessaires
      const senderNotificationRef = collection(db, 'users', user.uid, 'notifications');
      const senderNotificationDoc = await addDoc(senderNotificationRef, {
        type: 'transfer_sent',
        title: 'Argent envoyé',
        message: `Vous avez envoyé ${data.amount.toLocaleString('fr-FR')} ${data.senderCurrency} à ${recipientData?.fullName || 'Utilisateur'}`,
        amount: data.amount,
        currency: data.senderCurrency,
        senderCurrency: data.senderCurrency,
        recipientName: recipientData?.fullName || 'Utilisateur',
        recipientId: recipientId_final,
        read: false,
        acknowledged: true,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      console.log('Notification expéditeur créée:', senderNotificationDoc.id);

      const recipientNotificationRef = collection(db, 'users', recipientId_final, 'notifications');
      const recipientNotificationDoc = await addDoc(recipientNotificationRef, {
        type: 'transfer_received',
        title: 'Argent reçu',
        message: `Vous avez reçu ${data.amount.toLocaleString('fr-FR')} ${data.senderCurrency} de ${senderData?.fullName || 'Utilisateur'}`,
        amount: data.amount,
        currency: data.senderCurrency,
        senderCurrency: data.senderCurrency,
        senderId: user.uid,
        senderName: senderData?.fullName || 'Utilisateur',
        read: false,
        acknowledged: false,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      console.log('Notification destinataire créée:', recipientNotificationDoc.id);

      // Attendre un peu pour s'assurer que Firestore a bien enregistré les données
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Succès',
        description: `Envoi de ${data.amount.toLocaleString('fr-FR')} ${data.senderCurrency} effectué avec succès`,
        className: 'bg-green-600 text-white border-none',
      });

      console.log('Transfert terminé avec succès');
      return true;
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
