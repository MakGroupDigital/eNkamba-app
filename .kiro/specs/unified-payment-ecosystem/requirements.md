# 📋 Spécification - Écosystème de Paiement Unifié eNkamba

## 🎯 Vue d'ensemble

Unifier et améliorer le flux de paiement et réception dans tout l'écosystème eNkamba (Mbongo, Nkampa, Ugavi, Makutano) pour assurer une cohérence totale et une connexion directe au portefeuille central.

**Objectif Principal:** Un seul portefeuille, une seule logique, utilisé partout dans l'écosystème avec des icônes et des flux personnalisés selon le contexte.

---

## 📊 Contexte Actuel

### Problèmes Identifiés

1. **Incohérence des Fonctionnalités**
   - Les pages "Payer" et "Recevoir" ont des fonctionnalités différentes
   - Les icônes ne sont pas personnalisées par contexte
   - Les flux ne sont pas connectés au portefeuille central

2. **Duplication de Logique**
   - Chaque service (Nkampa, Ugavi, etc.) a sa propre logique de paiement
   - Pas de réutilisation des composants du portefeuille
   - Transactions non synchronisées

3. **Manque de Cohérence**
   - Scanner QR simulé au lieu de réel
   - Services financiers non connectés aux vrais services
   - Factures et services partenaires isolés

---

## ✅ Acceptation Critères

### 1. Unification des Fonctionnalités de Paiement

**Critère 1.1:** Les pages "Payer" et "Recevoir" utilisent les mêmes fonctionnalités
- ✅ Même ensemble de méthodes (QR, Carte, Compte, Email, Téléphone, Bluetooth, WiFi)
- ✅ Même logique de recherche utilisateur
- ✅ Même système de validation

**Critère 1.2:** Les icônes sont personnalisées par contexte
- ✅ Icône "Payer" pour les paiements
- ✅ Icône "Recevoir" pour les réceptions
- ✅ Icône "Acheter" pour l'e-commerce
- ✅ Icône "Livraison" pour la logistique
- ✅ Icône "Pourboire" pour les réseaux sociaux

**Critère 1.3:** Les flux sont connectés au portefeuille central
- ✅ Toutes les transactions passent par `useWalletTransactions`
- ✅ Tous les soldes sont mis à jour en temps réel
- ✅ Tous les historiques sont synchronisés

### 2. Intégration Écosystème

**Critère 2.1:** Nkampa (E-commerce) utilise le portefeuille
- ✅ Paiement d'articles utilise la logique "Payer"
- ✅ Icône personnalisée "Acheter"
- ✅ Transactions enregistrées dans l'historique du portefeuille
- ✅ Solde mis à jour automatiquement

**Critère 2.2:** Ugavi (Logistique) utilise le portefeuille
- ✅ Paiement de livraison utilise la logique "Payer"
- ✅ Icône personnalisée "Livraison"
- ✅ Transactions enregistrées dans l'historique
- ✅ Frais de livraison déduits du portefeuille

**Critère 2.3:** Makutano (Réseau Social) utilise le portefeuille
- ✅ Pourboires utilisent la logique "Payer"
- ✅ Icône personnalisée "Pourboire"
- ✅ Transactions enregistrées dans l'historique
- ✅ Solde du créateur mis à jour

**Critère 2.4:** Miyiki-Chat (Messagerie) utilise le portefeuille
- ✅ Paiements de services utilisent la logique "Payer"
- ✅ Transactions enregistrées dans l'historique
- ✅ Solde mis à jour

### 3. Scanner QR Réel

**Critère 3.1:** Le scanner QR utilise la vraie caméra
- ✅ Accès réel à la caméra du téléphone
- ✅ Détection réelle des codes QR (pas de simulation)
- ✅ Décodage automatique du code
- ✅ Fallback manuel si détection échoue

**Critère 3.2:** Le scanner fonctionne dans tous les contextes
- ✅ Scanner dans "Payer"
- ✅ Scanner dans "Recevoir"
- ✅ Scanner dans Nkampa (paiement article)
- ✅ Scanner dans Ugavi (paiement livraison)

### 4. Services Financiers Réels

**Critère 4.1:** L'épargne est connectée au portefeuille
- ✅ Épargne automatique déduit du portefeuille
- ✅ Solde d'épargne affiché dans le portefeuille
- ✅ Transactions d'épargne enregistrées

**Critère 4.2:** Le crédit est connecté au portefeuille
- ✅ Crédit approuvé ajoute au portefeuille
- ✅ Remboursement déduit du portefeuille
- ✅ Transactions de crédit enregistrées

**Critère 4.3:** La tontine est connectée au portefeuille
- ✅ Contributions déduites du portefeuille
- ✅ Payout ajouté au portefeuille
- ✅ Transactions de tontine enregistrées

### 5. Factures et Services Partenaires

**Critère 5.1:** Les factures utilisent le portefeuille
- ✅ Paiement de facture déduit du portefeuille
- ✅ Transactions enregistrées
- ✅ Reçu généré

**Critère 5.2:** Les services partenaires utilisent le portefeuille
- ✅ Paiement de service déduit du portefeuille
- ✅ Transactions enregistrées
- ✅ Historique synchronisé

### 6. Cohérence Visuelle et Fonctionnelle

**Critère 6.1:** Les icônes sont cohérentes
- ✅ Même style pour toutes les icônes
- ✅ Couleurs cohérentes avec la palette eNkamba
- ✅ Icônes personnalisées par contexte

**Critère 6.2:** Les flux sont cohérents
- ✅ Même flux de paiement partout
- ✅ Même validation partout
- ✅ Même gestion des erreurs partout

**Critère 6.3:** Les données sont cohérentes
- ✅ Un seul portefeuille source de vérité
- ✅ Toutes les transactions synchronisées
- ✅ Tous les soldes à jour

---

## 🏗️ Architecture Proposée

### Couche Portefeuille (Source de Vérité)
```
useWalletTransactions (Hook Central)
├── getBalance()
├── getTransactions()
├── addTransaction()
├── updateBalance()
└── syncAcrossEcosystem()
```

### Couche Paiement Unifiée
```
useUnifiedPayment (Nouveau Hook)
├── processPayment()
├── processReceive()
├── validateAmount()
├── searchRecipient()
└── handleAllMethods()
```

### Couche Contexte
```
Contextes Spécifiques
├── Nkampa (E-commerce) → Icône "Acheter"
├── Ugavi (Logistique) → Icône "Livraison"
├── Makutano (Social) → Icône "Pourboire"
├── Mbongo (Wallet) → Icône "Payer"/"Recevoir"
└── Miyiki (Chat) → Icône "Service"
```

---

## 📱 Flux Utilisateur Unifié

### Flux Paiement (Tous les Contextes)

```
1. Utilisateur clique sur "Payer" / "Acheter" / "Envoyer Pourboire"
   ↓
2. Sélectionne méthode (QR, Carte, Compte, Email, Téléphone, Bluetooth, WiFi)
   ↓
3. Recherche destinataire (sauf Bluetooth/WiFi)
   ↓
4. Entre montant
   ↓
5. Confirme paiement
   ↓
6. Cloud Function traite (même logique partout)
   ↓
7. Portefeuille mis à jour (useWalletTransactions)
   ↓
8. Transaction enregistrée dans l'historique
   ↓
9. Notification envoyée
   ↓
10. Succès
```

### Flux Réception (Tous les Contextes)

```
1. Utilisateur clique sur "Recevoir" / "Encaisser"
   ↓
2. Sélectionne méthode (QR, Carte, Compte, Email, Téléphone, Bluetooth, WiFi)
   ↓
3. Génère code/QR unique
   ↓
4. Partage avec payeur
   ↓
5. Payeur scanne/entre code
   ↓
6. Payeur confirme paiement
   ↓
7. Portefeuille mis à jour (useWalletTransactions)
   ↓
8. Transaction enregistrée
   ↓
9. Notification envoyée
   ↓
10. Succès
```

---

## 🔄 Synchronisation Écosystème

### Transactions Synchronisées

Chaque transaction dans l'écosystème doit:
1. ✅ Passer par `useWalletTransactions`
2. ✅ Mettre à jour le solde du portefeuille
3. ✅ Être enregistrée dans l'historique
4. ✅ Générer une notification
5. ✅ Être visible dans tous les services

### Exemple: Achat sur Nkampa

```
Utilisateur achète article (100 CDF)
   ↓
Nkampa appelle useUnifiedPayment.processPayment()
   ↓
Portefeuille déduit 100 CDF
   ↓
Transaction enregistrée: "Achat article - Nkampa"
   ↓
Historique du portefeuille mis à jour
   ↓
Notification: "Vous avez acheté un article pour 100 CDF"
   ↓
Vendeur reçoit notification: "Vous avez vendu un article pour 100 CDF"
```

---

## 🎨 Personnalisation des Icônes

### Contextes et Icônes

| Contexte | Icône | Couleur | Utilisation |
|----------|-------|---------|-------------|
| Mbongo (Wallet) | Wallet | #32BB78 | Paiements généraux |
| Nkampa (E-commerce) | ShoppingCart | #32BB78 | Achats d'articles |
| Ugavi (Logistique) | Truck | #32BB78 | Paiement livraison |
| Makutano (Social) | Heart | #FF6B6B | Pourboires/Dons |
| Miyiki (Chat) | MessageCircle | #32BB78 | Services |
| Factures | FileText | #FFA500 | Paiement factures |
| Services | Zap | #32BB78 | Services partenaires |

---

## 🚀 Implémentation

### Phase 1: Unification Paiement/Réception
- Créer `useUnifiedPayment` hook
- Unifier la logique de paiement
- Unifier la logique de réception
- Ajouter personnalisation des icônes

### Phase 2: Intégration Écosystème
- Intégrer Nkampa
- Intégrer Ugavi
- Intégrer Makutano
- Intégrer Miyiki

### Phase 3: Services Financiers
- Connecter épargne
- Connecter crédit
- Connecter tontine

### Phase 4: Factures et Services
- Intégrer factures
- Intégrer services partenaires

---

## 📊 Bénéfices

✅ **Cohérence** - Un seul portefeuille, une seule logique  
✅ **Synchronisation** - Toutes les transactions synchronisées  
✅ **Expérience Utilisateur** - Flux unifié et intuitif  
✅ **Maintenance** - Une seule logique à maintenir  
✅ **Scalabilité** - Facile d'ajouter de nouveaux services  
✅ **Sécurité** - Validation centralisée  
✅ **Audit** - Historique complet et tracé  

---

## 📝 Notes

- Aucun changement d'affichage, juste amélioration du flux
- Les icônes sont personnalisées par contexte
- Toutes les transactions passent par le portefeuille central
- Scanner QR réel, pas de simulation
- Services financiers connectés aux vrais services
- Factures et services partenaires intégrés

---

**Date:** 26 Janvier 2026  
**Version:** 1.0  
**Statut:** À Implémenter
