# E-commerce: Paiement par Portefeuille

## Objectif
Permettre aux utilisateurs d'acheter des produits dans le module e-commerce (Nkampa) en utilisant le solde de leur portefeuille du module paiement.

## Fonctionnalités Implémentées

### 1. API de Traitement de Paiement

**Fichier:** `src/app/api/nkampa/process-payment/route.ts`

**Fonctionnement:**
1. Vérifie l'authentification de l'utilisateur
2. Vérifie que l'acheteur a suffisamment de fonds
3. Effectue une transaction atomique (batch):
   - Débite le portefeuille de l'acheteur
   - Crédite le portefeuille du vendeur
   - Enregistre les transactions pour les deux parties
4. Retourne l'ID de transaction

**Sécurité:**
- Utilise Firebase Admin SDK pour les opérations côté serveur
- Vérifie le token d'authentification
- Transaction atomique pour garantir la cohérence des données
- Validation des données d'entrée

### 2. Hook useNkampaEcommerce

**Fichier:** `src/hooks/useNkampaEcommerce.ts`

**Fonction `buyProduct`:**
```typescript
const buyProduct = async (
  product: EcommerceProduct,
  quantity: number,
  shippingAddress: string,
  shippingPhone: string
) => {
  // 1. Vérifier le solde
  if (balance < totalPrice) {
    throw new Error('Solde insuffisant');
  }

  // 2. Créer la commande dans Firestore
  const orderRef = await addDoc(collection(db, 'nkampa_orders'), {...});

  // 3. Appeler l'API de paiement
  const response = await fetch('/api/nkampa/process-payment', {...});

  // 4. Mettre à jour le statut de la commande
  await updateDoc(doc(db, 'nkampa_orders', orderRef.id), {
    status: 'paid',
    transactionId: paymentData.transactionId,
  });

  // 5. Créer une conversation avec le vendeur
  const conversationId = await createConversation(...);

  // 6. Envoyer un message de confirmation
  await sendMessage(conversationId, ...);
};
```

### 3. Interface Utilisateur

**Fichier:** `src/app/dashboard/nkampa/page.tsx`

**Affichage du Solde:**
```typescript
// Dans le modal de checkout
<div className="bg-gradient-to-r from-primary/10 to-green-800/10 p-4 rounded-lg">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-600">Solde disponible</p>
      <p className="text-2xl font-bold text-primary">
        {balance.toLocaleString()} CDF
      </p>
    </div>
    <div>
      <p className="text-xs text-gray-600">Après achat</p>
      <p className={balance >= totalPrice ? 'text-green-600' : 'text-red-600'}>
        {(balance - totalPrice).toLocaleString()} CDF
      </p>
    </div>
  </div>
</div>
```

**Alerte Solde Insuffisant:**
- Affichage du montant manquant
- Bouton pour rediriger vers "Ajouter des fonds"
- Désactivation du bouton de paiement

**Bouton de Paiement:**
- Texte dynamique selon le solde
- Désactivé si solde insuffisant
- Affiche "Payer avec mon portefeuille" si solde suffisant

## Flux d'Achat

### Étape 1: Sélection du Produit
```
Utilisateur clique sur "Acheter" → Modal de checkout s'ouvre
```

### Étape 2: Vérification du Solde
```
Affichage du solde actuel
Calcul du solde après achat
Vérification si solde suffisant
```

### Étape 3: Saisie des Informations
```
- Quantité (avec boutons +/-)
- Adresse de livraison
- Numéro de téléphone
```

### Étape 4: Confirmation
```
Si solde suffisant:
  → Bouton "Payer avec mon portefeuille" actif
  → Clic → Traitement du paiement

Si solde insuffisant:
  → Bouton désactivé
  → Alerte avec montant manquant
  → Bouton "Ajouter des fonds"
```

### Étape 5: Traitement
```
1. Création de la commande (status: pending)
2. Appel API de paiement
   - Débit acheteur
   - Crédit vendeur
   - Enregistrement transactions
3. Mise à jour commande (status: paid)
4. Création conversation avec vendeur
5. Message de confirmation
6. Toast de succès
```

## Structure des Données

### Collection: `nkampa_orders`
```typescript
{
  id: string,
  productId: string,
  productName: string,
  buyerId: string,
  sellerId: string,
  quantity: number,
  totalPrice: number,
  currency: string,
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled',
  paymentMethod: 'wallet',
  shippingAddress: string,
  shippingPhone: string,
  transactionId?: string,
  trackingNumber?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `wallets/{userId}/transactions`
```typescript
// Transaction acheteur
{
  type: 'ecommerce_purchase',
  amount: -totalPrice,
  currency: 'CDF',
  status: 'completed',
  orderId: string,
  sellerId: string,
  description: 'Achat e-commerce - Commande {orderId}',
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Transaction vendeur
{
  type: 'ecommerce_sale',
  amount: totalPrice,
  currency: 'CDF',
  status: 'completed',
  orderId: string,
  buyerId: string,
  description: 'Vente e-commerce - Commande {orderId}',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Gestion des Erreurs

### Solde Insuffisant
```typescript
if (balance < totalPrice) {
  throw new Error('Solde insuffisant. Veuillez ajouter des fonds.');
}
```
- Affichage dans l'UI avant même de tenter l'achat
- Bouton de paiement désactivé
- Redirection vers page d'ajout de fonds

### Erreur de Paiement
```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || 'Erreur lors du paiement');
}
```
- Toast d'erreur avec message détaillé
- Commande reste en status 'pending'
- Aucun débit effectué

### Erreur de Transaction
```typescript
try {
  await batch.commit();
} catch (error) {
  // Rollback automatique par Firestore
  throw error;
}
```
- Transaction atomique garantit la cohérence
- Rollback automatique en cas d'erreur
- Aucune perte de fonds

## Avantages

### Pour l'Utilisateur
- Paiement instantané
- Pas besoin de carte bancaire
- Suivi du solde en temps réel
- Historique des transactions
- Conversation automatique avec le vendeur

### Pour le Vendeur
- Réception immédiate des fonds
- Notification de commande
- Conversation avec l'acheteur
- Traçabilité complète

### Pour la Plateforme
- Transactions sécurisées
- Atomicité garantie
- Historique complet
- Intégration avec le système de chat
- Pas de frais de passerelle externe

## Améliorations Futures

### 1. Frais de Transaction
```typescript
const platformFee = totalPrice * 0.02; // 2%
const sellerAmount = totalPrice - platformFee;

// Créditer la plateforme
batch.update(platformWalletRef, {
  balance: FieldValue.increment(platformFee)
});
```

### 2. Système de Remboursement
```typescript
const refundOrder = async (orderId: string) => {
  // Inverser la transaction
  // Débiter le vendeur
  // Créditer l'acheteur
  // Mettre à jour le statut de la commande
};
```

### 3. Paiement en Plusieurs Fois
```typescript
const installmentPayment = async (
  orderId: string,
  installments: number
) => {
  // Diviser le montant
  // Créer un calendrier de paiement
  // Débiter à chaque échéance
};
```

### 4. Système de Garantie
```typescript
// Bloquer les fonds pendant X jours
// Libérer après confirmation de réception
// Ou rembourser en cas de litige
```

## Tests Recommandés

### 1. Test de Paiement Réussi
- Solde suffisant
- Informations complètes
- Vérifier débit/crédit
- Vérifier création conversation
- Vérifier statut commande

### 2. Test Solde Insuffisant
- Solde < prix total
- Bouton désactivé
- Message d'erreur affiché
- Redirection vers ajout de fonds

### 3. Test Transaction Atomique
- Simuler erreur pendant transaction
- Vérifier rollback
- Vérifier aucun débit partiel

### 4. Test Concurrent
- Deux achats simultanés
- Vérifier solde correct
- Vérifier ordre des transactions

## Fichiers Modifiés

1. **src/app/api/nkampa/process-payment/route.ts** (nouveau)
   - API de traitement de paiement
   - Transaction atomique
   - Gestion des erreurs

2. **src/hooks/useNkampaEcommerce.ts** (existant)
   - Fonction `buyProduct` déjà implémentée
   - Vérification du solde
   - Appel API de paiement

3. **src/app/dashboard/nkampa/page.tsx** (modifié)
   - Import `useWalletTransactions`
   - Affichage du solde dans checkout
   - Alerte solde insuffisant
   - Bouton de paiement conditionnel

## Conclusion

Le système de paiement par portefeuille est maintenant pleinement fonctionnel dans le module e-commerce. Les utilisateurs peuvent acheter des produits en utilisant leur solde, avec une interface claire montrant le solde disponible et le solde après achat. Le système est sécurisé, atomique et intégré avec le système de chat pour faciliter la communication entre acheteurs et vendeurs.
