# eNkamba AI - Détails Techniques Avancés

**Version**: 1.0  
**Audience**: Développeurs seniors  
**Complexité**: Avancée

---

## 🏛️ Architecture détaillée

### Flux de données complet

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Page Chat                                            │   │
│  │ - Affichage messages                                 │   │
│  │ - Input utilisateur                                  │   │
│  │ - Options recherche                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Hooks (useAiEnhanced, useFirestoreAiChat)           │   │
│  │ - Gestion état                                       │   │
│  │ - Appels API                                         │   │
│  │ - Streaming                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTE                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ POST /api/ai/enhanced-chat                           │   │
│  │ - Parser requête                                     │   │
│  │ - Recherche web (optionnel)                          │   │
│  │ - Construire prompt                                  │   │
│  │ - Appeler Groq API                                   │   │
│  │ - Streamer réponse                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES EXTERNES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Groq API     │  │ DuckDuckGo   │  │ Firebase     │      │
│  │ (IA)         │  │ (Recherche)  │  │ (Stockage)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Intégration Groq API

### Configuration

```typescript
const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'gemma2-9b-it',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};
```

### Format de requête

```typescript
{
  model: 'gemma2-9b-it',
  messages: [
    {
      role: 'system',
      content: 'Tu es eNkamba AI...'
    },
    {
      role: 'user',
      content: 'Message utilisateur'
    }
  ],
  temperature: 0.7,
  max_tokens: 2048,
  stream: true
}
```

### Parsing du stream

```typescript
// Format SSE (Server-Sent Events)
data: {"choices":[{"delta":{"content":"texte"}}]}
data: {"choices":[{"delta":{"content":" suite"}}]}
data: [DONE]

// Parser
const lines = buffer.split('\n');
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') break;
    
    const parsed = JSON.parse(data);
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      // Envoyer le chunk
    }
  }
}
```

---

## 🔍 Recherche Web

### Intégration DuckDuckGo

```typescript
async function remote_web_search(query: string) {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
  );
  
  const data = await response.json();
  
  return data.Results.map(result => ({
    title: result.Title,
    url: result.FirstURL,
    snippet: result.Text,
  }));
}
```

### Intégration au prompt

```typescript
let searchContext = '';

if (options.searchWeb) {
  const results = await remote_web_search(message);
  
  searchContext = '\n\n=== RÉSULTATS DE RECHERCHE WEB ===\n';
  results.forEach((result, idx) => {
    searchContext += `\n[${idx + 1}] ${result.title}\n`;
    searchContext += `Contenu: ${result.snippet}\n`;
    searchContext += `Source: ${result.url}\n`;
  });
  searchContext += '\n=== FIN DES RÉSULTATS ===\n';
}

const finalMessage = message + searchContext;
```

---

## 💾 Firestore Schema

### Règles de sécurité

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Chats IA
      match /aiChats/{chatId} {
        allow read, write: if request.auth.uid == userId;
        
        // Messages
        match /messages/{messageId} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
  }
}
```

### Indexes requis

```json
{
  "indexes": [
    {
      "collectionGroup": "messages",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🎯 Optimisations de performance

### 1. Streaming
- Envoyer les chunks au fur et à mesure
- Pas d'attente de la réponse complète
- Meilleure UX

### 2. Lazy loading
```typescript
const messages = await query(
  collection(db, 'users', userId, 'aiChats', chatId, 'messages'),
  orderBy('timestamp', 'desc'),
  limit(20)  // Charger 20 messages à la fois
);
```

### 3. Pagination
```typescript
const loadMore = async () => {
  const lastMessage = messages[messages.length - 1];
  const moreMessages = await query(
    collection(...),
    orderBy('timestamp', 'desc'),
    startAfter(lastMessage.timestamp),
    limit(20)
  );
};
```

### 4. Cache côté client
```typescript
const [messageCache, setMessageCache] = useState(new Map());

const getCachedMessages = (chatId) => {
  if (messageCache.has(chatId)) {
    return messageCache.get(chatId);
  }
  // Charger depuis Firestore
};
```

---

## 🔐 Sécurité avancée

### 1. Validation des entrées

```typescript
// Longueur du message
if (message.length > 5000) {
  throw new Error('Message trop long');
}

// Caractères spéciaux
if (!/^[\w\s\p{L}\p{N}.,!?-]+$/u.test(message)) {
  throw new Error('Caractères non autorisés');
}

// Injection SQL/NoSQL
const sanitized = message.replace(/[<>]/g, '');
```

### 2. Rate limiting

```typescript
const rateLimitMap = new Map();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId) || [];
  
  // Garder les requêtes des 60 dernières secondes
  const recent = userLimit.filter(t => now - t < 60000);
  
  if (recent.length >= 10) {
    throw new Error('Trop de requêtes');
  }
  
  recent.push(now);
  rateLimitMap.set(userId, recent);
}
```

### 3. Validation du token

```typescript
async function verifyToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Token invalide');
  }
}
```

---

## 📊 Monitoring et logging

### Logs structurés

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  userId: string;
  action: string;
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

function logAction(entry: LogEntry) {
  console.log(JSON.stringify(entry));
  // Envoyer à un service de logging (Sentry, etc.)
}
```

### Métriques

```typescript
const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  averageResponseTime: 0,
  averageStreamingTime: 0,
  cacheHitRate: 0,
};

function recordMetric(name: string, value: number) {
  // Envoyer à un service de monitoring (DataDog, etc.)
}
```

---

## 🧪 Tests avancés

### Test de streaming

```typescript
async function testStreaming() {
  const response = await fetch('/api/ai/enhanced-chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Test',
      options: { searchWeb: false, analysis: false, reflection: false, code: false },
    }),
  });
  
  const reader = response.body?.getReader();
  let chunks = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks++;
  }
  
  expect(chunks).toBeGreaterThan(0);
}
```

### Test de concurrence

```typescript
async function testConcurrency() {
  const promises = Array(10).fill(null).map(() =>
    fetch('/api/ai/enhanced-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test',
        options: { searchWeb: false, analysis: false, reflection: false, code: false },
      }),
    })
  );
  
  const results = await Promise.all(promises);
  expect(results.every(r => r.ok)).toBe(true);
}
```

---

## 🚀 Déploiement avancé

### Variables d'environnement de production

```env
# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=gemma2-9b-it
GROQ_MAX_TOKENS=2048

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Monitoring
SENTRY_DSN=...
DATADOG_API_KEY=...

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enkamba-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: enkamba-ai
  template:
    metadata:
      labels:
        app: enkamba-ai
    spec:
      containers:
      - name: enkamba-ai
        image: enkamba-ai:latest
        ports:
        - containerPort: 3000
        env:
        - name: GROQ_API_KEY
          valueFrom:
            secretKeyRef:
              name: groq-secret
              key: api-key
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy eNkamba AI

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📈 Scalabilité

### Problèmes potentiels

1. **Limite Groq API**: 30 requêtes/minute (gratuit)
   - Solution: Queue avec Redis
   - Solution: Upgrade plan payant

2. **Firestore**: Limites de lecture/écriture
   - Solution: Indexation appropriée
   - Solution: Pagination

3. **Mémoire serveur**: Streaming de gros fichiers
   - Solution: Chunking
   - Solution: Compression

### Solutions

```typescript
// Queue avec Redis
import Redis from 'ioredis';

const redis = new Redis();

async function queueRequest(userId: string, message: string) {
  await redis.lpush(`queue:${userId}`, JSON.stringify({ message }));
}

async function processQueue() {
  const item = await redis.rpop('queue:user1');
  if (item) {
    const { message } = JSON.parse(item);
    // Traiter
  }
}
```

---

## 🎓 Bonnes pratiques

### 1. Code
- Utiliser TypeScript strictement
- Ajouter des types explicites
- Éviter `any`
- Commenter le code complexe

### 2. Performance
- Profiler régulièrement
- Optimiser les requêtes Firestore
- Utiliser le caching
- Monitorer les métriques

### 3. Sécurité
- Valider toutes les entrées
- Utiliser HTTPS
- Chiffrer les données sensibles
- Auditer les accès

### 4. Maintenance
- Documenter le code
- Écrire des tests
- Utiliser le versioning
- Faire des reviews de code

---

**Document technique complet**  
**Prêt pour développement avancé**  
**Support technique disponible**
