# Configuration google-services.json pour Android

## Étapes Rapides

### 1. Accéder à Firebase Console

🔗 https://console.firebase.google.com/project/studio-1153706651-6032b/settings/general

### 2. Vérifier/Ajouter l'App Android

Dans la section "Your apps":

**Si l'app Android existe déjà:**
- Cliquer sur l'icône Android
- Cliquer sur "google-services.json" pour télécharger

**Si l'app Android n'existe pas:**
1. Cliquer sur "Add app" → Icône Android
2. Remplir les informations:
   - **Android package name**: `io.enkamba.app`
   - **App nickname**: eNkamba (optionnel)
   - **Debug signing certificate SHA-1**: (optionnel, skip pour l'instant)
3. Cliquer "Register app"
4. Télécharger `google-services.json`
5. Cliquer "Next" → "Next" → "Continue to console"

### 3. Placer le Fichier

```bash
# Le fichier doit être placé ici:
android/app/google-services.json
```

**Structure attendue:**
```
android/
├── app/
│   ├── google-services.json  ← ICI
│   ├── build.gradle
│   └── src/
```

### 4. Vérifier le Contenu

Le fichier doit contenir:
```json
{
  "project_info": {
    "project_number": "889346916234",
    "project_id": "studio-1153706651-6032b",
    "storage_bucket": "studio-1153706651-6032b.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:889346916234:android:...",
        "android_client_info": {
          "package_name": "io.enkamba.app"
        }
      },
      ...
    }
  ]
}
```

### 5. Rebuild l'APK

```bash
# Synchroniser Capacitor
npm run cap:sync

# Ouvrir Android Studio
npm run cap:open:android

# Ou builder directement
npm run cap:build:android
```

---

## Vérification

### Le fichier est bien détecté si:

1. Aucun warning dans les logs Gradle:
```
✅ google-services.json found, plugin applied
```

2. Le build Android réussit sans erreur FCM

3. Les notifications push fonctionnent sur l'APK

---

## Troubleshooting

### Erreur: "google-services.json not found"
→ Vérifier le chemin: `android/app/google-services.json`
→ Pas `android/google-services.json` (mauvais emplacement)

### Erreur: "Package name mismatch"
→ Le package dans google-services.json doit être `io.enkamba.app`
→ Retélécharger avec le bon package name

### Erreur: "Invalid JSON"
→ Vérifier que le fichier n'est pas corrompu
→ Retélécharger depuis Firebase Console

---

## Fichier Actuel

**Status**: ❌ Fichier manquant
**Emplacement**: `android/app/google-services.json`
**Action requise**: Télécharger depuis Firebase Console

---

## Liens Utiles

- Firebase Console: https://console.firebase.google.com/project/studio-1153706651-6032b
- Documentation: https://firebase.google.com/docs/android/setup
- Capacitor Firebase: https://capacitorjs.com/docs/guides/push-notifications-firebase
