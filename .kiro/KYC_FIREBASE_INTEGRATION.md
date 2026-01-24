# Intégration KYC avec Firebase

## Vue d'ensemble
Le flux KYC est maintenant intégré avec Firebase Firestore et Cloud Functions pour une persistance sécurisée des données.

## Architecture

### 1. Cloud Functions (`functions/src/sendEmailOTP.ts`)

#### `completeKyc()`
- **Appelée par**: Page KYC après complétion de tous les étapes
- **Paramètres**:
  - `userId`: ID de l'utilisateur Firebase
  - `identityType`: Type de pièce d'identité (passport, carte d'identité, etc.)
  - `identityNumber`: Numéro de la pièce d'identité
  - `fullName`: Nom complet de l'utilisateur
  - `dateOfBirth`: Date de naissance
  - `country`: Pays de résidence
  - `linkedAccount` (optionnel): Compte Mobile Money ou Bancaire lié

- **Actions**:
  1. Valide les paramètres
  2. Vérifie que l'utilisateur est authentifié
  3. Stocke les données KYC dans Firestore (`users/{userId}`)
  4. Crée un audit trail dans `kycAudits` collection
  5. Met à jour le statut utilisateur à `verified`

- **Retour**:
  ```json
  {
    "success": true,
    "message": "Vérification KYC complétée avec succès",
    "kycStatus": "verified"
  }
  ```

#### `getKycStatus()`
- **Appelée par**: Hook `useKycStatus` au montage
- **Paramètres**:
  - `userId`: ID de l'utilisateur Firebase

- **Actions**:
  1. Récupère le document utilisateur depuis Firestore
  2. Retourne le statut KYC et les informations d'identité

- **Retour**:
  ```json
  {
    "kycStatus": "verified|not_started",
    "isCompleted": boolean,
    "completedAt": timestamp,
    "identity": {
      "type": "passport",
      "fullName": "Jean Dupont",
      "country": "CD"
    }
  }
  ```

### 2. Hook `useKycStatus` (`src/hooks/useKycStatus.ts`)

**Fonctionnalités**:
- Charge le statut KYC depuis Firebase au montage
- Fallback sur localStorage si Firebase n'est pas disponible
- Fournit la fonction `completeKyc()` pour soumettre les données
- Gère les erreurs et le loading state

**Utilisation**:
```typescript
const { isKycCompleted, completeKyc, isLoading, error } = useKycStatus();

// Compléter le KYC
await completeKyc({
  identityType: 'passport',
  identityNumber: 'AB123456',
  fullName: 'Jean Dupont',
  dateOfBirth: '1990-01-15',
  country: 'CD',
  linkedAccount: {
    type: 'mobile_money',
    operator: 'orange',
    phoneNumber: '+243812345678',
    accountName: 'Jean Dupont'
  }
});
```

### 3. Structure Firestore

#### Collection `users`
```
users/{userId}
├── kyc
│   ├── status: "verified"
│   ├── completedAt: timestamp
│   └── identity
│       ├── type: "passport"
│       ├── number: "AB123456"
│       ├── fullName: "Jean Dupont"
│       ├── dateOfBirth: "1990-01-15"
│       └── country: "CD"
├── kycStatus: "verified"
├── kycCompletedAt: timestamp
└── linkedAccount (optionnel)
    ├── type: "mobile_money"
    ├── operator: "orange"
    ├── phoneNumber: "+243812345678"
    └── accountName: "Jean Dupont"
```

#### Collection `kycAudits` (Audit Trail)
```
kycAudits/{auditId}
├── userId: "user123"
├── status: "verified"
├── identityType: "passport"
├── identityNumber: "AB12" (seulement les 4 derniers chiffres)
├── fullName: "Jean Dupont"
├── country: "CD"
├── completedAt: timestamp
└── linkedAccountType: "mobile_money"
```

## Flux d'utilisation

### 1. Utilisateur accède à la page KYC
```
/kyc → Page KYC charge
```

### 2. Utilisateur complète les étapes
- Identity (upload documents)
- Selfie (capture photo)
- Referral (code de parrainage)
- Link Account (optionnel - Mobile Money ou Banque)

### 3. Utilisateur soumet le formulaire
```
Page KYC → appelle completeKyc() du hook
→ Hook appelle Cloud Function completeKyc()
→ Cloud Function valide et stocke dans Firestore
→ Retour succès
→ Hook met à jour le state local
→ Redirection vers /dashboard
```

### 4. Utilisateur accède aux modules
```
Module page → ModuleKycGate vérifie isKycCompleted
→ Si true: affiche le contenu
→ Si false: affiche le message de restriction
```

## Sécurité

### Données sensibles
- Les numéros de pièce d'identité complets sont stockés dans Firestore
- Seuls les 4 derniers chiffres sont stockés dans l'audit trail
- Les données sont chiffrées en transit (HTTPS)

### Permissions Firestore
```
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /kycAudits/{auditId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false; // Seulement les Cloud Functions
}
```

## Déploiement

### 1. Déployer les Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### 2. Mettre à jour les règles Firestore
```bash
firebase deploy --only firestore:rules
```

### 3. Tester localement
```bash
firebase emulators:start
```

## Prochaines étapes

1. **Vérification d'identité réelle**: Intégrer avec un service de vérification d'identité (IDology, Jumio, etc.)
2. **Stockage des documents**: Uploader les documents vers Cloud Storage
3. **Notifications**: Envoyer des emails de confirmation
4. **Webhooks**: Intégrer avec des services externes pour vérification
5. **Audit logging**: Enregistrer toutes les actions KYC
