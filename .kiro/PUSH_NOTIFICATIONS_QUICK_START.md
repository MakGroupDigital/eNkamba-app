# Push Notifications - Guide Rapide

## ✅ Ce qui est fait

1. **Fonctions Cloud créées** (`functions/src/pushNotifications.ts`):
   - `savePushToken` - Enregistre le token FCM
   - `removePushToken` - Supprime un token
   - `onUserNotificationCreated` - Envoie automatiquement un push

2. **Build functions**: ✅ OK

3. **Configuration Android**: Prête (attend google-services.json)

4. **Script de déploiement**: `deploy-push-notifications.sh`

---

## ⚠️ Actions Requises

### 1. Activer le Plan Blaze Firebase

Le déploiement des Cloud Functions nécessite le plan Blaze (facturation).

🔗 https://console.cloud.google.com/billing/linkedaccount?project=studio-1153706651-6032b

### 2. Obtenir la Clé VAPID (Web Push)

1. Aller sur Firebase Console
2. Project Settings → Cloud Messaging
3. Onglet "Web Push certificates"
4. Cliquer "Generate key pair"
5. Copier la clé (commence par `B...`)
6. Ajouter dans `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=BVotre_Clé_VAPID...
   ```

🔗 https://console.firebase.google.com/project/studio-1153706651-6032b/settings/cloudmessaging

### 3. Télécharger google-services.json (Android)

1. Firebase Console → Project Settings → General
2. Section "Your apps" → Android
3. Si pas d'app: "Add app" avec package `io.enkamba.app`
4. Télécharger `google-services.json`
5. Placer dans: `android/app/google-services.json`

🔗 https://console.firebase.google.com/project/studio-1153706651-6032b/settings/general

📖 Guide détaillé: `.kiro/GOOGLE_SERVICES_SETUP.md`

---

## 🚀 Déploiement

### Option 1: Script automatique

```bash
./deploy-push-notifications.sh
```

### Option 2: Commandes manuelles

```bash
# 1. Builder les functions
cd functions && npm run build && cd ..

# 2. Déployer
firebase deploy --only functions:savePushToken,functions:removePushToken,functions:onUserNotificationCreated

# 3. Vérifier
firebase functions:list
```

---

## 🧪 Test des Notifications

### Web (PWA)

1. Ouvrir http://localhost:9002
2. Accepter les permissions de notification
3. Créer une notification test dans Firestore:

```javascript
// Console Firebase Firestore
db.collection('users').doc('USER_ID').collection('notifications').add({
  title: 'Test Push',
  message: 'Notification de test',
  type: 'system',
  actionUrl: '/dashboard',
  read: false,
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Android (APK)

1. S'assurer que `google-services.json` est en place
2. Rebuild l'APK: `npm run cap:build:android`
3. Installer sur un appareil physique
4. Créer une notification test (même méthode)

---

## 📚 Documentation Complète

- **Déploiement détaillé**: `.kiro/PUSH_NOTIFICATIONS_DEPLOYMENT.md`
- **Config Android**: `.kiro/GOOGLE_SERVICES_SETUP.md`
- **Code source**: `functions/src/pushNotifications.ts`

---

## 🔧 Troubleshooting

### "Plan Blaze requis"
→ Activer la facturation Firebase

### "VAPID key not found"
→ Ajouter `NEXT_PUBLIC_FIREBASE_VAPID_KEY` dans `.env.local`

### "google-services.json not found"
→ Télécharger et placer dans `android/app/`

### Notifications non reçues
→ Vérifier les logs: `firebase functions:log --only onUserNotificationCreated`

---

## ✅ Checklist

- [ ] Plan Blaze activé
- [ ] VAPID key ajoutée dans .env.local
- [ ] VAPID key ajoutée dans Vercel
- [ ] google-services.json téléchargé
- [ ] google-services.json placé dans android/app/
- [ ] Functions déployées
- [ ] Test web réussi
- [ ] Test Android réussi

---

**Status Actuel**: Prêt pour déploiement (nécessite plan Blaze + config VAPID + google-services.json)
