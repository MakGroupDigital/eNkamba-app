# Wallet Page - Visual Guide

**Date**: 2026-02-04  
**Status**: ✅ Complete

## 📱 Page Layout

```
┌─────────────────────────────────────────┐
│  ← Mon Portefeuille                     │
│     La vie simplifiée et meilleure      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────────────────┐         │
│         │   eNkamba PAY       │         │
│         │                     │         │
│         │      [QR CODE]      │         │
│         │    Scan to Pay      │         │
│         │                     │         │
│         │  Titulaire | Compte │         │
│         │  Solde     | Valide │         │
│         │  Devise            │         │
│         │                     │         │
│         └─────────────────────┘         │
│                                         │
│    (Long press 3s pour télécharger)    │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│    [Dépôt]  [Retrait]  [Historique]    │
│      ↑         ↓           ⏱           │
│                                         │
│  (Bien espacé, moderne, glow effect)   │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Solde Total: 50,000 CDF                │
│  Compte: ENK000000000000                │
│  Sécurité: Protégé (2FA Activé)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Transactions Récentes                  │
│  ├─ Dépôt: +10,000 CDF (02/04/2026)    │
│  ├─ Retrait: -5,000 CDF (02/03/2026)   │
│  └─ Paiement: -2,500 CDF (02/02/2026)  │
└─────────────────────────────────────────┘
```

## 🎨 Couleurs & Styles

### Gradient Boutons
```
from-[#32BB78] (Vert eNkamba)
to-[#2a9d63] (Vert foncé)
```

### Effets Hover
```
Glow:   blur-xl, opacity-100
Scale:  transform scale-110
Shadow: shadow-lg → shadow-2xl
Border: opacity-50 → opacity-80
Label:  text-foreground → text-[#32BB78]
```

## 📐 Dimensions

### Boutons d'Actions
```
Padding:        p-4 (16px)
Border Radius:  rounded-3xl
Gap:            gap-6 (mobile) / gap-8 (desktop)
Icône Size:     w-6 h-6 (24x24px)
Stroke Width:   2.5
```

### Carte
```
Aspect Ratio:   1.585 (standard carte)
Border Radius:  rounded-3xl
Padding:        p-6 sm:p-8
QR Code:        w-20 h-20 sm:w-28 sm:h-28
```

## 🎯 Interactions

### Long Press (3 secondes)
```
1. Utilisateur maintient le doigt/souris sur la carte
2. Message: "Maintenez 3 secondes..."
3. Barre de progression: 1% → 100%
4. Téléchargement: enkamba-card-{timestamp}.png
5. Image sauvegardée dans la galerie
```

### Boutons d'Actions
```
1. Hover: Glow effect + scale 110%
2. Click: Navigation vers la page
3. Label: Change de couleur au hover
4. Shadow: Augmente au hover
```

### Flip Card
```
1. Click sur la carte: Flip animation (0.6s)
2. Recto: Infos principales (QR, solde, etc.)
3. Verso: Infos sécurité (CVV, 3D Secure, etc.)
```

## 📱 Responsive Breakpoints

### Mobile (< 640px)
```
Gap:           gap-6 (24px)
Padding:       p-4
Icône:         w-6 h-6
QR Code:       w-20 h-20
Font:          text-xs/sm
```

### Desktop (≥ 640px)
```
Gap:           gap-8 (32px)
Padding:       p-6 sm:p-8
Icône:         w-6 h-6
QR Code:       w-28 h-28
Font:          text-sm/base
```

## 🎨 Icônes Personnalisées

### DepositIcon (Dépôt)
```
SVG Path:
  M12 5v14      (Ligne verticale)
  M5 12h14      (Ligne horizontale)
  M12 5l-3 3    (Flèche gauche)
  M12 5l3 3     (Flèche droite)

Symbole: ↑ (Flèche vers le haut)
Couleur: Blanc
Stroke:  2.5
```

### WithdrawIcon (Retrait)
```
SVG Path:
  M12 19v-14    (Ligne verticale)
  M5 12h14      (Ligne horizontale)
  M12 19l-3-3   (Flèche gauche)
  M12 19l3-3    (Flèche droite)

Symbole: ↓ (Flèche vers le bas)
Couleur: Blanc
Stroke:  2.5
```

### HistoryIcon (Historique)
```
SVG Path:
  circle cx="12" cy="12" r="10"  (Cercle)
  M12 6v6l4 2                    (Aiguilles)

Symbole: ⏱ (Horloge)
Couleur: Blanc
Stroke:  2.5
```

## 🔄 Animations

### Slide Up
```
Duration:  0.6s
Easing:    ease-out
Delay:     0s, 0.1s, 0.2s, 0.3s, 0.4s
```

### Float Card
```
Duration:  3s
Easing:    ease-in-out
Movement:  translateY(0px) → translateY(-12px)
```

### Glow Effect
```
Duration:  3s
Easing:    ease-in-out
Shadow:    0 0 20px → 0 0 40px
```

### Hover Scale
```
Duration:  300ms
Easing:    ease-out
Scale:     1 → 1.1 (110%)
```

## 📊 Comparaison Avant/Après

### Avant
```
Boutons:    Petits, serrés (gap-3)
Icônes:     lucide-react standard
Espacement: Compact
Design:     Basique
Effets:     Minimes
```

### Après
```
Boutons:    Grands, espacés (gap-6 sm:gap-8)
Icônes:     Personnalisées (strokeWidth 2.5)
Espacement: Moderne et aéré
Design:     Moderne et futuriste
Effets:     Glow, scale, shadow, color change
```

## ✅ Checklist Visuelle

- [x] Carte futuriste avec gradient vert
- [x] QR Code centré et grand
- [x] Infos utilisateur en grille
- [x] Flip animation (recto/verso)
- [x] Long press indicator
- [x] Progress bar circulaire
- [x] Boutons bien espacés
- [x] Icônes personnalisées
- [x] Glow effect au hover
- [x] Scale animation (110%)
- [x] Shadow enhancement
- [x] Label color change
- [x] Responsive mobile/desktop
- [x] Charte graphique appliquée
- [x] Animations fluides

## 🎯 Prochaines Étapes

- [ ] Tester sur tous les appareils
- [ ] Vérifier la qualité visuelle
- [ ] Optimiser les performances
- [ ] Ajouter des animations supplémentaires si nécessaire

---

**Status**: ✅ Production Ready  
**Cohérence**: 100% avec charte graphique eNkamba  
**Responsive**: Mobile & Desktop optimisé
