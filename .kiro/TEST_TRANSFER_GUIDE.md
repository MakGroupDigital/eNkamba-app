# Guide de Test - Système de Transfert Corrigé

## 🎯 Objectif
Tester que le système de transfert fonctionne correctement avec :
- ✅ Crédit du compte bénéficiaire
- ✅ Notifications push
- ✅ Transactions dans l'historique
- ✅ Transactions récentes

## 📋 Prérequis

1. **Deux comptes utilisateurs**
   - Compte A (Expéditeur)
   - Compte B (Destinataire)

2. **Solde suffisant sur Compte A**
   - Minimum 1,000 CDF pour le test

## 🧪 Scénario de Test

### Étape 1 : Préparation

#### Compte A (Expéditeur)
```
1. Se connecter avec le Compte A
2. Aller dans Dashboard > Wallet
3. Vérifier le solde actuel
4. Si solde < 1,000 CDF :
   - Cliquer sur "Add Funds"
   - Ajouter 10,000 CDF
   - Confirmer
```

#### Compte B (Destinataire)
```
1. Se connecter avec le Compte B
2. Aller dans Dashboard > Pay/Receive
3. Afficher le QR Code
4. Noter le accountNumber (ENK...)
5. Prendre une capture d'écran du QR Code
```

### Étape 2 : Effectuer le Transfert

#### Sur Compte A
```
1. Aller dans Dashboard > Pay/Receive
2. Cliquer sur "Payer quelqu'un"
3. Scanner le QR Code du Compte B
   OU
   Importer l'image du QR Code
   OU
   Entrer manuellement le accountNumber
4. Entrer le montant : 1,000 CDF
5. Vérifier les informations :
   - Destinataire : [Nom du Compte B]
   - Montant : 1,000 CDF
   - Nouveau solde : [Solde actuel - 1,000]
6. Cliquer sur "Envoyer l'argent"
7. Attendre la confirmation
```

### Étape 3 : Vérifications

#### ✅ Sur Compte A (Expéditeur)

**1. Solde mis à jour**
```
Dashboard > Wallet
Vérifier : Solde = Ancien solde - 1,000 CDF
```

**2. Transaction dans l'historique**
```
Dashboard > History
Vérifier :
- Type : "Envoi" ou "transfer_sent"
- Montant : -1,000 CDF
- Destinataire : [Nom du Compte B]
- Statut : Complété
- Date : Aujourd'hui
```

**3. Notification**
```
Cliquer sur l'icône de notification (cloche)
Vérifier :
- Titre : "Argent envoyé"
- Message : "Vous avez envoyé 1,000 CDF à [Nom du Compte B]"
- Non lue (badge rouge)
```

**4. Transactions récentes**
```
Dashboard > Wallet (section "Transactions récentes")
Vérifier :
- Transaction visible en haut de la liste
- Montant : -1,000 CDF
- Destinataire : [Nom du Compte B]
```

#### ✅ Sur Compte B (Destinataire)

**1. Solde mis à jour** ⭐ PRINCIPAL
```
Dashboard > Wallet
Vérifier : Solde = Ancien solde + 1,000 CDF
```

**2. Transaction dans l'historique** ⭐ PRINCIPAL
```
Dashboard > History
Vérifier :
- Type : "Réception" ou "transfer_received"
- Montant : +1,000 CDF
- Expéditeur : [Nom du Compte A]
- Statut : Complété
- Date : Aujourd'hui
```

**3. Notification** ⭐ PRINCIPAL
```
Cliquer sur l'icône de notification (cloche)
Vérifier :
- Titre : "Argent reçu"
- Message : "Vous avez reçu 1,000 CDF de [Nom du Compte A]"
- Non lue (badge rouge)
- Badge de notification visible
```

**4. Transactions récentes** ⭐ PRINCIPAL
```
Dashboard > Wallet (section "Transactions récentes")
Vérifier :
- Transaction visible en haut de la liste
- Montant : +1,000 CDF
- Expéditeur : [Nom du Compte A]
```

## 🔍 Points de Contrôle Détaillés

### Console du Navigateur (F12)

#### Pendant le transfert
```javascript
// Pas d'erreurs dans la console
// Messages attendus :
"Paiement réussi ! ✅"
"1,000 CDF envoyé à [Nom]"
```

#### Vérifier Firestore (Firebase Console)

**Collection `users/{userId}`**
```javascript
// Compte A
{
  walletBalance: [ancien - 1000],
  lastTransactionTime: [timestamp récent]
}

// Compte B
{
  walletBalance: [ancien + 1000],
  lastTransactionTime: [timestamp récent]
}
```

**Subcollection `users/{userId}/transactions`**
```javascript
// Compte A
{
  type: "transfer_sent",
  amount: 1000,
  status: "completed",
  recipientId: "[ID Compte B]",
  recipientName: "[Nom Compte B]",
  timestamp: [timestamp]
}

// Compte B
{
  type: "transfer_received",
  amount: 1000,
  status: "completed",
  senderId: "[ID Compte A]",
  senderName: "[Nom Compte A]",
  timestamp: [timestamp]
}
```

**Subcollection `users/{userId}/notifications`**
```javascript
// Compte A
{
  type: "transfer_sent",
  title: "Argent envoyé",
  message: "Vous avez envoyé 1,000 CDF à [Nom B]",
  read: false,
  acknowledged: true
}

// Compte B
{
  type: "transfer_received",
  title: "Argent reçu",
  message: "Vous avez reçu 1,000 CDF de [Nom A]",
  read: false,
  acknowledged: false
}
```

## 🐛 Dépannage

### Problème : Solde du destinataire non mis à jour

**Vérifier :**
1. Console du navigateur pour les erreurs
2. Firebase Console > Firestore > users/{recipientId}
3. Vérifier que `walletBalance` a changé

**Solution :**
- Rafraîchir la page (F5)
- Vérifier les règles Firestore
- Vérifier la connexion Internet

### Problème : Notification non affichée

**Vérifier :**
1. Firebase Console > Firestore > users/{userId}/notifications
2. Vérifier que la notification existe
3. Vérifier le composant `notifications-panel.tsx`

**Solution :**
- Rafraîchir la page
- Cliquer sur l'icône de notification
- Vérifier le hook `useNotifications`

### Problème : Transaction non dans l'historique

**Vérifier :**
1. Firebase Console > Firestore > users/{userId}/transactions
2. Vérifier que la transaction existe
3. Vérifier la page `history/page.tsx`

**Solution :**
- Rafraîchir la page
- Vérifier le hook `useAllTransactions`
- Vérifier les filtres de date

## 📊 Résultats Attendus

### ✅ Test Réussi
```
✓ Solde expéditeur débité
✓ Solde destinataire crédité
✓ Transaction expéditeur créée
✓ Transaction destinataire créée
✓ Notification expéditeur créée
✓ Notification destinataire créée
✓ Historique mis à jour (2 comptes)
✓ Transactions récentes affichées (2 comptes)
```

### ❌ Test Échoué
```
Si un seul élément manque :
1. Vérifier la console du navigateur
2. Vérifier Firebase Console
3. Vérifier les logs du serveur
4. Contacter le support technique
```

## 🚀 Tests Supplémentaires

### Test 2 : Transfert par Email
```
1. Utiliser l'email au lieu du QR Code
2. Vérifier les mêmes points
```

### Test 3 : Transfert par Téléphone
```
1. Utiliser le numéro de téléphone
2. Vérifier les mêmes points
```

### Test 4 : Transfert par Carte
```
1. Utiliser le numéro de carte
2. Vérifier les mêmes points
```

### Test 5 : Solde Insuffisant
```
1. Essayer de transférer plus que le solde
2. Vérifier le message d'erreur
3. Vérifier qu'aucune transaction n'est créée
```

### Test 6 : Destinataire Inexistant
```
1. Entrer un accountNumber invalide
2. Vérifier le message d'erreur
3. Vérifier qu'aucune transaction n'est créée
```

## 📝 Rapport de Test

```
Date : _______________
Testeur : _______________

Compte A (Expéditeur)
- Email : _______________
- Solde initial : _______________
- Solde final : _______________

Compte B (Destinataire)
- Email : _______________
- Solde initial : _______________
- Solde final : _______________

Montant transféré : _______________

Résultats :
[ ] Solde expéditeur débité
[ ] Solde destinataire crédité
[ ] Transaction expéditeur créée
[ ] Transaction destinataire créée
[ ] Notification expéditeur créée
[ ] Notification destinataire créée
[ ] Historique mis à jour
[ ] Transactions récentes affichées

Commentaires :
_________________________________
_________________________________
_________________________________

Statut : [ ] RÉUSSI  [ ] ÉCHOUÉ
```

## 🎉 Conclusion

Si tous les tests passent, le système de transfert est **100% fonctionnel** !

Les utilisateurs peuvent maintenant :
- Envoyer de l'argent
- Recevoir de l'argent
- Voir leurs transactions
- Recevoir des notifications
- Consulter leur historique

**Prochaine étape :** Déployer en production ! 🚀
