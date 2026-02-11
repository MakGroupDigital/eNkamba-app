# Modification et Suppression de Messages - COMPLET ✅

## Date
6 février 2026

## Objectif
Ajouter la possibilité de modifier et supprimer ses propres messages dans les conversations (individuelles et groupes).

## Fonctionnalités Implémentées

### 1. Suppression de Messages

**Comportement:**
- Seul l'auteur du message peut le supprimer
- Le message n'est pas supprimé de la base de données, mais marqué comme supprimé
- Le texte devient "Message supprimé" avec une apparence grisée et italique
- Les réponses au message supprimé restent visibles
- Confirmation requise avant suppression

**Sécurité:**
- Vérification que l'utilisateur est l'auteur du message
- Message d'erreur si tentative de suppression d'un message d'autrui

### 2. Modification de Messages

**Comportement:**
- Seul l'auteur peut modifier son message
- Uniquement les messages texte peuvent être modifiés (pas audio/vidéo)
- Le message modifié affiche "(modifié)" à côté de l'heure
- L'input se remplit avec le texte actuel pour faciliter la modification
- Possibilité d'annuler la modification

**Sécurité:**
- Vérification que l'utilisateur est l'auteur du message
- Message d'erreur si tentative de modification d'un message d'autrui

## Interface Utilisateur

### Menu Contextuel
- Bouton avec icône `MoreVertical` (⋮) visible au survol du message
- Apparaît uniquement sur les messages de l'utilisateur
- Menu dropdown avec 2 options:
  - **Modifier** (icône Edit2) - Uniquement pour messages texte
  - **Supprimer** (icône Trash2) - En rouge

### Mode Édition
- Bandeau orange au-dessus de l'input
- Affiche "Modification du message" avec aperçu du texte
- Bouton X pour annuler
- Le bouton Envoyer devient "Modifier"

### Indicateurs Visuels
- Messages supprimés: opacité 60%, texte italique
- Messages modifiés: "(modifié)" affiché après l'heure
- Menu visible au survol (opacity-0 → opacity-100)

## Implémentation Technique

### Hook `useFirestoreConversations.ts`

#### Fonction `deleteMessage`
```typescript
const deleteMessage = useCallback(
  async (conversationId: string, messageId: string) => {
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      throw new Error('Message introuvable');
    }

    const messageData = messageSnap.data();
    
    // Vérifier que l'utilisateur est l'auteur
    if (messageData.senderId !== currentUser.uid) {
      throw new Error('Vous ne pouvez supprimer que vos propres messages');
    }

    // Marquer comme supprimé
    await updateDoc(messageRef, {
      text: 'Message supprimé',
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  },
  [currentUser]
);
```

#### Fonction `updateMessage`
```typescript
const updateMessage = useCallback(
  async (conversationId: string, messageId: string, newText: string) => {
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      throw new Error('Message introuvable');
    }

    const messageData = messageSnap.data();
    
    // Vérifier que l'utilisateur est l'auteur
    if (messageData.senderId !== currentUser.uid) {
      throw new Error('Vous ne pouvez modifier que vos propres messages');
    }

    // Mettre à jour
    await updateDoc(messageRef, {
      text: newText,
      isEdited: true,
      editedAt: serverTimestamp(),
    });
  },
  [currentUser]
);
```

### Composant `conversation-client.tsx`

#### Nouveaux États
```typescript
const [editingMessage, setEditingMessage] = useState<any>(null);
const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
```

#### Fonctions de Gestion
```typescript
// Supprimer un message
const handleDeleteMessage = async (messageId: string) => {
  if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
  
  try {
    await deleteMessage(conversationId, messageId);
    setShowMessageMenu(null);
  } catch (error) {
    console.error('Erreur suppression message:', error);
    alert('Impossible de supprimer le message');
  }
};

// Commencer l'édition
const handleEditMessage = (message: any) => {
  setEditingMessage(message);
  setInputValue(message.text);
  setShowMessageMenu(null);
};

// Annuler l'édition
const cancelEdit = () => {
  setEditingMessage(null);
  setInputValue('');
};
```

#### Modification de `handleSendMessage`
```typescript
const handleSendMessage = async () => {
  if (!inputValue.trim()) return;

  const messageText = inputValue;
  setInputValue('');
  setIsSending(true);

  try {
    // Si on est en mode édition
    if (editingMessage) {
      await updateMessage(conversationId, editingMessage.id, messageText);
      setEditingMessage(null);
    } else {
      // Envoi normal ou réponse
      const metadata = replyingTo ? {
        replyTo: replyingTo.id,
        repliedMessage: { /* ... */ }
      } : undefined;
      
      await sendMessage(conversationId, messageText, 'text', metadata);
      setReplyingTo(null);
    }
  } catch (error) {
    console.error('Erreur envoi message:', error);
    setInputValue(messageText);
  } finally {
    setIsSending(false);
  }
};
```

## Structure des Données Firestore

### Message Normal
```json
{
  "senderId": "user123",
  "senderName": "Jean Dupont",
  "text": "Bonjour!",
  "messageType": "text",
  "timestamp": "...",
  "isRead": false
}
```

### Message Modifié
```json
{
  "senderId": "user123",
  "senderName": "Jean Dupont",
  "text": "Bonjour tout le monde!",
  "messageType": "text",
  "timestamp": "...",
  "isRead": false,
  "isEdited": true,
  "editedAt": "..."
}
```

### Message Supprimé
```json
{
  "senderId": "user123",
  "senderName": "Jean Dupont",
  "text": "Message supprimé",
  "messageType": "text",
  "timestamp": "...",
  "isRead": false,
  "isDeleted": true,
  "deletedAt": "..."
}
```

## Règles de Sécurité Firestore Recommandées

```javascript
match /conversations/{conversationId}/messages/{messageId} {
  // Lecture: tous les participants
  allow read: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
  
  // Création: tous les participants
  allow create: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants &&
    request.resource.data.senderId == request.auth.uid;
  
  // Modification: uniquement l'auteur
  allow update: if request.auth != null && 
    resource.data.senderId == request.auth.uid;
  
  // Suppression: désactivée (on utilise soft delete)
  allow delete: if false;
}
```

## Expérience Utilisateur

### Workflow de Suppression
1. Utilisateur survole son message
2. Bouton menu (⋮) apparaît
3. Clic sur le bouton → menu s'ouvre
4. Clic sur "Supprimer"
5. Confirmation demandée
6. Message marqué comme supprimé
7. Affichage change instantanément

### Workflow de Modification
1. Utilisateur survole son message texte
2. Bouton menu (⋮) apparaît
3. Clic sur le bouton → menu s'ouvre
4. Clic sur "Modifier"
5. Input se remplit avec le texte actuel
6. Bandeau orange apparaît au-dessus
7. Utilisateur modifie le texte
8. Clic sur Envoyer
9. Message mis à jour avec indicateur "(modifié)"

### Limitations
- ❌ Impossible de modifier les messages audio/vidéo
- ❌ Impossible de supprimer les messages des autres
- ❌ Impossible de modifier les messages des autres
- ❌ Pas de suppression définitive (soft delete uniquement)
- ✅ Historique des modifications non conservé (dernière version uniquement)

## Améliorations Futures Possibles

1. **Historique des modifications**
   - Conserver toutes les versions du message
   - Afficher "Voir l'historique" pour les messages modifiés

2. **Suppression pour tous**
   - Option pour supprimer le message pour tous les participants
   - Délai limité (ex: 1 heure après envoi)

3. **Notifications**
   - Notifier les participants quand un message est modifié
   - Afficher une alerte pour les messages supprimés après réponse

4. **Permissions de groupe**
   - Admins peuvent supprimer n'importe quel message
   - Paramètres de groupe pour activer/désactiver la modification

5. **Délai de modification**
   - Limiter la modification aux X premières minutes
   - Afficher un compte à rebours

## Test de la Fonctionnalité

### Test de Suppression
1. Envoyer un message
2. Survoler le message
3. Cliquer sur le menu (⋮)
4. Cliquer sur "Supprimer"
5. Confirmer
6. ✅ Vérifier que le message affiche "Message supprimé"
7. ✅ Vérifier l'opacité et le style italique

### Test de Modification
1. Envoyer un message texte
2. Survoler le message
3. Cliquer sur le menu (⋮)
4. Cliquer sur "Modifier"
5. ✅ Vérifier que l'input se remplit
6. ✅ Vérifier le bandeau orange
7. Modifier le texte
8. Envoyer
9. ✅ Vérifier que le message est mis à jour
10. ✅ Vérifier l'indicateur "(modifié)"

### Test de Sécurité
1. Essayer de modifier un message d'un autre utilisateur
2. ✅ Vérifier que le menu n'apparaît pas
3. Essayer de supprimer un message d'un autre utilisateur
4. ✅ Vérifier que le menu n'apparaît pas

## Fichiers Modifiés

1. **src/hooks/useFirestoreConversations.ts**
   - Ajout de `deleteMessage`
   - Ajout de `updateMessage`
   - Export des nouvelles fonctions

2. **src/app/dashboard/miyiki-chat/[id]/conversation-client.tsx**
   - Import des nouvelles icônes (Trash2, Edit2, MoreVertical)
   - Nouveaux états (editingMessage, showMessageMenu)
   - Nouvelles fonctions (handleDeleteMessage, handleEditMessage, cancelEdit)
   - Modification de handleSendMessage pour gérer l'édition
   - Ajout du menu contextuel dans l'affichage des messages
   - Ajout du bandeau d'édition
   - useEffect pour fermer le menu au clic extérieur

## Compatibilité

- ✅ Conversations individuelles
- ✅ Conversations de groupe
- ✅ Messages texte
- ✅ Messages audio (suppression uniquement)
- ✅ Messages vidéo (suppression uniquement)
- ✅ Messages avec réponses
- ✅ Mode clair et sombre

---

**STATUS**: ✅ IMPLÉMENTATION COMPLÈTE
**PRÊT POUR**: Tests et déploiement
