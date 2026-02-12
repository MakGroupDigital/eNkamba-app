# ✅ Checklist de Déploiement - Compte Entreprise

## 📋 Avant le Déploiement

### Vérifications Préalables
- [ ] Tous les fichiers sont créés et sans erreurs
- [ ] Les types TypeScript sont corrects
- [ ] Les Cloud Functions sont syntaxiquement correctes
- [ ] La documentation est à jour
- [ ] Les tests locaux sont passés

## 🚀 Déploiement

### Étape 1 : Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions:submitBusinessRequest
firebase deploy --only functions:approveBusinessRequest
firebase deploy --only functions:rejectBusinessRequest
firebase deploy --only functions:getPendingBusinessRequests
```

**Checklist :**
- [ ] Aucune erreur lors du déploiement
- [ ] Les fonctions apparaissent dans Firebase Console
- [ ] Les logs sont accessibles

### Étape 2 : Firestore Rules
1. Ouvrir `firestore.rules`
2. Copier les règles de `.kiro/FIRESTORE_RULES_TO_ADD.txt`
3. Ajouter les règles pour `business_requests`, `businesses`, et Storage
4. Déployer :

```bash
firebase deploy --only firestore:rules
```

**Checklist :**
- [ ] Aucune erreur de syntaxe
- [ ] Les règles sont déployées
- [ ] Les permissions sont correctes

### Étape 3 : Firestore Indexes
1. Ouvrir `firestore.indexes.json`
2. Ajouter les indexes de `.kiro/FIRESTORE_RULES_TO_ADD.txt`
3. Déployer :

```bash
firebase deploy --only firestore:indexes
```

**Checklist :**
- [ ] Les indexes sont créés
- [ ] Pas d'erreurs de déploiement
- [ ] Les indexes apparaissent dans Firebase Console

### Étape 4 : Collection Admins
1. Aller à Firebase Console → Firestore
2. Créer une nouvelle collection : `admins`
3. Pour chaque admin, créer un document :

**Document ID** : `{userId}`
**Contenu** :
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": 1707667200000
}
```

**Checklist :**
- [ ] Collection `admins` créée
- [ ] Au moins un admin ajouté
- [ ] Les IDs utilisateur sont corrects

## 🧪 Tests Post-Déploiement

### Test 1 : Soumettre une Demande
```
1. Aller à /dashboard/settings/business-account
2. Remplir le formulaire avec :
   - Nom : "Test Company"
   - Type : "COMMERCE"
   - Sous-catégorie : "RETAIL"
   - Numéro d'enregistrement : "12345-ABC"
   - Adresse : "123 Rue Test"
   - Ville : "Kinshasa"
   - Pays : "RDC"
   - Email : "test@company.com"
   - Téléphone : "+243123456789"
3. Télécharger les documents
4. Cliquer "Soumettre la demande"
```

**Vérifications :**
- [ ] Pas d'erreur lors de la soumission
- [ ] Message de succès affiché
- [ ] Demande visible dans Firestore → `business_requests`
- [ ] Status = "PENDING"
- [ ] Documents uploadés dans Firebase Storage

### Test 2 : Approuver une Demande
```
1. Aller à /admin/business-requests
2. Voir la demande créée
3. Cliquer sur la demande
4. Cliquer "Approuver"
```

**Vérifications :**
- [ ] Pas d'erreur lors de l'approbation
- [ ] Message de succès affiché
- [ ] Demande disparaît de la liste
- [ ] Firestore → `business_requests` → status = "VERIFIED"
- [ ] Firestore → `businesses` → document créé
- [ ] Firestore → `users/{userId}` → isBusiness = true

### Test 3 : Rejeter une Demande
```
1. Soumettre une nouvelle demande
2. Aller à /admin/business-requests
3. Cliquer sur la demande
4. Entrer une raison : "Documents incomplets"
5. Cliquer "Rejeter"
```

**Vérifications :**
- [ ] Pas d'erreur lors du rejet
- [ ] Message de succès affiché
- [ ] Demande disparaît de la liste
- [ ] Firestore → `business_requests` → status = "REJECTED"
- [ ] Raison du rejet stockée

### Test 4 : Modifier une Demande Rejetée
```
1. Aller à /dashboard/settings/business-account
2. Voir la demande rejetée avec la raison
3. Cliquer "Modifier la demande"
4. Corriger les informations
5. Cliquer "Soumettre la demande"
```

**Vérifications :**
- [ ] Formulaire pré-rempli avec les données précédentes
- [ ] Raison du rejet affichée
- [ ] Nouvelle soumission crée une mise à jour
- [ ] Status revient à "PENDING"

### Test 5 : Vérifier les Permissions
```
1. Essayer d'accéder à /admin/business-requests sans être admin
2. Essayer de modifier une demande d'un autre utilisateur
3. Essayer d'approuver une demande sans être admin
```

**Vérifications :**
- [ ] Accès refusé sans permissions
- [ ] Erreurs appropriées affichées
- [ ] Logs Firebase montrent les rejets de permissions

## 📊 Vérifications Firestore

### Collections
- [ ] `business_requests` existe
- [ ] `businesses` existe
- [ ] `admins` existe
- [ ] Champs corrects dans chaque collection

### Indexes
- [ ] Index sur `business_requests` (userId, status)
- [ ] Index sur `business_requests` (status, submittedAt)
- [ ] Pas d'erreurs d'index

### Rules
- [ ] Utilisateurs peuvent lire leurs propres demandes
- [ ] Utilisateurs peuvent créer des demandes
- [ ] Admins peuvent lire toutes les demandes
- [ ] Admins peuvent mettre à jour les demandes
- [ ] Storage rules correctes

## 🔒 Vérifications de Sécurité

- [ ] Les utilisateurs ne peuvent pas modifier les demandes d'autres
- [ ] Les utilisateurs ne peuvent pas approuver/rejeter
- [ ] Les admins ne peuvent pas créer de demandes pour d'autres
- [ ] Les documents ne sont accessibles que par le propriétaire et les admins
- [ ] Les URLs des documents ne sont pas publiques

## 📱 Tests sur Mobile

- [ ] Upload de documents fonctionne
- [ ] Formulaire est responsive
- [ ] Pas de problèmes de performance
- [ ] Les images sont compressées correctement

## 🐛 Troubleshooting

### Erreur : "Permission denied"
- [ ] Vérifier les Firestore Rules
- [ ] Vérifier que l'utilisateur est authentifié
- [ ] Vérifier les permissions dans la collection `admins`

### Erreur : "Admin not found"
- [ ] Vérifier que l'utilisateur est dans la collection `admins`
- [ ] Vérifier l'ID utilisateur exact
- [ ] Vérifier les logs Cloud Functions

### Documents non uploadés
- [ ] Vérifier les Storage Rules
- [ ] Vérifier la taille des fichiers (max 10MB)
- [ ] Vérifier les types de fichiers (PDF, JPG, PNG)
- [ ] Vérifier les logs Firebase

### Demande non visible
- [ ] Vérifier les logs Cloud Functions
- [ ] Vérifier la connexion Firebase
- [ ] Vérifier les permissions Firestore
- [ ] Vérifier que la demande a été créée

## 📝 Documentation

- [ ] `.kiro/BUSINESS_ACCOUNT_IMPLEMENTATION.md` - Consulté
- [ ] `.kiro/BUSINESS_ACCOUNT_QUICK_START.md` - Consulté
- [ ] `.kiro/FIRESTORE_RULES_TO_ADD.txt` - Appliqué
- [ ] Tous les fichiers sont documentés

## ✅ Validation Finale

- [ ] Tous les tests sont passés
- [ ] Aucune erreur en production
- [ ] Performance acceptable
- [ ] Sécurité vérifiée
- [ ] Documentation à jour
- [ ] Équipe informée

## 🎉 Déploiement Complet

**Date de déploiement** : _______________
**Déployé par** : _______________
**Statut** : ✅ COMPLÈTE

## 📞 Post-Déploiement

- [ ] Monitorer les logs Firebase
- [ ] Vérifier les performances
- [ ] Recueillir les retours utilisateurs
- [ ] Corriger les bugs si nécessaire
- [ ] Documenter les problèmes rencontrés

---

**Notes** :
- Garder cette checklist à jour
- Documenter tout problème rencontré
- Mettre à jour la documentation si nécessaire
