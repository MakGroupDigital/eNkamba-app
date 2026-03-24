# Système eSIM-eNkamba

## 📱 Vue d'ensemble

Le système eSIM-eNkamba permet aux utilisateurs d'acheter et de gérer des numéros de téléphone virtuels congolais (+243 07...) directement depuis l'application eNkamba.

## ✅ Fonctionnalités Implémentées

### 1. Page des Services
**Fichier**: `src/app/dashboard/partner-services/page.tsx`

**Modifications**:
- ✅ Titre changé de "Services Partenaires" à "Factures et autres Services"
- ✅ Ajout de l'eSIM-eNkamba comme premier service
- ✅ Redirection spéciale vers la page d'achat d'eSIM

**Détails du service eSIM**:
- Prix: 1000 CDF
- Catégorie: Télécommunication
- Description: Numéro virtuel RDC (+243 07...) - Activation instantanée
- Note: 4.9/5 (1247 avis)

### 2. Page d'Achat d'eSIM
**Fichier**: `src/app/dashboard/esim/purchase/page.tsx`

**Flux d'achat en 4 étapes**:

#### Étape 1: Information
- Présentation des fonctionnalités de l'eSIM
- Avantages: activation instantanée, numéro RDC authentique, gestion complète
- Affichage du prix: 1000 CDF

#### Étape 2: Sélection du numéro
- Liste des numéros disponibles (format: +243 07XX XXX XXX)
- Sélection interactive avec confirmation visuelle
- Bouton d'actualisation pour charger de nouveaux numéros
- Vérification du solde en temps réel

#### Étape 3: Confirmation
- Récapitulatif de l'achat
- Affichage du numéro choisi
- Calcul du nouveau solde après achat
- Boutons Retour/Confirmer

#### Étape 4: Succès
- Confirmation visuelle avec icône de succès
- Affichage du numéro activé
- Informations de l'eSIM (ID, statut, date d'activation)
- Boutons pour gérer l'eSIM ou retourner aux services

**Gestion des erreurs**:
- ✅ Solde insuffisant → Redirection vers recharge
- ✅ Aucun numéro disponible → Bouton réessayer
- ✅ Erreur d'achat → Message d'erreur + retour à la confirmation

### 3. Page de Gestion des eSIMs
**Fichier**: `src/app/dashboard/esim/manage/page.tsx`

**Fonctionnalités**:

#### Vue d'ensemble
- Liste de tous les eSIMs de l'utilisateur
- Sélection d'un eSIM pour voir les détails
- Bouton pour acheter un nouvel eSIM
- Compteur du nombre d'eSIMs actifs

#### Cartes de statistiques
- Statut de l'eSIM (Actif/Suspendu/Expiré)
- Nombre d'appels reçus
- Nombre de SMS reçus

#### Onglet Appels
- Historique des appels reçus (50 derniers)
- Type: Reçu ou Manqué
- Numéro de l'appelant
- Durée de l'appel (format MM:SS)
- Date et heure de l'appel
- Badge de statut (Reçu/Manqué)

#### Onglet SMS
- Historique des SMS reçus (50 derniers)
- Numéro de l'expéditeur
- Contenu du message
- Date et heure de réception
- Badge "Nouveau" pour les SMS non lus

#### Informations eSIM
- ID unique de l'eSIM
- Date d'activation
- Date d'expiration (si applicable)

**État vide**:
- Message si aucun eSIM n'est actif
- Bouton pour acheter le premier eSIM

## 🔌 APIs Implémentées

### 1. GET /api/esim/available-numbers
**Fichier**: `src/app/api/esim/available-numbers/route.ts`

**Fonction**: Génère et retourne une liste de numéros eSIM disponibles

**Réponse**:
```json
{
  "success": true,
  "numbers": [
    "+243 0700 123 456",
    "+243 0700 234 567",
    ...
  ]
}
```

**Format des numéros**:
- Préfixe: +243 (RDC)
- Code: 0700 (eSIM-eNkamba)
- Suffixe: 6 chiffres aléatoires
- Format affiché: +243 0700 XXX XXX

### 2. POST /api/esim/purchase
**Fichier**: `src/app/api/esim/purchase/route.ts`

**Fonction**: Achète un eSIM et débite le portefeuille

**Paramètres**:
```json
{
  "userId": "string",
  "phoneNumber": "string"
}
```

**Processus**:
1. Vérification de l'authentification
2. Vérification du solde (≥ 1000 CDF)
3. Création de l'eSIM dans Firestore
4. Création de la transaction
5. Débit du portefeuille
6. Retour des informations de l'eSIM

**Réponse**:
```json
{
  "success": true,
  "esim": {
    "id": "ESIM-...",
    "phoneNumber": "+243 0700 123 456",
    "status": "active",
    "activatedAt": "2026-03-24T...",
    "balance": 0,
    "callsReceived": 0,
    "smsReceived": 0
  },
  "transactionId": "TXN-...",
  "newBalance": 49000,
  "message": "eSIM activé avec succès"
}
```

### 3. GET /api/esim/list
**Fichier**: `src/app/api/esim/list/route.ts`

**Fonction**: Liste tous les eSIMs d'un utilisateur

**Paramètres**: `?userId=string`

**Réponse**:
```json
{
  "success": true,
  "esims": [
    {
      "id": "ESIM-...",
      "phoneNumber": "+243 0700 123 456",
      "status": "active",
      "activatedAt": "2026-03-24T...",
      "callsReceived": 15,
      "smsReceived": 8
    }
  ],
  "count": 1
}
```

### 4. GET /api/esim/call-logs
**Fichier**: `src/app/api/esim/call-logs/route.ts`

**Fonction**: Récupère l'historique des appels d'un eSIM

**Paramètres**: `?esimId=string`

**Réponse**:
```json
{
  "success": true,
  "calls": [
    {
      "id": "CALL-...",
      "from": "+243 812 345 678",
      "duration": 125,
      "timestamp": "2026-03-24T...",
      "type": "incoming"
    }
  ],
  "count": 15
}
```

### 5. GET /api/esim/sms-logs
**Fichier**: `src/app/api/esim/sms-logs/route.ts`

**Fonction**: Récupère l'historique des SMS d'un eSIM

**Paramètres**: `?esimId=string`

**Réponse**:
```json
{
  "success": true,
  "sms": [
    {
      "id": "SMS-...",
      "from": "+243 812 345 678",
      "message": "Bonjour, comment allez-vous?",
      "timestamp": "2026-03-24T...",
      "read": false
    }
  ],
  "count": 8
}
```

## 📊 Structure Firestore

### Collection: `esims`
```typescript
{
  id: string;                    // ESIM-{timestamp}-{random}
  userId: string;                // ID de l'utilisateur propriétaire
  phoneNumber: string;           // +243 0700 XXX XXX
  status: 'active' | 'suspended' | 'expired';
  activatedAt: string;           // ISO 8601
  expiresAt?: string;            // ISO 8601 (optionnel)
  balance: number;               // Solde de crédit (pour recharges futures)
  callsReceived: number;         // Compteur d'appels
  smsReceived: number;           // Compteur de SMS
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

### Collection: `esim_calls`
```typescript
{
  id: string;                    // CALL-{timestamp}-{random}
  esimId: string;                // Référence à l'eSIM
  from: string;                  // Numéro de l'appelant
  duration: number;              // Durée en secondes
  timestamp: string;             // ISO 8601
  type: 'incoming' | 'missed';   // Type d'appel
}
```

### Collection: `esim_sms`
```typescript
{
  id: string;                    // SMS-{timestamp}-{random}
  esimId: string;                // Référence à l'eSIM
  from: string;                  // Numéro de l'expéditeur
  message: string;               // Contenu du SMS
  timestamp: string;             // ISO 8601
  read: boolean;                 // Lu ou non
}
```

### Sous-collection: `users/{userId}/transactions`
```typescript
{
  id: string;                    // TXN-{timestamp}-{random}
  type: 'esim_purchase';         // Type de transaction
  amount: 1000;                  // Montant en CDF
  status: 'completed';           // Statut
  previousBalance: number;       // Solde avant
  newBalance: number;            // Solde après
  description: string;           // "Achat eSIM-eNkamba: +243..."
  timestamp: Date;               // Date de la transaction
  createdAt: string;             // ISO 8601
  esimId: string;                // ID de l'eSIM acheté
  phoneNumber: string;           // Numéro acheté
}
```

## 🎨 Design et UX

### Couleurs
- Primaire: #32BB78 (vert eNkamba)
- Succès: vert (#10b981)
- Erreur: rouge (#ef4444)
- Avertissement: jaune (#f59e0b)
- Info: bleu (#3b82f6)

### Icônes
- 📱 Smartphone: eSIM, téléphone
- ✅ CheckCircle2: Succès, actif
- ⚠️ AlertCircle: Erreur, avertissement
- 📞 PhoneCall: Appels
- 💬 MessageSquare: SMS
- ✉️ Mail: Messages
- ➕ Plus: Ajouter

### Animations
- fade-in: Apparition des pages
- hover: Effets au survol des cartes
- transition-all: Transitions fluides

## 🔐 Sécurité

### Authentification
- Vérification du token Bearer sur toutes les APIs
- Validation de l'utilisateur dans Firestore

### Validation
- Vérification du solde avant achat
- Validation des paramètres requis
- Gestion des erreurs complète

### Transactions
- Débit atomique du portefeuille
- Création simultanée de l'eSIM et de la transaction
- Rollback en cas d'erreur

## 🚀 Évolutions Futures

### Fonctionnalités à ajouter
1. **Recharge de crédit eSIM**: Ajouter du crédit pour passer des appels
2. **Historique détaillé**: Filtres par date, type, etc.
3. **Notifications**: Alertes pour nouveaux appels/SMS
4. **Transfert d'appels**: Rediriger vers un autre numéro
5. **Messagerie vocale**: Enregistrement des messages
6. **Statistiques**: Graphiques d'utilisation
7. **Partage de numéro**: Permettre à plusieurs utilisateurs d'accéder
8. **Export**: Télécharger l'historique en PDF/CSV
9. **Blocage de numéros**: Liste noire
10. **Réponses automatiques**: SMS automatiques

### Intégrations possibles
- API de téléphonie (Twilio, Vonage, etc.)
- Passerelle SMS
- Service de transcription vocale
- Système de facturation avancé

## 📝 Notes Techniques

### Format des numéros
- Tous les numéros commencent par +243 (RDC)
- Code eSIM: 0700
- Total: 10 chiffres après +243
- Exemple: +243 0700 123 456

### Prix
- Prix fixe: 1000 CDF
- Pas de frais mensuels
- Recharges futures possibles

### Limites actuelles
- Génération aléatoire des numéros (pas de vérification de disponibilité réelle)
- Pas d'intégration avec un opérateur télécom
- Historique limité à 50 entrées par type
- Pas de système de recharge de crédit

### Performance
- Chargement asynchrone des données
- Pagination des historiques
- Cache des numéros disponibles
- Optimisation des requêtes Firestore

## 🧪 Tests à Effectuer

1. ✅ Achat d'eSIM avec solde suffisant
2. ✅ Tentative d'achat avec solde insuffisant
3. ✅ Affichage de la liste des eSIMs
4. ✅ Navigation entre les onglets Appels/SMS
5. ✅ Sélection de différents eSIMs
6. ✅ Actualisation des numéros disponibles
7. ✅ Gestion de l'état vide (aucun eSIM)
8. ✅ Redirection depuis les services
9. ✅ Création de transaction dans le portefeuille
10. ✅ Affichage dans l'historique des transactions
