# Analyse du flux de création de conversation

## Flux actuel (problématique)

1. **Page miyiki-chat/page.tsx** : Affiche la liste des conversations
   - Utilise `useConversations()` qui charge depuis Firebase
   - Bouton "Commencer" → ouvre `ChatContactsDialog`

2. **ChatContactsDialog** : Dialog pour sélectionner un contact
   - Charge les contacts via `useFirestoreContacts()`
   - Vérifie le statut de chaque contact (enkamba, invite, own)
   - Bouton "Discuter" → navigue vers `/dashboard/miyiki-chat/${contact.id}`
   - **PROBLÈME**: Passe `contact.id` (ID du contact) au lieu de `conversationId`

3. **miyiki-chat/[id]/page.tsx** → **conversation-client.tsx**
   - Reçoit `params.id` (qui est `contact.id`)
   - Appelle `loadMessages(conversationId, ...)` avec `contact.id`
   - **PROBLÈME**: Cherche une conversation avec l'ID du contact, pas l'ID de la conversation

## Structure Firebase

```
conversations/
  ├── conversationId1/
  │   ├── participants: [userId1, userId2]
  │   ├── participantNames: [name1, name2]
  │   ├── lastMessage: "..."
  │   ├── lastMessageTime: timestamp
  │   └── messages/
  │       ├── messageId1: {senderId, text, timestamp, ...}
  │       └── messageId2: {...}
  └── conversationId2/
      └── ...
```

## Solution requise

1. Quand on clique "Discuter" sur un contact :
   - Créer ou récupérer la conversation avec cet utilisateur
   - Obtenir l'ID de la conversation Firebase
   - Naviguer vers `/dashboard/miyiki-chat/${conversationId}`

2. Dans `conversation-client.tsx` :
   - Utiliser `conversationId` pour charger les messages
   - Afficher les infos du contact basé sur les participants

## Implémentation

### Étape 1 : Modifier ChatContactsDialog
- Quand on clique "Discuter", appeler `createConversation(contact.id, contact.name)`
- Récupérer l'ID de la conversation
- Naviguer vers `/dashboard/miyiki-chat/${conversationId}`

### Étape 2 : Vérifier useFirestoreConversations
- `createConversation()` doit retourner l'ID de la conversation créée/existante
- C'est déjà implémenté correctement

### Étape 3 : Mettre à jour conversation-client.tsx
- Charger les infos du contact depuis les participants de la conversation
- Afficher correctement le nom et les infos du contact
