# Système de Parrainage & Invitation eNkamba

## Vue d'ensemble

Le système de parrainage permet aux utilisateurs d'inviter leurs contacts à rejoindre eNkamba. Les utilisateurs reçoivent un code de parrainage unique qui peut être partagé via SMS ou lien.

## Architecture

### 1. Génération du Code de Parrainage

**Hook:** `useReferralCode()`

```typescript
const { referralCode, getOrCreateReferralCode } = useReferralCode();

// Obtenir ou créer le code
const code = getOrCreateReferralCode(); // ENK1234567ABC
```

**Format du code:** `ENK` + timestamp + caractères aléatoires
- Exemple: `ENKA1B2C3D4E5F`
- Unique par utilisateur
- Stocké en localStorage

### 2. Flux d'Invitation

#### Étape 1: Accès aux Contacts
```
Utilisateur clique "Commencer la discussion"
    ↓
Dialog demande permission d'accès aux contacts
    ↓
Utilisateur autorise
    ↓
Contacts chargés et triés
```

#### Étape 2: Affichage des Contacts
```
Onglet 1: Contacts sur eNkamba
  - Affiche les contacts qui utilisent déjà eNkamba
  - Bouton "Message" pour discuter

Onglet 2: Inviter
  - Affiche les contacts qui ne sont pas sur eNkamba
  - Bouton "Envoyer invitation"
```

#### Étape 3: Envoi d'Invitation
```
Utilisateur clique "Envoyer invitation"
    ↓
SMS natif s'ouvre avec message pré-rempli
    ↓
Message contient:
  - Code d'invitation unique
  - Lien de téléchargement
  - Lien d'inscription avec code: https://enkamba.io/join?ref=ENK123ABC
```

### 3. Inscription avec Code de Parrainage

#### Via Lien d'Invitation
```
Utilisateur clique sur lien: https://enkamba.io/join?ref=ENK123ABC
    ↓
Page de login charge avec paramètre ?ref=ENK123ABC
    ↓
Hook useReferralCode détecte le code
    ↓
Code sauvegardé en localStorage
    ↓
Utilisateur complète l'inscription
    ↓
Code de parrainage utilisé automatiquement
```

#### Via Saisie Manuelle
```
Page d'inscription affiche champ optionnel "Code de parrainage"
    ↓
Utilisateur peut entrer le code manuellement
    ↓
Ou laisser vide → Code généré automatiquement
    ↓
Message: "Si vous n'avez pas de code, un sera généré pour vous"
```

## Composants & Hooks

### Hooks

#### `useReferralCode()`
```typescript
{
  referralCode: string | null,           // Code actuel
  isLoading: boolean,                    // État de chargement
  generateReferralCode(): string,        // Générer un nouveau code
  getOrCreateReferralCode(): string,     // Obtenir ou créer
  setReferralCodeFromLink(code: string)  // Définir depuis URL
}
```

#### `useContacts()`
```typescript
{
  enkambaContacts: Contact[],            // Contacts sur eNkamba
  nonEnkambaContacts: Contact[],         // Contacts à inviter
  hasPermission: boolean,                // Permission accordée
  isLoading: boolean,
  requestContactsPermission(): Promise,  // Demander permission
  sendInvitation(contact, code): Promise // Envoyer SMS
}
```

### Composants

#### `ContactsPermissionDialog`
- Dialog demandant l'accès aux contacts
- Explique les bénéfices
- Boutons "Plus tard" et "Autoriser"

#### `ContactsList`
- Affiche deux onglets: "Sur eNkamba" et "Inviter"
- Liste les contacts avec actions
- Gère l'envoi d'invitations

#### `StartChatEmptyState`
- État vide quand aucune conversation
- Bouton "Commencer maintenant"
- Déclenche le flux d'invitation

## Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR A CRÉE UN COMPTE                             │
│    - Code de parrainage généré: ENK123ABC                   │
│    - Stocké en localStorage                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. UTILISATEUR A ACCÈDE AU CHAT                             │
│    - Aucune conversation existante                          │
│    - Affiche "Commencer la discussion"                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. UTILISATEUR CLIQUE "COMMENCER"                           │
│    - Dialog demande permission contacts                     │
│    - Utilisateur autorise                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTACTS CHARGÉS ET TRIÉS                                │
│    - Onglet 1: 5 contacts sur eNkamba                       │
│    - Onglet 2: 15 contacts à inviter                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. UTILISATEUR CLIQUE "ENVOYER INVITATION"                  │
│    - SMS natif s'ouvre                                      │
│    - Message pré-rempli avec:                               │
│      * Code: ENK123ABC                                      │
│      * Lien: https://enkamba.io/join?ref=ENK123ABC          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CONTACT REÇOIT SMS ET CLIQUE LIEN                        │
│    - Ouvre page login avec ?ref=ENK123ABC                   │
│    - Code détecté et sauvegardé                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CONTACT CRÉE UN COMPTE                                   │
│    - Code de parrainage pré-rempli: ENK123ABC               │
│    - Peut être modifié ou laissé tel quel                   │
│    - Après inscription, les deux sont connectés             │
└─────────────────────────────────────────────────────────────┘
```

## Stockage des Données

### localStorage Keys

```typescript
// Code de parrainage de l'utilisateur
'enkamba_referral_code' = 'ENK123ABC'

// Permission d'accès aux contacts
'enkamba_contacts_permission' = 'true'

// Cache des contacts
'enkamba_contacts_cache' = {
  contacts: Contact[],
  enkambaContacts: Contact[],
  nonEnkambaContacts: Contact[],
  lastUpdated: timestamp
}
```

## Message SMS d'Invitation

```
Rejoins-moi sur eNkamba ! 🚀

Code d'invitation: ENK123ABC

Télécharge l'app et crée ton compte avec ce code pour nous connecter directement.

https://enkamba.io/join?ref=ENK123ABC
```

## Considérations de Sécurité

1. **Codes uniques** - Chaque utilisateur a un code unique
2. **Pas de partage de données** - Les contacts ne sont jamais envoyés au serveur
3. **Permission explicite** - L'utilisateur doit autoriser l'accès aux contacts
4. **Stockage local** - Tout est stocké en localStorage, pas de serveur
5. **SMS natif** - Utilise l'app SMS du téléphone, pas d'API tierce

## Limitations Actuelles

1. **API Contacts** - Nécessite un navigateur supportant l'API Contacts
2. **Fallback** - Sur les navigateurs non-supportés, afficher un message d'erreur
3. **Données simulées** - Les contacts eNkamba sont simulés (à remplacer par Firebase)
4. **SMS natif** - Dépend de l'app SMS du téléphone

## Améliorations Futures

- [ ] Intégration Firebase pour vérifier les vrais utilisateurs eNkamba
- [ ] Historique des invitations envoyées
- [ ] Récompenses pour les parrainages réussis
- [ ] Suivi des conversions (qui a accepté l'invitation)
- [ ] Partage via WhatsApp, Telegram, etc.
- [ ] Génération de codes de parrainage multiples
- [ ] Limite de codes générés par jour
