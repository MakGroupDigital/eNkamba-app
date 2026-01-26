# 🔧 Étapes Détaillées - Régénération Clé API Gemini

**Date:** 26 Janvier 2026

---

## 📋 Étapes Complètes

### Étape 1: Accéder à Google AI Studio

**URL:**
```
https://aistudio.google.com/app/apikey
```

**Actions:**
1. Ouvrir le lien dans un navigateur
2. Se connecter avec le compte Google
3. Accepter les conditions d'utilisation

---

### Étape 2: Créer une Nouvelle Clé API

**Actions:**
1. Cliquer sur "Create API Key"
2. Sélectionner le projet (ou créer un nouveau)
3. Cliquer "Create"
4. Copier la clé affichée

**Format de la clé:**
```
AIzaSy[caractères_aléatoires]
```

---

### Étape 3: Mettre à Jour .env.local

**Ouvrir le fichier:**
```bash
nano .env.local
```

**Trouver la ligne:**
```
GOOGLE_GENAI_API_KEY=votre_nouvelle_cle_ici
```

**Remplacer par:**
```
GOOGLE_GENAI_API_KEY=AIzaSy[votre_clé_complète]
```

**Exemple:**
```
GOOGLE_GENAI_API_KEY=AIzaSyDxX_xX_xX_xX_xX_xX_xX_xX_xX_xX_xX
```

**Sauvegarder:**
```
Ctrl+X → Y → Enter
```

---

### Étape 4: Vérifier .gitignore

**Vérifier que .env.local est ignoré:**
```bash
cat .gitignore | grep env.local
```

**Si absent, ajouter:**
```bash
echo ".env.local" >> .gitignore
```

---

### Étape 5: Redémarrer le Serveur

**Arrêter le serveur:**
```
Ctrl+C
```

**Redémarrer:**
```bash
npm run dev
```

**Attendre le message:**
```
ready - started server on 0.0.0.0:3000
```

---

### Étape 6: Tester la Nouvelle Clé

**Accéder à l'IA:**
```
http://localhost:3000/dashboard/ai/chat/[id]
```

**Poser une question:**
```
"Bonjour, comment ça marche?"
```

**Vérifier:**
- ✅ Pas d'erreur 403
- ✅ Réponse s'affiche
- ✅ Streaming fonctionne
- ✅ Mise en forme correcte

---

## 🔍 Vérifications

### Vérifier la Clé dans le Code

**Chercher les références:**
```bash
grep -r "GOOGLE_GENAI_API_KEY" src/
grep -r "GOOGLE_GENAI_API_KEY" functions/
```

**Résultat attendu:**
```
Aucune clé en dur dans le code
Seulement des références à process.env
```

### Vérifier les Logs

**Chercher les erreurs:**
```bash
npm run dev 2>&1 | grep -i "error\|403\|forbidden"
```

**Résultat attendu:**
```
Aucune erreur 403
```

---

## 🚀 Après Régénération

### Tester Complètement

1. **Accéder à l'IA**
   ```
   http://localhost:3000/dashboard/ai/chat/[id]
   ```

2. **Tester les Options**
   - [ ] Recherche Web
   - [ ] Analyse
   - [ ] Réflexion
   - [ ] Code

3. **Tester le Streaming**
   - [ ] Réponse s'affiche progressivement
   - [ ] Phase de réflexion visible
   - [ ] Pas de saccades

4. **Tester la Mise en Forme**
   - [ ] Titres en gras
   - [ ] Sous-titres
   - [ ] Listes à puces
   - [ ] Blocs de code

---

## 🐛 Troubleshooting

### Erreur: "API key not found"

**Solution:**
```bash
# Vérifier que .env.local existe
ls -la .env.local

# Vérifier le contenu
cat .env.local | grep GOOGLE_GENAI_API_KEY
```

### Erreur: "Invalid API key"

**Solution:**
```bash
# Vérifier le format de la clé
# Doit commencer par: AIzaSy

# Vérifier qu'il n'y a pas d'espaces
cat .env.local | grep GOOGLE_GENAI_API_KEY | wc -c
```

### Erreur: "403 Forbidden"

**Solution:**
```bash
# La clé est peut-être compromise
# Créer une nouvelle clé
# Mettre à jour .env.local
# Redémarrer le serveur
```

### Erreur: "Quota exceeded"

**Solution:**
```bash
# Vérifier les quotas sur:
# https://console.cloud.google.com/apis/dashboard

# Augmenter les quotas si nécessaire
# Ou attendre le reset (généralement 24h)
```

---

## 📊 Commandes Rapides

### Créer une Nouvelle Clé
```
1. Aller à https://aistudio.google.com/app/apikey
2. Cliquer "Create API Key"
3. Copier la clé
```

### Mettre à Jour .env.local
```bash
nano .env.local
# Remplacer la clé
# Sauvegarder
```

### Redémarrer le Serveur
```bash
# Arrêter (Ctrl+C)
npm run dev
```

### Tester
```
http://localhost:3000/dashboard/ai/chat/[id]
```

---

## ✅ Checklist Finale

- [ ] Nouvelle clé créée
- [ ] .env.local mis à jour
- [ ] .gitignore vérifié
- [ ] Serveur redémarré
- [ ] Pas d'erreur 403
- [ ] IA fonctionne
- [ ] Streaming fonctionne
- [ ] Mise en forme correcte
- [ ] Options fonctionnent
- [ ] Prêt pour production

---

## ⏱️ Temps Total

- Créer clé: 2 min
- Mettre à jour: 1 min
- Redémarrer: 1 min
- Tester: 2 min
- **Total: 6 minutes**

---

**Statut:** 🔧 GUIDE COMPLET  
**Priorité:** HAUTE  
**Action:** Immédiate
