# Implémentation WonyaPay B2C pour Retraits Mobile Money

## ✅ Corrections Effectuées

### 1. Correction de l'erreur 500 dans l'API de retrait
**Fichier**: `src/app/api/wallet/withdraw-funds/route.ts`

**Problème**: Firebase était initialisé plusieurs fois, causant une erreur.

**Solution**: Utilisation de `getApps()` pour vérifier si Firebase est déjà initialisé avant de créer une nouvelle instance.

```typescript
// Avant
let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.log('Firebase already initialized');
}

// Après
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
```

### 2. Correction de l'erreur setDoc avec exchangeRate undefined
**Fichiers**: `src/app/api/wallet/add-funds/route.ts` et `src/app/api/wallet/withdraw-funds/route.ts`

**Problème**: Firestore n'accepte pas les valeurs `undefined`. Quand la devise était CDF, `exchangeRate` était `undefined`.

**Erreur**:
```
FirebaseError: Function setDoc() called with invalid data. 
Unsupported field value: undefined (found in field wonyaPay.exchangeRate)
```

**Solution**: N'ajouter le champ `exchangeRate` que si la devise est USD.

```typescript
// Avant
wonyaPay: {
  exchangeRate: currency === 'USD' ? exchangeRate : undefined, // ❌ undefined pas accepté
}

// Après
const wonyaPayData: any = {
  refTransa,
  currency,
  // ... autres champs
};

// Ajouter exchangeRate seulement si USD
if (currency === 'USD') {
  wonyaPayData.exchangeRate = exchangeRate; // ✅ Pas de undefined
}
```

### 3. Système de réconciliation amélioré pour B2C
**Fichier**: `src/app/api/wallet/wonyapay/reconcile/route.ts`

**Améliorations**:
- ✅ Récupération des transactions de retrait Mobile Money en plus des dépôts
- ✅ Gestion différenciée des dépôts (C2B) et retraits (B2C)
- ✅ Remboursement automatique du portefeuille en cas d'échec ou expiration d'un retrait
- ✅ Confirmation des retraits réussis sans double débit

**Logique de réconciliation**:

#### Pour les DÉPÔTS (C2B):
- ✅ Succès: `StatutWonya = "Succes"` → Créditer le portefeuille
- ❌ Échec: `StatutWonya = "Echec"` → Marquer comme échoué (pas de crédit)
- ⏱️ Expiré: Après 10 min sans `RefTransa` → Marquer comme échoué

#### Pour les RETRAITS (B2C):
- ✅ Succès: `StatutWonya = "Reçu"` → Confirmer (débit déjà fait)
- ❌ Échec: `StatutWonya = "Echec"` → Rembourser le portefeuille + marquer comme échoué
- ⏱️ Expiré: Après 10 min sans `RefTransa` → Rembourser + marquer comme échoué

### 4. Correction de la conversion USD/CDF
**Fichier**: `src/app/dashboard/withdraw/page.tsx`

**Problème**: La conversion était inversée (division au lieu de multiplication).

**Solution**:
```typescript
// Si retrait en USD: calculer combien de CDF seront débités
if (currency === 'USD') {
  amountToDebit = parseFloat(amount) * usdToCdfRate;
}
```

**Validation du solde**: Vérification du solde en tenant compte de la conversion USD → CDF.

## 🎯 Fonctionnalités Implémentées

### Retrait Mobile Money avec WonyaPay B2C

1. **Choix de la devise**: CDF ou USD
2. **Conversion en temps réel**: Affichage du montant CDF à débiter si retrait en USD
3. **Validation du numéro**: Format 10 chiffres (ex: 0997654321)
4. **Débit immédiat**: Le portefeuille est débité dès l'initiation
5. **Réconciliation automatique**: Vérification toutes les 30 secondes
6. **Remboursement automatique**: En cas d'échec ou expiration

### Flux de Retrait

```
1. Utilisateur choisit "Mobile Money"
   ↓
2. Sélectionne la devise (CDF/USD)
   ↓
3. Entre le montant et le numéro
   ↓
4. Voit la conversion si USD
   ↓
5. Confirme le retrait
   ↓
6. API débite le portefeuille immédiatement
   ↓
7. Envoie la requête B2C à WonyaPay
   ↓
8. Système de réconciliation vérifie le statut
   ↓
9. Si succès: Transaction confirmée
   Si échec: Portefeuille remboursé
```

## 📊 Exemples de Transactions

### Retrait en CDF
```json
{
  "amount": 5000,
  "currency": "CDF",
  "phoneNumber": "0997654321"
}
```
→ Débit: 5000 CDF
→ Envoi WonyaPay: 5000 CDF

### Retrait en USD
```json
{
  "amount": 2,
  "currency": "USD",
  "phoneNumber": "0997654321"
}
```
→ Débit: 5600 CDF (2 USD × 2800)
→ Envoi WonyaPay: 2 USD

## 🔄 Système de Réconciliation

**Fréquence**: Toutes les 30 secondes

**Critères de vérification**:
- ✅ Transactions de plus de 2 minutes
- ✅ Statut "pending"
- ✅ Avec `refTransa` WonyaPay

**Actions selon le statut**:
- `StatutWonya = "Reçu"` → Confirmer le retrait
- `StatutWonya = "Echec"` → Rembourser + marquer échoué
- Pas de `RefTransa` après 10 min → Rembourser + marquer expiré

## 🧪 Tests à Effectuer

1. ✅ Retrait Mobile Money en CDF
2. ✅ Retrait Mobile Money en USD
3. ✅ Vérification du solde insuffisant
4. ✅ Validation du format du numéro
5. ✅ Réconciliation automatique
6. ✅ Remboursement en cas d'échec
7. ✅ Affichage dans les transactions récentes

## 📝 Notes Importantes

- Le portefeuille est toujours en CDF
- Les retraits en USD débitent l'équivalent CDF
- Le taux de change est récupéré en temps réel
- Taux de secours: 2800 CDF/USD
- Les transactions expirées sont automatiquement remboursées
- Le système vérifie uniquement les transactions de plus de 2 minutes

## 🚀 Prochaines Étapes

1. Tester les retraits en environnement de développement
2. Vérifier les logs WonyaPay pour les transactions B2C
3. Tester le remboursement automatique
4. Valider l'affichage dans l'historique des transactions
5. Tester avec différents opérateurs (Airtel, M-Pesa, Orange, Africell)
