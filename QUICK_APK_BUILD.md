# 🚀 Génération Rapide de l'APK Native

## ✅ Configuration Terminée

L'application est maintenant configurée pour fonctionner en mode natif plein écran :
- ✅ Pas de redirection vers Chrome
- ✅ Pas de barre de navigation du navigateur
- ✅ Mode plein écran immersif
- ✅ WebView embarqué natif

## 📱 Générer l'APK Maintenant

### Option 1 : APK Debug (Rapide - Pour Tests)

```bash
cd android
./gradlew assembleDebug
```

L'APK sera générée dans :
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2 : Via Android Studio (Recommandé)

```bash
npx cap open android
```

Dans Android Studio :
1. Attendre que Gradle sync se termine
2. `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
3. Attendre la fin du build
4. Cliquer sur "locate" dans la notification

## 📲 Installer l'APK

### Sur un appareil connecté via USB :
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Transfert manuel :
1. Copier l'APK sur le téléphone
2. Ouvrir le fichier
3. Autoriser l'installation depuis des sources inconnues
4. Installer

## 🎯 Vérification

L'application doit :
- S'ouvrir en plein écran ✅
- Ne pas montrer de barre de navigation ✅
- Ne pas rediriger vers Chrome ✅
- Fonctionner complètement en mode natif ✅

## 📝 Pour une APK de Production

Voir le guide complet : `APK_NATIVE_BUILD_GUIDE.md`

## 🔧 Commandes Utiles

```bash
# Nettoyer le build
cd android && ./gradlew clean

# Rebuild complet
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug

# Voir les appareils connectés
adb devices

# Désinstaller l'ancienne version
adb uninstall io.enkamba.app
```

## ⚡ Script Automatique

```bash
./scripts/build-native-apk.sh
```

Ce script fait tout automatiquement et ouvre Android Studio.
