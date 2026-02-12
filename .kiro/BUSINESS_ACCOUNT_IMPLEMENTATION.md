# Implémentation du Compte Entreprise - Guide Complet

## 📋 Vue d'ensemble

Cette implémentation ajoute une section "Compte Entreprise" dans les paramètres utilisateur, permettant aux utilisateurs de demander un compte professionnel avec une logique dynamique basée sur le type de service choisi.

## 🏗️ Architecture

### Collections Firestore

#### 1. `business_requests` (Demandes en attente)
```typescript
{
  userId: string;                    // ID de l'utilisateur
  businessName: string;              // Nom de l'entreprise
  type: 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';
  subCategory: string;               // Sous-catégorie dynamique
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  
  // Informations de base
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  
  // Spécifique au paiement
  apiCallbackUrl?: string;
  
  // Documents
  documents: {
    idCard?: string;                 // URL Firebase Storage
    taxDocument?: string;
    businessLicense?: string;
    bankStatement?: string;
  };
  
  // Métadonnées
  submittedAt: number;               // Timestamp
  updatedAt: number;
  rejectionReason?: string;          // Si rejeté
  verifiedAt?: number;               // Si approuvé
  verifiedBy?: string;               // ID admin qui a approuvé
}
```

#### 2. `businesses` (Entreprises vérifiées)
Copie de `business_requests` avec `status: 'VERIFIED'` et `businessId` ajouté.

#### 3. Mise à jour `users`
Quand une demande est approuvée :
```typescript
{
  isBusiness: true;
  businessId: string;                // Référence à la demande approuvée
  businessType: 'COMMERCE' | 'LOGISTICS' | 'PAYMENT';
  businessStatus: 'VERIFIED';
}
```

### Firebase Storage
```
business_docs/
  {userId}/
    {timestamp}_{docType}_{fileName}
```

## 🎯 Logique Métier

### Types d'Entreprise et Sous-catégories

#### Commerce (B2B/B2C)
- Vente en gros (WHOLESALE)
- Détail (RETAIL)
- Producteur d'équipements (EQUIPMENT_PRODUCER)
- Producteur de produits (PRODUCT_PRODUCER)

#### Logistique
- Entreprise de transport (TRANSPORT_COMPANY)
- Agent relais (RELAY_AGENT)

#### Système de Paiement (Fintech)
- Intégration API (API_INTEGRATION)
- Entreprise accréditée (ACCREDITED_ENTERPRISE)
- Agent agréé (APPROVED_AGENT)

### Workflow d'Approbation

1. **Soumission** : Utilisateur remplit le formulaire → Statut `PENDING`
2. **Vérification** : Admin examine les documents et les informations
3. **Approbation** :
   - Copie les données vers `businesses`
   - Met à jour le profil utilisateur avec `isBusiness: true`
   - Déverrouille l'accès aux modules avancés
4. **Rejet** : Admin peut rejeter avec une raison

## 📁 Fichiers Créés

### Frontend
- `src/types/business-account.types.ts` - Types TypeScript
- `src/hooks/useBusinessAccount.ts` - Hook de gestion
- `src/app/dashboard/settings/business-account/page.tsx` - Page principale

### Backend
- `functions/src/businessAccountManagement.ts` - Cloud Functions

### Documentation
- `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md` - Règles de sécurité
- `.kiro/BUSINESS_ACCOUNT_IMPLEMENTATION.md` - Ce fichier

## 🚀 Déploiement

### 1. Déployer les Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions:submitBusinessRequest
firebase deploy --only functions:approveBusinessRequest
firebase deploy --only functions:rejectBusinessRequest
firebase deploy --only functions:getPendingBusinessRequests
```

### 2. Mettre à jour Firestore Rules

Copier les règles de `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md` dans votre `firestore.rules` et déployer :

```bash
firebase deploy --only firestore:rules
```

### 3. Créer les Indexes Firestore

Ajouter les indexes de `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md` à `firestore.indexes.json` et déployer :

```bash
firebase deploy --only firestore:indexes
```

### 4. Créer la collection `admins`

Pour chaque administrateur, créer un document dans `admins/{userId}` :

```typescript
{
  email: string;
  role: 'admin';
  createdAt: number;
}
```

## 🧪 Tests

### Test 1 : Soumettre une demande
1. Aller à `/dashboard/settings/business-account`
2. Remplir le formulaire avec les informations d'entreprise
3. Télécharger les documents
4. Cliquer sur "Soumettre la demande"
5. Vérifier que la demande apparaît dans `business_requests`

### Test 2 : Approuver une demande (Admin)
1. Appeler `approveBusinessRequest` avec le `requestId`
2. Vérifier que :
   - Un document est créé dans `businesses`
   - Le profil utilisateur est mis à jour avec `isBusiness: true`
   - Le statut passe à `VERIFIED`

### Test 3 : Rejeter une demande (Admin)
1. Appeler `rejectBusinessRequest` avec le `requestId` et une raison
2. Vérifier que le statut passe à `REJECTED`
3. Vérifier que la raison est stockée

## 🔒 Sécurité

- Les utilisateurs ne peuvent soumettre que leurs propres demandes
- Les utilisateurs ne peuvent modifier que les demandes en statut `PENDING`
- Seuls les admins peuvent approuver/rejeter
- Les documents sont stockés dans Firebase Storage avec contrôle d'accès
- Les URLs des documents sont stockées dans Firestore

## 📝 Notes Importantes

1. **Pas de modification des modules existants** : Cette implémentation n'affecte pas les modules existants (Commerce, Logistique, Paiement)
2. **Utilisateurs normaux** : Continuent d'avoir accès à tous les modules
3. **Comptes entreprise** : Auront accès à des fonctionnalités avancées (à implémenter selon vos besoins)
4. **Documents** : Les fichiers sont uploadés directement à Firebase Storage, les URLs sont stockées dans Firestore

## 🔄 Flux Utilisateur

```
Utilisateur
    ↓
Accède à /dashboard/settings/business-account
    ↓
Remplit le formulaire dynamique (type → sous-catégories)
    ↓
Télécharge les documents
    ↓
Soumet la demande
    ↓
Demande créée dans business_requests avec status: PENDING
    ↓
Admin examine et approuve/rejette
    ↓
Si approuvé:
  - Copie vers businesses
  - Mise à jour du profil utilisateur
  - Accès aux modules avancés
```

## 🛠️ Maintenance

### Ajouter une nouvelle sous-catégorie

1. Ajouter le type dans `src/types/business-account.types.ts`
2. Ajouter l'option dans le composant page
3. Mettre à jour la validation dans la Cloud Function

### Ajouter un nouveau type d'entreprise

1. Ajouter le type dans `BusinessType`
2. Créer les sous-catégories correspondantes
3. Ajouter la logique de validation
4. Mettre à jour les règles Firestore si nécessaire

## 📞 Support

Pour toute question ou problème, consultez :
- Les logs Firebase Cloud Functions
- Les règles Firestore
- Les permissions utilisateur dans la collection `admins`
