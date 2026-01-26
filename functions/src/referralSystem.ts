import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

/**
 * Cloud Function pour générer un lien de parrainage
 */
export const generateReferralLink = functions.https.onCall(
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
        'Vous ne pouvez générer que votre propre lien'
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

      const userData = userDoc.data()!;

      // Vérifier si un code de parrainage existe déjà
      let referralCode = userData.referralCode;

      if (!referralCode) {
        // Générer un nouveau code de parrainage
        referralCode = crypto.randomBytes(6).toString('hex').toUpperCase();

        // Sauvegarder le code
        await db.collection('users').doc(userId).update({
          referralCode,
          referralCodeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const referralLink = `https://enkamba.io/onboarding?referralCode=${referralCode}`;

      return {
        success: true,
        referralCode,
        referralLink,
        referralStats: {
          totalReferrals: userData.totalReferrals || 0,
          totalEarnings: userData.totalReferralEarnings || 0,
        },
      };
    } catch (error) {
      console.error('Erreur génération lien parrainage:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la génération du lien'
      );
    }
  }
);

/**
 * Cloud Function pour valider et appliquer un code de parrainage
 */
export const applyReferralCode = functions.https.onCall(
  async (data: {
    userId: string;
    referralCode: string;
  }, context) => {
    const { userId, referralCode } = data;

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous ne pouvez appliquer que pour votre propre compte'
      );
    }

    try {
      const db = admin.firestore();

      // Récupérer l'utilisateur actuel
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Utilisateur non trouvé'
        );
      }

      const userData = userDoc.data()!;

      // Vérifier que l'utilisateur n'a pas déjà un parrain
      if (userData.referredBy) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Vous avez déjà un code de parrainage appliqué'
        );
      }

      // Trouver l'utilisateur avec ce code de parrainage
      const referrerSnapshot = await db.collection('users')
        .where('referralCode', '==', referralCode)
        .limit(1)
        .get();

      if (referrerSnapshot.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'Code de parrainage invalide'
        );
      }

      const referrerId = referrerSnapshot.docs[0].id;

      // Vérifier que ce n'est pas le même utilisateur
      if (referrerId === userId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Vous ne pouvez pas vous parrainer vous-même'
        );
      }

      // Appliquer le code de parrainage
      await db.collection('users').doc(userId).update({
        referredBy: referrerId,
        referralCodeAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mettre à jour les statistiques du parrain
      const referrerDoc = await db.collection('users').doc(referrerId).get();
      const referrerData = referrerDoc.data()!;

      const newTotalReferrals = (referrerData.totalReferrals || 0) + 1;
      // 100 personnes parrainées = 10 CDF, donc 1 personne = 0.1 CDF
      const bonusAmount = 0.1;
      const newEarnings = (referrerData.totalReferralEarnings || 0) + bonusAmount;
      const newBalance = (referrerData.walletBalance || 0) + bonusAmount;

      await db.collection('users').doc(referrerId).update({
        totalReferrals: newTotalReferrals,
        totalReferralEarnings: newEarnings,
        walletBalance: newBalance,
        lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer une transaction pour le bonus de parrainage
      const bonusTransactionRef = db.collection('users').doc(referrerId).collection('transactions').doc();
      await bonusTransactionRef.set({
        id: bonusTransactionRef.id,
        type: 'referral_bonus',
        amount: bonusAmount,
        status: 'completed',
        description: `Bonus de parrainage - ${userData.fullName}`,
        previousBalance: referrerData.walletBalance || 0,
        newBalance,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
        referredUserId: userId,
      });

      // Créer une notification pour le parrain
      const notificationRef = db.collection('users').doc(referrerId).collection('notifications').doc();
      await notificationRef.set({
        id: notificationRef.id,
        type: 'referral_bonus',
        title: 'Bonus de parrainage reçu',
        message: `${userData.fullName} a utilisé votre code. Vous avez reçu ${bonusAmount.toLocaleString('fr-FR')} CDF (${newTotalReferrals}/100)`,
        amount: bonusAmount,
        referredUserId: userId,
        referredUserName: userData.fullName,
        totalReferrals: newTotalReferrals,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Code de parrainage appliqué avec succès',
        referrerName: referrerData.fullName,
      };
    } catch (error) {
      console.error('Erreur application code parrainage:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'application du code'
      );
    }
  }
);

/**
 * Cloud Function pour obtenir les statistiques de parrainage
 */
export const getReferralStats = functions.https.onCall(
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

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Utilisateur non trouvé'
        );
      }

      const userData = userDoc.data()!;

      // Récupérer les utilisateurs parrainés
      const referredSnapshot = await db.collection('users')
        .where('referredBy', '==', userId)
        .get();

      const referredUsers = referredSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().fullName,
        email: doc.data().email,
        referredAt: doc.data().referralCodeAppliedAt,
      }));

      return {
        success: true,
        stats: {
          referralCode: userData.referralCode || null,
          totalReferrals: userData.totalReferrals || 0,
          totalEarnings: userData.totalReferralEarnings || 0,
          referredUsers,
          referredBy: userData.referredBy || null,
        },
      };
    } catch (error) {
      console.error('Erreur statistiques parrainage:', error);
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
