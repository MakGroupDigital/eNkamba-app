import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Soumettre une demande de compte entreprise
 */
export const submitBusinessRequest = functions.https.onCall(
  async (data: {
    businessName: string;
    type: 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';
    subCategory: string;
    registrationNumber: string;
    address: string;
    city: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
    apiCallbackUrl?: string;
    documents: Record<string, string>;
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    const userId = context.auth.uid;

    // Valider les données
    if (!data.businessName?.trim()) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le nom de l\'entreprise est requis'
      );
    }

    if (!['COMMERCE', 'LOGISTICS', 'PAYMENT'].includes(data.type)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Type d\'entreprise invalide'
      );
    }

    if (!data.registrationNumber?.trim()) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le numéro d\'enregistrement est requis'
      );
    }

    try {
      const now = Date.now();

      // Vérifier s'il existe déjà une demande
      const existingQuery = await db
        .collection('business_requests')
        .where('userId', '==', userId)
        .get();

      let docRef;

      if (!existingQuery.empty) {
        // Mettre à jour la demande existante
        docRef = existingQuery.docs[0].ref;
        await docRef.update({
          businessName: data.businessName,
          type: data.type,
          subCategory: data.subCategory,
          registrationNumber: data.registrationNumber,
          address: data.address,
          city: data.city,
          country: data.country,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          apiCallbackUrl: data.apiCallbackUrl || null,
          documents: data.documents,
          status: 'PENDING',
          updatedAt: now,
          submittedAt: existingQuery.docs[0].data().submittedAt || now,
        });
      } else {
        // Créer une nouvelle demande
        const newRequest = {
          userId,
          businessName: data.businessName,
          type: data.type,
          subCategory: data.subCategory,
          registrationNumber: data.registrationNumber,
          address: data.address,
          city: data.city,
          country: data.country,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          apiCallbackUrl: data.apiCallbackUrl || null,
          documents: data.documents,
          status: 'PENDING',
          submittedAt: now,
          updatedAt: now,
        };

        docRef = await db.collection('business_requests').add(newRequest);
      }

      const updatedDoc = await docRef.get();
      return {
        success: true,
        data: {
          ...updatedDoc.data(),
          id: docRef.id,
        },
      };
    } catch (error) {
      console.error('Erreur soumission demande entreprise:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la soumission de la demande'
      );
    }
  }
);

/**
 * Approuver une demande de compte entreprise (Admin)
 */
export const approveBusinessRequest = functions.https.onCall(
  async (data: {
    requestId: string;
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    // Vérifier que l'utilisateur est admin
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous n\'avez pas les permissions pour approuver les demandes'
      );
    }

    try {
      const requestRef = db.collection('business_requests').doc(data.requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Demande non trouvée'
        );
      }

      const requestData = requestDoc.data()!;
      const now = Date.now();

      // Créer le profil entreprise
      const businessProfile = {
        ...requestData,
        businessId: data.requestId,
        status: 'VERIFIED',
        isActive: true,
        verifiedAt: now,
        verifiedBy: context.auth.uid,
      };

      // Ajouter à la collection businesses
      await db.collection('businesses').doc(data.requestId).set(businessProfile);

      // Mettre à jour le statut dans business_requests
      await requestRef.update({
        status: 'VERIFIED',
        verifiedAt: now,
        verifiedBy: context.auth.uid,
        updatedAt: now,
      });

      // Mettre à jour le profil utilisateur
      await db.collection('users').doc(requestData.userId).update({
        isBusiness: true,
        businessId: data.requestId,
        businessType: requestData.type,
        businessStatus: 'VERIFIED',
      });

      return {
        success: true,
        message: 'Demande approuvée avec succès',
      };
    } catch (error) {
      console.error('Erreur approbation demande:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'approbation'
      );
    }
  }
);

/**
 * Rejeter une demande de compte entreprise (Admin)
 */
export const rejectBusinessRequest = functions.https.onCall(
  async (data: {
    requestId: string;
    reason: string;
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    // Vérifier que l'utilisateur est admin
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous n\'avez pas les permissions pour rejeter les demandes'
      );
    }

    try {
      const requestRef = db.collection('business_requests').doc(data.requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Demande non trouvée'
        );
      }

      const now = Date.now();

      await requestRef.update({
        status: 'REJECTED',
        rejectionReason: data.reason,
        updatedAt: now,
      });

      return {
        success: true,
        message: 'Demande rejetée',
      };
    } catch (error) {
      console.error('Erreur rejet demande:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du rejet'
      );
    }
  }
);

/**
 * Récupérer les demandes en attente (Admin)
 */
export const getPendingBusinessRequests = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    // Vérifier que l'utilisateur est admin
    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Vous n\'avez pas les permissions'
      );
    }

    try {
      const snapshot = await db
        .collection('business_requests')
        .where('status', '==', 'PENDING')
        .orderBy('submittedAt', 'desc')
        .get();

      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      console.error('Erreur récupération demandes:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération des demandes'
      );
    }
  }
);
