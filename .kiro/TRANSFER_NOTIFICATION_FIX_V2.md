# Correction du Système de Transfert et Notifications

## Date: 6 février 2026

## Problème Identifié

Lorsqu'un utilisateur envoie de l'argent à un autre utilisateur :
- ❌ Le destinataire ne reçoit pas la notification
- ❌ La transaction n'apparaît pas dans l'historique
- ❌ Le compte du destinataire n'est pas crédité
- ❌ L'expéditeur ne reçoit aucune notification de confirmation

## Analyse de l'Architecture

### Flux de Transfert Actuel

```
Utilisateur A (Expéditeur)
    ↓
useMoneyTransferDirect.sendMoney()
    ↓
1. Vérification du solde
2. Recherche du destinataire
3. Mise à jour des soldes (Firestore)
4. Création des transactions (Firestore)
5. Création des notifications (Firestore)
    ↓
Utilisateur B (Destinataire)
    ↓
useNotifications() → écoute en temps réel
    ↓
TransferNotificationModal → affiche le modal
```

### Problèmes Identifiés

1. **Dans `useMoneyTransferDirect.ts`** :
   - Les notifications étaient créées sans le champ `currency`
   - Pas de logs pour vérifier la création
   - Pas de délai pour s'assurer de l'écriture Firestore

2. **Dans `useNotifications.ts`** :
   - La requête Firestore utilisait `where('read', '==', false)` qui peut causer des problèmes d'indexation
   - Pas de logs pour déboguer
   - Pas de gestion d'erreur sur le snapshot

3. **Dans `TransferNotificationModal.tsx`** :
   - Pas de logs pour vérifier l'affichage
   - Le champ `currency` pouvait être undefined

## Corrections Appliquées

### 1. Amélioration de `useMoneyTransferDirect.ts`

✅ **Ajout de logs détaillés** :
```typescript
console.log('=== DÉBUT DU TRANSFERT ===');
console.log('Données du transfert:', data);
console.log('Transaction expéditeur créée:', senderTransactionDoc.id);
console.log('Notification destinataire créée:', recipientNotificationDoc.id);
```

✅ **Ajout du champ `currency`** dans les notifications :
```typescript
{
  type: 'transfer_received',
  title: 'Argent reçu',
  message: `Vous avez reçu ${data.amount} ${data.senderCurrency}...`,
  amount: data.amount,
  currency: data.senderCurrency,  // ← AJOUTÉ
  senderCurrency: data.senderCurrency,
  // ...
}
```

✅ **Ajout d'un délai de synchronisation** :
```typescript
// Attendre que Firestore enregistre les données
await new Promise(resolve => setTimeout(resolve, 500));
```

### 2. Amélioration de `useNotifications.ts`

✅ **Suppression du filtre Firestore** :
```typescript
// AVANT: query avec where('read', '==', false)
// APRÈS: Charger toutes les notifications et filtrer côté client
const notificationsRef = collection(db, 'users', user.uid, 'notifications');
const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
  const notifs = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(notif => !notif.read); // Filtrer côté client
});
```

✅ **Ajout de logs** :
```typescript
console.log('Notifications chargées:', notifs.length, notifs);
console.log('Notification marquée comme lue:', notificationId);
```

✅ **Gestion d'erreur améliorée** :
```typescript
onSnapshot(notificationsRef, (snapshot) => {
  // ...
}, (error) => {
  console.error('Erreur snapshot notifications:', error);
  setIsLoading(false);
});
```

### 3. Amélioration de `TransferNotificationModal.tsx`

✅ **Ajout de logs** :
```typescript
console.log('Notifications non acquittées:', unacknowledgedNotifications.length);
console.log('Affichage de la notification:', unacknowledgedNotifications[0]);
```

✅ **Gestion du champ `currency`** :
```typescript
<p className="text-xs text-muted-foreground">
  {currentNotification.currency || currentNotification.senderCurrency || 'CDF'}
</p>
```

## Fichiers Modifiés

1. ✅ `src/hooks/useMoneyTransferDirect.ts`
2. ✅ `src/hooks/useNotifications.ts`
3. ✅ `src/components/transfer-notification-modal.tsx`

## Comment Tester

### Test 1: Transfert Simple

1. **Utilisateur A** : Se connecter et aller sur "Envoyer"
2. Scanner le QR code de l'**Utilisateur B**
3. Entrer un montant (ex: 1000 CDF)
4. Confirmer l'envoi
5. **Vérifier** :
   - ✅ Toast de succès pour A
   - ✅ Solde de A diminué
   - ✅ Console logs du transfert

6. **Utilisateur B** : Actualiser la page
7. **Vérifier** :
   - ✅ Modal de notification apparaît
   - ✅ Montant correct affiché
   - ✅ Nom de l'expéditeur affiché
   - ✅ Solde de B augmenté
   - ✅ Transaction dans l'historique

### Test 2: Vérification Console

Ouvrir la console du navigateur et vérifier les logs :

```
=== DÉBUT DU TRANSFERT ===
Données du transfert: {...}
Utilisateur: abc123...
Solde actuel: 5000
Mise à jour du solde expéditeur: 5000 -> 4000
Mise à jour du solde destinataire: 2000 -> 3000
Transaction expéditeur créée: xyz789...
Transaction destinataire créée: def456...
Notification expéditeur créée: ghi012...
Notification destinataire créée: jkl345...
Transfert terminé avec succès
```

### Test 3: Vérification Firestore

1. Aller sur Firebase Console
2. Ouvrir Firestore Database
3. Vérifier :
   - ✅ `users/{userId}/transactions` → 2 nouvelles transactions
   - ✅ `users/{userId}/notifications` → 2 nouvelles notifications
   - ✅ `users/{userId}` → `walletBalance` mis à jour

## Prochaines Étapes

Si le problème persiste après ces corrections :

1. **Vérifier les règles Firestore** :
   ```javascript
   // Vérifier que les utilisateurs peuvent écrire dans leurs notifications
   match /users/{userId}/notifications/{notificationId} {
     allow read, write: if request.auth.uid == userId;
   }
   ```

2. **Vérifier les index Firestore** :
   - Aller sur Firebase Console → Firestore → Indexes
   - Vérifier qu'il n'y a pas d'erreur d'index

3. **Tester avec des utilisateurs différents** :
   - Créer 2 comptes de test
   - Tester le transfert dans les deux sens

## Notes Importantes

⚠️ **Modifications Minimales** : Seules les fonctionnalités de transfert et notification ont été modifiées. Aucune autre fonctionnalité n'a été touchée.

⚠️ **Logs de Débogage** : Les logs ajoutés peuvent être retirés en production pour des raisons de performance.

⚠️ **Délai de Synchronisation** : Le délai de 500ms peut être ajusté selon les besoins.

## Résumé

Les corrections apportées visent à :
1. ✅ Assurer que les notifications sont bien créées dans Firestore
2. ✅ Assurer que les transactions sont bien enregistrées
3. ✅ Améliorer la visibilité avec des logs détaillés
4. ✅ Corriger les problèmes de champs manquants
5. ✅ Améliorer la gestion d'erreur

Le système devrait maintenant fonctionner correctement avec des notifications en temps réel pour les deux utilisateurs.
