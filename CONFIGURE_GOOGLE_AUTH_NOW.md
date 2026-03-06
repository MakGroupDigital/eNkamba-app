# 🔐 Configuration Google Auth - À FAIRE MAINTENANT

## SHA-1 de votre Keystore
```
CC:1F:BC:30:0F:4A:A7:C5:4C:96:A2:B4:D9:C2:CC:3F:0A:90:20:9A
```

## Étapes Rapides (5 minutes)

### 1. Créer OAuth Client ID Android

1. Aller sur : https://console.cloud.google.com/apis/credentials?project=studio-1153706651-6032b
2. Cliquer sur `+ CREATE CREDENTIALS` > `OAuth client ID`
3. Type d'application : `Android`
4. Nom : `eNkamba Android App`
5. Package name : `io.enkamba.app`
6. SHA-1 certificate fingerprint : `CC:1F:BC:30:0F:4A:A7:C5:4C:96:A2:B4:D9:C2:CC:3F:0A:90:20:9A`
7. Cliquer sur `CREATE`
8. **COPIER le Client ID généré** (format: `xxxxx.apps.googleusercontent.com`)

### 2. Obtenir le Web Client ID

1. Dans la même page credentials
2. Chercher le Client ID de type "Web application" ou "Web client"
3. **COPIER ce Client ID** (format: `xxxxx.apps.googleusercontent.com`)

### 3. Ajouter les Client IDs dans .env.local

Ajouter ces lignes dans `.env.local` :

```env
# Google OAuth Client IDs
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com
```

### 4. Rebuild l'APK

```bash
# Synchroniser
npx cap sync android

# Rebuild
cd android && ./gradlew assembleRelease

# Copier l'APK
cp app/build/outputs/apk/release/app-release.apk ../enkamba-v1.2.1-google-auth.apk
```

### 5. Tester

1. Installer la nouvelle APK
2. Cliquer sur "Continuer avec Google"
3. L'authentification doit se faire DANS l'app (pas dans le navigateur)
4. Après sélection du compte, connexion automatique

## Si vous n'avez pas accès à Google Cloud Console

### Option Alternative : Utiliser l'authentification Email/Téléphone

L'app supporte déjà :
- ✅ Authentification par Email avec OTP
- ✅ Authentification par Téléphone avec SMS

Ces méthodes fonctionnent parfaitement dans l'APK native.

## Vérification

Pour vérifier que tout fonctionne :

```bash
# Voir les logs en temps réel
adb logcat | grep -E "(GoogleAuth|Firebase|OAuth)"
```

## Liens Utiles

- Google Cloud Console : https://console.cloud.google.com/apis/credentials?project=studio-1153706651-6032b
- Firebase Console : https://console.firebase.google.com/project/studio-1153706651-6032b/authentication/providers
- Documentation Capacitor Google Auth : https://github.com/CodetrixStudio/CapacitorGoogleAuth

## Support

Si vous rencontrez des problèmes :
1. Vérifier que le SHA-1 est correct
2. Attendre 5-10 minutes après la création du Client ID (propagation)
3. Vérifier que Google Play Services est installé sur l'appareil
4. Essayer de désinstaller/réinstaller l'app
