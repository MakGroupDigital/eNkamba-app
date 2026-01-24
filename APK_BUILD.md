# Guide de Génération APK eNkamba

## 🚀 Génération de l'APK

L'APK Android charge directement l'application depuis **https://www.enkamba.io**

### Configuration Actuelle

Le `capacitor.config.ts` est configuré pour charger l'application depuis le site déployé sur Vercel. Cela signifie que :
- ✅ Pas besoin de build statique local
- ✅ L'application reste toujours à jour (chargée depuis le web)
- ✅ Pas de problèmes avec les routes dynamiques

### Étapes pour Générer l'APK

```bash
# 1. Synchroniser Capacitor avec la configuration
npx cap sync android

# 2. Ouvrir Android Studio
npx cap open android

# 3. Dans Android Studio :
#    - Attendez que le projet se synchronise
#    - Allez dans Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - L'APK sera généré dans : android/app/build/outputs/apk/debug/app-debug.apk
```

### Configuration du Build de Production

Pour générer un APK de production (signé) :

1. Configurez les clés de signature dans `android/app/build.gradle`
2. Utilisez : `Build > Generate Signed Bundle / APK`
3. Suivez l'assistant Android Studio

### Structure de l'APK

- **App ID**: `io.enkamba.app`
- **App Name**: `eNkamba`
- **URL Source**: `https://www.enkamba.io`
- **Scheme**: `https`

### Avantages de cette Approche

✅ L'application web reste la source de vérité  
✅ Mises à jour instantanées sans republier l'APK  
✅ Pas de gestion de build statique complexe  
✅ Routes dynamiques fonctionnent parfaitement  

### Note Importante

L'APK agit comme un conteneur web (WebView) qui charge l'application depuis l'URL configurée. Toutes les fonctionnalités web sont disponibles, y compris les APIs Genkit/IA si elles sont configurées sur le serveur Vercel.
