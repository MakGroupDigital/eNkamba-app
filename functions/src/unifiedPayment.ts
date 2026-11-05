import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function pour traiter les paiements unifiés
 * Utilisée par tous les contextes (Wallet, Nkampa, Ugavi, Makutano, Miyiki, Bills, Services)
 */
export const processUnifiedPayment = functions.https.onCall(
  async (data: {
    payerId: string;
    amount: number;
    paymentMethod: 'qrcode' | 'card' | 'account' | 'email' | 'phone' | 'bluetooth' | 'wifi';
    context: 'wallet' | 'nkampa' | 'ugavi' | 'makutano' | 'miyiki' | 'bills' | 'services';
    recipientId?: string;
    recipientIdentifier?: string;
    qrCodeData?: string;
    description?: string;
    metadata?: Record<string, any>;
  }, context) => {
    const {
      payerId,
      paymentMethod,
      context: paymentContext,
      recipientId,
      recipientIdentifier,
      qrCodeData,
      description,
      metadata,
    } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== payerId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez payer que depuis votre propre compte'
      );
    }

    // Montant strictement numérique : une chaîne ferait une concaténation sur le solde du destinataire.
    const amount = typeof data.amount === 'number' ? data.amount : Number.NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le montant doit être supérieur à 0'
      );
    }

    try {
      const db = admin.firestore();

      const payerRef = db.collection('users').doc(payerId);
      let recipientId_final = recipientId;
      let recipientData: any = null;

      // Trouver le destinataire selon la méthode (sauf pour Bluetooth/WiFi)
      if ((paymentMethod !== 'bluetooth' && paymentMethod !== 'wifi') && recipientIdentifier) {
        let query: FirebaseFirestore.Query | null = null;

        switch (paymentMethod) {
          case 'email':
            query = db.collection('users').where('email', '==', recipientIdentifier.toLowerCase());
            break;
          case 'card':
            query = db.collection('users').where('cardNumber', '==', recipientIdentifier);
            break;
          case 'account':
            query = db.collection('users').where('accountNumber', '==', recipientIdentifier.toUpperCase());
            break;
          case 'phone':
            query = db.collection('users').where('phoneNumber', '==', recipientIdentifier);
            break;
          case 'qrcode':
            recipientId_final = qrCodeData;
            break;
          default:
            throw new functions.https.HttpsError(
              'invalid-argument',
              'Méthode de paiement invalide'
            );
        }

        if (query) {
          const snapshot = await query.limit(1).get();
          if (snapshot.empty) {
            throw new functions.https.HttpsError(
              'not-found',
              'Destinataire non trouvé'
            );
          }
          recipientId_final = snapshot.docs[0].id;
          recipientData = snapshot.docs[0].data();
        }
      } else if (paymentMethod === 'bluetooth' || paymentMethod === 'wifi') {
        recipientId_final = recipientId;
      } else if (paymentMethod === 'qrcode') {
        recipientId_final = qrCodeData;
      }

      if (!recipientId_final) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Destinataire non spécifié'
        );
      }

      // Vérifier que ce n'est pas le même utilisateur
      if (recipientId_final === payerId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Vous ne pouvez pas payer vous-même'
        );
      }

      const recipientRef = db.collection('users').doc(recipientId_final);
      const payerTransactionRef = payerRef.collection('transactions').doc();
      const recipientTransactionRef = recipientRef.collection('transactions').doc();
      const payerNotificationRef = payerRef.collection('notifications').doc();
      const recipientNotificationRef = recipientRef.collection('notifications').doc();
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Lecture des soldes et écritures dans une seule transaction : pas de double dépense ni de crédit écrasé.
      const payerBalance = await db.runTransaction(async (transaction) => {
        const [payerDoc, recipientDoc] = await Promise.all([transaction.get(payerRef), transaction.get(recipientRef)]);
        if (!payerDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
        }
        if (!recipientDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Destinataire non trouvé');
        }
        const payerData = payerDoc.data()!;
        const recipientData = recipientDoc.data()!;
        const currentPayerBalance = Number(payerData.walletBalance || 0);
        const recipientBalance = Number(recipientData.walletBalance || 0);
        if (currentPayerBalance < amount) {
          throw new functions.https.HttpsError('failed-precondition', 'Solde insuffisant');
        }

        transaction.update(payerRef, { walletBalance: currentPayerBalance - amount, lastTransactionTime: now });
        transaction.update(recipientRef, { walletBalance: recipientBalance + amount, lastTransactionTime: now });

        transaction.set(payerTransactionRef, {
          id: payerTransactionRef.id,
          type: 'payment_sent',
          context: paymentContext,
          amount,
          amountInCDF: amount,
          status: 'completed',
          description: description || `Paiement à ${recipientData.fullName || 'un utilisateur Kenz'}`,
          previousBalance: currentPayerBalance,
          newBalance: currentPayerBalance - amount,
          timestamp: now,
          createdAt: new Date().toISOString(),
          recipientId: recipientId_final,
          paymentMethod,
          metadata: metadata || {},
          ...(recipientData.fullName ? { recipientName: recipientData.fullName } : {}),
        });
        transaction.set(recipientTransactionRef, {
          id: recipientTransactionRef.id,
          type: 'payment_received',
          context: paymentContext,
          amount,
          amountInCDF: amount,
          status: 'completed',
          description: description || `Paiement reçu de ${payerData.fullName || 'un utilisateur Kenz'}`,
          previousBalance: recipientBalance,
          newBalance: recipientBalance + amount,
          timestamp: now,
          createdAt: new Date().toISOString(),
          senderId: payerId,
          paymentMethod,
          metadata: metadata || {},
          ...(payerData.fullName ? { senderName: payerData.fullName } : {}),
        });
        transaction.set(payerNotificationRef, {
          id: payerNotificationRef.id,
          type: 'payment_sent',
          title: 'Paiement effectué',
          message: `Vous avez payé ${amount.toLocaleString('fr-FR')} CDF à ${recipientData.fullName || 'un utilisateur Kenz'}`,
          amount,
          transactionId: payerTransactionRef.id,
          context: paymentContext,
          read: false,
          timestamp: now,
          createdAt: new Date().toISOString(),
        });
        transaction.set(recipientNotificationRef, {
          id: recipientNotificationRef.id,
          type: 'payment_received',
          title: 'Paiement reçu',
          message: `Vous avez reçu ${amount.toLocaleString('fr-FR')} CDF de ${payerData.fullName || 'un utilisateur Kenz'}`,
          amount,
          transactionId: recipientTransactionRef.id,
          context: paymentContext,
          read: false,
          timestamp: now,
          createdAt: new Date().toISOString(),
        });
        return currentPayerBalance;
      });

      return {
        success: true,
        message: 'Paiement effectué avec succès',
        transactionId: payerTransactionRef.id,
        newBalance: payerBalance - amount,
      };
    } catch (error) {
      console.error('Erreur paiement unifié:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du paiement'
      );
    }
  }
);
