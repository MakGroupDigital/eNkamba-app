# eNkamba AI - Guide d'implémentation

**Version**: 1.0  
**Pour**: Développeurs externes  
**Durée estimée**: 2-3 semaines

---

## 📦 Livrables

### Phase 1: Configuration (Jour 1-2)
- [ ] Cloner le repository
- [ ] Installer les dépendances
- [ ] Configurer les variables d'environnement
- [ ] Tester la connexion Firebase
- [ ] Tester la connexion Groq API

### Phase 2: Backend (Jour 3-5)
- [ ] Implémenter `/api/ai/enhanced-chat`
- [ ] Intégrer Groq API
- [ ] Implémenter le streaming
- [ ] Ajouter la recherche web
- [ ] Tester les erreurs

### Phase 3: Frontend (Jour 6-10)
- [ ] Créer les pages de chat
- [ ] Implémenter les composants
- [ ] Ajouter les hooks
- [ ] Intégrer Firestore
- [ ] Tester l'UI

### Phase 4: Fonctionnalités avancées (Jour 11-14)
- [ ] Export PDF/Word/Excel
- [ ] Historique des chats
- [ ] Options de recherche
- [ ] Formatage Markdown
- [ ] Gestion des erreurs

### Phase 5: Tests et déploiement (Jour 15-21)
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de performance
- [ ] Déploiement staging
- [ ] Déploiement production

---

## 🛠️ Configuration initiale

### 1. Cloner et installer

```bash
git clone <repository>
cd eNkamba
npm install
```

### 2. Variables d'environnement

Créer `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-1153706651-6032b
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-1153706651-6032b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://studio-1153706651-6032b.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-1153706651-6032b.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Groq API
GROQ_API_KEY=gsk_...
```

### 3. Démarrer le serveur

```bash
npm run dev
# Serveur sur http://localhost:9002
```

---

## 🔧 Implémentation détaillée

### API Route: `/api/ai/enhanced-chat`

**Fichier**: `src/app/api/ai/enhanced-chat/route.ts`

**Étapes**:

1. **Parser la requête**
```typescript
const body = await request.json();
const { message, options } = body;
```

2. **Recherche web (optionnel)**
```typescript
if (options.searchWeb) {
  const results = await remote_web_search({ query: message });
  // Intégrer les résultats au prompt
}
```

3. **Construire le prompt**
```typescript
let systemPrompt = 'Tu es eNkamba AI...';
if (options.reflection) systemPrompt += ' Réfléchis profondément...';
if (options.analysis) systemPrompt += ' Fournis une analyse approfondie...';
```

4. **Appeler Groq API**
```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gemma2-9b-it',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: finalMessage },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  }),
});
```

5. **Streamer la réponse**
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      // Parser et envoyer les chunks
      controller.enqueue(encoder.encode(chunk));
    }
    controller.close();
  },
});

return new NextResponse(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});
```

---

### Hook: `useAiEnhanced()`

**Fichier**: `src/hooks/useAiEnhanced.ts`

**Étapes**:

1. **État**
```typescript
const [isThinking, setIsThinking] = useState(false);
const [isStreaming, setIsStreaming] = useState(false);
const [currentResponse, setCurrentResponse] = useState<AiResponse | null>(null);
```

2. **Fonction generateResponse**
```typescript
const generateResponse = useCallback(
  async (message, options, onChunk) => {
    setIsThinking(true);
    
    // Simuler la réflexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsThinking(false);
    setIsStreaming(true);
    
    // Appeler l'API
    const response = await fetch('/api/ai/enhanced-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, options }),
    });
    
    // Lire le stream
    const reader = response.body?.getReader();
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      fullResponse += chunk;
      onChunk?.(chunk);
    }
    
    setIsStreaming(false);
    return parseFormattedResponse(fullResponse);
  },
  []
);
```

---

### Hook: `useFirestoreAiChat()`

**Fichier**: `src/hooks/useFirestoreAiChat.ts`

**Étapes**:

1. **Créer un chat**
```typescript
const createAiChat = useCallback(async (title: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');
  
  const chatRef = doc(
    collection(db, 'users', user.uid, 'aiChats'),
    'auto'
  );
  
  await setDoc(chatRef, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0,
  });
  
  return chatRef.id;
}, []);
```

2. **Charger les messages**
```typescript
const loadAiMessages = useCallback((chatId: string, callback) => {
  const user = auth.currentUser;
  if (!user) return;
  
  const q = query(
    collection(db, 'users', user.uid, 'aiChats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
}, []);
```

3. **Envoyer un message**
```typescript
const sendAiMessage = useCallback(
  async (chatId: string, userMessage: string, aiResponse: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');
    
    const messagesRef = collection(
      db,
      'users',
      user.uid,
      'aiChats',
      chatId,
      'messages'
    );
    
    // Ajouter message utilisateur
    await addDoc(messagesRef, {
      role: 'user',
      text: userMessage,
      timestamp: serverTimestamp(),
    });
    
    // Ajouter réponse IA
    await addDoc(messagesRef, {
      role: 'assistant',
      text: aiResponse,
      timestamp: serverTimestamp(),
    });
  },
  []
);
```

---

### Composant: `FormattedResponse`

**Fichier**: `src/components/ai/FormattedResponse.tsx`

**Étapes**:

1. **Parser le Markdown**
```typescript
function parseAndRenderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(
        <h1 className="text-3xl font-bold">{line.replace('# ', '')}</h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 className="text-2xl font-bold">{line.replace('## ', '')}</h2>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li className="ml-6">{line.replace('- ', '')}</li>
      );
    } else if (line.trim()) {
      elements.push(<p className="text-gray-700">{line}</p>);
    }
  }
  
  return elements;
}
```

2. **Afficher le contenu**
```typescript
return (
  <Card className="p-6">
    <div ref={contentRef} className="space-y-4">
      {parseAndRenderContent(displayedContent)}
    </div>
  </Card>
);
```

3. **Boutons d'export**
```typescript
const handleExportPDF = () => {
  const element = contentRef.current;
  html2pdf().set(options).from(element).save();
};

const handleExportWord = async () => {
  const doc = new Document({
    sections: [{ children: parseContentToDocx(displayedContent) }],
  });
  const blob = await Packer.toBlob(doc);
  // Télécharger
};

const handleExportExcel = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['eNkamba AI Response'],
    ...displayedContent.split('\n').map(line => [line]),
  ]);
  XLSX.writeFile(XLSX.utils.book_new(), 'response.xlsx');
};
```

---

## 🧪 Tests

### Test unitaire - API route

```typescript
describe('POST /api/ai/enhanced-chat', () => {
  it('devrait retourner une réponse', async () => {
    const response = await fetch('/api/ai/enhanced-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Bonjour',
        options: { searchWeb: false, analysis: false, reflection: false, code: false },
      }),
    });
    
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });
});
```

### Test d'intégration - Chat complet

```typescript
describe('Chat flow', () => {
  it('devrait créer un chat et envoyer un message', async () => {
    // 1. Créer un chat
    const chatId = await createAiChat('Test');
    expect(chatId).toBeDefined();
    
    // 2. Envoyer un message
    await sendAiMessage(chatId, 'Bonjour', 'Réponse');
    
    // 3. Charger les messages
    const messages = await loadAiMessages(chatId);
    expect(messages.length).toBe(2);
  });
});
```

---

## 📊 Checklist de déploiement

### Avant le déploiement
- [ ] Tous les tests passent
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'avertissements console
- [ ] Performance acceptable
- [ ] Sécurité vérifiée

### Déploiement
- [ ] Build production: `npm run build`
- [ ] Tester localement: `npm run start`
- [ ] Déployer sur Vercel
- [ ] Vérifier les variables d'environnement
- [ ] Tester en production

### Post-déploiement
- [ ] Vérifier les logs
- [ ] Tester les fonctionnalités
- [ ] Monitorer les erreurs
- [ ] Vérifier les performances

---

## 🐛 Dépannage courant

### Erreur: "GROQ_API_KEY not found"
**Solution**: Vérifier `.env.local` contient `GROQ_API_KEY`

### Erreur: "Model decommissioned"
**Solution**: Utiliser `gemma2-9b-it` (modèle actuel)

### Erreur: "Firebase not initialized"
**Solution**: Vérifier les variables d'environnement Firebase

### Erreur: "removeChild error"
**Solution**: Vérifier que les éléments DOM sont correctement nettoyés

---

## 📞 Support

### Documentation
- Spécification technique: `.kiro/ENKAMBA_AI_MODULE_SPECIFICATION.md`
- Guide d'implémentation: Ce document
- Code source: `src/app/api/ai/`, `src/components/ai/`, `src/hooks/`

### Ressources externes
- [Groq API Docs](https://console.groq.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)

---

**Prêt pour développement**  
**Support technique disponible**  
**Durée estimée: 2-3 semaines**
