# Implémentation du Scanner QR Code pour Contacts

## Résumé
Création d'un scanner de QR code intelligent pour ajouter des contacts en scannant leur QR code eNkamba, avec matching automatique dans Firebase.

## Fonctionnalités Implémentées

### 1. Hook useContactQRScanner
**Fichier**: `src/hooks/useContactQRScanner.ts`

#### Capacités de Matching:
Le scanner peut identifier et matcher plusieurs types de QR codes:

1. **QR Code de Contact** (`CONTACT|uid|name|email|phone`)
   - Format généré par l'app dans les paramètres
   - Contient toutes les infos du contact

2. **QR Code de Paiement** (`PAYMENT|accountNumber|name|email|uid`)
   - Format utilisé pour les paiements
   - Extrait les infos pour trouver l'utilisateur

3. **Numéro de Compte eNkamba** (`ENK123456789012`)
   - Cherche directement par accountNumber dans Firebase

4. **Numéro de Carte eNkamba** (`1234 5678 9012 3456`)
   - Cherche directement par cardNumber dans Firebase

#### Stratégie de Matching (dans l'ordre):
1. **Par UID** (si disponible dans le QR code)
2. **Par Email** (normalisation lowercase)
3. **Par Téléphone** (toutes les variantes)
4. **Par Numéro de Compte eNkamba**
5. **Par Numéro de Carte eNkamba**

#### Variantes de Téléphone Testées:
- `+243851723022`
- `243851723022`
- `0851723022`
- `851723022`

#### Champs Firebase Recherchés:
- `phoneNumber`
- `phone`
- `kyc.linkedAccount.phoneNumber`
- `accountNumber`
- `cardNumber`
- `email`

### 2. Composant ContactQRScanner
**Fichier**: `src/components/contacts/ContactQRScanner.tsx`

#### Fonctionnalités:
- **Accès Caméra**: Utilise la caméra arrière (environment)
- **Scan en Temps Réel**: Détection automatique du QR code
- **Overlay Visuel**: Cadre de scan avec coins animés
- **États de Chargement**: Feedback visuel pendant l'initialisation et le scan
- **Gestion d'Erreurs**: Messages clairs si la caméra n'est pas accessible

#### Interface Utilisateur:
1. **Zone de Scan**:
   - Vidéo en direct de la caméra
   - Cadre de scan avec coins blancs
   - Indicateur de chargement

2. **Résultat - Contact Trouvé**:
   - Avatar du contact
   - Nom, email, téléphone
   - Badge "Sur eNkamba"
   - Boutons "Discuter" et "Ajouter"

3. **Résultat - Contact Non Trouvé**:
   - Icône d'utilisateur
   - Message "Contact non trouvé"
   - Bouton "Fermer"

### 3. Intégration dans ContactsList
**Fichier**: `src/components/contacts-list.tsx`

#### Modifications:
- Ajout du bouton "Scanner QR" à côté de "Importer VCF"
- Grid layout 2 colonnes pour les boutons
- Dialog du scanner qui s'ouvre au clic
- Rafraîchissement automatique après ajout

## Flux Utilisateur

### Scénario 1: Scanner un QR Code de Contact
```
1. Utilisateur clique sur "Scanner QR"
2. Dialog s'ouvre avec accès caméra
3. Utilisateur pointe vers le QR code
4. QR code détecté automatiquement
5. Parse: CONTACT|abc123|Jean Dupont|jean@example.com|+243851723022
6. Recherche dans Firebase:
   - Par UID: abc123 → TROUVÉ
7. Affiche le profil du contact
8. Boutons "Discuter" ou "Ajouter"
```

### Scénario 2: Scanner un Numéro de Compte
```
1. Utilisateur scanne: ENK123456789012
2. Parse: Type = ENKAMBA_ACCOUNT
3. Recherche dans Firebase:
   - Par accountNumber: ENK123456789012 → TROUVÉ
4. Affiche le profil du contact
5. Boutons "Discuter" ou "Ajouter"
```

### Scénario 3: Scanner un Numéro de Carte
```
1. Utilisateur scanne: 1234 5678 9012 3456
2. Parse: Type = ENKAMBA_CARD
3. Recherche dans Firebase:
   - Par cardNumber: 1234 5678 9012 3456 → TROUVÉ
4. Affiche le profil du contact
5. Boutons "Discuter" ou "Ajouter"
```

### Scénario 4: QR Code Non Reconnu
```
1. Utilisateur scanne un QR code inconnu
2. Parse: Type = UNKNOWN
3. Affiche: "QR Code non reconnu"
4. Reste sur l'écran de scan
```

## Types de QR Codes Supportés

### 1. QR Code de Contact (Généré par l'App)
```
Format: CONTACT|uid|name|email|phone
Exemple: CONTACT|abc123|Jean Dupont|jean@example.com|+243851723022
```

### 2. QR Code de Paiement
```
Format: PAYMENT|accountNumber|name|email|uid
Exemple: PAYMENT|ENK123456789012|Jean Dupont|jean@example.com|abc123
```

### 3. Numéro de Compte eNkamba
```
Format: ENK + 12 chiffres
Exemple: ENK123456789012
```

### 4. Numéro de Carte eNkamba
```
Format: 4 groupes de 4 chiffres
Exemple: 1234 5678 9012 3456
```

## Algorithme de Matching

```typescript
async function matchContact(qrData: string) {
  // 1. Parser le QR code
  const contactData = parseQRCode(qrData);
  
  // 2. Stratégie de recherche (dans l'ordre)
  if (contactData.uid) {
    // Recherche directe par UID
    const user = await findByUID(contactData.uid);
    if (user) return user;
  }
  
  if (contactData.email) {
    // Recherche par email
    const user = await findByEmail(contactData.email);
    if (user) return user;
  }
  
  if (contactData.phone) {
    // Recherche par téléphone (toutes variantes)
    const variants = getPhoneVariants(contactData.phone);
    for (const variant of variants) {
      const user = await findByPhone(variant);
      if (user) return user;
    }
  }
  
  if (contactData.accountNumber) {
    // Recherche par numéro de compte
    const user = await findByAccountNumber(contactData.accountNumber);
    if (user) return user;
  }
  
  if (contactData.cardNumber) {
    // Recherche par numéro de carte
    const user = await findByCardNumber(contactData.cardNumber);
    if (user) return user;
  }
  
  // Aucun match trouvé
  return null;
}
```

## Sécurité et Permissions

### Permissions Requises:
- **Caméra**: Nécessaire pour scanner les QR codes
- **Firestore**: Lecture de la collection `users` pour le matching

### Gestion des Permissions:
- Demande automatique au premier scan
- Message d'erreur clair si refusé
- Bouton "Réessayer" pour redemander

### Données Sensibles:
- Les QR codes ne contiennent que des infos publiques
- Pas de mots de passe ou tokens
- UID utilisé uniquement pour le matching

## Avantages

### 1. Polyvalence
- Supporte plusieurs types de QR codes
- Pas besoin de QR code spécifique
- Fonctionne avec les QR codes de paiement existants

### 2. Matching Intelligent
- Recherche multi-critères
- Toutes les variantes de numéro testées
- Fallback sur plusieurs champs

### 3. Expérience Utilisateur
- Scan automatique (pas de bouton)
- Feedback visuel immédiat
- Actions claires après le scan

### 4. Fiabilité
- Gestion des erreurs de caméra
- Gestion des QR codes invalides
- Arrêt automatique après détection

## Tests Recommandés

1. Scanner un QR code de contact (paramètres)
2. Scanner un QR code de paiement
3. Scanner un numéro de compte eNkamba
4. Scanner un numéro de carte eNkamba
5. Scanner un QR code invalide
6. Tester sans permission caméra
7. Tester avec caméra occupée
8. Vérifier le bouton "Discuter"
9. Vérifier le bouton "Ajouter"

## Notes Techniques

- Utilise `jsqr` pour la détection de QR codes
- Utilise `getUserMedia` pour l'accès caméra
- Scan à 60 FPS avec `requestAnimationFrame`
- Arrêt automatique après détection
- Nettoyage des ressources à la fermeture
- Compatible mobile et desktop
