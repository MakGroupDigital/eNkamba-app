# Navigation Flow Diagram

**Date**: 2026-02-04  
**Status**: ✅ Complete

## 🗺️ Application Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD MBONGO                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Scanner    │ Payer/Recevoir│   Envoyer   │ Portefeuille │  │
│  │   (Vert)     │    (Bleu)     │  (Violet)   │  (Orange)    │  │
│  └──────┬───────┴──────┬────────┴──────┬──────┴──────┬───────┘  │
└─────────┼──────────────┼────────────────┼─────────────┼──────────┘
          │              │                │             │
          ▼              ▼                ▼             ▼
    ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
    │ Scanner  │  │ Payer/Recevoir│  │ Envoyer  │  │ Wallet   │
    │  Page    │  │    Page       │  │  Page    │  │  Page    │
    └──────────┘  └──────┬────────┘  └────┬─────┘  └──────────┘
                         │                 │
                    ┌────┴────┐       ┌────┴─────────────┐
                    ▼         ▼       ▼                  ▼
              ┌─────────┐ ┌────────┐ ┌──────────────────────┐
              │ Recevoir│ │ Payer  │ │ Sélection Méthode    │
              │ (QR)    │ │(Méthode)│ │ ┌────────────────┐  │
              └─────────┘ └────────┘ │ │ • Email        │  │
                                     │ │ • Phone        │  │
                                     │ │ • Card         │  │
                                     │ │ • Account      │  │
                                     │ │ • Scanner (QR) │  │
                                     │ └────────────────┘  │
                                     └──────────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Destinataire     │
                                     │ (Recherche)      │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Montant          │
                                     │ (Saisie)         │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Confirmation     │
                                     │ (Vérification)   │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Succès           │
                                     │ (Confirmation)   │
                                     └──────────────────┘
```

## 📱 Page Flows

### 1. Scanner Page
```
Scanner Page
    │
    ├─ QR Scanner (Capacitor Camera)
    │
    └─ Détecte QR Code
        │
        └─ Extrait Numéro de Compte
            │
            └─ Redirige vers Paiement
```

### 2. Payer/Recevoir Page
```
Payer/Recevoir Page
    │
    ├─ Mode Sélection
    │   ├─ [Recevoir] → Mode Recevoir
    │   └─ [Payer] → Mode Payer
    │
    ├─ Mode Recevoir
    │   ├─ Affiche QR Code Personnel
    │   └─ UnifiedReceiveFlow
    │
    └─ Mode Payer
        ├─ Sélection Méthode
        │   ├─ Scanner QR
        │   ├─ Email
        │   ├─ Phone
        │   ├─ Card
        │   └─ Account
        │
        └─ UnifiedPaymentFlow
```

### 3. Envoyer Page
```
Envoyer Page
    │
    ├─ Sélection Méthode
    │   ├─ Email
    │   ├─ Phone
    │   ├─ Card
    │   ├─ Account
    │   └─ Scanner (QR)
    │
    ├─ Saisie Destinataire
    │   └─ Recherche Utilisateur
    │
    ├─ Saisie Montant
    │   ├─ Devise
    │   ├─ Montant
    │   └─ Description (optionnel)
    │
    ├─ Confirmation
    │   └─ Vérification Détails
    │
    └─ Succès
        └─ Redirection Wallet
```

### 4. Wallet Page
```
Wallet Page
    │
    ├─ Carte eNkamba
    │   ├─ Recto (Infos Principales)
    │   │   ├─ QR Code
    │   │   ├─ Titulaire
    │   │   ├─ Compte
    │   │   ├─ Solde
    │   │   ├─ Valide
    │   │   └─ Devise
    │   │
    │   └─ Verso (Infos Sécurité)
    │       ├─ CVV
    │       ├─ Expiry
    │       └─ Sécurité
    │
    ├─ Actions Rapides
    │   ├─ [Dépôt] → Add Funds
    │   ├─ [Retrait] → Withdraw
    │   └─ [Historique] → History
    │
    ├─ Stats
    │   ├─ Solde Total
    │   ├─ Compte
    │   └─ Sécurité
    │
    └─ Transactions Récentes
        └─ Liste Transactions
```

## 🔄 User Journeys

### Journey 1: Recevoir de l'Argent
```
1. Dashboard → Payer/Recevoir
2. Cliquer "Recevoir"
3. Voir QR Code Personnel
4. Partager QR Code
5. Attendre Paiement
6. Notification Reçue
7. Retour Dashboard
```

### Journey 2: Payer par Email
```
1. Dashboard → Payer/Recevoir
2. Cliquer "Payer"
3. Sélectionner "Email"
4. Saisir Email Destinataire
5. Saisir Montant
6. Confirmer Paiement
7. Succès
8. Retour Wallet
```

### Journey 3: Envoyer par Téléphone
```
1. Dashboard → Envoyer
2. Sélectionner "Téléphone"
3. Saisir Numéro Téléphone
4. Saisir Montant
5. Ajouter Description
6. Confirmer Envoi
7. Succès
8. Retour Wallet
```

### Journey 4: Scanner QR
```
1. Dashboard → Scanner
2. Ouvrir Caméra
3. Scanner QR Code
4. Extraire Numéro Compte
5. Saisir Montant
6. Confirmer Paiement
7. Succès
8. Retour Wallet
```

### Journey 5: Consulter Portefeuille
```
1. Dashboard → Portefeuille
2. Voir Carte eNkamba
3. Voir Solde
4. Voir Transactions
5. Cliquer Dépôt/Retrait/Historique
6. Effectuer Action
7. Retour Portefeuille
```

## 🎯 Action Buttons Mapping

### Dashboard (4 Buttons)
```
┌─────────────────────────────────────────┐
│ [Scanner]    [Payer/Recevoir]           │
│ [Envoyer]    [Portefeuille]             │
└─────────────────────────────────────────┘

Scanner:
  - Icon: Scan
  - Color: Vert #32BB78
  - Href: /dashboard/scanner
  - Action: Ouvrir Scanner QR

Payer/Recevoir:
  - Icon: QrCode
  - Color: Bleu
  - Href: /dashboard/pay-receive
  - Action: Payer ou Recevoir

Envoyer:
  - Icon: SendIcon
  - Color: Violet
  - Href: /dashboard/send
  - Action: Envoyer Argent

Portefeuille:
  - Icon: CreditCard
  - Color: Orange
  - Href: /dashboard/wallet
  - Action: Voir Portefeuille
```

### Wallet (3 Buttons)
```
┌─────────────────────────────────────────┐
│ [Dépôt]      [Retrait]    [Historique]  │
└─────────────────────────────────────────┘

Dépôt:
  - Icon: ↑ (Flèche Haut)
  - Color: Vert #32BB78
  - Href: /dashboard/add-funds
  - Action: Ajouter Fonds

Retrait:
  - Icon: ↓ (Flèche Bas)
  - Color: Vert #32BB78
  - Href: /dashboard/withdraw
  - Action: Retirer Fonds

Historique:
  - Icon: ⏱ (Horloge)
  - Color: Vert #32BB78
  - Href: /dashboard/history
  - Action: Voir Historique
```

## 📊 Payment Methods (5 Total)

```
1. Scanner (QR Code)
   - Scan QR Code
   - Extract Account Number
   - Proceed to Payment

2. Email
   - Enter Email Address
   - Search User
   - Proceed to Payment

3. Phone
   - Enter Phone Number
   - Search User
   - Proceed to Payment

4. Card
   - Enter Card Number
   - Search User
   - Proceed to Payment

5. Account
   - Enter Account Number (ENK...)
   - Search User
   - Proceed to Payment
```

## ❌ Removed Methods

```
- Bluetooth (Supprimé)
- WiFi (Supprimé)
- NFC (Supprimé)
- Mobile Money (Supprimé)
```

## 🔐 Security Flow

```
User Input
    │
    ├─ Validation
    │   ├─ Format Check
    │   ├─ Amount Check
    │   └─ Balance Check
    │
    ├─ User Search
    │   ├─ Database Query
    │   └─ Verification
    │
    ├─ Confirmation
    │   ├─ Display Details
    │   └─ User Approval
    │
    └─ Transaction
        ├─ Firebase Write
        ├─ Cloud Function
        └─ Success/Error
```

---

**Navigation Map**: ✅ Complete  
**All Flows**: ✅ Documented  
**User Journeys**: ✅ Mapped
