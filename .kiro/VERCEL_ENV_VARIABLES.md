# 🔐 Variables d'Environnement Vercel - IA et Configuration

**Date:** 26 Janvier 2026  
**Version:** 1.0

---

## 📋 Variables Requises pour Vercel

### 1️⃣ IA - Google Gemini API

**Variable:** `GOOGLE_GENAI_API_KEY`

```
Clé: GOOGLE_GENAI_API_KEY
Valeur: [Votre clé API Google Gemini]
Type: Secret
Scope: Production, Preview, Development
```

**Comment obtenir:**
1. Aller sur https://aistudio.google.com/app/apikey
2. Cliquer sur "Create API Key"
3. Copier la clé générée
4. Ajouter sur Vercel

**⚠️ IMPORTANT:** La clé actuelle dans `.env.local` a été compromise. Générez une nouvelle clé!

---

### 2️⃣ reCAPTCHA v2

**Variable:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

```
Clé: NEXT_PUBLIC_RECAPTCHA_SITE_KEY
Valeur: 6LfuglEsAAAAAKEs-hihNaGaobl6TFiWgG7axgw7
Type: Public (NEXT_PUBLIC_)
Scope: Production, Preview, Development
```

**Note:** Cette clé est publique (NEXT_PUBLIC_) et peut être exposée.

---

### 3️⃣ Clerk Authentication - Clé Publique

**Variable:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

```
Clé: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Valeur: pk_test_Ymxlc3NlZC1iZW5nYWwtNzcuY2xlcmsuYWNjb3VudHMuZGV2JA
Type: Public (NEXT_PUBLIC_)
Scope: Production, Preview, Development
```

**Note:** Cette clé est publique et peut être exposée.

---

### 4️⃣ Clerk Authentication - Clé Secrète

**Variable:** `CLERK_SECRET_KEY`

```
Clé: CLERK_SECRET_KEY
Valeur: sk_test_Lw77w4Q9c6LkOrqtZhU56HlSZWGFDFql64S1cakLnj
Type: Secret
Scope: Production, Preview, Development
```

**⚠️ IMPORTANT:** Cette clé est secrète. Ne pas l'exposer publiquement!

---

## 🚀 Comment Ajouter sur Vercel

### Étape 1: Accéder aux Paramètres du Projet

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `eNkamba-app`
3. Cliquer sur "Settings"
4. Cliquer sur "Environment Variables"

### Étape 2: Ajouter les Variables

Pour chaque variable:

1. Cliquer sur "Add New"
2. Entrer le nom de la variable
3. Entrer la valeur
4. Sélectionner les scopes (Production, Preview, Development)
5. Cliquer sur "Save"

### Étape 3: Redéployer

1. Aller sur "Deployments"
2. Cliquer sur le dernier déploiement
3. Cliquer sur "Redeploy"
4. Attendre la fin du déploiement

---

## 📝 Résumé des Variables

| Variable | Type | Scope | Valeur |
|----------|------|-------|--------|
| `GOOGLE_GENAI_API_KEY` | Secret | Prod/Preview/Dev | [Votre clé] |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Public | Prod/Preview/Dev | 6LfuglEsAAAAAKEs... |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Prod/Preview/Dev | pk_test_Ymxlc3... |
| `CLERK_SECRET_KEY` | Secret | Prod/Preview/Dev | sk_test_Lw77w4Q... |

---

## 🔍 Vérification

### Vérifier que les Variables Sont Correctes

```bash
# Vérifier localement
cat .env.local

# Vérifier sur Vercel
# Settings → Environment Variables
```

### Tester l'IA

1. Déployer sur Vercel
2. Aller sur https://votre-app.vercel.app/dashboard/ai
3. Tester le chat IA
4. Vérifier que les réponses fonctionnent

---

## 🛠️ Dépannage

### Erreur: "API Key Invalid"

**Solution:**
1. Vérifier que la clé est correcte
2. Générer une nouvelle clé sur https://aistudio.google.com/app/apikey
3. Mettre à jour sur Vercel
4. Redéployer

### Erreur: "reCAPTCHA Failed"

**Solution:**
1. Vérifier que la clé reCAPTCHA est correcte
2. Vérifier que le domaine est autorisé
3. Aller sur https://www.google.com/recaptcha/admin
4. Ajouter le domaine Vercel

### Erreur: "Clerk Authentication Failed"

**Solution:**
1. Vérifier que les clés Clerk sont correctes
2. Vérifier que le domaine est autorisé
3. Aller sur https://dashboard.clerk.com
4. Ajouter le domaine Vercel

---

## 📊 Variables Optionnelles

### Pour le Monitoring

```
SENTRY_DSN=https://...@sentry.io/...
```

### Pour les Logs

```
LOG_LEVEL=info
```

### Pour les Analytics

```
NEXT_PUBLIC_GA_ID=G-...
```

---

## 🔐 Bonnes Pratiques

### 1. Sécurité

- ✅ Utiliser des clés secrètes pour les données sensibles
- ✅ Utiliser NEXT_PUBLIC_ uniquement pour les données publiques
- ✅ Régulièrement régénérer les clés
- ✅ Ne pas commiter les clés dans Git

### 2. Organisation

- ✅ Utiliser des noms clairs et cohérents
- ✅ Documenter chaque variable
- ✅ Grouper les variables par service
- ✅ Utiliser des commentaires

### 3. Maintenance

- ✅ Vérifier régulièrement les clés
- ✅ Mettre à jour les clés expirées
- ✅ Monitorer les erreurs d'authentification
- ✅ Tester après chaque changement

---

## 📞 Support

### Ressources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Gemini API](https://aistudio.google.com)
- [reCAPTCHA](https://www.google.com/recaptcha/admin)
- [Clerk Documentation](https://clerk.com/docs)

### Commandes Utiles

```bash
# Voir les variables locales
cat .env.local

# Voir les variables Vercel
vercel env pull

# Tester l'IA localement
npm run dev
# Aller sur http://localhost:3000/dashboard/ai
```

---

## ✅ Checklist de Déploiement

- [ ] Générer une nouvelle clé Google Gemini API
- [ ] Ajouter `GOOGLE_GENAI_API_KEY` sur Vercel
- [ ] Ajouter `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` sur Vercel
- [ ] Ajouter `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` sur Vercel
- [ ] Ajouter `CLERK_SECRET_KEY` sur Vercel
- [ ] Redéployer le projet
- [ ] Tester l'IA sur Vercel
- [ ] Vérifier les logs
- [ ] Monitorer les erreurs

---

**Statut:** ✅ PRÊT POUR VERCEL  
**Date:** 26 Janvier 2026
