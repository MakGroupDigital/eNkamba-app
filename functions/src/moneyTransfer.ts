import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

/**
 * Obtenir le taux de change depuis Google Finance
 */
async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    // Utiliser une API de taux de change gratuite
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    return response.data.rates[toCurrency] || 1;
  } catch (error) {
    console.error('Erreur récupération taux de change:', error);
    // Retourner 1 en cas d'erreur (pas de conversion)
    return 1;
  }
}

/**
 * Cloud Function pour envoyer de l'argent avec conversion de devises
 */
export const sendMoney = functions.https.onCall(
  async (data: {
    senderId: string;
    amount: number;
    senderCurrency: string; // Devise de l'expéditeur (ex: CDF, USD, EUR)
    transferMethod: 'email' | 'phone' | 'card' | 'account' | 'bluetooth' | 'wifi';
    recipientIdentifier?: string;
    recipientId?: string;
    description?: string;
  }, context) => {
    const { senderId, amount, senderCurrency, transferMethod, recipientIdentifier, recipientId, description } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== senderId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez envoyer que depuis votre propre compte'
      );
    }

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le montant doit être supérieur à 0'
      );
    }

    if (!senderCurrency) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'La devise doit être spécifiée'
      );
    }

    try {
      const db = admin.firestore();

      // Récupérer l'expéditeur
      const senderDoc = await db.collection('users').doc(senderId).get();
      if (!senderDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Utilisateur non trouvé'
        );
      }

      const senderData = senderDoc.data()!;
      const senderBalance = senderData.walletBalance || 0;
      const senderCurrencyMain = senderData.currency || 'CDF';

      // Vérifier le solde
      if (senderBalance < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Solde insuffisant'
        );
      }

      let recipientId_final = recipientId;
      let recipientData: any = null;

      // Trouver le destinataire selon la méthode
      if ((transferMethod !== 'bluetooth' && transferMethod !== 'wifi') && recipientIdentifier) {
        let query: FirebaseFirestore.Query | null = null;

        switch (transferMethod) {
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
          default:
            throw new functions.https.HttpsError(
              'invalid-argument',
              'Méthode de transfert invalide'
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
      } else if (transferMethod === 'bluetooth' || transferMethod === 'wifi') {
        recipientId_final = recipientId;
      }

      if (!recipientId_final) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Destinataire non spécifié'
        );
      }

      // Vérifier que ce n'est pas le même utilisateur
      if (recipientId_final === senderId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Vous ne pouvez pas envoyer de l\'argent à vous-même'
        );
      }

      // Récupérer le destinataire
      const recipientDoc = await db.collection('users').doc(recipientId_final).get();
      if (!recipientDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Destinataire non trouvé'
        );
      }

      recipientData = recipientDoc.data()!;
      const recipientBalance = recipientData.walletBalance || 0;
      const recipientCurrency = recipientData.currency || 'CDF';

      // Convertir le montant de la devise de l'expéditeur vers CDF
      const amountInCDF = senderCurrency === 'CDF' 
        ? amount 
        : amount * (await getExchangeRate(senderCurrency, 'CDF'));

      // Convertir de CDF vers la devise du destinataire
      const amountInRecipientCurrency = recipientCurrency === 'CDF'
        ? amountInCDF
        : amountInCDF * (await getExchangeRate('CDF', recipientCurrency));

      // Effectuer le transfert
      await db.collection('users').doc(senderId).update({
        walletBalance: senderBalance - amount,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection('users').doc(recipientId_final).update({
        walletBalance: recipientBalance + amountInRecipientCurrency,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer les transactions
      const senderTransactionRef = db.collection('users').doc(senderId).collection('transactions').doc();
      const senderTransactionData: any = {
        id: senderTransactionRef.id,
        type: 'transfer_sent',
        amount,
        amountInCDF,
        senderCurrency,
        status: 'completed',
        description: description || (recipientData?.fullName ? `Envoi à ${recipientData.fullName}` : 'Envoi d\'argent'),
        previousBalance: senderBalance,
        newBalance: senderBalance - amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
        recipientId: recipientId_final,
        recipientCurrency,
        amountReceivedInRecipientCurrency: amountInRecipientCurrency,
        exchangeRate: amountInCDF / amount,
        transferMethod,
      };
      
      // Ajouter le nom du destinataire seulement s'il existe
      if (recipientData?.fullName) {
        senderTransactionData.recipientName = recipientData.fullName;
      }
      
      await senderTransactionRef.set(senderTransactionData);

      const recipientTransactionRef = db.collection('users').doc(recipientId_final).collection('transactions').doc();
      const recipientTransactionData: any = {
        id: recipientTransactionRef.id,
        type: 'transfer_received',
        amount: amountInRecipientCurrency,
        amountInCDF,
        recipientCurrency,
        status: 'completed',
        description: description || (senderData?.fullName ? `Reçu de ${senderData.fullName}` : 'Réception d\'argent'),
        previousBalance: recipientBalance,
        newBalance: recipientBalance + amountInRecipientCurrency,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
        senderId,
        senderCurrency,
        amountSentInSenderCurrency: amount,
        exchangeRate: amountInRecipientCurrency / amountInCDF,
        transferMethod,
      };
      
      // Ajouter le nom de l'expéditeur seulement s'il existe
      if (senderData?.fullName) {
        recipientTransactionData.senderName = senderData.fullName;
      }
      
      await recipientTransactionRef.set(recipientTransactionData);

      // Créer les notifications
      const senderNotificationRef = db.collection('users').doc(senderId).collection('notifications').doc();
      await senderNotificationRef.set({
        id: senderNotificationRef.id,
        type: 'transfer_sent',
        title: 'Argent envoyé',
        message: `Vous avez envoyé ${amount.toLocaleString('fr-FR')} ${senderCurrency} à ${recipientData.fullName}`,
        amount,
        senderCurrency,
        transactionId: senderTransactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      const recipientNotificationRef = db.collection('users').doc(recipientId_final).collection('notifications').doc();
      await recipientNotificationRef.set({
        id: recipientNotificationRef.id,
        type: 'transfer_received',
        title: 'Argent reçu',
        message: `Vous avez reçu ${amountInRecipientCurrency.toLocaleString('fr-FR')} ${recipientCurrency} de ${senderData.fullName}`,
        amount: amountInRecipientCurrency,
        recipientCurrency,
        transactionId: recipientTransactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Argent envoyé avec succès',
        transactionId: senderTransactionRef.id,
        newBalance: senderBalance - amount,
        amountSent: amount,
        senderCurrency,
        amountReceived: amountInRecipientCurrency,
        recipientCurrency,
        exchangeRate: amountInRecipientCurrency / amountInCDF,
      };
    } catch (error) {
      console.error('Erreur envoi argent:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'envoi'
      );
    }
  }
);

/**
 * Cloud Function pour obtenir l'historique des transferts
 */
export const getTransferHistory = functions.https.onCall(
  async (data: {
    userId: string;
    limit?: number;
  }, context) => {
    const { userId, limit = 50 } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez voir que votre propre historique'
      );
    }

    try {
      const db = admin.firestore();

      const snapshot = await db.collection('users').doc(userId)
        .collection('transactions')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        transactions,
        count: transactions.length,
      };
    } catch (error) {
      console.error('Erreur historique transferts:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération de l\'historique'
      );
    }
  }
);
