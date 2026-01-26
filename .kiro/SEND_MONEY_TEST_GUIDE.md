# 🧪 Guide de Test - Envoi d'Argent

## ✅ Statut du Déploiement

**Cloud Functions:** ✅ Déployées en production
**Frontend:** ✅ Prêt à tester
**Erreur 500:** ✅ CORRIGÉE

## 🎯 Cas de Test

### Test 1: Envoi par Email (Avec Conversion)
1. Aller à `/dashboard/send`
2. Sélectionner "Par Email"
3. Entrer l'email d'un autre utilisateur
4. Cliquer "Chercher"
5. Sélectionner une devise (ex: USD)
6. Entrer un montant (ex: 100)
7. Cliquer "Continuer"
8. Vérifier que le montant converti s'affiche
9. Cliquer "Confirmer"
10. ✅ Vérifier le message de succès

**Résultat attendu:**
- Message: "100 USD envoyés à [Nom] (160 000 CDF reçus)"
- Solde mis à jour
- Transaction créée dans Firestore

### Test 2: Envoi par Téléphone
1. Aller à `/dashboard/send`
2. Sélectionner "Par Téléphone"
3. Entrer le numéro d'un autre utilisateur
4. Cliquer "Chercher"
5. Sélectionner une devise (ex: EUR)
6. Entrer un montant (ex: 50)
7. Cliquer "Continuer"
8. Cliquer "Confirmer"
9. ✅ Vérifier le message de succès

**Résultat attendu:**
- Message: "50 EUR envoyés à [Nom] (X CDF reçus)"
- Solde mis à jour

### Test 3: Envoi par Bluetooth
1. Aller à `/dashboard/send`
2. Sélectionner "Par Bluetooth"
3. Voir les instructions Bluetooth
4. Entrer un montant (ex: 1000)
5. Entrer une description (optionnel)
6. Cliquer "Continuer"
7. Cliquer "Confirmer"
8. ✅ Vérifier le message de succès

**Résultat attendu:**
- Message: "1000 CDF envoyés"
- Solde mis à jour
- Transaction créée sans recipientName

### Test 4: Envoi par WiFi
1. Aller à `/dashboard/send`
2. Sélectionner "Par WiFi"
3. Voir les instructions WiFi
4. Entrer un montant (ex: 500)
5. Entrer une description (optionnel)
6. Cliquer "Continuer"
7. Cliquer "Confirmer"
8. ✅ Vérifier le message de succès

**Résultat attendu:**
- Message: "500 CDF envoyés"
- Solde mis à jour
- Transaction créée sans recipientName

### Test 5: Prévention Auto-Transfert
1. Aller à `/dashboard/send`
2. Sélectionner "Par Email"
3. Entrer votre propre email
4. Cliquer "Chercher"
5. ✅ Vérifier le message d'erreur: "Vous ne pouvez pas envoyer de l'argent à vous-même"

**Résultat attendu:**
- Message d'erreur affiché
- Pas de transfert effectué

### Test 6: Solde Insuffisant
1. Aller à `/dashboard/send`
2. Sélectionner "Par Email"
3. Chercher un utilisateur
4. Entrer un montant supérieur au solde
5. Cliquer "Continuer"
6. ✅ Vérifier le message d'erreur: "Solde insuffisant"

**Résultat attendu:**
- Message d'erreur affiché
- Pas de transfert effectué

## 📊 Vérification des Données

### Dans Firestore
1. Aller à Firebase Console
2. Firestore Database
3. Collection `users`
4. Sélectionner un utilisateur
5. Vérifier `walletBalance` mis à jour
6. Vérifier la sous-collection `transactions`
7. ✅ Vérifier que les transactions contiennent:
   - `type`: "transfer_sent" ou "transfer_received"
   - `amount`: Montant correct
   - `amountInCDF`: Montant en CDF
   - `senderCurrency` / `recipientCurrency`: Devises correctes
   - `exchangeRate`: Taux de change utilisé
   - `transferMethod`: Méthode utilisée

### Exemple de Transaction (Envoi)
```json
{
  "id": "tx_123",
  "type": "transfer_sent",
  "amount": 100,
  "amountInCDF": 160000,
  "senderCurrency": "USD",
  "recipientCurrency": "CDF",
  "status": "completed",
  "description": "Envoi à Jean",
  "recipientName": "Jean Dupont",
  "exchangeRate": 1600,
  "transferMethod": "email",
  "timestamp": "2026-01-26T01:41:12.887Z"
}
```

### Exemple de Transaction (Bluetooth - Sans recipientName)
```json
{
  "id": "tx_456",
  "type": "transfer_sent",
  "amount": 1000,
  "amountInCDF": 1000,
  "senderCurrency": "CDF",
  "status": "completed",
  "description": "Envoi d'argent",
  "transferMethod": "bluetooth",
  "timestamp": "2026-01-26T01:41:12.887Z"
}
```

## 🔍 Vérification des Logs

### Commande
```bash
firebase functions:log
```

### Résultat Attendu
```
sendMoney: Function execution took 5256 ms, finished with status code: 200 ✅
```

### Erreurs à Éviter
```
❌ status code: 500
❌ Cannot use "undefined" as a Firestore value
❌ Destinataire non trouvé
```

## 💱 Vérification de la Conversion

### Taux de Change
1. Envoyer 100 USD
2. Vérifier que le destinataire reçoit ~160 000 CDF (selon taux actuel)
3. Vérifier que le taux est enregistré dans la transaction

### Devises Supportées
- ✅ CDF - Franc Congolais
- ✅ USD - Dollar Américain
- ✅ EUR - Euro
- ✅ GBP - Livre Sterling
- ✅ ZAR - Rand Sud-Africain
- ✅ KES - Shilling Kényan
- ✅ UGX - Shilling Ougandais
- ✅ RWF - Franc Rwandais
- ✅ TZS - Shilling Tanzanien
- ✅ XOF - Franc CFA Ouest

## 📱 Vérification du Frontend

### Sélecteur de Devise
- ✅ Affiche 10 devises
- ✅ Permet de changer de devise
- ✅ Affiche le montant dans la devise sélectionnée

### Affichage du Montant
- ✅ Affiche "Montant à envoyer: 100 USD"
- ✅ Affiche "Nouveau solde: X CDF"
- ✅ Message de succès: "100 USD envoyés à [Nom] (160 000 CDF reçus)"

## ✅ Checklist de Validation

- [ ] Test 1: Envoi par Email avec conversion
- [ ] Test 2: Envoi par Téléphone
- [ ] Test 3: Envoi par Bluetooth
- [ ] Test 4: Envoi par WiFi
- [ ] Test 5: Prévention auto-transfert
- [ ] Test 6: Solde insuffisant
- [ ] Vérification Firestore: Transactions créées
- [ ] Vérification Firestore: Soldes mis à jour
- [ ] Vérification Logs: Status code 200
- [ ] Vérification Conversion: Taux corrects
- [ ] Vérification Frontend: Sélecteur de devise
- [ ] Vérification Frontend: Messages de succès

## 🎉 Résumé

Tous les tests doivent passer sans erreur 500. Si vous rencontrez une erreur:

1. Vérifier les logs: `firebase functions:log`
2. Vérifier Firestore pour les données
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier que les Cloud Functions sont déployées: `firebase functions:list`

---

**Status:** ✅ PRÊT POUR TESTER
