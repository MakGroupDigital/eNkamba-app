# Remplacement "Encaisser" par "Investir" - Dashboard Mbongo

## Problème
Le bouton "Encaisser" s'affichait toujours dans les actions rapides du dashboard Mbongo malgré la modification du code.

## Cause
Cache de build Next.js (dossier `.next`) qui conservait l'ancienne version compilée.

## Solution Appliquée

### 1. Modification du Code
**Fichier**: `src/app/dashboard/mbongo-dashboard/page.tsx`

```tsx
const quickActions = [
  { icon: Scan, label: '🔍 Scanner', href: '/dashboard/scanner' },
  { icon: QrCode, label: '💰 Payer/Recevoir', href: '/dashboard/pay-receive' },
  { icon: TrendingUp, label: '📈 INVESTIR', href: '/dashboard/invest' }, // ✅ Changé
  { icon: CreditCardIcon, label: '💳 Portefeuille', href: '/dashboard/wallet' },
];
```

**Changements**:
- ❌ Ancien: `{ icon: Send, label: 'Encaisser', href: '/dashboard/send' }`
- ✅ Nouveau: `{ icon: TrendingUp, label: '📈 INVESTIR', href: '/dashboard/invest' }`

### 2. Nettoyage du Cache
```bash
# Supprimer le dossier de build
rm -rf .next

# Redémarrer le serveur de développement
npm run dev
```

### 3. Vérification
Après redémarrage, les 4 actions rapides doivent être:
1. 🔍 **Scanner** → `/dashboard/scanner`
2. 💰 **Payer/Recevoir** → `/dashboard/pay-receive`
3. 📈 **INVESTIR** → `/dashboard/invest` (page crypto)
4. 💳 **Portefeuille** → `/dashboard/wallet`

## Actions Requises

### Pour le Développeur
1. Arrêter le serveur: `Ctrl+C`
2. Supprimer le cache: `rm -rf .next`
3. Redémarrer: `npm run dev`
4. Vider le cache du navigateur: `Ctrl+Shift+R` (ou `Cmd+Shift+R` sur Mac)

### Pour l'Utilisateur Mobile
1. Fermer complètement l'application
2. Vider le cache de l'application dans les paramètres
3. Redémarrer l'application

## Page Investir
La page `/dashboard/invest` affiche:
- 10 cryptomonnaies disponibles
- BTC, ETH, USDT, USDC, BNB, SOL, ADA, DOT, MATIC, AVAX
- Formulaire de dépôt avec montant et adresse wallet
- Design moderne avec icônes crypto

## Fichiers Modifiés
- `src/app/dashboard/mbongo-dashboard/page.tsx` (ligne 18)

## Date
6 février 2026
