# eNkamba AI Module - Spécification Technique

**Version**: 1.0  
**Date**: 2026-02-03  
**Statut**: Production Ready  
**Langage**: TypeScript/React  
**Framework**: Next.js 15 (App Router)

---

## 📋 Vue d'ensemble

Le module eNkamba AI est un assistant intelligent intégré à la plateforme eNkamba. Il permet aux utilisateurs de poser des questions et d'obtenir des réponses formatées avec support pour la recherche web, l'analyse approfondie, la réflexion et la génération de code.

### Caractéristiques principales
- Chat conversationnel en temps réel
- Streaming de réponses
- Recherche web intégrée
- Export de réponses (Word, PDF, Excel)
- Historique des conversations
- Sauvegarde dans Firestore
- Interface responsive

---

## 🏗️ Architecture

### Stack Technologique
- **Frontend**: React 18 + TypeScript
- **Backend**: Next.js 15 API Routes
- **Base de données**: Firebase Firestore
- **IA**: Groq API (modèle: gemma2-9b-it)
- **Recherche Web**: DuckDuckGo API
- **Export**: html2pdf, docx, xlsx

### Structure des fichiers

```
src/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── enhanced-chat/
│   │           └── route.ts          # API route Groq
│   └── dashboard/
│       └── ai/
│           ├── page.tsx              # Page d'accueil AI
│           └── chat/
│               ├── page.tsx          # Nouveau chat
│               └── [id]/
│                   ├── page.tsx      # Chat existant
│                   ├── ai-chat-client.tsx
│                   └── ai-chat-enhanced.tsx
├── components/
│   └── ai/
│       ├── FormattedResponse.tsx     # Affichage réponse
│       └── SearchOptions.tsx         # Options recherche
├── hooks/
│   ├── useAiEnhanced.ts             # Hook IA
│   └── useFirestoreAiChat.ts        # Hook Firestore
└── lib/
    └── web-search.ts                # Recherche web
```

---

## 🔌 API Endpoints

### POST /api/ai/enhanced-chat

**Description**: Génère une réponse IA avec options avancées

**Request**:
```typescript
{
  message: string;
  options: {
    searchWeb: boolean;      // Activer recherche web
    analysis: boolean;       // Mode analyse approfondie
    reflection: boolean;     // Mode réflexion
    code: boolean;          // Générer du code
  };
}
```

**Response** (Streaming):
```
Réponse texte en streaming
Chaque chunk est envoyé en temps réel
```

**Modèle IA**: `gemma2-9b-it` (Groq)
**Température**: 0.7
**Max tokens**: 2048

---

## 📊 Modèle de données Firestore

### Collection: `users/{userId}/aiChats`

```typescript
{
  id: string;
  title: string;              // Titre du chat
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
}
```

### Collection: `users/{userId}/aiChats/{chatId}/messages`

```typescript
{
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Timestamp;
  options?: {
    searchWeb: boolean;
    analysis: boolean;
    reflection: boolean;
    code: boolean;
  };
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}
```

---

## 🎯 Composants React

### 1. Page d'accueil AI (`src/app/dashboard/ai/page.tsx`)

**Fonctionnalités**:
- Liste des chats existants
- Bouton pour créer un nouveau chat
- Affichage des chats récents

**Props**: Aucune (utilise hooks)

**Hooks utilisés**:
- `useFirestoreAiChat()` - Gestion des chats

---

### 2. Nouveau Chat (`src/app/dashboard/ai/chat/page.tsx`)

**Fonctionnalités**:
- Interface pour démarrer un nouveau chat
- Suggestions de questions
- Input pour poser une question
- Redirection vers le chat créé

**Flux**:
1. Utilisateur pose une question
2. Création d'un nouveau chat dans Firestore
3. Appel API `/api/ai/enhanced-chat`
4. Sauvegarde du message et réponse
5. Redirection vers `/dashboard/ai/chat/{chatId}`

---

### 3. Chat Existant (`src/app/dashboard/ai/chat/[id]/page.tsx`)

**Composants enfants**:
- `ai-chat-enhanced.tsx` - Chat avec options avancées
- `ai-chat-client.tsx` - Chat simple

**Fonctionnalités**:
- Affichage de l'historique
- Envoi de nouveaux messages
- Streaming de réponses
- Export de réponses

---

### 4. FormattedResponse (`src/components/ai/FormattedResponse.tsx`)

**Props**:
```typescript
{
  isThinking: boolean;
  isStreaming: boolean;
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  options?: {
    searchWeb?: boolean;
    analysis?: boolean;
    reflection?: boolean;
    code?: boolean;
  };
}
```

**Fonctionnalités**:
- Affichage formaté du contenu
- Support Markdown
- Affichage des sources
- Boutons d'export (PDF, Word, Excel)
- Indicateur de streaming

**Parsing Markdown**:
- Titres (H1, H2, H3)
- Listes
- Code blocks
- Texte en gras
- Paragraphes

---

### 5. SearchOptions (`src/components/ai/SearchOptions.tsx`)

**Props**:
```typescript
{
  onOptionsChange: (options: SearchOptionsState) => void;
  isLoading: boolean;
}
```

**Fonctionnalités**:
- Checkboxes pour chaque option
- Affichage des badges
- Désactivation pendant le chargement

---

## 🪝 Hooks personnalisés

### useAiEnhanced()

**Retour**:
```typescript
{
  generateResponse: (
    message: string,
    options: AiOptions,
    onChunk?: (chunk: string) => void
  ) => Promise<AiResponse>;
  isThinking: boolean;
  isStreaming: boolean;
  currentResponse: AiResponse | null;
}
```

**Fonctionnalités**:
- Génération de réponse avec streaming
- Gestion de l'état de pensée/streaming
- Callback pour chaque chunk reçu

---

### useFirestoreAiChat()

**Retour**:
```typescript
{
  createAiChat: (title: string) => Promise<string>;
  loadAiMessages: (
    chatId: string,
    callback: (messages: Message[]) => void
  ) => () => void;
  sendAiMessage: (
    chatId: string,
    userMessage: string,
    aiResponse: string
  ) => Promise<void>;
}
```

**Fonctionnalités**:
- Création de chats
- Chargement des messages en temps réel
- Sauvegarde des messages

---

## 🔍 Recherche Web

### Fonction: `remote_web_search()`

**Paramètres**:
```typescript
{
  query: string;
}
```

**Retour**:
```typescript
Array<{
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain?: string;
}>
```

**Implémentation**: DuckDuckGo API (gratuit, pas de clé requise)

---

## 📤 Export de réponses

### Formats supportés

#### 1. PDF
- Utilise `html2pdf.js`
- Préserve la mise en forme
- Fichier: `response.pdf`

#### 2. Word (.docx)
- Utilise `docx` library
- Support Markdown
- Fichier: `response.docx`

#### 3. Excel (.xlsx)
- Utilise `xlsx` library
- Format tabulaire
- Fichier: `response.xlsx`

---

## 🔐 Sécurité

### Authentification
- Vérification du token Firebase côté serveur
- Chaque utilisateur ne peut accéder qu'à ses propres chats

### Validation
- Validation de la longueur du message
- Validation des options
- Gestion des erreurs API

### Rate Limiting
- Groq API: Limites gratuites (généreux)
- DuckDuckGo: Pas de limite

---

## 🚀 Déploiement

### Variables d'environnement requises

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Groq API
GROQ_API_KEY=...
```

### Build
```bash
npm run build
```

### Démarrage
```bash
npm run dev        # Développement
npm run start      # Production
```

---

## 🧪 Tests

### Test manuel - Nouveau chat
1. Aller à `/dashboard/ai/chat`
2. Poser une question
3. Vérifier la création du chat
4. Vérifier la réponse

### Test manuel - Chat existant
1. Aller à `/dashboard/ai/chat/{id}`
2. Envoyer un message
3. Vérifier le streaming
4. Tester l'export

### Test manuel - Recherche web
1. Activer "Recherche Web"
2. Poser une question
3. Vérifier les sources

---

## 📈 Performance

### Optimisations
- Streaming de réponses (pas d'attente)
- Lazy loading des chats
- Pagination des messages
- Cache des réponses

### Temps de réponse
- Première réponse: 1-2 secondes
- Streaming: Continu
- Export: < 1 seconde

---

## 🐛 Gestion des erreurs

### Erreurs courantes

#### API Groq indisponible
- Affichage d'un message d'erreur
- Suggestion de réessayer

#### Recherche web échouée
- Continue sans résultats
- Affiche un avertissement

#### Sauvegarde Firestore échouée
- Affiche un avertissement
- Permet de continuer

---

## 📚 Dépendances

```json
{
  "react": "^18.0.0",
  "next": "^15.3.0",
  "firebase": "^10.0.0",
  "html2pdf.js": "^0.10.1",
  "docx": "^8.5.0",
  "xlsx": "^0.18.5",
  "lucide-react": "^0.263.0"
}
```

---

## 🔄 Flux de données

### Nouveau message

```
Utilisateur tape message
    ↓
Clique sur Envoyer
    ↓
Appel API /api/ai/enhanced-chat
    ↓
Streaming de réponse
    ↓
Sauvegarde dans Firestore
    ↓
Mise à jour UI
```

### Recherche web

```
Utilisateur active "Recherche Web"
    ↓
Appel DuckDuckGo API
    ↓
Résultats intégrés au prompt
    ↓
Réponse IA avec sources
```

---

## 🎨 Interface utilisateur

### Pages principales
- `/dashboard/ai` - Hub IA
- `/dashboard/ai/chat` - Nouveau chat
- `/dashboard/ai/chat/[id]` - Chat existant

### Composants UI
- Input pour messages
- Boutons d'action
- Badges pour options
- Cartes pour suggestions
- Modales pour export

---

## 📞 Support et maintenance

### Logs
- Erreurs API dans console serveur
- Erreurs client dans console navigateur
- Erreurs Firestore dans Firebase Console

### Monitoring
- Vérifier l'utilisation Groq API
- Vérifier les erreurs Firestore
- Vérifier les performances

---

## 🔮 Améliorations futures

- Historique des conversations
- Partage de chats
- Modèles personnalisés
- Intégration avec d'autres services
- Support multilingue avancé
- Génération d'images
- Analyse de documents

---

**Document préparé pour développement externe**  
**Prêt pour implémentation**  
**Support technique disponible**
