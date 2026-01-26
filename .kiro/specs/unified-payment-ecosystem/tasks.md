# ✅ Tâches - Écosystème de Paiement Unifié

## Phase 1: Unification Paiement/Réception

### 1.1 Créer Hook `useUnifiedPayment`
- [ ] Créer `src/hooks/useUnifiedPayment.ts`
- [ ] Implémenter `processPayment()`
- [ ] Implémenter `processReceive()`
- [ ] Implémenter `searchRecipient()`
- [ ] Implémenter `validatePayment()`
- [ ] Ajouter support des 7 méthodes
- [ ] Tester avec tous les contextes

### 1.2 Créer Composant `UnifiedPaymentFlow`
- [ ] Créer `src/components/payment/UnifiedPaymentFlow.tsx`
- [ ] Implémenter sélection de méthode
- [ ] Implémenter détails du paiement
- [ ] Implémenter confirmation
- [ ] Implémenter succès
- [ ] Ajouter personnalisation des icônes
- [ ] Tester le flux complet

### 1.3 Créer Cloud Function Unifiée
- [ ] Créer `functions/src/unifiedPayment.ts`
- [ ] Implémenter `processUnifiedPayment()`
- [ ] Ajouter validation
- [ ] Ajouter gestion des erreurs
- [ ] Tester avec tous les contextes
- [ ] Déployer en production

### 1.4 Mettre à Jour Pages Existantes
- [x] Mettre à jour `src/app/dashboard/pay/page.tsx`
- [x] Mettre à jour `src/app/dashboard/receive/page.tsx`
- [x] Utiliser `useUnifiedPayment`
- [x] Utiliser `UnifiedPaymentFlow`
- [x] Tester les deux pages

---

## Phase 2: Intégration Écosystème

### 2.1 Intégrer Nkampa (E-commerce)
- [x] Créer page de paiement Nkampa
- [x] Utiliser `useUnifiedPayment({ context: 'nkampa' })`
- [x] Ajouter icône "Acheter"
- [x] Ajouter métadonnées d'article
- [x] Tester le flux complet
- [x] Vérifier synchronisation portefeuille

### 2.2 Intégrer Ugavi (Logistique)
- [x] Créer page de paiement Ugavi
- [x] Utiliser `useUnifiedPayment({ context: 'ugavi' })`
- [x] Ajouter icône "Livraison"
- [x] Ajouter métadonnées de livraison
- [x] Tester le flux complet
- [x] Vérifier synchronisation portefeuille

### 2.3 Intégrer Makutano (Réseau Social)
- [x] Créer page de pourboire Makutano
- [x] Utiliser `useUnifiedPayment({ context: 'makutano' })`
- [x] Ajouter icône "Cœur"
- [x] Ajouter métadonnées de créateur
- [x] Tester le flux complet
- [x] Vérifier synchronisation portefeuille

### 2.4 Intégrer Miyiki (Messagerie)
- [x] Créer page de paiement Miyiki
- [x] Utiliser `useUnifiedPayment({ context: 'miyiki' })`
- [x] Ajouter icône "Service"
- [x] Ajouter métadonnées de service
- [x] Tester le flux complet
- [x] Vérifier synchronisation portefeuille

---

## Phase 3: Scanner QR Réel

### 3.1 Créer Hook `useRealQRScanner`
- [x] Créer `src/hooks/useRealQRScanner.ts`
- [x] Implémenter accès caméra réel
- [x] Implémenter détection QR réelle
- [x] Ajouter fallback manuel
- [x] Tester sur mobile
- [x] Tester sur desktop

### 3.2 Intégrer Scanner dans Paiement
- [x] Utiliser `useRealQRScanner` dans `UnifiedPaymentFlow`
- [x] Remplacer scanner simulé
- [x] Tester détection réelle
- [x] Tester fallback manuel

### 3.3 Intégrer Scanner dans Réception
- [x] Utiliser `useRealQRScanner` dans réception
- [x] Remplacer scanner simulé
- [x] Tester détection réelle

### 3.4 Intégrer Scanner dans Tous les Contextes
- [x] Intégrer dans Nkampa
- [x] Intégrer dans Ugavi
- [x] Intégrer dans Makutano
- [x] Intégrer dans Miyiki
- [x] Tester partout

---

## Phase 4: Services Financiers Connectés

### 4.1 Connecter Épargne
- [x] Modifier page épargne
- [x] Utiliser `useWalletTransactions`
- [x] Ajouter transactions d'épargne
- [x] Mettre à jour solde portefeuille
- [x] Tester synchronisation

### 4.2 Connecter Crédit
- [x] Modifier page crédit
- [x] Utiliser `useWalletTransactions`
- [x] Ajouter transactions de crédit
- [x] Mettre à jour solde portefeuille
- [x] Tester synchronisation

### 4.3 Connecter Tontine
- [x] Modifier page tontine
- [x] Utiliser `useWalletTransactions`
- [x] Ajouter transactions de tontine
- [x] Mettre à jour solde portefeuille
- [x] Tester synchronisation

---

## Phase 5: Factures et Services Partenaires

### 5.1 Créer Page Factures
- [x] Créer `src/app/dashboard/bills/page.tsx`
- [x] Utiliser `useUnifiedPayment({ context: 'bills' })`
- [x] Ajouter icône "Facture"
- [x] Ajouter métadonnées de facture
- [x] Tester le flux complet

### 5.2 Créer Page Services Partenaires
- [x] Créer `src/app/dashboard/partner-services/page.tsx`
- [x] Utiliser `useUnifiedPayment({ context: 'services' })`
- [x] Ajouter icône "Service"
- [x] Ajouter métadonnées de service
- [x] Tester le flux complet

### 5.3 Intégrer Factures dans Portefeuille
- [x] Ajouter bouton "Factures" dans wallet
- [x] Lier à page factures
- [x] Tester synchronisation

### 5.4 Intégrer Services dans Portefeuille
- [x] Ajouter bouton "Services" dans wallet
- [x] Lier à page services
- [x] Tester synchronisation

---

## Phase 6: Tests et Validation

### 6.1 Tests Unitaires
- [ ] Tester `useUnifiedPayment`
- [ ] Tester `UnifiedPaymentFlow`
- [ ] Tester `useRealQRScanner`
- [ ] Tester Cloud Function

### 6.2 Tests d'Intégration
- [ ] Tester paiement Nkampa
- [ ] Tester paiement Ugavi
- [ ] Tester paiement Makutano
- [ ] Tester paiement Miyiki
- [ ] Tester paiement factures
- [ ] Tester paiement services

### 6.3 Tests de Synchronisation
- [ ] Tester synchronisation portefeuille
- [ ] Tester historique synchronisé
- [ ] Tester solde à jour partout
- [ ] Tester notifications

### 6.4 Tests Scanner QR
- [ ] Tester détection réelle
- [ ] Tester fallback manuel
- [ ] Tester sur mobile
- [ ] Tester sur desktop

### 6.5 Tests Services Financiers
- [ ] Tester épargne connectée
- [ ] Tester crédit connecté
- [ ] Tester tontine connectée
- [ ] Tester synchronisation

---

## Phase 7: Déploiement

### 7.1 Déployer Cloud Functions
- [ ] Compiler Cloud Functions
- [ ] Déployer `unifiedPayment`
- [ ] Vérifier logs
- [ ] Tester en production

### 7.2 Déployer Frontend
- [ ] Compiler frontend
- [ ] Déployer sur Firebase
- [ ] Vérifier tous les services
- [ ] Tester en production

### 7.3 Monitoring
- [ ] Monitorer les logs
- [ ] Vérifier les transactions
- [ ] Vérifier les soldes
- [ ] Vérifier les notifications

---

## Dépendances

```
Phase 1 → Phase 2
Phase 1 → Phase 3
Phase 1 → Phase 4
Phase 1 → Phase 5
Phase 2, 3, 4, 5 → Phase 6
Phase 6 → Phase 7
```

---

## Estimations

| Phase | Tâches | Durée Estimée |
|-------|--------|---------------|
| 1 | 4 | 2-3 jours |
| 2 | 4 | 2-3 jours |
| 3 | 4 | 1-2 jours |
| 4 | 3 | 1-2 jours |
| 5 | 4 | 1-2 jours |
| 6 | 5 | 2-3 jours |
| 7 | 3 | 1 jour |
| **Total** | **27** | **10-16 jours** |

---

**Date:** 26 Janvier 2026  
**Version:** 1.0  
**Statut:** À Implémenter
