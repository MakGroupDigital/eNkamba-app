# Déploiement Push Notifications Firebase

## État Actuel

✅ **Fonctions créées**: `savePushToken`, `removePushToken`, `onUserNotificationCreated`
✅ **Build functions**: OK
✅ **Android config**: Prêt pour google-services.json
⚠️ **Déploiement bloqué**: Nécessite plan Blaze Firebase (facturation)
⚠️ **VAPID Key**: À configurer

---

## 1. Déployer les Cloud Functions

### Prérequis
Le projet Firebase doit être sur le **plan Blaze** (facturation activée).

### Commande de déploiement
```bash
firebase deploy --only functions:savePushToken,functions:removePushToken,functions:onUserNotificationCreated
```

### Fonctions déployées
- **savePushToken**: Enregistre le token FCM de l'utilisateur
- **removePushToken**: Supprime un token (logout, changement appareil)
- **onUserNotificationCreated**: Trigger automatique qui envoie un push dès qu'une notification est créée dans Firestore

---

## 2. Configurer VAPID Key (Web Push)

### Obtenir la clé VAPID

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet: **studio-1153706651-6032b**
3. Project Settings → Cloud Messaging
4. Onglet "Web Push certificates"
5. Cliquer sur "Generate key pair" si aucune clé n'existe
6. Copier la clé publique (commence par `B...`)

### Ajouter dans .env.local

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BVotre_Clé_VAPID_Ici...
```

### Ajouter dans Vercel (Production)

```bash
vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

Ou via le dashboard Vercel:
- Settings → Environment Variables
- Ajouter `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- Valeur: La clé VAPID copiée

---

## 3. Configurer Android (google-services.json)

### Télécharger google-services.json

1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General
3. Section "Your apps" → Android app
4. Si pas d'app Android, cliquer "Add app" et suivre les étapes:
   - Package name: `io.enkamba.app`
   - App nickname: eNkamba
   - SHA-1: (optionnel pour push)
5. Télécharger `google-services.json`

### Placer le fichier

```bash
# Copier google-services.json dans:
android/app/google-services.json
```

### Vérifier la config

Le fichier `android/app/build.gradle` est déjà configuré pour détecter automatiquement `google-services.json`:

```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

---

## 4. Vérifier Firebase Cloud Messaging

### Console Firebase

1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Cloud Messaging
3. Vérifier que:
   - ✅ Cloud Messaging API est activé
   - ✅ Firebase Cloud Messaging API (V1) est activé
   - ✅ Web Push certificates existe (clé VAPID)
   - ✅ Android app est enregistrée

### Activer les APIs nécessaires

Si besoin, activer manuellement:
- [Cloud Messaging API](https://console.cloud.google.com/apis/library/fcm.googleapis.com)
- [Firebase Cloud Messaging API](https://console.cloud.google.com/apis/library/fcmregistrations.googleapis.com)

---

## 5. Tester les Notifications

### Web (PWA)

1. Ouvrir l'app en local: http://localhost:9002
2. Accepter les permissions de notification
3. Le token FCM sera enregistré automatiquement
4. Créer une notification test dans Firestore:

```javascript
// Dans la console Firebase Firestore
db.collection('users').doc('USER_ID').collection('notifications').add({
  title: 'Test Push',
  message: 'Notification de test',
  type: 'system',
  actionUrl: '/dashboard',
  read: false,
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

5. La notification push devrait apparaître

### Android (APK)

1. Builder l'APK avec google-services.json en place
2. Installer sur un appareil physique
3. Accepter les permissions de notification
4. Créer une notification test (même méthode que web)
5. La notification push devrait apparaître

---

## 6. Structure des Notifications

### Format Firestore

```typescript
{
  title: string;           // Titre de la notification
  message: string;         // Corps du message
  type: string;           // 'transfer' | 'payment' | 'system' | etc.
  actionUrl: string;      // URL de redirection
  read: boolean;          // État de lecture
  transactionId?: string; // ID transaction (optionnel)
  requestId?: string;     // ID requête (optionnel)
  createdAt: Timestamp;   // Date de création
}
```

### Payload FCM envoyé

```typescript
{
  tokens: string[];       // Tokens FCM des appareils
  notification: {
    title: string;
    body: string;
  },
  data: {
    notificationId: string;
    type: string;
    actionUrl: string;
    transactionId?: string;
    requestId?: string;
  },
  android: {
    priority: 'high',
    notification: {
      channelId: 'enkamba_general'
    }
  },
  webpush: {
    headers: { Urgency: 'high' },
    notification: {
      title: string;
      body: string;
      icon: '/enkamba-logo.png';
      badge: '/favicon.png';
    }
  }
}
```

---

## 7. Checklist Finale

### Avant déploiement

- [ ] Plan Blaze activé sur Firebase
- [ ] VAPID Key générée et ajoutée dans .env.local
- [ ] VAPID Key ajoutée dans Vercel
- [ ] google-services.json téléchargé
- [ ] google-services.json placé dans android/app/
- [ ] Cloud Messaging API activé
- [ ] Functions buildées: `npm run build` (dans functions/)

### Déploiement

- [ ] Functions déployées: `firebase deploy --only functions:savePushToken,functions:removePushToken,functions:onUserNotificationCreated`
- [ ] Frontend redéployé sur Vercel (avec VAPID key)
- [ ] APK rebuildé avec google-services.json

### Tests

- [ ] Test web: Notification reçue sur navigateur
- [ ] Test Android: Notification reçue sur APK
- [ ] Test cleanup: Tokens invalides supprimés automatiquement
- [ ] Test multi-device: Notification reçue sur tous les appareils

---

## 8. Commandes Rapides

```bash
# Builder les functions
cd functions && npm run build && cd ..

# Déployer les functions push
firebase deploy --only functions:savePushToken,functions:removePushToken,functions:onUserNotificationCreated

# Vérifier les functions déployées
firebase functions:list

# Voir les logs des functions
firebase functions:log --only savePushToken,onUserNotificationCreated

# Tester une function localement
firebase emulators:start --only functions

# Rebuild APK avec google-services.json
npm run cap:build:android
```

---

## 9. Troubleshooting

### Erreur: "Plan Blaze requis"
→ Activer la facturation: https://console.cloud.google.com/billing/linkedaccount?project=studio-1153706651-6032b

### Erreur: "VAPID key not found"
→ Vérifier que `NEXT_PUBLIC_FIREBASE_VAPID_KEY` est bien défini

### Erreur: "google-services.json not found"
→ Télécharger depuis Firebase Console et placer dans `android/app/`

### Notifications non reçues
→ Vérifier les logs: `firebase functions:log --only onUserNotificationCreated`
→ Vérifier que le token est bien enregistré dans Firestore: `users/{userId}/pushTokens`

### Token invalide
→ La function nettoie automatiquement les tokens invalides

---

## Fichiers Concernés

- `functions/src/pushNotifications.ts` - Fonctions Cloud
- `functions/src/index.ts` - Export des fonctions
- `.env.local` - Config locale (VAPID key)
- `android/app/google-services.json` - Config Android FCM
- `android/app/build.gradle` - Config gradle Android

---

**Status**: Prêt pour déploiement (nécessite plan Blaze + VAPID key + google-services.json)
