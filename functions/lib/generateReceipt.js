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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceiptPDF = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const stream = __importStar(require("stream"));
const axios_1 = __importDefault(require("axios"));
/**
 * Cloud Function pour générer un reçu PDF moderne sans superposition
 */
exports.generateReceiptPDF = functions.https.onCall(async (data, context) => {
    const { userId, transactionId } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez générer que vos propres reçus');
    }
    try {
        const db = admin.firestore();
        // Récupérer la transaction
        const transactionDoc = await db.collection('users').doc(userId)
            .collection('transactions').doc(transactionId).get();
        if (!transactionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Transaction non trouvée');
        }
        const transaction = transactionDoc.data();
        // Récupérer les infos utilisateur (expéditeur)
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        // Récupérer les infos du destinataire si applicable
        let recipientData = null;
        if (transaction.recipientId) {
            const recipientDoc = await db.collection('users').doc(transaction.recipientId).get();
            if (recipientDoc.exists) {
                recipientData = recipientDoc.data();
            }
        }
        // Télécharger le logo
        let logoBuffer = null;
        try {
            const logoResponse = await axios_1.default.get('https://enkamba.io/enkamba-logo.png', {
                responseType: 'arraybuffer',
                timeout: 5000,
            });
            logoBuffer = Buffer.from(logoResponse.data);
        }
        catch (error) {
            console.warn('Logo non disponible, continuant sans logo');
        }
        // Créer le PDF
        const doc = new pdfkit_1.default({
            size: 'A4',
            margin: 30,
        });
        // Convertir le PDF en buffer
        const chunks = [];
        const passThrough = new stream.PassThrough();
        doc.pipe(passThrough);
        passThrough.on('data', (chunk) => {
            chunks.push(chunk);
        });
        // ===== EN-TÊTE MODERNE =====
        // Fond dégradé (simulé avec rectangle)
        doc.rect(0, 0, 595, 120).fill('#32BB78');
        // Logo et titre
        if (logoBuffer) {
            try {
                doc.image(logoBuffer, 40, 20, { width: 50, height: 50 });
            }
            catch (error) {
                console.warn('Erreur insertion logo');
            }
        }
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF').text('eNkamba', 100, 25);
        doc.fontSize(11).font('Helvetica').fillColor('#E8F5E9').text('La vie simplifiée et meilleure', 100, 55);
        // Retour à la position normale
        doc.fillColor('#000000').moveDown(3);
        // ===== TITRE DU REÇU =====
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#32BB78').text('REÇU DE TRANSACTION', { align: 'center' });
        doc.moveDown(0.3);
        // Numéro et date
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text(`Reçu #${transactionId.substring(0, 8).toUpperCase()}`, { align: 'center' });
        doc.text(`${new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} à ${new Date(transaction.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`, { align: 'center' });
        doc.moveDown(1);
        // ===== SECTION EXPÉDITEUR ET DESTINATAIRE =====
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#2a9d63').text('EXPÉDITEUR');
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(`${userData.fullName || 'N/A'}`);
        doc.text(`Email: ${userData.email || 'N/A'}`);
        doc.text(`Téléphone: ${userData.phoneNumber || 'N/A'}`);
        if (userData.accountNumber) {
            doc.text(`Compte: ${userData.accountNumber}`);
        }
        if (userData.cardNumber) {
            doc.text(`Carte: ${userData.cardNumber}`);
        }
        // Destinataire (seulement si applicable)
        if (recipientData && (transaction.type === 'transfer_sent' || transaction.type === 'transfer_received' || transaction.type === 'money_request_sent' || transaction.type === 'money_request_received')) {
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#2a9d63').text('DESTINATAIRE');
            doc.fontSize(9).font('Helvetica').fillColor('#000000');
            doc.text(`${recipientData.fullName || 'N/A'}`);
            doc.text(`Email: ${recipientData.email || 'N/A'}`);
            doc.text(`Téléphone: ${recipientData.phoneNumber || 'N/A'}`);
            if (recipientData.accountNumber) {
                doc.text(`Compte: ${recipientData.accountNumber}`);
            }
            if (recipientData.cardNumber) {
                doc.text(`Carte: ${recipientData.cardNumber}`);
            }
        }
        doc.moveDown(1);
        // ===== LIGNE DE SÉPARATION =====
        doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(1);
        // ===== DÉTAILS DE LA TRANSACTION =====
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('DÉTAILS DE LA TRANSACTION');
        doc.moveDown(0.5);
        const typeLabels = {
            'transfer_sent': 'Envoi d\'argent',
            'transfer_received': 'Réception d\'argent',
            'deposit': 'Dépôt',
            'withdrawal': 'Retrait',
            'payment_link': 'Lien de paiement',
            'contact_payment': 'Paiement contact',
            'money_request_sent': 'Demande d\'argent envoyée',
            'money_request_received': 'Demande d\'argent reçue',
        };
        const statusLabels = {
            'completed': 'Complétée',
            'pending': 'En attente',
            'failed': 'Échouée',
            'cancelled': 'Annulée',
        };
        // Détails avec espacement correct
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        doc.text(`Type: ${typeLabels[transaction.type] || transaction.type}`);
        doc.text(`Statut: ${statusLabels[transaction.status] || transaction.status}`);
        doc.text(`Description: ${transaction.description}`);
        if (transaction.transferMethod) {
            doc.text(`Méthode: ${transaction.transferMethod.charAt(0).toUpperCase() + transaction.transferMethod.slice(1)}`);
        }
        doc.moveDown(0.5);
        // ===== LIGNE DE SÉPARATION =====
        doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(1);
        // ===== MONTANTS (SECTION IMPORTANTE) =====
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#32BB78').text('MONTANTS');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`Montant: ${transaction.amount.toLocaleString('fr-FR')} ${transaction.currency || 'CDF'}`);
        if (transaction.status === 'completed') {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#32BB78').text('✓ Complétée');
        }
        else if (transaction.status === 'pending') {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFA500').text('⏳ En attente');
        }
        else if (transaction.status === 'cancelled') {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#FF6B6B').text('✗ Annulée');
        }
        doc.moveDown(0.5);
        if (transaction.amountInCDF && transaction.amountInCDF !== transaction.amount) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666');
            doc.text(`Équivalent CDF: ${transaction.amountInCDF.toLocaleString('fr-FR')} CDF`);
        }
        if (transaction.exchangeRate) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666');
            doc.text(`Taux de change: 1 ${transaction.currency || 'CDF'} = ${transaction.exchangeRate.toFixed(4)} CDF`);
        }
        if (transaction.recipientCurrency && transaction.amountReceivedInRecipientCurrency) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666');
            doc.text(`Montant reçu: ${transaction.amountReceivedInRecipientCurrency.toLocaleString('fr-FR')} ${transaction.recipientCurrency}`);
        }
        doc.moveDown(0.5);
        // ===== LIGNE DE SÉPARATION =====
        doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(1);
        // ===== INFORMATIONS DE SOLDE (SEULEMENT POUR L'EXPÉDITEUR) =====
        if (transaction.previousBalance !== undefined && transaction.newBalance !== undefined) {
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('SOLDE APRÈS TRANSACTION');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#666666');
            doc.text(`Solde avant: ${transaction.previousBalance.toLocaleString('fr-FR')} CDF`);
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#32BB78');
            doc.text(`Solde après: ${transaction.newBalance.toLocaleString('fr-FR')} CDF`);
            doc.moveDown(1);
            // ===== LIGNE DE SÉPARATION =====
            doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
            doc.moveDown(1);
        }
        // ===== PIED DE PAGE MODERNE =====
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text('Ce reçu est une preuve officielle de votre transaction.', { align: 'center' });
        doc.text('Veuillez le conserver pour vos dossiers.', { align: 'center' });
        doc.moveDown(1);
        // Fond pied de page
        doc.rect(0, doc.y, 595, 80).fill('#F5F5F5');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#32BB78').text('eNkamba', { align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        doc.text('La vie simplifiée et meilleure', { align: 'center' });
        doc.text('www.enkamba.io', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(8).fillColor('#999999');
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
        doc.text(`ID Reçu: ${transactionId}`, { align: 'center' });
        // Finaliser le PDF
        doc.end();
        // Attendre que le PDF soit complètement généré
        return new Promise((resolve, reject) => {
            passThrough.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64 = pdfBuffer.toString('base64');
                resolve({
                    success: true,
                    pdf: base64,
                    filename: `recu-${transactionId}.pdf`,
                    mimeType: 'application/pdf',
                });
            });
            passThrough.on('error', reject);
            doc.on('error', reject);
        });
    }
    catch (error) {
        console.error('Erreur génération PDF:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la génération du PDF');
    }
});
//# sourceMappingURL=generateReceipt.js.map