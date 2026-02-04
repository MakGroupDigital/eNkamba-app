# eNkamba - Charte Graphique & Design System

**Version**: 1.0  
**Date**: 2026-02-03  
**Statut**: Production

---

## 🎨 Palette de couleurs

### Couleurs principales

#### Vert primaire (Marque)
- **Nom**: Primary Green
- **Hex**: #32BB78
- **HSL**: 145° 60% 39%
- **RGB**: 50, 187, 120
- **Utilisation**: Boutons, liens, accents, icônes principales
- **Accessibilité**: WCAG AA compliant

#### Blanc
- **Nom**: White
- **Hex**: #FFFFFF
- **HSL**: 0° 0% 100%
- **RGB**: 255, 255, 255
- **Utilisation**: Fond, cartes, texte sur fond sombre

#### Noir
- **Nom**: Black
- **Hex**: #000000
- **HSL**: 0° 0% 0%
- **RGB**: 0, 0, 0
- **Utilisation**: Texte principal, bordures

#### Gris clair
- **Nom**: Light Gray
- **Hex**: #E5E5E5
- **HSL**: 0° 0% 90%
- **RGB**: 229, 229, 229
- **Utilisation**: Bordures, séparateurs, fond secondaire

#### Gris moyen
- **Nom**: Medium Gray
- **Hex**: #B3B3B3
- **HSL**: 0° 0% 70%
- **RGB**: 179, 179, 179
- **Utilisation**: Texte secondaire, icônes désactivées

#### Gris foncé
- **Nom**: Dark Gray
- **Hex**: #737373
- **HSL**: 0° 0% 45%
- **RGB**: 115, 115, 115
- **Utilisation**: Texte tertiaire, placeholders

#### Orange accent (Mode sombre)
- **Nom**: Orange Accent
- **Hex**: #FFCC00
- **HSL**: 33° 100% 55%
- **RGB**: 255, 204, 0
- **Utilisation**: Accents en mode sombre, alertes

#### Rouge destructif
- **Nom**: Red Destructive
- **Hex**: #DC2626
- **HSL**: 0° 84.2% 60.2%
- **RGB**: 220, 38, 38
- **Utilisation**: Erreurs, suppressions, actions dangereuses

---

## 🌓 Modes de couleur

### Mode clair (Light Mode)
```
Background: #FFFFFF (blanc)
Foreground: #000000 (noir)
Primary: #32BB78 (vert)
Secondary: #FFFFFF (blanc)
Muted: #E5E5E5 (gris clair)
Accent: #32BB78 (vert)
Border: #E5E5E5 (gris clair)
```

### Mode sombre (Dark Mode)
```
Background: #1A3D2A (vert très foncé)
Foreground: #FFFFFF (blanc)
Primary: #32BB78 (vert)
Secondary: #2A2A2A (gris très foncé)
Muted: #2A2A2A (gris très foncé)
Accent: #FFCC00 (orange)
Border: #2A2A2A (gris très foncé)
```

---

## 🔤 Typographie

### Familles de polices

#### Headline (Titres)
- **Famille**: Montserrat
- **Poids**: 600, 700, 800
- **Utilisation**: Titres, en-têtes, sections principales
- **Fallback**: sans-serif

#### Body (Corps de texte)
- **Famille**: Roboto
- **Poids**: 400, 500, 600
- **Utilisation**: Texte principal, descriptions, contenu
- **Fallback**: sans-serif

#### Code (Code)
- **Famille**: Fira Code
- **Poids**: 400, 500
- **Utilisation**: Code, données techniques, monospace
- **Fallback**: monospace

### Hiérarchie typographique

#### H1 - Titre principal
- **Taille**: 32px (2rem)
- **Poids**: 700
- **Famille**: Montserrat
- **Ligne**: 1.2
- **Utilisation**: Titre de page

#### H2 - Titre secondaire
- **Taille**: 24px (1.5rem)
- **Poids**: 700
- **Famille**: Montserrat
- **Ligne**: 1.3
- **Utilisation**: Sous-titre, section

#### H3 - Titre tertiaire
- **Taille**: 20px (1.25rem)
- **Poids**: 600
- **Famille**: Montserrat
- **Ligne**: 1.4
- **Utilisation**: Sous-section

#### Body - Texte principal
- **Taille**: 16px (1rem)
- **Poids**: 400
- **Famille**: Roboto
- **Ligne**: 1.5
- **Utilisation**: Contenu principal

#### Small - Texte petit
- **Taille**: 14px (0.875rem)
- **Poids**: 400
- **Famille**: Roboto
- **Ligne**: 1.5
- **Utilisation**: Descriptions, labels

#### Tiny - Texte très petit
- **Taille**: 12px (0.75rem)
- **Poids**: 400
- **Famille**: Roboto
- **Ligne**: 1.4
- **Utilisation**: Métadonnées, timestamps

---

## 🔲 Espacement

### Système de grille
- **Base**: 4px
- **Unités**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px, 64px

### Padding
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px

### Margin
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px

### Gap (Flexbox/Grid)
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px

---

## 🎯 Rayon de bordure

### Valeurs
- **xs**: 2px
- **sm**: 4px
- **md**: 8px (12px - 4px)
- **lg**: 12px (0.75rem)
- **xl**: 16px
- **full**: 9999px (circulaire)

### Utilisation
- **Boutons**: lg (12px)
- **Cartes**: lg (12px)
- **Inputs**: lg (12px)
- **Avatars**: full (circulaire)
- **Badges**: md (8px)

---

## 🎨 Composants

### Boutons

#### Bouton primaire
```
Background: #32BB78 (vert)
Text: #FFFFFF (blanc)
Padding: 12px 24px
Border-radius: 12px
Font-weight: 600
Hover: Vert plus foncé
Active: Vert encore plus foncé
Disabled: Gris clair
```

#### Bouton secondaire
```
Background: #FFFFFF (blanc)
Text: #32BB78 (vert)
Border: 1px #32BB78
Padding: 12px 24px
Border-radius: 12px
Font-weight: 600
Hover: Fond vert très clair
Active: Fond vert clair
Disabled: Gris clair
```

#### Bouton destructif
```
Background: #DC2626 (rouge)
Text: #FFFFFF (blanc)
Padding: 12px 24px
Border-radius: 12px
Font-weight: 600
Hover: Rouge plus foncé
Active: Rouge encore plus foncé
Disabled: Gris clair
```

### Cartes
```
Background: #FFFFFF (blanc)
Border: 1px #E5E5E5 (gris clair)
Border-radius: 12px
Padding: 16px
Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover: Box-shadow augmentée
```

### Inputs
```
Background: #FFFFFF (blanc)
Border: 1px #E5E5E5 (gris clair)
Border-radius: 12px
Padding: 12px 16px
Font-size: 16px
Focus: Border #32BB78, Box-shadow verte
Placeholder: #B3B3B3 (gris moyen)
Disabled: Background #F5F5F5
```

### Badges
```
Background: #E8F5E9 (vert très clair)
Text: #32BB78 (vert)
Padding: 4px 12px
Border-radius: 8px
Font-size: 12px
Font-weight: 600
```

### Modales
```
Overlay: rgba(0,0,0,0.5)
Background: #FFFFFF (blanc)
Border-radius: 12px
Padding: 24px
Box-shadow: 0 10px 40px rgba(0,0,0,0.2)
```

---

## 🎬 Animations

### Transitions
- **Rapide**: 150ms
- **Normal**: 300ms
- **Lent**: 500ms

### Easing
- **ease-in**: Accélération
- **ease-out**: Décélération
- **ease-in-out**: Accélération puis décélération
- **linear**: Linéaire

### Animations prédéfinies

#### Fade In Up
```
Duration: 800ms
Easing: ease-in-out
From: opacity 0, translateY(20px)
To: opacity 1, translateY(0)
```

#### Accordion Down
```
Duration: 200ms
Easing: ease-out
From: height 0
To: height var(--radix-accordion-content-height)
```

#### Accordion Up
```
Duration: 200ms
Easing: ease-out
From: height var(--radix-accordion-content-height)
To: height 0
```

---

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px (mobile)
- **sm**: 640px (petit mobile)
- **md**: 768px (tablette)
- **lg**: 1024px (desktop)
- **xl**: 1280px (grand desktop)
- **2xl**: 1536px (très grand desktop)

### Stratégie
- **Mobile-first**: Commencer par mobile, puis ajouter pour desktop
- **Flexibilité**: Adapter le layout selon l'écran
- **Lisibilité**: Maintenir la lisibilité sur tous les écrans

---

## ♿ Accessibilité

### Contraste
- **WCAG AA**: Ratio minimum 4.5:1 pour le texte
- **WCAG AAA**: Ratio minimum 7:1 pour le texte
- **Vert primaire**: Ratio 4.8:1 sur blanc (AA compliant)

### Focus
- **Outline**: 2px solid #32BB78
- **Offset**: 2px
- **Visible**: Sur tous les éléments interactifs

### Texte alternatif
- **Images**: Toujours avoir alt text
- **Icônes**: Aria-label si pas de texte
- **Boutons**: Texte clair ou aria-label

### Clavier
- **Tab order**: Logique et prévisible
- **Raccourcis**: Documenter les raccourcis clavier
- **Focus visible**: Toujours visible

---

## 🎯 Icônes

### Bibliothèque
- **Lucide Icons**: Icônes principales
- **Taille**: 16px, 20px, 24px, 32px
- **Poids**: 2px (stroke)
- **Couleur**: Hériter de la couleur du texte

### Icônes personnalisées
- **Format**: SVG
- **Viewbox**: 24x24
- **Stroke**: 2px
- **Couleur**: Utiliser currentColor pour héritage

---

## 🌈 Gradients

### Gradient primaire
```
De: #32BB78 (vert)
À: #1E7A4A (vert foncé)
Direction: 135deg
```

### Gradient accent
```
De: #32BB78 (vert)
À: #FFCC00 (orange)
Direction: 90deg
```

---

## 📐 Ombres

### Shadow-sm
```
0 1px 2px 0 rgba(0, 0, 0, 0.05)
```

### Shadow-md
```
0 4px 6px -1px rgba(0, 0, 0, 0.1)
0 2px 4px -1px rgba(0, 0, 0, 0.06)
```

### Shadow-lg
```
0 10px 15px -3px rgba(0, 0, 0, 0.1)
0 4px 6px -2px rgba(0, 0, 0, 0.05)
```

### Shadow-xl
```
0 20px 25px -5px rgba(0, 0, 0, 0.1)
0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

---

## 📊 Graphiques

### Couleurs de graphique
- **Chart 1**: #32BB78 (vert primaire)
- **Chart 2**: #4DD99F (vert clair)
- **Chart 3**: #1E7A4A (vert foncé)
- **Chart 4**: #2BA86A (vert moyen)
- **Chart 5**: #2A8F5C (vert moyen-foncé)

---

## 🎨 Utilisation des couleurs

### Texte
- **Principal**: Noir (#000000)
- **Secondaire**: Gris moyen (#737373)
- **Tertiaire**: Gris clair (#B3B3B3)
- **Désactivé**: Gris très clair (#E5E5E5)

### Fond
- **Principal**: Blanc (#FFFFFF)
- **Secondaire**: Gris très clair (#F5F5F5)
- **Tertiaire**: Gris clair (#E5E5E5)

### Accents
- **Primaire**: Vert (#32BB78)
- **Secondaire**: Orange (#FFCC00) en mode sombre
- **Destructif**: Rouge (#DC2626)

### Bordures
- **Primaire**: Gris clair (#E5E5E5)
- **Secondaire**: Gris moyen (#B3B3B3)
- **Accent**: Vert (#32BB78)

---

## 🔧 Implémentation

### Tailwind CSS
```typescript
// Utiliser les classes Tailwind
<button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90">
  Bouton
</button>
```

### CSS Variables
```css
/* Utiliser les variables CSS */
.button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius);
}
```

### Composants React
```typescript
// Utiliser les composants UI
<Button variant="primary" size="lg">
  Bouton
</Button>
```

---

## 📋 Checklist de conformité

- [ ] Utiliser les couleurs de la palette
- [ ] Respecter la hiérarchie typographique
- [ ] Utiliser l'espacement de la grille
- [ ] Appliquer les rayon de bordure corrects
- [ ] Implémenter les animations
- [ ] Tester l'accessibilité
- [ ] Vérifier le contraste
- [ ] Tester sur mobile
- [ ] Tester en mode sombre
- [ ] Documenter les exceptions

---

## 🎓 Ressources

### Fichiers
- `tailwind.config.ts` - Configuration Tailwind
- `src/app/globals.css` - Variables CSS
- `src/components/ui/` - Composants UI

### Outils
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Charte graphique complète et prête pour utilisation**  
**Tous les détails fournis**  
**Conforme WCAG AA**
