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
exports.processUnifiedPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Cloud Function pour traiter les paiements unifiés
 * Utilisée par tous les contextes (Wallet, Nkampa, Ugavi, Makutano, Miyiki, Bills, Services)
 */
exports.processUnifiedPayment = functions.https.onCall(async (data, context) => {
    const { payerId, amount, paymentMethod, context: paymentContext, recipientId, recipientIdentifier, qrCodeData, description, metadata, } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== payerId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez payer que depuis votre propre compte');
    }
    if (!amount || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Le montant doit être supérieur à 0');
    }
    try {
        const db = admin.firestore();
        // Récupérer le payeur
        const payerDoc = await db.collection('users').doc(payerId).get();
        if (!payerDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
        }
        const payerData = payerDoc.data();
        const payerBalance = payerData.walletBalance || 0;
        // Vérifier le solde
        if (payerBalance < amount) {
            throw new functions.https.HttpsError('failed-precondition', 'Solde insuffisant');
        }
        let recipientId_final = recipientId;
        let recipientData = null;
        // Trouver le destinataire selon la méthode (sauf pour Bluetooth/WiFi)
        if ((paymentMethod !== 'bluetooth' && paymentMethod !== 'wifi') && recipientIdentifier) {
            let query = null;
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
                    throw new functions.https.HttpsError('invalid-argument', 'Méthode de paiement invalide');
            }
            if (query) {
                const snapshot = await query.limit(1).get();
                if (snapshot.empty) {
                    throw new functions.https.HttpsError('not-found', 'Destinataire non trouvé');
                }
                recipientId_final = snapshot.docs[0].id;
                recipientData = snapshot.docs[0].data();
            }
        }
        else if (paymentMethod === 'bluetooth' || paymentMethod === 'wifi') {
            recipientId_final = recipientId;
        }
        else if (paymentMethod === 'qrcode') {
            recipientId_final = qrCodeData;
        }
        if (!recipientId_final) {
            throw new functions.https.HttpsError('invalid-argument', 'Destinataire non spécifié');
        }
        // Vérifier que ce n'est pas le même utilisateur
        if (recipientId_final === payerId) {
            throw new functions.https.HttpsError('invalid-argument', 'Vous ne pouvez pas payer vous-même');
        }
        // Récupérer le destinataire
        const recipientDoc = await db.collection('users').doc(recipientId_final).get();
        if (!recipientDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Destinataire non trouvé');
        }
        recipientData = recipientDoc.data();
        const recipientBalance = recipientData.walletBalance || 0;
        // Effectuer le paiement
        await db.collection('users').doc(payerId).update({
            walletBalance: payerBalance - amount,
            lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        await db.collection('users').doc(recipientId_final).update({
            walletBalance: recipientBalance + amount,
            lastTransactionTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Créer les transactions
        const payerTransactionRef = db.collection('users').doc(payerId).collection('transactions').doc();
        const payerTransactionData = {
            id: payerTransactionRef.id,
            type: 'payment_sent',
            context: paymentContext,
            amount,
            amountInCDF: amount,
            status: 'completed',
            description: description || `Paiement à ${recipientData.fullName}`,
            previousBalance: payerBalance,
            newBalance: payerBalance - amount,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
            recipientId: recipientId_final,
            paymentMethod,
            metadata: metadata || {},
        };
        if (recipientData?.fullName) {
            payerTransactionData.recipientName = recipientData.fullName;
        }
        await payerTransactionRef.set(payerTransactionData);
        const recipientTransactionRef = db.collection('users').doc(recipientId_final).collection('transactions').doc();
        const recipientTransactionData = {
            id: recipientTransactionRef.id,
            type: 'payment_received',
            context: paymentContext,
            amount,
            amountInCDF: amount,
            status: 'completed',
            description: description || `Paiement reçu de ${payerData.fullName}`,
            previousBalance: recipientBalance,
            newBalance: recipientBalance + amount,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
            senderId: payerId,
            paymentMethod,
            metadata: metadata || {},
        };
        if (payerData?.fullName) {
            recipientTransactionData.senderName = payerData.fullName;
        }
        await recipientTransactionRef.set(recipientTransactionData);
        // Créer les notifications
        const payerNotificationRef = db.collection('users').doc(payerId).collection('notifications').doc();
        await payerNotificationRef.set({
            id: payerNotificationRef.id,
            type: 'payment_sent',
            title: 'Paiement effectué',
            message: `Vous avez payé ${amount.toLocaleString('fr-FR')} CDF à ${recipientData.fullName}`,
            amount,
            transactionId: payerTransactionRef.id,
            context: paymentContext,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        const recipientNotificationRef = db.collection('users').doc(recipientId_final).collection('notifications').doc();
        await recipientNotificationRef.set({
            id: recipientNotificationRef.id,
            type: 'payment_received',
            title: 'Paiement reçu',
            message: `Vous avez reçu ${amount.toLocaleString('fr-FR')} CDF de ${payerData.fullName}`,
            amount,
            transactionId: recipientTransactionRef.id,
            context: paymentContext,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        return {
            success: true,
            message: 'Paiement effectué avec succès',
            transactionId: payerTransactionRef.id,
            newBalance: payerBalance - amount,
        };
    }
    catch (error) {
        console.error('Erreur paiement unifié:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors du paiement');
    }
});
//# sourceMappingURL=unifiedPayment.js.map