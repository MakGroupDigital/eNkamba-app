# 🔧 Correction - Affichage du nom des groupes

## 🐛 Problème identifié

Les groupes créés affichaient le nom d'un membre au lieu du nom du groupe dans la liste des conversations.

## 🔍 Cause du problème

### 1. Dans `useConversations.ts`
La logique récupérait **toujours** le nom de l'autre participant, même pour les groupes:

```typescript
// ❌ AVANT - Problématique
const otherParticipantName = data.participantNames?.[otherParticipantIdx] || 'Utilisateur';

convos.push({
  name: otherParticipantName, // ← Toujours le nom d'un participant
  isGroup: (data.participants?.length || 0) > 2,
  // ...
});
```

### 2. Dans `miyiki-chat/page.tsx`
La logique essayait de récupérer le nom du contact même pour les groupes, mais la condition `!convo.isGroup` était présente mais le nom était déjà incorrect depuis le hook.

## ✅ Solution appliquée

### 1. Correction dans `useConversations.ts`

Ajout d'une logique conditionnelle pour différencier groupes et conversations 1-1:

```typescript
// ✅ APRÈS - Corrigé
// Déterminer si c'est un groupe
const isGroup = data.isGroup === true || (data.participants?.length || 0) > 2;

// Pour les groupes, utiliser le nom du groupe
// Pour les conversations 1-1, trouver le nom de l'autre participant
let displayName: string;

if (isGroup) {
  // Pour les groupes, utiliser le champ 'name' du document
  displayName = data.name || 'Groupe sans nom';
} else {
  // Pour les conversations 1-1, trouver l'autre participant
  const otherParticipantIdx = data.participants?.findIndex((id: string) => id !== currentUser.uid);
  displayName = otherParticipantIdx !== -1 && otherParticipantIdx !== undefined
    ? data.participantNames?.[otherParticipantIdx] || 'Utilisateur'
    : 'Utilisateur';
}

convos.push({
  name: displayName, // ← Nom correct selon le type
  isGroup: isGroup,
  avatar: data.avatar || undefined, // ← Aussi ajouté l'avatar
  // ...
});
```

### 2. Amélioration dans `miyiki-chat/page.tsx`

Ajout de commentaires explicites pour clarifier la logique:

```typescript
// Pour les conversations 1-1 UNIQUEMENT, on tente de récupérer le nom du contact
let displayName = convo.name;

// Ne faire cette logique QUE si ce n'est PAS un groupe
if (!convo.isGroup && convo.participants && convo.participants.length === 2) {
  // Logique de récupération du nom du contact...
}
// Pour les groupes, on garde simplement convo.name tel quel
```

## 📊 Flux de données corrigé

### Avant (❌ Incorrect)
```
Firestore: { name: "Famille", isGroup: true, participantNames: ["Alice", "Bob"] }
    ↓
useConversations: name = "Alice" (premier participant)
    ↓
Page: Affiche "Alice" au lieu de "Famille"
```

### Après (✅ Correct)
```
Firestore: { name: "Famille", isGroup: true, participantNames: ["Alice", "Bob"] }
    ↓
useConversations: 
  - Détecte isGroup = true
  - Utilise data.name = "Famille"
    ↓
Page: Affiche "Famille" ✓
```

## 🎯 Détection du type de conversation

### Méthode de détection
```typescript
const isGroup = data.isGroup === true || (data.participants?.length || 0) > 2;
```

Cette méthode vérifie:
1. **Champ explicite**: `data.isGroup === true` (défini lors de la création)
2. **Nombre de participants**: Plus de 2 participants = groupe

### Pourquoi les deux conditions?

- **`data.isGroup`**: Méthode principale, définie lors de la création du groupe
- **`participants.length > 2`**: Fallback pour les anciennes conversations ou cas edge

## 🔄 Gestion des noms

### Pour les groupes
```typescript
if (isGroup) {
  displayName = data.name || 'Groupe sans nom';
}
```
- Utilise le champ `name` du document Firestore
- Fallback: "Groupe sans nom" si le champ est vide

### Pour les conversations 1-1
```typescript
else {
  const otherParticipantIdx = data.participants?.findIndex(
    (id: string) => id !== currentUser.uid
  );
  displayName = data.participantNames?.[otherParticipantIdx] || 'Utilisateur';
}
```
- Trouve l'index de l'autre participant
- Récupère son nom depuis `participantNames`
- Fallback: "Utilisateur" si non trouvé

## 📝 Structure Firestore attendue

### Groupe
```javascript
{
  id: "abc123",
  name: "Famille",              // ← Nom du groupe
  isGroup: true,                // ← Indicateur de groupe
  participants: ["uid1", "uid2", "uid3"],
  participantNames: ["Alice", "Bob", "Charlie"],
  lastMessage: "Salut!",
  lastMessageTime: Timestamp,
  avatar: "url...",             // Optionnel
  // ...
}
```

### Conversation 1-1
```javascript
{
  id: "xyz789",
  // Pas de champ 'name' pour les 1-1
  isGroup: false,               // ← Ou absent
  participants: ["uid1", "uid2"],
  participantNames: ["+243812345678", "+243823456789"],
  lastMessage: "Salut!",
  lastMessageTime: Timestamp,
  // ...
}
```

## 🎨 Affichage visuel

### Groupe
```
┌─────────────────────────────────────────────┐
│  👥  Famille                    [Groupe] 14h│
│      Alice: Salut tout le monde!      (2)   │
└─────────────────────────────────────────────┘
```

### Conversation 1-1
```
┌─────────────────────────────────────────────┐
│  👤  Alice Dupont                       14h │
│      Salut, ça va?                    (1)   │
└─────────────────────────────────────────────┘
```

## ✅ Tests effectués

- [x] Création d'un groupe avec nom personnalisé
- [x] Vérification de l'affichage du nom du groupe
- [x] Vérification que les conversations 1-1 fonctionnent toujours
- [x] Test du filtre "Groupes"
- [x] Test de la recherche par nom de groupe

## 🔍 Points de vérification

### Dans la liste des conversations
1. Les groupes affichent leur nom (ex: "Famille")
2. Les conversations 1-1 affichent le nom du contact
3. Le badge "Groupe" est visible sur les groupes
4. L'icône "Users" apparaît sur l'avatar des groupes

### Dans le filtre "Groupes"
1. Seuls les groupes sont affichés
2. Les noms des groupes sont corrects
3. Le compteur de groupes est exact

### Dans la recherche
1. On peut rechercher par nom de groupe
2. Les résultats affichent le bon nom

## 🚀 Améliorations futures

### Avatar de groupe
- [ ] Permettre de définir un avatar personnalisé pour le groupe
- [ ] Générer un avatar par défaut avec les initiales du groupe
- [ ] Afficher les avatars des membres en mosaïque

### Nom du groupe
- [ ] Permettre de modifier le nom du groupe
- [ ] Historique des changements de nom
- [ ] Notifications lors du changement de nom

### Affichage enrichi
- [ ] Afficher le nombre de membres dans la liste
- [ ] Afficher le nom de l'expéditeur du dernier message
- [ ] Indicateur de groupe actif/archivé

## 📊 Impact de la correction

### Avant
- ❌ Confusion: Les groupes affichaient un nom de membre
- ❌ Difficulté à identifier les groupes
- ❌ Expérience utilisateur dégradée

### Après
- ✅ Clarté: Chaque groupe affiche son nom correct
- ✅ Identification facile avec badge et icône
- ✅ Expérience utilisateur améliorée

## 🐛 Problèmes potentiels résolus

### Problème 1: Groupe sans nom
**Solution**: Fallback "Groupe sans nom"

### Problème 2: Anciennes conversations
**Solution**: Double vérification (isGroup + participants.length)

### Problème 3: Participants manquants
**Solution**: Fallback "Utilisateur" pour les 1-1

## 📝 Notes importantes

1. **Champ `name` obligatoire**: Lors de la création d'un groupe, toujours définir le champ `name`
2. **Champ `isGroup` obligatoire**: Toujours définir `isGroup: true` pour les groupes
3. **Avatar optionnel**: Le champ `avatar` est maintenant récupéré depuis Firestore
4. **Rétrocompatibilité**: La logique fonctionne avec les anciennes conversations

## ✅ Statut

- ✅ Problème identifié
- ✅ Solution implémentée
- ✅ Tests effectués
- ✅ Documentation créée
- ✅ Prêt pour la production

---

**Date de correction**: 6 février 2026
**Fichiers modifiés**:
- `src/hooks/useConversations.ts`
- `src/app/dashboard/miyiki-chat/page.tsx`

**Auteur**: Kiro AI Assistant
**Version**: 1.0
