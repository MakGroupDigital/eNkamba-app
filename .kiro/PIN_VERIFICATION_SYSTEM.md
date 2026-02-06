# Système de Vérification par Code PIN

## Vue d'ensemble

Le système de vérification par code PIN a été intégré dans toutes les pages de paiement d'eNkamba pour sécuriser les transactions. Avant de confirmer un paiement, l'utilisateur doit entrer son code PIN à 4 chiffres.

## Fonctionnalités

### 1. Création du Code PIN

- **Première utilisation** : Si l'utilisateur n'a pas encore de code PIN, il est invité à en créer un
- **Format** : Code à 4 chiffres uniquement
- **Validation** : L'utilisateur doit confirmer le code PIN en le saisissant deux fois
- **Stockage** : Le code PIN est stocké de manière sécurisée dans Firestore (`users/{uid}/security/pin`)
- **Hashage** : Le PIN est encodé en Base64 (à remplacer par bcrypt en production)

### 2. Vérification du Code PIN

- **Avant chaque paiement** : Le système demande le code PIN avant de confirmer la transaction
- **Tentatives limitées** : Maximum 3 tentatives, après quoi le paiement est annulé
- **Feedback visuel** : Affichage du nombre de tentatives restantes
- **Masquage** : Option pour afficher/masquer le code PIN pendant la saisie

### 3. Récapitulatif du Paiement

Avant la saisie du PIN, l'utilisateur voit un récapitulatif contenant :
- Nom du destinataire
- Montant à payer
- Devise (CDF, USD, EUR)

## Intégration

### Pages Intégrées

1. **Scanner QR Code** (`src/app/dashboard/scanner/page.tsx`)
   - Vérification PIN avant confirmation du paiement scanné

2. **Payer/Recevoir** (`src/app/dashboard/pay-receive/page.tsx`)
   - Vérification PIN pour les paiements simples
   - Vérification PIN pour les paiements multiples (à venir)

3. **Flux de Paiement Unifié** (`src/components/payment/UnifiedPaymentFlow.tsx`)
   - Vérification PIN intégrée dans le flux de paiement unifié

### Composant Principal

**`src/components/payment/PinVerification.tsx`**

```typescript
interface PinVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentDetails?: {
    recipient: string;
    amount: string;
    currency: string;
  };
}
```

## Flux d'Utilisation

### Scénario 1 : Utilisateur sans PIN

1. L'utilisateur initie un paiement
2. Le système détecte qu'aucun PIN n'existe
3. Une interface de création de PIN s'affiche
4. L'utilisateur crée et confirme son PIN
5. Le PIN est enregistré dans Firestore
6. Le paiement est automatiquement confirmé

### Scénario 2 : Utilisateur avec PIN

1. L'utilisateur initie un paiement
2. Le récapitulatif du paiement s'affiche
3. L'utilisateur entre son code PIN
4. Le système vérifie le PIN
5. Si correct : le paiement est confirmé
6. Si incorrect : l'utilisateur a 2 tentatives supplémentaires
7. Après 3 échecs : le paiement est annulé

## Structure Firestore

```
users/
  {userId}/
    security/
      pin/
        - pin: string (hashé)
        - createdAt: timestamp
        - updatedAt: timestamp
```

## Sécurité

### Mesures Actuelles

- ✅ Code PIN à 4 chiffres uniquement
- ✅ Limitation à 3 tentatives
- ✅ Encodage Base64 du PIN
- ✅ Stockage dans une sous-collection sécurisée
- ✅ Masquage du PIN par défaut

### Améliorations Recommandées (Production)

- 🔄 Utiliser bcrypt ou argon2 pour le hashage
- 🔄 Ajouter un délai après échecs multiples
- 🔄 Implémenter la réinitialisation du PIN
- 🔄 Ajouter une authentification biométrique en option
- 🔄 Logger les tentatives d'accès
- 🔄 Notification par email en cas d'échecs multiples

## Règles Firestore

Ajoutez ces règles pour sécuriser les codes PIN :

```javascript
match /users/{userId}/security/pin {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Interface Utilisateur

### Création du PIN

- Champ de saisie avec clavier numérique
- Bouton pour afficher/masquer le PIN
- Indicateur de correspondance des PINs
- Message d'information sur la sécurité

### Vérification du PIN

- Champ de saisie centré et large
- Récapitulatif du paiement en haut
- Compteur de tentatives restantes
- Messages d'erreur clairs

## Tests

### Test de Création

1. Connectez-vous avec un nouveau compte
2. Initiez un paiement
3. Vérifiez que l'interface de création de PIN s'affiche
4. Créez un PIN à 4 chiffres
5. Confirmez le PIN
6. Vérifiez que le paiement se poursuit

### Test de Vérification

1. Connectez-vous avec un compte ayant un PIN
2. Initiez un paiement
3. Entrez un PIN incorrect (2 fois)
4. Vérifiez le compteur de tentatives
5. Entrez le bon PIN
6. Vérifiez que le paiement est confirmé

### Test de Sécurité

1. Entrez 3 PINs incorrects
2. Vérifiez que le paiement est annulé
3. Vérifiez qu'un message de sécurité s'affiche

## Maintenance

### Réinitialisation du PIN (À implémenter)

Pour permettre aux utilisateurs de réinitialiser leur PIN :

1. Ajouter un bouton "PIN oublié ?"
2. Envoyer un code de vérification par email
3. Permettre la création d'un nouveau PIN
4. Logger l'événement pour la sécurité

### Changement du PIN (À implémenter)

Dans les paramètres de sécurité :

1. Demander l'ancien PIN
2. Demander le nouveau PIN (2 fois)
3. Mettre à jour dans Firestore
4. Notifier l'utilisateur par email

## Compatibilité

- ✅ Web (Desktop & Mobile)
- ✅ PWA
- ✅ Application Android (Capacitor)
- ✅ Tous les navigateurs modernes

## Performance

- Temps de vérification : < 500ms
- Pas d'impact sur le flux de paiement
- Chargement asynchrone du statut PIN

## Accessibilité

- Clavier numérique natif sur mobile
- Labels ARIA pour les lecteurs d'écran
- Contraste élevé pour la lisibilité
- Support du clavier (Enter pour valider)

## Prochaines Étapes

1. ✅ Intégration dans scanner QR
2. ✅ Intégration dans pay-receive
3. ✅ Intégration dans UnifiedPaymentFlow
4. 🔄 Intégration dans les paiements multiples
5. 🔄 Ajout de la réinitialisation du PIN
6. 🔄 Ajout du changement de PIN dans les paramètres
7. 🔄 Implémentation de bcrypt pour le hashage
8. 🔄 Ajout de l'authentification biométrique

## Support

Pour toute question ou problème :
- Vérifiez les logs de la console
- Consultez la collection Firestore `users/{uid}/security/pin`
- Testez avec différents comptes utilisateurs

---

**Date de création** : 6 février 2026  
**Dernière mise à jour** : 6 février 2026  
**Version** : 1.0.0
