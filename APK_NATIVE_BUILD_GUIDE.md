# Guide de Génération APK Native eNkamba

## 🎯 Objectif
Générer une APK vraiment native qui fonctionne en plein écran sans barre de navigation du navigateur.

## ✨ Fonctionnalités Natives Configurées

### Mode Plein Écran Immersif
- ✅ Pas de barre de navigation Android visible
- ✅ Mode immersif sticky (les barres restent cachées)
- ✅ Plein écran automatique au lancement
- ✅ Réapplication automatique du mode plein écran

### Sécurité
- ✅ Protection contre les captures d'écran (FLAG_SECURE)
- ✅ Écran toujours allumé pendant l'utilisation
- ✅ Pas de redirection vers Chrome

### Configuration Native
- ✅ WebView embarqué (pas de navigateur externe)
- ✅ Chargement des fichiers locaux
- ✅ Toutes les permissions nécessaires configurées

## 🚀 Méthode 1 : Script Automatique (Recommandé)

```bash
# Exécuter le script de build
./scripts/build-native-apk.sh
```

Le script va :
1. Builder Next.js en production
2. Synchroniser avec Capacitor
3. Ouvrir Android Studio pour le build final

## 🔧 Méthode 2 : Build Manuel

### Étape 1 : Build Next.js
```bash
npm run build
```

### Étape 2 : Synchroniser Capacitor
```bash
npx cap sync android
npx cap copy android
```

### Étape 3 : Build APK Debug (Rapide)
```bash
cd android
./gradlew assembleDebug
```

L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Étape 4 : Build APK Release (Production)

#### Option A : Via Android Studio
```bash
npx cap open android
```

Dans Android Studio :
1. `Build` > `Generate Signed Bundle / APK`
2. Sélectionner `APK`
3. Créer ou sélectionner un keystore
4. Choisir `release` comme build variant
5. Cliquer sur `Finish`

#### Option B : Via Ligne de Commande
```bash
cd android
./gradlew assembleRelease
```

L'APK sera dans : `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## 🔑 Signature de l'APK (Pour Production)

### Créer un Keystore
```bash
keytool -genkey -v -keystore enkamba-release-key.keystore \
  -alias enkamba -keyalg RSA -keysize 2048 -validity 10000
```

### Configurer gradle.properties
Créer `android/gradle.properties` :
```properties
ENKAMBA_RELEASE_STORE_FILE=../enkamba-release-key.keystore
ENKAMBA_RELEASE_KEY_ALIAS=enkamba
ENKAMBA_RELEASE_STORE_PASSWORD=votre_mot_de_passe
ENKAMBA_RELEASE_KEY_PASSWORD=votre_mot_de_passe
```

### Modifier build.gradle
Dans `android/app/build.gradle`, ajouter :
```gradle
android {
    signingConfigs {
        release {
            storeFile file(ENKAMBA_RELEASE_STORE_FILE)
            storePassword ENKAMBA_RELEASE_STORE_PASSWORD
            keyAlias ENKAMBA_RELEASE_KEY_ALIAS
            keyPassword ENKAMBA_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Build APK Signée
```bash
cd android
./gradlew assembleRelease
```

## 📱 Installation sur Appareil

### Via ADB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Transfert de Fichier
1. Copier l'APK sur le téléphone
2. Ouvrir le fichier APK
3. Autoriser l'installation depuis des sources inconnues si demandé
4. Installer

## ✅ Vérifications Post-Installation

L'application doit :
- ✅ S'ouvrir en plein écran
- ✅ Ne pas afficher de barre de navigation du navigateur
- ✅ Ne pas rediriger vers Chrome
- ✅ Fonctionner complètement hors ligne (après premier chargement)
- ✅ Avoir toutes les fonctionnalités natives (caméra, contacts, etc.)

## 🐛 Dépannage

### L'app redirige vers Chrome
- Vérifier que `capacitor.config.ts` n'a pas d'URL dans `server.url`
- Vérifier que les fichiers sont bien dans `android/app/src/main/assets/public/`

### Barre de navigation visible
- Vérifier que `MainActivity.java` a bien le code de mode immersif
- Redémarrer l'app complètement

### Erreurs de build
```bash
# Nettoyer le cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

## 📦 Distribution

### Google Play Store
1. Générer une APK signée en release
2. Créer un compte développeur Google Play
3. Uploader l'APK via la console Google Play

### Distribution Directe
1. Héberger l'APK sur un serveur
2. Partager le lien de téléchargement
3. Les utilisateurs devront autoriser les sources inconnues

## 🔄 Mises à Jour

Pour chaque nouvelle version :
1. Incrémenter `versionCode` et `versionName` dans `android/app/build.gradle`
2. Rebuild l'APK
3. Redistribuer

## 📝 Notes Importantes

- **Keystore** : Garder le keystore en sécurité ! Sans lui, impossible de mettre à jour l'app sur le Play Store
- **Permissions** : Toutes les permissions sont déjà configurées dans AndroidManifest.xml
- **Mode Debug vs Release** : Debug pour tests, Release pour production
- **Taille APK** : ~50-80 MB (contient toute l'app Next.js)

## 🎨 Personnalisation

### Changer l'icône
Remplacer les fichiers dans :
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

### Changer le splash screen
Remplacer les fichiers dans :
- `android/app/src/main/res/drawable-*/splash.png`

### Changer les couleurs
Modifier `android/app/src/main/res/values/colors.xml`
