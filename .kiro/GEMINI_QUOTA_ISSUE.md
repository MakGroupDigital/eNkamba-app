# Problème Quota Gemini API

**Date**: 2026-02-02  
**Status**: ⚠️ LIMITATION CONNUE  
**Problème**: Quota dépassé sur Gemini 2.5 Flash

## 🔴 Problème

### Erreur
```
[429 Too Many Requests] You exceeded your current quota, 
please check your plan and billing details.
```

### Cause
Le modèle **Gemini 2.5 Flash** a un quota très limité en free tier :
- **Free Tier** : 15 requêtes par minute (RPM)
- **Quota dépassé** : Après quelques requêtes

Même avec une nouvelle clé API, le quota est rapidement atteint.

## ✅ Solution Appliquée

### Gestion d'Erreur Gracieuse
Ajout d'une gestion d'erreur dans `src/app/api/ai/enhanced-chat/route.ts` :

```typescript
if (error?.message?.includes('429') || error?.message?.includes('quota')) {
  const quotaMessage = `⚠️ Quota API Gemini dépassé. L'IA est temporairement indisponible. 
  Veuillez réessayer dans quelques minutes ou contacter le support.`;
  controller.enqueue(encoder.encode(quotaMessage));
}
```

**Résultat** : Au lieu de crash, l'utilisateur reçoit un message clair.

## 🔧 Solutions Permanentes

### Option 1 : Passer à un Plan Payant (Recommandé)
- **Coût** : ~$0.075 par 1M tokens
- **Quota** : 1000 RPM (illimité avec facturation)
- **Avantage** : Accès complet à Gemini

**Étapes** :
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer la facturation
3. Augmenter les quotas
4. Utiliser la même clé API

### Option 2 : Utiliser un Modèle Alternatif
- **Claude API** (Anthropic) : Meilleur pour le code
- **OpenAI GPT-4** : Plus puissant mais plus cher
- **Ollama Local** : Gratuit, fonctionne en local

### Option 3 : Implémenter un Cache
Mettre en cache les réponses pour éviter les requêtes répétées :

```typescript
const cache = new Map<string, string>();

if (cache.has(message)) {
  return cache.get(message);
}

const response = await model.generateContent(message);
cache.set(message, response);
return response;
```

### Option 4 : Limiter les Requêtes
Implémenter un rate limiter côté serveur :

```typescript
const rateLimiter = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
  const recentRequests = requests.filter(t => now - t < 60000);
  
  if (recentRequests.length >= 5) {
    return true;
  }
  
  rateLimiter.set(userId, [...recentRequests, now]);
  return false;
}
```

## 📊 Comparaison des Solutions

| Solution | Coût | Quota | Facilité | Recommandé |
|----------|------|-------|----------|-----------|
| **Plan Payant** | $0.075/1M tokens | 1000 RPM | ⭐⭐⭐ | ✅ OUI |
| **Claude API** | $0.003/1K tokens | Illimité | ⭐⭐⭐ | ✅ OUI |
| **OpenAI GPT-4** | $0.03/1K tokens | Illimité | ⭐⭐⭐ | ⭐⭐ |
| **Ollama Local** | Gratuit | Illimité | ⭐⭐ | ⭐⭐ |
| **Cache** | Gratuit | Limité | ⭐⭐⭐⭐ | ✅ OUI |
| **Rate Limiter** | Gratuit | Limité | ⭐⭐⭐ | ✅ OUI |

## 🎯 Recommandation

**Meilleure approche** : Combiner plusieurs solutions

1. **Court terme** : Implémenter un cache + rate limiter
2. **Moyen terme** : Passer à un plan payant Gemini
3. **Long terme** : Envisager Claude API pour meilleure qualité

## 📝 Fichiers Modifiés

1. `src/app/api/ai/enhanced-chat/route.ts` - Gestion d'erreur gracieuse

## 🔗 Ressources

- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Claude API](https://www.anthropic.com/api)
- [OpenAI API](https://platform.openai.com/api-keys)

---

**Status**: ⚠️ LIMITATION CONNUE  
**Action Requise**: Activer la facturation ou implémenter un cache
