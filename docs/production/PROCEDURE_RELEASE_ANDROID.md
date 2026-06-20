# Procédure Release Android

## Version courante

- App : eNkamba
- Version : 1.3.0
- versionCode : 6
- Package : `io.enkamba.app`
- APK : `enkamba-v1.3.0-production.apk`
- SHA-256 : `cbb0681b6c99cb18ed0cddcd7a7ee615ba9384b266da9240e596f44fcde0371c`

## Commandes

Depuis la racine du projet :

```bash
npm run typecheck
npm run build
npm run apk:release
```

Pour forcer une version spécifique :

```bash
bash scripts/build-native-apk.sh 1.3.0 6
```

## Ce que fait le script

1. Met à jour `versionName` et `versionCode` dans le projet Android local.
2. Lance le build Next.js de production.
3. Synchronise Capacitor Android.
4. Génère l'APK release avec Gradle.
5. Copie l'APK finale à la racine du projet.
6. Affiche la taille et le hash SHA-256.

## Emplacement des fichiers

APK Gradle :

```text
android/app/build/outputs/apk/release/app-release.apk
```

APK distribuable :

```text
enkamba-v1.3.0-production.apk
```

## Signature

Le projet Android local utilise `android/keystore.properties` si le fichier existe. Ce fichier et le keystore ne doivent pas être commités.

À vérifier avant build :

- Le keystore est présent localement.
- L'alias correspond à la configuration.
- Les mots de passe sont corrects.
- L'APK générée s'installe comme mise à jour de la version précédente.

## Test rapide avec ADB

```bash
adb install -r enkamba-v1.3.0-production.apk
```

## Vérification signature et métadonnées

```bash
aapt dump badging enkamba-v1.3.0-production.apk
apksigner verify --verbose --print-certs enkamba-v1.3.0-production.apk
```

Si une ancienne version empêche l'installation :

```bash
adb uninstall io.enkamba.app
adb install enkamba-v1.3.0-production.apk
```

## Points d'attention

- Incrémenter `versionCode` à chaque nouvelle APK.
- Ne jamais perdre le keystore officiel.
- Ne pas commiter les fichiers `android/keystore.properties`, `*.jks` ou `*.keystore`.
- Vérifier le domaine `https://www.enkamba.io` avant diffusion.
- Tester sur téléphone physique, pas seulement sur navigateur.
