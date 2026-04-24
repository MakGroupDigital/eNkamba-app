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

## 📞 Serveur TURN pour Appels Audio/Vidéo

Les appels WebRTC entre réseaux différents nécessitent un serveur TURN. Le projet est prêt pour un déploiement `coturn` auto-hébergé.

### 🚀 Déploiement Rapide (Recommandé)

```bash
# Déployer automatiquement sur ton VPS
bash scripts/deploy-to-vps.sh
```

Le script va:
- ✅ Installer Docker sur le VPS
- ✅ Configurer coturn
- ✅ Ouvrir les ports nécessaires
- ✅ Générer les variables d'environnement
- ✅ Ajouter les variables à .env.local

### 📚 Documentation Complète

- **Guide rapide**: [QUICK_TURN_SETUP.md](QUICK_TURN_SETUP.md)
- **Guide détaillé**: [docs/VPS_DEPLOYMENT_GUIDE.md](docs/VPS_DEPLOYMENT_GUIDE.md)
- **Checklist**: [TURN_DEPLOYMENT_CHECKLIST.md](TURN_DEPLOYMENT_CHECKLIST.md)
- **Configuration technique**: [docs/COTURN_SETUP.md](docs/COTURN_SETUP.md)

### 🧪 Test du Serveur

```bash
# Tester la connexion au serveur TURN
bash scripts/test-turn-server.sh
```

### 🔧 Configuration Manuelle

Si tu préfères configurer manuellement:

```bash
# 1. Sur le VPS, copier le script
scp scripts/deploy-turn-vps.sh root@TON_VPS:~/

# 2. Exécuter sur le VPS
ssh root@TON_VPS
bash ~/deploy-turn-vps.sh

# 3. Sur ta machine locale, générer les variables
npm run turn:env -- turn.enkamba.com ton_user ton_password

# 4. Copier la sortie dans .env.local
```

### 📋 Ports Requis

| Port | Protocole | Usage |
|------|-----------|-------|
| 3478 | TCP/UDP | TURN standard |
| 5349 | TCP | TURNS (TLS) |
| 49152-65535 | UDP/TCP | Relais média |

### 🔐 Variables d'Environnement

Le serveur TURN utilise ces variables (générées automatiquement):

```env
NEXT_PUBLIC_WEBRTC_TURN_HOST=turn.enkamba.com
NEXT_PUBLIC_WEBRTC_TURN_PORT=3478
NEXT_PUBLIC_WEBRTC_TURN_USERNAME=ton_user
NEXT_PUBLIC_WEBRTC_TURN_PASSWORD=ton_password
# + versions encodées pour la sécurité
```

## 📦 Technologies

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Capacitor** - Mobile apps
- **Google Genkit / Gemini** - IA

## 📝 Scripts Disponibles

### Développement
- `npm run dev` - Serveur de développement (port 9002)
- `npm run build` - Build production
- `npm run start` - Démarrer en production
- `npm run lint` - Linter le code
- `npm run typecheck` - Vérifier les types TypeScript

### Mobile (Capacitor)
- `npm run build:capacitor` - Build pour Capacitor
- `npm run cap:sync` - Synchroniser Capacitor
- `npm run cap:open:android` - Ouvrir Android Studio
- `npm run cap:init` - Initialiser Capacitor
- `npm run cap:add:android` - Ajouter la plateforme Android

### TURN Server
- `npm run turn:env -- <host> <user> <pass>` - Générer les variables TURN
- `bash scripts/deploy-to-vps.sh` - Déployer TURN sur VPS
- `bash scripts/test-turn-server.sh` - Tester le serveur TURN

### IA (Genkit)
- `npm run genkit:dev` - Démarrer Genkit en mode dev
- `npm run genkit:watch` - Genkit avec hot reload

## 🌐 Domaine

Application disponible sur: **enkamba.io**

## ⚠️ Sécurité

- Ne commitez JAMAIS la clé API dans le repository
- Utilisez les variables d'environnement Vercel pour la production
- La clé API doit rester secrète
