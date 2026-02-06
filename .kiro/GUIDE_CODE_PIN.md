# Guide d'Utilisation du Code PIN eNkamba

## 🔐 Qu'est-ce que le Code PIN ?

Le code PIN (Personal Identification Number) est un code de sécurité à 4 chiffres qui protège vos paiements sur eNkamba. Vous devez entrer ce code avant de confirmer chaque transaction.

## 📱 Première Utilisation

### Création de votre Code PIN

Lors de votre premier paiement, vous serez invité à créer un code PIN :

1. **Choisissez 4 chiffres** faciles à retenir mais difficiles à deviner
2. **Évitez** : 0000, 1234, votre date de naissance
3. **Entrez votre code** dans le premier champ
4. **Confirmez** en le saisissant à nouveau
5. **Validez** en cliquant sur "Créer le code PIN"

✅ Votre code PIN est maintenant enregistré de manière sécurisée !

## 💳 Utilisation du Code PIN

### Lors d'un Paiement

Chaque fois que vous effectuez un paiement :

1. **Remplissez** les informations du paiement (destinataire, montant)
2. **Cliquez** sur "Envoyer l'argent" ou "Confirmer"
3. **Vérifiez** le récapitulatif affiché :
   - Nom du destinataire
   - Montant à payer
   - Devise (CDF, USD, EUR)
4. **Entrez** votre code PIN à 4 chiffres
5. **Validez** pour confirmer le paiement

### Sécurité

- 🔒 Vous avez **3 tentatives** pour entrer le bon code
- ⚠️ Après 3 échecs, le paiement est **automatiquement annulé**
- 👁️ Vous pouvez **afficher/masquer** le code pendant la saisie
- 📊 Le nombre de tentatives restantes est affiché

## 🛡️ Conseils de Sécurité

### ✅ À FAIRE

- Choisissez un code unique et personnel
- Mémorisez-le bien
- Ne le partagez avec personne
- Changez-le régulièrement (fonctionnalité à venir)

### ❌ À ÉVITER

- N'utilisez pas 0000, 1111, 1234
- N'utilisez pas votre date de naissance
- Ne notez pas votre code sur papier
- Ne le partagez jamais par email ou SMS
- N'utilisez pas le même code que votre carte bancaire

## 🔄 Réinitialisation du Code PIN

**Fonctionnalité à venir** : Si vous oubliez votre code PIN, vous pourrez le réinitialiser via :
- Vérification par email
- Questions de sécurité
- Support client eNkamba

## 📍 Où le Code PIN est Demandé ?

Le code PIN est requis dans les pages suivantes :

1. **Scanner QR Code** (`/dashboard/scanner`)
   - Après avoir scanné un code QR
   - Avant de confirmer le paiement

2. **Payer/Recevoir** (`/dashboard/pay-receive`)
   - Pour les paiements simples
   - Pour les paiements multiples

3. **Toutes les pages de paiement**
   - Envoi d'argent
   - Paiement de factures
   - Transferts

## 🎯 Exemple d'Utilisation

### Scénario : Payer un Commerçant

1. Vous scannez le QR code du commerçant
2. Le système affiche : "Destinataire : Boutique ABC"
3. Vous entrez le montant : 5000 CDF
4. Vous cliquez sur "Envoyer l'argent"
5. **Le système demande votre code PIN**
6. Vous voyez le récapitulatif :
   ```
   Destinataire : Boutique ABC
   Montant : 5000 CDF
   ```
7. Vous entrez votre code PIN : ••••
8. Le paiement est confirmé ✅

## ❓ Questions Fréquentes

### Que se passe-t-il si j'entre un mauvais code ?

Vous avez 3 tentatives. Après chaque erreur, le système vous indique le nombre de tentatives restantes. Après 3 échecs, le paiement est annulé pour votre sécurité.

### Puis-je changer mon code PIN ?

Cette fonctionnalité sera bientôt disponible dans les paramètres de sécurité de votre compte.

### Mon code PIN est-il sécurisé ?

Oui ! Votre code PIN est :
- Stocké de manière cryptée
- Jamais affiché en clair
- Protégé par les règles de sécurité Firestore
- Accessible uniquement par vous

### Que faire si j'oublie mon code PIN ?

Contactez le support eNkamba. Une fonctionnalité de réinitialisation sera bientôt disponible.

### Le code PIN est-il obligatoire ?

Oui, pour votre sécurité, tous les paiements nécessitent un code PIN.

## 📞 Support

Si vous rencontrez des problèmes avec votre code PIN :

- **Email** : support@enkamba.io
- **Téléphone** : +243 XXX XXX XXX
- **Chat** : Disponible dans l'application

## 🔄 Mises à Jour Prévues

- ✅ Création et vérification du code PIN
- 🔄 Réinitialisation du code PIN
- 🔄 Changement du code PIN dans les paramètres
- 🔄 Authentification biométrique (empreinte digitale)
- 🔄 Code PIN à 6 chiffres (option)
- 🔄 Historique des tentatives de connexion

---

**Version** : 1.0.0  
**Date** : 6 février 2026  
**Langue** : Français
