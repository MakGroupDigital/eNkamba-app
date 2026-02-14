#!/bin/bash

# Script de conversion HTML vers PDF
# Utilise Chromium/Chrome pour une conversion de haute qualité

echo "🔄 Conversion du fichier HTML en PDF..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier si le fichier HTML existe
if [ ! -f "BUSINESS_ACCOUNT_ARCHITECTURE.html" ]; then
    echo "❌ Erreur: Le fichier BUSINESS_ACCOUNT_ARCHITECTURE.html n'existe pas"
    exit 1
fi

# Vérifier si Chromium ou Chrome est installé
if command -v chromium &> /dev/null; then
    BROWSER="chromium"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chrome &> /dev/null; then
    BROWSER="chrome"
else
    echo "❌ Erreur: Chromium ou Google Chrome n'est pas installé"
    echo "📦 Installation recommandée:"
    echo "   macOS: brew install chromium"
    echo "   Ubuntu: sudo apt-get install chromium-browser"
    echo "   Fedora: sudo dnf install chromium"
    exit 1
fi

echo "✅ Navigateur trouvé: $BROWSER"
echo ""

# Créer le PDF avec Chromium/Chrome
echo "📄 Génération du PDF..."
$BROWSER --headless --disable-gpu --print-to-pdf="BUSINESS_ACCOUNT_ARCHITECTURE.pdf" \
    --print-to-pdf-margin-top=0.5 \
    --print-to-pdf-margin-bottom=0.5 \
    --print-to-pdf-margin-left=0.5 \
    --print-to-pdf-margin-right=0.5 \
    "file://$(pwd)/BUSINESS_ACCOUNT_ARCHITECTURE.html" 2>/dev/null

# Vérifier si la conversion a réussi
if [ -f "BUSINESS_ACCOUNT_ARCHITECTURE.pdf" ]; then
    PDF_SIZE=$(du -h "BUSINESS_ACCOUNT_ARCHITECTURE.pdf" | cut -f1)
    echo ""
    echo "✅ Conversion réussie!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 Fichiers générés:"
    echo "   • BUSINESS_ACCOUNT_ARCHITECTURE.html (HTML)"
    echo "   • BUSINESS_ACCOUNT_ARCHITECTURE.pdf (PDF - $PDF_SIZE)"
    echo ""
    echo "📍 Localisation:"
    echo "   $(pwd)/BUSINESS_ACCOUNT_ARCHITECTURE.pdf"
    echo ""
    echo "🎨 Caractéristiques du PDF:"
    echo "   ✓ Design moderne selon charte Enkamba"
    echo "   ✓ Graphiques et diagrammes intégrés"
    echo "   ✓ Couleurs préservées"
    echo "   ✓ Animations CSS converties en images statiques"
    echo "   ✓ Responsive et imprimable"
    echo ""
    echo "💡 Conseils:"
    echo "   • Ouvrir avec: Adobe Reader, Preview (macOS), ou navigateur"
    echo "   • Imprimer: Fichier → Imprimer ou Cmd+P"
    echo "   • Partager: Envoyer le PDF par email ou stocker en cloud"
else
    echo "❌ Erreur lors de la conversion"
    exit 1
fi
