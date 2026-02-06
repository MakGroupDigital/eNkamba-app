# 💰 Fonctionnalité de Dépôt par Cryptomonnaie

## 📋 Vue d'ensemble

Ajout d'une nouvelle méthode de dépôt dans le portefeuille eNkamba permettant aux utilisateurs d'ajouter des fonds via des cryptomonnaies populaires.

## ✨ Fonctionnalités ajoutées

### 1. Nouvelle option de paiement "Cryptomonnaie"
- Ajout d'une carte de sélection avec l'icône Bitcoin
- Design cohérent avec les autres méthodes (Mobile Money, Carte Bancaire)
- Couleur distinctive orange (#FFA500) pour se démarquer

### 2. Cryptomonnaies supportées
Les utilisateurs peuvent choisir parmi 10 cryptomonnaies populaires:

1. **Bitcoin (BTC)** - La cryptomonnaie originale
2. **Ethereum (ETH)** - Plateforme de contrats intelligents
3. **Tether (USDT)** - Stablecoin indexé sur le dollar
4. **USD Coin (USDC)** - Stablecoin réglementé
5. **Binance Coin (BNB)** - Token de l'exchange Binance
6. **Ripple (XRP)** - Réseau de paiement international
7. **Cardano (ADA)** - Blockchain de 3ème génération
8. **Solana (SOL)** - Blockchain haute performance
9. **Dogecoin (DOGE)** - Cryptomonnaie communautaire
10. **Tron (TRX)** - Plateforme de contenu décentralisé

### 3. Processus de dépôt crypto

#### Étape 1: Sélection de la méthode
- L'utilisateur clique sur la carte "Cryptomonnaie"
- Icône Bitcoin distinctive en orange

#### Étape 2: Montant
- Saisie du montant en CDF (comme les autres méthodes)

#### Étape 3: Détails crypto
- **Sélection de la cryptomonnaie**: Menu déroulant avec les 10 options
- **Adresse de portefeuille**: Champ pour entrer l'adresse crypto de l'utilisateur
- **Avertissement de sécurité**: Message rappelant que les transactions crypto sont irréversibles

#### Étape 4: Instructions détaillées
Un encadré orange avec les instructions:
1. Sélectionnez votre cryptomonnaie
2. Entrez votre adresse de portefeuille
3. Vous recevrez une adresse de dépôt eNkamba
4. Envoyez vos crypto à cette adresse
5. Les fonds seront convertis en CDF automatiquement

#### Étape 5: Confirmation
- Récapitulatif avec la crypto sélectionnée
- Affichage partiel de l'adresse (pour la sécurité)
- Message spécifique: "Conversion automatique au taux du marché"
- Note: "Fonds disponibles après confirmation blockchain"

## 🎨 Design et UX

### Couleurs
- **Icône principale**: Orange (#FFA500) pour l'identité crypto
- **Fond de carte**: Orange avec opacité (#FFA500/20)
- **Encadré d'instructions**: Bordure et fond orange clair

### Éléments visuels
- Icône Bitcoin de lucide-react
- Design cohérent avec les autres méthodes de paiement
- Responsive sur mobile et desktop

### Messages utilisateur
- Avertissements clairs sur l'irréversibilité des transactions
- Instructions étape par étape
- Informations sur la conversion automatique

## 🔧 Implémentation technique

### Fichier modifié
- `src/app/dashboard/add-funds/page.tsx`

### Changements principaux

1. **Type PaymentMethod étendu**:
```typescript
type PaymentMethod = 'mobile_money' | 'credit_card' | 'debit_card' | 'crypto';
```

2. **Nouvel état cryptoDetails**:
```typescript
const [cryptoDetails, setCryptoDetails] = useState({
  currency: 'BTC',
  walletAddress: '',
});
```

3. **Validation des détails crypto**:
- Vérification de l'adresse de portefeuille
- Message d'erreur si l'adresse est manquante

4. **Passage des données crypto au hook**:
```typescript
cryptoDetails: paymentMethod === 'crypto' ? cryptoDetails : undefined
```

## 🔄 Flux de données

```
Utilisateur sélectionne "Cryptomonnaie"
    ↓
Choisit la crypto (BTC, ETH, USDT, etc.)
    ↓
Entre son adresse de portefeuille
    ↓
Confirme le montant et les détails
    ↓
Backend génère une adresse de dépôt eNkamba
    ↓
Utilisateur envoie les crypto
    ↓
Conversion automatique en CDF
    ↓
Fonds ajoutés au portefeuille après confirmation blockchain
```

## 📱 Responsive Design

- **Mobile**: Grille 1 colonne pour les 3 méthodes de paiement
- **Desktop**: Grille 3 colonnes (Mobile Money | Carte | Crypto)
- Formulaires adaptés à toutes les tailles d'écran

## 🔐 Sécurité

### Avertissements utilisateur
- Message clair: "Les transactions crypto sont irréversibles"
- Demande de vérification de l'adresse
- Affichage partiel de l'adresse dans la confirmation

### Validation
- Vérification de la présence de l'adresse de portefeuille
- Validation du format (à implémenter côté backend)

## 🚀 Prochaines étapes

### Backend (à implémenter)
1. **Génération d'adresses de dépôt**:
   - Créer des adresses uniques pour chaque transaction
   - Associer l'adresse à l'utilisateur et au montant

2. **Monitoring blockchain**:
   - Surveiller les transactions entrantes
   - Confirmer les dépôts après X confirmations

3. **Conversion automatique**:
   - Intégration d'une API de taux de change crypto
   - Conversion en CDF au taux du marché
   - Application de frais de conversion (optionnel)

4. **Gestion des erreurs**:
   - Timeout si pas de transaction reçue
   - Remboursement en cas d'erreur
   - Support client pour les problèmes

### Améliorations futures
1. **QR Code pour l'adresse de dépôt**:
   - Générer un QR code pour faciliter l'envoi
   - Copie en un clic de l'adresse

2. **Historique des dépôts crypto**:
   - Afficher le statut de la transaction blockchain
   - Lien vers l'explorateur de blockchain

3. **Limites et frais**:
   - Définir des montants min/max
   - Afficher les frais de réseau estimés
   - Frais de conversion transparents

4. **Support de plus de cryptos**:
   - Ajouter d'autres cryptomonnaies populaires
   - Support des tokens ERC-20, BEP-20, etc.

## 📊 Avantages pour les utilisateurs

1. **Flexibilité**: Plus d'options de paiement
2. **International**: Les crypto sont sans frontières
3. **Rapidité**: Transactions plus rapides que les virements bancaires
4. **Anonymat**: Plus de confidentialité (selon la crypto)
5. **Innovation**: Positionnement moderne d'eNkamba

## 🎯 Objectifs business

1. **Acquisition**: Attirer les utilisateurs crypto
2. **Différenciation**: Se démarquer des concurrents
3. **Modernité**: Image d'innovation technologique
4. **Revenus**: Frais de conversion potentiels
5. **Expansion**: Faciliter les transactions internationales

## 📝 Notes importantes

- Cette fonctionnalité nécessite une intégration backend complète
- Les réglementations crypto varient selon les pays
- Vérifier la conformité légale en RDC
- Prévoir un support client formé aux crypto
- Documenter clairement les risques pour les utilisateurs

## ✅ Statut actuel

- ✅ Interface utilisateur complète
- ✅ Validation frontend
- ✅ Design responsive
- ⏳ Intégration backend (à faire)
- ⏳ Tests de sécurité (à faire)
- ⏳ Conformité légale (à vérifier)

---

**Date de création**: 6 février 2026
**Auteur**: Kiro AI Assistant
**Version**: 1.0
