"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMoneyRequests = exports.rejectMoneyRequest = exports.acceptMoneyRequest = exports.createMoneyRequest = exports.searchUserByIdentifier = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Cloud Function pour rechercher un utilisateur par identifiant
 */
exports.searchUserByIdentifier = functions.https.onCall(async (data, context) => {
    const { searchMethod, searchQuery, currentUserId } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== currentUserId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez rechercher que pour votre propre compte');
    }
    if (!searchQuery || !searchMethod) {
        throw new functions.https.HttpsError('invalid-argument', 'Paramètres de recherche invalides');
    }
    try {
        const db = admin.firestore();
        let query;
        // Construire la requête selon la méthode de recherche
        switch (searchMethod) {
            case 'card':
                query = db.collection('users').where('cardNumber', '==', searchQuery.trim());
                break;
            case 'account':
                query = db.collection('users').where('accountNumber', '==', searchQuery.trim().toUpperCase());
                break;
            case 'email':
                query = db.collection('users').where('email', '==', searchQuery.trim().toLowerCase());
                break;
            case 'phone':
                query = db.collection('users').where('phoneNumber', '==', searchQuery.trim());
                break;
            default:
                throw new functions.https.HttpsError('invalid-argument', 'Méthode de recherche invalide');
        }
        const snapshot = await query.limit(1).get();
        if (snapshot.empty) {
            return {
                success: false,
                user: null,
                message: 'Utilisateur non trouvé',
            };
        }
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        // Vérifier que ce n'est pas l'utilisateur lui-même
        if (userDoc.id === currentUserId) {
            return {
                success: false,
                user: null,
                message: 'Vous ne pouvez pas demander de l\'argent à vous-même',
            };
        }
        return {
            success: true,
            user: {
                uid: userDoc.id,
                fullName: userData.fullName || 'Utilisateur',
                email: userData.email || '',
                phoneNumber: userData.phoneNumber || '',
                cardNumber: userData.cardNumber || '',
                accountNumber: userData.accountNumber || '',
                profileImage: userData.profileImage || null,
            },
        };
    }
    catch (error) {
        console.error('Erreur recherche utilisateur:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la recherche');
    }
});
/**
 * Cloud Function pour créer une demande de paiement
 */
exports.createMoneyRequest = functions.https.onCall(async (data, context) => {
    const { fromUserId, toUserId, amount, description } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== fromUserId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez créer que vos propres demandes');
    }
    if (!amount || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Le montant doit être supérieur à 0');
    }
    if (fromUserId === toUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'Vous ne pouvez pas demander de l\'argent à vous-même');
    }
    try {
        const db = admin.firestore();
        // Vérifier que les deux utilisateurs existent
        const fromUserDoc = await db.collection('users').doc(fromUserId).get();
        const toUserDoc = await db.collection('users').doc(toUserId).get();
        if (!fromUserDoc.exists || !toUserDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
        }
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();
        // Créer la demande de paiement
        const requestRef = db.collection('moneyRequests').doc();
        await requestRef.set({
            id: requestRef.id,
            fromUserId,
            fromUserName: fromUserData.fullName || 'Utilisateur',
            toUserId,
            toUserName: toUserData.fullName || 'Utilisateur',
            amount,
            description,
            status: 'pending', // pending, accepted, rejected, expired
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            respondedAt: null,
        });
        // Créer une notification pour le destinataire
        const notificationRef = db.collection('users').doc(toUserId).collection('notifications').doc();
        await notificationRef.set({
            id: notificationRef.id,
            type: 'money_request',
            title: 'Demande de paiement',
            message: `${fromUserData.fullName} vous demande ${amount.toLocaleString('fr-FR')} CDF`,
            amount,
            requestId: requestRef.id,
            fromUserId,
            fromUserName: fromUserData.fullName,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        // Créer une notification pour l'expéditeur
        const senderNotificationRef = db.collection('users').doc(fromUserId).collection('notifications').doc();
        await senderNotificationRef.set({
            id: senderNotificationRef.id,
            type: 'money_request_sent',
            title: 'Demande envoyée',
            message: `Vous avez demandé ${amount.toLocaleString('fr-FR')} CDF à ${toUserData.fullName}`,
            amount,
            requestId: requestRef.id,
            toUserId,
            toUserName: toUserData.fullName,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        // Envoyer un email au destinataire
        const sendEmailFn = functions.https.onCall(async (emailData) => {
            // Email sera envoyé via une fonction séparée
            console.log('Email à envoyer à:', toUserData.email);
        });
        return {
            success: true,
            requestId: requestRef.id,
            message: 'Demande créée avec succès',
        };
    }
    catch (error) {
        console.error('Erreur création demande:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création de la demande');
    }
});
/**
 * Cloud Function pour accepter une demande de paiement
 */
exports.acceptMoneyRequest = functions.https.onCall(async (data, context) => {
    const { requestId, userId } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez accepter que vos propres demandes');
    }
    try {
        const db = admin.firestore();
        const requestRef = db.collection('moneyRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Demande non trouvée');
        }
        const requestData = requestDoc.data();
        if (requestData.toUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez accepter que les demandes qui vous sont adressées');
        }
        if (requestData.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Cette demande a déjà été traitée');
        }
        // Mettre à jour le statut de la demande
        await requestRef.update({
            status: 'accepted',
            respondedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Créer une notification pour l'expéditeur
        const notificationRef = db.collection('users').doc(requestData.fromUserId).collection('notifications').doc();
        await notificationRef.set({
            id: notificationRef.id,
            type: 'money_request_accepted',
            title: 'Demande acceptée',
            message: `${requestData.toUserName} a accepté votre demande de ${requestData.amount.toLocaleString('fr-FR')} CDF`,
            amount: requestData.amount,
            requestId,
            toUserId: requestData.toUserId,
            toUserName: requestData.toUserName,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        return {
            success: true,
            message: 'Demande acceptée',
        };
    }
    catch (error) {
        console.error('Erreur acceptation demande:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'acceptation de la demande');
    }
});
/**
 * Cloud Function pour refuser une demande de paiement
 */
exports.rejectMoneyRequest = functions.https.onCall(async (data, context) => {
    const { requestId, userId, reason } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez refuser que vos propres demandes');
    }
    try {
        const db = admin.firestore();
        const requestRef = db.collection('moneyRequests').doc(requestId);
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Demande non trouvée');
        }
        const requestData = requestDoc.data();
        if (requestData.toUserId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez refuser que les demandes qui vous sont adressées');
        }
        if (requestData.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Cette demande a déjà été traitée');
        }
        // Mettre à jour le statut de la demande
        await requestRef.update({
            status: 'rejected',
            respondedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: reason || null,
        });
        // Créer une notification pour l'expéditeur
        const notificationRef = db.collection('users').doc(requestData.fromUserId).collection('notifications').doc();
        await notificationRef.set({
            id: notificationRef.id,
            type: 'money_request_rejected',
            title: 'Demande refusée',
            message: `${requestData.toUserName} a refusé votre demande de ${requestData.amount.toLocaleString('fr-FR')} CDF`,
            amount: requestData.amount,
            requestId,
            toUserId: requestData.toUserId,
            toUserName: requestData.toUserName,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        return {
            success: true,
            message: 'Demande refusée',
        };
    }
    catch (error) {
        console.error('Erreur refus demande:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du refus de la demande');
    }
});
/**
 * Cloud Function pour récupérer les demandes de paiement
 */
exports.getMoneyRequests = functions.https.onCall(async (data, context) => {
    const { userId, type } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez voir que vos propres demandes');
    }
    try {
        const db = admin.firestore();
        let query;
        if (type === 'received') {
            query = db.collection('moneyRequests')
                .where('toUserId', '==', userId)
                .orderBy('createdAt', 'desc');
        }
        else {
            query = db.collection('moneyRequests')
                .where('fromUserId', '==', userId)
                .orderBy('createdAt', 'desc');
        }
        const snapshot = await query.limit(50).get();
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return {
            success: true,
            requests,
            count: requests.length,
        };
    }
    catch (error) {
        console.error('Erreur récupération demandes:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la récupération des demandes');
    }
});
//# sourceMappingURL=moneyRequest.js.map