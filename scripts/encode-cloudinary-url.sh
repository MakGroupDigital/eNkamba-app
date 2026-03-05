#!/bin/bash

# Script pour encoder l'URL Cloudinary en Base64
# Usage: ./scripts/encode-cloudinary-url.sh

echo "=== Encodage URL Cloudinary ==="
echo ""
echo "Format attendu: cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
echo "Cloud Name actuel: dy73hzkpm"
echo ""
echo "Obtiens tes credentials sur: https://console.cloudinary.com/settings/api-keys"
echo ""

read -p "Entre ton API Key: " API_KEY
read -sp "Entre ton API Secret: " API_SECRET
echo ""

if [ -z "$API_KEY" ] || [ -z "$API_SECRET" ]; then
    echo "❌ Erreur: API Key et API Secret sont requis"
    exit 1
fi

CLOUDINARY_URL="cloudinary://${API_KEY}:${API_SECRET}@dy73hzkpm"
ENCODED_URL=$(echo -n "$CLOUDINARY_URL" | base64)

echo ""
echo "✅ URL encodée générée avec succès!"
echo ""
echo "Ajoute cette ligne dans ton fichier .env.local:"
echo ""
echo "CLOUDINARY_URL_ENCODED=$ENCODED_URL"
echo ""
echo "⚠️  IMPORTANT: Ne partage jamais cette valeur publiquement!"
