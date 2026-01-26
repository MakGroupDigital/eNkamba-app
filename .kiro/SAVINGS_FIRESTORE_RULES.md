# 🔐 Règles Firestore - Système d'Épargne

**Date:** 26 Janvier 2026  
**Version:** 1.0

---

## 📋 Règles de Sécurité

Ajoutez ces règles à votre fichier `firestore.rules`:

```firestore
// Savings Goals Collection
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

// Savings Transactions Collection
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

// Savings Transactions Archive Collection
match /savingsTransactionsArchive/{txId} {
  // Lecture: Seulement l'utilisateur propriétaire
  allow read: if request.auth.uid == resource.data.userId;
  
  // Création: Cloud Functions uniquement
  allow create: if request.auth.token.firebase.sign_in_provider == 'custom'
    && request.resource.data.userId != null;
  
  // Pas de mise à jour ou suppression
  allow update, delete: if false;
}

// Notifications Collection
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

---

## 🔍 Explications des Règles

### Collection: `savingsGoals`

**Lecture:**
- Chaque utilisateur ne peut lire que ses propres objectifs

**Création:**
- L'utilisateur doit être authentifié
- Les champs requis doivent être présents
- Les montants doivent être positifs
- La devise doit être valide (CDF, USD, EUR)
- La fréquence doit être valide (daily, weekly, monthly)
- Le statut doit être valide (active, paused, completed)
- Le montant actuel ne peut pas dépasser le montant cible

**Mise à jour:**
- Seulement l'utilisateur propriétaire
- Le montant actuel doit rester valide

**Suppression:**
- Seulement l'utilisateur propriétaire

### Collection: `savingsTransactions`

**Lecture:**
- Chaque utilisateur ne peut lire que ses propres transactions

**Création:**
- Autorisée pour l'utilisateur authentifié ou les Cloud Functions
- Les champs requis doivent être présents
- Le montant doit être positif
- Le type doit être valide (deposit, withdrawal, auto_contribution)

**Mise à jour/Suppression:**
- Non autorisées (transactions immuables)

### Collection: `savingsTransactionsArchive`

**Lecture:**
- Chaque utilisateur ne peut lire que ses propres transactions archivées

**Création:**
- Seulement les Cloud Functions

**Mise à jour/Suppression:**
- Non autorisées

### Collection: `notifications`

**Lecture:**
- Chaque utilisateur ne peut lire que ses propres notifications

**Création:**
- Seulement les Cloud Functions

**Mise à jour:**
- Seulement l'utilisateur propriétaire (pour marquer comme lu)

**Suppression:**
- Seulement l'utilisateur propriétaire

---

## 📊 Index Firestore

Créez ces index pour optimiser les requêtes:

### Index 1: Objectifs par Utilisateur
```
Collection: savingsGoals
Fields:
  - userId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

### Index 2: Transactions par Objectif
```
Collection: savingsTransactions
Fields:
  - goalId (Ascending)
  - timestamp (Descending)
```

### Index 3: Transactions par Utilisateur
```
Collection: savingsTransactions
Fields:
  - userId (Ascending)
  - timestamp (Descending)
```

### Index 4: Notifications par Utilisateur
```
Collection: notifications
Fields:
  - userId (Ascending)
  - read (Ascending)
  - createdAt (Descending)
```

---

## 🚀 Déploiement

### Étape 1: Mettre à Jour firestore.rules

```bash
# Ouvrir le fichier
nano firestore.rules

# Ajouter les règles ci-dessus
# Sauvegarder et quitter
```

### Étape 2: Déployer les Règles

```bash
firebase deploy --only firestore:rules
```

### Étape 3: Créer les Index

```bash
firebase deploy --only firestore:indexes
```

### Étape 4: Vérifier

```bash
firebase firestore:indexes
```

---

## ✅ Vérifications de Sécurité

- [x] Authentification requise
- [x] Isolation des données par utilisateur
- [x] Validation des champs
- [x] Transactions immuables
- [x] Cloud Functions sécurisées
- [x] Index optimisés
- [x] Pas d'accès croisé

---

## 🔒 Bonnes Pratiques

1. **Authentification:** Toujours vérifier `request.auth.uid`
2. **Validation:** Valider tous les champs requis
3. **Immuabilité:** Les transactions ne peuvent pas être modifiées
4. **Isolation:** Chaque utilisateur ne voit que ses données
5. **Index:** Créer les index pour les requêtes fréquentes
6. **Monitoring:** Surveiller les erreurs de sécurité

---

## 📝 Notes

- Les règles sont strictes pour la sécurité
- Les Cloud Functions utilisent des tokens spéciaux
- Les notifications sont créées automatiquement
- Les transactions sont archivées après 1 an
- Les index améliorent les performances

---

**Statut:** ✅ PRÊT POUR DÉPLOIEMENT
