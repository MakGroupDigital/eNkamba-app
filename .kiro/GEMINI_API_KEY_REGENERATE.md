# 🔑 Régénération de la Clé API Gemini

**Date:** 26 Janvier 2026  
**Statut:** ⚠️ URGENT - Clé Compromise  
**Action:** Régénérer immédiatement

---

## 🚨 Problème

```
Error: Failed to fetch from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
[403 Forbidden] Your API key was reported as leaked. Please use another API key.
```

**Cause:** La clé API Gemini a été compromise et doit être remplacée immédiatement.

---

## ✅ Solution

### Étape 1: Créer une Nouvelle Clé API

1. Aller à: https://aistudio.google.com/app/apikey
2. Cliquer sur "Create API Key"
3. Sélectionner le projet (ou en créer un nouveau)
4. Copier la nouvelle clé

### Étape 2: Mettre à Jour .env.local

```bash
# Ouvrir le fichier
nano .env.local
```

**Remplacer:**
```
GOOGLE_GENAI_API_KEY=votre_nouvelle_cle_ici
```

**Par:**
```
GOOGLE_GENAI_API_KEY=AIzaSy[votre_nouvelle_cle_complete]
```

### Étape 3: Sauvegarder

```
Ctrl+X → Y → Enter
```

### Étape 4: Redémarrer le Serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer
npm run dev
```

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter la clé** dans Git
2. **Utiliser .env.local** pour les variables sensibles
3. **Ajouter .env.local** à .gitignore
4. **Régénérer régulièrement** les clés
5. **Monitorer l'utilisation** de l'API

### .gitignore

Vérifier que `.env.local` est dans `.gitignore`:

```bash
cat .gitignore | grep env.local
```

Si absent, ajouter:

```bash
echo ".env.local" >> .gitignore
```

---

## 📊 Vérification

### Tester la Nouvelle Clé

1. Accéder à `/dashboard/ai/chat/[id]`
2. Poser une question
3. Vérifier que la réponse s'affiche

**Résultat attendu:** ✅ Réponse correcte

---

## 🔗 Ressources

### Google AI Studio
```
https://aistudio.google.com/app/apikey
```

### Documentation Gemini
```
https://ai.google.dev/docs
```

### Quotas et Limites
```
https://ai.google.dev/pricing
```

---

## ⏱️ Temps Estimé

- Créer nouvelle clé: 2 minutes
- Mettre à jour .env.local: 1 minute
- Redémarrer serveur: 1 minute
- **Total: 4 minutes**

---

## ✅ Checklist

- [ ] Créer nouvelle clé API
- [ ] Copier la clé
- [ ] Mettre à jour .env.local
- [ ] Sauvegarder le fichier
- [ ] Redémarrer le serveur
- [ ] Tester la nouvelle clé
- [ ] Vérifier que l'IA fonctionne

---

## 🚀 Après Régénération

### Tester l'IA

```
1. Aller à /dashboard/ai/chat/[id]
2. Poser une question
3. Vérifier la réponse
```

### Vérifier les Logs

```bash
# Voir les logs
npm run dev

# Chercher les erreurs
grep -i "error" logs.txt
```

---

## 📝 Notes

- La clé compromise ne peut plus être utilisée
- Google a automatiquement désactivé la clé
- Une nouvelle clé est nécessaire
- Le changement est immédiat
- Pas de downtime prévu

---

**Statut:** ⚠️ ACTION REQUISE  
**Priorité:** HAUTE  
**Durée:** 4 minutes
