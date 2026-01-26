# ⚡ Test Rapide - Système d'Épargne

**Date:** 26 Janvier 2026  
**Durée:** 5 minutes

---

## 🚀 Démarrage Rapide

### 1. Vérifier la Compilation
```bash
npm run build
# Résultat attendu: ✅ Succès
```

### 2. Vérifier les Erreurs
```bash
npm run lint
# Résultat attendu: ✅ 0 erreurs
```

### 3. Accéder à la Page
```
http://localhost:3000/dashboard/savings
```

---

## 🧪 Test Rapide (5 minutes)

### Étape 1: Créer un Objectif (1 min)
```
1. Cliquer "Nouvel Objectif"
2. Remplir:
   - Nom: "Test"
   - Montant: 1,000,000
   - Fréquence: Quotidien
   - Montant par période: 50,000
3. Cliquer "Créer"
```

**Résultat attendu:** ✅ Objectif créé

---

### Étape 2: Ajouter des Fonds (2 min)
```
1. Cliquer "Ajouter"
2. Saisir: 500,000
3. Cliquer "Ajouter"
```

**Résultat attendu:** ✅ Fonds ajoutés (pas d'erreur)

---

### Étape 3: Vérifier Firestore (1 min)
```
1. Aller à Firebase Console
2. Vérifier savingsGoals
3. Vérifier savingsTransactions
4. Vérifier walletTransactions
```

**Résultat attendu:** ✅ Documents créés

---

### Étape 4: Ajouter Plus de Fonds (1 min)
```
1. Cliquer "Ajouter"
2. Saisir: 500,000
3. Cliquer "Ajouter"
```

**Résultat attendu:** ✅ Objectif complété

---

## ✅ Checklist Rapide

- [ ] Compilation réussie
- [ ] Pas d'erreurs
- [ ] Objectif créé
- [ ] Fonds ajoutés (pas d'erreur)
- [ ] Firestore mis à jour
- [ ] Objectif complété
- [ ] Bouton "Retirer" disponible

---

## 🔍 Vérifications Firestore

### Vérifier savingsGoals
```
Collection: savingsGoals
Document: [goalId]
  ✅ userId: [user_uid]
  ✅ name: "Test"
  ✅ targetAmount: 1000000
  ✅ currentAmount: 1000000
  ✅ status: "completed"
```

### Vérifier savingsTransactions
```
Collection: savingsTransactions
Document 1: [txId]
  ✅ amount: 500000
  ✅ type: "deposit"
Document 2: [txId]
  ✅ amount: 500000
  ✅ type: "deposit"
```

### Vérifier walletTransactions
```
Collection: walletTransactions
Document: [user_uid]
  ✅ balance: [montant - 1000000]
  ✅ userId: [user_uid]
```

---

## 🐛 Si Erreur

### Erreur: "No document to update"
```
❌ Le fix n'a pas été appliqué
✅ Solution: Recharger la page
```

### Erreur: "Solde insuffisant"
```
❌ Portefeuille vide
✅ Solution: Ajouter des fonds au portefeuille d'abord
```

### Erreur: "Compilation failed"
```
❌ Erreur TypeScript
✅ Solution: Vérifier les imports
```

---

## 📊 Résultats Attendus

### Avant le Fix
```
Ajouter des fonds → ❌ Erreur
```

### Après le Fix
```
Ajouter des fonds → ✅ Succès
Fonds ajoutés → ✅ Visible
Firestore mis à jour → ✅ Oui
Notification reçue → ✅ Oui
```

---

## 🎯 Résumé

**Objectif:** Vérifier que le fix fonctionne  
**Durée:** 5 minutes  
**Résultat attendu:** ✅ Succès  
**Prochaine étape:** Test complet (voir SAVINGS_TESTING_GUIDE.md)

---

**Statut:** ✅ PRÊT À TESTER
