#!/bin/bash

# Script de génération d'APK natif pour eNkamba
# Ce script génère une APK vraiment native sans redirection vers Chrome

set -e

echo "🚀 Génération de l'APK natif eNkamba..."

# 1. Build Next.js en mode production
echo "📦 Build Next.js..."
npm run build

# 2. Synchroniser avec Capacitor
echo "🔄 Synchronisation Capacitor..."
npx cap sync android

# 3. Copier les assets
echo "📋 Copie des assets..."
npx cap copy android

# 4. Ouvrir Android Studio pour build
echo "🏗️  Ouverture d'Android Studio..."
echo ""
echo "Dans Android Studio:"
echo "1. Build > Generate Signed Bundle / APK"
echo "2. Sélectionner APK"
echo "3. Choisir le keystore (ou créer un nouveau)"
echo "4. Build en mode 'release'"
echo ""
echo "Ou pour un build debug rapide:"
echo "cd android && ./gradlew assembleDebug"
echo ""

npx cap open android
