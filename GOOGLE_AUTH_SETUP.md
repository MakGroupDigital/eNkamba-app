# Configuration Google Auth pour APK Native

## Problème Actuel
L'authentification Google dans l'APK ouvre le navigateur externe et ne retourne pas correctement à l'application après la connexion.

## Solution : Utiliser Capacitor Google Auth Plugin

### 1. Obtenir le Google Client ID

#### A. Depuis Firebase Console
1. Aller sur https://console.firebase.google.com/
2. Sélectionner le projet : `studio-1153706651-6032b`
3. Aller dans `Authentication` > `Sign-in method`
4. Cliquer sur `Google` dans la liste des fournisseurs
5. Copier le `Web client ID` (commence par `xxxxx.apps.googleusercontent.com`)

#### B. Créer un OAuth Client ID Android (si nécessaire)
1. Aller sur https://console.cloud.google.com/apis/credentials
2. Sélectionner le projet Firebase
3. Cliquer sur `Create Credentials` > `OAuth client ID`
4. Choisir `Android`
5. Nom du package : `io.enkamba.app`
6. SHA-1 du certificat de signature :

```bash
# Pour obtenir le SHA-1 du keystore
keytool -list -v -keystore android/enkamba-release-key.jks -alias enkamba -storepass enkamba2024 -keypass enkamba2024
```

7. Copier le SHA-1 et le coller dans la console Google Cloud
8. Créer et copier le Client ID Android

### 2. Configuration dans le Code

#### A. Ajouter les variables d'environnement

Dans `.env.local` :
```env
# Google OAuth Client IDs
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
```

#### B. Configurer capacitor.config.ts

```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    forceCodeForRefreshToken: true,
  },
}
```

#### C. Configurer AndroidManifest.xml

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<application>
  <!-- ... autres configurations ... -->
  
  <!-- Google Auth -->
  <meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
</application>
```

### 3. Utiliser le Hook useCapacitorGoogleAuth

Le hook `src/hooks/useCapacitorGoogleAuth.ts` détecte automatiquement si l'app est native et utilise le bon mode d'authentification.

### 4. Modifier la Page de Login

Remplacer `handleGoogleLogin` dans `src/app/login/page.tsx` :

```typescript
import { useCapacitorGoogleAuth } from '@/hooks/useCapacitorGoogleAuth';

// Dans le composant
const { signInWithGoogle } = useCapacitorGoogleAuth();

const handleGoogleLogin = async () => {
  setIsLoading(true);
  try {
    const result = await signInWithGoogle();
    await createOrUpdateProfile(result.user.uid, result.user.email || '');
    
    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur eNkamba !",
      className: "bg-[#32BB78] text-white border-none",
    });
    
    router.push("/dashboard");
  } catch (error: any) {
    console.error("Google Login Error:", error);
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: error.message || "Impossible de se connecter avec Google."
    });
  } finally {
    setIsLoading(false);
  }
};
```

### 5. Rebuild l'APK

```bash
# Synchroniser Capacitor
npx cap sync android

# Rebuild l'APK
cd android
./gradlew assembleRelease
```

### 6. Tester

1. Installer l'APK sur un appareil Android
2. Cliquer sur "Continuer avec Google"
3. L'authentification doit se faire dans l'app sans ouvrir le navigateur
4. Après sélection du compte, l'utilisateur doit être connecté et redirigé vers le dashboard

## Avantages de cette Solution

- ✅ Pas de redirection vers le navigateur
- ✅ Expérience native fluide
- ✅ Gestion automatique des tokens
- ✅ Compatible web et mobile
- ✅ Utilise les mêmes credentials Firebase

## Dépannage

### L'authentification ne fonctionne toujours pas

1. Vérifier que le SHA-1 du keystore est bien enregistré dans Google Cloud Console
2. Vérifier que le package name est correct : `io.enkamba.app`
3. Vérifier les logs Android : `adb logcat | grep GoogleAuth`
4. S'assurer que Google Play Services est installé sur l'appareil

### Erreur "API not enabled"

1. Aller sur https://console.cloud.google.com/apis/library
2. Rechercher "Google Sign-In API"
3. Activer l'API pour le projet

### Erreur "Invalid client ID"

1. Vérifier que le Web Client ID est correct dans `.env.local`
2. Vérifier que le Client ID Android est créé avec le bon SHA-1
3. Attendre quelques minutes après la création (propagation)

## Commandes Utiles

```bash
# Obtenir le SHA-1 du keystore
keytool -list -v -keystore android/enkamba-release-key.jks -alias enkamba

# Voir les logs Android
adb logcat | grep -E "(GoogleAuth|Firebase|eNkamba)"

# Désinstaller et réinstaller l'app
adb uninstall io.enkamba.app
adb install android/app/build/outputs/apk/release/app-release.apk
```
