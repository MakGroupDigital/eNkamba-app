#!/bin/bash

# Script de conversion HTML vers PDF - Version Alternative
# Supporte plusieurs outils: wkhtmltopdf, weasyprint, ou Chromium

echo "🔄 Conversion du fichier HTML en PDF..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier si le fichier HTML existe
if [ ! -f "BUSINESS_ACCOUNT_ARCHITECTURE.html" ]; then
    echo "❌ Erreur: Le fichier BUSINESS_ACCOUNT_ARCHITECTURE.html n'existe pas"
    exit 1
fi

# Essayer wkhtmltopdf
if command -v wkhtmltopdf &> /dev/null; then
    echo "✅ Outil trouvé: wkhtmltopdf"
    echo "📄 Génération du PDF..."
    wkhtmltopdf \
        --margin-top 0.5in \
        --margin-bottom 0.5in \
        --margin-left 0.5in \
        --margin-right 0.5in \
        --enable-local-file-access \
        BUSINESS_ACCOUNT_ARCHITECTURE.html \
        BUSINESS_ACCOUNT_ARCHITECTURE.pdf
    
    if [ -f "BUSINESS_ACCOUNT_ARCHITECTURE.pdf" ]; then
        echo "✅ Conversion réussie avec wkhtmltopdf!"
        exit 0
    fi
fi

# Essayer weasyprint
if command -v weasyprint &> /dev/null; then
    echo "✅ Outil trouvé: weasyprint"
    echo "📄 Génération du PDF..."
    weasyprint BUSINESS_ACCOUNT_ARCHITECTURE.html BUSINESS_ACCOUNT_ARCHITECTURE.pdf
    
    if [ -f "BUSINESS_ACCOUNT_ARCHITECTURE.pdf" ]; then
        echo "✅ Conversion réussie avec weasyprint!"
        exit 0
    fi
fi

# Essayer Chromium/Chrome
if command -v chromium &> /dev/null; then
    BROWSER="chromium"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chrome &> /dev/null; then
    BROWSER="chrome"
else
    BROWSER=""
fi

if [ -n "$BROWSER" ]; then
    echo "✅ Outil trouvé: $BROWSER"
    echo "📄 Génération du PDF..."
    $BROWSER --headless --disable-gpu --print-to-pdf="BUSINESS_ACCOUNT_ARCHITECTURE.pdf" \
        --print-to-pdf-margin-top=0.5 \
        --print-to-pdf-margin-bottom=0.5 \
        --print-to-pdf-margin-left=0.5 \
        --print-to-pdf-margin-right=0.5 \
        "file://$(pwd)/BUSINESS_ACCOUNT_ARCHITECTURE.html" 2>/dev/null
    
    if [ -f "BUSINESS_ACCOUNT_ARCHITECTURE.pdf" ]; then
        echo "✅ Conversion réussie avec $BROWSER!"
        exit 0
    fi
fi

# Si aucun outil n'est disponible
echo ""
echo "❌ Aucun outil de conversion PDF n'a été trouvé"
echo ""
echo "📦 Installation recommandée (choisir une option):"
echo ""
echo "Option 1 - wkhtmltopdf (Recommandé):"
echo "   macOS: brew install wkhtmltopdf"
echo "   Ubuntu: sudo apt-get install wkhtmltopdf"
echo "   Fedora: sudo dnf install wkhtmltopdf"
echo ""
echo "Option 2 - weasyprint:"
echo "   pip install weasyprint"
echo ""
echo "Option 3 - Chromium:"
echo "   macOS: brew install chromium"
echo "   Ubuntu: sudo apt-get install chromium-browser"
echo ""
echo "Option 4 - Conversion manuelle:"
echo "   1. Ouvrir BUSINESS_ACCOUNT_ARCHITECTURE.html dans un navigateur"
echo "   2. Appuyer sur Cmd+P (macOS) ou Ctrl+P (Windows/Linux)"
echo "   3. Sélectionner 'Enregistrer en PDF'"
echo ""
exit 1
