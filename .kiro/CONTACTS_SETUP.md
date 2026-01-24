# Configuration des Contacts Réels - eNkamba

## Vue d'ensemble
L'app utilise maintenant **Capacitor Contacts** pour accéder aux vrais contacts du téléphone de l'utilisateur, au lieu de contacts de test.

## Installation
Le plugin `@capacitor-community/contacts` est déjà installé dans le projet.

## Configuration Android

### 1. Permissions dans `android/app/src/main/AndroidManifest.xml`
Ajouter les permissions suivantes:
```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_CONTACTS" />
```

### 2. Permissions Runtime (Android 6+)
Les permissions sont demandées automatiquement par Capacitor lors du premier appel à `Contacts.getContacts()`.

## Configuration iOS

### 1. Permissions dans `ios/App/App/Info.plist`
Ajouter les clés suivantes:
```xml
<key>NSContactsUsageDescription</key>
<string>eNkamba a besoin d'accéder à vos contacts pour vous montrer qui utilise déjà l'app et vous permettre d'inviter vos amis.</string>
```

### 2. Permissions Runtime
Les permissions sont demandées automatiquement par Capacitor lors du premier appel à `Contacts.getContacts()`.

## Utilisation dans l'app

### Hook `useContacts`
Le hook `src/hooks/useContacts.ts` gère:
- Accès aux vrais contacts du téléphone via Capacitor
- Normalisation des numéros de téléphone (conversion en format international)
- Identification des contacts qui utilisent déjà eNkamba
- Cache local des contacts pour performance
- Envoi d'invitations SMS

### Normalisation des numéros
Les numéros sont normalisés automatiquement:
- `0812345678` → `+243812345678` (RDC)
- `812345678` → `+243812345678`
- `+243812345678` → `+243812345678` (déjà normalisé)

### Flux utilisateur
1. Utilisateur clique sur "Commencer" dans le chat
2. Dialog demande la permission d'accéder aux contacts
3. Utilisateur accepte
4. App récupère les vrais contacts du téléphone
5. Contacts sont affichés en deux onglets:
   - **Sur eNkamba**: Contacts qui utilisent déjà l'app
   - **Inviter**: Contacts à inviter

## Données utilisées pour identifier les contacts eNkamba
Actuellement, l'app utilise une liste simulée de 5 utilisateurs eNkamba:
- Jean Dupont (+243812345678)
- Marie Martin (+243987654321)
- Pierre Bernard (+243812111111)
- Alice Moreau (+243899999999)
- Bob Leclerc (+243888888888)

**En production**, cette liste devrait venir de Firebase/Firestore pour avoir les vrais utilisateurs.

## Gestion des erreurs
Si l'accès aux contacts échoue:
- Message d'erreur clair affiché à l'utilisateur
- Suggestion de vérifier les permissions
- Possibilité de réessayer

## Performance
- Les contacts sont mis en cache localement
- Cache invalidé après 24h (peut être configuré)
- Pas de rechargement inutile des contacts

## Sécurité
- Les contacts ne sont jamais envoyés au serveur
- Stockage local uniquement
- Permissions explicites demandées à l'utilisateur
