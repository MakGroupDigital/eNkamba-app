# Amélioration du Système de Matching des Contacts

## Résumé
Amélioration majeure du système de contacts pour matcher automatiquement par email ET numéro de téléphone, avec import automatique de tous les contacts VCF.

## Problèmes Résolus

### 1. Matching Incomplet
**Avant**: Les contacts étaient matchés uniquement par email
**Après**: Matching par email ET numéro de téléphone avec toutes les variantes

### 2. Import VCF Manuel
**Avant**: L'utilisateur devait cliquer sur chaque contact pour l'ajouter
**Après**: Import automatique de tous les contacts dès la sélection du fichier VCF

### 3. Bouton "Inviter" pour Contacts Existants
**Avant**: Même les contacts sur eNkamba affichaient "Inviter"
**Après**: Bouton "Discuter" pour les contacts sur eNkamba, "Inviter" pour les autres

## Fonctionnalités Implémentées

### 1. Hook useContactsImport
**Fichier**: `src/hooks/useContactsImport.ts`

#### Fonctionnalités:
- **Matching Multi-critères**:
  - Par email (prioritaire, plus fiable)
  - Par numéro de téléphone avec toutes les variantes
  
- **Variantes de Numéro**:
  - `+243851723022`
  - `243851723022`
  - `0851723022`
  - `851723022`
  
- **Recherche dans Plusieurs Champs**:
  - `phoneNumber`
  - `phone`
  - `kyc.linkedAccount.phoneNumber`

- **Import Automatique VCF**:
  - Parse le fichier VCF
  - Extrait nom, téléphone, email
  - Cherche chaque contact dans Firebase
  - Ajoute tous les contacts en batch (50 par lot)
  - Retourne statistiques d'import

#### Résultat d'Import:
```typescript
{
  imported: number,    // Nombre total importé
  matched: number,     // Nombre sur eNkamba
  notMatched: number,  // Nombre à inviter
  errors: number       // Nombre d'erreurs
}
```

### 2. Composant VCFImportButton
**Fichier**: `src/components/contacts/VCFImportButton.tsx`

#### Fonctionnalités:
- Bouton simple avec icône Upload
- Sélection de fichier VCF
- Import automatique dès la sélection
- Indicateur de chargement
- Callback après import pour rafraîchir la liste

### 3. Amélioration de ContactsList
**Fichier**: `src/components/contacts-list.tsx`

#### Modifications:
- Ajout du bouton "Importer VCF" en haut
- Bouton "Discuter" pour contacts sur eNkamba
- Bouton "Inviter" pour contacts non sur eNkamba
- Redirection vers chat au clic sur "Discuter"

## Algorithme de Matching

### Étape 1: Recherche par Email
```
1. Normaliser l'email (trim + lowercase)
2. Chercher dans users où email == normalizedEmail
3. Si trouvé → MATCH
```

### Étape 2: Recherche par Téléphone
```
1. Générer toutes les variantes du numéro
2. Pour chaque variante:
   a. Chercher dans users.phoneNumber
   b. Chercher dans users.phone
   c. Chercher dans users.kyc.linkedAccount.phoneNumber
3. Si trouvé → MATCH
```

### Étape 3: Résultat
```
- Si MATCH trouvé:
  - isOnEnkamba = true
  - enkambaUserId = userId trouvé
  - enkambaDisplayName = nom de l'utilisateur
  - referralCode = code de parrainage
  
- Si PAS de MATCH:
  - isOnEnkamba = false
  - Afficher bouton "Inviter"
```

## Format VCF Supporté

```vcard
BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
N:Dupont;Jean;;;
TEL;TYPE=CELL:+243851723022
EMAIL:jean.dupont@example.com
END:VCARD
```

### Champs Extraits:
- **FN** ou **N**: Nom du contact
- **TEL**: Numéro de téléphone (tous types)
- **EMAIL**: Adresse email

## Flux Utilisateur

### Import VCF:
1. Utilisateur clique sur "Importer VCF"
2. Sélectionne un fichier .vcf
3. **Automatiquement**:
   - Parse tous les contacts
   - Cherche chaque contact dans Firebase
   - Ajoute tous les contacts en batch
   - Affiche notification avec statistiques
4. Liste rafraîchie automatiquement

### Interaction avec Contacts:
1. **Onglet "Sur eNkamba"**:
   - Affiche contacts matchés
   - Bouton "Discuter" → Ouvre conversation
   
2. **Onglet "Inviter"**:
   - Affiche contacts non matchés
   - Bouton "Inviter" → Envoie SMS d'invitation

## Avantages

### 1. Matching Plus Précis
- Email + Téléphone = Double vérification
- Toutes les variantes de numéro testées
- Recherche dans plusieurs champs Firebase

### 2. Expérience Utilisateur Améliorée
- Import en un clic (pas besoin de cliquer sur chaque contact)
- Feedback immédiat avec statistiques
- Boutons clairs: "Discuter" vs "Inviter"

### 3. Performance
- Import par batch (50 contacts à la fois)
- Limite Firestore respectée
- Pas de surcharge du serveur

### 4. Fiabilité
- Gestion des erreurs par contact
- Statistiques détaillées
- Normalisation cohérente des numéros

## Cas d'Usage

### Scénario 1: Contact avec Email
```
Contact: Jean (jean@example.com, +243851723022)
Firebase: Utilisateur avec email jean@example.com
Résultat: MATCH par email → Bouton "Discuter"
```

### Scénario 2: Contact avec Téléphone
```
Contact: Marie (0851723022)
Firebase: Utilisateur avec phone +243851723022
Résultat: MATCH par téléphone → Bouton "Discuter"
```

### Scénario 3: Contact Non Inscrit
```
Contact: Pierre (pierre@example.com, 0999999999)
Firebase: Aucun utilisateur trouvé
Résultat: PAS DE MATCH → Bouton "Inviter"
```

### Scénario 4: Import VCF de 100 Contacts
```
1. Sélection du fichier
2. Parse automatique
3. Recherche de chaque contact
4. Import en 2 batchs (50 + 50)
5. Notification: "100 contacts importés, 45 sur eNkamba"
```

## Tests Recommandés

1. Importer un VCF avec contacts variés
2. Vérifier le matching par email
3. Vérifier le matching par téléphone
4. Tester avec différents formats de numéro
5. Vérifier les boutons "Discuter" vs "Inviter"
6. Tester l'ouverture de conversation
7. Tester l'envoi d'invitation

## Notes Techniques

- Utilise Firestore batch writes (limite: 500 opérations)
- Traite par lots de 50 pour rester sous la limite
- Cache les résultats de recherche pour éviter les doublons
- Normalisation cohérente avec le reste de l'app
- Compatible avec tous les formats VCF standards
