#!/bin/bash

# Script de déploiement des Push Notifications Firebase
# Usage: ./deploy-push-notifications.sh

set -e

echo "🚀 Déploiement Push Notifications eNkamba"
echo "=========================================="
echo ""

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécuter ce script depuis la racine du projet"
    exit 1
fi

# 1. Builder les functions
echo "📦 Build des Cloud Functions..."
cd functions
npm run build
cd ..
echo "✅ Build terminé"
echo ""

# 2. Vérifier google-services.json
echo "🔍 Vérification google-services.json..."
if [ -f "android/app/google-services.json" ]; then
    echo "✅ google-services.json trouvé"
else
    echo "⚠️  google-services.json manquant dans android/app/"
    echo "   Télécharger depuis: https://console.firebase.google.com/project/studio-1153706651-6032b/settings/general"
    echo "   Voir: .kiro/GOOGLE_SERVICES_SETUP.md"
fi
echo ""

# 3. Vérifier VAPID key
echo "🔍 Vérification VAPID key..."
if grep -q "NEXT_PUBLIC_FIREBASE_VAPID_KEY=B" .env.local 2>/dev/null; then
    echo "✅ VAPID key configurée"
else
    echo "⚠️  VAPID key manquante dans .env.local"
    echo "   Obtenir depuis: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates"
    echo "   Ajouter: NEXT_PUBLIC_FIREBASE_VAPID_KEY=BVotre_Clé..."
fi
echo ""

# 4. Déployer les functions
echo "🚀 Déploiement des Cloud Functions..."
echo "   Functions: savePushToken, removePushToken, onUserNotificationCreated"
echo ""

firebase deploy --only functions:savePushToken,functions:removePushToken,functions:onUserNotificationCreated

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifier les functions: firebase functions:list"
echo "   2. Tester les notifications (voir .kiro/PUSH_NOTIFICATIONS_DEPLOYMENT.md)"
echo "   3. Déployer sur Vercel avec VAPID key"
echo "   4. Rebuild l'APK avec google-services.json"
echo ""
