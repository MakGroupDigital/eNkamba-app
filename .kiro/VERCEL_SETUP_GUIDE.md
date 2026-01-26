# 🚀 Guide Complet - Configuration Vercel pour l'IA

**Date:** 26 Janvier 2026  
**Durée:** ~10 minutes

---

## 📋 Résumé

Pour que l'IA fonctionne sur Vercel, vous devez ajouter 4 variables d'environnement.

---

## 🎯 Variables à Ajouter

```
1. GOOGLE_GENAI_API_KEY (Secret)
2. NEXT_PUBLIC_RECAPTCHA_SITE_KEY (Public)
3. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Public)
4. CLERK_SECRET_KEY (Secret)
```

---

## 📝 Étape 1: Obtenir la Clé Google Gemini API

### 1.1 Aller sur Google AI Studio

```
URL: https://aistudio.google.com/app/apikey
```

### 1.2 Créer une Nouvelle Clé

1. Cliquer sur "Create API Key"
2. Sélectionner le projet (ou créer un nouveau)
3. Cliquer sur "Create API Key in Google Cloud"
4. Copier la clé générée

### 1.3 Copier la Clé

```
Exemple: AIzaSyD_...
```

---

## 🔧 Étape 2: Ajouter les Variables sur Vercel

### 2.1 Accéder à Vercel

```
URL: https://vercel.com/dashboard
```

### 2.2 Sélectionner le Projet

1. Cliquer sur "eNkamba-app"
2. Cliquer sur "Settings"
3. Cliquer sur "Environment Variables"

### 2.3 Ajouter la Première Variable

**Variable 1: GOOGLE_GENAI_API_KEY**

```
Nom: GOOGLE_GENAI_API_KEY
Valeur: [Votre clé Google Gemini API]
Scopes: Production, Preview, Development
```

Étapes:
1. Cliquer sur "Add New"
2. Entrer le nom: `GOOGLE_GENAI_API_KEY`
3. Entrer la valeur: `AIzaSyD_...`
4. Cocher: Production, Preview, Development
5. Cliquer sur "Save"

### 2.4 Ajouter la Deuxième Variable

**Variable 2: NEXT_PUBLIC_RECAPTCHA_SITE_KEY**

```
Nom: NEXT_PUBLIC_RECAPTCHA_SITE_KEY
Valeur: 6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7
Scopes: Production, Preview, Development
```

Étapes:
1. Cliquer sur "Add New"
2. Entrer le nom: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
3. Entrer la valeur: `6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7`
4. Cocher: Production, Preview, Development
5. Cliquer sur "Save"

### 2.5 Ajouter la Troisième Variable

**Variable 3: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**

```
Nom: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Valeur: pk_test_Ymxlc3NlZC1iZW5nYWwtNzcuY2xlcmsuYWNjb3VudHMuZGV2JA
Scopes: Production, Preview, Development
```

Étapes:
1. Cliquer sur "Add New"
2. Entrer le nom: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Entrer la valeur: `pk_test_Ymxlc3NlZC1iZW5nYWwtNzcuY2xlcmsuYWNjb3VudHMuZGV2JA`
4. Cocher: Production, Preview, Development
5. Cliquer sur "Save"

### 2.6 Ajouter la Quatrième Variable

**Variable 4: CLERK_SECRET_KEY**

```
Nom: CLERK_SECRET_KEY
Valeur: sk_test_Lw77w4Q9c6LkOrqtZhU56HlSZWGFDFql64S1cakLnj
Scopes: Production, Preview, Development
```

Étapes:
1. Cliquer sur "Add New"
2. Entrer le nom: `CLERK_SECRET_KEY`
3. Entrer la valeur: `sk_test_Lw77w4Q9c6LkOrqtZhU56HlSZWGFDFql64S1cakLnj`
4. Cocher: Production, Preview, Development
5. Cliquer sur "Save"

---

## 🔄 Étape 3: Redéployer le Projet

### 3.1 Aller sur Deployments

1. Cliquer sur "Deployments"
2. Voir le dernier déploiement

### 3.2 Redéployer

1. Cliquer sur le dernier déploiement
2. Cliquer sur "Redeploy"
3. Attendre la fin du déploiement (2-5 minutes)

### 3.3 Vérifier le Statut

```
Status: Ready ✅
```

---

## ✅ Étape 4: Tester l'IA

### 4.1 Aller sur l'App

```
URL: https://votre-app.vercel.app/dashboard/ai
```

### 4.2 Tester le Chat IA

1. Cliquer sur "Nouveau Chat"
2. Écrire une question
3. Cliquer sur "Envoyer"
4. Vérifier que la réponse s'affiche

### 4.3 Vérifier les Options

- [ ] Recherche Web fonctionne
- [ ] Analyse fonctionne
- [ ] Réflexion fonctionne
- [ ] Code fonctionne

---

## 🐛 Dépannage

### Erreur: "API Key Invalid"

**Cause:** La clé Google Gemini API est incorrecte ou expirée

**Solution:**
1. Générer une nouvelle clé sur https://aistudio.google.com/app/apikey
2. Mettre à jour sur Vercel
3. Redéployer

### Erreur: "reCAPTCHA Failed"

**Cause:** La clé reCAPTCHA est incorrecte

**Solution:**
1. Vérifier la clé sur https://www.google.com/recaptcha/admin
2. Ajouter le domaine Vercel
3. Mettre à jour sur Vercel
4. Redéployer

### Erreur: "Clerk Authentication Failed"

**Cause:** Les clés Clerk sont incorrectes

**Solution:**
1. Vérifier les clés sur https://dashboard.clerk.com
2. Ajouter le domaine Vercel
3. Mettre à jour sur Vercel
4. Redéployer

### Erreur: "500 Internal Server Error"

**Cause:** Les variables d'environnement ne sont pas chargées

**Solution:**
1. Vérifier que toutes les variables sont ajoutées
2. Vérifier les noms des variables
3. Redéployer
4. Attendre 5 minutes

---

## 📊 Tableau Récapitulatif

| Variable | Valeur | Type | Scope |
|----------|--------|------|-------|
| `GOOGLE_GENAI_API_KEY` | AIzaSyD_... | Secret | Prod/Preview/Dev |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | 6LfuglEs... | Public | Prod/Preview/Dev |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | pk_test_... | Public | Prod/Preview/Dev |
| `CLERK_SECRET_KEY` | sk_test_... | Secret | Prod/Preview/Dev |

---

## 🔐 Sécurité

### ⚠️ Important

- Ne pas commiter les clés dans Git
- Ne pas partager les clés secrètes
- Régénérer les clés régulièrement
- Monitorer l'utilisation des clés

### Fichiers à Ignorer

```
.env.local
.env.production.local
.env.development.local
```

---

## 📞 Commandes Utiles

### Tester Localement

```bash
# Démarrer le serveur de développement
npm run dev

# Aller sur http://localhost:3000/dashboard/ai
# Tester le chat IA
```

### Voir les Variables Vercel

```bash
# Télécharger les variables
vercel env pull

# Voir le fichier
cat .env.local
```

### Redéployer

```bash
# Redéployer depuis la CLI
vercel deploy --prod
```

---

## ✅ Checklist Finale

- [ ] Clé Google Gemini API générée
- [ ] `GOOGLE_GENAI_API_KEY` ajoutée sur Vercel
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` ajoutée sur Vercel
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ajoutée sur Vercel
- [ ] `CLERK_SECRET_KEY` ajoutée sur Vercel
- [ ] Projet redéployé
- [ ] IA testée et fonctionnelle
- [ ] Logs vérifiés
- [ ] Pas d'erreurs

---

## 🎉 Résumé

Après ces étapes, l'IA devrait fonctionner correctement sur Vercel!

**Durée totale:** ~10 minutes  
**Difficulté:** Facile  
**Résultat:** IA fonctionnelle en production

---

**Statut:** ✅ PRÊT À DÉPLOYER  
**Date:** 26 Janvier 2026
