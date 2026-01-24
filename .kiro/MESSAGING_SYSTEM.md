# Système de Messagerie eNkamba

## Vue d'ensemble

Le système de messagerie comprend deux types de conversations:
1. **Conversations entre utilisateurs** - Sauvegardées indéfiniment
2. **Chats IA** - Supprimés automatiquement après 6 mois

## Architecture Firestore

### Collections

#### `conversations`
Conversations entre utilisateurs.

```typescript
{
  id: string;
  participants: string[];           // UIDs des participants
  participantNames: string[];       // Noms des participants
  lastMessage: string;              // Dernier message
  lastMessageTime: Timestamp;       // Heure du dernier message
  createdAt: Timestamp;             // Date de création
}
```

**Sous-collection: `messages`**
```typescript
{
  id: string;
  senderId: string;                 // UID de l'expéditeur
  senderName: string;               // Nom de l'expéditeur
  text: string;                     // Contenu du message
  timestamp: Timestamp;             // Heure d'envoi
  isRead: boolean;                  // Message lu?
}
```

#### `aiChats`
Conversations avec l'assistant IA.

```typescript
{
  id: string;
  userId: string;                   // UID du propriétaire
  title: string;                    // Titre du chat
  createdAt: Timestamp;             // Date de création
  expiresAt: Timestamp;             // Date d'expiration (6 mois)
  lastMessageTime: Timestamp;       // Heure du dernier message
}
```

**Sous-collection: `messages`**
```typescript
{
  id: string;
  role: 'user' | 'assistant';       // Rôle du message
  text: string;                     // Contenu du message
  timestamp: Timestamp;             // Heure d'envoi
}
```

## Hooks

### `useFirestoreConversations()`

Gère les conversations entre utilisateurs.

```typescript
const {
  conversations,              // Liste des conversations
  isLoading,                  // État de chargement
  error,                      // Erreur éventuelle
  createConversation,         // Créer une conversation
  sendMessage,                // Envoyer un message
  loadMessages,               // Charger les messages
} = useFirestoreConversations();
```

**Exemple d'utilisation:**
```typescript
// Créer une conversation
const conversationId = await createConversation(
  otherUserId,
  otherUserName,
  currentUserName
);

// Envoyer un message
await sendMessage(conversationId, 'Bonjour!');

// Charger les messages
const unsubscribe = loadMessages(conversationId, (messages) => {
  console.log(messages);
});
```

### `useFirestoreAiChat()`

Gère les chats IA avec suppression automatique après 6 mois.

```typescript
const {
  aiChats,                    // Liste des chats IA
  isLoading,                  // État de chargement
  error,                      // Erreur éventuelle
  createAiChat,               // Créer un chat IA
  sendAiMessage,              // Envoyer un message IA
  loadAiMessages,             // Charger les messages
  deleteAiChat,               // Supprimer un chat
  cleanupExpiredChats,        // Nettoyer les chats expirés
} = useFirestoreAiChat();
```

**Exemple d'utilisation:**
```typescript
// Créer un chat IA
const aiChatId = await createAiChat('Mon premier chat');

// Envoyer un message et obtenir la réponse
const userMessage = 'Comment fonctionne Mbongo?';
const aiResponse = await enkambaChat({ message: userMessage });
await sendAiMessage(aiChatId, userMessage, aiResponse.response);

// Charger les messages
const unsubscribe = loadAiMessages(aiChatId, (messages) => {
  console.log(messages);
});

// Nettoyer les chats expirés (à appeler périodiquement)
await cleanupExpiredChats();
```

## Pages

### `/dashboard/miyiki-chat`
Liste des conversations avec les contacts.

**Fonctionnalités:**
- Affiche les conversations existantes
- Permet de créer une nouvelle conversation
- Affiche "Commencer la discussion" si aucune conversation
- Accès aux contacts pour inviter

### `/dashboard/miyiki-chat/[id]`
Page de conversation entre deux utilisateurs.

**Fonctionnalités:**
- Affiche les messages en temps réel
- Permet d'envoyer des messages
- Scroll automatique vers le dernier message
- Affiche l'heure de chaque message

### `/dashboard/ai`
Liste des chats IA.

**Fonctionnalités:**
- Affiche les chats IA existants
- Permet de créer un nouveau chat
- Permet de supprimer un chat
- Affiche "Commencer une conversation" si aucun chat

### `/dashboard/ai/chat/[id]`
Page de conversation avec l'IA.

**Fonctionnalités:**
- Affiche les messages en temps réel
- Permet de poser des questions
- Obtient les réponses de l'IA automatiquement
- Scroll automatique vers le dernier message

## Flux de Messagerie

### Conversation entre utilisateurs

```
Utilisateur A clique sur un contact
    ↓
Crée une conversation (si n'existe pas)
    ↓
Redirige vers /dashboard/miyiki-chat/[id]
    ↓
Affiche les messages existants
    ↓
Utilisateur A écrit un message
    ↓
Message sauvegardé dans Firestore
    ↓
Utilisateur B reçoit le message en temps réel
    ↓
Conversation mise à jour avec le dernier message
```

### Chat IA

```
Utilisateur clique "Nouveau chat"
    ↓
Crée un chat IA
    ↓
Redirige vers /dashboard/ai/chat/[id]
    ↓
Utilisateur pose une question
    ↓
Appelle enkambaChat() pour obtenir la réponse
    ↓
Sauvegarde le message utilisateur et la réponse
    ↓
Affiche les messages en temps réel
    ↓
Chat expire après 6 mois
```

## Règles Firestore (Développement)

**Actuellement permissives pour le développement:**

```
match /{document=**} {
  allow read, write: if true;
}
```

**À sécuriser en production:**

```
match /conversations/{conversationId} {
  allow read, write: if request.auth.uid in resource.data.participants;
}

match /aiChats/{aiChatId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

## Règles Storage (Développement)

**Actuellement permissives pour le développement:**

```
match /{allPaths=**} {
  allow read, write: if true;
}
```

**À sécuriser en production:**

```
match /chat-media/{userId}/{allPaths=**} {
  allow read, write: if request.auth.uid == userId;
}

match /ai-chat-media/{userId}/{allPaths=**} {
  allow read, write: if request.auth.uid == userId;
}
```

## Déploiement des Règles

Pour déployer les règles Firestore et Storage:

```bash
firebase deploy --only firestore:rules,storage --project studio-1153706651-6032b
```

## Nettoyage des Chats IA Expirés

Les chats IA sont supprimés automatiquement après 6 mois. Pour forcer le nettoyage:

```typescript
const { cleanupExpiredChats } = useFirestoreAiChat();
await cleanupExpiredChats();
```

Vous pouvez appeler cette fonction:
- Au démarrage de l'app
- Périodiquement (ex: une fois par jour)
- Manuellement depuis les paramètres

## Limitations Actuelles

1. **Pas de chiffrement** - Les messages ne sont pas chiffrés
2. **Pas de notifications** - Pas de notifications push
3. **Pas de typing indicator** - Pas d'indicateur "en train d'écrire"
4. **Pas de réactions** - Pas de réactions aux messages
5. **Pas de suppression** - Pas de suppression de messages

## Améliorations Futures

- [ ] Chiffrement end-to-end
- [ ] Notifications push
- [ ] Indicateur "en train d'écrire"
- [ ] Réactions aux messages
- [ ] Suppression de messages
- [ ] Édition de messages
- [ ] Partage de fichiers
- [ ] Appels vidéo/audio
- [ ] Groupes de conversation
- [ ] Archivage de conversations
