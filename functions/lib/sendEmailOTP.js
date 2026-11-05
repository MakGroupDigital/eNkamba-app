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
exports.getKycStatus = exports.getUserProfile = exports.updateUserProfile = exports.completeKyc = exports.verifyEmailOTP = exports.createOrUpdateUserProfile = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
// Initialiser Firebase Admin
admin.initializeApp();
// Configurer le transporteur email
// À remplacer par votre configuration réelle (SendGrid, Gmail, etc.)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
const ENKAMBA_MINIMUM_AGE = 16;
function calculateAgeFromDateOfBirth(dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime()))
        return null;
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDifference = now.getMonth() - birthDate.getMonth();
    const dayDifference = now.getDate() - birthDate.getDate();
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age -= 1;
    }
    return age;
}
/**
 * Cloud Function pour créer ou mettre à jour le profil utilisateur
 * Appelée après la vérification du code OTP
 */
exports.createOrUpdateUserProfile = functions.https.onCall(async (data, context) => {
    const { email = '', phoneNumber = '' } = data;
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    // Valider au moins un identifiant de connexion
    if (!email.trim() && !phoneNumber.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Email ou numéro de téléphone requis');
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(context.auth.uid);
        const userSnap = await userRef.get();
        const existingUser = userSnap.exists ? userSnap.data() || {} : {};
        const kycStatus = existingUser.kycStatus || 'not_started';
        const shouldSendKycPrompt = kycStatus !== 'verified' && !existingUser.kycPromptSentAt;
        // Créer ou mettre à jour le document utilisateur
        await userRef.set({
            ...(email.trim() ? { email } : {}),
            ...(phoneNumber.trim() ? { phoneNumber, phone: phoneNumber } : {}),
            uid: context.auth.uid,
            ...(!userSnap.exists ? { createdAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
            kycStatus,
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            ...(shouldSendKycPrompt ? { kycPromptSentAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
        }, { merge: true });
        if (shouldSendKycPrompt) {
            await userRef.collection('notifications').add({
                type: 'kyc_required',
                title: 'Vérifiez votre identité',
                message: 'Complétez la vérification KYC pour sécuriser votre compte et débloquer toutes les opérations sensibles.',
                actionLabel: 'Commencer la vérification',
                actionUrl: '/kyc',
                icon: 'shield-check',
                read: false,
                acknowledged: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return {
            success: true,
            message: 'Profil utilisateur créé/mis à jour',
            uid: context.auth.uid,
        };
    }
    catch (error) {
        console.error('Erreur création profil utilisateur:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création du profil utilisateur');
    }
});
/**
 * Cloud Function pour envoyer un code OTP par email
export const sendEmailOTP = functions.https.onCall(
  async (data: { email: string }, context) => {
    const { email } = data;

    // Valider l'email
    if (!email || typeof email !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email requis et doit être une chaîne'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email invalide'
      );
    }

    try {
      // Générer un code OTP 6 chiffres
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Sauvegarder le code dans Firestore
      const db = admin.firestore();
      const otpRef = db.collection('emailOTPs').doc(email);

      await otpRef.set(
        {
          code: otp,
          email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          attempts: 0,
          verified: false,
        },
        { merge: true }
      );

      // Envoyer l'email avec le code
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Votre code de vérification Kenz',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #073B9A; }
                .content { text-align: center; }
                .code-box {
                  background-color: #f0f0f0;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 5px;
                  color: #073B9A;
                  font-family: monospace;
                }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
                .warning { color: #ff6b6b; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">Kenz</div>
                </div>
                <div class="content">
                  <h2>Vérification de votre email</h2>
                  <p>Voici votre code de vérification:</p>
                  <div class="code-box">${otp}</div>
                  <p>Ce code expire dans 10 minutes.</p>
                  <p class="warning">⚠️ Ne partagez ce code avec personne. Kenz ne vous demandera jamais ce code par email ou SMS.</p>
                </div>
                <div class="footer">
                  <p>© 2026 Kenz. Tous droits réservés.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return {
        success: true,
        message: 'Code envoyé avec succès',
      };
    } catch (error) {
      console.error('Erreur envoi OTP:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'envoi du code'
      );
    }
  }
);

/**
 * Cloud Function pour vérifier un code OTP
 *
 * Vérifie le code et crée/connecte l'utilisateur
 */
exports.verifyEmailOTP = functions.https.onCall(async (data, context) => {
    const { email, code } = data;
    // Valider les paramètres
    if (!email || !code) {
        throw new functions.https.HttpsError('invalid-argument', 'Email et code requis');
    }
    try {
        const db = admin.firestore();
        const otpRef = db.collection('emailOTPs').doc(email);
        const otpDoc = await otpRef.get();
        // Vérifier que le document existe
        if (!otpDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Aucun code trouvé pour cet email');
        }
        const otpData = otpDoc.data();
        // Vérifier que le code n'a pas expiré
        const expiresAt = otpData.expiresAt.toDate();
        if (new Date() > expiresAt) {
            await otpRef.delete();
            throw new functions.https.HttpsError('deadline-exceeded', 'Code expiré');
        }
        // Vérifier le nombre de tentatives
        if (otpData.attempts >= 5) {
            await otpRef.delete();
            throw new functions.https.HttpsError('permission-denied', 'Trop de tentatives. Veuillez renvoyer un code.');
        }
        // Vérifier le code
        if (otpData.code !== code.trim()) {
            await otpRef.update({
                attempts: admin.firestore.FieldValue.increment(1),
            });
            throw new functions.https.HttpsError('invalid-argument', 'Code incorrect');
        }
        // Code correct - créer ou mettre à jour l'utilisateur
        const auth = admin.auth();
        let uid;
        try {
            // Essayer de récupérer l'utilisateur existant
            const user = await auth.getUserByEmail(email);
            uid = user.uid;
        }
        catch (error) {
            // Utilisateur n'existe pas - le créer
            if (error.code === 'auth/user-not-found') {
                const user = await auth.createUser({
                    email,
                    emailVerified: true,
                });
                uid = user.uid;
            }
            else {
                throw error;
            }
        }
        // Marquer le code comme vérifié et supprimer
        await otpRef.delete();
        // Créer un token personnalisé pour le client
        const customToken = await auth.createCustomToken(uid);
        return {
            success: true,
            uid,
            customToken,
            message: 'Vérification réussie',
        };
    }
    catch (error) {
        console.error('Erreur vérification OTP:', error);
        if (error.code && error.code.startsWith('auth/')) {
            throw new functions.https.HttpsError('internal', 'Erreur lors de la vérification');
        }
        throw error;
    }
});
/**
 * Cloud Function pour compléter la vérification KYC
 *
 * Stocke les données KYC dans Firestore et met à jour le statut utilisateur
 */
exports.completeKyc = functions.https.onCall(async (data, context) => {
    const { userId, identityType, identityNumber, fullName, dateOfBirth, country, idFrontUrl, idBackUrl, selfieUrl, faceAssessment, linkedAccount } = data;
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    // Vérifier que l'utilisateur ne modifie que ses propres données
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez modifier que vos propres données');
    }
    // Valider les paramètres - STRICT
    if (!identityType || !identityType.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Type de pièce d\'identité requis');
    }
    if (!identityNumber || !identityNumber.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Numéro de pièce d\'identité requis');
    }
    if (!fullName || !fullName.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Nom complet requis');
    }
    if (!dateOfBirth || !dateOfBirth.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Date de naissance requise');
    }
    if (!country || !country.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Pays requis');
    }
    const calculatedAge = calculateAgeFromDateOfBirth(dateOfBirth);
    if (calculatedAge === null) {
        throw new functions.https.HttpsError('invalid-argument', 'Date de naissance invalide');
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        if (calculatedAge < ENKAMBA_MINIMUM_AGE) {
            await userRef.set({
                dateOfBirth,
                age: calculatedAge,
                ageRestrictionStatus: 'blocked_under_16',
                ageRestrictionReason: 'date_of_birth_under_minimum',
                ageRestrictionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            throw new functions.https.HttpsError('failed-precondition', `Kenz est réservé aux utilisateurs de ${ENKAMBA_MINIMUM_AGE} ans ou plus`);
        }
        const submissionRef = db.collection('kycSubmissions').doc(userId);
        // Préparer les données KYC. La validation finale doit rester contrôlée.
        const kycData = {
            kyc: {
                status: 'in_review',
                submittedAt: admin.firestore.FieldValue.serverTimestamp(),
                identity: {
                    type: identityType,
                    numberLast4: identityNumber.slice(-4),
                    fullName,
                    dateOfBirth,
                    country,
                },
                documents: {
                    idFrontUrl: idFrontUrl || null,
                    idBackUrl: idBackUrl || null,
                    selfieUrl: selfieUrl || null,
                },
                faceAssessment: faceAssessment || null,
                linkedAccount: linkedAccount || null,
            },
            // Mettre à jour le statut utilisateur
            kycStatus: 'in_review',
            age: calculatedAge,
            kycSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Sauvegarder dans Firestore
        await userRef.set(kycData, { merge: true });
        await submissionRef.set({
            userId,
            status: 'in_review',
            identityType,
            identityNumberLast4: identityNumber.slice(-4),
            fullName,
            dateOfBirth,
            age: calculatedAge,
            country,
            documents: {
                idFrontUrl: idFrontUrl || null,
                idBackUrl: idBackUrl || null,
                selfieUrl: selfieUrl || null,
            },
            faceAssessment: faceAssessment || null,
            linkedAccount: linkedAccount || null,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // Créer un document séparé pour les données KYC sensibles (optionnel, pour audit)
        const kycAuditRef = db.collection('kycAudits').doc();
        await kycAuditRef.set({
            userId,
            status: 'in_review',
            identityType,
            identityNumber: identityNumber.slice(-4), // Stocker seulement les 4 derniers chiffres
            fullName,
            country,
            faceAccepted: faceAssessment?.accepted ?? null,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            linkedAccountType: linkedAccount?.type || null,
        });
        return {
            success: true,
            message: 'Dossier KYC soumis avec succès',
            kycStatus: 'in_review',
        };
    }
    catch (error) {
        console.error('Erreur complétude KYC:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la sauvegarde des données KYC');
    }
});
/**
 * Cloud Function pour mettre à jour le profil utilisateur
 */
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    const { userId, fullName, phone, dateOfBirth, country, profileImage } = data;
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    // Vérifier que l'utilisateur ne modifie que son propre profil
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez modifier que votre propre profil');
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        // Préparer les données à mettre à jour
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (fullName !== undefined) {
            updateData.fullName = fullName;
            updateData.name = fullName;
            // Aussi mettre à jour dans kyc.identity si existe
            updateData['kyc.identity.fullName'] = fullName;
        }
        if (phone !== undefined) {
            updateData.phone = phone;
            updateData.phoneNumber = phone;
        }
        if (dateOfBirth !== undefined) {
            updateData.dateOfBirth = dateOfBirth;
            updateData['kyc.identity.dateOfBirth'] = dateOfBirth;
        }
        if (country !== undefined) {
            updateData.country = country;
            updateData['kyc.identity.country'] = country;
        }
        if (profileImage !== undefined) {
            updateData.profileImage = profileImage;
            updateData.photoURL = profileImage;
        }
        // Utiliser set avec merge pour créer le document s'il n'existe pas
        await userRef.set(updateData, { merge: true });
        return {
            success: true,
            message: 'Profil mis à jour avec succès',
        };
    }
    catch (error) {
        console.error('Erreur mise à jour profil utilisateur:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour du profil');
    }
});
/**
 * Cloud Function pour récupérer le profil utilisateur complet
 */
exports.getUserProfile = functions.https.onCall(async (data, context) => {
    const { userId } = data;
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    // Vérifier que l'utilisateur ne peut voir que son propre profil
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez voir que votre propre profil');
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Profil utilisateur non trouvé');
        }
        const userData = userDoc.data();
        return {
            success: true,
            profile: {
                uid: userId,
                email: userData.email || context.auth.token.email || '',
                phone: userData.phone || null,
                fullName: userData.kyc?.identity?.fullName || null,
                dateOfBirth: userData.kyc?.identity?.dateOfBirth || null,
                country: userData.kyc?.identity?.country || null,
                profileImage: userData.profileImage || null,
                kycStatus: userData.kycStatus || 'not_started',
                kycCompletedAt: userData.kycCompletedAt || null,
                kyc: userData.kyc || null,
                createdAt: userData.createdAt || null,
                lastLogin: userData.lastLogin || null,
            },
        };
    }
    catch (error) {
        console.error('Erreur récupération profil utilisateur:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la récupération du profil');
    }
});
/**
 * Cloud Function pour récupérer le statut KYC de l'utilisateur
 */
exports.getKycStatus = functions.https.onCall(async (data, context) => {
    const { userId } = data;
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    // Vérifier que l'utilisateur ne peut voir que ses propres données
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Vous ne pouvez voir que vos propres données');
    }
    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return {
                kycStatus: 'not_started',
                isCompleted: false,
            };
        }
        const userData = userDoc.data();
        return {
            kycStatus: userData.kycStatus || 'not_started',
            isCompleted: userData.kycStatus === 'verified',
            completedAt: userData.kycCompletedAt || null,
            submittedAt: userData.kycSubmittedAt || userData.kyc?.submittedAt || null,
            identity: userData.kyc?.identity ? {
                type: userData.kyc.identity.type,
                fullName: userData.kyc.identity.fullName,
                country: userData.kyc.identity.country,
            } : null,
        };
    }
    catch (error) {
        console.error('Erreur récupération KYC status:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la récupération du statut KYC');
    }
});
//# sourceMappingURL=sendEmailOTP.js.map