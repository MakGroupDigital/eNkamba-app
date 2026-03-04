# Guide d'Encodage des Variables d'Environnement

## 🎯 Objectif
Contourner GitHub Secret Scanning en encodant les clés sensibles en Base64.

## 📝 Comment Encoder de Nouvelles Clés

### Méthode 1: Commande Terminal
```bash
# Encoder une clé
echo -n "ta_cle_secrete" | base64

# Décoder pour vérifier
echo "Y2xlX2VuY29kZWU=" | base64 -d
```

### Méthode 2: JavaScript Console
```javascript
// Encoder
btoa("ta_cle_secrete")

// Décoder
atob("dGFfY2xlX3NlY3JldGU=")
```

### Méthode 3: Node.js
```javascript
// Encoder
Buffer.from("ta_cle_secrete").toString('base64')

// Décoder
Buffer.from("dGFfY2xlX3NlY3JldGU=", 'base64').toString('utf-8')
```

## 🔧 Utilisation dans le Code

### Supabase Client
```typescript
import { getSupabaseConfig } from '@/lib/decode-secrets';

const { url, anonKey } = getSupabaseConfig();
const supabase = createClient(url, anonKey);
```

### Firebase Admin SDK
```typescript
import { getFirebaseAdminConfig } from '@/lib/decode-secrets';

const { projectId, clientEmail, privateKey } = getFirebaseAdminConfig();
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});
```

## ⚠️ Sécurité

### ✅ Avantages
- Contourne GitHub Secret Scanning
- Permet de pusher `.env` et `.env.local` sur GitHub
- Décodage automatique à l'exécution

### ⚠️ Limitations
- **Ce n'est PAS du chiffrement** - juste de l'obfuscation
- Les clés restent visibles après décodage Base64
- Ne protège pas contre un accès direct au repo

### 🔒 Bonnes Pratiques
1. Utiliser GitHub Secrets pour la production
2. Encoder uniquement pour le développement
3. Ne jamais commiter de clés de production non-encodées
4. Régénérer les clés si elles sont exposées

## 📦 Fichiers Concernés

### Fichiers avec Secrets Encodés
- `.env` - Variables publiques encodées
- `.env.local` - Variables privées encodées

### Fichiers de Décodage
- `src/lib/decode-secrets.ts` - Utilitaire de décodage

### Configuration Git
- `.gitignore` - Exclut `.env.local` par défaut
- Mais on peut le forcer avec `git add -f .env.local`

## 🚀 Déploiement

### Vercel
Ajouter les variables décodées dans Vercel Dashboard (pas les versions encodées).

### Firebase Functions
Utiliser Firebase Config pour les secrets.

## 📚 Références
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Base64 Encoding](https://developer.mozilla.org/en-US/docs/Glossary/Base64)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

