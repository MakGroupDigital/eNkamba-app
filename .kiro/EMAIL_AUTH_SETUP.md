# 📧 Configuration Email Authentication

## Vue d'ensemble

L'authentification par email fonctionne avec un système de code OTP (One-Time Password) 6 chiffres:

1. **Développement**: Le code s'affiche dans la console du navigateur
2. **Production**: Le code est envoyé par email via une Cloud Function

## Fonctionnement

### Flux d'Authentification Email

```
1. Utilisateur entre son email
2. Clic sur "Recevoir un code par email"
3. Code OTP généré (6 chiffres)
4. En dev: affichage dans console
5. En prod: envoi par email
6. Utilisateur entre le code
7. Vérification du code
8. Connexion réussie
```

### Sécurité

- **Expiration**: Code valide 5 minutes
- **Tentatives**: Maximum 5 tentatives
- **Stockage**: Données en localStorage (temporaire)
- **Validation**: Email et code vérifiés côté client

## Configuration en Développement

Aucune configuration requise! Le code s'affiche dans la console du navigateur.

### Tester en Développement

1. Aller à la page de login
2. Sélectionner "Email" comme méthode
3. Entrer une adresse email
4. Cliquer "Recevoir un code par email"
5. Ouvrir la console du navigateur (F12)
6. Copier le code affiché
7. Entrer le code dans le formulaire
8. Cliquer "Confirmer et continuer"

## Configuration en Production

### Étape 1: Créer une Cloud Function

Créer un fichier `functions/src/sendEmailCode.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Configurer le transporteur email
// Utiliser Gmail, SendGrid, ou un autre service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmailCode = functions.https.onCall(
  async (data: { email: string; code: string }, context) => {
    const { email, code } = data;

    // Valider l'email
    if (!email || !code) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email et code requis'
      );
    }

    try {
      // Envoyer l'email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Votre code d\'authentification eNkamba',
        html: `
          <h2>Bienvenue sur eNkamba</h2>
          <p>Votre code d'authentification est:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #32BB78;">
            ${code}
          </h1>
          <p>Ce code expire dans 5 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        `,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'envoi du code'
      );
    }
  }
);
```

### Étape 2: Déployer la Cloud Function

```bash
cd functions
npm install nodemailer
firebase deploy --only functions:sendEmailCode
```

### Étape 3: Configurer les Variables d'Environnement

Créer un fichier `.env.local` dans le dossier `functions`:

```
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
```

### Étape 4: Mettre à Jour `.env.local` du Projet

Ajouter l'URL de la Cloud Function:

```
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-studio-1153706651-6032b.cloudfunctions.net
```

## Alternatives d'Envoi d'Email

### Option 1: SendGrid

```typescript
import * as sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: email,
  from: 'noreply@enkamba.io',
  subject: 'Votre code d\'authentification eNkamba',
  html: `...`,
});
```

### Option 2: Firebase Extensions

Utiliser l'extension "Trigger Email" de Firebase:

1. Aller à Firebase Console → Extensions
2. Installer "Trigger Email"
3. Configurer le service email (SendGrid, Mailgun, etc.)
4. Écrire dans la collection `mail` pour déclencher l'envoi

### Option 3: Service Tiers (Resend, Brevo, etc.)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@enkamba.io',
  to: email,
  subject: 'Votre code d\'authentification eNkamba',
  html: `...`,
});
```

## Fichiers Modifiés

- ✅ `src/app/login/page.tsx` - Ajout interface email
- ✅ `src/lib/email-auth.ts` - Helpers email authentication
- ✅ `src/app/layout.tsx` - reCAPTCHA v2 (déjà fait)

## Tester en Production

1. Déployer la Cloud Function
2. Configurer les variables d'environnement
3. Tester l'authentification par email
4. Vérifier que l'email est reçu
5. Vérifier que le code fonctionne

## Dépannage

### Le code ne s'affiche pas en développement

- Ouvrir la console du navigateur (F12)
- Chercher le message "📧 Code d'authentification pour..."
- Si absent, vérifier que `NODE_ENV === 'development'`

### L'email n'est pas reçu en production

- Vérifier les logs de la Cloud Function
- Vérifier les variables d'environnement
- Vérifier que le service email est configuré
- Vérifier les paramètres SMTP/API

### Le code expire trop vite

- Modifier `CODE_EXPIRY_TIME` dans `src/lib/email-auth.ts`
- Valeur par défaut: 5 minutes (300000 ms)

### Trop de tentatives échouées

- Modifier `MAX_ATTEMPTS` dans `src/lib/email-auth.ts`
- Valeur par défaut: 5 tentatives

## Sécurité

### Bonnes Pratiques

- ✅ Valider l'email côté serveur
- ✅ Limiter le nombre de tentatives
- ✅ Expirer le code après 5 minutes
- ✅ Ne pas afficher le code en production
- ✅ Utiliser HTTPS en production
- ✅ Chiffrer les données sensibles

### À Éviter

- ❌ Envoyer le code en clair dans l'URL
- ❌ Stocker le code en localStorage en production
- ❌ Permettre un nombre illimité de tentatives
- ❌ Garder le code valide indéfiniment

## Prochaines Étapes

1. **Développement**: Tester l'authentification par email
2. **Production**: Configurer la Cloud Function
3. **Email**: Choisir un service d'envoi
4. **Sécurité**: Implémenter les bonnes pratiques
5. **Monitoring**: Ajouter des logs et alertes

---

**Status**: Email authentication implémentée ✅  
**Prêt pour**: Développement et tests  
**Date**: January 21, 2026
