# Architecture - Compte Entreprise eNkamba

## 📄 Fichiers Disponibles

### 1. **BUSINESS_ACCOUNT_ARCHITECTURE.html** (23 KB)
Fichier HTML moderne avec architecture graphique complète selon la charte Enkamba.

**Caractéristiques:**
- ✅ Design moderne et professionnel
- ✅ Graphiques et diagrammes intégrés
- ✅ Animations CSS fluides
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Couleurs selon charte Enkamba (#32BB78 vert primaire)
- ✅ Typographie Montserrat + Roboto
- ✅ Optimisé pour impression/PDF

**Contenu:**
- Objectifs et performance
- Flux d'approbation complet
- 3 Dashboards métier (Commerce, Logistique, Paiement)
- Stack technique détaillé
- Système de notifications en temps réel
- Structure des fichiers
- Caractéristiques clés

---

## 🔄 Conversion en PDF

### Option 1: Script Automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x convert-to-pdf-alternative.sh

# Lancer la conversion
./convert-to-pdf-alternative.sh
```

**Outils supportés (par ordre de préférence):**
1. **wkhtmltopdf** - Meilleure qualité
2. **weasyprint** - Bonne qualité
3. **Chromium/Chrome** - Très bonne qualité

### Option 2: Installation des Outils

#### macOS
```bash
# wkhtmltopdf (Recommandé)
brew install wkhtmltopdf

# Ou Chromium
brew install chromium

# Ou weasyprint
pip install weasyprint
```

#### Ubuntu/Debian
```bash
# wkhtmltopdf
sudo apt-get install wkhtmltopdf

# Ou Chromium
sudo apt-get install chromium-browser

# Ou weasyprint
pip install weasyprint
```

#### Fedora/RHEL
```bash
# wkhtmltopdf
sudo dnf install wkhtmltopdf

# Ou Chromium
sudo dnf install chromium

# Ou weasyprint
pip install weasyprint
```

### Option 3: Conversion Manuelle (Sans Script)

1. **Ouvrir le fichier HTML:**
   ```bash
   # macOS
   open BUSINESS_ACCOUNT_ARCHITECTURE.html
   
   # Linux
   xdg-open BUSINESS_ACCOUNT_ARCHITECTURE.html
   
   # Windows
   start BUSINESS_ACCOUNT_ARCHITECTURE.html
   ```

2. **Convertir en PDF:**
   - Appuyer sur **Cmd+P** (macOS) ou **Ctrl+P** (Windows/Linux)
   - Sélectionner **"Enregistrer en PDF"**
   - Choisir le dossier de destination
   - Cliquer sur **"Enregistrer"**

---

## 📍 Localisation des Fichiers

```
Racine du projet/
├── BUSINESS_ACCOUNT_ARCHITECTURE.html    (23 KB)
├── BUSINESS_ACCOUNT_ARCHITECTURE.pdf     (Généré après conversion)
├── convert-to-pdf.sh                     (Script principal)
├── convert-to-pdf-alternative.sh         (Script alternatif)
└── ARCHITECTURE_README.md                (Ce fichier)
```

---

## 🎨 Caractéristiques du Design

### Palette de Couleurs
- **Primaire:** #32BB78 (Vert Enkamba)
- **Blanc:** #FFFFFF
- **Noir:** #000000
- **Gris:** #E5E5E5, #B3B3B3, #737373
- **Accent:** #FFCC00 (Orange)
- **Destructif:** #DC2626 (Rouge)

### Typographie
- **Titres:** Montserrat (600, 700, 800)
- **Corps:** Roboto (400, 500, 600)
- **Code:** Fira Code (400, 500)

### Animations
- Fade In Down (Header)
- Fade In Up (Cartes)
- Hover Effects (Transitions fluides)
- Print-friendly (Animations désactivées)

---

## 📊 Contenu de l'Architecture

### 1. Vue d'Ensemble
- Objectif du système
- Performance en temps réel
- Sécurité et authentification

### 2. Flux d'Approbation
```
Soumission → En Attente → Approbation → Notification → Accès → Dashboard
```

### 3. Dashboards Métier
- **Commerce:** Catalogue, commandes, pricing B2B, marketing
- **Logistique:** Flotte, QR Scanner, tracking, stock
- **Paiement:** API Keys, webhooks, balance, rapports

### 4. Stack Technique
- Frontend: React + Next.js 14
- Base de données: Firestore (NoSQL)
- Authentification: Firebase Auth
- Temps réel: Firestore Listeners
- Styling: Tailwind CSS
- Icônes: Lucide Icons

### 5. Système de Notifications
- Notifications en temps réel
- Types: BUSINESS_APPROVED, BUSINESS_REJECTED
- Boutons CTA intégrés
- Synchronisation automatique

### 6. Structure des Fichiers
```
src/
├── app/
│   ├── admin/business-requests/
│   ├── api/business/
│   ├── dashboard/business-pro/
│   └── dashboard/settings/business-account/
├── components/business/
├── hooks/
└── types/
```

---

## 💾 Téléchargement

### Depuis le Navigateur
1. Clic droit sur **BUSINESS_ACCOUNT_ARCHITECTURE.html**
2. Sélectionner **"Enregistrer le lien sous..."**
3. Choisir le dossier de destination

### Depuis le Terminal
```bash
# Copier le fichier
cp BUSINESS_ACCOUNT_ARCHITECTURE.html ~/Downloads/

# Ou créer un lien symbolique
ln -s "$(pwd)/BUSINESS_ACCOUNT_ARCHITECTURE.html" ~/Downloads/
```

---

## 🖨️ Impression

### Depuis le Navigateur
1. Ouvrir le fichier HTML
2. Appuyer sur **Cmd+P** (macOS) ou **Ctrl+P** (Windows/Linux)
3. Configurer les paramètres:
   - Marges: Normal
   - Orientation: Portrait
   - Papier: A4
4. Cliquer sur **"Imprimer"**

### Depuis le PDF
1. Ouvrir le PDF généré
2. Appuyer sur **Cmd+P** (macOS) ou **Ctrl+P** (Windows/Linux)
3. Sélectionner l'imprimante
4. Cliquer sur **"Imprimer"**

---

## 🔍 Vérification de la Qualité

### HTML
- ✅ Responsive sur tous les écrans
- ✅ Animations fluides
- ✅ Couleurs correctes
- ✅ Typographie lisible
- ✅ Liens fonctionnels

### PDF
- ✅ Mise en page préservée
- ✅ Couleurs fidèles
- ✅ Texte sélectionnable
- ✅ Images nettes
- ✅ Marges correctes

---

## 🐛 Dépannage

### Le script ne fonctionne pas
```bash
# Vérifier les permissions
ls -l convert-to-pdf-alternative.sh

# Rendre exécutable
chmod +x convert-to-pdf-alternative.sh

# Lancer avec bash explicitement
bash convert-to-pdf-alternative.sh
```

### Aucun outil de conversion trouvé
```bash
# Installer wkhtmltopdf (recommandé)
brew install wkhtmltopdf  # macOS
sudo apt-get install wkhtmltopdf  # Ubuntu

# Ou utiliser la conversion manuelle (voir Option 3)
```

### Le PDF est vide ou mal formaté
1. Vérifier que le fichier HTML est valide
2. Essayer une autre méthode de conversion
3. Utiliser la conversion manuelle via le navigateur

### Les couleurs ne sont pas correctes
- Vérifier les paramètres d'impression
- Désactiver "Économiser l'encre"
- Utiliser "Couleur" au lieu de "Noir et blanc"

---

## 📱 Partage

### Email
```bash
# Attacher le PDF
# Sujet: Architecture - Compte Entreprise eNkamba
# Pièce jointe: BUSINESS_ACCOUNT_ARCHITECTURE.pdf
```

### Cloud Storage
```bash
# Google Drive
# Dropbox
# OneDrive
# AWS S3
```

### Collaboration
```bash
# GitHub (commit et push)
git add BUSINESS_ACCOUNT_ARCHITECTURE.*
git commit -m "docs: add business account architecture"
git push origin main
```

---

## 📝 Notes

- Le fichier HTML est **auto-contenu** (pas de dépendances externes)
- Le PDF est **optimisé pour l'impression** (marges, couleurs)
- Les animations CSS sont **converties en images statiques** dans le PDF
- Le design est **responsive** et s'adapte à tous les écrans
- La charte graphique **Enkamba est respectée** (couleurs, typographie)

---

## 🎯 Prochaines Étapes

1. ✅ Télécharger le fichier HTML
2. ✅ Convertir en PDF (script ou manuel)
3. ✅ Vérifier la qualité
4. ✅ Imprimer ou partager
5. ✅ Archiver pour documentation

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier ce README
2. Consulter les logs du script
3. Essayer une autre méthode de conversion
4. Contacter l'équipe de développement

---

**Créé:** Février 2026  
**Version:** 1.0  
**Charte:** eNkamba v1.0  
**Auteur:** eNkamba Development Team
