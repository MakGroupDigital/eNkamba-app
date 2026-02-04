import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface WithdrawFundsRequest {
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
}

export const withdrawFunds = functions.https.onCall(
  async (data: WithdrawFundsRequest, context) => {
    try {
      // Vérifier l'authentification
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'L\'utilisateur doit être authentifié'
        );
      }

      const {
        userId,
        amount,
        withdrawalMethod,
        phoneNumber,
        provider,
        providerName,
        agentCode,
        agentLocation,
        agentId,
        agentName,
      } = data;

      // Vérifier que l'utilisateur ne modifie que son propre portefeuille
      if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Permission refusée'
        );
      }

      // Valider les paramètres
      if (!userId || !amount || !withdrawalMethod) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Paramètres manquants: userId, amount, withdrawalMethod requis'
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

      if (userDoc.exists) {
        const userData = userDoc.data();
        currentBalance = userData?.walletBalance || 0;
      } else {
        throw new functions.https.HttpsError(
          'not-found',
          'Utilisateur non trouvé'
        );
      }

      // Vérifier le solde suffisant
      if (currentBalance < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Solde insuffisant pour effectuer ce retrait'
        );
      }

      const newBalance = currentBalance - amount;

      // Créer la transaction
      const transactionRef = db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc();

      const transactionData: any = {
        id: transactionRef.id,
        type: 'withdrawal',
        amount,
        withdrawalMethod,
        status: 'pending', // Le statut est "en attente" jusqu'à la confirmation
        previousBalance: currentBalance,
        newBalance,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      // Ajouter les détails spécifiques au mode de retrait
      if (withdrawalMethod === 'mobile_money') {
        transactionData.description = `Retrait via ${providerName || provider}`;
        transactionData.phoneNumber = phoneNumber;
        transactionData.provider = provider;
        transactionData.providerName = providerName;
      } else if (withdrawalMethod === 'agent') {
        transactionData.description = `Retrait chez agent eNkamba - ${agentLocation}`;
        transactionData.agentCode = agentCode;
        transactionData.agentLocation = agentLocation;
        transactionData.agentId = agentId;
        transactionData.agentName = agentName;
      }

      // Sauvegarder la transaction
      await transactionRef.set(transactionData);

      // Mettre à jour le solde du portefeuille (débit immédiat)
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
        transactionId: transactionRef.id,
        newBalance,
        amount,
        message: 'Retrait initié avec succès',
      };
    } catch (error: any) {
      console.error('Erreur withdrawFunds:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erreur lors du retrait'
      );
    }
  }
);
