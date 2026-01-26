# 📋 Prochaines Étapes - Firestore Rules et Index

**Date:** 26 Janvier 2026  
**Priorité:** HAUTE  
**Durée Estimée:** 15 minutes

---

## 🎯 Objectif

Ajouter les règles de sécurité Firestore et les index pour le système d'épargne.

---

## 📝 Étape 1: Mettre à Jour firestore.rules

### Ouvrir le fichier
```bash
nano firestore.rules
```

### Ajouter les règles suivantes

Ajoutez ces règles à la fin du fichier `firestore.rules`:

```firestore
// ============================================
// SAVINGS GOALS COLLECTION
// ============================================
match /savingsGoals/{goalId} {
  // Lecture: Seulement l'utilisateur propriétaire
  allow read: if request.auth.uid == resource.data.userId;
  
  // Création: L'utilisateur authentifié crée pour lui-même
  allow create: if request.auth.uid == request.resource.data.userId
    && request.resource.data.userId != null
    && request.resource.data.name != null
    && request.resource.data.targetAmount > 0
    && request.resource.data.frequencyAmount > 0
    && request.resource.data.currency in ['CDF', 'USD', 'EUR']
    && request.resource.data.frequency in ['daily', 'weekly', 'monthly']
    && request.resource.data.status in ['active', 'paused', 'completed']
    && request.resource.data.currentAmount >= 0
    && request.resource.data.currentAmount <= request.resource.data.targetAmount;
  
  // Mise à jour: Seulement l'utilisateur propriétaire
  allow update: if request.auth.uid == resource.data.userId
    && request.resource.data.userId == resource.data.userId
    && request.resource.data.currentAmount >= 0
    && request.resource.data.currentAmount <= request.resource.data.targetAmount;
  
  // Suppression: Seulement l'utilisateur propriétaire
  allow delete: if request.auth.uid == resource.data.userId;
}

// ============================================
// SAVINGS TRANSACTIONS COLLECTION
// ============================================
match /savingsTransactions/{txId} {
  // Lecture: Seulement l'utilisateur propriétaire
  allow read: if request.auth.uid == resource.data.userId;
  
  // Création: Cloud Functions et utilisateur authentifié
  allow create: if (request.auth.uid == request.resource.data.userId
    || request.auth.token.firebase.sign_in_provider == 'custom')
    && request.resource.data.userId != null
    && request.resource.data.goalId != null
    && request.resource.data.amount > 0
    && request.resource.data.type in ['deposit', 'withdrawal', 'auto_contribution']
    && request.resource.data.description != null;
  
  // Pas de mise à jour ou suppression
  allow update, delete: if false;
}

// ============================================
// SAVINGS TRANSACTIONS ARCHIVE COLLECTION
// ============================================
match /savingsTransactionsArchive/{txId} {
  // Lecture: Seulement l'utilisateur propriétaire
  allow read: if request.auth.uid == resource.data.userId;
  
  // Création: Cloud Functions uniquement
  allow create: if request.auth.token.firebase.sign_in_provider == 'custom'
    && request.resource.data.userId != null;
  
  // Pas de mise à jour ou suppression
  allow update, delete: if false;
}

// ============================================
// NOTIFICATIONS COLLECTION
// ============================================
match /notifications/{notificationId} {
  // Lecture: Seulement l'utilisateur propriétaire
  allow read: if request.auth.uid == resource.data.userId;
  
  // Création: Cloud Functions uniquement
  allow create: if request.auth.token.firebase.sign_in_provider == 'custom'
    && request.resource.data.userId != null
    && request.resource.data.type != null
    && request.resource.data.title != null
    && request.resource.data.message != null;
  
  // Mise à jour: Seulement l'utilisateur propriétaire (pour marquer comme lu)
  allow update: if request.auth.uid == resource.data.userId
    && request.resource.data.userId == resource.data.userId;
  
  // Suppression: Seulement l'utilisateur propriétaire
  allow delete: if request.auth.uid == resource.data.userId;
}
```

### Sauvegarder
```
Ctrl+X → Y → Enter
```

---

## 📊 Étape 2: Mettre à Jour firestore.indexes.json

### Ouvrir le fichier
```bash
nano firestore.indexes.json
```

### Ajouter les index suivants

Ajoutez ces index à la section `indexes`:

```json
{
  "indexes": [
    {
      "collectionGroup": "savingsGoals",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "savingsTransactions",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "goalId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "savingsTransactions",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "Collection",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "read",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

### Sauvegarder
```
Ctrl+X → Y → Enter
```

---

## 🚀 Étape 3: Déployer les Règles

### Déployer les règles Firestore
```bash
firebase deploy --only firestore:rules
```

**Résultat attendu:**
```
✔  Deploy complete!
```

---

## 🚀 Étape 4: Déployer les Index

### Déployer les index Firestore
```bash
firebase deploy --only firestore:indexes
```

**Résultat attendu:**
```
✔  Deploy complete!
```

---

## ✅ Étape 5: Vérifier le Déploiement

### Vérifier les règles
```bash
firebase firestore:indexes
```

### Vérifier dans la console Firebase
```
URL: https://console.firebase.google.com/project/studio-1153706651-6032b/firestore/rules
```

---

## 🔍 Vérifications Post-Déploiement

### 1. Règles Firestore
- [ ] Règles déployées avec succès
- [ ] Pas d'erreurs de syntaxe
- [ ] Collections protégées

### 2. Index Firestore
- [ ] Index créés avec succès
- [ ] 4 index pour savingsGoals
- [ ] 2 index pour savingsTransactions
- [ ] 1 index pour notifications

### 3. Sécurité
- [ ] Authentification requise
- [ ] Isolation des données
- [ ] Validation des champs
- [ ] Transactions immuables

---

## 📝 Commandes Rapides

### Tout déployer
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Voir les logs
```bash
firebase functions:log
```

### Voir les erreurs
```bash
firebase functions:log --only errors
```

---

## 🎯 Résumé

Après ces étapes:
- ✅ Règles de sécurité Firestore activées
- ✅ Index Firestore créés
- ✅ Système d'épargne sécurisé
- ✅ Performances optimisées
- ✅ Prêt pour la production

---

## ⏱️ Temps Estimé

- Mise à jour des fichiers: 5 minutes
- Déploiement: 5 minutes
- Vérification: 5 minutes
- **Total: 15 minutes**

---

## 🚨 Troubleshooting

### Erreur: "Invalid rule syntax"
- Vérifier la syntaxe JSON
- Vérifier les accolades
- Vérifier les virgules

### Erreur: "Index creation failed"
- Vérifier la syntaxe JSON
- Vérifier les noms de champs
- Vérifier les types d'ordre

### Erreur: "Permission denied"
- Vérifier l'authentification Firebase
- Vérifier les permissions du projet
- Vérifier les règles Firestore

---

**Statut:** 📋 À FAIRE  
**Priorité:** HAUTE  
**Durée:** 15 minutes
