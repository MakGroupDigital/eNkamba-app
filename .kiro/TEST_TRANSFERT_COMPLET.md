# Guide de Test Complet du Système de Transfert

## Date: 6 février 2026

## ⚠️ IMPORTANT

Les logs dans la console montrent **"Notifications non acquittées: 0"** parce qu'**aucun transfert n'a encore été effectué** depuis les modifications. C'est normal !

## Préparation du Test

### 1. Ouvrir la Console du Navigateur

1. Appuyez sur `F12` ou `Cmd+Option+I` (Mac)
2. Allez dans l'onglet **Console**
3. Effacez les logs existants (clic droit → Clear console)

### 2. Vérifier que Vous Êtes Connecté

1. Allez sur `/dashboard`
2. Vérifiez que votre profil s'affiche
3. Notez votre **solde actuel**

## Test 1: Vérification du Hook useNotifications

### Logs Attendus au Chargement de la Page

Quand vous chargez le dashboard, vous devriez voir dans la console :

```
useNotifications: Chargement des notifications pour: [votre-user-id]
useNotifications: Écoute des notifications sur: users/[votre-user-id]/notifications
useNotifications: Snapshot reçu, nombre de docs: [nombre]
useNotifications: Toutes les notifications: [array]
useNotifications: Notifications non lues: [nombre]
Notifications chargées: [nombre] [array]
Notifications non acquittées: [nombre]
```

**Si vous ne voyez PAS ces logs** :
- Le hook `useNotifications` n'est pas appelé
- Vérifiez que `TransferNotificationModal` est bien dans le layout

**Si vous voyez "Notifications non acquittées: 0"** :
- C'est NORMAL si vous n'avez pas encore de notifications dans Firestore
- Continuez avec le Test 2

## Test 2: Effectuer un Transfert

### Étape 1: Préparer Deux Comptes

Vous avez besoin de **2 comptes utilisateurs** :
- **Compte A** (Expéditeur) : Celui que vous utilisez actuellement
- **Compte B** (Destinataire) : Un autre compte de test

**Option 1** : Créer un nouveau compte
1. Ouvrez une fenêtre de navigation privée
2. Allez sur votre app
3. Créez un nouveau compte
4. Notez le **accountNumber** du Compte B

**Option 2** : Utiliser un compte existant
1. Si vous avez déjà un autre compte, connectez-vous avec
2. Allez sur `/dashboard/wallet`
3. Notez le **accountNumber** (format: ENK000000002326)
4. Générez le QR code (bouton "Afficher mon QR code")
5. Faites une capture d'écran du QR code

### Étape 2: Effectuer le Transfert (Compte A)

1. **Connectez-vous avec le Compte A** (expéditeur)
2. Ouvrez la console (`F12`)
3. Effacez les logs
4. Allez sur `/dashboard/send`
5. Cliquez sur **"Demander de l'argent"**
6. Entrez un montant (ex: **100 CDF**)
7. Cliquez sur **"Scanner le QR code"**

**Option A** : Scanner avec la caméra
- Pointez la caméra vers le QR code du Compte B

**Option B** : Importer l'image
- Cliquez sur "Importer une image"
- Sélectionnez la capture d'écran du QR code

### Étape 3: Vérifier les Logs du Transfert

Après avoir scanné le QR code et confirmé l'envoi, vous devriez voir dans la console :

```
=== DÉBUT DU TRANSFERT ===
Données du transfert: {amount: 100, senderCurrency: "CDF", ...}
Utilisateur: [votre-user-id]
Solde actuel: [votre-solde]
Mise à jour du solde expéditeur: [ancien] -> [nouveau]
Mise à jour du solde destinataire: [ancien] -> [nouveau]
Transaction expéditeur créée: [transaction-id]
Transaction destinataire créée: [transaction-id]
Notification expéditeur créée: [notification-id]
Notification destinataire créée: [notification-id]
Transfert terminé avec succès
```

**✅ Si vous voyez ces logs** : Le transfert a fonctionné !

**❌ Si vous ne voyez PAS ces logs** :
- Le transfert n'a pas été déclenché
- Vérifiez que vous avez bien cliqué sur "Envoyer"
- Vérifiez qu'il n'y a pas d'erreur dans la console

### Étape 4: Vérifier les Notifications (Compte A)

Après le transfert, vous devriez voir dans la console :

```
useNotifications: Snapshot reçu, nombre de docs: 1
useNotifications: Toutes les notifications: [{type: "transfer_sent", ...}]
useNotifications: Notifications non lues: 1
Notifications chargées: 1 [...]
```

**✅ Si vous voyez ces logs** : La notification de l'expéditeur a été créée !

### Étape 5: Vérifier le Destinataire (Compte B)

1. **Déconnectez-vous du Compte A**
2. **Connectez-vous avec le Compte B** (destinataire)
3. Ouvrez la console (`F12`)
4. Allez sur `/dashboard`

Vous devriez voir dans la console :

```
useNotifications: Chargement des notifications pour: [compte-b-user-id]
useNotifications: Snapshot reçu, nombre de docs: 1
useNotifications: Toutes les notifications: [{type: "transfer_received", ...}]
useNotifications: Notifications non lues: 1
Notifications chargées: 1 [...]
Notifications non acquittées: 1
Affichage de la notification: {type: "transfer_received", amount: 100, ...}
```

**✅ Si vous voyez ces logs** : La notification du destinataire a été créée !

**✅ Un modal devrait s'afficher** avec :
- Titre: "Argent reçu"
- Montant: 100 CDF
- De: [Nom du Compte A]
- Bouton: "OK, Confirmé"

### Étape 6: Vérifier le Solde et les Transactions

**Compte A (Expéditeur)** :
- Solde diminué de 100 CDF
- Transaction dans `/dashboard/history` : "Envoi à [Compte B]"

**Compte B (Destinataire)** :
- Solde augmenté de 100 CDF
- Transaction dans `/dashboard/history` : "Reçu de [Compte A]"

## Test 3: Vérification dans Firestore

1. Allez sur **Firebase Console**
2. Ouvrez **Firestore Database**
3. Naviguez vers `users/[compte-b-id]/notifications`
4. Vous devriez voir une notification avec :
   - `type: "transfer_received"`
   - `amount: 100`
   - `currency: "CDF"`
   - `senderName: "[Nom du Compte A]"`
   - `read: false`
   - `acknowledged: false`

## Problèmes Possibles et Solutions

### Problème 1: "Notifications non acquittées: 0" après le transfert

**Cause** : Les notifications ne sont pas créées dans Firestore

**Solution** :
1. Vérifiez les logs de la console pour voir si "Notification destinataire créée" s'affiche
2. Vérifiez dans Firestore si la notification existe
3. Vérifiez les règles Firestore (elles sont permissives, donc OK)

### Problème 2: Le modal ne s'affiche pas

**Cause** : Le `TransferNotificationModal` n'est pas monté ou les notifications ne sont pas chargées

**Solution** :
1. Vérifiez que `TransferNotificationModal` est dans `src/app/dashboard/layout.tsx`
2. Vérifiez les logs "useNotifications: Snapshot reçu"
3. Vérifiez que `acknowledged: false` dans Firestore

### Problème 3: Erreur "Destinataire non trouvé"

**Cause** : Le QR code n'est pas valide ou l'accountNumber n'existe pas

**Solution** :
1. Vérifiez que le Compte B a bien un `accountNumber` dans Firestore
2. Vérifiez que le QR code contient le bon format : `ENK000000002326|Nom|email`
3. Essayez de scanner à nouveau

### Problème 4: Erreur "Solde insuffisant"

**Cause** : Le Compte A n'a pas assez de fonds

**Solution** :
1. Allez sur `/dashboard/add-funds`
2. Ajoutez des fonds au Compte A
3. Réessayez le transfert

## Logs de Débogage Complets

Voici tous les logs que vous devriez voir dans l'ordre :

### Au Chargement du Dashboard

```
useNotifications: Chargement des notifications pour: abc123...
useNotifications: Écoute des notifications sur: users/abc123.../notifications
useNotifications: Snapshot reçu, nombre de docs: 0
useNotifications: Toutes les notifications: []
useNotifications: Notifications non lues: 0
Notifications chargées: 0 []
Notifications non acquittées: 0
```

### Pendant le Transfert

```
=== DÉBUT DU TRANSFERT ===
Données du transfert: {amount: 100, senderCurrency: "CDF", transferMethod: "account", recipientIdentifier: "ENK000000002326"}
Utilisateur: abc123...
Solde actuel: 5000
Mise à jour du solde expéditeur: 5000 -> 4900
Mise à jour du solde destinataire: 2000 -> 2100
Transaction expéditeur créée: xyz789...
Transaction destinataire créée: def456...
Notification expéditeur créée: ghi012...
Notification destinataire créée: jkl345...
Transfert terminé avec succès
```

### Après le Transfert (Compte A)

```
useNotifications: Snapshot reçu, nombre de docs: 1
useNotifications: Toutes les notifications: [{id: "ghi012...", type: "transfer_sent", ...}]
useNotifications: Notifications non lues: 1
Notifications chargées: 1 [...]
```

### Après le Transfert (Compte B)

```
useNotifications: Snapshot reçu, nombre de docs: 1
useNotifications: Toutes les notifications: [{id: "jkl345...", type: "transfer_received", ...}]
useNotifications: Notifications non lues: 1
Notifications chargées: 1 [...]
Notifications non acquittées: 1
Affichage de la notification: {id: "jkl345...", type: "transfer_received", amount: 100, ...}
```

## Conclusion

Si vous suivez ce guide et que vous voyez tous les logs attendus, le système fonctionne correctement. Si vous ne voyez pas certains logs, notez lesquels manquent et je pourrai vous aider à identifier le problème exact.

**N'oubliez pas** : "Notifications non acquittées: 0" est NORMAL si vous n'avez pas encore effectué de transfert !
