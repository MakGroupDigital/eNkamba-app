# eNkamba - La vie simplifiée et meilleure

Écosystème digital tout-en-un : finance, e-commerce, logistique, messagerie et réseau social.

## 🚀 Déploiement Vercel

### Configuration des Variables d'Environnement

Dans Vercel Dashboard > Settings > Environment Variables, ajoutez :

```
GOOGLE_GENAI_API_KEY=votre_cle_api_gemini_ici
```

**Important**: Obtenez une nouvelle clé API Gemini sur [Google AI Studio](https://aistudio.google.com/app/apikey)

### Déploiement

```bash
# Installer Vercel CLI (si pas déjà installé)
npm i -g vercel

# Déployer
vercel

# Ou connecter le repo GitHub à Vercel pour déploiement automatique
```

## 📱 Génération APK Android (Capacitor)

```bash
# 1. Build l'application
npm run build:capacitor

# 2. Ouvrir Android Studio
npm run cap:open:android

# Dans Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

## 🛠️ Développement Local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:9002
```

## 📦 Technologies

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Capacitor** - Mobile apps
- **Google Genkit / Gemini** - IA

## 📝 Scripts Disponibles

- `npm run dev` - Développement local
- `npm run build` - Build production
- `npm run build:capacitor` - Build pour Capacitor
- `npm run cap:sync` - Synchroniser Capacitor
- `npm run cap:open:android` - Ouvrir Android Studio

## 🌐 Domaine

Application disponible sur: **enkamba.io**

## ⚠️ Sécurité

- Ne commitez JAMAIS la clé API dans le repository
- Utilisez les variables d'environnement Vercel pour la production
- La clé API doit rester secrète
