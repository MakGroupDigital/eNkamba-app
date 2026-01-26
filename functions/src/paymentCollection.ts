import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

/**
 * Cloud Function pour créer un lien de paiement
 */
export const createPaymentLink = functions.https.onCall(
  async (data: {
    userId: string;
    amount?: number;
    description?: string;
    method: 'link' | 'qr' | 'phone' | 'code' | 'nfc';
  }, context) => {
    const { userId, amount, description, method } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez créer que vos propres liens'
      );
    }

    try {
      const db = admin.firestore();

      // Vérifier que l'utilisateur existe
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Utilisateur non trouvé'
        );
      }

      // Générer un code unique
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const linkId = crypto.randomBytes(8).toString('hex');

      // Créer le lien de paiement
      const linkRef = db.collection('paymentLinks').doc(linkId);

      await linkRef.set({
        id: linkId,
        code,
        userId,
        amount: amount || null,
        description: description || null,
        method,
        status: 'active', // active, used, expired
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        usedAt: null,
        usedBy: null,
      });

      return {
        success: true,
        linkId,
        code,
        qrCode: null, // QR code généré côté client
      };
    } catch (error) {
      console.error('Erreur création lien paiement:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création du lien'
      );
    }
  }
);

/**
 * Cloud Function pour valider et traiter un paiement via lien
 */
export const processPaymentLink = functions.https.onCall(
  async (data: {
    linkId: string;
    code: string;
    payerId: string;
    amount: number;
  }, context) => {
    const { linkId, code, payerId, amount } = data;

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

    try {
      const db = admin.firestore();

      // Récupérer le lien de paiement
      const linkDoc = await db.collection('paymentLinks').doc(linkId).get();

      if (!linkDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Lien de paiement non trouvé'
        );
      }

      const linkData = linkDoc.data()!;

      // Vérifier le code
      if (linkData.code !== code) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Code invalide'
        );
      }

      // Vérifier le statut
      if (linkData.status !== 'active') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Ce lien de paiement n\'est plus actif'
        );
      }

      // Vérifier l'expiration
      if (new Date(linkData.expiresAt) < new Date()) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Ce lien de paiement a expiré'
        );
      }

      // Vérifier le montant si spécifié
      if (linkData.amount && amount !== linkData.amount) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Le montant doit être ${linkData.amount} CDF`
        );
      }

      // Vérifier que le payeur n'est pas le destinataire
      if (payerId === linkData.userId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Vous ne pouvez pas payer vous-même'
        );
      }

      // Vérifier le solde du payeur
      const payerDoc = await db.collection('users').doc(payerId).get();
      const payerBalance = payerDoc.data()?.walletBalance || 0;

      if (payerBalance < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Solde insuffisant'
        );
      }

      // Effectuer le transfert
      const receiverRef = db.collection('users').doc(linkData.userId);
      const payerRef = db.collection('users').doc(payerId);

      const receiverDoc = await receiverRef.get();
      const receiverBalance = receiverDoc.data()?.walletBalance || 0;

      // Mettre à jour les soldes
      await payerRef.update({
        walletBalance: payerBalance - amount,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      await receiverRef.update({
        walletBalance: receiverBalance + amount,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer les transactions
      const payerTransactionRef = db.collection('users').doc(payerId).collection('transactions').doc();
      await payerTransactionRef.set({
        id: payerTransactionRef.id,
        type: 'payment',
        amount,
        status: 'completed',
        description: `Paiement via lien à ${receiverDoc.data()?.fullName}`,
        previousBalance: payerBalance,
        newBalance: payerBalance - amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
        linkId,
      });

      const receiverTransactionRef = db.collection('users').doc(linkData.userId).collection('transactions').doc();
      await receiverTransactionRef.set({
        id: receiverTransactionRef.id,
        type: 'payment_received',
        amount,
        status: 'completed',
        description: `Paiement reçu de ${payerDoc.data()?.fullName}`,
        previousBalance: receiverBalance,
        newBalance: receiverBalance + amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
        linkId,
      });

      // Créer les notifications
      const payerNotificationRef = db.collection('users').doc(payerId).collection('notifications').doc();
      await payerNotificationRef.set({
        id: payerNotificationRef.id,
        type: 'payment_sent',
        title: 'Paiement envoyé',
        message: `Vous avez envoyé ${amount.toLocaleString('fr-FR')} CDF`,
        amount,
        transactionId: payerTransactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      const receiverNotificationRef = db.collection('users').doc(linkData.userId).collection('notifications').doc();
      await receiverNotificationRef.set({
        id: receiverNotificationRef.id,
        type: 'payment_received',
        title: 'Paiement reçu',
        message: `Vous avez reçu ${amount.toLocaleString('fr-FR')} CDF de ${payerDoc.data()?.fullName}`,
        amount,
        transactionId: receiverTransactionRef.id,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      // Marquer le lien comme utilisé
      await linkDoc.ref.update({
        status: 'used',
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        usedBy: payerId,
      });

      return {
        success: true,
        message: 'Paiement effectué avec succès',
        transactionId: payerTransactionRef.id,
      };
    } catch (error) {
      console.error('Erreur traitement paiement:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du traitement du paiement'
      );
    }
  }
);

/**
 * Cloud Function pour obtenir les détails d'un lien de paiement
 */
export const getPaymentLinkDetails = functions.https.onCall(
  async (data: {
    linkId: string;
    code: string;
  }, context) => {
    const { linkId, code } = data;

    try {
      const db = admin.firestore();

      // Récupérer le lien
      const linkDoc = await db.collection('paymentLinks').doc(linkId).get();

      if (!linkDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Lien de paiement non trouvé'
        );
      }

      const linkData = linkDoc.data()!;

      // Vérifier le code
      if (linkData.code !== code) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Code invalide'
        );
      }

      // Récupérer les infos du destinataire
      const receiverDoc = await db.collection('users').doc(linkData.userId).get();
      const receiverData = receiverDoc.data();

      return {
        success: true,
        link: {
          id: linkId,
          amount: linkData.amount,
          description: linkData.description,
          status: linkData.status,
          receiver: {
            name: receiverData?.fullName,
            email: receiverData?.email,
            accountNumber: receiverData?.accountNumber,
          },
        },
      };
    } catch (error) {
      console.error('Erreur récupération lien:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération du lien'
      );
    }
  }
);

/**
 * Cloud Function pour créer un code de paiement par contact
 */
export const createContactPaymentCode = functions.https.onCall(
  async (data: {
    userId: string;
    amount?: number;
  }, context) => {
    const { userId, amount } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez créer que vos propres codes'
      );
    }

    try {
      const db = admin.firestore();

      // Générer un code unique
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();

      // Créer le code de paiement
      const codeRef = db.collection('contactPaymentCodes').doc();

      await codeRef.set({
        id: codeRef.id,
        code,
        userId,
        amount: amount || null,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      return {
        success: true,
        code,
        codeId: codeRef.id,
      };
    } catch (error) {
      console.error('Erreur création code contact:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création du code'
      );
    }
  }
);

/**
 * Cloud Function pour obtenir les statistiques d'encaissement
 */
export const getCollectionStats = functions.https.onCall(
  async (data: {
    userId: string;
  }, context) => {
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
        'Vous ne pouvez voir que vos propres statistiques'
      );
    }

    try {
      const db = admin.firestore();

      // Compter les liens actifs
      const activeLinksSnapshot = await db.collection('paymentLinks')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();

      // Compter les paiements reçus ce mois
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const paymentsSnapshot = await db.collection('users').doc(userId)
        .collection('transactions')
        .where('type', '==', 'payment_received')
        .where('timestamp', '>=', thisMonth)
        .get();

      let totalReceived = 0;
      paymentsSnapshot.forEach(doc => {
        totalReceived += doc.data().amount || 0;
      });

      return {
        success: true,
        stats: {
          activeLinks: activeLinksSnapshot.size,
          paymentsThisMonth: paymentsSnapshot.size,
          totalReceivedThisMonth: totalReceived,
        },
      };
    } catch (error) {
      console.error('Erreur statistiques:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération des statistiques'
      );
    }
  }
);
