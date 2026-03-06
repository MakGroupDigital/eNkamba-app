# 🚀 eNkamba APK Release v1.2.0

## 📦 Informations de Build

- **Version**: 1.2.0 (versionCode: 3)
- **Date**: 6 Mars 2026
- **Taille**: 9.8 MB
- **Type**: Release signée (Production)
- **Fichier**: `enkamba-v1.2.0-release.apk`

## ✨ Nouvelles Fonctionnalités

### Mode Natif Plein Écran
- ✅ Application vraiment native sans redirection vers Chrome
- ✅ Mode immersif plein écran (pas de barre de navigation Android)
- ✅ WebView embarqué pour une expérience 100% native
- ✅ Réapplication automatique du mode plein écran

### Sécurité Renforcée
- ✅ Protection contre les captures d'écran (FLAG_SECURE)
- ✅ Écran toujours allumé pendant l'utilisation
- ✅ APK signée avec keystore de production

### Configuration Cloudinary
- ✅ Correction du chemin d'import pour cloudinary.config.ts
- ✅ Upload de médias fonctionnel pour Stories et Makutano

## 🔐 Signature

- **Keystore**: enkamba-release-key.jks
- **Alias**: enkamba
- **Algorithme**: RSA 2048 bits
- **Validité**: 10 000 jours
- **Organisation**: MakGroup Digital

## 📱 Installation

### Via ADB
```bash
adb install enkamba-v1.2.0-release.apk
```

### Transfert Manuel
1. Copier `enkamba-v1.2.0-release.apk` sur le téléphone
2. Ouvrir le fichier APK
3. Autoriser l'installation depuis des sources inconnues si demandé
4. Installer

## ✅ Tests Recommandés

Après installation, vérifier :
- [ ] L'app s'ouvre en plein écran
- [ ] Pas de barre de navigation du navigateur visible
- [ ] Pas de redirection vers Chrome
- [ ] Upload de photos/vidéos dans Stories fonctionne
- [ ] Upload de médias dans Makutano fonctionne
- [ ] Toutes les fonctionnalités natives (caméra, contacts, etc.)
- [ ] Navigation fluide entre les pages
- [ ] Splash screen s'affiche correctement

## 🔄 Mise à Jour depuis v1.1

Si vous avez la version 1.1 installée :
1. Désinstaller l'ancienne version (ou installer par-dessus si même signature)
2. Installer la nouvelle version
3. Les données utilisateur seront préservées

## 📝 Changements Techniques

### Fichiers Modifiés
- `capacitor.config.ts` - Configuration native sans URL externe
- `android/app/src/main/java/io/enkamba/app/MainActivity.java` - Mode immersif
- `android/app/src/main/res/values/styles.xml` - Styles plein écran
- `android/app/build.gradle` - Configuration signature et version
- `config/cloudinary.config.ts` → `src/config/cloudinary.config.ts` - Correction chemin

### Nouvelle Configuration
- `android/keystore.properties` - Configuration du keystore de production
- `android/enkamba-release-key.jks` - Keystore de signature (à garder en sécurité)

## 🐛 Corrections de Bugs

- ✅ Correction de l'erreur "Module not found: @/config/cloudinary.config"
- ✅ Suppression de la redirection vers Chrome
- ✅ Correction de l'affichage de la barre de navigation

## 🎯 Prochaines Étapes

### Pour Distribution
1. Tester l'APK sur plusieurs appareils
2. Uploader sur Google Play Console (si applicable)
3. Ou distribuer directement via lien de téléchargement

### Pour Développement
- Garder le keystore `enkamba-release-key.jks` en sécurité
- Ne jamais commiter le keystore dans Git
- Utiliser le même keystore pour toutes les futures versions

## 📊 Comparaison avec v1.1

| Fonctionnalité | v1.1 | v1.2.0 |
|----------------|------|--------|
| Taille APK | 13 MB | 9.8 MB |
| Mode Plein Écran | ❌ | ✅ |
| Redirection Chrome | ✅ (problème) | ❌ |
| Upload Cloudinary | ❌ | ✅ |
| Signature Production | ❌ | ✅ |
| Sécurité FLAG_SECURE | ❌ | ✅ |

## 🔒 Sécurité du Keystore

**IMPORTANT** : Le fichier `android/enkamba-release-key.jks` est critique :
- Ne jamais le perdre (impossible de mettre à jour l'app sans lui)
- Ne jamais le commiter dans Git
- Faire des backups sécurisés
- Garder les mots de passe en sécurité

Mots de passe actuels :
- Store Password: `enkamba2024`
- Key Password: `enkamba2024`

## 📞 Support

Pour tout problème avec cette version :
1. Vérifier les logs : `adb logcat | grep eNkamba`
2. Vérifier les permissions dans les paramètres Android
3. Réinstaller l'application si nécessaire

## 🎉 Conclusion

Cette version apporte une expérience vraiment native avec un mode plein écran immersif et toutes les fonctionnalités de l'application web dans une APK optimisée et sécurisée.
