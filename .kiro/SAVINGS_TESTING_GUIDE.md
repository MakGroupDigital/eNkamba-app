# 🧪 Guide de Test - Système d'Épargne

**Date:** 26 Janvier 2026  
**Version:** 1.0

---

## 🎯 Objectif

Tester complètement le système d'épargne après le fix du document wallet.

---

## 📋 Checklist de Test

### 1. Créer un Objectif d'Épargne

**Étapes:**
1. Aller à `/dashboard/savings`
2. Cliquer "Nouvel Objectif"
3. Remplir le formulaire:
   - Nom: "Test Épargne"
   - Icône: ✈️
   - Montant cible: 1,000,000 CDF
   - Fréquence: Quotidien
   - Montant par période: 50,000 CDF
4. Cliquer "Créer"

**Résultat attendu:**
- ✅ Objectif créé
- ✅ Notification de succès
- ✅ Objectif visible dans la liste
- ✅ Barre de progression à 0%

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - userId: [user_uid]
  - name: "Test Épargne"
  - targetAmount: 1000000
  - currentAmount: 0
  - status: "active"
```

---

### 2. Ajouter des Fonds Manuellement

**Étapes:**
1. Cliquer "Ajouter" sur l'objectif
2. Saisir le montant: 250,000 CDF
3. Cliquer "Ajouter"

**Résultat attendu:**
- ✅ Fonds ajoutés
- ✅ Notification de succès
- ✅ Barre de progression mise à jour (25%)
- ✅ Montant actuel: 250,000 CDF

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - currentAmount: 250000
  - lastContributionDate: [timestamp]

Collection: savingsTransactions
Document: [txId]
  - goalId: [goalId]
  - amount: 250000
  - type: "deposit"
```

---

### 3. Ajouter Plus de Fonds

**Étapes:**
1. Cliquer "Ajouter" à nouveau
2. Saisir le montant: 750,000 CDF
3. Cliquer "Ajouter"

**Résultat attendu:**
- ✅ Fonds ajoutés
- ✅ Barre de progression à 100%
- ✅ Montant actuel: 1,000,000 CDF
- ✅ Statut: "Complété"
- ✅ Notification d'objectif atteint

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - currentAmount: 1000000
  - status: "completed"
  - completedAt: [timestamp]
```

---

### 4. Retirer des Fonds

**Étapes:**
1. Cliquer "Retirer" (maintenant disponible)
2. Saisir le montant: 500,000 CDF
3. Cliquer "Retirer"

**Résultat attendu:**
- ✅ Fonds retirés
- ✅ Notification de succès
- ✅ Montant actuel: 500,000 CDF
- ✅ Barre de progression à 50%

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - currentAmount: 500000

Collection: savingsTransactions
Document: [txId]
  - amount: 500000
  - type: "withdrawal"
```

---

### 5. Mettre en Pause

**Étapes:**
1. Cliquer "Pause" sur l'objectif
2. Vérifier le statut

**Résultat attendu:**
- ✅ Statut: "En pause"
- ✅ Contributions automatiques arrêtées
- ✅ Bouton "Reprendre" disponible

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - status: "paused"
```

---

### 6. Reprendre

**Étapes:**
1. Cliquer "Reprendre" sur l'objectif
2. Vérifier le statut

**Résultat attendu:**
- ✅ Statut: "Actif"
- ✅ Contributions automatiques reprises
- ✅ Bouton "Pause" disponible

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - status: "active"
```

---

### 7. Supprimer un Objectif

**Étapes:**
1. Cliquer l'icône "Poubelle"
2. Confirmer la suppression

**Résultat attendu:**
- ✅ Objectif supprimé
- ✅ Notification de succès
- ✅ Objectif plus visible dans la liste

**Vérification Firestore:**
```
Collection: savingsGoals
Document: [goalId]
  - Supprimé
```

---

### 8. Créer Plusieurs Objectifs

**Étapes:**
1. Créer 3 objectifs différents:
   - Voyage (1,000,000 CDF)
   - Maison (10,000,000 CDF)
   - Éducation (500,000 CDF)
2. Ajouter des fonds à chacun
3. Vérifier l'épargne totale

**Résultat attendu:**
- ✅ 3 objectifs créés
- ✅ Épargne totale correcte
- ✅ Chaque objectif indépendant

---

### 9. Vérifier les Notifications

**Étapes:**
1. Créer un objectif
2. Ajouter des fonds
3. Vérifier les notifications

**Résultat attendu:**
- ✅ Notification de création
- ✅ Notification d'ajout de fonds
- ✅ Notification d'objectif atteint (si applicable)

---

### 10. Vérifier l'Historique

**Étapes:**
1. Créer un objectif
2. Ajouter des fonds
3. Retirer des fonds
4. Vérifier l'historique des transactions

**Résultat attendu:**
- ✅ Toutes les transactions visibles
- ✅ Types corrects (deposit, withdrawal)
- ✅ Montants corrects
- ✅ Timestamps corrects

---

## 🔍 Vérifications Firestore

### Collection: savingsGoals
```bash
# Vérifier les documents
firebase firestore:get savingsGoals

# Vérifier un document spécifique
firebase firestore:get savingsGoals/[goalId]
```

### Collection: savingsTransactions
```bash
# Vérifier les transactions
firebase firestore:get savingsTransactions

# Filtrer par utilisateur
firebase firestore:get savingsTransactions --filter="userId==[user_uid]"
```

### Collection: walletTransactions
```bash
# Vérifier le document wallet
firebase firestore:get walletTransactions/[user_uid]
```

---

## 🐛 Troubleshooting

### Erreur: "No document to update"
**Solution:** Le fix a été appliqué. Recharger la page.

### Erreur: "Solde insuffisant"
**Solution:** Ajouter des fonds au portefeuille d'abord.

### Objectif ne s'affiche pas
**Solution:** Vérifier que l'utilisateur est connecté.

### Notification non reçue
**Solution:** Vérifier les permissions de notification.

### Barre de progression incorrecte
**Solution:** Recharger la page pour synchroniser.

---

## 📊 Cas de Test Avancés

### Test 1: Contributions Automatiques
```
1. Créer un objectif avec fréquence quotidienne
2. Attendre minuit (ou tester manuellement)
3. Vérifier que la contribution a été débitée
4. Vérifier la notification
```

### Test 2: Objectif Atteint
```
1. Créer un objectif avec montant cible bas
2. Ajouter des fonds jusqu'à atteindre le montant
3. Vérifier que le statut passe à "complété"
4. Vérifier que le bouton "Retirer" est disponible
```

### Test 3: Solde Insuffisant
```
1. Créer un objectif
2. Retirer tous les fonds du portefeuille
3. Tenter d'ajouter des fonds
4. Vérifier le message d'erreur
```

### Test 4: Plusieurs Utilisateurs
```
1. Créer 2 comptes utilisateurs
2. Créer des objectifs pour chaque utilisateur
3. Vérifier que les données sont isolées
4. Vérifier que chaque utilisateur ne voit que ses objectifs
```

---

## ✅ Checklist Finale

- [ ] Créer un objectif
- [ ] Ajouter des fonds
- [ ] Retirer des fonds
- [ ] Mettre en pause
- [ ] Reprendre
- [ ] Supprimer
- [ ] Créer plusieurs objectifs
- [ ] Vérifier les notifications
- [ ] Vérifier l'historique
- [ ] Vérifier Firestore
- [ ] Tester les contributions automatiques
- [ ] Tester les cas d'erreur
- [ ] Tester avec plusieurs utilisateurs

---

## 📝 Rapport de Test

### Date: [Date]
### Testeur: [Nom]
### Statut: [Passé/Échoué]

### Résultats:
- [ ] Tous les tests passés
- [ ] Quelques tests échoués
- [ ] Tous les tests échoués

### Problèmes Identifiés:
1. [Problème 1]
2. [Problème 2]
3. [Problème 3]

### Recommandations:
1. [Recommandation 1]
2. [Recommandation 2]

---

## 🚀 Prochaines Étapes

1. Exécuter tous les tests
2. Documenter les résultats
3. Corriger les problèmes
4. Redéployer si nécessaire
5. Valider en production

---

**Statut:** 🧪 GUIDE DE TEST COMPLET  
**Date:** 26 Janvier 2026
