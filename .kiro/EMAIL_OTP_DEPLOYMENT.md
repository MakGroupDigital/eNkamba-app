# 📧 Déploiement Email OTP - Cloud Functions

## Vue d'ensemble

L'authentification par email utilise maintenant une **solution définitive avec Firebase Cloud Functions**:

1. **sendEmailOTP** - Envoie un code OTP 6 chiffres par email
2. **verifyEmailOTP** - Vérifie le code et crée/connecte l'utilisateur

## Architecture

```
Client (Login Page)
    ↓
sendEmailOTP Cloud Function
    ↓
Firestore (emailOTPs collection)
    ↓
Email Service (Gmail, SendGrid, etc.)
    ↓
User Email
    ↓
User entre le code
    ↓
verifyEmailOTP Cloud Function
    ↓
Firebase Auth (crée/connecte l'utilisateur)
    ↓
Custom Token
    ↓
Client connecté
```

## Déploiement

### Étape 1: Installer les dépendances

```bash
cd functions
npm install firebase-functions firebase-admin nodemailer
```

### Étape 2: Configurer les variables d'environnement

Créer `functions/.env`:

```
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
```

**Pour Gmail:**
1. Activer l'authentification à deux facteurs
2. Générer un mot de passe d'application: https://myaccount.google.com/apppasswords
3. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

**Pour SendGrid:**
```
SENDGRID_API_KEY=votre-cle-sendgrid
```

**Pour Mailgun:**
```
MAILGUN_API_KEY=votre-cle-mailgun
MAILGUN_DOMAIN=votre-domaine-mailgun
```

### Étape 3: Déployer les Cloud Functions

```bash
firebase deploy --only functions:sendEmailOTP,functions:verifyEmailOTP
```

### Étape 4: Vérifier le déploiement

```bash
firebase functions:list
```

Vous devriez voir:
```
sendEmailOTP
verifyEmailOTP
```

## Configuration Firestore

Les Cloud Functions créent automatiquement une collection `emailOTPs` avec la structure:

```typescript
{
  code: "123456",           // Code OTP 6 chiffres
  email: "user@example.com",
  createdAt: Timestamp,     // Timestamp de création
  expiresAt: Date,          // Expire dans 10 minutes
  attempts: 0,              // Nombre de tentatives échouées
  verified: false           // Marqué comme vérifié après succès
}
```

## Sécurité

### Bonnes pratiques implémentées

✅ Code OTP 6 chiffres aléatoire  
✅ Expiration 10 minutes  
✅ Maximum 5 tentatives  
✅ Validation email côté serveur  
✅ Création automatique d'utilisateur Firebase  
✅ Custom token pour connexion sécurisée  
✅ Suppression du code après vérification  

### Règles Firestore recommandées

```
match /emailOTPs/{email} {
  allow read, write: if request.auth != null;
  allow create: if request.resource.data.email == request.auth.token.email;
}
```

## Tester en Développement

### Avec l'émulateur Firebase

```bash
firebase emulators:start
```

Puis dans le code:
```typescript
import { connectFunctionsEmulator } from 'firebase/functions';

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### Avec un service email réel

1. Configurer les variables d'environnement
2. Déployer les Cloud Functions
3. Tester depuis l'application

## Dépannage

### Le code n'est pas reçu

1. Vérifier les logs: `firebase functions:log`
2. Vérifier les variables d'environnement
3. Vérifier la configuration du service email
4. Vérifier que l'email n'est pas en spam

### Erreur "Permission denied"

1. Vérifier les règles Firestore
2. Vérifier que l'utilisateur est authentifié
3. Vérifier les permissions Cloud Functions

### Erreur "Invalid argument"

1. Vérifier que l'email est valide
2. Vérifier que le code est au format correct
3. Vérifier les paramètres envoyés

## Monitoring

### Logs

```bash
firebase functions:log
```

### Métriques

Aller à Firebase Console → Functions → Metrics

### Alertes

Configurer des alertes dans Google Cloud Console pour:
- Erreurs de fonction
- Temps d'exécution élevé
- Taux d'erreur élevé

## Coûts

### Tarification Firebase Functions

- **Appels**: $0.40 par million d'appels
- **Temps de calcul**: $0.0000025 par Go-seconde
- **Bande passante sortante**: $0.12 par Go

### Tarification Email

Dépend du service:
- **Gmail**: Gratuit (limité à 500 emails/jour)
- **SendGrid**: À partir de $9.95/mois
- **Mailgun**: À partir de $35/mois

## Prochaines étapes

1. ✅ Déployer les Cloud Functions
2. ✅ Configurer le service email
3. ✅ Tester l'authentification par email
4. ✅ Monitorer les logs
5. ✅ Configurer les alertes

## Fichiers

- `functions/src/sendEmailOTP.ts` - Cloud Function pour envoyer le code
- `functions/.env.example` - Template variables d'environnement
- `src/app/login/page.tsx` - Page de login avec email OTP
- `src/lib/firebase.ts` - Configuration Firebase

---

**Status**: Solution définitive avec Cloud Functions ✅  
**Prêt pour**: Déploiement en production  
**Date**: January 21, 2026
