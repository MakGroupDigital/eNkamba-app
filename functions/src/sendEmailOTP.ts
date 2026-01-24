import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

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

/**
 * Cloud Function pour envoyer un code OTP par email
 * 
 * Appelée depuis le client pour envoyer un code de vérification
 * Stocke le code dans Firestore avec expiration
 */
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
        subject: 'Votre code de vérification eNkamba',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #32BB78; }
                .content { text-align: center; }
                .code-box { 
                  background-color: #f0f0f0; 
                  padding: 20px; 
                  border-radius: 8px; 
                  margin: 20px 0;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 5px;
                  color: #32BB78;
                  font-family: monospace;
                }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
                .warning { color: #ff6b6b; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">eNkamba</div>
                </div>
                <div class="content">
                  <h2>Vérification de votre email</h2>
                  <p>Voici votre code de vérification:</p>
                  <div class="code-box">${otp}</div>
                  <p>Ce code expire dans 10 minutes.</p>
                  <p class="warning">⚠️ Ne partagez ce code avec personne. eNkamba ne vous demandera jamais ce code par email ou SMS.</p>
                </div>
                <div class="footer">
                  <p>© 2026 eNkamba. Tous droits réservés.</p>
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
export const verifyEmailOTP = functions.https.onCall(
  async (data: { email: string; code: string }, context) => {
    const { email, code } = data;

    // Valider les paramètres
    if (!email || !code) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email et code requis'
      );
    }

    try {
      const db = admin.firestore();
      const otpRef = db.collection('emailOTPs').doc(email);
      const otpDoc = await otpRef.get();

      // Vérifier que le document existe
      if (!otpDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Aucun code trouvé pour cet email'
        );
      }

      const otpData = otpDoc.data()!;

      // Vérifier que le code n'a pas expiré
      const expiresAt = otpData.expiresAt.toDate();
      if (new Date() > expiresAt) {
        await otpRef.delete();
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Code expiré'
        );
      }

      // Vérifier le nombre de tentatives
      if (otpData.attempts >= 5) {
        await otpRef.delete();
        throw new functions.https.HttpsError(
          'permission-denied',
          'Trop de tentatives. Veuillez renvoyer un code.'
        );
      }

      // Vérifier le code
      if (otpData.code !== code.trim()) {
        await otpRef.update({
          attempts: admin.firestore.FieldValue.increment(1),
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Code incorrect'
        );
      }

      // Code correct - créer ou mettre à jour l'utilisateur
      const auth = admin.auth();
      let uid: string;

      try {
        // Essayer de récupérer l'utilisateur existant
        const user = await auth.getUserByEmail(email);
        uid = user.uid;
      } catch (error: any) {
        // Utilisateur n'existe pas - le créer
        if (error.code === 'auth/user-not-found') {
          const user = await auth.createUser({
            email,
            emailVerified: true,
          });
          uid = user.uid;
        } else {
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
    } catch (error: any) {
      console.error('Erreur vérification OTP:', error);
      
      if (error.code && error.code.startsWith('auth/')) {
        throw new functions.https.HttpsError(
          'internal',
          'Erreur lors de la vérification'
        );
      }
      
      throw error;
    }
  }
);
