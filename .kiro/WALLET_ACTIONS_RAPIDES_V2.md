# Actions Rapides Wallet V2 - Envoyer & Recevoir

## 🎯 Objectif

Refonte complète des actions rapides du wallet avec une approche plus intuitive :
- **Envoyer** et **Recevoir** comme actions principales
- Sous-menus avec toutes les méthodes de paiement
- Interface simplifiée et non encombrante

---

## 📱 Nouvelle Structure

### Actions Principales (2)

#### 1. 💸 Envoyer (Vert)
**Méthodes disponibles** :
- 📷 Scanner QR → `/dashboard/scanner`
- ✉️ Par Email → `/dashboard/send?method=email`
- 📱 Par Téléphone → `/dashboard/send?method=phone`
- 💳 Carte eNkamba → `/dashboard/send?method=card`
- #️⃣ N° de Compte → `/dashboard/send?method=account`
- 📲 Mobile Money → `/dashboard/send?method=mobile`

#### 2. 📥 Recevoir (Bleu)
**Méthodes disponibles** :
- 📱 Générer QR → `/dashboard/receive?method=qr`
- ✉️ Par Email → `/dashboard/receive?method=email`
- 📱 Par Téléphone → `/dashboard/receive?method=phone`
- 💳 Carte eNkamba → `/dashboard/receive?method=card`
- #️⃣ N° de Compte → `/dashboard/receive?method=account`
- 📲 Mobile Money → `/dashboard/receive?method=mobile`

### Actions Secondaires (2)

#### 3. 👥 Payer en Masse (Violet)
- Paiements groupés
- Lien : `/dashboard/pay?bulk=true`

#### 4. 🔄 Demander (Orange)
- Demander de l'argent
- Lien : `/dashboard/request`

---

## 🎨 Design & UX

### Boutons Principaux
```tsx
- Taille : Grande (p-6)
- Icône : 8x8 (w-8 h-8)
- Couleur : Dégradé avec couleur de marque
- Animation : Hover scale + shadow
- Indicateur : Barre horizontale qui pivote quand ouvert
```

### Sous-menus (Méthodes)
```tsx
- Grille : 2 colonnes (grid-cols-2)
- Fond : Blanc/90 avec hover blanc
- Icônes : 5x5 (w-5 h-5)
- Texte : 10px, centré
- Animation : slide-in-from-top
```

### Boutons Secondaires
```tsx
- Layout : Horizontal (flex items-center)
- Taille : Moyenne (p-4)
- Icône : 6x6 (w-6 h-6)
- Disposition : Icône + Texte côte à côte
```

---

## 🎭 Icônes Utilisées

### Actions Principales
| Action | Icône | Import |
|--------|-------|--------|
| Envoyer | `SendIcon` | `Send as SendIcon` |
| Recevoir | `Download` | `Download` |

### Méthodes de Paiement
| Méthode | Icône | Description |
|---------|-------|-------------|
| Scanner QR | `Scan` | Scanner un QR code |
| Générer QR | `QrCode` | Générer son QR code |
| Email | `Mail` | Paiement par email |
| Téléphone | `Phone` | Paiement par téléphone |
| Carte eNkamba | `CreditCardIcon` | Carte virtuelle eNkamba |
| N° de Compte | `Hash` | Numéro de compte ENK |
| Mobile Money | `Smartphone` | Airtel, Vodacom, Orange, etc. |

### Actions Secondaires
| Action | Icône | Description |
|--------|-------|-------------|
| Payer en Masse | `Users` | Paiements groupés |
| Demander | `Repeat` | Demander de l'argent |

---

## 💻 Code Structure

### État du Composant
```typescript
const [expandedAction, setExpandedAction] = useState<string | null>(null);
```

### Actions Principales
```typescript
const quickActions = [
  {
    icon: SendIcon,
    label: 'Envoyer',
    color: 'from-[#32BB78] to-[#2a9d63]',
    methods: [
      { icon: Scan, label: 'Scanner QR', href: '/dashboard/scanner' },
      { icon: Mail, label: 'Par Email', href: '/dashboard/send?method=email' },
      // ... autres méthodes
    ],
  },
  {
    icon: Download,
    label: 'Recevoir',
    color: 'from-blue-500 to-blue-600',
    methods: [
      { icon: QrCode, label: 'Générer QR', href: '/dashboard/receive?method=qr' },
      // ... autres méthodes
    ],
  },
];
```

### Actions Secondaires
```typescript
const secondaryActions = [
  { icon: Users, label: 'Payer en Masse', href: '/dashboard/pay?bulk=true', color: 'from-purple-500 to-purple-600' },
  { icon: Repeat, label: 'Demander', href: '/dashboard/request', color: 'from-orange-500 to-orange-600' },
];
```

---

## 🔄 Comportement Interactif

### Expansion/Collapse
1. **Clic sur "Envoyer"** → Affiche les 6 méthodes d'envoi
2. **Clic sur "Recevoir"** → Affiche les 6 méthodes de réception
3. **Clic sur l'action déjà ouverte** → Ferme le sous-menu
4. **Clic sur l'autre action** → Ferme l'ancien, ouvre le nouveau

### Animation
- **Ouverture** : `slide-in-from-top-2` (300ms)
- **Indicateur** : Rotation de 90° de la barre
- **Hover** : Scale 1.05 + shadow-2xl

---

## 📐 Taille de la Carte

### Avant
```tsx
max-width: 500px  // Trop petite, espace blanc sur les côtés
```

### Après
```tsx
max-width: 100%   // Pleine largeur du conteneur
container: max-w-4xl  // Conteneur optimisé
```

### Résultat
- ✅ Carte prend toute la largeur disponible
- ✅ Pas d'espace blanc inutile
- ✅ Meilleure utilisation de l'écran
- ✅ Plus immersif

---

## 🎯 Avantages de la V2

### 1. Clarté
- **2 actions principales** au lieu de 4
- Envoyer et Recevoir sont des actions universelles
- Moins de confusion pour l'utilisateur

### 2. Flexibilité
- **6 méthodes de paiement** pour chaque action
- Toutes les options disponibles sans encombrer
- Expansion à la demande

### 3. Simplicité
- Interface épurée par défaut
- Détails visibles uniquement quand nécessaire
- Réduction de la charge cognitive

### 4. Cohérence
- Même structure pour Envoyer et Recevoir
- Icônes cohérentes et reconnaissables
- Design uniforme

---

## 📊 Comparaison V1 vs V2

| Aspect | V1 | V2 |
|--------|----|----|
| Actions visibles | 4 | 2 principales + 2 secondaires |
| Méthodes de paiement | Cachées | 6 par action (12 total) |
| Clics pour envoyer | 1 | 2 (action + méthode) |
| Clarté | Moyenne | Excellente |
| Encombrement | Moyen | Minimal |
| Flexibilité | Limitée | Maximale |

---

## 🚀 Prochaines Étapes

### 1. Pages de Destination
Implémenter la gestion des paramètres `?method=` dans :
- `/dashboard/send`
- `/dashboard/receive`
- `/dashboard/pay`

### 2. Méthodes de Paiement
Créer les flows spécifiques pour chaque méthode :
- Email : Formulaire avec email
- Téléphone : Sélecteur de pays + numéro
- Carte : Numéro de carte eNkamba
- Compte : Numéro de compte ENK
- Mobile Money : Sélection opérateur

### 3. QR Code
- Scanner : Intégration caméra
- Générer : Affichage QR code personnel

### 4. Paiement en Masse
- Interface de sélection multiple
- Import CSV
- Validation des montants

---

## 📝 Fichiers Modifiés

### `src/app/dashboard/wallet/page.tsx`

**Imports ajoutés** :
```typescript
QrCode, Scan, Mail, Phone, CreditCard as CreditCardIcon,
Hash, Smartphone, Send as SendIcon, Download, Users, Repeat
```

**État ajouté** :
```typescript
const [expandedAction, setExpandedAction] = useState<string | null>(null);
```

**Structures de données** :
- `quickActions` : Actions principales avec sous-menus
- `secondaryActions` : Actions secondaires

**Taille de la carte** :
- Container : `max-w-4xl` (au lieu de `max-w-7xl`)
- Carte : `max-width: 100%` (au lieu de `500px`)

---

## ✅ Résultat Final

### Interface
- ✅ 2 actions principales claires (Envoyer/Recevoir)
- ✅ 6 méthodes de paiement par action
- ✅ 2 actions secondaires (Payer en Masse/Demander)
- ✅ Carte pleine largeur
- ✅ Design épuré et moderne

### UX
- ✅ Navigation intuitive
- ✅ Expansion/collapse fluide
- ✅ Animations douces
- ✅ Icônes reconnaissables

### Performance
- ✅ 0 warnings TypeScript
- ✅ Compilation rapide
- ✅ Animations performantes

---

**Date** : 2 février 2026  
**Version** : 2.0  
**Statut** : ✅ Complété  
**Actions** : 2 principales + 2 secondaires  
**Méthodes** : 6 par action principale (12 total)
