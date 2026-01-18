# Guide de Déploiement eNkamba

## 🚀 Déploiement sur Vercel

### 1. Configuration des Variables d'Environnement

Dans le dashboard Vercel (https://vercel.com/dashboard) :

1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez la variable suivante :

```
GOOGLE_GENAI_API_KEY=votre_nouvelle_cle_api_gemini
```

**⚠️ IMPORTANT**: La clé API précédente a été compromise. Créez une nouvelle clé sur :
https://aistudio.google.com/app/apikey

### 2. Connecter le Repository GitHub

1. Allez sur Vercel Dashboard
2. Cliquez sur **Add New Project**
3. Connectez le repository: `MakGroupDigital/eNkamba-app`
4. Vercel détectera automatiquement Next.js
5. Les variables d'environnement seront chargées depuis les settings

### 3. Déploiement Automatique

Après la connexion, Vercel déploiera automatiquement :
- À chaque push sur `main` → déploiement production
- À chaque pull request → déploiement preview

## 📱 Build pour Capacitor (APK Android)

Pour générer l'APK Android, vous devez modifier temporairement `next.config.ts` :

```typescript
output: 'export', // Décommenter cette ligne
images: {
  unoptimized: true, // Changer à true
}
```

Ensuite :

```bash
npm run build:capacitor
npm run cap:open:android
```

**Rappel**: Avant de pousser sur Vercel, remettez la config Vercel (sans `output: 'export'`).

## 🔑 Clé API Gemini

### Obtenir une nouvelle clé

1. Allez sur https://aistudio.google.com/app/apikey
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Générez une nouvelle clé API
4. Copiez la clé et ajoutez-la dans Vercel Environment Variables

### Configuration Locale

Pour le développement local, créez `.env.local` :

```
GOOGLE_GENAI_API_KEY=votre_cle_ici
```

⚠️ **Ne commitez JAMAIS** `.env.local` dans Git (déjà dans `.gitignore`)

## 🌐 Domaine

L'application sera accessible sur : **https://enkamba.io** (après configuration DNS dans Vercel)

## 📝 Notes Importantes

- Vercel utilise automatiquement les variables d'environnement pour la production
- La clé API doit être configurée dans Vercel, pas dans le code
- Pour les builds Capacitor, la config Next.js doit être modifiée temporairement
