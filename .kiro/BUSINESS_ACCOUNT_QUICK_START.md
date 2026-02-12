# Business Account - Quick Start Guide

## 🚀 Démarrage Rapide

### Étape 1 : Déployer les Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

### Étape 2 : Mettre à jour Firestore Rules

1. Ouvrir `firestore.rules`
2. Ajouter les règles de `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md`
3. Déployer :
```bash
firebase deploy --only firestore:rules
```

### Étape 3 : Créer les Indexes

1. Ajouter les indexes de `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md` à `firestore.indexes.json`
2. Déployer :
```bash
firebase deploy --only firestore:indexes
```

### Étape 4 : Créer la collection Admins

Pour chaque admin, créer un document dans Firestore :

**Collection:** `admins`
**Document ID:** `{userId}`
**Contenu:**
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": 1707667200000
}
```

## 📍 Accès aux Pages

### Utilisateur
- **Demander un compte entreprise** : `/dashboard/settings/business-account`

### Admin
- **Gérer les demandes** : `/admin/business-requests`

## 🧪 Test Rapide

### 1. Soumettre une demande
```
1. Aller à /dashboard/settings/business-account
2. Remplir le formulaire
3. Télécharger les documents
4. Cliquer "Soumettre la demande"
```

### 2. Approuver (Admin)
```
1. Aller à /admin/business-requests
2. Cliquer sur la demande
3. Cliquer "Approuver"
```

### 3. Vérifier dans Firestore
```
- business_requests/{id} → status: PENDING
- Après approbation → status: VERIFIED
- businesses/{id} → créé
- users/{userId} → isBusiness: true
```

## 📦 Fichiers Créés

```
src/
  types/
    business-account.types.ts
  hooks/
    useBusinessAccount.ts
  app/dashboard/settings/
    business-account/
      page.tsx
  app/admin/
    business-requests/
      page.tsx

functions/src/
  businessAccountManagement.ts

.kiro/
  BUSINESS_ACCOUNT_FIRESTORE_RULES.md
  BUSINESS_ACCOUNT_IMPLEMENTATION.md
  BUSINESS_ACCOUNT_QUICK_START.md
```

## 🔑 Cloud Functions

### submitBusinessRequest
- **Entrée** : Données du formulaire + documents uploadés
- **Sortie** : Demande créée/mise à jour
- **Authentification** : Utilisateur

### approveBusinessRequest
- **Entrée** : requestId
- **Sortie** : Demande approuvée, profil créé
- **Authentification** : Admin

### rejectBusinessRequest
- **Entrée** : requestId, reason
- **Sortie** : Demande rejetée
- **Authentification** : Admin

### getPendingBusinessRequests
- **Entrée** : Aucune
- **Sortie** : Liste des demandes en attente
- **Authentification** : Admin

## 🎯 Types d'Entreprise

### Commerce
- Vente en gros
- Détail
- Producteur d'équipements
- Producteur de produits

### Logistique
- Entreprise de transport
- Agent relais

### Paiement
- Intégration API
- Entreprise accréditée
- Agent agréé

## 📝 Checklist de Déploiement

- [ ] Cloud Functions déployées
- [ ] Firestore Rules mises à jour
- [ ] Indexes Firestore créés
- [ ] Collection `admins` créée
- [ ] Admins ajoutés à la collection
- [ ] Test de soumission
- [ ] Test d'approbation
- [ ] Vérification Firestore

## 🆘 Troubleshooting

### "Permission denied" lors de la soumission
- Vérifier les Firestore Rules
- Vérifier que l'utilisateur est authentifié

### "Admin not found" lors de l'approbation
- Vérifier que l'utilisateur est dans la collection `admins`
- Vérifier l'ID utilisateur

### Documents non uploadés
- Vérifier les Storage Rules
- Vérifier la taille des fichiers (max 10MB)
- Vérifier les types de fichiers (PDF, JPG, PNG)

### Demande non visible dans Firestore
- Vérifier les logs Cloud Functions
- Vérifier la connexion Firebase
- Vérifier les permissions Firestore

## 📞 Support

Consultez :
- `.kiro/BUSINESS_ACCOUNT_IMPLEMENTATION.md` - Documentation complète
- `.kiro/BUSINESS_ACCOUNT_FIRESTORE_RULES.md` - Règles de sécurité
- Logs Firebase Cloud Functions
- Console Firestore
