# Fix: Transfert d'Argent par Message - Résolution d'Identifiant

## Problème Identifié

L'app n'arrivait pas à accéder au portefeuille de l'utilisateur lors d'un transfert d'argent par message car:

1. **Pas de résolution d'identifiant**: L'API attendait un `recipientId` (UID Firebase) mais ne pouvait pas résoudre les identifiants alternatifs (téléphone, email, numéro eNkamba)
2. **Erreur "Portefeuille utilisateur non trouvé"**: Quand on envoyait par numéro de téléphone ou email, le système ne trouvait pas l'utilisateur
3. **Incohérence avec le système de transfert normal**: Le système de transfert dans le portefeuille utilise `user-resolver.ts` pour trouver les utilisateurs, mais le chat ne l'utilisait pas

## Solution Implémentée

### 1. API `/api/chat/transfer-money` - Résolution d'Identifiant

**Avant:**
```typescript
// Attendait directement recipientId
if (!recipientId || !senderId) {
  return NextResponse.json({ message: 'Données utilisateur manquantes' }, { status: 400 });
}
```

**Après:**
```typescript
// Accepte recipientId OU recipientIdentifier
let finalRecipientId = recipientId;
let finalRecipientName = recipientName;

if (recipientIdentifier && !recipientId) {
  const resolvedUser = await resolveUserByIdentifier(recipientIdentifier);
  
  if (!resolvedUser) {
    return NextResponse.json(
      { message: 'Destinataire non trouvé. Vérifiez le numéro de téléphone, email ou numéro eNkamba.' },
      { status: 404 }
    );
  }

  finalRecipientId = resolvedUser.uid;
  finalRecipientName = resolvedUser.data.displayName || resolvedUser.data.email || recipientIdentifier;
}
```

**Améliorations:**
- ✅ Résout les identifiants: téléphone, email, numéro eNkamba
- ✅ Récupère les informations complètes du destinataire
- ✅ Valide que l'expéditeur et le destinataire sont différents
- ✅ Messages d'erreur clairs

### 2. Hook `useChatMoneyTransfer` - Support des Identifiants

**Avant:**
```typescript
const sendMoney = useCallback(
  async (amount: number, recipientId: string, recipientName: string, conversationId: string) => {
    // Envoyait directement recipientId
    body: JSON.stringify({
      amount,
      recipientId,
      recipientName,
      // ...
    }),
  }
);
```

**Après:**
```typescript
const sendMoney = useCallback(
  async (
    amount: number,
    recipientIdOrIdentifier: string,
    recipientName: string,
    conversationId: string
  ) => {
    // Détecte si c'est un UID ou un identifiant
    const isUid = recipientIdOrIdentifier.length === 28 && /^[a-zA-Z0-9]+$/.test(recipientIdOrIdentifier);
    
    body: JSON.stringify({
      amount,
      ...(isUid ? { recipientId: recipientIdOrIdentifier } : { recipientIdentifier: recipientIdOrIdentifier }),
      recipientName,
      // ...
    }),
  }
);
```

**Améliorations:**
- ✅ Détecte automatiquement le type d'identifiant
- ✅ Envoie le bon paramètre à l'API
- ✅ Compatible avec les deux formats

## Flux de Transfert Complet

### Avant (Cassé)
```
Utilisateur envoie par téléphone
    ↓
API reçoit recipientId = "+243123456789"
    ↓
Cherche wallet avec ID "+243123456789"
    ↓
❌ Portefeuille non trouvé (l'ID n'existe pas)
```

### Après (Fixé)
```
Utilisateur envoie par téléphone "+243123456789"
    ↓
Hook détecte que ce n'est pas un UID
    ↓
Envoie recipientIdentifier = "+243123456789"
    ↓
API utilise resolveUserByIdentifier()
    ↓
Trouve l'utilisateur par téléphone
    ↓
Récupère son UID réel et ses infos
    ↓
Vérifie le portefeuille avec le vrai UID
    ↓
✅ Transfert réussi
```

## Identifiants Supportés

L'API peut maintenant résoudre les utilisateurs par:

1. **Email**: `user@example.com`
2. **Numéro eNkamba**: `ENK000000000001`
3. **Numéro de carte**: `1234 5678 9012 3456` ou `1234567890123456`
4. **Numéro de téléphone**: `+243123456789` ou `0123456789`
5. **UID Firebase**: `abc123def456ghi789jkl012mno345` (28 caractères)

## Ordre de Résolution

L'API essaie de résoudre dans cet ordre:

1. UID Firebase (si 28 caractères alphanumériques)
2. Email (si contient @)
3. Numéro eNkamba (si commence par ENK)
4. Numéro de carte (si 12-19 chiffres)
5. Numéro de téléphone (si commence par + ou contient 9+ chiffres)

## Informations Récupérées

Quand un utilisateur est résolu, l'API récupère:

```typescript
{
  uid: string;              // UID Firebase
  displayName: string;      // Nom d'affichage
  email: string;           // Email
  phoneNumber: string;     // Numéro de téléphone
  accountNumber: string;   // Numéro eNkamba
  cardNumber: string;      // Numéro de carte
  // ... autres données
}
```

## Validation Supplémentaire

L'API ajoute aussi:

- ✅ Vérification que l'expéditeur ≠ destinataire
- ✅ Vérification du solde de l'expéditeur
- ✅ Vérification que le portefeuille du destinataire existe
- ✅ Messages d'erreur clairs et localisés

## Réponse API

**Succès:**
```json
{
  "success": true,
  "transactionId": "tx_123456",
  "messageId": "msg_789012",
  "recipientId": "uid_resolved",
  "recipientName": "Jean Dupont",
  "message": "Transfert créé avec succès"
}
```

**Erreur - Destinataire non trouvé:**
```json
{
  "message": "Destinataire non trouvé. Vérifiez le numéro de téléphone, email ou numéro eNkamba."
}
```

**Erreur - Solde insuffisant:**
```json
{
  "message": "Solde insuffisant"
}
```

## Fichiers Modifiés

1. `src/app/api/chat/transfer-money/route.ts` - Ajout de la résolution d'identifiant
2. `src/hooks/useChatMoneyTransfer.ts` - Support des identifiants alternatifs

## Test

Pour tester le transfert par message:

1. Ouvrir une conversation
2. Envoyer de l'argent avec:
   - Numéro de téléphone: `+243123456789`
   - Email: `user@example.com`
   - Numéro eNkamba: `ENK000000000001`
   - Numéro de carte: `1234 5678 9012 3456`

L'app devrait maintenant:
- ✅ Trouver l'utilisateur
- ✅ Récupérer ses informations
- ✅ Vérifier le solde
- ✅ Créer le transfert
- ✅ Afficher le message de transfert

## Cohérence avec le Système Existant

Ce fix rend le transfert par message **identique** au système de transfert normal du portefeuille:

- Même résolution d'identifiant (`user-resolver.ts`)
- Même validation
- Même gestion des erreurs
- Même flux de transaction
