# 🎨 Design - Écosystème de Paiement Unifié

## Architecture Technique

### 1. Hook Unifié: `useUnifiedPayment`

```typescript
// src/hooks/useUnifiedPayment.ts
interface UnifiedPaymentConfig {
  context: 'wallet' | 'nkampa' | 'ugavi' | 'makutano' | 'miyiki' | 'bills' | 'services';
  icon: LucideIcon;
  color: string;
  label: string;
}

export function useUnifiedPayment(config: UnifiedPaymentConfig) {
  const { balance, updateBalance, addTransaction } = useWalletTransactions();
  
  return {
    // Paiement unifié
    processPayment: async (data: PaymentData) => {
      // 1. Valider montant
      // 2. Vérifier solde
      // 3. Appeler Cloud Function
      // 4. Mettre à jour portefeuille
      // 5. Enregistrer transaction
      // 6. Envoyer notification
    },
    
    // Réception unifiée
    processReceive: async (data: ReceiveData) => {
      // Même logique que paiement
    },
    
    // Recherche utilisateur unifiée
    searchRecipient: async (query: string, method: string) => {
      // Logique centralisée
    },
    
    // Validation unifiée
    validatePayment: (amount: number) => {
      // Vérifier montant
      // Vérifier solde
      // Vérifier destinataire
    }
  };
}
```

### 2. Composant Paiement Réutilisable

```typescript
// src/components/payment/UnifiedPaymentFlow.tsx
interface UnifiedPaymentFlowProps {
  context: PaymentContext;
  onSuccess: (transaction: Transaction) => void;
  onError: (error: Error) => void;
}

export function UnifiedPaymentFlow(props: UnifiedPaymentFlowProps) {
  // Utilise useUnifiedPayment
  // Affiche les 7 méthodes
  // Gère le flux complet
  // Retourne au contexte après succès
}
```

### 3. Contextes Spécifiques

```typescript
// Contextes avec icônes personnalisées
const paymentContexts = {
  wallet: {
    icon: Wallet,
    color: '#32BB78',
    label: 'Payer',
    transactionType: 'payment_sent'
  },
  nkampa: {
    icon: ShoppingCart,
    color: '#32BB78',
    label: 'Acheter',
    transactionType: 'purchase'
  },
  ugavi: {
    icon: Truck,
    color: '#32BB78',
    label: 'Payer Livraison',
    transactionType: 'delivery_payment'
  },
  makutano: {
    icon: Heart,
    color: '#FF6B6B',
    label: 'Envoyer Pourboire',
    transactionType: 'tip'
  },
  miyiki: {
    icon: MessageCircle,
    color: '#32BB78',
    label: 'Payer Service',
    transactionType: 'service_payment'
  },
  bills: {
    icon: FileText,
    color: '#FFA500',
    label: 'Payer Facture',
    transactionType: 'bill_payment'
  },
  services: {
    icon: Zap,
    color: '#32BB78',
    label: 'Payer Service',
    transactionType: 'service_payment'
  }
};
```

### 4. Cloud Function Unifiée

```typescript
// functions/src/unifiedPayment.ts
export const processUnifiedPayment = functions.https.onCall(
  async (data: {
    payerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    context: PaymentContext;
    recipientId?: string;
    recipientIdentifier?: string;
    metadata?: Record<string, any>;
  }, context) => {
    // 1. Valider authentification
    // 2. Valider montant
    // 3. Vérifier solde
    // 4. Trouver destinataire
    // 5. Effectuer paiement
    // 6. Créer transactions
    // 7. Envoyer notifications
    // 8. Retourner succès
  }
);
```

### 5. Structure des Transactions

```typescript
interface UnifiedTransaction {
  id: string;
  type: 'payment_sent' | 'payment_received' | 'purchase' | 'delivery_payment' | 'tip' | 'bill_payment' | 'service_payment';
  context: PaymentContext;
  amount: number;
  amountInCDF: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  
  // Paiement
  payerId: string;
  recipientId?: string;
  paymentMethod: PaymentMethod;
  
  // Contexte spécifique
  metadata?: {
    articleId?: string;        // Nkampa
    deliveryId?: string;       // Ugavi
    creatorId?: string;        // Makutano
    serviceId?: string;        // Miyiki
    billId?: string;           // Factures
    partnerId?: string;        // Services
  };
  
  // Timestamps
  timestamp: Timestamp;
  createdAt: string;
}
```

---

## Flux d'Intégration par Service

### Nkampa (E-commerce)

**Avant:**
```
Utilisateur achète article
  → Page Nkampa spécifique
  → Logique de paiement isolée
  → Transaction non synchronisée
```

**Après:**
```
Utilisateur achète article
  → Appelle useUnifiedPayment({ context: 'nkampa' })
  → Affiche UnifiedPaymentFlow avec icône "Acheter"
  → Utilise la même logique de paiement
  → Transaction enregistrée dans le portefeuille
  → Historique synchronisé
```

### Ugavi (Logistique)

**Avant:**
```
Utilisateur paie livraison
  → Page Ugavi spécifique
  → Logique isolée
  → Transaction non synchronisée
```

**Après:**
```
Utilisateur paie livraison
  → Appelle useUnifiedPayment({ context: 'ugavi' })
  → Affiche UnifiedPaymentFlow avec icône "Livraison"
  → Utilise la même logique
  → Transaction enregistrée
  → Historique synchronisé
```

### Makutano (Réseau Social)

**Avant:**
```
Utilisateur envoie pourboire
  → Page Makutano spécifique
  → Logique isolée
  → Transaction non synchronisée
```

**Après:**
```
Utilisateur envoie pourboire
  → Appelle useUnifiedPayment({ context: 'makutano' })
  → Affiche UnifiedPaymentFlow avec icône "Cœur"
  → Utilise la même logique
  → Transaction enregistrée
  → Historique synchronisé
```

---

## Scanner QR Réel

### Implémentation

```typescript
// src/hooks/useRealQRScanner.ts
export function useRealQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startScanning = async () => {
    try {
      // Accès réel à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
    }
  };
  
  const detectQRCode = async (canvas: HTMLCanvasElement) => {
    // Utiliser jsQR ou ZXing pour détection réelle
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      return code.data; // Retourner le code détecté
    }
  };
  
  return {
    isScanning,
    videoRef,
    startScanning,
    stopScanning,
    detectQRCode
  };
}
```

---

## Services Financiers Connectés

### Épargne

```typescript
// Avant: Épargne isolée
// Après: Épargne connectée au portefeuille

const savingsTransaction = {
  type: 'savings_deposit',
  context: 'wallet',
  amount: 1000,
  description: 'Épargne automatique',
  metadata: {
    savingsGoalId: 'goal_123'
  }
};

// Déduit du portefeuille
await useWalletTransactions().addTransaction(savingsTransaction);
```

### Crédit

```typescript
// Avant: Crédit isolé
// Après: Crédit connecté au portefeuille

const creditTransaction = {
  type: 'credit_disbursement',
  context: 'wallet',
  amount: 50000,
  description: 'Crédit approuvé',
  metadata: {
    creditId: 'credit_123',
    interestRate: 0.05
  }
};

// Ajoute au portefeuille
await useWalletTransactions().addTransaction(creditTransaction);
```

### Tontine

```typescript
// Avant: Tontine isolée
// Après: Tontine connectée au portefeuille

const tontineTransaction = {
  type: 'tontine_contribution',
  context: 'wallet',
  amount: 5000,
  description: 'Contribution tontine',
  metadata: {
    tontineId: 'tontine_123',
    round: 1
  }
};

// Déduit du portefeuille
await useWalletTransactions().addTransaction(tontineTransaction);
```

---

## Factures et Services Partenaires

### Factures

```typescript
// Paiement de facture utilise le portefeuille
const billPayment = {
  type: 'bill_payment',
  context: 'bills',
  amount: 15000,
  description: 'Paiement facture électricité',
  metadata: {
    billId: 'bill_123',
    provider: 'SNEL'
  }
};

await useUnifiedPayment({ context: 'bills' }).processPayment(billPayment);
```

### Services Partenaires

```typescript
// Paiement de service utilise le portefeuille
const servicePayment = {
  type: 'service_payment',
  context: 'services',
  amount: 5000,
  description: 'Paiement service internet',
  metadata: {
    serviceId: 'service_123',
    provider: 'Vodacom'
  }
};

await useUnifiedPayment({ context: 'services' }).processPayment(servicePayment);
```

---

## Synchronisation en Temps Réel

### Listener Unifié

```typescript
// Écouter tous les changements du portefeuille
useEffect(() => {
  const unsubscribe = db.collection('users').doc(userId)
    .collection('transactions')
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      // Mettre à jour tous les services
      updateNkampaBalance();
      updateUgaviBalance();
      updateMakutanoBalance();
      updateMiyikiBalance();
      updateBillsBalance();
      updateServicesBalance();
    });
  
  return unsubscribe;
}, [userId]);
```

---

## Correctness Properties

### Property 1: Cohérence du Solde
**Validates: Requirements 1.1, 1.2, 1.3**

Pour toute transaction dans n'importe quel contexte:
- Le solde du portefeuille doit être mis à jour
- La transaction doit être enregistrée dans l'historique
- Le solde doit être cohérent dans tous les services

### Property 2: Synchronisation Écosystème
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Pour chaque service (Nkampa, Ugavi, Makutano, Miyiki):
- Les transactions doivent passer par le portefeuille
- Le solde doit être synchronisé
- L'historique doit être à jour

### Property 3: Scanner QR Réel
**Validates: Requirements 3.1, 3.2**

Pour le scanner QR:
- Doit accéder à la vraie caméra
- Doit détecter les codes réels
- Doit fonctionner dans tous les contextes

### Property 4: Services Financiers Connectés
**Validates: Requirements 4.1, 4.2, 4.3**

Pour l'épargne, crédit, tontine:
- Doivent être connectés au portefeuille
- Doivent mettre à jour le solde
- Doivent être enregistrés dans l'historique

### Property 5: Factures et Services
**Validates: Requirements 5.1, 5.2**

Pour les factures et services:
- Doivent utiliser le portefeuille
- Doivent être enregistrés
- Doivent être synchronisés

---

**Date:** 26 Janvier 2026  
**Version:** 1.0  
**Statut:** À Implémenter
