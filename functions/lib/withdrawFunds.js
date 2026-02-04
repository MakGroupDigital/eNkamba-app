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
exports.withdrawFunds = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.withdrawFunds = functions.https.onCall(async (data, context) => {
    try {
        // Vérifier l'authentification
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'L\'utilisateur doit être authentifié');
        }
        const { userId, amount, withdrawalMethod, phoneNumber, provider, providerName, agentCode, agentLocation, agentId, agentName, } = data;
        // Vérifier que l'utilisateur ne modifie que son propre portefeuille
        if (context.auth.uid !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Permission refusée');
        }
        // Valider les paramètres
        if (!userId || !amount || !withdrawalMethod) {
            throw new functions.https.HttpsError('invalid-argument', 'Paramètres manquants: userId, amount, withdrawalMethod requis');
        }
        if (amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Le montant doit être supérieur à 0');
        }
        // Référence utilisateur
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        // Obtenir le solde actuel
        let currentBalance = 0;
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentBalance = userData?.walletBalance || 0;
        }
        else {
            throw new functions.https.HttpsError('not-found', 'Utilisateur non trouvé');
        }
        // Vérifier le solde suffisant
        if (currentBalance < amount) {
            throw new functions.https.HttpsError('failed-precondition', 'Solde insuffisant pour effectuer ce retrait');
        }
        const newBalance = currentBalance - amount;
        // Créer la transaction
        const transactionRef = db
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .doc();
        const transactionData = {
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
        }
        else if (withdrawalMethod === 'agent') {
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
    }
    catch (error) {
        console.error('Erreur withdrawFunds:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Erreur lors du retrait');
    }
});
//# sourceMappingURL=withdrawFunds.js.map