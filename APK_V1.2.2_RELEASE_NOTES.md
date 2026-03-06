# 📱 eNkamba APK v1.2.2 - Release Notes

## 📦 Informations de Build

- **Version**: 1.2.2 (versionCode: 4)
- **Date**: 6 Mars 2026
- **Taille**: 9.8 MB
- **Type**: Release signée (Production)
- **Fichier**: `enkamba-v1.2.2-google-auth.apk`

## ✨ Nouvelles Fonctionnalités

### Google OAuth Native (Capacitor Plugin)
- ✅ Plugin @codetrix-studio/capacitor-google-auth installé
- ✅ Hook useCapacitorGoogleAuth créé avec détection auto native/web
- ✅ Client IDs configurés :
  - Web: `60114170881-1h775tgj6rlku54t07dv2m12b47io2u3.apps.googleusercontent.com`
  - Android: `60114170881-8ca20582qnod6vm84ebkesfk3v9s1ee9.apps.googleusercontent.com`

### Mode Plein Écran Natif
- ✅ Mode immersif sticky (barres cachées)
- ✅ FLAG_SECURE activé (pas de captures d'écran)
- ✅ Écran toujours allumé pendant l'utilisation

### Configuration
- ✅ Keystore de production : `enkamba-release-key.jks`
- ✅ Package: `io.enkamba.app`
- ✅ SHA-1: `CC:1F:BC:30:0F:4A:A7:C5:4C:96:A2:B4:D9:C2:CC:3F:0A:90:20:9A`

## ⚠️ Problème Connu

### Google Auth Crash
**Symptôme**: L'app crash/quitte quand on clique sur "Continuer avec Google"

**Cause probable**: 
1. Le plugin Capacitor Google Auth nécessite une initialisation spéciale
2. Les Client IDs peuvent ne pas être correctement injectés
3. Possible conflit entre le mode web (chargement depuis URL) et le plugin natif

**Solutions à tester**:

#### Solution 1: Vérifier les logs Android
```bash
adb logcat | grep -E "(GoogleAuth|Capacitor|FATAL|AndroidRuntime)"
```

#### Solution 2: Initialiser GoogleAuth au démarrage de l'app
Le plugin doit être initialisé avant utilisation. Voir `GOOGLE_AUTH_FIX.md`

#### Solution 3: Utiliser les méthodes alternatives
L'app supporte déjà :
- ✅ **Authentification par Email** avec code OTP (fonctionne)
- ✅ **Authentification par Téléphone** avec code SMS (fonctionne)

## 🔄 Méthodes d'Authentification Disponibles

| Méthode | Status | Notes |
|---------|--------|-------|
| Google OAuth | ⚠️ Crash | Plugin installé mais nécessite debug |
| Email + OTP | ✅ Fonctionne | Code envoyé par email |
| Téléphone + SMS | ✅ Fonctionne | Code envoyé par SMS |

## 📋 Prochaines Étapes

### Pour Débugger Google Auth

1. **Voir les logs en temps réel**:
   ```bash
   adb logcat -c  # Clear logs
   adb logcat | grep -E "(GoogleAuth|Capacitor|FATAL)"
   ```

2. **Vérifier l'initialisation**:
   - Le plugin doit être initialisé dans `capacitor.config.ts`
   - Les Client IDs doivent être présents au runtime

3. **Tester avec mode debug**:
   ```bash
   cd android
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Alternative: Désactiver Google Auth Temporairement

Si le problème persiste, on peut désactiver le bouton Google et utiliser uniquement Email/Téléphone qui fonctionnent parfaitement.

## 📚 Documentation

- `GOOGLE_AUTH_SETUP.md` - Configuration complète
- `GOOGLE_CLIENT_IDS_SAFE.md` - Pourquoi les IDs sont publics
- `ETAPES_FINALES_GOOGLE_AUTH.md` - Guide rapide
- `src/hooks/useCapacitorGoogleAuth.ts` - Hook d'authentification

## 🔐 Sécurité

- ✅ Keystore de production utilisé
- ✅ FLAG_SECURE activé
- ✅ Mode plein écran immersif
- ✅ Toutes les permissions configurées

## 📊 Historique des Versions

- **v1.2.2** : Google Auth plugin (crash au clic) ⚠️
- **v1.2.1** : Google Auth préparation
- **v1.2.0** : APK avec chargement web
- **v1.1** : Première version APK

## 🎯 Recommandation

**Pour l'instant, utiliser les méthodes Email ou Téléphone** qui fonctionnent parfaitement. Le problème Google Auth nécessite un debug approfondi avec les logs Android.

## 📞 Debug Nécessaire

Pour résoudre le crash Google Auth, il faut :
1. Voir les logs Android complets
2. Vérifier que le plugin est correctement initialisé
3. Possiblement passer en mode "fichiers locaux" au lieu de "chargement web"

Le mode "chargement web" (server.url dans capacitor.config.ts) peut causer des conflits avec certains plugins natifs.
