# 🔐 Pourquoi les Google OAuth Client IDs sont SAFE à Pousser sur GitHub

## ✅ C'est Sécurisé

Les Google OAuth Client IDs **ne sont PAS des secrets** et peuvent être commités sur GitHub :

### 1. Ils sont Publics par Nature
- Les Client IDs sont visibles dans le code JavaScript du navigateur
- Ils sont inclus dans l'APK Android (décompilable)
- Google les conçoit pour être publics

### 2. Protection par Restrictions
Les Client IDs sont protégés par :
- **Domaines autorisés** (pour Web) : Seuls les domaines configurés peuvent les utiliser
- **Package name + SHA-1** (pour Android) : Seule votre APK signée peut les utiliser
- **Pas d'accès aux données** : Ils ne donnent aucun accès sans authentification utilisateur

### 3. Exemples Réels
De nombreux projets open-source incluent leurs Client IDs :
- Firebase samples sur GitHub
- Applications React Native
- Applications Ionic/Capacitor

## 🔒 Ce Qui DOIT Rester Secret

Ces éléments ne doivent JAMAIS être sur GitHub :
- ❌ **API Keys privées** (Server-to-Server)
- ❌ **Service Account Keys** (Firebase Admin SDK)
- ❌ **OAuth Client Secrets** (différent du Client ID)
- ❌ **Database passwords**
- ❌ **Private keys** (.jks, .p12, etc.)

## 📋 Configuration Recommandée

### Dans `.env.production` (SAFE à commit)
```env
# Google OAuth Client IDs - Public et sécurisés par restrictions
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
```

### Dans `.gitignore` (NE PAS commit)
```
# Secrets sensibles
*.jks
*.keystore
keystore.properties
.env.local
firebase-admin-sdk.json
```

## 🎯 Workflow Recommandé

### 1. Ajouter les Client IDs dans `.env.production`
```bash
# Éditer le fichier
nano .env.production

# Ajouter vos vrais Client IDs
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=VOTRE_WEB_CLIENT_ID
NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=VOTRE_ANDROID_CLIENT_ID
```

### 2. Commit et Push sur GitHub
```bash
git add .env.production
git commit -m "config: add Google OAuth Client IDs for native auth"
git push origin main
```

### 3. L'APK Prendra les Valeurs Automatiquement
Quand vous buildez l'APK :
```bash
npx cap sync android
cd android && ./gradlew assembleRelease
```

Capacitor lit automatiquement les variables d'environnement et les inclut dans l'APK.

## 🔄 Comment Ça Marche

### Build Process
1. **Capacitor sync** lit `.env.production` ou `.env.local`
2. Les variables `NEXT_PUBLIC_*` sont injectées dans `capacitor.config.json`
3. L'APK est buildée avec ces valeurs
4. Au runtime, le plugin GoogleAuth utilise ces Client IDs

### Protection
- Le **Web Client ID** ne fonctionne que sur `www.enkamba.io` (domaine autorisé)
- L'**Android Client ID** ne fonctionne qu'avec :
  - Package : `io.enkamba.app`
  - SHA-1 : `CC:1F:BC:30:0F:4A:A7:C5:4C:96:A2:B4:D9:C2:CC:3F:0A:90:20:9A`

Même si quelqu'un copie vos Client IDs, ils ne peuvent pas les utiliser sans votre domaine ou votre certificat de signature.

## 📚 Références Officielles

- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Capacitor Environment Variables](https://capacitorjs.com/docs/guides/environment-specific-configurations)

## ✅ Conclusion

**OUI, vous pouvez pousser les Google OAuth Client IDs sur GitHub !**

Ils sont conçus pour être publics et sont protégés par les restrictions de domaine/package. C'est la méthode standard et recommandée par Google.

L'APK buildée après le push prendra automatiquement les nouvelles valeurs.
