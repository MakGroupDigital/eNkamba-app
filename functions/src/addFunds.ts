import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface AddFundsRequest {
  userId: string;
  amount: number;
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
  phoneNumber?: string;
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
  };
}

export const addFunds = functions.https.onCall(
  async (data: AddFundsRequest, context) => {
    try {
      // Vérifier l'authentification
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'L\'utilisateur doit être authentifié'
        );
      }

      const { userId, amount, paymentMethod, phoneNumber, cardDetails } = data;

      // Vérifier que l'utilisateur ne modifie que son propre portefeuille
      if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Permission refusée'
        );
      }

      // Valider les paramètres
      if (!userId || !amount || !paymentMethod) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Paramètres manquants: userId, amount, paymentMethod requis'
        );
      }

      if (amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Le montant doit être supérieur à 0'
        );
      }

      // Référence utilisateur
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      // Obtenir le solde actuel
      let currentBalance = 0;
      let userData: any = {};

      if (userDoc.exists) {
        userData = userDoc.data();
        currentBalance = userData?.walletBalance || 0;
      } else {
        // Créer le document utilisateur s'il n'existe pas
        await userRef.set({
          uid: userId,
          walletBalance: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const newBalance = currentBalance + amount;

      // Créer la transaction
      const transactionRef = db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc();

      const transactionData: any = {
        id: transactionRef.id,
        type: 'deposit',
        amount,
        paymentMethod,
        status: 'completed',
        previousBalance: currentBalance,
        newBalance,
        description: `Ajout de fonds via ${
          paymentMethod === 'mobile_money'
            ? 'Mobile Money'
            : paymentMethod === 'card'
            ? 'Carte bancaire'
            : 'Virement bancaire'
        }`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      // Ajouter les détails spécifiques au mode de paiement
      if (paymentMethod === 'mobile_money') {
        transactionData.phoneNumber = phoneNumber;
      } else if (paymentMethod === 'card' && cardDetails) {
        transactionData.cardLast4 = cardDetails.cardNumber?.slice(-4);
        transactionData.cardHolder = cardDetails.cardHolder;
      }

      // Sauvegarder la transaction
      await transactionRef.set(transactionData);

      // Mettre à jour le solde du portefeuille
      await userRef.update({
        walletBalance: newBalance,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer une notification
      const notificationRef = db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc();

      await notificationRef.set({
        id: notificationRef.id,
        type: 'transaction',
        title: 'Fonds ajoutés',
        message: `${amount.toLocaleString('fr-FR')} CDF ont été ajoutés à votre portefeuille`,
        amount,
        transactionId: transactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        transactionId: transactionRef.id,
        newBalance,
        amount,
        message: 'Fonds ajoutés avec succès',
      };
    } catch (error: any) {
      console.error('Erreur addFunds:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erreur lors de l\'ajout de fonds'
      );
    }
  }
);
