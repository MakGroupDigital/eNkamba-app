import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function pour ajouter des fonds au portefeuille
 */
export const addFundsToWallet = functions.https.onCall(
  async (data: {
    userId: string;
    amount: number;
    paymentMethod: 'mobile_money' | 'credit_card' | 'debit_card';
    phoneNumber?: string;
    cardDetails?: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      cardholderName: string;
    };
  }, context) => {
    const { userId, amount, paymentMethod, phoneNumber, cardDetails } = data;

    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    // Vérifier que l'utilisateur ne modifie que son propre portefeuille
    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez modifier que votre propre portefeuille'
      );
    }

    // Valider le montant
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le montant doit être supérieur à 0'
      );
    }

    try {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      let userData = userDoc.data();
      
      // Si l'utilisateur n'existe pas, créer le document
      if (!userDoc.exists) {
        await userRef.set({
          uid: userId,
          walletBalance: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData = { walletBalance: 0 };
      }

      const currentBalance = userData?.walletBalance || 0;
      const newBalance = currentBalance + amount;

      // Créer la transaction
      const transactionRef = db.collection('users').doc(userId).collection('transactions').doc();
      
      await transactionRef.set({
        id: transactionRef.id,
        type: 'deposit',
        amount,
        paymentMethod,
        phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : null,
        cardLast4: paymentMethod !== 'mobile_money' ? cardDetails?.cardNumber?.slice(-4) : null,
        status: 'completed',
        previousBalance: currentBalance,
        newBalance,
        description: `Ajout de fonds via ${paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Carte bancaire'}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      // Mettre à jour le solde du portefeuille
      await userRef.update({
        walletBalance: newBalance,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer une notification
      const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
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
        message: 'Fonds ajoutés avec succès',
        transactionId: transactionRef.id,
        newBalance,
        amount,
      };
    } catch (error) {
      console.error('Erreur ajout de fonds:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'ajout de fonds'
      );
    }
  }
);

/**
 * Cloud Function pour retirer des fonds du portefeuille
 */
export const withdrawFundsFromWallet = functions.https.onCall(
  async (data: {
    userId: string;
    amount: number;
    withdrawalMethod: 'mobile_money' | 'agent';
    phoneNumber?: string;
    provider?: string;
    providerName?: string;
    agentCode?: string;
    agentLocation?: string;
    agentId?: string;
    agentName?: string;
  }, context) => {
    const { userId, amount, withdrawalMethod, phoneNumber, provider, providerName, agentCode, agentLocation, agentId, agentName } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez modifier que votre propre portefeuille'
      );
    }

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le montant doit être supérieur à 0'
      );
    }

    try {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      let userData = userDoc.data();
      
      // Si l'utilisateur n'existe pas, créer le document
      if (!userDoc.exists) {
        await userRef.set({
          uid: userId,
          walletBalance: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        userData = { walletBalance: 0 };
      }

      const currentBalance = userData?.walletBalance || 0;

      if (currentBalance < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Solde insuffisant'
        );
      }

      const newBalance = currentBalance - amount;

      // Créer la transaction
      const transactionRef = db.collection('users').doc(userId).collection('transactions').doc();
      
      let description = '';
      let transactionData: any = {
        id: transactionRef.id,
        type: 'withdrawal',
        amount,
        withdrawalMethod,
        status: 'pending',
        previousBalance: currentBalance,
        newBalance,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      if (withdrawalMethod === 'mobile_money') {
        description = `Retrait via ${providerName || provider}`;
        transactionData.phoneNumber = phoneNumber;
        transactionData.provider = provider;
        transactionData.providerName = providerName;
      } else if (withdrawalMethod === 'agent') {
        description = `Retrait chez agent eNkamba - ${agentLocation}`;
        transactionData.agentCode = agentCode;
        transactionData.agentLocation = agentLocation;
        transactionData.agentId = agentId;
        transactionData.agentName = agentName;
      }

      transactionData.description = description;

      await transactionRef.set(transactionData);

      // Mettre à jour le solde
      await userRef.update({
        walletBalance: newBalance,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer une notification
      const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
      await notificationRef.set({
        id: notificationRef.id,
        type: 'transaction',
        title: 'Retrait en cours',
        message: `Votre retrait de ${amount.toLocaleString('fr-FR')} CDF est en cours de traitement. Vous recevrez l'argent dans 24-48 heures.`,
        amount,
        transactionId: transactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Retrait initié avec succès',
        transactionId: transactionRef.id,
        newBalance,
        amount,
      };
    } catch (error) {
      console.error('Erreur retrait:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du retrait'
      );
    }
  }
);

/**
 * Cloud Function pour récupérer le solde du portefeuille
 */
export const getWalletBalance = functions.https.onCall(
  async (data: { userId: string }, context) => {
    const { userId } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez voir que votre propre solde'
      );
    }

    try {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      let balance = 0;
      
      // Si l'utilisateur n'existe pas, créer le document
      if (!userDoc.exists) {
        await userRef.set({
          uid: userId,
          walletBalance: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const userData = userDoc.data();
        balance = userData?.walletBalance || 0;
      }

      return {
        success: true,
        balance,
        currency: 'CDF',
      };
    } catch (error) {
      console.error('Erreur récupération solde:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération du solde'
      );
    }
  }
);

/**
 * Cloud Function pour récupérer l'historique des transactions
 */
export const getTransactionHistory = functions.https.onCall(
  async (data: { userId: string; limit?: number }, context) => {
    const { userId, limit = 20 } = data;

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
      const transactionsRef = db.collection('users').doc(userId).collection('transactions');
      
      const snapshot = await transactionsRef
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
      console.error('Erreur récupération historique:', error);
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

/**
 * Cloud Function pour annuler une transaction
 */
export const cancelTransaction = functions.https.onCall(
  async (data: {
    userId: string;
    transactionId: string;
  }, context) => {
    const { userId, transactionId } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez annuler que vos propres transactions'
      );
    }

    try {
      const db = admin.firestore();

      // Récupérer la transaction
      const transactionDoc = await db.collection('users').doc(userId)
        .collection('transactions').doc(transactionId).get();

      if (!transactionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Transaction non trouvée'
        );
      }

      const transaction = transactionDoc.data()!;

      // Vérifier que la transaction a moins de 24h
      const transactionTime = transaction.timestamp?.toDate?.() || new Date(transaction.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - transactionTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours > 24) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Vous ne pouvez annuler que les transactions de moins de 24h'
        );
      }

      // Vérifier que la transaction n'est pas déjà annulée
      if (transaction.status === 'cancelled') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cette transaction est déjà annulée'
        );
      }

      // Vérifier que la transaction est complétée
      if (transaction.status !== 'completed') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Seules les transactions complétées peuvent être annulées'
        );
      }

      // Annuler la transaction
      await transactionDoc.ref.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Rembourser l'utilisateur
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data()!;
      const currentBalance = userData.walletBalance || 0;

      // Déterminer le montant à rembourser
      let refundAmount = 0;
      if (transaction.type === 'transfer_sent' || transaction.type === 'withdrawal') {
        refundAmount = transaction.amount;
      }

      if (refundAmount > 0) {
        const newBalance = currentBalance + refundAmount;
        await userDoc.ref.update({
          walletBalance: newBalance,
        });

        // Créer une transaction de remboursement
        const refundTransactionRef = db.collection('users').doc(userId).collection('transactions').doc();
        await refundTransactionRef.set({
          id: refundTransactionRef.id,
          type: 'refund',
          amount: refundAmount,
          amountInCDF: transaction.amountInCDF || refundAmount,
          status: 'completed',
          description: `Remboursement - Annulation de transaction (${transaction.description})`,
          previousBalance: currentBalance,
          newBalance,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: new Date().toISOString(),
          relatedTransactionId: transactionId,
        });

        // Créer une notification
        const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
        await notificationRef.set({
          id: notificationRef.id,
          type: 'transaction_cancelled',
          title: 'Transaction annulée',
          message: `La transaction "${transaction.description}" a été annulée. ${refundAmount.toLocaleString('fr-FR')} CDF ont été remboursés.`,
          amount: refundAmount,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: 'Transaction annulée avec succès',
        refundAmount,
      };
    } catch (error) {
      console.error('Erreur annulation transaction:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'annulation'
      );
    }
  }
);
